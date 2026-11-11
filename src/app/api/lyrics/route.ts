import { NextRequest, NextResponse } from "next/server";
import { fetchLyricsFromLRCLIB } from "@/lib/lrclib";

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl;
  const trackName = searchParams.get("track") || searchParams.get("title") || "";
  const artistName = searchParams.get("artist") || "";
  const durationParam = searchParams.get("duration") || "0";

  // Accept duration either in ms or in seconds
  let durationSec = Number(durationParam);
  if (durationSec > 1000) {
    durationSec = Math.round(durationSec / 1000);
  }

  if (!trackName) {
    return NextResponse.json({ error: "Track title is required" }, { status: 400 });
  }

  const lines = await fetchLyricsFromLRCLIB(trackName, artistName, durationSec);

  return NextResponse.json({
    success: true,
    lines: lines || [],
  });
}
