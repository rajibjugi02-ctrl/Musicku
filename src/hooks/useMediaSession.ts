"use client";

import { useEffect } from "react";
import { usePlayerStore } from "@/store/usePlayerStore";

/**
 * Hook to connect Musicku playback with the browser & OS Media Session API.
 * Enables Lock Screen media controls, title, artist, album art on iOS, Android, and Windows.
 */
export function useMediaSession() {
  const currentTrack = usePlayerStore((s) => s.currentTrack);
  const isPlaying = usePlayerStore((s) => s.isPlaying);
  const duration = usePlayerStore((s) => s.duration);
  const position = usePlayerStore((s) => s.position);
  const resume = usePlayerStore((s) => s.resume);
  const pause = usePlayerStore((s) => s.pause);
  const next = usePlayerStore((s) => s.next);
  const prev = usePlayerStore((s) => s.prev);
  const seekTo = usePlayerStore((s) => s.seekTo);

  // Update Media Metadata (Song info, Album art)
  useEffect(() => {
    if (typeof window === "undefined" || !("mediaSession" in navigator)) return;

    if (!currentTrack) {
      navigator.mediaSession.metadata = null;
      return;
    }

    const artwork = currentTrack.albumArt
      ? [
          { src: currentTrack.albumArt, sizes: "96x96", type: "image/jpeg" },
          { src: currentTrack.albumArt, sizes: "128x128", type: "image/jpeg" },
          { src: currentTrack.albumArt, sizes: "192x192", type: "image/jpeg" },
          { src: currentTrack.albumArt, sizes: "256x256", type: "image/jpeg" },
          { src: currentTrack.albumArt, sizes: "384x384", type: "image/jpeg" },
          { src: currentTrack.albumArt, sizes: "512x512", type: "image/jpeg" },
        ]
      : [
          { src: "/logo.png", sizes: "512x512", type: "image/png" },
        ];

    navigator.mediaSession.metadata = new MediaMetadata({
      title: currentTrack.name,
      artist: currentTrack.artistName,
      album: currentTrack.albumName || "Musicku Liquid Audio",
      artwork,
    });
  }, [currentTrack]);

  // Update Playback State (playing / paused)
  useEffect(() => {
    if (typeof window === "undefined" || !("mediaSession" in navigator)) return;
    navigator.mediaSession.playbackState = isPlaying ? "playing" : "paused";
  }, [isPlaying]);

  // Update Position State for scrubber on Lock Screen
  useEffect(() => {
    if (typeof window === "undefined" || !("mediaSession" in navigator)) return;
    if (duration > 0 && typeof navigator.mediaSession.setPositionState === "function") {
      try {
        navigator.mediaSession.setPositionState({
          duration: Math.max(0, duration / 1000),
          playbackRate: 1.0,
          position: Math.min(Math.max(0, position / 1000), duration / 1000),
        });
      } catch {
        // Fallback safe for state transitions
      }
    }
  }, [duration, position]);

  // Register Lock Screen & Hardware Media Action Handlers
  useEffect(() => {
    if (typeof window === "undefined" || !("mediaSession" in navigator)) return;

    const actionHandlers: [MediaSessionAction, MediaSessionActionHandler][] = [
      ["play", () => resume()],
      ["pause", () => pause()],
      ["previoustrack", () => prev()],
      ["nexttrack", () => next()],
      ["seekto", (details) => {
        if (details.seekTime !== undefined && details.seekTime !== null) {
          seekTo(details.seekTime * 1000);
        }
      }],
    ];

    actionHandlers.forEach(([action, handler]) => {
      try {
        navigator.mediaSession.setActionHandler(action, handler);
      } catch {
        // Some actions might not be supported on all browsers
      }
    });

    return () => {
      actionHandlers.forEach(([action]) => {
        try {
          navigator.mediaSession.setActionHandler(action, null);
        } catch {}
      });
    };
  }, [resume, pause, next, prev, seekTo]);
}
