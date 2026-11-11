"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { Heart } from "lucide-react";
import { useLibraryStore } from "@/store/useLibraryStore";
import type { SpotifyArtist } from "@/types/music";
import { cn } from "@/lib/utils";

interface Props {
  artist: SpotifyArtist;
  className?: string;
}

export default function ArtistCard({ artist, className }: Props) {
  const { toggleLikeArtist, isArtistLiked } = useLibraryStore();
  const isLiked = isArtistLiked(artist.id);
  const img =
    artist.images?.[0]?.url ||
    "https://cdn-images.dzcdn.net/images/artist/973809864ad1c52d8c61238662400089/1000x1000-000000-80-0-0.jpg";

  const handleToggleLike = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    toggleLikeArtist(artist);
  };

  const genreLabel = artist.genres?.[0]
    ? `${artist.genres[0].split(" ").map((w) => w.charAt(0).toUpperCase() + w.slice(1)).join(" ")} Station`
    : "Radio Station";

  return (
    <Link href={`/artist/${artist.id}`} className={cn("block flex-shrink-0 w-36 sm:w-40 select-none", className)}>
      <motion.div
        whileHover={{ y: -3 }}
        whileTap={{ scale: 0.98 }}
        className="group cursor-pointer flex flex-col relative"
      >
        {/* Apple Music Square Ambient Container */}
        <div className="relative w-full aspect-square rounded-[14px] overflow-hidden shadow-md bg-zinc-200 dark:bg-zinc-850 flex items-center justify-center">
          {/* Ambient Blurred Backdrop from Real Artist Picture */}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={img}
            alt=""
            aria-hidden="true"
            className="absolute inset-0 w-full h-full object-cover scale-150 blur-xl opacity-50 dark:opacity-40 select-none pointer-events-none"
          />

          {/* Vignette / Tone Overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-black/20 dark:from-black/60 dark:via-transparent dark:to-black/30 pointer-events-none" />

          {/* Center Circular Artist Portrait (Apple Music Reference) */}
          <div className="relative z-10 w-20 h-20 sm:w-22 sm:h-22 rounded-full overflow-hidden shadow-2xl border-2 border-white/60 dark:border-white/25 transition-transform duration-500 group-hover:scale-108">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={img}
              alt={artist.name}
              className="w-full h-full object-cover"
            />
          </div>

          {/* Heart Favorite Button */}
          <button
            onClick={handleToggleLike}
            title={isLiked ? "Remove from Liked Artists" : "Like Artist"}
            className={cn(
              "absolute top-2 right-2 z-20 w-7 h-7 rounded-full backdrop-blur-md flex items-center justify-center transition-all transform hover:scale-110 cursor-pointer",
              isLiked
                ? "bg-rose-500 text-white opacity-100 shadow-md shadow-rose-500/30"
                : "bg-black/40 hover:bg-black/70 text-white/80 hover:text-white opacity-0 group-hover:opacity-100"
            )}
          >
            <Heart className={cn("w-3.5 h-3.5", isLiked && "fill-current")} />
          </button>
        </div>

        {/* Text Outside & Below Artwork (Left-Aligned, Clean Typography) */}
        <div className="mt-2 text-left w-full">
          <p className="text-[15px] font-semibold text-zinc-950 dark:text-white leading-tight truncate group-hover:text-indigo-600 dark:group-hover:text-white transition-colors">
            {artist.name}
          </p>
          <p className="text-[13px] text-zinc-500 dark:text-zinc-400 leading-tight truncate mt-0.5">
            {genreLabel}
          </p>
        </div>
      </motion.div>
    </Link>
  );
}
