import { NextRequest, NextResponse } from "next/server";
import { readFile } from "fs/promises";
import * as path from "path";
import { getUploadsStore } from "@/lib/blob-store";

const SAFE_SEGMENT = /^[a-zA-Z0-9._-]+$/;

const CONTENT_TYPE_BY_EXT: Record<string, string> = {
  jpg: "image/jpeg",
  jpeg: "image/jpeg",
  png: "image/png",
  webp: "image/webp",
  gif: "image/gif",
  pdf: "application/pdf",
};

export async function GET(req: NextRequest, { params }: { params: Promise<{ path: string[] }> }) {
  try {
    const { path: segments } = await params;
    if (!segments.length) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    // Guard: semua segment harus aman (cegah path traversal)
    if (!segments.every((s) => SAFE_SEGMENT.test(s))) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    const filename = segments[segments.length - 1];
    const filepath = path.join(process.cwd(), "public", "uploads", ...segments);

    // 1) Fast path: file tersimpan di public/uploads (lokasi utama di VPS/dev)
    try {
      const buffer = await readFile(filepath);
      const ext = filename.split(".").pop()?.toLowerCase() ?? "";
      const contentType = CONTENT_TYPE_BY_EXT[ext] ?? "application/octet-stream";
      return new NextResponse(buffer, {
        headers: {
          "Content-Type": contentType,
          "Cache-Control": "public, max-age=31536000, immutable",
        },
      });
    } catch {
      // file tidak ada di filesystem — lanjut ke blob store
    }

    // 2) Fallback: Netlify Blobs (serverless) — hanya jika env blob dikonfigurasi
    const siteID = process.env.NETLIFY_SITE_ID;
    const token = process.env.NETLIFY_BLOBS_TOKEN;
    if (siteID && token) {
      const store = getUploadsStore();
      const result = await store.getWithMetadata(filename, { type: "arrayBuffer" });

      if (result) {
        const contentType = (result.metadata?.contentType as string | undefined) ?? "application/octet-stream";

        return new NextResponse(result.data, {
          headers: {
            "Content-Type": contentType,
            "Cache-Control": "public, max-age=31536000, immutable",
          },
        });
      }
    }

    return NextResponse.json({ error: "Not found" }, { status: 404 });
  } catch (error) {
    console.error("Failed to serve upload:", error);
    return NextResponse.json({ error: "Gagal memuat file." }, { status: 500 });
  }
}
