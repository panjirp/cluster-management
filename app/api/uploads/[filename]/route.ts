import { NextRequest, NextResponse } from "next/server";
import { getStore } from "@netlify/blobs";

export async function GET(req: NextRequest, { params }: { params: Promise<{ filename: string }> }) {
  const { filename } = await params;
  const store = getStore("uploads");

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
}
