import { NextRequest, NextResponse } from "next/server";

const BASE_URL = "https://api.moma.org";

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const endpoint = searchParams.get("endpoint") || "/api/objects/random";
  const token = process.env.NEXT_PUBLIC_MOMA_API_TOKEN;

  if (!token) {
    return NextResponse.json({ error: "No API token configured" }, { status: 500 });
  }

  const url = new URL(endpoint, BASE_URL);
  url.searchParams.set("token", token);

  // Forward other params
  for (const [key, value] of searchParams.entries()) {
    if (key !== "endpoint") {
      url.searchParams.set(key, value);
    }
  }

  try {
    const response = await fetch(url.toString(), {
      signal: AbortSignal.timeout(10000),
    });
    const data = await response.json();
    return NextResponse.json(data);
  } catch {
    return NextResponse.json({ error: "MoMA API request failed" }, { status: 502 });
  }
}
