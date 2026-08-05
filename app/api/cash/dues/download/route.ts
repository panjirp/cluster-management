import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireUser, UnauthorizedError } from "@/lib/session";
import { readFile } from "fs/promises";
import path from "path";

export async function GET(req: NextRequest) {
  try {
    await requireUser();

    const id = req.nextUrl.searchParams.get("id");
    if (!id) return NextResponse.json({ error: "Missing due id." }, { status: 400 });

    const due = await prisma.monthlyDue.findUnique({ where: { id } });
    if (!due || !due.paymentProofUrl) {
      return NextResponse.json({ error: "Proof not found" }, { status: 404 });
    }

    const relativePath = due.paymentProofUrl.replace(/^\//, "");
    const filePath = path.join(process.cwd(), "public", relativePath);

    const filename = path.basename(filePath);
    const monthNames = ["Jan","Feb","Mar","Apr","Mei","Jun","Jul","Agu","Sep","Okt","Nov","Des"];
    const friendlyName = `Bukti-Pembayaran-${monthNames[due.month - 1]}-${due.year}.${filename.split(".").pop()}`;

    let fileBuffer: Buffer;
    try {
      fileBuffer = await readFile(filePath);
    } catch {
      return NextResponse.json({ error: "File not found on disk" }, { status: 404 });
    }

    const headers = new Headers();
    headers.set("Content-Type", "application/octet-stream");
    headers.set("Content-Disposition", `attachment; filename="${friendlyName}"`);
    return new NextResponse(fileBuffer as unknown as BodyInit, { headers });
  } catch (error) {
    if (error instanceof UnauthorizedError) return NextResponse.json({ error: error.message }, { status: 401 });
    throw error;
  }
}
