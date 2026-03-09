import { type NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  const url = request.nextUrl.searchParams.get("url");
  const filename = request.nextUrl.searchParams.get("filename") ?? "file";

  if (!url) {
    return NextResponse.json({ error: "Missing url param" }, { status: 400 });
  }

  // Seules les URLs Notion sont autorisées
  const parsed = new URL(url);
  if (
    !parsed.hostname.endsWith(".notion.so") &&
    parsed.hostname !== "notion.so"
  ) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  const upstream = await fetch(url);

  if (!upstream.ok || !upstream.body) {
    return NextResponse.json({ error: "Fetch failed" }, { status: 502 });
  }

  const contentType =
    upstream.headers.get("content-type") ?? "application/octet-stream";

  return new NextResponse(upstream.body, {
    headers: {
      "Content-Type": contentType,
      "Content-Disposition": `attachment; filename="${encodeURIComponent(filename)}"`,
      "Cache-Control": "private, no-store",
    },
  });
}
