import type { LrcLine } from "@/types/music";

interface LrclibItem {
  id: number;
  trackName: string;
  artistName: string;
  albumName?: string;
  duration?: number;
  syncedLyrics?: string | null;
  plainLyrics?: string | null;
}

// In-memory cache for parsed lyrics (track+artist+duration -> LrcLine[])
const lyricsCache = new Map<string, LrcLine[]>();

/**
 * Sanitizes lyric text to remove extraneous trailing/leading pipes, cursor artifacts,
 * or divider symbols that sometimes appear in crowd-sourced LRC tracks.
 */
export function cleanLrcText(raw: string): string {
  if (!raw) return "";
  return raw
    .replace(/^[\s|_\-—–\u2500-\u257F]+/g, "")
    .replace(/[\s|_\-—–\u2500-\u257F]+$/g, "")
    .replace(/\s*\|+\s*$/g, "")
    .trim();
}

/**
 * Parses raw LRC string ([mm:ss.xx] or [mm:ss.xxx]) into structured LrcLine array
 * with high-precision millisecond parsing.
 */
export function parseLrc(raw: string): LrcLine[] {
  const lines: LrcLine[] = [];
  const rawLines = raw.split("\n");

  for (const line of rawLines) {
    const match = line.match(/^\[(\d{1,2}):(\d{2})(?:\.(\d{1,3}))?\]\s*(.*)$/);
    if (!match) continue;

    const minutes = parseInt(match[1], 10);
    const seconds = parseInt(match[2], 10);
    let millis = 0;

    if (match[3]) {
      const frac = match[3];
      if (frac.length === 1) millis = parseInt(frac, 10) * 100;
      else if (frac.length === 2) millis = parseInt(frac, 10) * 10;
      else millis = parseInt(frac.slice(0, 3), 10);
    }

    const time = minutes * 60 + seconds + millis / 1000;
    const text = cleanLrcText(match[4]);

    if (text && !text.startsWith("[") && !text.endsWith("]")) {
      lines.push({ time, text });
    }
  }

  return lines.sort((a, b) => a.time - b.time);
}

/**
 * Generates synthetic proportional timestamps for plain lyrics when synced LRC is unavailable.
 */
export function generateProportionalTimestamps(plainLyrics: string, durationSec: number): LrcLine[] {
  const cleanLines = plainLyrics
    .split("\n")
    .map((l) => cleanLrcText(l))
    .filter((l) => l.length > 0 && !l.startsWith("[") && !l.endsWith("]"));

  if (cleanLines.length === 0) return [];

  const totalDuration = durationSec > 10 ? durationSec : 180;
  const prelude = 5;
  const usableDuration = Math.max(10, totalDuration - prelude - 5);
  const step = usableDuration / cleanLines.length;

  return cleanLines.map((text, i) => ({
    time: Math.round((prelude + i * step) * 100) / 100,
    text,
  }));
}

/**
 * Fetches lyrics from LRCLIB using exact duration fingerprinting first,
 * followed by search candidate distance ranking to prevent out-of-sync lyrics.
 */
export async function fetchLyricsFromLRCLIB(
  track: string,
  artist: string,
  durationSec: number = 0
): Promise<LrcLine[] | null> {
  const roundedDur = Math.round(durationSec);
  const cacheKey = `${artist.toLowerCase()}:${track.toLowerCase()}:${roundedDur}`;
  if (lyricsCache.has(cacheKey)) {
    return lyricsCache.get(cacheKey)!;
  }

  const cleanArtist = artist.trim();
  const cleanTrack = track.trim();
  const artistLower = cleanArtist.toLowerCase();

  try {
    // 1. Exact Fingerprint Match: /api/get?artist_name=...&track_name=...&duration=...
    if (roundedDur > 10) {
      try {
        const exactUrl = `https://lrclib.net/api/get?artist_name=${encodeURIComponent(cleanArtist)}&track_name=${encodeURIComponent(cleanTrack)}&duration=${roundedDur}`;
        const exactRes = await fetch(exactUrl, {
          headers: { "User-Agent": "Musicku-App/1.0" },
          next: { revalidate: 86400 },
        });

        if (exactRes.ok) {
          const exactData: LrclibItem = await exactRes.json();
          if (exactData.syncedLyrics && exactData.syncedLyrics.trim().length > 0) {
            const parsed = parseLrc(exactData.syncedLyrics);
            if (parsed.length > 0) {
              lyricsCache.set(cacheKey, parsed);
              return parsed;
            }
          }
        }
      } catch {
        // Fall through to search endpoint
      }
    }

    // 2. Search Endpoint with Duration-Distance Ranking
    const searchUrl = `https://lrclib.net/api/search?track_name=${encodeURIComponent(cleanTrack)}&artist_name=${encodeURIComponent(cleanArtist)}`;
    let res = await fetch(searchUrl, {
      headers: { "User-Agent": "Musicku-App/1.0" },
      next: { revalidate: 86400 },
    });

    let items: LrclibItem[] = [];
    if (res.ok) {
      items = await res.json();
    }

    if (!Array.isArray(items) || items.length === 0) {
      const broadUrl = `https://lrclib.net/api/search?q=${encodeURIComponent(cleanTrack + " " + cleanArtist)}`;
      const broadRes = await fetch(broadUrl, {
        headers: { "User-Agent": "Musicku-App/1.0" },
        next: { revalidate: 86400 },
      });
      if (broadRes.ok) {
        items = await broadRes.json();
      }
    }

    if (Array.isArray(items) && items.length > 0) {
      // Filter candidates with syncedLyrics and matching artist
      const syncedCandidates = items.filter((item) => {
        if (!item.syncedLyrics || !item.syncedLyrics.trim()) return false;
        const itemArt = (item.artistName || "").toLowerCase();
        return itemArt.includes(artistLower) || artistLower.includes(itemArt);
      });

      if (syncedCandidates.length > 0) {
        // Sort by smallest duration difference against the actual audio duration
        if (roundedDur > 10) {
          syncedCandidates.sort((a, b) => {
            const diffA = Math.abs((a.duration || 0) - roundedDur);
            const diffB = Math.abs((b.duration || 0) - roundedDur);
            return diffA - diffB;
          });
        }

        const best = syncedCandidates[0];
        if (best.syncedLyrics) {
          const parsed = parseLrc(best.syncedLyrics);
          if (parsed.length > 0) {
            lyricsCache.set(cacheKey, parsed);
            return parsed;
          }
        }
      }

      // Fallback to plain lyrics if synced unavailable
      const plainCandidates = items.filter((item) => {
        if (!item.plainLyrics || !item.plainLyrics.trim()) return false;
        const itemArt = (item.artistName || "").toLowerCase();
        return itemArt.includes(artistLower) || artistLower.includes(itemArt);
      });

      if (plainCandidates.length > 0) {
        if (roundedDur > 10) {
          plainCandidates.sort((a, b) => {
            const diffA = Math.abs((a.duration || 0) - roundedDur);
            const diffB = Math.abs((b.duration || 0) - roundedDur);
            return diffA - diffB;
          });
        }

        const bestPlain = plainCandidates[0];
        if (bestPlain.plainLyrics) {
          const parsed = generateProportionalTimestamps(
            bestPlain.plainLyrics,
            bestPlain.duration || roundedDur || 180
          );
          if (parsed.length > 0) {
            lyricsCache.set(cacheKey, parsed);
            return parsed;
          }
        }
      }
    }

    return null;
  } catch {
    return null;
  }
}
