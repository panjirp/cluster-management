import { NextRequest, NextResponse } from "next/server";
import { writeFile } from "fs/promises";
import path from "path";
import { randomUUID } from "crypto";
import { getStore } from "@netlify/blobs";
import { requireUser, UnauthorizedError } from "@/lib/session";

const ALLOWED_TYPES = new Set(["image/jpeg", "image/png", "image/webp"]);
const MAX_SIZE = 5 * 1024 * 1024;

const EXT_BY_TYPE: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
};

// On Netlify, the deployed function's filesystem is read-only, so uploaded
// files can't be written to disk — they're stored in Netlify Blobs instead
// and served back through /api/uploads/[filename]. Locally (and on any
// traditional server with a writable filesystem), files still go straight
// to public/uploads for simplicity.
const useBlobStore = !!process.env.NETLIFY;

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

    if (useBlobStore) {
      const store = getStore("uploads");
      const arrayBuffer = buffer.buffer.slice(buffer.byteOffset, buffer.byteOffset + buffer.byteLength);
      await store.set(filename, arrayBuffer, { metadata: { contentType: file.type } });
      return NextResponse.json({ url: `/api/uploads/${filename}` }, { status: 201 });
    }

    const filepath = path.join(process.cwd(), "public", "uploads", filename);
    await writeFile(filepath, buffer);
    return NextResponse.json({ url: `/uploads/${filename}` }, { status: 201 });
  } catch (error) {
    if (error instanceof UnauthorizedError) return NextResponse.json({ error: error.message }, { status: 401 });
    throw error;
  }
}
