"use client";

import { motion } from "framer-motion";
import { Play, Pause, SkipForward, Heart, Loader2 } from "lucide-react";
import { usePlayerStore } from "@/store/usePlayerStore";
import { useLibraryStore } from "@/store/useLibraryStore";
import { useUIStore } from "@/store/useUIStore";
import MobileNowPlayingSheet from "./MobileNowPlayingSheet";
import { cn } from "@/lib/utils";

export default function MobileMiniPlayer() {
  const {
    currentTrack,
    isPlaying,
    isBuffering,
    isResolvingStream,
    position,
    duration,
    togglePlay,
    next,
  } = usePlayerStore();

  const { isTrackLiked, toggleLikeTrack } = useLibraryStore();
  const { openMobilePlayer } = useUIStore();

  if (!currentTrack) return null;

  const trackDuration = duration || currentTrack.duration || 180000;
  const pct = Math.min(100, Math.max(0, (position / trackDuration) * 100));
  const isLiked = isTrackLiked(currentTrack.id);

  return (
    <>
      {/* Floating Apple Music Mini Player Capsule (Positioned cleanly 8px above the 62px bottom navbar) */}
      <div className="md:hidden fixed bottom-[86px] inset-x-3 z-40 select-none">
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ type: "spring", stiffness: 350, damping: 28 }}
          whileTap={{ scale: 0.98 }}
          onClick={openMobilePlayer}
          style={{
            WebkitBackdropFilter: "blur(36px) saturate(200%)",
            backdropFilter: "blur(36px) saturate(200%)",
          }}
          className="relative flex items-center justify-between p-2 rounded-[22px] bg-white/80 dark:bg-zinc-950/75 border border-black/10 dark:border-white/[0.16] shadow-[0_12px_35px_rgba(0,0,0,0.18)] dark:shadow-[0_16px_45px_rgba(0,0,0,0.6)] backdrop-blur-3xl backdrop-saturate-[200%] cursor-pointer overflow-hidden"
        >
          {/* Subtle Progress Bar at Bottom of Mini Capsule */}
          <div className="absolute bottom-0 inset-x-0 h-[2px] bg-black/5 dark:bg-white/10">
            <div
              className="h-full bg-zinc-950 dark:bg-white transition-all duration-150"
              style={{ width: `${pct}%` }}
            />
          </div>

          {/* Left: Album Artwork + Title & Artist */}
          <div className="flex items-center gap-3 min-w-0 flex-1 pr-2">
            <div className="relative w-10 h-10 rounded-[14px] overflow-hidden flex-shrink-0 shadow-md border border-black/10 dark:border-white/20">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={currentTrack.albumArt}
                alt={currentTrack.name}
                className={cn(
                  "w-full h-full object-cover transition-transform duration-500",
                  isPlaying && "scale-105"
                )}
              />
            </div>

            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-1.5">
                <p className="text-xs font-bold text-zinc-900 dark:text-white truncate leading-tight">
                  {currentTrack.name}
                </p>
                <span className="text-[8px] font-bold bg-black/5 dark:bg-white/20 text-zinc-700 dark:text-white/90 px-1 rounded leading-none flex-shrink-0">
                  E
                </span>
              </div>
              <p className="text-[11px] text-zinc-600 dark:text-zinc-400 truncate mt-0.5">
                {currentTrack.artistName}
              </p>
            </div>
          </div>

          {/* Right: Quick Action Controls */}
          <div
            onClick={(e) => e.stopPropagation()}
            className="flex items-center gap-1 flex-shrink-0"
          >
            {/* Favorite Star / Heart */}
            <button
              onClick={() => toggleLikeTrack(currentTrack)}
              className="p-2 rounded-full hover:bg-black/5 dark:hover:bg-white/10 active:scale-90 transition-transform cursor-pointer"
            >
              <Heart
                className={cn(
                  "w-4 h-4 transition-colors",
                  isLiked ? "text-rose-500 fill-current" : "text-zinc-400 dark:text-zinc-400"
                )}
              />
            </button>

            {/* Play / Pause Button */}
            <motion.button
              whileTap={{ scale: 0.9 }}
              onClick={togglePlay}
              className="w-9 h-9 rounded-full bg-zinc-950 text-white dark:bg-white dark:text-zinc-950 flex items-center justify-center shadow-md hover:scale-105 transition-all cursor-pointer"
            >
              {isBuffering || isResolvingStream ? (
                <Loader2 className="w-4 h-4 animate-spin text-zinc-400 dark:text-zinc-600" />
              ) : isPlaying ? (
                <Pause className="w-4 h-4 fill-current" />
              ) : (
                <Play className="w-4 h-4 fill-current ml-0.5" />
              )}
            </motion.button>

            {/* Next Track Button */}
            <button
              onClick={next}
              className="p-2 rounded-full text-zinc-600 dark:text-zinc-300 hover:text-zinc-950 dark:hover:text-white active:scale-90 transition-transform cursor-pointer"
            >
              <SkipForward className="w-4 h-4 fill-current" />
            </button>
          </div>
        </motion.div>
      </div>

      {/* Full-Screen Apple Music Slide-Up Sheet */}
      <MobileNowPlayingSheet />
    </>
  );
}
