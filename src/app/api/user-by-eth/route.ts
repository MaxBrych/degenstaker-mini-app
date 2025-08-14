import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const address = searchParams.get("address");
  const apiKey = process.env.NEYNAR_API_KEY;

  if (!address) {
    return NextResponse.json({ error: "Missing 'address' query param" }, { status: 400 });
  }
  if (!apiKey) {
    return NextResponse.json({ error: "NEYNAR_API_KEY is not configured" }, { status: 500 });
  }

  try {
    // Docs: https://docs.neynar.com/docs/fetching-farcaster-user-based-on-ethereum-address
    const url = `https://api.neynar.com/v2/farcaster/user/by-ethereum-address?address=${encodeURIComponent(
      address
    )}`;
    const res = await fetch(url, {
      headers: {
        "accept": "application/json",
        "x-api-key": apiKey,
      },
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
