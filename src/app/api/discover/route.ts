import { NextRequest, NextResponse } from "next/server";
import { fetchDiscoverTracks, fetchDiscoverArtists } from "@/lib/music-service";

export async function GET(req: NextRequest) {
  const type = req.nextUrl.searchParams.get("type");
  if (type === "artists") {
    const artists = await fetchDiscoverArtists();
    return NextResponse.json(artists);
  }
  const tracks = await fetchDiscoverTracks();
  return NextResponse.json(tracks);
}
