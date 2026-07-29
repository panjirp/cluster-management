import { writeFile } from "fs/promises";
import path from "path";
import { getUploadsStore } from "@/lib/blob-store";

// Serverless hosts (e.g. Netlify Functions) ship a read-only filesystem —
// and on top of that, the public/uploads directory itself isn't guaranteed
// to exist in the deployed bundle at all (Netlify's file tracing doesn't
// always carry over empty/asset-only folders), so the failure mode varies
// (EROFS, ENOENT, ...). Rather than special-casing one errno, try the local
// filesystem first (fast path for local dev / traditional servers) and fall
// back to Netlify Blobs on any write failure.
export async function saveUpload(buffer: Buffer, filename: string, contentType: string): Promise<string> {
  try {
    const filepath = path.join(process.cwd(), "public", "uploads", filename);
    await writeFile(filepath, buffer);
    return `/uploads/${filename}`;
  } catch {
    const store = getUploadsStore();
    const arrayBuffer = buffer.buffer.slice(buffer.byteOffset, buffer.byteOffset + buffer.byteLength) as ArrayBuffer;
    await store.set(filename, arrayBuffer, { metadata: { contentType } });
    return `/api/uploads/${filename}`;
  }
}
