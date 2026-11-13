"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { Heart, User } from "lucide-react";
import { useLibraryStore } from "@/store/useLibraryStore";
import type { SpotifyArtist } from "@/types/music";
import { cn, getOptimizedImageUrl } from "@/lib/utils";

interface Props {
  artist: SpotifyArtist;
  className?: string;
  carousel?: boolean;
}

export default function ArtistCard({ artist, className, carousel = false }: Props) {
  const { toggleLikeArtist, isArtistLiked } = useLibraryStore();
  const isLiked = isArtistLiked(artist.id);

  const rawImage = artist.images?.[0]?.url;
  const optimizedImage = rawImage ? getOptimizedImageUrl(rawImage, 300) : null;

  const handleToggleLike = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    toggleLikeArtist(artist);
  };

  const genreLabel = artist.genres?.[0]
    ? `${artist.genres[0].split(" ").map((w) => w.charAt(0).toUpperCase() + w.slice(1)).join(" ")} Station`
    : "Radio Station";

  return (
    <Link
      href={`/artist/${artist.id}`}
      className={cn(
        "block select-none",
        carousel ? "w-[150px] sm:w-[175px] shrink-0" : "w-full min-w-0",
        className
      )}
    >
      <motion.div
        whileHover={{ y: -3 }}
        whileTap={{ scale: 0.98 }}
        className="group cursor-pointer flex flex-col relative w-full"
      >
        {/* Apple Music Square Ambient Container (Optimized: No heavy dual-image blur filter) */}
        <div className="relative w-full aspect-square rounded-[18px] overflow-hidden shadow-sm hover:shadow-md bg-gradient-to-b from-zinc-200/80 via-zinc-100/90 to-zinc-300/80 dark:from-zinc-800/80 dark:via-zinc-900/90 dark:to-zinc-950 border border-black/[0.06] dark:border-white/10 flex items-center justify-center transition-all duration-300">
          {/* Subtle Tone Vignette */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-transparent pointer-events-none" />

          {/* Center Circular Artist Portrait */}
          <div className="relative z-10 w-[58%] aspect-square rounded-full overflow-hidden shadow-xl border-2 border-white/80 dark:border-white/20 transition-transform duration-500 group-hover:scale-105 bg-zinc-300 dark:bg-zinc-800 flex items-center justify-center">
            {optimizedImage ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={optimizedImage}
                alt={artist.name}
                loading="lazy"
                decoding="async"
                className="w-full h-full object-cover transition-opacity duration-200"
              />
            ) : (
              <User className="w-8 h-8 text-zinc-500 dark:text-zinc-400" />
            )}
          </div>

          {/* Heart Favorite Button */}
          <button
            onClick={handleToggleLike}
            title={isLiked ? "Remove from Liked Artists" : "Like Artist"}
            className={cn(
              "absolute top-2.5 right-2.5 z-20 w-7 h-7 rounded-full backdrop-blur-md flex items-center justify-center transition-all transform hover:scale-110 cursor-pointer shadow-sm",
              isLiked
                ? "bg-rose-500 text-white opacity-100 shadow-rose-500/30"
                : "bg-black/40 hover:bg-black/70 text-white/80 hover:text-white opacity-0 group-hover:opacity-100"
            )}
          >
            <Heart className={cn("w-3.5 h-3.5", isLiked && "fill-current")} />
          </button>
        </div>

        {/* Text Outside & Below Artwork */}
        <div className="mt-2 text-left w-full min-w-0">
          <p className="text-[14px] sm:text-[15px] font-semibold text-zinc-950 dark:text-white leading-tight truncate group-hover:text-indigo-600 dark:group-hover:text-white transition-colors">
            {artist.name}
          </p>
          <p className="text-[12px] sm:text-[13px] text-zinc-500 dark:text-zinc-400 leading-tight truncate mt-0.5">
            {genreLabel}
          </p>
        </div>
      </motion.div>
    </Link>
  );
}
