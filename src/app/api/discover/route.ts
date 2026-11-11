import { NextRequest, NextResponse } from "next/server";
import { getClientToken, getPopularTracks, getRandomArtists } from "@/lib/spotify";

export async function GET(req: NextRequest) {
  const type = req.nextUrl.searchParams.get("type");
  const token = await getClientToken();

  if (type === "artists") {
    const artists = await getRandomArtists(token);
    return NextResponse.json(artists);
  }

  const tracks = await getPopularTracks(token);
  return NextResponse.json(tracks);
}
