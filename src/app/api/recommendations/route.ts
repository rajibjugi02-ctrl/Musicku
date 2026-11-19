import { NextRequest, NextResponse } from "next/server";
import { fetchRecommendations, fetchUnifiedSearch, fetchDiscoverTracks } from "@/lib/music-service";
import { resolveArtwork } from "@/store/useReplayStore";
import { isInstrumentalTrack } from "@/lib/utils";
import type { SpotifyTrack } from "@/types/music";

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl;
  const artistsParam = searchParams.get("artists") || searchParams.get("seedArtists") || "";
  const seedTrack = searchParams.get("seedTracks")?.split(",")[0] || searchParams.get("seedTrack") || undefined;
  const limit = Math.min(30, Math.max(5, parseInt(searchParams.get("limit") || "16", 10)));

  const artistList = artistsParam
    .split(",")
    .map((a) => a.trim())
    .filter((a) => a.length > 0 && a !== "pop");

  try {
    let pool: SpotifyTrack[] = [];

    // 1. If user has top or liked artists, query relevant recommendations per artist
    if (artistList.length > 0) {
      const topPicks = artistList.slice(0, 4);
      const artistPromises = topPicks.map(async (artist) => {
        try {
          const searchResult = await fetchUnifiedSearch(artist);
          if (searchResult.tracks && searchResult.tracks.length > 0) {
            return searchResult.tracks.slice(0, 5);
          }
          return await fetchRecommendations(undefined, artist);
        } catch {
          return [];
        }
      });

      const results = await Promise.allSettled(artistPromises);
      for (const res of results) {
        if (res.status === "fulfilled" && Array.isArray(res.value)) {
          pool.push(...res.value);
        }
      }
    } else if (seedTrack) {
      pool = await fetchRecommendations(seedTrack, undefined);
    }

    // 2. Fallback to general catalog discover tracks if pool is sparse
    if (pool.length < 8) {
      const discover = await fetchDiscoverTracks();
      pool.push(...discover);
    }

    // 3. Deduplicate strictly by Track ID and Normalized Title
    const seenIds = new Set<string>();
    const seenTitles = new Set<string>();
    const uniqueTracks: SpotifyTrack[] = [];

    for (const track of pool) {
      if (!track || !track.id || !track.name) continue;

      const normTitle = track.name.toLowerCase().replace(/[^a-z0-9]/g, "");
      const primaryArtist = (track.artists?.[0]?.name || "").toLowerCase().replace(/[^a-z0-9]/g, "");
      const trackKey = `${normTitle}:${primaryArtist}`;

      if (seenIds.has(track.id) || seenTitles.has(trackKey)) {
        continue;
      }

      seenIds.add(track.id);
      seenTitles.add(trackKey);

      // Strict Artwork Matching via resolveArtwork
      const rawArt = track.album?.images?.[0]?.url || "";
      const highResArt = resolveArtwork(track.name, rawArt);

      const resolvedTrack: SpotifyTrack = {
        ...track,
        album: {
          ...track.album,
          images: [
            { url: highResArt, width: 1000, height: 1000 },
            ...(track.album?.images?.slice(1) || []),
          ],
        },
        isInstrumental: isInstrumentalTrack(track.name, track.album?.name, track.isInstrumental),
      };

      uniqueTracks.push(resolvedTrack);
      if (uniqueTracks.length >= limit) break;
    }

    return NextResponse.json(uniqueTracks);
  } catch (err) {
    console.error("[Recommendations API] Failed to assemble smart recommendations:", err);
    return NextResponse.json([]);
  }
}
