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

// In-memory cache for parsed lyrics (track+artist -> LrcLine[])
const lyricsCache = new Map<string, LrcLine[]>();

/**
 * Parses raw LRC string ([mm:ss.xx] or [mm:ss.xxx]) into structured LrcLine array.
 */
export function parseLrc(raw: string): LrcLine[] {
  const lines: LrcLine[] = [];
  const rawLines = raw.split("\n");

  for (const line of rawLines) {
    // Regex matching [mm:ss.xx] or [mm:ss.xxx] with optional millisecond fractions
    const match = line.match(/^\[(\d{2}):(\d{2})(?:\.(\d{2,3}))?\]\s*(.*)$/);
    if (!match) continue;

    const minutes = parseInt(match[1], 10);
    const seconds = parseInt(match[2], 10);
    let millis = 0;

    if (match[3]) {
      // If 2 digits, it's hundredths of a second (* 10 ms)
      millis = match[3].length === 2 ? parseInt(match[3], 10) * 10 : parseInt(match[3], 10);
    }

    const time = minutes * 60 + seconds + millis / 1000;
    const text = match[4].trim();

    // Skip empty lines or metadata tags (e.g., [ar:...], [al:...])
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
    .map((l) => l.trim())
    .filter((l) => l.length > 0 && !l.startsWith("[") && !l.endsWith("]"));

  if (cleanLines.length === 0) return [];

  const totalDuration = durationSec > 10 ? durationSec : 180;
  // Give an initial 5s prelude buffer
  const prelude = 5;
  const usableDuration = Math.max(10, totalDuration - prelude - 5);
  const step = usableDuration / cleanLines.length;

  return cleanLines.map((text, i) => ({
    time: Math.round((prelude + i * step) * 100) / 100,
    text,
  }));
}

export async function fetchLyricsFromLRCLIB(
  track: string,
  artist: string,
  durationSec: number = 0
): Promise<LrcLine[] | null> {
  const cacheKey = `${artist.toLowerCase()}:${track.toLowerCase()}`;
  if (lyricsCache.has(cacheKey)) {
    return lyricsCache.get(cacheKey)!;
  }

  try {
    // Query 1: Targeted track_name and artist_name search
    const searchUrl = `https://lrclib.net/api/search?track_name=${encodeURIComponent(track)}&artist_name=${encodeURIComponent(artist)}`;
    let res = await fetch(searchUrl, {
      headers: { "User-Agent": "Musicku-App/1.0" },
      next: { revalidate: 86400 },
    });

    let data: LrclibItem[] = [];
    if (res.ok) {
      data = await res.json();
    }

    // Query 2: Fallback query if no synced lyrics found
    let candidate = data.find((d) => d.syncedLyrics && d.syncedLyrics.trim().length > 0);

    if (!candidate) {
      const fallbackUrl = `https://lrclib.net/api/search?q=${encodeURIComponent(track + " " + artist)}`;
      res = await fetch(fallbackUrl, {
        headers: { "User-Agent": "Musicku-App/1.0" },
        next: { revalidate: 86400 },
      });

      if (res.ok) {
        const fallbackData: LrclibItem[] = await res.json();
        candidate = fallbackData.find((d) => d.syncedLyrics && d.syncedLyrics.trim().length > 0) || fallbackData[0];
      }
    }

    if (candidate) {
      if (candidate.syncedLyrics) {
        const parsed = parseLrc(candidate.syncedLyrics);
        if (parsed.length > 0) {
          lyricsCache.set(cacheKey, parsed);
          return parsed;
        }
      }

      if (candidate.plainLyrics) {
        const parsed = generateProportionalTimestamps(
          candidate.plainLyrics,
          candidate.duration || durationSec || 180
        );
        if (parsed.length > 0) {
          lyricsCache.set(cacheKey, parsed);
          return parsed;
        }
      }
    }

    return null;
  } catch {
    return null;
  }
}
