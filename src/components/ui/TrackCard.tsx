"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Play, Pause, Heart, Plus, Music } from "lucide-react";
import { usePlayerStore } from "@/store/usePlayerStore";
import { useLibraryStore } from "@/store/useLibraryStore";
import AddToLibraryModal from "@/components/library/AddToLibraryModal";
import type { PlayerTrack } from "@/types/music";
import { cn, getOptimizedImageUrl } from "@/lib/utils";

interface Props {
  track: PlayerTrack;
  queue: PlayerTrack[];
  className?: string;
  carousel?: boolean;
}

export default function TrackCard({ track, queue, className, carousel = false }: Props) {
  const router = useRouter();
  const { play, currentTrack, isPlaying, prefetchTrackStream } = usePlayerStore();
  const { toggleLikeTrack, isTrackLiked } = useLibraryStore();

  const [isLibraryModalOpen, setIsLibraryModalOpen] = useState(false);

  const isActive = currentTrack?.id === track.id;
  const isLiked = isTrackLiked(track.id);

  const handlePrewarm = () => {
    prefetchTrackStream(track);
  };

  const handleToggleFavorite = (e: React.MouseEvent) => {
    e.stopPropagation();
    toggleLikeTrack(track);
  };

  const handleOpenLibraryModal = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsLibraryModalOpen(true);
  };

  const rawArt = track.albumArt;
  const optimizedArt = rawArt ? getOptimizedImageUrl(rawArt, 300) : null;

  return (
    <>
      <div
        onMouseEnter={handlePrewarm}
        onClick={() => play(track, queue)}
        className={cn(
          "group cursor-pointer select-none relative",
          carousel ? "w-[150px] sm:w-[175px] shrink-0" : "w-full min-w-0",
          className
        )}
      >
        <motion.div
          whileHover={{ y: -3 }}
          whileTap={{ scale: 0.98 }}
          className="flex flex-col w-full min-w-0"
        >
          {/* Apple Music Frameless Square Artwork */}
          <div className="relative w-full aspect-square rounded-[16px] overflow-hidden shadow-sm hover:shadow-md bg-zinc-200 dark:bg-zinc-850 border border-black/[0.06] dark:border-white/10 flex items-center justify-center transition-all duration-300">
            {optimizedArt ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={optimizedArt}
                alt={track.albumName || track.name}
                loading="lazy"
                decoding="async"
                className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
              />
            ) : (
              <div className="w-full h-full flex flex-col items-center justify-center bg-gradient-to-br from-zinc-200 via-zinc-100 to-zinc-300 dark:from-zinc-800 dark:via-zinc-900 dark:to-zinc-950 text-zinc-400 dark:text-zinc-500">
                <Music className="w-10 h-10 stroke-[1.5]" />
              </div>
            )}

            {/* Subtle Gradient Shade for Top Floating Actions */}
            <div className="absolute inset-x-0 top-0 h-14 bg-gradient-to-b from-black/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />

            {/* Top Floating Actions: Add-to-Library & Favorite */}
            <div className="absolute top-2 inset-x-2 flex items-center justify-between z-10">
              <button
                onClick={handleOpenLibraryModal}
                title="Add to Library"
                className="w-7 h-7 rounded-full bg-black/40 hover:bg-black/70 backdrop-blur-md text-white/90 hover:text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all transform hover:scale-110 cursor-pointer shadow-sm"
              >
                <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
              </button>

              <button
                onClick={handleToggleFavorite}
                title={isLiked ? "Remove from Favorites" : "Favorite"}
                className={cn(
                  "w-7 h-7 rounded-full backdrop-blur-md flex items-center justify-center transition-all transform hover:scale-110 cursor-pointer shadow-sm",
                  isLiked
                    ? "bg-rose-500 text-white opacity-100 shadow-rose-500/30"
                    : "bg-black/40 hover:bg-black/70 text-white/90 hover:text-white opacity-0 group-hover:opacity-100"
                )}
              >
                <Heart className={cn("w-3.5 h-3.5", isLiked && "fill-current")} />
              </button>
            </div>

            {/* Center Play Overlay */}
            <div
              className={cn(
                "absolute inset-0 bg-black/35 backdrop-blur-[1px] flex items-center justify-center transition-opacity duration-200",
                isActive ? "opacity-100" : "opacity-0 group-hover:opacity-100"
              )}
            >
              <div className="w-11 h-11 rounded-full bg-white dark:bg-white text-zinc-950 flex items-center justify-center shadow-xl transform transition-transform group-hover:scale-110 active:scale-95">
                {isActive && isPlaying ? (
                  <Pause className="w-5 h-5 fill-current" />
                ) : (
                  <Play className="w-5 h-5 fill-current ml-0.5" />
                )}
              </div>
            </div>
          </div>

          {/* Text Below Artwork */}
          <div className="mt-2 text-left w-full min-w-0">
            <p
              className={cn(
                "text-[14px] sm:text-[15px] font-semibold leading-tight truncate transition-colors",
                isActive
                  ? "text-indigo-600 dark:text-indigo-400 font-bold"
                  : "text-zinc-950 dark:text-white group-hover:text-indigo-600 dark:group-hover:text-white"
              )}
            >
              {track.name}
            </p>
            <p className="text-[12px] sm:text-[13px] text-zinc-500 dark:text-zinc-400 leading-tight truncate mt-0.5">
              {track.artistName}
            </p>
          </div>
        </motion.div>
      </div>

      {/* Add To Library Modal Dialog */}
      <AddToLibraryModal
        isOpen={isLibraryModalOpen}
        onClose={() => setIsLibraryModalOpen(false)}
        track={track}
      />
    </>
  );
}
