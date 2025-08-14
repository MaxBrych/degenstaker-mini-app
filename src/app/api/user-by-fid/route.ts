import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const fid = searchParams.get("fid");
  const apiKey = process.env.NEYNAR_API_KEY;

  if (!fid) {
    return NextResponse.json({ error: "Missing 'fid' query param" }, { status: 400 });
  }
  if (!apiKey) {
    return NextResponse.json({ error: "NEYNAR_API_KEY is not configured" }, { status: 500 });
  }

  try {
    const url = `https://api.neynar.com/v2/farcaster/user?fid=${encodeURIComponent(fid)}`;
    const res = await fetch(url, {
      headers: { accept: "application/json", "x-api-key": apiKey },
      cache: "no-store",
    });
    if (!res.ok) {
      const text = await res.text();
      return NextResponse.json({ error: `Neynar API error: ${res.status} ${text}` }, { status: res.status });
    }
    const json = await res.json();
    return NextResponse.json(json, { status: 200 });
  } catch (e: any) {
    return NextResponse.json({ error: String(e?.message || e) }, { status: 500 });
  }
}
