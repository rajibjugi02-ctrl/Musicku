"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  Heart,
  Users,
  ExternalLink,
  Loader2,
  Play,
  Pause,
  Sparkles,
  ChevronLeft,
  Share2,
  MoreHorizontal,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import SmartCover from "@/components/ui/SmartCover";
import TrackActionMenu from "@/components/player/TrackActionMenu";
import AddToLibraryModal from "@/components/library/AddToLibraryModal";
import { useLibraryStore } from "@/store/useLibraryStore";
import { usePlayerStore } from "@/store/usePlayerStore";
import type { SpotifyArtist, SpotifyTrack, SpotifyAlbum, PlayerTrack } from "@/types/music";
import { spotifyTrackToPlayerTrack, cn, isInstrumentalTrack } from "@/lib/utils";

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

function formatDuration(ms?: number) {
  if (!ms || isNaN(ms)) return "3:30";
  const sec = Math.floor(ms / 1000);
  const min = Math.floor(sec / 60);
  const remSec = sec % 60;
  return `${min}:${remSec.toString().padStart(2, "0")}`;
}

export default function ArtistPage() {
  const params = useParams();
  const rawParam = (params?.id || params?.name || "") as string;
  const artistIdOrName = decodeURIComponent(rawParam);

  const router = useRouter();
  const [data, setData] = useState<ArtistPageData | null>(null);
  const [showAllTracks, setShowAllTracks] = useState(false);
  const [selectedActionTrack, setSelectedActionTrack] = useState<PlayerTrack | null>(null);
  const [isLibraryModalOpen, setIsLibraryModalOpen] = useState(false);
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  const { toggleLikeArtist, isArtistLiked, toggleLikeTrack, isTrackLiked } = useLibraryStore();
  const { play, togglePlay, isPlaying, currentTrack } = usePlayerStore();

  useEffect(() => {
    if (!artistIdOrName) return;
    fetch(`/api/music?action=artist&id=${encodeURIComponent(artistIdOrName)}`)
      .then((r) => r.json())
      .then(setData)
      .catch(() => {});
  }, [artistIdOrName]);

  const showToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 2500);
  };

  if (!data) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] gap-3">
        <Loader2 className="w-7 h-7 text-zinc-400 animate-spin" />
        <p className="text-xs font-mono text-zinc-500 uppercase tracking-widest">
          Loading Artist Profile...
        </p>
      </div>
    );
  }

  const { artist, topTracks, albums } = data;
  const heroImg = artist.images?.[0]?.url;
  const playerTracks = topTracks.map(spotifyTrackToPlayerTrack);
  const isLiked = isArtistLiked(artist.id);

  // Display 8 top tracks by default for a clean layout, with "Lihat Semua" expansion
  const displayedTracks = showAllTracks ? playerTracks : playerTracks.slice(0, 8);

  const handlePlayTopTracks = () => {
    if (playerTracks.length > 0) {
      play(playerTracks[0], playerTracks);
    }
  };

  const handleShareArtist = async () => {
    if (typeof window === "undefined") return;
    const shareUrl = window.location.href;
    if (navigator.share) {
      try {
        await navigator.share({
          title: `${artist.name} di Musicku`,
          text: `Dengarkan lagu-lagu terbaik ${artist.name} di Musicku Liquid Audio.`,
          url: shareUrl,
        });
      } catch {
        // Ignored if cancelled
      }
    } else {
      await navigator.clipboard.writeText(shareUrl);
      showToast("Tautan artis disalin ke clipboard!");
    }
  };

  return (
    <div className="flex flex-col relative w-full overflow-hidden">
      {/* Top Glass Back Navigation Button */}
      <div className="absolute top-4 left-4 z-20">
        <button
          type="button"
          onClick={() => router.back()}
          className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-black/60 hover:bg-black/80 backdrop-blur-xl border border-white/20 text-white text-xs font-semibold shadow-lg transition-all cursor-pointer hover:scale-105 active:scale-95"
          title="Kembali"
        >
          <ChevronLeft className="w-4 h-4" />
          <span>Kembali</span>
        </button>
      </div>

      {/* Artist Hero Header (Responsive: Column on Mobile, Row on Desktop) */}
      <div className="relative min-h-[320px] sm:min-h-[380px] md:min-h-[420px] flex flex-col justify-end overflow-hidden select-none">
        {heroImg && (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={heroImg}
            alt={artist.name}
            className="absolute inset-0 w-full h-full object-cover object-top filter brightness-[0.7] transform-gpu scale-105"
          />
        )}

        {/* Seamless Monochromatic Masking - Liquid Titanium */}
        <div className="absolute inset-0 bg-gradient-to-t from-[#EEF0F6] dark:from-[#070709] via-[#EEF0F6]/85 dark:via-[#070709]/80 to-black/35 pointer-events-none" />

        {/* Header Content Island: Column on mobile, Row on Desktop */}
        <div className="relative z-10 p-4 sm:p-6 md:p-8 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div className="min-w-0 flex-1">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full glass-pill text-[11px] font-mono uppercase tracking-widest text-zinc-700 dark:text-zinc-300 border border-black/10 dark:border-white/15 mb-2.5">
              <Sparkles className="w-3 h-3 text-zinc-500 dark:text-zinc-300" />
              Artist Profile
            </span>
            <h1 className="text-2xl sm:text-3xl md:text-5xl font-extrabold text-zinc-900 dark:text-white tracking-tight leading-tight truncate">
              {artist.name}
            </h1>
            <div className="flex flex-wrap items-center gap-3 sm:gap-4 mt-2.5 text-xs text-zinc-600 dark:text-zinc-300 font-medium">
              <span className="flex items-center gap-1.5">
                <Users className="w-3.5 h-3.5 text-zinc-400" />
                {formatFollowers(artist.followers?.total || 0)} followers
              </span>
              {artist.genres?.[0] && (
                <span className="capitalize px-2.5 py-0.5 rounded-full glass-card text-[11px] text-zinc-700 dark:text-zinc-300 border border-black/5 dark:border-white/10 font-mono">
                  {artist.genres.slice(0, 2).join(" · ")}
                </span>
              )}
            </div>
          </div>

          {/* Action Buttons Row: Never wraps 'Play All' into 2 lines */}
          <div className="flex items-center gap-2.5 sm:gap-3 flex-wrap sm:flex-nowrap shrink-0">
            {playerTracks.length > 0 && (
              <motion.button
                type="button"
                onClick={handlePlayTopTracks}
                whileTap={{ scale: 0.95 }}
                className="h-11 sm:h-12 px-5 sm:px-6 rounded-full bg-zinc-950 text-white dark:bg-white dark:text-zinc-950 font-bold text-xs sm:text-sm flex items-center gap-2 shadow-xl hover:scale-105 active:scale-95 transition-all cursor-pointer whitespace-nowrap shrink-0"
              >
                <Play className="w-4 h-4 fill-current ml-0.5" />
                <span>Play All</span>
              </motion.button>
            )}

            <motion.button
              type="button"
              onClick={() => toggleLikeArtist(artist)}
              whileTap={{ scale: 0.9 }}
              title={isLiked ? "Hapus dari Favorit" : "Tambah ke Favorit"}
              className={cn(
                "w-11 h-11 sm:w-12 sm:h-12 rounded-full flex items-center justify-center border transition-all cursor-pointer shrink-0",
                isLiked
                  ? "bg-rose-500/20 border-rose-500/40 text-rose-500 shadow-lg shadow-rose-500/10"
                  : "glass-card text-zinc-600 dark:text-zinc-300 hover:text-zinc-950 dark:hover:text-white border-black/10 dark:border-white/15"
              )}
            >
              <Heart className={cn("w-4 h-4 sm:w-5 sm:h-5", isLiked && "fill-current")} />
            </motion.button>

            <motion.button
              type="button"
              onClick={handleShareArtist}
              whileTap={{ scale: 0.9 }}
              title="Bagikan Profil Artis"
              className="w-11 h-11 sm:w-12 sm:h-12 rounded-full flex items-center justify-center glass-card text-zinc-600 dark:text-zinc-300 hover:text-zinc-950 dark:hover:text-white border border-black/10 dark:border-white/15 transition-all cursor-pointer shrink-0"
            >
              <Share2 className="w-4 h-4 sm:w-5 sm:h-5" />
            </motion.button>

            {artist.external_urls?.spotify && (
              <a
                href={artist.external_urls.spotify}
                target="_blank"
                rel="noopener noreferrer"
                title="Buka Profil Spotify"
                className="w-11 h-11 sm:w-12 sm:h-12 rounded-full flex items-center justify-center glass-card text-zinc-600 dark:text-zinc-300 hover:text-zinc-950 dark:hover:text-white border border-black/10 dark:border-white/15 transition-all shrink-0"
              >
                <ExternalLink className="w-4 h-4 sm:w-5 sm:h-5" />
              </a>
            )}
          </div>
        </div>
      </div>

      <div className="p-4 sm:p-6 md:p-8 flex flex-col gap-8 w-full">
        {/* Apple Music Track List Grid: 1 Col on Mobile, 2 Cols on Desktop */}
        <section className="w-full">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-xs font-bold text-zinc-700 dark:text-zinc-400 uppercase tracking-widest">
              Top Tracks ({playerTracks.length})
            </h2>
            {playerTracks.length > 8 && (
              <button
                type="button"
                onClick={() => setShowAllTracks(!showAllTracks)}
                className="text-xs font-semibold text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-white transition-colors cursor-pointer flex items-center gap-1"
              >
                <span>{showAllTracks ? "Sembunyikan Sebagian" : "Lihat Semua"}</span>
                {showAllTracks ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
              </button>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-2 sm:gap-2.5">
            {displayedTracks.map((t, idx) => {
              const isRowActive = currentTrack?.id === t.id;
              const isRowLiked = isTrackLiked(t.id);
              const isInst = Boolean(t.isInstrumental || isInstrumentalTrack(t.name, t.albumName));

              return (
                <div
                  key={t.id}
                  onClick={() => {
                    if (isRowActive) {
                      togglePlay();
                    } else {
                      play(t, playerTracks);
                    }
                  }}
                  className={cn(
                    "group flex items-center justify-between p-2 sm:p-2.5 rounded-2xl transition-all cursor-pointer select-none",
                    isRowActive
                      ? "glass-panel bg-zinc-900/10 dark:bg-white/[0.12] border-zinc-900/20 dark:border-white/30 shadow-md"
                      : "glass-card hover:bg-zinc-900/5 dark:hover:bg-white/[0.06] border-black/[0.05] dark:border-white/[0.08]"
                  )}
                >
                  {/* Left: Index / Play Icon + Sharp Square Artwork + Title & Album */}
                  <div className="flex items-center gap-2.5 sm:gap-3.5 min-w-0 flex-1 pr-2">
                    {/* Index or Live Equalizer/Pause */}
                    <div className="w-5 sm:w-6 flex items-center justify-center text-xs font-mono text-zinc-400 dark:text-zinc-500 shrink-0">
                      {isRowActive ? (
                        isPlaying ? (
                          <Pause className="w-3.5 h-3.5 text-zinc-900 dark:text-white fill-current" />
                        ) : (
                          <Play className="w-3.5 h-3.5 text-zinc-900 dark:text-white fill-current ml-0.5" />
                        )
                      ) : (
                        <>
                          <span className="group-hover:hidden">{String(idx + 1).padStart(2, "0")}</span>
                          <Play className="w-3.5 h-3.5 text-zinc-900 dark:text-white fill-current ml-0.5 hidden group-hover:block" />
                        </>
                      )}
                    </div>

                    {/* Sharp Square Cover Artwork (Apple Music iOS Standard) */}
                    <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-xl overflow-hidden shrink-0 shadow-sm border border-black/10 dark:border-white/15 bg-zinc-200 dark:bg-zinc-900 relative">
                      <SmartCover
                        src={t.albumArt}
                        alt={t.name}
                        size={200}
                        className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                      />
                    </div>

                    {/* Full Readable Title, Badges, & Album Info */}
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1.5">
                        <p
                          className={cn(
                            "text-xs sm:text-sm font-semibold truncate leading-tight",
                            isRowActive
                              ? "text-zinc-950 dark:text-white font-bold"
                              : "text-zinc-900 dark:text-zinc-100 group-hover:text-zinc-950 dark:group-hover:text-white"
                          )}
                        >
                          {t.name}
                        </p>
                        {isInst && (
                          <span className="text-[8px] font-mono font-bold bg-black/10 dark:bg-white/20 text-zinc-800 dark:text-white/90 px-1 rounded leading-none shrink-0">
                            INST
                          </span>
                        )}
                        {t.explicit && (
                          <span className="text-[8px] font-bold bg-black/5 dark:bg-white/20 text-zinc-700 dark:text-white/90 px-1 rounded leading-none shrink-0">
                            E
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] sm:text-xs text-zinc-500 dark:text-zinc-400 truncate mt-0.5 leading-tight">
                        {t.albumName || "Single"}
                      </p>
                    </div>
                  </div>

                  {/* Right: Duration + Favorite Button + Three Dots Action Menu */}
                  <div
                    className="flex items-center gap-1.5 sm:gap-2 shrink-0"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <span className="text-[11px] sm:text-xs font-mono text-zinc-400 dark:text-zinc-500 mr-1 sm:mr-2">
                      {formatDuration(t.duration)}
                    </span>

                    <button
                      type="button"
                      onClick={() => toggleLikeTrack(t)}
                      title={isRowLiked ? "Hapus dari Favorit" : "Favorit"}
                      className={cn(
                        "w-8 h-8 rounded-full flex items-center justify-center transition-all cursor-pointer",
                        isRowLiked
                          ? "text-rose-500 hover:text-rose-600"
                          : "text-zinc-400 hover:text-zinc-900 dark:hover:text-white opacity-0 group-hover:opacity-100 sm:opacity-100"
                      )}
                    >
                      <Heart className={cn("w-3.5 h-3.5 sm:w-4 sm:h-4", isRowLiked && "fill-current")} />
                    </button>

                    <button
                      type="button"
                      onClick={() => setSelectedActionTrack(t)}
                      title="Menu Aksi"
                      className="w-8 h-8 rounded-full flex items-center justify-center text-zinc-400 hover:text-zinc-900 dark:hover:text-white hover:bg-black/5 dark:hover:bg-white/10 transition-all cursor-pointer"
                    >
                      <MoreHorizontal className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

          {playerTracks.length > 8 && (
            <div className="flex justify-center mt-3">
              <button
                type="button"
                onClick={() => setShowAllTracks(!showAllTracks)}
                className="px-5 py-2 rounded-full glass-card hover:bg-zinc-900/10 dark:hover:bg-white/10 text-xs font-semibold text-zinc-800 dark:text-zinc-200 transition-all cursor-pointer border border-black/10 dark:border-white/15"
              >
                {showAllTracks
                  ? "Tampilkan Lebih Sedikit"
                  : `Lihat Semua (${playerTracks.length} Lagu) ↓`}
              </button>
            </div>
          )}
        </section>

        {/* Albums & Discography Grid (Lega & Frameless with Bottom Padding for Player) */}
        {albums.length > 0 && (
          <section className="pb-44 md:pb-16 w-full">
            <div className="flex items-center justify-between mb-3.5">
              <h2 className="text-xs font-bold text-zinc-700 dark:text-zinc-400 uppercase tracking-widest">
                Albums & Discography ({albums.length})
              </h2>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 sm:gap-5">
              {albums.map((album) => (
                <div
                  key={album.id}
                  className="glass-card rounded-[22px] p-3 group cursor-pointer select-none transition-all duration-300 hover:-translate-y-1 hover:shadow-lg"
                >
                  <div className="rounded-[18px] overflow-hidden mb-3 aspect-square bg-zinc-200 dark:bg-zinc-850 shadow-md border border-black/[0.06] dark:border-white/10 relative">
                    <SmartCover
                      src={album.images?.[0]?.url}
                      alt={album.name}
                      size={300}
                      className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                    />
                  </div>
                  <p className="text-xs sm:text-sm font-semibold text-zinc-900 dark:text-zinc-100 group-hover:text-indigo-600 dark:group-hover:text-white truncate leading-tight">
                    {album.name}
                  </p>
                  <p className="text-[11px] text-zinc-500 dark:text-zinc-400 font-mono mt-1">
                    {album.release_date?.substring(0, 4) || "Album"}
                    {album.total_tracks ? ` · ${album.total_tracks} tracks` : ""}
                  </p>
                </div>
              ))}
            </div>
          </section>
        )}
      </div>

      {/* Floating Action Menu Sheet & Add to Library Modal */}
      {selectedActionTrack && (
        <>
          <TrackActionMenu
            track={selectedActionTrack}
            isOpen={Boolean(selectedActionTrack)}
            onClose={() => setSelectedActionTrack(null)}
            onOpenPlaylistModal={() => {
              setIsLibraryModalOpen(true);
            }}
          />
          <AddToLibraryModal
            track={selectedActionTrack}
            isOpen={isLibraryModalOpen}
            onClose={() => setIsLibraryModalOpen(false)}
          />
        </>
      )}

      {/* Floating Liquid Toast Notification */}
      <AnimatePresence>
        {toastMsg && (
          <motion.div
            initial={{ opacity: 0, y: 15, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 15, scale: 0.95 }}
            className="fixed bottom-24 inset-x-0 mx-auto w-max z-50 px-4 py-2 rounded-full glass-card bg-zinc-950/90 dark:bg-black/90 text-white text-xs font-medium border border-white/20 shadow-xl pointer-events-none"
          >
            {toastMsg}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
