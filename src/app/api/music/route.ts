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
import { isInstrumentalTrack } from "@/lib/utils";
import type { SpotifyTrack } from "@/types/music";

/**
 * Enriches track with accurate isInstrumental detection based on
 * title keywords, album metadata, and cached LRC properties.
 */
function enrichTrack(track: SpotifyTrack): SpotifyTrack {
  const isInstrumental = Boolean(
    track.isInstrumental || isInstrumentalTrack(track.name, track.album?.name)
  );
  return {
    ...track,
    isInstrumental,
  };
}

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl;
  const action = searchParams.get("action") || "discover-tracks";

  try {
    switch (action) {
      case "discover-tracks": {
        const rawTracks = await fetchDiscoverTracks();
        const enriched = rawTracks.map(enrichTrack);
        // Anti-instrumental filter: Keep regular songs with vocals for discovery
        const vocalOnly = enriched.filter((t) => !t.isInstrumental);
        return NextResponse.json(vocalOnly.length >= 6 ? vocalOnly : enriched);
      }

      case "discover-artists": {
        const artists = await fetchDiscoverArtists();
        return NextResponse.json(artists);
      }

      case "recommendations": {
        const seedTrack = searchParams.get("seedTrack") || undefined;
        const seedArtist = searchParams.get("seedArtist") || undefined;
        const rawTracks = await fetchRecommendations(seedTrack, seedArtist);
        const enriched = rawTracks.map(enrichTrack);

        // Anti-instrumental filter unless user explicitly seeded with an instrumental track
        const userWantedInstrumental = seedTrack ? isInstrumentalTrack(seedTrack) : false;
        if (!userWantedInstrumental) {
          const vocalOnly = enriched.filter((t) => !t.isInstrumental);
          return NextResponse.json(vocalOnly.length >= 4 ? vocalOnly : enriched);
        }
        return NextResponse.json(enriched);
      }

      case "search": {
        const q = searchParams.get("q") || "";
        const results = await fetchUnifiedSearch(q);
        const userQueriedInstrumental = isInstrumentalTrack(q);

        const enrichedTracks = results.tracks.map(enrichTrack);
        // If user didn't specifically search for instrumental/karaoke, prioritize vocal songs
        let sortedTracks = enrichedTracks;
        if (!userQueriedInstrumental) {
          sortedTracks = [
            ...enrichedTracks.filter((t) => !t.isInstrumental),
            ...enrichedTracks.filter((t) => t.isInstrumental),
          ];
        }

        return NextResponse.json({
          ...results,
          tracks: sortedTracks,
        });
      }

      case "artist": {
        const id = searchParams.get("id") || "";
        const details = await fetchArtistDetails(id);
        if (details && details.topTracks) {
          details.topTracks = details.topTracks.map(enrichTrack);
        }
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
        const enrichedQueue = queue.map(enrichTrack);
        return NextResponse.json(enrichedQueue);
      }

      default:
        return NextResponse.json({ error: "Unknown action" }, { status: 400 });
    }
  } catch (err) {
    console.error("Music API Error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
