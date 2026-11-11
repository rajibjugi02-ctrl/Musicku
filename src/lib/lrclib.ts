import type { LrcLine } from "@/types/music";

const LRCLIB_BASE = "https://lrclib.net/api";

interface LrclibResponse {
  id: number;
  trackName: string;
  artistName: string;
  albumName: string;
  duration: number;
  syncedLyrics: string | null;
  plainLyrics: string | null;
}

function parseLrc(raw: string): LrcLine[] {
  const lines: LrcLine[] = [];
  for (const line of raw.split("\n")) {
    // Match [mm:ss.xx] or [mm:ss]
    const match = line.match(/^\[(\d{2}):(\d{2})\.?(\d{0,2})\](.*)/);
    if (!match) continue;
    const minutes = parseInt(match[1], 10);
    const seconds = parseInt(match[2], 10);
    const centiseconds = match[3] ? parseInt(match[3].padEnd(2, "0"), 10) : 0;
    const time = minutes * 60 + seconds + centiseconds / 100;
    const text = match[4].trim();
    if (text) lines.push({ time, text });
  }
  return lines.sort((a, b) => a.time - b.time);
}

export async function getLyrics(
  trackName: string,
  artistName: string,
  albumName: string,
  duration: number // seconds
): Promise<LrcLine[] | null> {
  try {
    const params = new URLSearchParams({
      track_name: trackName,
      artist_name: artistName,
      album_name: albumName,
      duration: String(Math.round(duration)),
    });

    const res = await fetch(`${LRCLIB_BASE}/get?${params}`, {
      next: { revalidate: 86400 }, // cache for 24h — lyrics don't change
    });

    if (!res.ok) return null;

    const data = (await res.json()) as LrclibResponse;

    if (data.syncedLyrics) {
      return parseLrc(data.syncedLyrics);
    }

    // Fall back to plain lyrics displayed as a single block
    if (data.plainLyrics) {
      return data.plainLyrics
        .split("\n")
        .filter((l) => l.trim())
        .map((text, i) => ({ time: i * 3, text })); // fake timestamps for plain lyrics
    }

    return null;
  } catch {
    return null;
  }
}
