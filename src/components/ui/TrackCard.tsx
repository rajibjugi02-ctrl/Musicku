"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Play, Pause, Heart, Plus } from "lucide-react";
import { usePlayerStore } from "@/store/usePlayerStore";
import { useLibraryStore } from "@/store/useLibraryStore";
import { useUIStore } from "@/store/useUIStore";
import AddToLibraryModal from "@/components/library/AddToLibraryModal";
import type { PlayerTrack } from "@/types/music";
import { cn } from "@/lib/utils";

interface Props {
  track: PlayerTrack;
  queue: PlayerTrack[];
  className?: string;
}

export default function TrackCard({ track, queue, className }: Props) {
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

  const albumArt =
    track.albumArt ||
    "https://cdn-images.dzcdn.net/images/cover/2c45e43a9dc745330386cfc5feee0642/1000x1000-000000-80-0-0.jpg";

  return (
    <>
      <div
        onMouseEnter={handlePrewarm}
        onClick={() => play(track, queue)}
        className={cn("flex-shrink-0 w-36 sm:w-40 group cursor-pointer select-none relative", className)}
      >
        <motion.div
          whileHover={{ y: -3 }}
          whileTap={{ scale: 0.98 }}
          className="flex flex-col w-full"
        >
          {/* Apple Music Frameless Square Artwork (Foto 2 Reference) */}
          <div className="relative w-full aspect-square rounded-[14px] overflow-hidden shadow-md bg-zinc-200 dark:bg-zinc-850">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={albumArt}
              alt={track.albumName || track.name}
              className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
            />

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
              <div className="w-10 h-10 rounded-full bg-white text-zinc-950 flex items-center justify-center shadow-xl transform transition-transform group-hover:scale-105">
                {isActive && isPlaying ? (
                  <Pause className="w-4 h-4 fill-current" />
                ) : (
                  <Play className="w-4 h-4 fill-current ml-0.5" />
                )}
              </div>
            </div>
          </div>

          {/* Left-Aligned Text Outside Below Artwork (Apple Music Reference) */}
          <div className="mt-2 text-left w-full">
            <p
              className={cn(
                "text-[15px] font-semibold truncate leading-tight transition-colors",
                isActive
                  ? "text-indigo-600 dark:text-white font-bold"
                  : "text-zinc-950 dark:text-white group-hover:text-indigo-600 dark:group-hover:text-white"
              )}
            >
              {track.name}
            </p>
            <div className="flex items-center gap-1.5 mt-0.5">
              {track.explicit && (
                <span className="text-[8px] bg-black/10 dark:bg-white/15 text-zinc-700 dark:text-zinc-300 px-1 py-0.2 rounded font-mono font-medium leading-none flex-shrink-0">
                  E
                </span>
              )}
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  usePlayerStore.getState().setDesktopDetailOpen(false);
                  useUIStore.getState().closeMobilePlayer();
                  router.push(`/artist/${encodeURIComponent(track.artistName)}`);
                }}
                className="text-[13px] text-zinc-500 dark:text-zinc-400 hover:text-indigo-600 dark:hover:text-white truncate leading-tight hover:underline cursor-pointer text-left"
              >
                {track.artistName}
              </button>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Add To Library Modal */}
      <AddToLibraryModal
        track={track}
        isOpen={isLibraryModalOpen}
        onClose={() => setIsLibraryModalOpen(false)}
      />
    </>
  );
}
