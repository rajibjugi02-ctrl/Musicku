"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  Play,
  Pause,
  SkipBack,
  SkipForward,
  Volume1,
  Volume2,
  Star,
  MoreHorizontal,
  MessageSquareQuote,
  Airplay,
  ListMusic,
  Shuffle,
  Repeat,
  Repeat1,
  Infinity as InfinityIcon,
  Disc3,
  Mic,
  Sparkles,
  Menu,
  Check,
} from "lucide-react";
import { usePlayerStore } from "@/store/usePlayerStore";
import { useLyricsStore } from "@/store/useLyricsStore";
import { useLibraryStore } from "@/store/useLibraryStore";
import { useUIStore } from "@/store/useUIStore";
import TrackActionMenu from "./TrackActionMenu";
import AddToLibraryModal from "@/components/library/AddToLibraryModal";
import { cn } from "@/lib/utils";
import type { PlayerTrack } from "@/types/music";

function formatTime(ms: number) {
  if (!ms || isNaN(ms)) return "0.00";
  const s = Math.floor(ms / 1000);
  const m = Math.floor(s / 60);
  return `${m}.${String(s % 60).padStart(2, "0")}`;
}

function formatRemaining(totalMs: number, currentMs: number) {
  const rem = Math.max(0, totalMs - currentMs);
  if (!rem || isNaN(rem)) return "-0.00";
  const s = Math.floor(rem / 1000);
  const m = Math.floor(s / 60);
  return `-${m}.${String(s % 60).padStart(2, "0")}`;
}

