import { NextRequest, NextResponse } from "next/server";
import {
  fetchDiscoverTracks,
  fetchDiscoverArtists,
  fetchRecommendations,
  fetchUnifiedSearch,
  fetchArtistDetails,
  resolveRealArtistPicture,
  fetchSmartRadioQueue,
} from "@/lib/music-service";

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl;
  const action = searchParams.get("action") || "discover-tracks";

  try {
    switch (action) {
      case "discover-tracks": {
        const tracks = await fetchDiscoverTracks();
        return NextResponse.json(tracks);
      }
      case "discover-artists": {
        const artists = await fetchDiscoverArtists();
        return NextResponse.json(artists);
      }
      case "recommendations": {
        const seedTrack = searchParams.get("seedTrack") || undefined;
        const seedArtist = searchParams.get("seedArtist") || undefined;
        const tracks = await fetchRecommendations(seedTrack, seedArtist);
        return NextResponse.json(tracks);
      }
      case "search": {
        const q = searchParams.get("q") || "";
        const results = await fetchUnifiedSearch(q);
        return NextResponse.json(results);
      }
      case "artist": {
        const id = searchParams.get("id") || "";
        const details = await fetchArtistDetails(id);
        return NextResponse.json(details);
      }
      case "artist-picture": {
        const name = searchParams.get("name") || "";
        if (!name.trim()) {
          return NextResponse.json({ error: "Artist name is required" }, { status: 400 });
        }
        const pictureUrl = await resolveRealArtistPicture(name);
        return NextResponse.json({ name, pictureUrl });
      }
      case "radio":
      case "smart-queue": {
        const artist = searchParams.get("artist") || searchParams.get("seedArtist") || "";
        const track = searchParams.get("track") || searchParams.get("title") || "";
        const trackId = searchParams.get("trackId") || "";
        const queue = await fetchSmartRadioQueue(artist, track, trackId);
        return NextResponse.json(queue);
      }
      default:
        return NextResponse.json({ error: "Unknown action" }, { status: 400 });
    }
  } catch (err) {
    console.error("Music API Error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

