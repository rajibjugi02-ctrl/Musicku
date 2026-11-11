import { NextRequest, NextResponse } from "next/server";
import { getClientToken, getArtist, getArtistTopTracks, getArtistAlbums } from "@/lib/spotify";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const token = await getClientToken();

  const [artist, topTracks, albums] = await Promise.all([
    getArtist(id, token),
    getArtistTopTracks(id, token),
    getArtistAlbums(id, token),
  ]);

  return NextResponse.json({ artist, topTracks, albums });
}
