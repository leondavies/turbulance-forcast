import { NextRequest, NextResponse } from "next/server";

const API_KEY = process.env.LOGOSTREAM_API_KEY;
const BASE_URL = "https://airlines-api.logostream.dev/airlines";

const ALLOWED_VARIANTS = new Set([
  "logo",
  "logo-transparent",
  "logo-bg-white",
  "logo-white",
  "icon-transparent",
  "tail",
  "tail-3D",
]);

export async function GET(request: NextRequest) {
  if (!API_KEY) {
    return NextResponse.json(
      { success: false, error: "LOGOSTREAM_API_KEY is not configured" },
      { status: 501 }
    );
  }

  const searchParams = request.nextUrl.searchParams;
  const icao = searchParams.get("icao")?.toUpperCase() || "";
  const iata = searchParams.get("iata")?.toUpperCase() || "";
  const variant = searchParams.get("variant") || "logo";

  if (!ALLOWED_VARIANTS.has(variant)) {
    return NextResponse.json(
      { success: false, error: "Invalid variant" },
      { status: 400 }
    );
  }

  const code = icao || iata;
  if (!code) {
    return NextResponse.json(
      { success: false, error: "icao or iata is required" },
      { status: 400 }
    );
  }

  const type = icao ? "icao" : "iata";

  const url = new URL(`${BASE_URL}/${type}/${encodeURIComponent(code)}`);
  url.searchParams.set("key", API_KEY);
  url.searchParams.set("variant", variant);

  const upstream = await fetch(url.toString(), {
    // Long cache: airline logos rarely change.
    next: { revalidate: 60 * 60 * 24 * 30 }, // 30 days
  });

  if (!upstream.ok) {
    return NextResponse.json(
      { success: false, error: "Logo not found" },
      { status: upstream.status === 404 ? 404 : 502 }
    );
  }

  const contentType = upstream.headers.get("content-type") || "image/png";
  const bytes = await upstream.arrayBuffer();

  return new NextResponse(bytes, {
    status: 200,
    headers: {
      "Content-Type": contentType,
      // Cache at the edge/CDN and in the browser.
      "Cache-Control": "public, max-age=86400, s-maxage=2592000, stale-while-revalidate=86400",
    },
  });
}


