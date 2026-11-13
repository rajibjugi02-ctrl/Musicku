"use client";

import { useState, useRef, useEffect, useMemo } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  Sparkles,
  Play,
  Pause,
  Share2,
  Download,
  Calendar,
  Clock,
  Music,
  Users,
  ChevronLeft,
  ChevronRight,
  X,
  Check,
  Disc3,
  Award,
  Flame,
  Volume2,
  VolumeX,
} from "lucide-react";
import { useReplayStore, type PeriodReport, type ReplayTrackSummary } from "@/store/useReplayStore";
import { usePlayerStore } from "@/store/usePlayerStore";
import { cn } from "@/lib/utils";

const MONTH_NAMES = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

export default function ReplayPage() {
  const router = useRouter();
  const {
    activePeriodType,
    selectedMonth,
    selectedYear,
    setActivePeriodType,
    setSelectedMonth,
    setSelectedYear,
    getPeriodReport,
  } = useReplayStore();

  const { play, isPlaying, togglePlay, currentTrack } = usePlayerStore();

  // Active Period Report
  const report: PeriodReport = useMemo(() => {
    return getPeriodReport(activePeriodType);
  }, [getPeriodReport, activePeriodType, selectedMonth, selectedYear]);

  // Modal states
  const [isStoryOpen, setIsStoryOpen] = useState(false);
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 2500);
  };

  const currentYearInt = new Date().getFullYear();
  const currentMonthInt = new Date().getMonth() + 1;

  // Track play helper
  const handlePlayTrack = (track: ReplayTrackSummary) => {
    play(
      {
        id: track.id,
        uri: `spotify:track:${track.id}`,
        name: track.name,
        artistName: track.artistName,
        albumName: track.albumName,
        albumArt: track.albumArt,
        duration: track.duration,
        previewUrl: null,
        explicit: false,
      },
      report.topTracks.map((t) => ({
        id: t.id,
        uri: `spotify:track:${t.id}`,
        name: t.name,
        artistName: t.artistName,
        albumName: t.albumName,
        albumArt: t.albumArt,
        duration: t.duration,
        previewUrl: null,
        explicit: false,
      }))
    );
  };

  return (
    <div className="p-4 sm:p-6 md:p-8 flex flex-col gap-6 max-w-6xl mx-auto w-full select-none pb-44 md:pb-12 text-zinc-950 dark:text-zinc-100">
      {/* Toast Alert */}
      <AnimatePresence>
        {toastMessage && (
          <motion.div
            initial={{ opacity: 0, y: -20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.95 }}
            className="fixed top-6 inset-x-4 mx-auto max-w-xs z-[150] glass-panel bg-black/85 text-white text-xs font-semibold py-2.5 px-4 rounded-2xl shadow-2xl flex items-center justify-center gap-2 border border-white/20"
          >
            <Check className="w-4 h-4 text-emerald-400" />
            <span>{toastMessage}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ─────────────────────────────────────────────────────────────
          1. TOP NAVIGATION & HERO HEADER
         ───────────────────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-black/[0.08] dark:border-white/[0.08]">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full glass-pill text-[11px] font-mono tracking-wider text-indigo-600 dark:text-indigo-400 mb-2">
            <Sparkles className="w-3.5 h-3.5" />
            <span>MUSICKU REPLAY TELEMETRY</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-zinc-950 dark:text-white">
            {report.periodLabel}
          </h1>
          <p className="text-xs sm:text-sm text-zinc-600 dark:text-zinc-400 mt-0.5">
            Rangkuman kebiasaan mendengarkan musik, artis favorit, dan listening aura kamu
          </p>
        </div>

        <div className="flex items-center gap-2.5 self-start sm:self-center flex-wrap">
          <button
            onClick={() => setIsStoryOpen(true)}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-full bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 text-white text-xs font-bold shadow-lg shadow-indigo-500/25 hover:scale-105 active:scale-95 transition-all cursor-pointer"
          >
            <Play className="w-3.5 h-3.5 fill-current" />
            <span>Play Story Recap</span>
          </button>

          <button
            onClick={() => setIsShareModalOpen(true)}
            className="inline-flex items-center gap-2 px-3.5 py-2.5 rounded-full glass-card hover:bg-black/5 dark:hover:bg-white/10 text-xs font-semibold border border-black/10 dark:border-white/10 text-zinc-800 dark:text-zinc-200 transition-all cursor-pointer"
          >
            <Share2 className="w-3.5 h-3.5" />
            <span>Share Card</span>
          </button>
        </div>
      </div>

      {/* ─────────────────────────────────────────────────────────────
          2. PERIOD TOGGLE CAPSULE (Monthly vs Yearly + Pickers)
         ───────────────────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-2 rounded-2xl glass-panel bg-white/70 dark:bg-white/[0.03] border border-black/[0.08] dark:border-white/[0.08]">
        {/* Toggle Mode: Monthly vs Yearly */}
        <div className="flex items-center p-1 rounded-xl glass-card bg-black/5 dark:bg-black/20 gap-1 w-full sm:w-auto">
          <button
            onClick={() => setActivePeriodType("month")}
            className={cn(
              "flex-1 sm:flex-initial px-4 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer",
              activePeriodType === "month"
                ? "bg-white text-zinc-950 dark:bg-zinc-800 dark:text-white shadow-sm"
                : "text-zinc-600 dark:text-zinc-400 hover:text-zinc-950 dark:hover:text-white"
            )}
          >
            Monthly Recap
          </button>
          <button
            onClick={() => setActivePeriodType("year")}
            className={cn(
              "flex-1 sm:flex-initial px-4 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer",
              activePeriodType === "year"
                ? "bg-white text-zinc-950 dark:bg-zinc-800 dark:text-white shadow-sm"
                : "text-zinc-600 dark:text-zinc-400 hover:text-zinc-950 dark:hover:text-white"
            )}
          >
            Yearly Wrapped
          </button>
        </div>

        {/* Sub-selector for Months or Years */}
        {activePeriodType === "month" ? (
          <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-1">
            {MONTH_NAMES.slice(0, currentMonthInt).map((name, idx) => {
              const monthKey = `${currentYearInt}-${String(idx + 1).padStart(2, "0")}`;
              const isSelected = selectedMonth === monthKey;
              return (
                <button
                  key={monthKey}
                  onClick={() => setSelectedMonth(monthKey)}
                  className={cn(
                    "px-3 py-1 rounded-full text-xs font-medium whitespace-nowrap transition-all cursor-pointer",
                    isSelected
                      ? "bg-indigo-600 text-white font-bold shadow-sm"
                      : "glass-card text-zinc-600 dark:text-zinc-400 hover:text-zinc-950 dark:hover:text-white"
                  )}
                >
                  {name.slice(0, 3)}
                </button>
              );
            })}
          </div>
        ) : (
          <div className="flex items-center gap-1.5">
            {[currentYearInt, currentYearInt - 1].map((year) => {
              const yearStr = String(year);
              const isSelected = selectedYear === yearStr;
              return (
                <button
                  key={yearStr}
                  onClick={() => setSelectedYear(yearStr)}
                  className={cn(
                    "px-3.5 py-1 rounded-full text-xs font-medium transition-all cursor-pointer",
                    isSelected
                      ? "bg-indigo-600 text-white font-bold shadow-sm"
                      : "glass-card text-zinc-600 dark:text-zinc-400 hover:text-zinc-950 dark:hover:text-white"
                  )}
                >
                  {yearStr}
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* ─────────────────────────────────────────────────────────────
          3. APPLE MUSIC REPLAY BENTO GRID
         ───────────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {/* BENTO 1: TOTAL MINUTES & MILESTONE (Span 2 cols on lg) */}
        <div className="md:col-span-2 rounded-[28px] glass-panel p-6 sm:p-8 relative overflow-hidden flex flex-col justify-between border border-black/10 dark:border-white/10 shadow-lg bg-gradient-to-br from-indigo-950/20 via-transparent to-purple-950/20 dark:from-indigo-950/40 dark:to-purple-950/30">
          <div className="flex items-center justify-between mb-4">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full glass-pill text-[11px] font-mono font-bold text-indigo-600 dark:text-indigo-400 uppercase">
              <Clock className="w-3.5 h-3.5" />
              <span>Listening Time</span>
            </span>
            <span className="text-[11px] font-bold px-2.5 py-1 rounded-full bg-amber-400/20 text-amber-600 dark:text-amber-300 border border-amber-400/30 flex items-center gap-1">
              <Award className="w-3.5 h-3.5" />
              <span>{report.milestoneBadge}</span>
            </span>
          </div>

          <div className="my-2">
            <div className="text-4xl sm:text-6xl font-black text-zinc-950 dark:text-white tracking-tight">
              {report.totalMinutes.toLocaleString()}
            </div>
            <p className="text-sm sm:text-base font-semibold text-zinc-600 dark:text-zinc-400 mt-1">
              Total Menit Mendengarkan di {report.periodLabel}
            </p>
          </div>

          <div className="grid grid-cols-2 gap-3 pt-4 border-t border-black/[0.08] dark:border-white/[0.08] mt-4">
            <div>
              <p className="text-xs text-zinc-500">Lagu Diputar</p>
              <p className="text-xl font-bold text-zinc-950 dark:text-white mt-0.5">
                {report.totalTracksPlayed} tracks
              </p>
            </div>
            <div>
              <p className="text-xs text-zinc-500">Artis Berbeda</p>
              <p className="text-xl font-bold text-zinc-950 dark:text-white mt-0.5">
                {report.uniqueArtistsCount} artists
              </p>
            </div>
          </div>
        </div>

        {/* BENTO 2: SPOTLIGHT #1 TOP TRACK (Span 1 or 2 cols) */}
        {report.topTrack ? (
          <div className="md:col-span-1 lg:col-span-2 rounded-[28px] glass-panel p-6 relative overflow-hidden flex flex-col justify-between border border-black/10 dark:border-white/10 shadow-lg group">
            {/* Ambient artwork blur */}
            <div className="absolute inset-0 pointer-events-none overflow-hidden opacity-30 dark:opacity-25">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={report.topTrack.albumArt}
                alt=""
                className="w-full h-full object-cover blur-2xl scale-150"
              />
            </div>

            <div className="relative z-10 flex items-center justify-between mb-3">
              <span className="text-[11px] font-mono font-bold uppercase tracking-widest text-indigo-600 dark:text-indigo-400">
                #1 Top Track
              </span>
              <span className="text-xs font-mono font-bold px-2 py-0.5 rounded-full glass-card text-zinc-700 dark:text-zinc-300">
                {report.topTrack.playCount}x Plays
              </span>
            </div>

            <div className="relative z-10 flex items-center gap-4 my-2">
              <div className="relative w-20 h-20 sm:w-24 sm:h-24 rounded-2xl overflow-hidden shadow-xl border border-black/15 dark:border-white/20 flex-shrink-0 group-hover:scale-105 transition-transform">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={report.topTrack.albumArt}
                  alt={report.topTrack.name}
                  className="w-full h-full object-cover"
                />
                <button
                  onClick={() => handlePlayTrack(report.topTrack!)}
                  className="absolute inset-0 m-auto w-10 h-10 rounded-full bg-white/90 text-zinc-950 flex items-center justify-center shadow-lg hover:scale-110 active:scale-95 transition-all opacity-0 group-hover:opacity-100 cursor-pointer"
                  title="Play Track"
                >
                  <Play className="w-5 h-5 fill-current ml-0.5" />
                </button>
              </div>

              <div className="min-w-0 flex-1">
                <h3 className="text-lg sm:text-xl font-extrabold text-zinc-950 dark:text-white truncate leading-tight">
                  {report.topTrack.name}
                </h3>
                <p className="text-xs sm:text-sm font-semibold text-zinc-600 dark:text-zinc-400 truncate mt-0.5">
                  {report.topTrack.artistName}
                </p>
                <p className="text-[11px] text-zinc-400 dark:text-zinc-500 font-mono mt-1">
                  {report.topTrack.albumName}
                </p>
              </div>
            </div>

            <div className="relative z-10 pt-3 border-t border-black/[0.08] dark:border-white/[0.08] flex items-center justify-between text-xs text-zinc-500">
              <span>Durasi total: {report.topTrack.totalMinutes} menit</span>
              <button
                onClick={() => handlePlayTrack(report.topTrack!)}
                className="font-bold text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1 cursor-pointer"
              >
                <span>Putar Sekarang</span>
                <Play className="w-3 h-3 fill-current" />
              </button>
            </div>
          </div>
        ) : null}

        {/* BENTO 3: SPOTLIGHT #1 TOP ARTIST */}
        {report.topArtist ? (
          <div className="md:col-span-1 rounded-[28px] glass-panel p-6 relative overflow-hidden flex flex-col justify-between border border-black/10 dark:border-white/10 shadow-lg group">
            <div className="flex items-center justify-between mb-3">
              <span className="text-[11px] font-mono font-bold uppercase tracking-widest text-indigo-600 dark:text-indigo-400">
                #1 Top Artist
              </span>
              <Flame className="w-4 h-4 text-orange-500" />
            </div>

            <div className="flex flex-col items-center text-center my-2">
              <div className="w-20 h-20 rounded-full overflow-hidden shadow-xl border-2 border-black/15 dark:border-white/20 mb-3 group-hover:scale-108 transition-transform duration-500">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={report.topArtist.image}
                  alt={report.topArtist.name}
                  className="w-full h-full object-cover"
                />
              </div>
              <h4 className="text-base font-extrabold text-zinc-950 dark:text-white truncate max-w-full">
                {report.topArtist.name}
              </h4>
              <p className="text-xs text-zinc-500 mt-0.5">
                {report.topArtist.playCount} lagu diputar
              </p>
            </div>

            <div className="text-center pt-2 border-t border-black/[0.08] dark:border-white/[0.08]">
              <span className="text-[11px] font-mono text-zinc-500">Artis paling sering kamu putar</span>
            </div>
          </div>
        ) : null}

        {/* BENTO 4: LISTENING AURA & PERSONA */}
        <div className="md:col-span-2 lg:col-span-3 rounded-[28px] glass-panel p-6 sm:p-7 relative overflow-hidden flex flex-col sm:flex-row items-center gap-6 border border-black/10 dark:border-white/10 shadow-lg bg-gradient-to-r from-purple-950/20 via-indigo-950/20 to-pink-950/20">
          <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-3xl bg-gradient-to-br from-indigo-500 via-purple-600 to-pink-500 flex items-center justify-center text-4xl shadow-xl shadow-indigo-500/25 flex-shrink-0 animate-pulse">
            {report.aura.emoji}
          </div>

          <div className="flex-1 text-center sm:text-left">
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-white/10 dark:bg-white/15 text-[10px] font-mono font-bold tracking-wider text-indigo-500 dark:text-indigo-300 uppercase mb-1">
              <span>{report.aura.vibe}</span>
            </div>
            <h3 className="text-xl sm:text-2xl font-black text-zinc-950 dark:text-white tracking-tight">
              {report.aura.name}
            </h3>
            <p className="text-xs sm:text-sm font-medium text-zinc-700 dark:text-zinc-300 mt-1 max-w-xl">
              {report.aura.description}
            </p>
            <p className="text-[11px] font-mono text-zinc-500 dark:text-zinc-400 mt-2">
              Persona: {report.aura.tagline}
            </p>
          </div>
        </div>
      </div>

      {/* ─────────────────────────────────────────────────────────────
          4. TOP 5 TRACKS & TOP 5 ARTISTS LISTS
         ───────────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
        {/* Top 5 Tracks List */}
        <section className="glass-panel rounded-[28px] p-6 border border-black/10 dark:border-white/10 shadow-md">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xs font-bold uppercase tracking-widest text-zinc-700 dark:text-zinc-300 flex items-center gap-2">
              <Music className="w-4 h-4 text-indigo-500" />
              <span>Top 5 Tracks</span>
            </h2>
            <span className="text-[11px] font-mono text-zinc-400">Play Count</span>
          </div>

          <div className="flex flex-col gap-2.5">
            {report.topTracks.map((t, idx) => (
              <div
                key={t.id}
                onClick={() => handlePlayTrack(t)}
                className="flex items-center justify-between p-2.5 rounded-2xl glass-card hover:bg-black/5 dark:hover:bg-white/10 border border-black/[0.04] dark:border-white/[0.06] transition-all cursor-pointer group"
              >
                <div className="flex items-center gap-3.5 min-w-0 flex-1">
                  <span className="w-5 text-center text-xs font-mono font-bold text-zinc-400 group-hover:text-indigo-500">
                    {idx + 1}
                  </span>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={t.albumArt}
                    alt={t.name}
                    className="w-11 h-11 rounded-xl object-cover shadow-sm border border-black/10 dark:border-white/15 flex-shrink-0"
                  />
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-bold text-zinc-950 dark:text-white truncate group-hover:text-indigo-600 dark:group-hover:text-indigo-300">
                      {t.name}
                    </p>
                    <p className="text-[11px] text-zinc-500 truncate mt-0.5">
                      {t.artistName}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 pl-2">
                  <span className="text-xs font-mono font-semibold text-zinc-600 dark:text-zinc-400">
                    {t.playCount}x
                  </span>
                  <div className="w-7 h-7 rounded-full bg-zinc-950 dark:bg-white text-white dark:text-zinc-950 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity shadow-sm">
                    <Play className="w-3 h-3 fill-current ml-0.5" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Top 5 Artists List */}
        <section className="glass-panel rounded-[28px] p-6 border border-black/10 dark:border-white/10 shadow-md">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xs font-bold uppercase tracking-widest text-zinc-700 dark:text-zinc-300 flex items-center gap-2">
              <Users className="w-4 h-4 text-purple-500" />
              <span>Top 5 Artists</span>
            </h2>
            <span className="text-[11px] font-mono text-zinc-400">Plays</span>
          </div>

          <div className="flex flex-col gap-2.5">
            {report.topArtists.map((a, idx) => (
              <div
                key={a.name}
                onClick={() => router.push(`/artist/${encodeURIComponent(a.name)}`)}
                className="flex items-center justify-between p-2.5 rounded-2xl glass-card hover:bg-black/5 dark:hover:bg-white/10 border border-black/[0.04] dark:border-white/[0.06] transition-all cursor-pointer group"
              >
                <div className="flex items-center gap-3.5 min-w-0 flex-1">
                  <span className="w-5 text-center text-xs font-mono font-bold text-zinc-400 group-hover:text-purple-500">
                    {idx + 1}
                  </span>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={a.image}
                    alt={a.name}
                    className="w-11 h-11 rounded-full object-cover shadow-sm border border-black/10 dark:border-white/15 flex-shrink-0"
                  />
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-bold text-zinc-950 dark:text-white truncate group-hover:text-purple-600 dark:group-hover:text-purple-300">
                      {a.name}
                    </p>
                    <p className="text-[11px] text-zinc-500 truncate mt-0.5">
                      Favorite Artist
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 pl-2">
                  <span className="text-xs font-mono font-semibold text-zinc-600 dark:text-zinc-400">
                    {a.playCount} plays
                  </span>
                  <ChevronRight className="w-4 h-4 text-zinc-400 group-hover:translate-x-0.5 transition-transform" />
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>

      {/* ─────────────────────────────────────────────────────────────
          5. INTERACTIVE STORY MODE (Instagram / Spotify Wrapped Style)
         ───────────────────────────────────────────────────────────── */}
      <AnimatePresence>
        {isStoryOpen && (
          <InteractiveStoryModal
            report={report}
            onClose={() => setIsStoryOpen(false)}
            onPlayTrack={handlePlayTrack}
          />
        )}
      </AnimatePresence>

      {/* ─────────────────────────────────────────────────────────────
          6. SHARE REPLAY POSTER CARD MODAL (HTML5 Canvas PNG Generator)
         ───────────────────────────────────────────────────────────── */}
      <AnimatePresence>
        {isShareModalOpen && (
          <SharePosterModal
            report={report}
            onClose={() => setIsShareModalOpen(false)}
            onShowToast={showToast}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

// ────────────────────────────────────────────────────────────────────────────
// COMPONENT: INTERACTIVE STORY MODE MODAL
// ────────────────────────────────────────────────────────────────────────────
function InteractiveStoryModal({
  report,
  onClose,
  onPlayTrack,
}: {
  report: PeriodReport;
  onClose: () => void;
  onPlayTrack: (t: ReplayTrackSummary) => void;
}) {
  const [currentSlide, setCurrentSlide] = useState(0);
  const TOTAL_SLIDES = 4;
  const SLIDE_DURATION = 6000; // 6 seconds per slide

  // Auto-play #1 track on open
  useEffect(() => {
    if (report.topTrack) {
      onPlayTrack(report.topTrack);
    }
  }, []);

  // Slide timer
  useEffect(() => {
    const timer = setTimeout(() => {
      if (currentSlide < TOTAL_SLIDES - 1) {
        setCurrentSlide((s) => s + 1);
      } else {
        onClose();
      }
    }, SLIDE_DURATION);

    return () => clearTimeout(timer);
  }, [currentSlide, onClose]);

  const handleNext = () => {
    if (currentSlide < TOTAL_SLIDES - 1) {
      setCurrentSlide((s) => s + 1);
    } else {
      onClose();
    }
  };

  const handlePrev = () => {
    if (currentSlide > 0) {
      setCurrentSlide((s) => s - 1);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[200] bg-black flex items-center justify-center select-none"
    >
      {/* 9:16 Aspect Ratio Story Frame */}
      <div className="relative w-full max-w-md h-full sm:h-[88dvh] sm:rounded-[36px] overflow-hidden flex flex-col justify-between p-6 bg-gradient-to-b from-[#141829] via-[#0d101e] to-black text-white shadow-2xl border border-white/10">
        {/* Living Ambient Glow from Top Track */}
        {report.topTrack && (
          <div className="absolute inset-0 pointer-events-none overflow-hidden opacity-40">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={report.topTrack.albumArt}
              alt=""
              className="w-full h-full object-cover blur-[90px] scale-150"
            />
          </div>
        )}

        {/* Top Progress Bars */}
        <div className="relative z-30 flex items-center gap-1.5 pt-2">
          {[...Array(TOTAL_SLIDES)].map((_, idx) => (
            <div
              key={idx}
              className="flex-1 h-1 bg-white/20 rounded-full overflow-hidden"
            >
              <div
                className={cn(
                  "h-full bg-white transition-all duration-100",
                  idx < currentSlide ? "w-full" : idx === currentSlide ? "w-full animate-[progress_6s_linear]" : "w-0"
                )}
              />
            </div>
          ))}
        </div>

        {/* Top Controls: Label & Close */}
        <div className="relative z-30 flex items-center justify-between pt-3">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-lg bg-indigo-600 flex items-center justify-center shadow-md">
              <Sparkles className="w-3.5 h-3.5 text-white" />
            </div>
            <span className="text-xs font-mono font-bold tracking-wider uppercase text-white/80">
              Musicku Replay • {report.periodLabel}
            </span>
          </div>

          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-black/40 hover:bg-black/60 backdrop-blur-md flex items-center justify-center text-white/80 hover:text-white transition-all cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Story Slide Content with Animated Transitions */}
        <div className="relative z-20 flex-1 flex flex-col items-center justify-center text-center my-6 min-h-0">
          <AnimatePresence mode="wait">
            {/* SLIDE 1: TOTAL MINUTES */}
            {currentSlide === 0 && (
              <motion.div
                key="slide-1"
                initial={{ opacity: 0, scale: 0.9, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.9, y: -20 }}
                transition={{ duration: 0.45 }}
                className="flex flex-col items-center gap-4"
              >
                <div className="w-16 h-16 rounded-full glass-pill flex items-center justify-center text-indigo-400">
                  <Clock className="w-8 h-8" />
                </div>
                <span className="text-xs font-mono uppercase tracking-widest text-indigo-300">
                  Total Waktu Mendengar
                </span>
                <h2 className="text-6xl sm:text-7xl font-black text-white tracking-tight">
                  {report.totalMinutes.toLocaleString()}
                </h2>
                <p className="text-lg font-bold text-white/90">Menit Bersama Musikmu</p>
                <div className="px-4 py-1.5 rounded-full glass-card text-xs font-mono text-amber-300 border border-amber-400/30">
                  🏆 {report.milestoneBadge}
                </div>
              </motion.div>
            )}

            {/* SLIDE 2: TOP TRACK #1 */}
            {currentSlide === 1 && report.topTrack && (
              <motion.div
                key="slide-2"
                initial={{ opacity: 0, scale: 0.9, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.9, y: -20 }}
                transition={{ duration: 0.45 }}
                className="flex flex-col items-center gap-4"
              >
                <span className="text-xs font-mono uppercase tracking-widest text-pink-400">
                  Lagu Nomor #1 Kamu
                </span>
                <div className="w-48 h-48 sm:w-56 sm:h-56 rounded-3xl overflow-hidden shadow-2xl border-2 border-white/25 relative animate-[spin_30s_linear_infinite]">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={report.topTrack.albumArt}
                    alt={report.topTrack.name}
                    className="w-full h-full object-cover"
                  />
                </div>
                <div>
                  <h3 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
                    {report.topTrack.name}
                  </h3>
                  <p className="text-base text-white/70 font-semibold mt-1">
                    {report.topTrack.artistName}
                  </p>
                </div>
                <p className="text-xs font-mono text-white/50">
                  Diputar sebanyak {report.topTrack.playCount} kali
                </p>
              </motion.div>
            )}

            {/* SLIDE 3: TOP ARTIST #1 & COUNTDOWN */}
            {currentSlide === 2 && report.topArtist && (
              <motion.div
                key="slide-3"
                initial={{ opacity: 0, scale: 0.9, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.9, y: -20 }}
                transition={{ duration: 0.45 }}
                className="flex flex-col items-center gap-4"
              >
                <span className="text-xs font-mono uppercase tracking-widest text-purple-400">
                  Artis Nomor #1 Kamu
                </span>
                <div className="w-36 h-36 rounded-full overflow-hidden shadow-2xl border-4 border-purple-500/40">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={report.topArtist.image}
                    alt={report.topArtist.name}
                    className="w-full h-full object-cover"
                  />
                </div>
                <div>
                  <h3 className="text-2xl sm:text-3xl font-extrabold text-white">
                    {report.topArtist.name}
                  </h3>
                  <p className="text-xs text-white/60 font-mono mt-1">
                    {report.topArtist.playCount} total pemutaran lagu
                  </p>
                </div>
              </motion.div>
            )}

            {/* SLIDE 4: LISTENING AURA & PERSONA */}
            {currentSlide === 3 && (
              <motion.div
                key="slide-4"
                initial={{ opacity: 0, scale: 0.9, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.9, y: -20 }}
                transition={{ duration: 0.45 }}
                className="flex flex-col items-center gap-4"
              >
                <span className="text-xs font-mono uppercase tracking-widest text-emerald-400">
                  Listening Aura & Persona
                </span>
                <div className="text-6xl animate-bounce my-2">{report.aura.emoji}</div>
                <h3 className="text-3xl font-black text-white">{report.aura.name}</h3>
                <p className="text-xs sm:text-sm text-white/80 max-w-xs leading-relaxed">
                  {report.aura.description}
                </p>
                <div className="inline-flex px-3.5 py-1 rounded-full glass-card text-xs font-mono text-indigo-300 border border-indigo-400/30">
                  Vibe: {report.aura.vibe}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Tap zones for Story navigation */}
        <div className="absolute inset-y-16 inset-x-0 z-10 flex">
          <div className="w-1/2 h-full cursor-pointer" onClick={handlePrev} />
          <div className="w-1/2 h-full cursor-pointer" onClick={handleNext} />
        </div>

        {/* Story Bottom Footer */}
        <div className="relative z-30 flex items-center justify-between pt-3 border-t border-white/10 text-xs text-white/60">
          <span>Ketuk sisi kanan untuk lanjut</span>
          <span className="font-mono">
            {currentSlide + 1} / {TOTAL_SLIDES}
          </span>
        </div>
      </div>
    </motion.div>
  );
}

// ────────────────────────────────────────────────────────────────────────────
// COMPONENT: SHARE REPLAY POSTER CARD MODAL (HTML5 CANVAS)
// ────────────────────────────────────────────────────────────────────────────
function SharePosterModal({
  report,
  onClose,
  onShowToast,
}: {
  report: PeriodReport;
  onClose: () => void;
  onShowToast: (msg: string) => void;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [dataUrl, setDataUrl] = useState<string | null>(null);

  // Render poster on HTML5 canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    canvas.width = 1080;
    canvas.height = 1350; // 4:5 Instagram Portrait

    // Background Gradient (Dark Liquid Glass)
    const bgGradient = ctx.createLinearGradient(0, 0, 1080, 1350);
    bgGradient.addColorStop(0, "#0d1021");
    bgGradient.addColorStop(0.5, "#151833");
    bgGradient.addColorStop(1, "#07080f");
    ctx.fillStyle = bgGradient;
    ctx.fillRect(0, 0, 1080, 1350);

    // Accent Orbs
    const drawOrb = (x: number, y: number, r: number, color: string) => {
      const g = ctx.createRadialGradient(x, y, 0, x, y, r);
      g.addColorStop(0, color);
      g.addColorStop(1, "transparent");
      ctx.fillStyle = g;
      ctx.fillRect(x - r, y - r, r * 2, r * 2);
    };

    drawOrb(900, 200, 450, "rgba(99, 102, 241, 0.25)");
    drawOrb(200, 1100, 500, "rgba(236, 72, 153, 0.22)");

    // Header Branding
    ctx.fillStyle = "#ffffff";
    ctx.font = "bold 44px sans-serif";
    ctx.fillText("MUSICKU REPLAY", 80, 130);

    ctx.fillStyle = "rgba(255, 255, 255, 0.65)";
    ctx.font = "600 28px monospace";
    ctx.fillText(report.periodLabel.toUpperCase(), 80, 180);

    // Card Container (Liquid Glass effect)
    ctx.fillStyle = "rgba(255, 255, 255, 0.05)";
    ctx.strokeStyle = "rgba(255, 255, 255, 0.15)";
    ctx.lineWidth = 3;
    ctx.roundRect(80, 240, 920, 860, 44);
    ctx.fill();
    ctx.stroke();

    // Total Minutes Header
    ctx.fillStyle = "rgba(255, 255, 255, 0.7)";
    ctx.font = "bold 26px monospace";
    ctx.fillText("TOTAL LISTENING TIME", 140, 320);

    ctx.fillStyle = "#ffffff";
    ctx.font = "900 82px sans-serif";
    ctx.fillText(`${report.totalMinutes.toLocaleString()} MINS`, 140, 410);

    // #1 Track Artwork & Details
    if (report.topTrack) {
      ctx.fillStyle = "rgba(255, 255, 255, 0.7)";
      ctx.font = "bold 24px monospace";
      ctx.fillText("#1 TOP TRACK", 140, 500);

      ctx.fillStyle = "#ffffff";
      ctx.font = "bold 42px sans-serif";
      ctx.fillText(report.topTrack.name.slice(0, 26), 140, 560);

      ctx.fillStyle = "rgba(255, 255, 255, 0.75)";
      ctx.font = "600 30px sans-serif";
      ctx.fillText(report.topTrack.artistName, 140, 610);
    }

    // Top 5 Tracks summary
    ctx.fillStyle = "rgba(255, 255, 255, 0.6)";
    ctx.font = "bold 22px monospace";
    ctx.fillText("TOP 5 PLAYLIST:", 140, 710);

    report.topTracks.slice(0, 5).forEach((t, i) => {
      ctx.fillStyle = "#ffffff";
      ctx.font = "600 26px sans-serif";
      ctx.fillText(`${i + 1}. ${t.name.slice(0, 28)} - ${t.artistName.slice(0, 16)}`, 140, 760 + i * 48);
    });

    // Listening Persona Badge at bottom of card
    ctx.fillStyle = "rgba(99, 102, 241, 0.25)";
    ctx.strokeStyle = "rgba(99, 102, 241, 0.5)";
    ctx.roundRect(140, 1010, 800, 64, 20);
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = "#ffffff";
    ctx.font = "bold 26px sans-serif";
    ctx.fillText(`${report.aura.emoji} Listening Aura: ${report.aura.name}`, 170, 1052);

    // Footer
    ctx.fillStyle = "rgba(255, 255, 255, 0.4)";
    ctx.font = "600 24px monospace";
    ctx.fillText("Dengarkan musik favoritmu di musicku.app", 80, 1220);

    setDataUrl(canvas.toDataURL("image/png"));
  }, [report]);

  const handleDownload = () => {
    if (!dataUrl) return;
    const a = document.createElement("a");
    a.href = dataUrl;
    a.download = `Musicku-Replay-${report.periodKey}.png`;
    a.click();
    onShowToast("Poster Replay berhasil diunduh!");
  };

  const handleShareWhatsApp = () => {
    const text = encodeURIComponent(
      `🎵 Raport Musicku Replay saya (${report.periodLabel}):\n` +
      `⏱️ Total Mendengarkan: ${report.totalMinutes} Menit\n` +
      `🔥 Lagu #1: ${report.topTrack?.name} - ${report.topTrack?.artistName}\n` +
      `👑 Artis #1: ${report.topArtist?.name}\n` +
      `✨ Listening Persona: ${report.aura.name}\n\n` +
      `Cek raport musik kamu di Musicku!`
    );
    window.open(`https://wa.me/?text=${text}`, "_blank");
  };

  const handleNativeShare = async () => {
    if (!dataUrl) return;
    try {
      const res = await fetch(dataUrl);
      const blob = await res.blob();
      const file = new File([blob], `Musicku-Replay-${report.periodKey}.png`, { type: "image/png" });

      if (navigator.canShare && navigator.canShare({ files: [file] })) {
        await navigator.share({
          files: [file],
          title: `Musicku Replay • ${report.periodLabel}`,
          text: `Ini raport musik saya di Musicku Replay! Lagu #1: ${report.topTrack?.name}`,
        });
        onShowToast("Berhasil membagikan poster!");
      } else {
        handleDownload();
      }
    } catch {
      handleDownload();
    }
  };

  return (
    <div className="fixed inset-0 z-[200] bg-black/75 backdrop-blur-2xl flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 15 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 15 }}
        className="w-full max-w-md rounded-[32px] glass-panel bg-white/95 dark:bg-zinc-900/95 border border-black/10 dark:border-white/15 p-6 shadow-2xl flex flex-col gap-5 text-zinc-950 dark:text-white"
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Share2 className="w-4 h-4 text-indigo-500" />
            <h3 className="text-base font-extrabold tracking-tight">Share Replay Card</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full hover:bg-black/5 dark:hover:bg-white/10 text-zinc-400 hover:text-zinc-950 dark:hover:text-white transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Hidden Canvas for High-Res PNG generation */}
        <canvas ref={canvasRef} className="hidden" />

        {/* Live Poster Preview */}
        {dataUrl && (
          <div className="rounded-2xl overflow-hidden shadow-xl border border-black/10 dark:border-white/10 aspect-[4/5] relative bg-black">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={dataUrl} alt="Replay Poster" className="w-full h-full object-cover" />
          </div>
        )}

        {/* Action Buttons */}
        <div className="grid grid-cols-2 gap-2.5">
          <button
            onClick={handleShareWhatsApp}
            className="flex items-center justify-center gap-2 py-3 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-md transition-all cursor-pointer active:scale-95"
          >
            <span>WhatsApp</span>
          </button>

          <button
            onClick={handleNativeShare}
            className="flex items-center justify-center gap-2 py-3 rounded-2xl bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white text-xs font-bold shadow-md transition-all cursor-pointer active:scale-95"
          >
            <span>Instagram / Share</span>
          </button>
        </div>

        <button
          onClick={handleDownload}
          className="flex items-center justify-center gap-2 py-2.5 rounded-2xl glass-card hover:bg-black/5 dark:hover:bg-white/10 text-xs font-bold border border-black/10 dark:border-white/10 transition-all cursor-pointer"
        >
          <Download className="w-4 h-4" />
          <span>Download Gambar PNG</span>
        </button>
      </motion.div>
    </div>
  );
}

