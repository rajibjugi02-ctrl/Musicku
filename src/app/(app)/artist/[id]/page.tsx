"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Heart, Users, ExternalLink, Loader2, Play, Sparkles, ChevronLeft } from "lucide-react";
import TrackCard from "@/components/ui/TrackCard";
import { useLibraryStore } from "@/store/useLibraryStore";
import { usePlayerStore } from "@/store/usePlayerStore";
import type { SpotifyArtist, SpotifyTrack, SpotifyAlbum } from "@/types/music";
import { spotifyTrackToPlayerTrack } from "@/lib/utils";

interface ArtistPageData {
  artist: SpotifyArtist;
  topTracks: SpotifyTrack[];
  albums: SpotifyAlbum[];
}

function formatFollowers(n: number) {
  if (!n) return "1.2M";
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(0)}K`;
  return String(n);
}

export default function ArtistPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [data, setData] = useState<ArtistPageData | null>(null);
  const { toggleLikeArtist, isArtistLiked } = useLibraryStore();
  const { play } = usePlayerStore();

  useEffect(() => {
    if (!id) return;
    fetch(`/api/music?action=artist&id=${encodeURIComponent(id)}`)
      .then((r) => r.json())
      .then(setData)
      .catch(() => {});
  }, [id]);

  if (!data) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-6 h-6 text-indigo-400 animate-spin" />
      </div>
    );
  }

  const { artist, topTracks, albums } = data;
  const heroImg = artist.images?.[0]?.url;
  const playerTracks = topTracks.map(spotifyTrackToPlayerTrack);
  const isLiked = isArtistLiked(artist.id);

  const handlePlayTopTracks = () => {
    if (playerTracks.length > 0) {
      play(playerTracks[0], playerTracks);
    }
  };

  return (
    <div className="flex flex-col relative">
      {/* Top Glass Back Navigation Button */}
      <div className="absolute top-4 left-4 z-20">
        <button
          onClick={() => router.back()}
          className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-black/50 hover:bg-black/70 backdrop-blur-xl border border-white/15 text-white text-xs font-semibold shadow-lg transition-all cursor-pointer hover:scale-105 active:scale-95"
          title="Kembali"
        >
          <ChevronLeft className="w-4 h-4" />
          <span>Kembali</span>
        </button>
      </div>

      {/* Artist Glass Hero Header */}
      <div className="relative h-72 sm:h-80 overflow-hidden">
        {heroImg && (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={heroImg}
            alt={artist.name}
            className="w-full h-full object-cover object-top filter brightness-75 scale-105"
          />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-[#EEF0F6] dark:from-[#08080a] via-[#EEF0F6]/70 dark:via-[#08080a]/60 to-transparent" />
        <div className="absolute bottom-0 left-0 right-0 p-6 sm:p-8 flex items-end justify-between">
          <div>
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full glass-pill text-[11px] font-mono uppercase tracking-widest text-indigo-600 dark:text-indigo-300 mb-2">
              <Sparkles className="w-3 h-3" />
              Artist Profile
            </span>
            <h1 className="text-3xl sm:text-4xl font-bold text-zinc-900 dark:text-white tracking-tight">
              {artist.name}
            </h1>
            <div className="flex items-center gap-4 mt-2 text-xs text-zinc-600 dark:text-zinc-300">
              <span className="flex items-center gap-1.5 font-medium">
                <Users className="w-3.5 h-3.5 text-zinc-400" />
                {formatFollowers(artist.followers?.total || 0)} followers
              </span>
              {artist.genres?.[0] && (
                <span className="capitalize px-2.5 py-0.5 rounded-full glass-card text-[11px] text-zinc-700 dark:text-zinc-300">
                  {artist.genres.slice(0, 2).join(" · ")}
                </span>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2.5">
            {playerTracks.length > 0 && (
              <motion.button
                onClick={handlePlayTopTracks}
                whileTap={{ scale: 0.94 }}
                className="h-11 px-5 rounded-full bg-zinc-950 text-white dark:bg-white dark:text-zinc-950 font-semibold text-xs flex items-center gap-2 shadow-lg hover:scale-105 transition-all cursor-pointer"
              >
                <Play className="w-4 h-4 fill-current ml-0.5" />
                <span>Play All</span>
              </motion.button>
            )}
            <motion.button
              onClick={() => toggleLikeArtist(artist)}
              whileTap={{ scale: 0.9 }}
              className={`w-11 h-11 rounded-full flex items-center justify-center border transition-all cursor-pointer ${
                isLiked
                  ? "bg-rose-500/20 border-rose-500/40 text-rose-500 shadow-lg shadow-rose-500/10"
                  : "glass-card text-zinc-600 dark:text-zinc-300 hover:text-zinc-950 dark:hover:text-white"
              }`}
            >
              <Heart className={`w-4 h-4 ${isLiked ? "fill-current" : ""}`} />
            </motion.button>
            {artist.external_urls?.spotify && (
              <a
                href={artist.external_urls.spotify}
                target="_blank"
                rel="noopener noreferrer"
                className="w-11 h-11 rounded-full flex items-center justify-center glass-card text-zinc-600 dark:text-zinc-300 hover:text-zinc-950 dark:hover:text-white transition-all"
              >
                <ExternalLink className="w-4 h-4" />
              </a>
            )}
          </div>
        </div>
      </div>

      <div className="p-4 sm:p-6 md:p-8 flex flex-col gap-8">
        {/* Top tracks */}
        <section>
          <div className="flex items-center justify-between mb-2">
            <h2 className="text-xs font-bold text-zinc-700 dark:text-zinc-400 uppercase tracking-widest">
              Top Tracks ({playerTracks.length})
            </h2>
          </div>
          <div className="flex gap-3.5 overflow-x-auto pt-3 pb-6 px-2 -mx-2 scrollbar-thin scrollbar-thumb-zinc-300 dark:scrollbar-thumb-white/10">
            {playerTracks.map((t) => (
              <TrackCard key={t.id} track={t} queue={playerTracks} />
            ))}
          </div>
        </section>

        {/* Albums */}
        {albums.length > 0 && (
          <section>
            <h2 className="text-xs font-bold text-zinc-700 dark:text-zinc-400 uppercase tracking-widest mb-3.5">
              Albums & Discography
            </h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4 pt-1 pb-6">
              {albums.map((album) => (
                <div key={album.id} className="glass-card rounded-[22px] p-3 group cursor-pointer select-none">
                  <div className="rounded-[18px] overflow-hidden mb-2.5 aspect-square bg-zinc-200 dark:bg-zinc-900/60 shadow-md">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={album.images?.[0]?.url || "https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=600&h=600&fit=crop"}
                      alt={album.name}
                      onError={(e) => {
                        (e.target as HTMLImageElement).src =
                          "https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=600&h=600&fit=crop";
                      }}
                      className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                    />
                  </div>
                  <p className="text-xs font-semibold text-zinc-900 dark:text-zinc-100 group-hover:text-indigo-600 dark:group-hover:text-white truncate">
                    {album.name}
                  </p>
                  <p className="text-[11px] text-zinc-500 dark:text-zinc-400 font-mono mt-0.5">
                    {album.release_date?.substring(0, 4) || "Album"}
                  </p>
                </div>
              ))}
            </div>
          </section>
        )}
      </div>
    </div>
  );
}
