import { NextRequest, NextResponse } from "next/server";
import { getClientToken, getRecommendations } from "@/lib/spotify";

export async function GET(req: NextRequest) {
  const seedTracks = req.nextUrl.searchParams.get("seedTracks")?.split(",") ?? [];
  const seedArtists = req.nextUrl.searchParams.get("seedArtists")?.split(",") ?? [];

  if (!seedTracks.length && !seedArtists.length) {
    return NextResponse.json([]);
  }

  const token = await getClientToken();
  const tracks = await getRecommendations(seedTracks, seedArtists, token, 10);
  return NextResponse.json(tracks);
}
