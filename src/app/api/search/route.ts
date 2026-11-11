import { NextRequest, NextResponse } from "next/server";
import { getClientToken, searchTracks, searchArtists } from "@/lib/spotify";

export async function GET(req: NextRequest) {
  const q = req.nextUrl.searchParams.get("q");
  if (!q) return NextResponse.json({ tracks: [], artists: [] });

  const token = await getClientToken();
  const [tracks, artists] = await Promise.all([
    searchTracks(q, token, 15),
    searchArtists(q, token, 5),
  ]);

  return NextResponse.json({ tracks, artists });
}
