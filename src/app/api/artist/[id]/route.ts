import { NextRequest, NextResponse } from "next/server";
import { fetchArtistDetails } from "@/lib/music-service";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const data = await fetchArtistDetails(id);
  return NextResponse.json(data);
}
