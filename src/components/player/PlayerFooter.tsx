"use client";

import { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";
import PlayerBar from "./PlayerBar";
import MobileMiniPlayer from "./MobileMiniPlayer";
import { usePlayerStore } from "@/store/usePlayerStore";
import { useReplayStore } from "@/store/useReplayStore";

interface CachedStreamItem {
  url: string;
  isFallback: boolean;
  duration: number;
  expiresAt: number;
}

// In-memory 30-minute client stream URL cache for instant zero-buffering playback
const STREAM_CACHE_TTL_MS = 30 * 60 * 1000;
export const streamUrlCache = new Map<string, CachedStreamItem>();

/**
 * PlayerFooter coordinates audio playback presentation across breakpoints,
 * manages in-memory stream caching & Next-Track Pre-Fetching, and continuously
 * records listening telemetry for Musicku Replay in the background.
 */
export default function PlayerFooter() {
  const currentTrack = usePlayerStore((s) => s.currentTrack);
  const isPlaying = usePlayerStore((s) => s.isPlaying);
  const queue = usePlayerStore((s) => s.queue);
  const prefetchTrackStream = usePlayerStore((s) => s.prefetchTrackStream);

  const recordListening = useReplayStore((s) => s.recordListening);
  const pathname = usePathname();
  const isReplayPage = pathname.startsWith("/replay");

  const accumulatedSecRef = useRef(0);
  const lastActiveTrackRef = useRef(currentTrack);

  // Reset session counter when changing tracks
  useEffect(() => {
    lastActiveTrackRef.current = currentTrack;
    accumulatedSecRef.current = 0;
  }, [currentTrack?.id]);

  // Background listening telemetry: records active playback every 5 seconds
  useEffect(() => {
    if (!isPlaying || !currentTrack) return;

    const interval = setInterval(() => {
      accumulatedSecRef.current += 5;
      recordListening(currentTrack, 5);
    }, 5000);

    return () => clearInterval(interval);
  }, [isPlaying, currentTrack, recordListening]);

  // Zero-Latency Next-Track Pre-Fetching:
  // As soon as the active track starts playing, silently resolve stream URL
  // for the first track in the UP NEXT queue.
  useEffect(() => {
    if (!isPlaying || !currentTrack || !queue || queue.length <= 1) return;

    const currentIdx = queue.findIndex((t) => t.id === currentTrack.id);
    const nextIdx = currentIdx !== -1 && currentIdx + 1 < queue.length ? currentIdx + 1 : -1;
    if (nextIdx === -1) return;

    const nextTrack = queue[nextIdx];
    if (!nextTrack) return;

    const trackKey = `${nextTrack.name.toLowerCase()}:${nextTrack.artistName.toLowerCase()}`;
    const cached = streamUrlCache.get(trackKey) || streamUrlCache.get(nextTrack.id);
    if (cached && Date.now() < cached.expiresAt) {
      return;
    }

    // Prefetch in background after 1.5s to let active song start with 100% bandwidth
    const prefetchTimer = setTimeout(async () => {
      try {
        await prefetchTrackStream(nextTrack);
        const resolved = usePlayerStore.getState().streamCache[nextTrack.id];
        if (resolved) {
          const entry: CachedStreamItem = {
            url: resolved.streamUrl,
            isFallback: resolved.isFallback,
            duration: resolved.duration,
            expiresAt: Date.now() + STREAM_CACHE_TTL_MS,
          };
          streamUrlCache.set(trackKey, entry);
          streamUrlCache.set(nextTrack.id, entry);
        }
      } catch {
        // Silent catch for background prefetch
      }
    }, 1500);

    return () => clearTimeout(prefetchTimer);
  }, [isPlaying, currentTrack?.id, queue, prefetchTrackStream]);

  // When on Replay page, keep background telemetry active but do not render overlapping player chrome
  if (isReplayPage) {
    return null;
  }

  return (
    <>
      {/* Desktop Player Bar */}
      <div className="hidden md:block glass-panel rounded-[24px] overflow-hidden flex-shrink-0">
        <PlayerBar />
      </div>

      {/* Mobile Floating Mini Player & iOS Slide-Up Sheet */}
      <MobileMiniPlayer />
    </>
  );
}
