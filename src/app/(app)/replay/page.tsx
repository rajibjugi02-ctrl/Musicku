"use client";

import { useState, useRef, useEffect, useMemo, useCallback } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  X,
  Play,
  Pause,
  Share2,
  Download,
  Clock,
  Music,
  Users,
  ChevronLeft,
  ChevronRight,
  RotateCcw,
  Volume2,
  VolumeX,
  Award,
  Flame,
  Check,
  Disc3,
} from "lucide-react";
import { useReplayStore, resolveArtwork, type PeriodReport, type ReplayTrackSummary } from "@/store/useReplayStore";
import { usePlayerStore } from "@/store/usePlayerStore";
import { cn } from "@/lib/utils";

const MONTH_NAMES = [
  "Januari", "Februari", "Maret", "April", "Mei", "Juni",
  "Juli", "Agustus", "September", "Oktober", "November", "Desember",
];

const TOTAL_STORY_SLIDES = 5; // Slide 0 to 4 (Slide 4 is the Full Summary & Share Card)
const AUTO_ADVANCE_MS = 6500;

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

  const { play, isPlaying, togglePlay, setVolume, volume } = usePlayerStore();

  const report: PeriodReport = useMemo(() => {
    return getPeriodReport(activePeriodType);
  }, [getPeriodReport, activePeriodType, selectedMonth, selectedYear]);

  // Story state: 0 = Minutes, 1 = #1 Track, 2 = #1 Artist, 3 = Top 5 & Aura, 4 = Full Summary
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isClosing, setIsClosing] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const prevVolumeRef = useRef(volume);
  const currentYearInt = new Date().getFullYear();
  const currentMonthInt = new Date().getMonth() + 1;

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 2500);
  };

  // Auto-play #1 track when entering Slide 2 (index 1)
  useEffect(() => {
    if (currentSlide === 1 && report.topTrack) {
      play(
        {
          id: report.topTrack.id,
          uri: `spotify:track:${report.topTrack.id}`,
          name: report.topTrack.name,
          artistName: report.topTrack.artistName,
          albumName: report.topTrack.albumName,
          albumArt: resolveArtwork(report.topTrack.name, report.topTrack.albumArt),
          duration: report.topTrack.duration,
          previewUrl: null,
          explicit: false,
        },
        report.topTracks.map((t) => ({
          id: t.id,
          uri: `spotify:track:${t.id}`,
          name: t.name,
          artistName: t.artistName,
          albumName: t.albumName,
          albumArt: resolveArtwork(t.name, t.albumArt),
          duration: t.duration,
          previewUrl: null,
          explicit: false,
        }))
      );
    }
  }, [currentSlide, report.topTrack]);

  // Auto-advance timer for Slides 0 to 3 (stops on Slide 4)
  useEffect(() => {
    if (currentSlide >= 4) return;

    const timer = setTimeout(() => {
      setCurrentSlide((prev) => Math.min(4, prev + 1));
    }, AUTO_ADVANCE_MS);

    return () => clearTimeout(timer);
  }, [currentSlide]);

  const handleNext = () => {
    setCurrentSlide((prev) => Math.min(4, prev + 1));
  };

  const handlePrev = () => {
    setCurrentSlide((prev) => Math.max(0, prev - 1));
  };

  const handleClose = () => {
    setIsClosing(true);
    setTimeout(() => {
      if (window.history.length > 1) {
        router.back();
      } else {
        router.push("/profile");
      }
    }, 280);
  };

  const toggleMute = () => {
    if (isMuted) {
      setVolume(prevVolumeRef.current || 0.8);
      setIsMuted(false);
    } else {
      prevVolumeRef.current = volume;
      setVolume(0);
      setIsMuted(true);
    }
  };

  const handlePlaySpecificTrack = (t: ReplayTrackSummary) => {
    play(
      {
        id: t.id,
        uri: `spotify:track:${t.id}`,
        name: t.name,
        artistName: t.artistName,
        albumName: t.albumName,
        albumArt: resolveArtwork(t.name, t.albumArt),
        duration: t.duration,
        previewUrl: null,
        explicit: false,
      },
      report.topTracks.map((item) => ({
        id: item.id,
        uri: `spotify:track:${item.id}`,
        name: item.name,
        artistName: item.artistName,
        albumName: item.albumName,
        albumArt: resolveArtwork(item.name, item.albumArt),
        duration: item.duration,
        previewUrl: null,
        explicit: false,
      }))
    );
  };

  const ambientArt = resolveArtwork(report.topTrack?.name, report.topTrack?.albumArt);

  return (
    <motion.div
      initial={{ y: "100%" }}
      animate={{ y: isClosing ? "100%" : 0 }}
      transition={{ type: "spring", stiffness: 320, damping: 30, mass: 0.9 }}
      className="fixed inset-0 z-50 overflow-hidden flex flex-col bg-[#07080f] text-white select-none"
    >
      {/* Dynamic Monochrome Ambient Blur from #1 Track Cover */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden opacity-25">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={ambientArt}
          alt=""
          className="w-full h-full object-cover blur-[110px] scale-150 transform-gpu"
        />
        <div className="absolute inset-0 bg-black/60" />
      </div>

      {/* Toast Alert */}
      <AnimatePresence>
        {toastMessage && (
          <motion.div
            initial={{ opacity: 0, y: -20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.95 }}
            className="fixed top-6 inset-x-4 mx-auto max-w-xs z-[150] glass-panel bg-zinc-900/95 text-white text-xs font-semibold py-2.5 px-4 rounded-2xl shadow-2xl flex items-center justify-center gap-2 border border-white/20"
          >
            <Check className="w-4 h-4 text-emerald-400" />
            <span>{toastMessage}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ─────────────────────────────────────────────────────────────
          MODE A: SEQUENTIAL STORY PRESENTATION (Slides 1 to 4)
         ───────────────────────────────────────────────────────────── */}
      {currentSlide < 4 ? (
        <div className="relative z-20 flex-1 flex flex-col justify-between p-4 sm:p-6 md:p-8 max-w-2xl mx-auto w-full h-full">
          {/* Top Story Controls & Progress Bars */}
          <div className="flex flex-col gap-3 flex-shrink-0">
            {/* 5 Progress Bars */}
            <div className="flex items-center gap-1.5 pt-1">
              {[...Array(TOTAL_STORY_SLIDES)].map((_, idx) => (
                <div
                  key={idx}
                  className="flex-1 h-1 bg-white/20 rounded-full overflow-hidden"
                >
                  <div
                    className={cn(
                      "h-full bg-white transition-all duration-150",
                      idx < currentSlide
                        ? "w-full"
                        : idx === currentSlide
                        ? "w-full animate-[progress_6.5s_linear]"
                        : "w-0"
                    )}
                  />
                </div>
              ))}
            </div>

            {/* Top Bar: Close, Period Title, Mute, Skip */}
            <div className="flex items-center justify-between pt-1">
              <button
                onClick={handleClose}
                className="w-9 h-9 rounded-full glass-card hover:bg-white/15 flex items-center justify-center text-white/80 hover:text-white transition-all cursor-pointer"
                title="Tutup Replay"
              >
                <X className="w-4 h-4" />
              </button>

              <div className="text-center">
                <span className="text-[11px] font-mono font-bold tracking-widest uppercase text-white/70">
                  {report.periodLabel}
                </span>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={toggleMute}
                  className="w-9 h-9 rounded-full glass-card hover:bg-white/15 flex items-center justify-center text-white/80 hover:text-white transition-all cursor-pointer"
                  title={isMuted ? "Unmute" : "Mute"}
                >
                  {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
                </button>

                <button
                  onClick={() => setCurrentSlide(4)}
                  className="px-3 py-1.5 rounded-full glass-card hover:bg-white/15 text-[11px] font-bold tracking-tight text-white/90 hover:text-white transition-all cursor-pointer"
                >
                  Lihat Rangkuman →
                </button>
              </div>
            </div>
          </div>

          {/* Central Interactive Slide Animated Stage */}
          <div className="flex-1 flex flex-col items-center justify-center text-center my-4 min-h-0 relative">
            <AnimatePresence mode="wait">
              {/* SLIDE 1: TOTAL LISTENING MINUTES */}
              {currentSlide === 0 && (
                <motion.div
                  key="slide-0"
                  initial={{ opacity: 0, scale: 0.92, y: 15 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.92, y: -15 }}
                  transition={{ duration: 0.4 }}
                  className="flex flex-col items-center gap-4 px-4"
                >
                  <div className="w-14 h-14 rounded-2xl glass-card flex items-center justify-center text-white border border-white/20 shadow-lg">
                    <Clock className="w-7 h-7" />
                  </div>
                  <span className="text-xs font-mono font-bold uppercase tracking-widest text-zinc-400">
                    Total Waktu Mendengar
                  </span>
                  <div className="text-6xl sm:text-8xl font-black text-white tracking-tight drop-shadow-lg">
                    {report.totalMinutes.toLocaleString()}
                  </div>
                  <p className="text-base sm:text-lg font-bold text-white/90">
                    Menit Bersama Musicku di {report.periodLabel}
                  </p>
                  <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full glass-card text-xs font-mono text-white/90 border border-white/20 shadow-md">
                    <Award className="w-3.5 h-3.5 text-amber-400" />
                    <span>Lencana: {report.milestoneBadge}</span>
                  </div>
                  <div className="flex items-center gap-6 mt-3 text-xs font-semibold text-zinc-400">
                    <span>{report.totalTracksPlayed} lagu diputar</span>
                    <span>•</span>
                    <span>{report.uniqueArtistsCount} artis berbeda</span>
                  </div>
                </motion.div>
              )}

              {/* SLIDE 2: #1 TOP TRACK (WITH REAL ARTWORK) */}
              {currentSlide === 1 && report.topTrack && (
                <motion.div
                  key="slide-1"
                  initial={{ opacity: 0, scale: 0.92, y: 15 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.92, y: -15 }}
                  transition={{ duration: 0.4 }}
                  className="flex flex-col items-center gap-4 px-4"
                >
                  <span className="text-xs font-mono font-bold uppercase tracking-widest text-zinc-400">
                    Lagu Nomor #1 Pilihanmu
                  </span>
                  <div className="relative w-52 h-52 sm:w-64 sm:h-64 rounded-[32px] overflow-hidden shadow-2xl border-2 border-white/25 group">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={resolveArtwork(report.topTrack.name, report.topTrack.albumArt)}
                      alt={report.topTrack.name}
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 bg-black/20 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity">
                      <button
                        onClick={() => handlePlaySpecificTrack(report.topTrack!)}
                        className="w-12 h-12 rounded-full bg-white text-zinc-950 flex items-center justify-center shadow-xl hover:scale-110 active:scale-95 transition-all cursor-pointer"
                      >
                        <Play className="w-5 h-5 fill-current ml-0.5" />
                      </button>
                    </div>
                  </div>
                  <div className="max-w-md">
                    <h2 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight truncate leading-tight">
                      {report.topTrack.name}
                    </h2>
                    <p className="text-sm sm:text-base font-semibold text-zinc-300 mt-1">
                      {report.topTrack.artistName}
                    </p>
                    <p className="text-xs text-zinc-400 font-mono mt-0.5">
                      {report.topTrack.albumName}
                    </p>
                  </div>
                  <span className="px-4 py-1.5 rounded-full glass-card text-xs font-mono font-bold text-white border border-white/20">
                    🔥 Diputar {report.topTrack.playCount} kali
                  </span>
                </motion.div>
              )}

              {/* SLIDE 3: #1 TOP ARTIST (WITH REAL PORTRAIT) */}
              {currentSlide === 2 && report.topArtist && (
                <motion.div
                  key="slide-2"
                  initial={{ opacity: 0, scale: 0.92, y: 15 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.92, y: -15 }}
                  transition={{ duration: 0.4 }}
                  className="flex flex-col items-center gap-4 px-4"
                >
                  <span className="text-xs font-mono font-bold uppercase tracking-widest text-zinc-400">
                    Artis Nomor #1 Kamu
                  </span>
                  <div className="w-44 h-44 sm:w-52 sm:h-52 rounded-full overflow-hidden shadow-2xl border-4 border-white/30">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={resolveArtwork(report.topArtist.name, report.topArtist.image)}
                      alt={report.topArtist.name}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div>
                    <h2 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
                      {report.topArtist.name}
                    </h2>
                    <p className="text-sm text-zinc-300 font-medium mt-1">
                      Artis yang paling setia menemani hari-harimu
                    </p>
                  </div>
                  <span className="px-4 py-1.5 rounded-full glass-card text-xs font-mono font-bold text-white border border-white/20">
                    {report.topArtist.playCount} total lagu diputar
                  </span>
                </motion.div>
              )}

              {/* SLIDE 4: TOP 5 COUNTDOWN & LISTENING AURA */}
              {currentSlide === 3 && (
                <motion.div
                  key="slide-3"
                  initial={{ opacity: 0, scale: 0.92, y: 15 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.92, y: -15 }}
                  transition={{ duration: 0.4 }}
                  className="flex flex-col items-center gap-5 w-full max-w-md px-2"
                >
                  <div>
                    <span className="text-xs font-mono font-bold uppercase tracking-widest text-zinc-400">
                      Top 5 Playlist & Listening Aura
                    </span>
                    <h3 className="text-xl font-extrabold text-white mt-1">
                      Koleksi Terbaikmu
                    </h3>
                  </div>

                  {/* Top 3 Quick Preview */}
                  <div className="w-full flex flex-col gap-2">
                    {report.topTracks.slice(0, 3).map((t, idx) => (
                      <div
                        key={t.id}
                        className="flex items-center justify-between p-2 rounded-xl glass-card border border-white/15"
                      >
                        <div className="flex items-center gap-3 min-w-0 flex-1">
                          <span className="w-5 text-center text-xs font-mono font-bold text-zinc-400">
                            #{idx + 1}
                          </span>
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src={resolveArtwork(t.name, t.albumArt)}
                            alt={t.name}
                            className="w-9 h-9 rounded-lg object-cover shadow-sm border border-white/15 flex-shrink-0"
                          />
                          <div className="min-w-0 flex-1 text-left">
                            <p className="text-xs font-bold text-white truncate">{t.name}</p>
                            <p className="text-[11px] text-zinc-400 truncate">{t.artistName}</p>
                          </div>
                        </div>
                        <span className="text-xs font-mono text-zinc-400 pr-1">{t.playCount}x</span>
                      </div>
                    ))}
                  </div>

                  {/* Aura Card Preview */}
                  <div className="w-full p-4 rounded-2xl glass-card border border-white/20 text-left flex items-center gap-3.5">
                    <div className="text-3xl flex-shrink-0">{report.aura.emoji}</div>
                    <div className="min-w-0 flex-1">
                      <p className="text-[10px] font-mono uppercase text-zinc-400">Listening Persona</p>
                      <h4 className="text-sm font-bold text-white truncate">{report.aura.name}</h4>
                      <p className="text-[11px] text-zinc-300 line-clamp-1">{report.aura.description}</p>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Left and Right Invisible Tap Zones for Story Navigation */}
          <div className="absolute inset-y-20 inset-x-0 z-10 flex">
            <div
              className="w-1/2 h-full cursor-pointer"
              onClick={handlePrev}
              title="Slide Sebelumnya"
            />
            <div
              className="w-1/2 h-full cursor-pointer"
              onClick={handleNext}
              title="Slide Berikutnya"
            />
          </div>

          {/* Bottom Story Footer Navigation */}
          <div className="relative z-30 flex items-center justify-between pt-2 border-t border-white/10 text-xs text-zinc-400">
            <button
              onClick={handlePrev}
              disabled={currentSlide === 0}
              className="hover:text-white disabled:opacity-30 disabled:pointer-events-none cursor-pointer"
            >
              ← Kembali
            </button>
            <span className="font-mono text-[11px]">
              Slide {currentSlide + 1} dari 5
            </span>
            <button
              onClick={handleNext}
              className="font-bold text-white hover:underline cursor-pointer"
            >
              {currentSlide === 3 ? "Lihat Rangkuman Penuh →" : "Lanjut →"}
            </button>
          </div>
        </div>
      ) : (
        /* ─────────────────────────────────────────────────────────────
            MODE B: FINAL SLIDE (Full Summary Bento Grid + Share Poster)
           ───────────────────────────────────────────────────────────── */
        <div className="relative z-20 flex-1 overflow-y-auto px-4 sm:px-6 md:px-8 py-5 max-w-6xl mx-auto w-full">
          {/* Top Sticky Bar */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-white/10 sticky top-0 bg-[#07080f]/95 backdrop-blur-2xl z-30 py-2">
            <div className="flex items-center gap-3">
              <button
                onClick={() => setCurrentSlide(0)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full glass-card hover:bg-white/15 text-xs font-bold text-white transition-all cursor-pointer"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Ulangi Story</span>
              </button>
              <h1 className="text-xl sm:text-2xl font-extrabold text-white tracking-tight">
                {report.periodLabel}
              </h1>
            </div>

            <div className="flex items-center gap-2 self-start sm:self-center">
              {/* Period Type Switcher */}
              <div className="flex items-center p-1 rounded-xl glass-card border border-white/15 gap-1">
                <button
                  onClick={() => setActivePeriodType("month")}
                  className={cn(
                    "px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer",
                    activePeriodType === "month"
                      ? "bg-white text-zinc-950 shadow-sm"
                      : "text-zinc-400 hover:text-white"
                  )}
                >
                  Monthly
                </button>
                <button
                  onClick={() => setActivePeriodType("year")}
                  className={cn(
                    "px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer",
                    activePeriodType === "year"
                      ? "bg-white text-zinc-950 shadow-sm"
                      : "text-zinc-400 hover:text-white"
                  )}
                >
                  Yearly
                </button>
              </div>

              <button
                onClick={handleClose}
                className="w-8 h-8 rounded-full glass-card hover:bg-white/15 flex items-center justify-center text-white/80 hover:text-white transition-all cursor-pointer ml-2"
                title="Tutup Replay"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Month or Year Filter Capsule */}
          <div className="py-3 flex items-center gap-1.5 overflow-x-auto no-scrollbar">
            {activePeriodType === "month" ? (
              MONTH_NAMES.slice(0, currentMonthInt).map((name, idx) => {
                const monthKey = `${currentYearInt}-${String(idx + 1).padStart(2, "0")}`;
                const isSelected = selectedMonth === monthKey;
                return (
                  <button
                    key={monthKey}
                    onClick={() => setSelectedMonth(monthKey)}
                    className={cn(
                      "px-3 py-1 rounded-full text-xs font-semibold whitespace-nowrap transition-all cursor-pointer",
                      isSelected
                        ? "bg-white text-zinc-950 font-bold shadow-sm"
                        : "glass-card text-zinc-400 hover:text-white"
                    )}
                  >
                    {name}
                  </button>
                );
              })
            ) : (
              [currentYearInt, currentYearInt - 1].map((year) => {
                const yearStr = String(year);
                const isSelected = selectedYear === yearStr;
                return (
                  <button
                    key={yearStr}
                    onClick={() => setSelectedYear(yearStr)}
                    className={cn(
                      "px-3.5 py-1 rounded-full text-xs font-semibold transition-all cursor-pointer",
                      isSelected
                        ? "bg-white text-zinc-950 font-bold shadow-sm"
                        : "glass-card text-zinc-400 hover:text-white"
                    )}
                  >
                    {yearStr}
                  </button>
                );
              })
            )}
          </div>

          {/* Bento Grid Full Summary */}
          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4 mt-2">
            {/* Total Minutes Card */}
            <div className="md:col-span-2 rounded-[28px] glass-panel p-6 sm:p-7 border border-white/15 flex flex-col justify-between">
              <div className="flex items-center justify-between mb-3">
                <span className="text-[11px] font-mono font-bold uppercase tracking-wider text-zinc-400">
                  Total Waktu Mendengarkan
                </span>
                <span className="text-[11px] font-mono font-bold px-2.5 py-0.5 rounded-full glass-card text-amber-300 border border-white/15">
                  🏆 {report.milestoneBadge}
                </span>
              </div>
              <div>
                <div className="text-5xl sm:text-7xl font-black text-white tracking-tight">
                  {report.totalMinutes.toLocaleString()}
                </div>
                <p className="text-sm font-semibold text-zinc-400 mt-1">
                  Menit total di {report.periodLabel}
                </p>
              </div>
              <div className="grid grid-cols-2 gap-3 pt-4 border-t border-white/10 mt-4 text-xs">
                <div>
                  <span className="text-zinc-500">Total Lagu</span>
                  <p className="text-lg font-bold text-white mt-0.5">{report.totalTracksPlayed} tracks</p>
                </div>
                <div>
                  <span className="text-zinc-500">Artis Unik</span>
                  <p className="text-lg font-bold text-white mt-0.5">{report.uniqueArtistsCount} artists</p>
                </div>
              </div>
            </div>

            {/* Spotlight #1 Track Card */}
            {report.topTrack ? (
              <div className="md:col-span-1 lg:col-span-2 rounded-[28px] glass-panel p-6 border border-white/15 flex flex-col justify-between">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-[11px] font-mono font-bold uppercase tracking-wider text-zinc-400">
                    #1 Top Track
                  </span>
                  <span className="text-xs font-mono font-bold text-zinc-300">
                    {report.topTrack.playCount}x Plays
                  </span>
                </div>

                <div className="flex items-center gap-4 my-2">
                  <div className="relative w-20 h-20 rounded-2xl overflow-hidden shadow-xl border border-white/20 flex-shrink-0">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={resolveArtwork(report.topTrack.name, report.topTrack.albumArt)}
                      alt={report.topTrack.name}
                      className="w-full h-full object-cover"
                    />
                    <button
                      onClick={() => handlePlaySpecificTrack(report.topTrack!)}
                      className="absolute inset-0 m-auto w-9 h-9 rounded-full bg-white text-zinc-950 flex items-center justify-center shadow-lg hover:scale-110 active:scale-95 transition-all cursor-pointer"
                    >
                      <Play className="w-4 h-4 fill-current ml-0.5" />
                    </button>
                  </div>
                  <div className="min-w-0 flex-1">
                    <h3 className="text-lg font-extrabold text-white truncate leading-tight">
                      {report.topTrack.name}
                    </h3>
                    <p className="text-xs font-semibold text-zinc-300 truncate mt-0.5">
                      {report.topTrack.artistName}
                    </p>
                    <p className="text-[11px] text-zinc-500 font-mono mt-0.5">
                      {report.topTrack.albumName}
                    </p>
                  </div>
                </div>

                <div className="pt-2 border-t border-white/10 flex items-center justify-between text-xs text-zinc-400">
                  <span>{report.topTrack.totalMinutes} menit total</span>
                  <button
                    onClick={() => handlePlaySpecificTrack(report.topTrack!)}
                    className="font-bold text-white hover:underline cursor-pointer"
                  >
                    Putar Sekarang →
                  </button>
                </div>
              </div>
            ) : null}

            {/* Spotlight #1 Artist Card */}
            {report.topArtist ? (
              <div className="md:col-span-1 rounded-[28px] glass-panel p-6 border border-white/15 flex flex-col justify-between text-center">
                <span className="text-[11px] font-mono font-bold uppercase tracking-wider text-zinc-400 text-left">
                  #1 Top Artist
                </span>
                <div className="flex flex-col items-center my-3">
                  <div className="w-20 h-20 rounded-full overflow-hidden shadow-xl border-2 border-white/20 mb-2">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={resolveArtwork(report.topArtist.name, report.topArtist.image)}
                      alt={report.topArtist.name}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <h4 className="text-base font-extrabold text-white truncate max-w-full">
                    {report.topArtist.name}
                  </h4>
                  <p className="text-xs text-zinc-400 font-mono mt-0.5">
                    {report.topArtist.playCount} pemutaran
                  </p>
                </div>
                <div className="pt-2 border-t border-white/10 text-[11px] text-zinc-500 font-mono">
                  Artis Paling Sering Didengar
                </div>
              </div>
            ) : null}

            {/* Listening Aura Card (Pure Monochrome Titanium) */}
            <div className="md:col-span-2 lg:col-span-3 rounded-[28px] glass-panel p-6 sm:p-7 border border-white/15 flex flex-col sm:flex-row items-center gap-5">
              <div className="w-18 h-18 rounded-3xl glass-card border border-white/25 flex items-center justify-center text-4xl shadow-xl flex-shrink-0">
                {report.aura.emoji}
              </div>
              <div className="flex-1 text-center sm:text-left">
                <span className="text-[10px] font-mono uppercase tracking-wider text-zinc-400 block mb-1">
                  Listening Persona & Vibe
                </span>
                <h3 className="text-xl font-black text-white tracking-tight">
                  {report.aura.name}
                </h3>
                <p className="text-xs sm:text-sm text-zinc-300 mt-1 leading-relaxed">
                  {report.aura.description}
                </p>
                <p className="text-[11px] font-mono text-zinc-400 mt-1.5">
                  Vibe: {report.aura.vibe} • {report.aura.tagline}
                </p>
              </div>
            </div>
          </div>

          {/* Top 5 Tracks & Top 5 Artists Lists */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
            {/* Top 5 Tracks */}
            <div className="rounded-[28px] glass-panel p-6 border border-white/15">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xs font-bold uppercase tracking-widest text-zinc-300 flex items-center gap-2">
                  <Music className="w-4 h-4 text-white" />
                  <span>Top 5 Tracks</span>
                </h3>
                <span className="text-[11px] font-mono text-zinc-500">Play Count</span>
              </div>
              <div className="flex flex-col gap-2">
                {report.topTracks.map((t, idx) => (
                  <div
                    key={t.id}
                    onClick={() => handlePlaySpecificTrack(t)}
                    className="flex items-center justify-between p-2.5 rounded-2xl glass-card hover:bg-white/10 border border-white/10 transition-all cursor-pointer group"
                  >
                    <div className="flex items-center gap-3 min-w-0 flex-1">
                      <span className="w-5 text-center text-xs font-mono font-bold text-zinc-400 group-hover:text-white">
                        #{idx + 1}
                      </span>
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={resolveArtwork(t.name, t.albumArt)}
                        alt={t.name}
                        className="w-10 h-10 rounded-xl object-cover shadow-sm border border-white/15 flex-shrink-0"
                      />
                      <div className="min-w-0 flex-1 text-left">
                        <p className="text-xs font-bold text-white truncate">{t.name}</p>
                        <p className="text-[11px] text-zinc-400 truncate mt-0.5">{t.artistName}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 pl-2">
                      <span className="text-xs font-mono text-zinc-300">{t.playCount}x</span>
                      <Play className="w-3.5 h-3.5 fill-current opacity-0 group-hover:opacity-100 transition-opacity" />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Top 5 Artists */}
            <div className="rounded-[28px] glass-panel p-6 border border-white/15">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xs font-bold uppercase tracking-widest text-zinc-300 flex items-center gap-2">
                  <Users className="w-4 h-4 text-white" />
                  <span>Top 5 Artists</span>
                </h3>
                <span className="text-[11px] font-mono text-zinc-500">Plays</span>
              </div>
              <div className="flex flex-col gap-2">
                {report.topArtists.map((a, idx) => (
                  <div
                    key={a.name}
                    onClick={() => router.push(`/artist/${encodeURIComponent(a.name)}`)}
                    className="flex items-center justify-between p-2.5 rounded-2xl glass-card hover:bg-white/10 border border-white/10 transition-all cursor-pointer group"
                  >
                    <div className="flex items-center gap-3 min-w-0 flex-1">
                      <span className="w-5 text-center text-xs font-mono font-bold text-zinc-400 group-hover:text-white">
                        #{idx + 1}
                      </span>
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={resolveArtwork(a.name, a.image)}
                        alt={a.name}
                        className="w-10 h-10 rounded-full object-cover shadow-sm border border-white/15 flex-shrink-0"
                      />
                      <div className="min-w-0 flex-1 text-left">
                        <p className="text-xs font-bold text-white truncate">{a.name}</p>
                        <p className="text-[11px] text-zinc-400 truncate mt-0.5">Favorite Artist</p>
                      </div>
                    </div>
                    <span className="text-xs font-mono text-zinc-300">{a.playCount} plays</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Embedded Share Replay Card Section (Always accessible on Slide 5) */}
          <div className="mt-8 pt-6 border-t border-white/10">
            <SharePosterSection report={report} onShowToast={showToast} />
          </div>
        </div>
      )}
    </motion.div>
  );
}

// ────────────────────────────────────────────────────────────────────────────
// EMBEDDED SHARE POSTER SECTION (MONOCHROME LIQUID GLASS CANVAS)
// ────────────────────────────────────────────────────────────────────────────
function SharePosterSection({
  report,
  onShowToast,
}: {
  report: PeriodReport;
  onShowToast: (msg: string) => void;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [dataUrl, setDataUrl] = useState<string | null>(null);

  // Generate pure monochrome titanium poster on 1080x1350 canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    canvas.width = 1080;
    canvas.height = 1350;

    // Dark Titanium Backdrop
    const bgGradient = ctx.createLinearGradient(0, 0, 1080, 1350);
    bgGradient.addColorStop(0, "#080910");
    bgGradient.addColorStop(0.5, "#0f111a");
    bgGradient.addColorStop(1, "#05060a");
    ctx.fillStyle = bgGradient;
    ctx.fillRect(0, 0, 1080, 1350);

    // Subtle Monochromatic Specular Lighting
    const drawSpecularGlow = (x: number, y: number, r: number, alpha: number) => {
      const g = ctx.createRadialGradient(x, y, 0, x, y, r);
      g.addColorStop(0, `rgba(255, 255, 255, ${alpha})`);
      g.addColorStop(1, "transparent");
      ctx.fillStyle = g;
      ctx.fillRect(x - r, y - r, r * 2, r * 2);
    };

    drawSpecularGlow(900, 200, 480, 0.08);
    drawSpecularGlow(200, 1150, 480, 0.06);

    // Header Branding
    ctx.fillStyle = "#ffffff";
    ctx.font = "bold 44px sans-serif";
    ctx.fillText("MUSICKU REPLAY", 80, 130);

    ctx.fillStyle = "rgba(255, 255, 255, 0.6)";
    ctx.font = "600 28px monospace";
    ctx.fillText(report.periodLabel.toUpperCase(), 80, 180);

    // Liquid Glass Container
    ctx.fillStyle = "rgba(255, 255, 255, 0.04)";
    ctx.strokeStyle = "rgba(255, 255, 255, 0.16)";
    ctx.lineWidth = 3;
    ctx.roundRect(80, 240, 920, 870, 44);
    ctx.fill();
    ctx.stroke();

    // Total Minutes Block
    ctx.fillStyle = "rgba(255, 255, 255, 0.65)";
    ctx.font = "bold 24px monospace";
    ctx.fillText("TOTAL LISTENING TIME", 140, 320);

    ctx.fillStyle = "#ffffff";
    ctx.font = "900 84px sans-serif";
    ctx.fillText(`${report.totalMinutes.toLocaleString()} MINS`, 140, 410);

    // #1 Track Info
    if (report.topTrack) {
      ctx.fillStyle = "rgba(255, 255, 255, 0.65)";
      ctx.font = "bold 22px monospace";
      ctx.fillText("#1 TOP TRACK", 140, 500);

      ctx.fillStyle = "#ffffff";
      ctx.font = "bold 42px sans-serif";
      ctx.fillText(report.topTrack.name.slice(0, 28), 140, 560);

      ctx.fillStyle = "rgba(255, 255, 255, 0.75)";
      ctx.font = "600 30px sans-serif";
      ctx.fillText(report.topTrack.artistName, 140, 610);
    }

    // Top 5 Playlist
    ctx.fillStyle = "rgba(255, 255, 255, 0.65)";
    ctx.font = "bold 22px monospace";
    ctx.fillText("TOP 5 PLAYLIST:", 140, 710);

    report.topTracks.slice(0, 5).forEach((t, i) => {
      ctx.fillStyle = "#ffffff";
      ctx.font = "600 26px sans-serif";
      ctx.fillText(`${i + 1}. ${t.name.slice(0, 28)} - ${t.artistName.slice(0, 16)}`, 140, 765 + i * 48);
    });

    // Persona Pill
    ctx.fillStyle = "rgba(255, 255, 255, 0.08)";
    ctx.strokeStyle = "rgba(255, 255, 255, 0.25)";
    ctx.roundRect(140, 1020, 800, 64, 20);
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = "#ffffff";
    ctx.font = "bold 26px sans-serif";
    ctx.fillText(`${report.aura.emoji} Listening Aura: ${report.aura.name}`, 170, 1062);

    // Bottom Watermark
    ctx.fillStyle = "rgba(255, 255, 255, 0.45)";
    ctx.font = "600 24px monospace";
    ctx.fillText("musicku.app • Apple iOS 26 Audio Experience", 80, 1220);

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
      `Dengarkan musik favoritmu di musicku.app!`
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
          text: `Raport musik saya di Musicku Replay! Lagu #1: ${report.topTrack?.name}`,
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
    <div className="flex flex-col lg:flex-row items-center gap-8 p-6 sm:p-8 rounded-[32px] glass-panel border border-white/15">
      {/* Hidden 1080x1350 canvas */}
      <canvas ref={canvasRef} className="hidden" />

      {/* Live Poster Card Preview */}
      <div className="w-full max-w-xs sm:max-w-sm aspect-[4/5] rounded-3xl overflow-hidden shadow-2xl border border-white/20 bg-black flex-shrink-0">
        {dataUrl && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={dataUrl} alt="Replay Poster Card" className="w-full h-full object-cover" />
        )}
      </div>

      {/* Share Actions Column */}
      <div className="flex-1 text-center lg:text-left flex flex-col justify-between gap-5">
        <div>
          <span className="text-[11px] font-mono font-bold uppercase tracking-wider text-zinc-400">
            Bagikan Pencapaian Musikmu
          </span>
          <h3 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight mt-1">
            Share Replay Card
          </h3>
          <p className="text-xs sm:text-sm text-zinc-300 mt-1 max-w-md">
            Ekspor poster kartu beresolusi tinggi (4:5 Portrait) bergaya iOS 26 Liquid Glass untuk dibagikan ke WhatsApp, Instagram Story, atau simpan ke galeri perangkatmu.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row items-center gap-3">
          <button
            onClick={handleShareWhatsApp}
            className="w-full sm:w-auto px-6 py-3 rounded-2xl bg-white text-zinc-950 font-bold text-xs hover:bg-zinc-200 transition-all cursor-pointer shadow-lg active:scale-95"
          >
            Bagikan ke WhatsApp
          </button>

          <button
            onClick={handleNativeShare}
            className="w-full sm:w-auto px-6 py-3 rounded-2xl glass-card hover:bg-white/15 text-white font-bold text-xs border border-white/20 transition-all cursor-pointer shadow-md active:scale-95"
          >
            Instagram / Share
          </button>

          <button
            onClick={handleDownload}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-3 rounded-2xl glass-card hover:bg-white/15 text-zinc-300 hover:text-white font-semibold text-xs border border-white/15 transition-all cursor-pointer"
          >
            <Download className="w-4 h-4" />
            <span>Unduh PNG</span>
          </button>
        </div>
      </div>
    </div>
  );
}
