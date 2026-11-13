"use client";

import { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";
import PlayerBar from "./PlayerBar";
import MobileMiniPlayer from "./MobileMiniPlayer";
import { usePlayerStore } from "@/store/usePlayerStore";
import { useReplayStore } from "@/store/useReplayStore";

/**
 * PlayerFooter coordinates audio playback presentation across breakpoints
 * and continuously records listening telemetry for Musicku Replay in the background.
 */
export default function PlayerFooter() {
  const currentTrack = usePlayerStore((s) => s.currentTrack);
  const isPlaying = usePlayerStore((s) => s.isPlaying);
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
