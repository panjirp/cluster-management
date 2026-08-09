import { writeFile, mkdir } from "fs/promises";
import * as path from "path";
import { getUploadsStore } from "@/lib/blob-store";

// Serverless hosts (e.g. Netlify Functions) ship a read-only filesystem —
// and on top of that, the public/uploads directory itself isn't guaranteed
// to exist in the deployed bundle at all (Netlify's file tracing doesn't
// always carry over empty/asset-only folders), so the failure mode varies
// (EROFS, ENOENT, ...). Rather than special-casing one errno, try the local
// filesystem first (fast path for local dev / traditional servers) and fall
// back to Netlify Blobs on any write failure.
//
// IMPORTANT: selalu kembalikan `/api/uploads/<filename>` (bukan `/uploads/...`)
// karena `next start` hanya men-serve folder public yang eksis saat build —
// file upload yang lahir setelah build tidak bisa diakses lewat static serving.
// Route handler `/api/uploads/[filename]` membaca file dari disk tiap request.
export async function saveUpload(buffer: Buffer, filename: string, contentType: string): Promise<string> {
  try {
    const uploadsDir = path.join(process.cwd(), "public", "uploads");
    await mkdir(uploadsDir, { recursive: true });
    await writeFile(path.join(uploadsDir, filename), buffer);
    return `/api/uploads/${filename}`;
  } catch {
    const store = getUploadsStore();
    const arrayBuffer = buffer.buffer.slice(buffer.byteOffset, buffer.byteOffset + buffer.byteLength) as ArrayBuffer;
    await store.set(filename, arrayBuffer, { metadata: { contentType } });
    return `/api/uploads/${filename}`;
  }
}
