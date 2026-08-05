import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import crypto from "crypto";

/**
 * POST /api/mayar/webhook
 *
 * Receives payment status callbacks from Mayar.
 * Verifies the x-mayar-signature header, then reconciles the MonthlyDue.
 *
 * Mayar sends: { id, status, metadata: { monthlyDueId, ... }, ... }
 */
export async function POST(req: NextRequest) {
  try {
    const apiKey = process.env.MAYAR_API_KEY;
    if (!apiKey) {
      console.error("MAYAR_API_KEY not configured — cannot verify webhook signature");
      return NextResponse.json({ error: "Server misconfigured" }, { status: 500 });
    }

    // Read raw body for signature verification
    const rawBody = await req.text();
    const signature = req.headers.get("x-mayar-signature") || "";

    // Verify HMAC-SHA256 signature
    const expectedSig = crypto
      .createHmac("sha256", apiKey)
      .update(rawBody)
      .digest("hex");

    if (signature !== expectedSig) {
      console.warn("Invalid Mayar webhook signature");
      return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
    }

    let payload: Record<string, unknown>;
    try {
      payload = JSON.parse(rawBody) as Record<string, unknown>;
    } catch {
      return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
    }

    const invoiceId = String(payload.id || "");
    const status = String(payload.status || "");
    const metadata = (payload.metadata || {}) as Record<string, unknown>;
    const monthlyDueId = String(metadata.monthlyDueId || "");

    if (!invoiceId || !monthlyDueId) {
      console.warn("Webhook missing invoiceId or monthlyDueId:", { invoiceId, monthlyDueId });
      return NextResponse.json({ error: "Missing invoiceId or monthlyDueId" }, { status: 400 });
    }

    // Paid statuses that should mark the iuran as lunas
    const paidStatuses = ["paid", "completed", "success", "settled", "PAID", "COMPLETED", "SUCCESS"];

    if (paidStatuses.includes(status)) {
      // Find the MonthlyDue
      const due = await prisma.monthlyDue.findUnique({
        where: { id: monthlyDueId },
        include: { house: { select: { blockNumber: true } } },
      });

      if (!due) {
        console.warn(`MonthlyDue not found: ${monthlyDueId}`);
        return NextResponse.json({ error: "MonthlyDue not found" }, { status: 404 });
      }

      // Create a PaymentProof record from the webhook
      await prisma.paymentProof.create({
        data: {
          monthlyDueId: due.id,
          submittedById: due.houseId, // will be resolved to a user later if needed
          fileName: `Mayar Invoice ${invoiceId}`,
          filePath: `mayar:${invoiceId}`,
          fileSize: 0,
          mimeType: "application/json",
          status: "APPROVED",
          reviewedById: null,
          reviewedAt: new Date(),
        },
      });

      // Mark the iuran as paid
      await prisma.monthlyDue.update({
        where: { id: monthlyDueId },
        data: {
          isPaid: true,
          paidAt: new Date(),
          paymentProofUrl: `mayar:${invoiceId}`,
        },
      });

      console.log(`✅ Mayar payment confirmed: MonthlyDue ${monthlyDueId} (${due.house?.blockNumber}) marked paid via invoice ${invoiceId}`);
    } else {
      console.log(`ℹ️ Mayar invoice ${invoiceId} status: ${status} (not paid, no action)`);
    }

    return NextResponse.json({ ok: true, received: true });
  } catch (error) {
    console.error("Mayar webhook error:", error);
    return NextResponse.json({ error: "Webhook processing failed" }, { status: 500 });
  }
}
