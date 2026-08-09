import { NextRequest, NextResponse } from "next/server";
import { randomUUID } from "crypto";
import { saveUpload } from "@/lib/save-upload";
import { requireUser, UnauthorizedError } from "@/lib/session";

const ALLOWED_TYPES = new Set(["image/jpeg", "image/png", "image/webp", "application/pdf"]);
const MAX_SIZE = 5 * 1024 * 1024;

const EXT_BY_TYPE: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "application/pdf": "pdf",
};

export async function POST(req: NextRequest) {
  try {
    await requireUser();

    const formData = await req.formData();
    const file = formData.get("file");

    if (!(file instanceof File)) {
      return NextResponse.json({ error: "File tidak ditemukan" }, { status: 400 });
    }
    if (!ALLOWED_TYPES.has(file.type)) {
      return NextResponse.json({ error: "Format file harus JPG, PNG, atau WEBP" }, { status: 400 });
    }
    if (file.size > MAX_SIZE) {
      return NextResponse.json({ error: "Ukuran file maksimal 5MB" }, { status: 400 });
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const filename = `${randomUUID()}.${EXT_BY_TYPE[file.type]}`;

    const url = await saveUpload(buffer, filename, file.type);
    return NextResponse.json({ url }, { status: 201 });
  } catch (error) {
    if (error instanceof UnauthorizedError) return NextResponse.json({ error: error.message }, { status: 401 });
    console.error("Upload failed:", error);
    return NextResponse.json({ error: "Gagal mengunggah file. Coba lagi." }, { status: 500 });
  }
}
