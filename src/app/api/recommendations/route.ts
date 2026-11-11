import { NextRequest, NextResponse } from "next/server";
import { fetchRecommendations } from "@/lib/music-service";

export async function GET(req: NextRequest) {
  const seedTrack = req.nextUrl.searchParams.get("seedTracks")?.split(",")[0] || undefined;
  const seedArtist = req.nextUrl.searchParams.get("seedArtists")?.split(",")[0] || undefined;
  const tracks = await fetchRecommendations(seedTrack, seedArtist);
  return NextResponse.json(tracks);
}
