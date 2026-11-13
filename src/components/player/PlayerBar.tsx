"use client";

import { useEffect, useRef, useCallback, useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import {
  Play,
  Pause,
  SkipBack,
  SkipForward,
  Volume2,
  VolumeX,
  Shuffle,
  Repeat,
  Repeat1,
  Disc,
  Loader2,
  Radio,
  Sparkles,
  Heart,
  Plus,
  Mic2,
  ListMusic,
} from "lucide-react";
import { usePlayerStore } from "@/store/usePlayerStore";
import { useLyricsStore } from "@/store/useLyricsStore";
import { useLibraryStore } from "@/store/useLibraryStore";
import { useUIStore } from "@/store/useUIStore";
import AddToLibraryModal from "@/components/library/AddToLibraryModal";
import { cn } from "@/lib/utils";

function formatMs(ms: number) {
  if (!ms || isNaN(ms)) return "0:00";
  const s = Math.floor(ms / 1000);
  const m = Math.floor(s / 60);
  return `${m}:${String(s % 60).padStart(2, "0")}`;
}

export default function PlayerBar() {
  const {
    currentTrack,
    isPlaying,
    isBuffering,
    volume,
    position,
    duration,
    isResolvingStream,
    isFallbackStream,
    isShuffle,
    repeatMode,
    togglePlay,
    next,
    prev,
    seekTo,
    setVolume,
    cycleRepeat,
    toggleShuffle,
  } = usePlayerStore();

  const { toggleLikeTrack, isTrackLiked } = useLibraryStore();
  const {
    openMobilePlayer,
    isRightSidebarOpen,
    toggleRightSidebar,
    setRightSidebarOpen,
    rightPanel,
    setRightPanel,
  } = useUIStore();
  const [isLibraryModalOpen, setIsLibraryModalOpen] = useState(false);
  const router = useRouter();

  const progressRef = useRef<HTMLDivElement>(null);
  const isLiked = currentTrack ? isTrackLiked(currentTrack.id) : false;

  // Fetch lyrics whenever currentTrack changes
  useEffect(() => {
    if (!currentTrack) return;
    const durSec = Math.round((currentTrack.duration || 0) / 1000);
    useLyricsStore.getState().fetchLyrics(currentTrack.name, currentTrack.artistName, durSec);
  }, [currentTrack]);

  // Log track play history
  useEffect(() => {
    if (!currentTrack) return;
    fetch("/api/history", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        trackId: currentTrack.id,
        trackName: currentTrack.name,
        artistName: currentTrack.artistName,
        albumName: currentTrack.albumName,
        albumArt: currentTrack.albumArt,
        duration: currentTrack.duration,
      }),
    }).catch(() => {});
  }, [currentTrack?.id]);

  const handleSeek = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      if (!progressRef.current || !currentTrack) return;
      const rect = progressRef.current.getBoundingClientRect();
      const pct = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
      const totalDuration = duration || currentTrack.duration || 180000;
      seekTo(pct * totalDuration);
    },
    [currentTrack, duration, seekTo]
  );

  const trackDuration = duration || currentTrack?.duration || 180000;
  const pct = Math.min(100, Math.max(0, (position / trackDuration) * 100));

  if (!currentTrack) {
    return (
      <div className="h-20 px-6 flex items-center justify-between text-zinc-500 dark:text-zinc-400">
        <div className="flex items-center gap-3">
          <Disc className="w-5 h-5 text-zinc-400 dark:text-zinc-500 animate-[spin_6s_linear_infinite]" />
          <p className="text-xs font-medium tracking-wide">Select any track to start streaming</p>
        </div>
        <span className="text-[10px] font-mono uppercase bg-black/5 dark:bg-white/5 border border-black/10 dark:border-white/10 px-2.5 py-1 rounded-full text-zinc-600 dark:text-zinc-400">
          Audio Engine Ready
        </span>
      </div>
    );
  }

  return (
    <>
      <div className="h-20 px-3 sm:px-5 lg:px-6 flex items-center justify-between gap-3 sm:gap-4 select-none">
        {/* Current Playing Track Info (Responsive width) */}
        <div
          onClick={() => {
            if (typeof window !== "undefined" && window.innerWidth >= 768) {
              usePlayerStore.getState().setDesktopDetailOpen(true);
            } else {
              openMobilePlayer();
            }
          }}
          className="flex items-center gap-2.5 sm:gap-3.5 w-44 md:w-52 lg:w-64 min-w-0 flex-shrink-0 cursor-pointer group"
          title="Open Track Detail"
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={currentTrack.albumArt}
            alt={currentTrack.albumName}
            className="w-11 h-11 sm:w-12 sm:h-12 rounded-2xl object-cover flex-shrink-0 shadow-lg border border-black/10 dark:border-white/20 transition-transform group-hover:scale-105"
          />
          <div className="min-w-0 flex-1">
            <p className="text-xs font-semibold text-zinc-900 dark:text-white truncate leading-tight group-hover:underline">
              {currentTrack.name}
            </p>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                usePlayerStore.getState().setDesktopDetailOpen(false);
                useUIStore.getState().closeMobilePlayer();
                router.push(`/artist/${encodeURIComponent(currentTrack.artistName)}`);
              }}
              className="text-[11px] text-zinc-600 dark:text-zinc-400 hover:text-indigo-600 dark:hover:text-white truncate mt-0.5 text-left block hover:underline cursor-pointer"
            >
              {currentTrack.artistName}
            </button>
            <div className="hidden sm:flex items-center gap-1.5 mt-1">
              {isResolvingStream || isBuffering ? (
                <span className="inline-flex items-center gap-1 text-[9px] text-amber-600 dark:text-amber-300 font-mono">
                  <Loader2 className="w-2.5 h-2.5 animate-spin" />
                  {isResolvingStream ? "Resolving..." : "Buffering..."}
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 text-[9px] text-emerald-600 dark:text-emerald-400 font-mono bg-emerald-500/10 px-1.5 py-0.5 rounded border border-emerald-500/20">
                  <Sparkles className="w-2.5 h-2.5" />
                  Full Audio Stream
                </span>
              )}
            </div>
          </div>

          {/* Favorite & Library Action Icons */}
          <div className="hidden lg:flex items-center gap-1 flex-shrink-0">
            <button
              onClick={() => toggleLikeTrack(currentTrack)}
              title={isLiked ? "Favorited" : "Favorite"}
              className={cn(
                "p-1.5 rounded-full hover:bg-black/5 dark:hover:bg-white/10 transition-colors",
                isLiked ? "text-rose-500" : "text-zinc-400 hover:text-zinc-900 dark:hover:text-white"
              )}
            >
              <Heart className={cn("w-4 h-4", isLiked && "fill-current")} />
            </button>
            <button
              onClick={() => setIsLibraryModalOpen(true)}
              title="Add to Library"
              className="p-1.5 rounded-full hover:bg-black/5 dark:hover:bg-white/10 text-zinc-400 hover:text-zinc-900 dark:hover:text-white transition-colors"
            >
              <Plus className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Playback Controls & Progress */}
        <div className="flex-1 flex flex-col items-center gap-1.5 max-w-xl mx-auto min-w-0 px-2">
          <div className="flex items-center gap-3 sm:gap-4 md:gap-5 lg:gap-6">
            <button
              onClick={toggleShuffle}
              className={cn(
                "text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white transition-colors",
                isShuffle && "text-indigo-600 dark:text-white font-bold"
              )}
              title="Shuffle"
            >
              <Shuffle className="w-4 h-4" />
            </button>
            <button
              onClick={prev}
              className="text-zinc-700 dark:text-zinc-300 hover:text-zinc-950 dark:hover:text-white transition-colors"
              title="Previous"
            >
              <SkipBack className="w-5 h-5 fill-current" />
            </button>
            <motion.button
              onClick={togglePlay}
              whileTap={{ scale: 0.92 }}
              className="w-10 h-10 rounded-full bg-zinc-950 text-white dark:bg-white dark:text-zinc-950 flex items-center justify-center shadow-lg shadow-black/10 dark:shadow-white/20 hover:scale-105 transition-all"
              title={isBuffering || isResolvingStream ? "Buffering..." : isPlaying ? "Pause" : "Play"}
            >
              {isBuffering || isResolvingStream ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : isPlaying ? (
                <Pause className="w-4 h-4 fill-current" />
              ) : (
                <Play className="w-4 h-4 fill-current ml-0.5" />
              )}
            </motion.button>
            <button
              onClick={next}
              className="text-zinc-700 dark:text-zinc-300 hover:text-zinc-950 dark:hover:text-white transition-colors"
              title="Next"
            >
              <SkipForward className="w-5 h-5 fill-current" />
            </button>
            <button
              onClick={cycleRepeat}
              className={cn(
                "text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white transition-colors",
                repeatMode !== "none" && "text-indigo-600 dark:text-white font-bold"
              )}
              title="Repeat"
            >
              {repeatMode === "one" ? <Repeat1 className="w-4 h-4" /> : <Repeat className="w-4 h-4" />}
            </button>
          </div>

          {/* Scrub Bar */}
          <div className="flex items-center gap-2 sm:gap-2.5 w-full">
            <span className="text-[10px] text-zinc-500 dark:text-zinc-400 font-mono w-8 sm:w-9 text-right">
              {formatMs(position)}
            </span>
            <div
              ref={progressRef}
              onClick={handleSeek}
              className="flex-1 h-1.5 bg-black/10 dark:bg-white/10 hover:h-2 rounded-full cursor-pointer group relative transition-all"
            >
              <div
                className="h-full bg-zinc-900 dark:bg-white rounded-full relative transition-all"
                style={{ width: `${pct}%` }}
              >
                <div className="absolute right-0 top-1/2 -translate-y-1/2 w-3 h-3 bg-zinc-900 dark:bg-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity shadow-md" />
              </div>
            </div>
            <span className="text-[10px] text-zinc-500 dark:text-zinc-400 font-mono w-8 sm:w-9">
              {formatMs(trackDuration)}
            </span>
          </div>
        </div>

        {/* Utility Controls & Volume (Tablet & Desktop) */}
        <div className="hidden md:flex items-center gap-1.5 sm:gap-2 lg:gap-3 w-52 md:w-60 lg:w-72 justify-end flex-shrink-0">
          {/* Lyrics Toggle Button */}
          <button
            onClick={() => {
              if (isRightSidebarOpen && rightPanel === "lyrics") {
                toggleRightSidebar();
              } else {
                setRightPanel("lyrics");
                if (!isRightSidebarOpen) setRightSidebarOpen(true);
              }
            }}
            className={cn(
              "p-2 rounded-xl transition-all cursor-pointer relative",
              isRightSidebarOpen && rightPanel === "lyrics"
                ? "bg-indigo-600 text-white shadow-md shadow-indigo-500/30"
                : "text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white hover:bg-black/5 dark:hover:bg-white/10"
            )}
            title="Real-time Synced Lyrics"
          >
            <Mic2 className="w-4 h-4" />
          </button>

          {/* Up Next Queue Toggle Button */}
          <button
            onClick={() => {
              if (isRightSidebarOpen && rightPanel === "queue") {
                toggleRightSidebar();
              } else {
                setRightPanel("queue");
                if (!isRightSidebarOpen) setRightSidebarOpen(true);
              }
            }}
            className={cn(
              "p-2 rounded-xl transition-all cursor-pointer relative",
              isRightSidebarOpen && rightPanel === "queue"
                ? "bg-indigo-600 text-white shadow-md shadow-indigo-500/30"
                : "text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white hover:bg-black/5 dark:hover:bg-white/10"
            )}
            title="Up Next Queue"
          >
            <ListMusic className="w-4 h-4" />
          </button>

          {/* Volume Controller */}
          <div className="flex items-center gap-1.5 sm:gap-2">
            <button
              onClick={() => setVolume(volume === 0 ? 0.8 : 0)}
              className="text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white transition-colors"
            >
              {volume === 0 ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
            </button>
            <input
              type="range"
              min={0}
              max={1}
              step={0.01}
              value={volume}
              onChange={(e) => setVolume(parseFloat(e.target.value))}
              className="w-16 md:w-20 lg:w-24 h-1 bg-black/10 dark:bg-white/15 rounded-lg appearance-none cursor-pointer accent-zinc-900 dark:accent-white"
            />
          </div>
        </div>
      </div>

      {/* Add To Library Modal */}
      {currentTrack && (
        <AddToLibraryModal
          track={currentTrack}
          isOpen={isLibraryModalOpen}
          onClose={() => setIsLibraryModalOpen(false)}
        />
      )}
    </>
  );
}
