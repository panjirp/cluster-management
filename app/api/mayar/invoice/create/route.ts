import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireUser, UnauthorizedError } from "@/lib/session";

/**
 * POST /api/mayar/invoice/create
 *
 * Creates a Mayar invoice for a MonthlyDue belonging to the current user.
 * Body: { monthlyDueId: string }
 *
 * Response: { ok, invoiceId, paymentUrl, qrUrl, status }
 */
export async function POST(req: NextRequest) {
  try {
    const session = await requireUser();

    const body = await req.json().catch(() => ({}));
    const { monthlyDueId } = body as { monthlyDueId?: string };

    if (!monthlyDueId) {
      return NextResponse.json({ error: "monthlyDueId wajib diisi." }, { status: 400 });
    }

    // Fetch the MonthlyDue with house info
    const due = await prisma.monthlyDue.findUnique({
      where: { id: monthlyDueId },
      include: {
        house: {
          select: { id: true, blockNumber: true },
        },
      },
    });

    if (!due) {
      return NextResponse.json({ error: "Data iuran tidak ditemukan." }, { status: 404 });
    }

    // WARGA can only create invoices for their own house
    if (session.user.houseId && session.user.houseId !== due.houseId) {
      return NextResponse.json(
        { error: "Anda hanya dapat membuat invoice untuk rumah Anda sendiri." },
        { status: 403 }
      );
    }

    if (due.isPaid) {
      return NextResponse.json(
        { error: "Iuran ini sudah lunas." },
        { status: 400 }
      );
    }

    // Check if there's already an active Mayar invoice for this due
    if (due.mayarInvoiceId) {
      // Return existing invoice
      try {
        const { getInvoice } = await import("@/lib/mayar");
        const existing = await getInvoice(due.mayarInvoiceId);
        return NextResponse.json({
          ok: true,
          invoiceId: due.mayarInvoiceId,
          paymentUrl: existing.linkPayment || existing.paymentUrl || "",
          qrUrl: existing.qrCodeUrl || existing.qrisUrl || "",
          status: existing.status,
          existing: true,
        });
      } catch {
        // If fetching existing fails, fall through to create new
      }
    }

    // Dynamically import the Mayar helper
    let createInvoice: (params: Record<string, unknown>) => Promise<{
      ok: boolean;
      invoiceId: string;
      paymentUrl: string;
      qrUrl: string;
      status: string;
    }>;

    try {
      const mayar = await import("@/lib/mayar");
      createInvoice = mayar.createInvoice as (p: Record<string, unknown>) => Promise<{
        ok: boolean;
        invoiceId: string;
        paymentUrl: string;
        qrUrl: string;
        status: string;
      }>;
    } catch (err) {
      console.error("Mayar module import failed:", err);
      return NextResponse.json(
        { error: "Modul Mayar tidak tersedia. Pastikan MAYAR_API_KEY sudah di-set." },
        { status: 500 }
      );
    }

    // Create the Mayar invoice
    const result = await createInvoice({
      monthlyDueId: due.id,
      blockNumber: due.house.blockNumber,
      month: due.month,
      year: due.year,
      amount: due.amount,
      customerEmail: (session.user as { email?: string }).email,
      customerName: (session.user as { name?: string }).name,
    });

    if (!result.ok) {
      return NextResponse.json(
        { error: "Gagal membuat invoice di Mayar." },
        { status: 502 }
      );
    }

    // Persist the Mayar invoice id
    await prisma.monthlyDue.update({
      where: { id: due.id },
      data: { mayarInvoiceId: result.invoiceId },
    });

    return NextResponse.json(result, { status: 201 });
  } catch (error) {
    if (error instanceof UnauthorizedError) {
      return NextResponse.json({ error: error.message }, { status: 401 });
    }
    console.error("Mayar invoice creation failed:", error);
    return NextResponse.json(
      { error: "Gagal membuat invoice. Coba lagi." },
      { status: 500 }
    );
  }
}
