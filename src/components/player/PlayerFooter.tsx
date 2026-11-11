"use client";

import PlayerBar from "./PlayerBar";
import MobileMiniPlayer from "./MobileMiniPlayer";

/**
 * PlayerFooter coordinates the audio player display across screen breakpoints:
 * - Desktop (>= 768px): Docked 3-island glass player bar with detailed waveform scrubber & volume
 * - Mobile (< 768px): Apple Music Floating Frosted Glass Mini Player & Full-Screen Slide-Up Sheet
 */
export default function PlayerFooter() {
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

