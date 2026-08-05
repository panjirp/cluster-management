import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireUser, UnauthorizedError } from "@/lib/session";
import { writeFile, mkdir } from "fs/promises";
import path from "path";

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5 MB
const UPLOAD_DIR = path.join(process.cwd(), "public", "uploads", "proofs");

export async function POST(req: NextRequest) {
  try {
    await requireUser();

    const id = req.nextUrl.searchParams.get("id");
    if (!id) return NextResponse.json({ error: "Missing due id." }, { status: 400 });

    // Ensure upload directory exists
    await mkdir(UPLOAD_DIR, { recursive: true });

    // Verify the MonthlyDue record exists
    const due = await prisma.monthlyDue.findUnique({ where: { id } });
    if (!due) return NextResponse.json({ error: "Due record not found" }, { status: 404 });

    // Parse multipart form data
    const formData = await req.formData();
    const file = formData.get("file");

    if (!file || !(file instanceof File)) {
      return NextResponse.json({ error: "No file provided. Use form field 'file'." }, { status: 400 });
    }

    // Validate file size
    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json({ error: "File too large. Maximum 5 MB." }, { status: 400 });
    }

    // Validate file type
    const isImage = file.type.startsWith("image/");
    const isPdf = file.type === "application/pdf";
    if (!isImage && !isPdf) {
      return NextResponse.json({ error: "Invalid file type. Only images and PDFs are allowed." }, { status: 400 });
    }

    // Build filename and save
    const ext = file.name.split(".").pop()?.toLowerCase() ?? (isPdf ? "pdf" : "jpg");
    const timestamp = Date.now();
    const filename = `proof-${id}-${timestamp}.${ext}`;
    const filePath = path.join(UPLOAD_DIR, filename);

    const bytes = await file.arrayBuffer();
    await writeFile(filePath, Buffer.from(bytes));

    // Update MonthlyDue record
    const paymentProofUrl = `/uploads/proofs/${filename}`;
    await prisma.monthlyDue.update({
      where: { id },
      data: { paymentProofUrl },
    });

    return NextResponse.json({ paymentProofUrl }, { status: 200 });
  } catch (error) {
    if (error instanceof UnauthorizedError) return NextResponse.json({ error: error.message }, { status: 401 });
    throw error;
  }
}
