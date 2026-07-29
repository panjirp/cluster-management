import { NextRequest, NextResponse } from "next/server";
import { getUploadsStore } from "@/lib/blob-store";

export async function GET(req: NextRequest, { params }: { params: Promise<{ filename: string }> }) {
  try {
    const { filename } = await params;
    const store = getUploadsStore();

    const result = await store.getWithMetadata(filename, { type: "arrayBuffer" });

    if (!result) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    const contentType = (result.metadata?.contentType as string | undefined) ?? "application/octet-stream";

    return new NextResponse(result.data, {
      headers: {
        "Content-Type": contentType,
        "Cache-Control": "public, max-age=31536000, immutable",
      },
    });
  } catch (error) {
    console.error("Failed to serve upload:", error);
    return NextResponse.json({ error: "Gagal memuat file." }, { status: 500 });
  }
}
