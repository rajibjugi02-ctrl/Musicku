import { NextRequest, NextResponse } from "next/server";
import { getLyrics } from "@/lib/lrclib";

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl;
  const trackName = searchParams.get("track") ?? "";
  const artistName = searchParams.get("artist") ?? "";
  const albumName = searchParams.get("album") ?? "";
  const duration = Number(searchParams.get("duration") ?? "0") / 1000; // ms → seconds

  const lines = await getLyrics(trackName, artistName, albumName, duration);
  return NextResponse.json(lines ?? []);
}
