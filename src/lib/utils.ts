import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import type { SpotifyTrack, PlayerTrack } from "@/types/music";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Downscales high-res image URLs (Apple Music / iTunes / Deezer) to 300x300
 * for 10x lighter payload, instant rendering, and 60fps scrolling.
 */
export function getOptimizedImageUrl(url?: string | null, size = 300): string {
  if (!url || typeof url !== "string") return "";

  // Apple Music / iTunes CDN: convert 1000x1000bb or 600x600bb to 300x300bb
  if (url.includes("mzstatic.com")) {
    return url
      .replace(/\/\d+x\d+bb\./g, `/${size}x${size}bb.`)
      .replace(/\/\d+x\d+bb-/g, `/${size}x${size}bb-`);
  }

  // Deezer CDN: convert 1000x1000 or 500x500 to 300x300
  if (url.includes("dzcdn.net")) {
    return url.replace(/\/\d+x\d+-/g, `/${size}x${size}-`);
  }

  return url;
}

export function spotifyTrackToPlayerTrack(track: SpotifyTrack): PlayerTrack {
  const rawArt = track.album?.images?.[0]?.url || "";
  return {
    id: track.id,
    uri: track.uri,
    name: track.name,
    artistName: track.artists.map((a) => a.name).join(", "),
    albumName: track.album?.name || "Single",
    albumArt: rawArt,
    duration: track.duration_ms,
    previewUrl: track.preview_url,
    explicit: track.explicit,
  };
}
