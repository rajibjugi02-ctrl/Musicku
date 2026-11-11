import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import type { SpotifyTrack, PlayerTrack } from "@/types/music";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function spotifyTrackToPlayerTrack(track: SpotifyTrack): PlayerTrack {
  return {
    id: track.id,
    uri: track.uri,
    name: track.name,
    artistName: track.artists.map((a) => a.name).join(", "),
    albumName: track.album.name,
    albumArt: track.album.images[0]?.url ?? "/placeholder.png",
    duration: track.duration_ms,
    previewUrl: track.preview_url,
    explicit: track.explicit,
  };
}

