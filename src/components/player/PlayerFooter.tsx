"use client";

import { useEffect, useRef } from "react";
import PlayerBar from "./PlayerBar";
import MobileMiniPlayer from "./MobileMiniPlayer";
import { usePlayerStore } from "@/store/usePlayerStore";
import { useReplayStore } from "@/store/useReplayStore";

/**
 * PlayerFooter coordinates the audio player display across screen breakpoints
 * and powers the background listening telemetry for Musicku Replay.
 */
export default function PlayerFooter() {
  const currentTrack = usePlayerStore((s) => s.currentTrack);
  const isPlaying = usePlayerStore((s) => s.isPlaying);
  const recordListening = useReplayStore((s) => s.recordListening);

  const accumulatedSecRef = useRef(0);
  const lastActiveTrackRef = useRef(currentTrack);

  // Background listening telemetry: records active playback every 5 seconds
  useEffect(() => {
    lastActiveTrackRef.current = currentTrack;
    accumulatedSecRef.current = 0;
  }, [currentTrack?.id]);

  useEffect(() => {
    if (!isPlaying || !currentTrack) return;

    const interval = setInterval(() => {
      accumulatedSecRef.current += 5;
      recordListening(currentTrack, 5);
    }, 5000);

    return () => clearInterval(interval);
  }, [isPlaying, currentTrack, recordListening]);

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