export default function MobileNowPlayingSheet() {
  const {
    currentTrack,
    isPlaying,
    volume,
    position,
    duration,
    queue,
    isShuffle,
    repeatMode,
    play,
    togglePlay,
    next,
    prev,
    seekTo,
    setVolume,
    toggleShuffle,
    shuffleQueue,
    cycleRepeat,
    audioQuality,
  } = usePlayerStore();

  const { isMobilePlayerOpen, closeMobilePlayer } = useUIStore();
  const { lines, activeLine } = useLyricsStore();
  const { isTrackLiked, toggleLikeTrack } = useLibraryStore();
  const router = useRouter();

  const [mode, setMode] = useState<"artwork" | "lyrics" | "queue">("artwork");
  const [isActionMenuOpen, setIsActionMenuOpen] = useState(false);
  const [isLibraryModalOpen, setIsLibraryModalOpen] = useState(false);
  const [isAutoplayActive, setIsAutoplayActive] = useState(true);
  const [isKaraokeActive, setIsKaraokeActive] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const activeLineRef = useRef<HTMLDivElement>(null);
  const progressRef = useRef<HTMLDivElement>(null);

  const trackDuration = duration || currentTrack?.duration || 180000;
  const pct = Math.min(100, Math.max(0, (position / trackDuration) * 100));
  const isFavorited = currentTrack ? isTrackLiked(currentTrack.id) : false;

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 2200);
  };

  // Auto-scroll lyrics in lyrics mode
  useEffect(() => {
    if (mode === "lyrics" && activeLineRef.current) {
      activeLineRef.current.scrollIntoView({
        behavior: "smooth",
        block: "center",
      });
    }
  }, [activeLine, mode]);

  const handleSeek = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!progressRef.current || !currentTrack) return;
    const rect = progressRef.current.getBoundingClientRect();
    const ratio = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
    seekTo(ratio * trackDuration);
  };

  const handleLyricsLineClick = (lineTimeSec: number) => {
    seekTo(lineTimeSec * 1000);
  };

  const handleAirPlayClick = () => {
    showToast("AirPlay: Connected to High-Fidelity Audio");
  };

  if (!currentTrack) return null;

  return (
    <AnimatePresence>
      {isMobilePlayerOpen && (
        <motion.div
          key="mobile-sheet"
          initial={{ y: "100%" }}
          animate={{ y: 0 }}
          exit={{ y: "100%" }}
          transition={{ type: "spring", stiffness: 300, damping: 26, mass: 0.85 }}
          drag="y"
          dragConstraints={{ top: 0 }}
          dragElastic={{ top: 0, bottom: 0.5 }}
          onDragEnd={(_, info) => {
            if (info.offset.y > 140 || info.velocity.y > 500) {
              closeMobilePlayer();
            }
          }}
          className="md:hidden fixed inset-0 z-[100] flex flex-col justify-between overflow-hidden select-none bg-[#0a0c16] text-white"
        >
          {/* Dynamic Mesh Blurred Album Art Background */}
          <div className="absolute inset-0 pointer-events-none overflow-hidden">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={currentTrack.albumArt}
              alt=""
              className="absolute inset-0 w-full h-full object-cover blur-[95px] opacity-35 scale-150 transform transition-transform duration-700"
            />
            <div className="absolute inset-0 bg-gradient-to-b from-[#141a2e]/80 via-[#0e1222]/90 to-[#080a14]" />
          </div>

          {/* Toast Notification */}
          {toastMessage && (
            <motion.div
              initial={{ opacity: 0, y: -20, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -20, scale: 0.95 }}
              className="absolute top-10 inset-x-6 mx-auto max-w-xs z-[150] glass-panel bg-black/85 text-white text-xs font-medium py-2 px-4 rounded-2xl shadow-2xl flex items-center justify-center gap-2 border border-white/20"
            >
              <Check className="w-4 h-4 text-emerald-400" />
              <span>{toastMessage}</span>
            </motion.div>
          )}

          {/* Top Drag Indicator */}
          <div
            onClick={closeMobilePlayer}
            className="relative z-30 w-full pt-3 pb-1 flex justify-center cursor-pointer active:opacity-60"
          >
            <div className="w-10 h-1 bg-white/40 rounded-full" />
          </div>

          {/* Main Content Area based on Mode */}
          <div className={cn(
            "relative z-10 flex-1 flex flex-col min-h-0 overflow-hidden",
            mode === "artwork" ? "px-0" : "px-6"
          )}>
            {/* ─────────────────────────────────────────────────────────────
                MODE 1: ARTWORK VIEW (Full-Bleed Apple Music Hero)
               ───────────────────────────────────────────────────────────── */}
            {mode === "artwork" && (
              <div className="flex-1 flex flex-col justify-between min-h-0 relative pb-2">
                {/* Full-Bleed Hero Artwork with Breathing Zoom Animation */}
                <div className="relative w-full h-[50dvh] sm:h-[56dvh] overflow-hidden flex-shrink-0">
                  <motion.div
                    animate={{
                      scale: isPlaying ? [1, 1.04, 1] : 0.96,
                    }}
                    transition={{
                      scale: isPlaying
                        ? { repeat: Infinity, duration: 14, ease: "easeInOut" }
                        : { type: "spring", stiffness: 220, damping: 22 },
                    }}
                    className="relative w-full h-full"
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={currentTrack.albumArt}
                      alt={currentTrack.name}
                      className="w-full h-full object-cover object-center select-none"
                    />
                  </motion.div>

                  {/* Multi-Stop Apple Music iOS Seamless Bottom Gradient Mask */}
                  <div className="absolute inset-x-0 bottom-0 h-48 bg-gradient-to-t from-[#0a0c16] via-[#0a0c16]/80 via-45% to-transparent pointer-events-none" />
                  <div className="absolute inset-x-0 top-0 h-24 bg-gradient-to-b from-black/60 to-transparent pointer-events-none" />
                </div>

                {/* Track Info Row + Favorite & Actions */}
                <div className="px-6 flex items-center justify-between gap-3 pt-2 pb-2 relative z-20">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <h1 className="text-xl sm:text-2xl font-extrabold text-white tracking-tight leading-tight truncate">
                        {currentTrack.name}
                      </h1>
                      <span className="flex-shrink-0 text-[10px] font-bold bg-white/20 text-white/90 px-1.5 py-0.5 rounded leading-none">
                        E
                      </span>
                      {audioQuality === "hi-res" ? (
                        <span className="flex-shrink-0 text-[9px] font-mono font-bold bg-amber-400/20 text-amber-300 border border-amber-400/30 px-1.5 py-0.5 rounded leading-none">
                          HI-RES LOSSLESS
                        </span>
                      ) : audioQuality === "lossless" ? (
                        <span className="flex-shrink-0 text-[9px] font-mono font-bold bg-indigo-400/20 text-indigo-200 border border-indigo-400/30 px-1.5 py-0.5 rounded leading-none">
                          LOSSLESS
                        </span>
                      ) : null}
                    </div>
                    <button
                      onClick={() => {
                        closeMobilePlayer();
                        usePlayerStore.getState().setDesktopDetailOpen(false);
                        router.push(`/artist/${encodeURIComponent(currentTrack.artistName)}`);
                      }}
                      className="text-sm font-semibold text-white/70 hover:text-white truncate mt-1 text-left block hover:underline cursor-pointer transition-colors"
                    >
                      {currentTrack.artistName}
                    </button>
                  </div>

                  <div className="flex items-center gap-2 flex-shrink-0">
                    <button
                      onClick={() => toggleLikeTrack(currentTrack)}
                      className="p-2 rounded-full hover:bg-white/10 active:scale-90 transition-transform cursor-pointer"
                    >
                      <Star
                        className={cn(
                          "w-5 h-5 transition-colors",
                          isFavorited ? "text-amber-400 fill-amber-400" : "text-white/80"
                        )}
                      />
                    </button>
                    <button
                      onClick={() => setIsActionMenuOpen(true)}
                      className="p-2 rounded-full hover:bg-white/10 active:scale-90 transition-transform cursor-pointer"
                    >
                      <MoreHorizontal className="w-5 h-5 text-white/80" />
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* ─────────────────────────────────────────────────────────────
                MODE 2: LIVE LYRICS VIEW
               ───────────────────────────────────────────────────────────── */}
            {mode === "lyrics" && (
              <div className="flex-1 flex flex-col min-h-0 pt-2 pb-1">
                {/* Compact Track Header */}
                <div className="flex items-center justify-between gap-3 pb-3 border-b border-white/[0.08] flex-shrink-0">
                  <div className="flex items-center gap-3 min-w-0">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={currentTrack.albumArt}
                      alt={currentTrack.name}
                      className="w-11 h-11 rounded-xl object-cover flex-shrink-0 shadow-md border border-white/15"
                    />
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5">
                        <p className="text-sm font-bold text-white truncate leading-tight">
                          {currentTrack.name}
                        </p>
                        <span className="text-[9px] font-bold bg-white/20 text-white/90 px-1 rounded leading-none">
                          E
                        </span>
                      </div>
                      <button
                        onClick={() => {
                          closeMobilePlayer();
                          usePlayerStore.getState().setDesktopDetailOpen(false);
                          router.push(`/artist/${encodeURIComponent(currentTrack.artistName)}`);
                        }}
                        className="text-xs text-white/60 hover:text-white truncate mt-0.5 text-left block hover:underline cursor-pointer transition-colors"
                      >
                        {currentTrack.artistName}
                      </button>
                    </div>
                  </div>

                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => toggleLikeTrack(currentTrack)}
                      className="p-2 rounded-full hover:bg-white/10 active:scale-90 transition-transform"
                    >
                      <Star
                        className={cn(
                          "w-4 h-4",
                          isFavorited ? "text-amber-400 fill-amber-400" : "text-white/80"
                        )}
                      />
                    </button>
                    <button
                      onClick={() => setIsActionMenuOpen(true)}
                      className="p-2 rounded-full hover:bg-white/10 active:scale-90 transition-transform"
                    >
                      <MoreHorizontal className="w-4 h-4 text-white/80" />
                    </button>
                  </div>
                </div>

                {/* Live Synced Lyrics Stream */}
                <div className="flex-1 overflow-y-auto scrollbar-none py-4 space-y-5 relative">
                  {lines.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-full text-center text-white/40 text-xs gap-2">
                      <Disc3 className="w-6 h-6 animate-spin text-white/30" />
                      <span>Syncing real-time lyrics stream...</span>
                    </div>
                  ) : (
                    lines.map((line, i) => {
                      const isActive = i === activeLine;
                      return (
                        <div
                          key={`${i}-${line.time}`}
                          ref={isActive ? activeLineRef : undefined}
                          onClick={() => handleLyricsLineClick(line.time)}
                          className={cn(
                            "cursor-pointer transition-all duration-300 py-1 origin-left",
                            isActive
                              ? "text-2xl sm:text-3xl font-extrabold text-white leading-tight drop-shadow-[0_0_20px_rgba(255,255,255,0.4)] scale-100"
                              : "text-lg sm:text-xl font-bold text-white/30 blur-[0.8px] hover:text-white/70 hover:blur-0 scale-95"
                          )}
                        >
                          {line.text}
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            )}

            {/* ─────────────────────────────────────────────────────────────
                MODE 3: QUEUE / CONTINUE PLAYING VIEW
               ───────────────────────────────────────────────────────────── */}
            {mode === "queue" && (
              <div className="flex-1 flex flex-col min-h-0 pt-2 pb-1">
                {/* Compact Track Header */}
                <div className="flex items-center justify-between gap-3 pb-3 border-b border-white/[0.08] flex-shrink-0">
                  <div className="flex items-center gap-3 min-w-0">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={currentTrack.albumArt}
                      alt={currentTrack.name}
                      className="w-11 h-11 rounded-xl object-cover flex-shrink-0 shadow-md border border-white/15"
                    />
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5">
                        <p className="text-sm font-bold text-white truncate leading-tight">
                          {currentTrack.name}
                        </p>
                        <span className="text-[9px] font-bold bg-white/20 text-white/90 px-1 rounded leading-none">
                          E
                        </span>
                      </div>
                      <button
                        onClick={() => {
                          closeMobilePlayer();
                          usePlayerStore.getState().setDesktopDetailOpen(false);
                          router.push(`/artist/${encodeURIComponent(currentTrack.artistName)}`);
                        }}
                        className="text-xs text-white/60 hover:text-white truncate mt-0.5 text-left block hover:underline cursor-pointer transition-colors"
                      >
                        {currentTrack.artistName}
                      </button>
                    </div>
                  </div>

                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => toggleLikeTrack(currentTrack)}
                      className="p-2 rounded-full hover:bg-white/10 active:scale-90 transition-transform"
                    >
                      <Star
                        className={cn(
                          "w-4 h-4",
                          isFavorited ? "text-amber-400 fill-amber-400" : "text-white/80"
                        )}
                      />
                    </button>
                    <button
                      onClick={() => setIsActionMenuOpen(true)}
                      className="p-2 rounded-full hover:bg-white/10 active:scale-90 transition-transform"
                    >
                      <MoreHorizontal className="w-4 h-4 text-white/80" />
                    </button>
                  </div>
                </div>

                {/* 4 Apple Music Control Pills */}
                <div className="grid grid-cols-4 gap-2 py-3 flex-shrink-0">
                  {/* Shuffle */}
                  <button
                    onClick={toggleShuffle}
                    className={cn(
                      "h-9 rounded-2xl flex items-center justify-center transition-all cursor-pointer",
                      isShuffle
                        ? "bg-white text-zinc-950 font-bold shadow-md shadow-white/20"
                        : "glass-pill bg-white/10 text-white/70 hover:text-white"
                    )}
                  >
                    <Shuffle className="w-4 h-4" />
                  </button>

                  {/* Repeat */}
                  <button
                    onClick={cycleRepeat}
                    className={cn(
                      "h-9 rounded-2xl flex items-center justify-center transition-all cursor-pointer",
                      repeatMode !== "none"
                        ? "bg-white text-zinc-950 font-bold shadow-md shadow-white/20"
                        : "glass-pill bg-white/10 text-white/70 hover:text-white"
                    )}
                  >
                    {repeatMode === "one" ? <Repeat1 className="w-4 h-4" /> : <Repeat className="w-4 h-4" />}
                  </button>

                  {/* Infinity Autoplay */}
                  <button
                    onClick={() => {
                      setIsAutoplayActive(!isAutoplayActive);
                      showToast(isAutoplayActive ? "Autoplay Disabled" : "Autoplay Infinite Queue Enabled");
                    }}
                    className={cn(
                      "h-9 rounded-2xl flex items-center justify-center transition-all cursor-pointer",
                      isAutoplayActive
                        ? "bg-white text-zinc-950 font-bold shadow-md shadow-white/20"
                        : "glass-pill bg-white/10 text-white/70 hover:text-white"
                    )}
                  >
                    <InfinityIcon className="w-4 h-4" />
                  </button>

                  {/* Audio Crossfade / Quality */}
                  <button
                    onClick={() => showToast("Direct 160kbps AAC Engine Active")}
                    className="h-9 rounded-2xl glass-pill bg-white/10 text-white/70 hover:text-white flex items-center justify-center transition-all cursor-pointer"
                  >
                    <Disc3 className="w-4 h-4" />
                  </button>
                </div>

                {/* Continue Playing Section Header */}
                <div className="pt-1 pb-2 flex items-center justify-between flex-shrink-0">
                  <div>
                    <h3 className="text-sm font-bold text-white tracking-tight">Continue Playing</h3>
                    <p className="text-[11px] text-white/50">Smart Auto-Queue</p>
                  </div>
                  {queue.length > 1 && (
                    <button
                      onClick={() => shuffleQueue()}
                      title="Shuffle Queue"
                      className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-medium text-white/90 hover:text-white bg-white/10 hover:bg-white/20 border border-white/15 transition-all cursor-pointer active:scale-95 shadow-sm"
                    >
                      <Shuffle className="w-3.5 h-3.5 text-indigo-300" />
                      <span>Shuffle</span>
                    </button>
                  )}
                </div>

                {/* Queue Tracks List */}
                <div className="flex-1 overflow-y-auto scrollbar-none divide-y divide-white/[0.05]">
                  {queue.length === 0 ? (
                    <div className="py-8 text-center text-xs text-white/40">
                      No more tracks queued in playlist
                    </div>
                  ) : (
                    queue.map((t, idx) => {
                      const isCurrent = t.id === currentTrack.id;
                      return (
                        <div
                          key={`${t.id}-${idx}`}
                          onClick={() => play(t, queue)}
                          className={cn(
                            "flex items-center justify-between py-2.5 px-1.5 rounded-xl transition-colors cursor-pointer group",
                            isCurrent ? "bg-white/10 font-bold" : "hover:bg-white/5"
                          )}
                        >
                          <div className="flex items-center gap-3 min-w-0 flex-1">
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img
                              src={t.albumArt}
                              alt={t.name}
                              className="w-10 h-10 rounded-lg object-cover flex-shrink-0 shadow-sm border border-white/10"
                            />
                            <div className="min-w-0 flex-1">
                              <div className="flex items-center gap-1.5">
                                <p className={cn("text-xs truncate", isCurrent ? "text-white font-bold" : "text-white/90 font-medium")}>
                                  {t.name}
                                </p>
                                <span className="text-[8px] font-bold bg-white/20 text-white/90 px-1 rounded leading-none">
                                  E
                                </span>
                              </div>
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  closeMobilePlayer();
                                  usePlayerStore.getState().setDesktopDetailOpen(false);
                                  router.push(`/artist/${encodeURIComponent(t.artistName)}`);
                                }}
                                className="text-[11px] text-white/50 hover:text-white truncate mt-0.5 text-left block hover:underline cursor-pointer transition-colors"
                              >
                                {t.artistName}
                              </button>
                            </div>
                          </div>

                          <div className="flex items-center gap-2 pl-2 text-white/40 group-hover:text-white/80">
                            <Menu className="w-4 h-4" />
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            )}
          </div>

          {/* ─────────────────────────────────────────────────────────────
              UNIVERSAL BOTTOM CONTROLS DOCK (Consistent across all 3 modes)
             ───────────────────────────────────────────────────────────── */}
          <div className="relative z-10 px-6 pt-1 pb-6 flex flex-col gap-3 flex-shrink-0">
            {/* Progress Bar / Scrubber */}
            <div className="flex flex-col gap-1 w-full">
              <div
                ref={progressRef}
                onClick={handleSeek}
                className="h-1.5 bg-white/20 hover:h-2 rounded-full cursor-pointer relative transition-all"
              >
                <div
                  className="h-full bg-white rounded-full relative transition-all"
                  style={{ width: `${pct}%` }}
                >
                  <div className="absolute right-0 top-1/2 -translate-y-1/2 w-3.5 h-3.5 bg-white rounded-full shadow-md" />
                </div>
              </div>
              <div className="flex items-center justify-between text-[11px] font-mono text-white/50">
                <span>{formatTime(position)}</span>
                <span>{formatRemaining(trackDuration, position)}</span>
              </div>
            </div>

            {/* Playback Controls (Rewind, Play/Pause, Fast-Forward) */}
            <div className="flex items-center justify-center gap-10 py-1">
              <button
                onClick={prev}
                className="text-white hover:text-white/80 active:scale-90 transition-transform cursor-pointer"
                title="Previous"
              >
                <SkipBack className="w-8 h-8 fill-current" />
              </button>

              <motion.button
                whileTap={{ scale: 0.9 }}
                onClick={togglePlay}
                className="w-14 h-14 rounded-full bg-white text-zinc-950 flex items-center justify-center shadow-2xl hover:scale-105 active:scale-95 transition-all cursor-pointer"
                title={isPlaying ? "Pause" : "Play"}
              >
                {isPlaying ? (
                  <Pause className="w-7 h-7 fill-current" />
                ) : (
                  <Play className="w-7 h-7 fill-current ml-1" />
                )}
              </motion.button>

              <button
                onClick={next}
                className="text-white hover:text-white/80 active:scale-90 transition-transform cursor-pointer"
                title="Next"
              >
                <SkipForward className="w-8 h-8 fill-current" />
              </button>
            </div>

            {/* Volume Slider Row */}
            <div className="flex items-center gap-3 px-2">
              <Volume1 className="w-4 h-4 text-white/50 flex-shrink-0" />
              <input
                type="range"
                min={0}
                max={1}
                step={0.01}
                value={volume}
                onChange={(e) => setVolume(parseFloat(e.target.value))}
                className="w-full h-1 bg-white/20 rounded-lg appearance-none cursor-pointer accent-white"
              />
              <Volume2 className="w-4 h-4 text-white/50 flex-shrink-0" />
            </div>

            {/* Bottom 3 Modes Switcher Bar */}
            <div className="flex items-center justify-between pt-1 text-white/60">
              {/* Lyrics Mode Button */}
              <button
                onClick={() => setMode(mode === "lyrics" ? "artwork" : "lyrics")}
                className={cn(
                  "p-2 rounded-2xl flex items-center justify-center transition-all cursor-pointer",
                  mode === "lyrics"
                    ? "glass-pill bg-white/20 text-white shadow-lg"
                    : "hover:text-white active:scale-90"
                )}
                title="Live Lyrics"
              >
                <MessageSquareQuote className="w-5 h-5" />
              </button>

              {/* AirPlay Button */}
              <button
                onClick={handleAirPlayClick}
                className="p-2 rounded-2xl hover:text-white active:scale-90 transition-transform cursor-pointer"
                title="Audio Output"
              >
                <Airplay className="w-5 h-5" />
              </button>

              {/* Queue Mode Button */}
              <button
                onClick={() => setMode(mode === "queue" ? "artwork" : "queue")}
                className={cn(
                  "p-2 rounded-2xl flex items-center justify-center transition-all cursor-pointer",
                  mode === "queue"
                    ? "glass-pill bg-white/20 text-white shadow-lg"
                    : "hover:text-white active:scale-90"
                )}
                title="Queue & History"
              >
                <ListMusic className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Action Menu (•••) Pop-up */}
          <TrackActionMenu
            track={currentTrack}
            isOpen={isActionMenuOpen}
            onClose={() => setIsActionMenuOpen(false)}
            onOpenPlaylistModal={() => setIsLibraryModalOpen(true)}
          />

          {/* Add to Playlist / Custom Library Modal */}
          <AddToLibraryModal
            track={currentTrack}
            isOpen={isLibraryModalOpen}
            onClose={() => setIsLibraryModalOpen(false)}
          />
        </motion.div>
      )}
    </AnimatePresence>
  );
}

