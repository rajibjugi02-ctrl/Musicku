"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  ChevronLeft,
  Play,
  Pause,
  Heart,
  Plus,
  Share2,
  Sparkles,
  Info,
  Disc,
  Radio,
  ExternalLink,
  Loader2,
  Mic2,
  ListMusic,
} from "lucide-react";
import { usePlayerStore } from "@/store/usePlayerStore";
import { useLibraryStore } from "@/store/useLibraryStore";
import AddToLibraryModal from "@/components/library/AddToLibraryModal";
import ShareLyricsModal from "./ShareLyricsModal";
import TrackCreditsModal from "./TrackCreditsModal";
import LyricsPanel from "@/components/lyrics/LyricsPanel";
import QueuePanel from "@/components/queue/QueuePanel";
import type { PlayerTrack, SpotifyTrack } from "@/types/music";
import { spotifyTrackToPlayerTrack, cn } from "@/lib/utils";

export default function DesktopTrackDetailSheet() {
  const router = useRouter();
  const {
    currentTrack,
    isPlaying,
    togglePlay,
    play,
    setDesktopDetailOpen,
    audioQuality,
    queue,
  } = usePlayerStore();

  const { isTrackLiked, toggleLikeTrack } = useLibraryStore();

  const [activeTab, setActiveTab] = useState<"lyrics" | "queue" | "tracks">("lyrics");
  const [artistTracks, setArtistTracks] = useState<PlayerTrack[]>([]);
  const [isLoadingArtist, setIsLoadingArtist] = useState(false);
  const [isLibraryModalOpen, setIsLibraryModalOpen] = useState(false);
  const [isShareLyricsOpen, setIsShareLyricsOpen] = useState(false);
  const [isCreditsOpen, setIsCreditsOpen] = useState(false);

  const isLiked = currentTrack ? isTrackLiked(currentTrack.id) : false;

  // Fetch more songs by this artist
  useEffect(() => {
    if (!currentTrack?.artistName) return;
    setIsLoadingArtist(true);

    fetch(`/api/music?action=artist&id=${encodeURIComponent(currentTrack.artistName)}`)
      .then((res) => res.json())
      .then((data) => {
        if (data?.topTracks && Array.isArray(data.topTracks)) {
          const mapped = data.topTracks.map(spotifyTrackToPlayerTrack);
          setArtistTracks(mapped);
        }
      })
      .catch(() => {})
      .finally(() => setIsLoadingArtist(false));
  }, [currentTrack?.artistName]);

  if (!currentTrack) return null;

  const handleArtistClick = () => {
    setDesktopDetailOpen(false);
    router.push(`/artist/${encodeURIComponent(currentTrack.artistName)}`);
  };

  const handleClose = () => {
    setDesktopDetailOpen(false);
  };

  return (
    <>
      <motion.div
        key="desktop-track-detail"
        initial={{ y: "100%", opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: "100%", opacity: 0 }}
        transition={{ type: "spring", stiffness: 280, damping: 28, mass: 0.9 }}
        className="flex-1 min-w-0 glass-panel rounded-[28px] overflow-y-auto overscroll-contain scrollbar-thin scrollbar-thumb-white/10 scrollbar-track-transparent relative flex flex-col transform-gpu select-none"
      >
        {/* Dynamic Specular Background Layer */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden rounded-[28px]">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={currentTrack.albumArt}
            alt=""
            className="w-full h-full object-cover blur-[100px] opacity-25 scale-125 transform-gpu"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-transparent to-black/60" />
        </div>

        {/* Top Sticky Navigation Bar */}
        <div className="sticky top-0 z-30 flex items-center justify-between p-5 pb-3 backdrop-blur-2xl bg-white/[0.02] dark:bg-black/[0.2] border-b border-black/[0.06] dark:border-white/[0.08]">
          <button
            onClick={handleClose}
            className="group inline-flex items-center gap-2 px-4 py-2 rounded-full glass-card hover:bg-white/15 dark:hover:bg-white/10 text-zinc-900 dark:text-white text-xs font-semibold border border-black/10 dark:border-white/10 transition-all cursor-pointer shadow-sm hover:scale-105 active:scale-95"
            title="Tutup & Kembali ke Tampilan Biasa"
          >
            <ChevronLeft className="w-4 h-4 transition-transform group-hover:-translate-x-0.5" />
            <span>Kembali</span>
          </button>

          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full glass-pill text-[11px] font-mono uppercase tracking-widest text-indigo-600 dark:text-indigo-300">
              <Sparkles className="w-3 h-3 text-amber-400" />
              Now Playing Studio Detail
            </span>
            {audioQuality === "hi-res" ? (
              <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-amber-400/20 text-amber-300 border border-amber-400/30">
                24-BIT / 192KHZ ALAC
              </span>
            ) : (
              <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-indigo-400/20 text-indigo-200 border border-indigo-400/30">
                LOSSLESS AUDIO
              </span>
            )}
          </div>
        </div>

        {/* Hero Section */}
        <div className="relative z-10 p-6 lg:p-8 flex flex-col md:flex-row items-center md:items-end gap-6 lg:gap-8 border-b border-black/[0.06] dark:border-white/[0.08]">
          {/* Large Album Artwork */}
          <motion.div
            animate={{ scale: isPlaying ? 1 : 0.95 }}
            transition={{ type: "spring", stiffness: 220, damping: 20 }}
            className="relative w-56 h-56 sm:w-64 sm:h-64 lg:w-72 lg:h-72 rounded-[32px] overflow-hidden shadow-[0_25px_60px_rgba(0,0,0,0.55)] border border-white/20 shrink-0"
          >
            <Image
              src={currentTrack.albumArt || "/images/placeholder.jpg"}
              alt={currentTrack.name}
              fill
              className="object-cover"
              sizes="(max-width: 1024px) 256px, 288px"
              priority
            />
          </motion.div>

          {/* Track Metadata & Quick Controls */}
          <div className="flex-1 min-w-0 text-center md:text-left">
            <span className="inline-block text-[11px] font-semibold uppercase tracking-wider text-indigo-500 dark:text-indigo-400 mb-1.5">
              {currentTrack.albumName || "Single Release"}
            </span>
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-zinc-950 dark:text-white tracking-tight truncate leading-tight mb-2">
              {currentTrack.name}
            </h1>

            {/* Clickable Artist Name */}
            <div className="flex items-center justify-center md:justify-start gap-2 mb-4">
              <button
                onClick={handleArtistClick}
                className="text-base sm:text-lg font-semibold text-zinc-700 dark:text-zinc-300 hover:text-indigo-600 dark:hover:text-white transition-colors hover:underline cursor-pointer flex items-center gap-1.5"
              >
                <span>{currentTrack.artistName}</span>
                <ExternalLink className="w-3.5 h-3.5 opacity-60" />
              </button>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-wrap items-center justify-center md:justify-start gap-2.5 pt-1">
              <motion.button
                onClick={togglePlay}
                whileTap={{ scale: 0.95 }}
                className="h-11 px-6 rounded-full bg-zinc-950 text-white dark:bg-white dark:text-zinc-950 font-semibold text-xs flex items-center gap-2 shadow-xl hover:scale-105 active:scale-95 transition-all cursor-pointer"
              >
                {isPlaying ? (
                  <>
                    <Pause className="w-4 h-4 fill-current" />
                    <span>Pause</span>
                  </>
                ) : (
                  <>
                    <Play className="w-4 h-4 fill-current ml-0.5" />
                    <span>Play</span>
                  </>
                )}
              </motion.button>

              <button
                onClick={() => toggleLikeTrack(currentTrack)}
                className={cn(
                  "h-11 px-4 rounded-full glass-card border flex items-center gap-1.5 text-xs font-medium transition cursor-pointer hover:bg-white/10",
                  isLiked
                    ? "text-rose-500 border-rose-500/40 bg-rose-500/10"
                    : "text-zinc-700 dark:text-zinc-300 border-black/10 dark:border-white/10"
                )}
              >
                <Heart className={cn("w-4 h-4", isLiked && "fill-current")} />
                <span>{isLiked ? "Favorited" : "Favorite"}</span>
              </button>

              <button
                onClick={() => setIsLibraryModalOpen(true)}
                className="h-11 px-4 rounded-full glass-card border border-black/10 dark:border-white/10 text-zinc-700 dark:text-zinc-300 hover:text-zinc-950 dark:hover:text-white hover:bg-white/10 transition text-xs font-medium flex items-center gap-1.5 cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>Add to Playlist</span>
              </button>

              <button
                onClick={() => setIsShareLyricsOpen(true)}
                className="h-11 px-4 rounded-full glass-card border border-black/10 dark:border-white/10 text-zinc-700 dark:text-zinc-300 hover:text-zinc-950 dark:hover:text-white hover:bg-white/10 transition text-xs font-medium flex items-center gap-1.5 cursor-pointer"
              >
                <Share2 className="w-4 h-4" />
                <span>Share Lyrics</span>
              </button>

              <button
                onClick={() => setIsCreditsOpen(true)}
                className="h-11 px-3.5 rounded-full glass-card border border-black/10 dark:border-white/10 text-zinc-700 dark:text-zinc-300 hover:text-zinc-950 dark:hover:text-white hover:bg-white/10 transition text-xs font-medium flex items-center gap-1.5 cursor-pointer"
                title="View Track Audio Credits"
              >
                <Info className="w-4 h-4" />
                <span>Credits</span>
              </button>
            </div>
          </div>
        </div>

        {/* Segmented Detail Content Tabs (Lyrics | Up Next Queue | More Tracks) */}
        <div className="relative z-10 px-6 lg:px-8 pt-5 pb-2">
          <div className="inline-flex p-1 rounded-2xl glass-card bg-black/5 dark:bg-white/[0.06] border border-black/[0.08] dark:border-white/[0.08] gap-1">
            <button
              onClick={() => setActiveTab("lyrics")}
              className={cn(
                "flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer",
                activeTab === "lyrics"
                  ? "bg-white text-zinc-950 dark:bg-white dark:text-zinc-950 shadow-md font-bold"
                  : "text-zinc-600 dark:text-zinc-400 hover:text-zinc-950 dark:hover:text-white"
              )}
            >
              <Mic2 className="w-3.5 h-3.5" />
              <span>Lirik Lagu</span>
            </button>
            <button
              onClick={() => setActiveTab("queue")}
              className={cn(
                "flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer",
                activeTab === "queue"
                  ? "bg-white text-zinc-950 dark:bg-white dark:text-zinc-950 shadow-md font-bold"
                  : "text-zinc-600 dark:text-zinc-400 hover:text-zinc-950 dark:hover:text-white"
              )}
            >
              <ListMusic className="w-3.5 h-3.5" />
              <span>Antrean Lagu ({queue.length})</span>
            </button>
            <button
              onClick={() => setActiveTab("tracks")}
              className={cn(
                "flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer",
                activeTab === "tracks"
                  ? "bg-white text-zinc-950 dark:bg-white dark:text-zinc-950 shadow-md font-bold"
                  : "text-zinc-600 dark:text-zinc-400 hover:text-zinc-950 dark:hover:text-white"
              )}
            >
              <Disc className="w-3.5 h-3.5" />
              <span>Lagu Lainnya</span>
            </button>
          </div>
        </div>

        {/* Tab 1: Live Real-Time Synced Lyrics */}
        {activeTab === "lyrics" && (
          <div className="relative z-10 px-6 lg:px-8 py-4 flex-1 flex flex-col min-h-0">
            <div className="h-[460px] sm:h-[500px] lg:h-[560px] rounded-3xl glass-card overflow-hidden border border-black/[0.06] dark:border-white/[0.08] shadow-inner">
              <LyricsPanel />
            </div>
          </div>
        )}

        {/* Tab 2: Up Next Queue Stream */}
        {activeTab === "queue" && (
          <div className="relative z-10 px-6 lg:px-8 py-4 flex-1 flex flex-col min-h-0">
            <div className="h-[460px] sm:h-[500px] lg:h-[560px] rounded-3xl glass-card overflow-hidden border border-black/[0.06] dark:border-white/[0.08] shadow-inner">
              <QueuePanel />
            </div>
          </div>
        )}

        {/* Tab 3: More Tracks From This Artist */}
        {activeTab === "tracks" && (
          <div className="relative z-10 p-6 lg:p-8 flex-1">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-xs font-bold uppercase tracking-widest text-zinc-500 dark:text-zinc-400">
                  More from {currentTrack.artistName}
                </h2>
                <p className="text-xs text-zinc-400 mt-0.5">
                  Koleksi lagu populer dan rilisan terkait artis ini
                </p>
              </div>

              <button
                onClick={handleArtistClick}
                className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:underline cursor-pointer flex items-center gap-1"
              >
                <span>Buka Profil Artis</span>
                <ChevronLeft className="w-3.5 h-3.5 rotate-180" />
              </button>
            </div>

            {isLoadingArtist ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="w-6 h-6 animate-spin text-indigo-500" />
              </div>
            ) : artistTracks.length === 0 ? (
              <div className="text-center py-10 text-zinc-500 text-xs">
                <Disc className="w-8 h-8 mx-auto mb-2 opacity-40 animate-[spin_8s_linear_infinite]" />
                <span>Tidak ada lagu tambahan yang ditemukan untuk artis ini.</span>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
                {artistTracks.slice(0, 8).map((t, index) => {
                  const isCurrent = t.id === currentTrack.id;
                  return (
                    <div
                      key={t.id}
                      onClick={() => play(t, artistTracks)}
                      className={cn(
                        "flex items-center justify-between p-2.5 rounded-2xl border transition-all cursor-pointer group",
                        isCurrent
                          ? "bg-indigo-600/15 border-indigo-500/30 text-white"
                          : "glass-card hover:bg-white/10 border-black/[0.06] dark:border-white/[0.06]"
                      )}
                    >
                      <div className="flex items-center gap-3 min-w-0 flex-1">
                        <span className="w-5 text-center text-xs font-mono text-zinc-500 group-hover:hidden">
                          {index + 1}
                        </span>
                        <Play className="w-4 h-4 fill-current hidden group-hover:block shrink-0 text-indigo-500" />
                        <div className="relative w-10 h-10 rounded-xl overflow-hidden bg-zinc-800 shrink-0 shadow-sm">
                          <Image
                            src={t.albumArt || "/images/placeholder.jpg"}
                            alt={t.name}
                            fill
                            className="object-cover"
                            sizes="40px"
                          />
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="text-xs font-semibold text-zinc-900 dark:text-white truncate">
                            {t.name}
                          </p>
                          <p className="text-[11px] text-zinc-500 dark:text-zinc-400 truncate">
                            {t.artistName}
                          </p>
                        </div>
                      </div>

                      <span className="text-[11px] text-zinc-400 font-mono tabular-nums px-2">
                        {Math.floor(t.duration / 60000)}:
                        {String(Math.floor((t.duration % 60000) / 1000)).padStart(2, "0")}
                      </span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </motion.div>

      {/* Add To Library Modal */}
      <AddToLibraryModal
        track={currentTrack}
        isOpen={isLibraryModalOpen}
        onClose={() => setIsLibraryModalOpen(false)}
      />

      {/* Share Lyrics Modal */}
      <ShareLyricsModal
        track={currentTrack}
        isOpen={isShareLyricsOpen}
        onClose={() => setIsShareLyricsOpen(false)}
      />

      {/* Track Credits Modal */}
      <TrackCreditsModal
        track={currentTrack}
        isOpen={isCreditsOpen}
        onClose={() => setIsCreditsOpen(false)}
      />
    </>
  );
}
