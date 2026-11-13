"use client";

import { useState, useEffect, useRef, useMemo, useCallback } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  X,
  Play,
  Pause,
  Share2,
  Download,
  MessageCircle,
  Volume2,
  VolumeX,
  Sparkles,
  Trophy,
  RotateCcw,
  Clock,
  Music,
  Award,
  Lock,
  Calendar,
  Eye,
  Disc3,
  ExternalLink,
} from "lucide-react";
import {
  useReplayStore,
  resolveArtwork,
  type PeriodReport,
  type ReplayTrackSummary,
} from "@/store/useReplayStore";
import { usePlayerStore } from "@/store/usePlayerStore";
import { cn } from "@/lib/utils";

const MONTH_NAMES = [
  "Januari",
  "Februari",
  "Maret",
  "April",
  "Mei",
  "Juni",
  "Juli",
  "Agustus",
  "September",
  "Oktober",
  "November",
  "Desember",
];

const AUTO_ADVANCE_MS = 6500;

interface LockStatus {
  isLocked: boolean;
  isEmpty: boolean;
  title: string;
  description: string;
  daysRemaining: number;
  unlockDateStr: string;
}

function evaluatePeriodLock(
  type: "month" | "year",
  periodKey: string,
  totalTracks: number,
  totalMinutes: number
): LockStatus {
  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth() + 1; // 1-12
  const currentDay = now.getDate();

  if (type === "month") {
    const [yStr, mStr] = periodKey.split("-");
    const targetYear = parseInt(yStr, 10);
    const targetMonth = parseInt(mStr, 10);
    const monthLabel = MONTH_NAMES[targetMonth - 1] || mStr;

    // Future month: locked
    if (targetYear > currentYear || (targetYear === currentYear && targetMonth > currentMonth)) {
      return {
        isLocked: true,
        isEmpty: true,
        title: "Bulan Belum Dimulai",
        description: `Aktivitas mendengarkan untuk ${monthLabel} ${targetYear} belum dimulai.`,
        daysRemaining: 0,
        unlockDateStr: `1 ${monthLabel} ${targetYear}`,
      };
    }

    // Current month: locked until the last 2 days of the month (e.g. 29th or 30th/31st)
    if (targetYear === currentYear && targetMonth === currentMonth) {
      const daysInMonth = new Date(targetYear, targetMonth, 0).getDate();
      const unlockDay = Math.max(1, daysInMonth - 1);

      if (currentDay < unlockDay) {
        const daysRemaining = unlockDay - currentDay;
        return {
          isLocked: true,
          isEmpty: totalMinutes === 0 && totalTracks === 0,
          title: `Locked Until End of Month (${daysInMonth} ${monthLabel})`,
          description: `Raport bulanan ${monthLabel} ${targetYear} hanya terbuka di akhir bulan. Aktivitas mendengarkanmu sedang direkam secara real-time.`,
          daysRemaining,
          unlockDateStr: `${unlockDay}–${daysInMonth} ${monthLabel} ${targetYear}`,
        };
      }

      // If already at end of month but 0 plays
      if (totalTracks === 0 || totalMinutes === 0) {
        return {
          isLocked: false,
          isEmpty: true,
          title: "Belum Ada Aktivitas Mendengarkan",
          description: `0 Menit — Kamu belum memutar lagu di ${monthLabel} ${targetYear}. Putar lagu favoritmu sekarang untuk mulai menyusun raport musik!`,
          daysRemaining: 0,
          unlockDateStr: "",
        };
      }

      return {
        isLocked: false,
        isEmpty: false,
        title: "",
        description: "",
        daysRemaining: 0,
        unlockDateStr: "",
      };
    }

    // Past month (already ended): unlocked if has data, empty if 0
    if (totalTracks === 0 || totalMinutes === 0) {
      return {
        isLocked: false,
        isEmpty: true,
        title: "0 Menit — Tidak Ada Aktivitas",
        description: `Belum ada riwayat aktivitas mendengarkan di bulan ${monthLabel} ${targetYear}.`,
        daysRemaining: 0,
        unlockDateStr: "",
      };
    }

    return {
      isLocked: false,
      isEmpty: false,
      title: "",
      description: "",
      daysRemaining: 0,
      unlockDateStr: "",
    };
  }

  // Yearly Wrapped evaluation
  const targetYear = parseInt(periodKey, 10);

  // Future year
  if (targetYear > currentYear) {
    return {
      isLocked: true,
      isEmpty: true,
      title: "Tahun Belum Dimulai",
      description: `Raport tahunan ${targetYear} belum dimulai.`,
      daysRemaining: 0,
      unlockDateStr: `1 Januari ${targetYear}`,
    };
  }

  // Current year: time-gated until late December (25-31 Dec)
  if (targetYear === currentYear) {
    const isLateDecember = currentMonth === 12 && currentDay >= 25;

    if (!isLateDecember) {
      const unlockTarget = new Date(currentYear, 11, 25);
      const diffMs = unlockTarget.getTime() - now.getTime();
      const daysRemaining = Math.max(1, Math.ceil(diffMs / (1000 * 60 * 60 * 24)));

      return {
        isLocked: true,
        isEmpty: totalMinutes === 0 && totalTracks === 0,
        title: `Year ${targetYear} Wrapped Terkunci`,
        description: `Yearly Wrapped hanya terbuka di akhir tahun (25–31 Desember). Setiap lagu yang kamu dengarkan sepanjang tahun ini dicatat otomatis.`,
        daysRemaining,
        unlockDateStr: `25 Desember ${targetYear}`,
      };
    }

    if (totalTracks === 0 || totalMinutes === 0) {
      return {
        isLocked: false,
        isEmpty: true,
        title: "0 Menit — Belum Ada Aktivitas",
        description: `Belum ada riwayat pemutaran di tahun ${targetYear}.`,
        daysRemaining: 0,
        unlockDateStr: "",
      };
    }

    return {
      isLocked: false,
      isEmpty: false,
      title: "",
      description: "",
      daysRemaining: 0,
      unlockDateStr: "",
    };
  }

  // Past year
  if (totalTracks === 0 || totalMinutes === 0) {
    return {
      isLocked: false,
      isEmpty: true,
      title: "0 Menit — Tidak Ada Riwayat",
      description: `Belum ada riwayat pemutaran di tahun ${targetYear}.`,
      daysRemaining: 0,
      unlockDateStr: "",
    };
  }

  return {
    isLocked: false,
    isEmpty: false,
    title: "",
    description: "",
    daysRemaining: 0,
    unlockDateStr: "",
  };
}

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

  const lockStatus = useMemo(() => {
    const key = activePeriodType === "month" ? selectedMonth : selectedYear;
    return evaluatePeriodLock(activePeriodType, key, report.totalTracksPlayed, report.totalMinutes);
  }, [activePeriodType, selectedMonth, selectedYear, report.totalTracksPlayed, report.totalMinutes]);

  // Story slides: 0: Minutes, 1: Top Track, 2: Top Artist, 3: Aura & Top 5, 4: Summary Bento
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isClosing, setIsClosing] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [isPreviewMode, setIsPreviewMode] = useState(false);

  const prevVolumeRef = useRef<number>(volume);
  const hasAutoPlayedFinalRef = useRef(false);

  const now = new Date();
  const currentYearInt = now.getFullYear();
  const currentMonthInt = now.getMonth() + 1;

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3200);
  };

  // Play top track through main app player engine
  const handlePlayTopTrack = useCallback(() => {
    if (!report.topTrack) return;
    const current = report.topTrack;

    play(
      {
        id: current.id,
        uri: `spotify:track:${current.id}`,
        name: current.name,
        artistName: current.artistName,
        albumName: current.albumName || "Single",
        albumArt: resolveArtwork(current.name, current.albumArt),
        duration: current.duration || 180000,
        previewUrl: null,
        explicit: false,
      },
      report.topTracks.length > 0
        ? report.topTracks.map((item) => ({
            id: item.id,
            uri: `spotify:track:${item.id}`,
            name: item.name,
            artistName: item.artistName,
            albumName: item.albumName || "Single",
            albumArt: resolveArtwork(item.name, item.albumArt),
            duration: item.duration || 180000,
            previewUrl: null,
            explicit: false,
          }))
        : undefined
    );
  }, [play, report.topTrack, report.topTracks]);

  // Auto-play #1 track smoothly when entering Slide 2 (index 1) or Final Slide (index 4)
  useEffect(() => {
    if (currentSlide === 1 && report.topTrack) {
      handlePlayTopTrack();
    }
  }, [currentSlide, report.topTrack, handlePlayTopTrack]);

  useEffect(() => {
    if (currentSlide === 4 && report.topTrack && !hasAutoPlayedFinalRef.current) {
      hasAutoPlayedFinalRef.current = true;
      handlePlayTopTrack();
    }
  }, [currentSlide, report.topTrack, handlePlayTopTrack]);

  // Auto-advance timer for Slides 0 to 3 (stops on Slide 4)
  useEffect(() => {
    if (lockStatus.isLocked && !isPreviewMode) return;
    if (lockStatus.isEmpty) return;
    if (currentSlide >= 4) return;

    const timer = setTimeout(() => {
      setCurrentSlide((prev) => Math.min(4, prev + 1));
    }, AUTO_ADVANCE_MS);

    return () => clearTimeout(timer);
  }, [currentSlide, lockStatus.isLocked, lockStatus.isEmpty, isPreviewMode]);

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
        albumName: t.albumName || "Single",
        albumArt: resolveArtwork(t.name, t.albumArt),
        duration: t.duration || 180000,
        previewUrl: null,
        explicit: false,
      },
      report.topTracks.map((item) => ({
        id: item.id,
        uri: `spotify:track:${item.id}`,
        name: item.name,
        artistName: item.artistName,
        albumName: item.albumName || "Single",
        albumArt: resolveArtwork(item.name, item.albumArt),
        duration: item.duration || 180000,
        previewUrl: null,
        explicit: false,
      }))
    );
  };

  const ambientArt = resolveArtwork(report.topTrack?.name, report.topTrack?.albumArt);

  // Determine if time-gated lock is blocking normal display
  const isCurrentlyLocked = lockStatus.isLocked && !isPreviewMode;
  const isCurrentlyEmpty = lockStatus.isEmpty && !isPreviewMode;

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
          alt="Ambient Background"
          className="w-full h-full object-cover blur-3xl scale-150 filter grayscale contrast-125"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-[#07080f]/90 via-[#07080f]/80 to-[#07080f]/95" />
      </div>

      {/* Floating Notification Toast */}
      <AnimatePresence>
        {toastMessage && (
          <motion.div
            initial={{ opacity: 0, y: -20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.95 }}
            className="fixed top-6 inset-x-0 mx-auto w-fit z-[100] px-5 py-2.5 rounded-full glass-panel border border-white/25 shadow-2xl text-xs font-bold text-white flex items-center gap-2 bg-zinc-950/90 backdrop-blur-2xl"
          >
            <Sparkles className="w-3.5 h-3.5 text-white animate-spin" />
            <span>{toastMessage}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ─────────────────────────────────────────────────────────────
          STATE 1: LOCKED VIEW (Time-gated until end of month / year)
         ───────────────────────────────────────────────────────────── */}
      {isCurrentlyLocked ? (
        <div className="relative z-20 flex-1 overflow-y-auto px-4 sm:px-6 md:px-8 py-5 max-w-4xl mx-auto w-full flex flex-col justify-between">
          {/* Top Bar with Period Selectors */}
          <div>
            <div className="flex items-center justify-between pb-4 border-b border-white/10">
              <div className="flex items-center gap-2">
                <span className="text-xs font-mono font-bold tracking-widest uppercase text-zinc-400">
                  Musicku Replay
                </span>
              </div>

              <div className="flex items-center gap-2">
                {/* Period Switcher */}
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
                  className="w-9 h-9 rounded-full glass-card hover:bg-white/15 flex items-center justify-center text-white/80 hover:text-white transition-all cursor-pointer"
                  title="Tutup Replay"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Month / Year Selector Capsule */}
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
          </div>

          {/* Central Glass Locked Card */}
          <div className="my-auto py-8 flex flex-col items-center text-center max-w-lg mx-auto">
            <div className="w-20 h-20 rounded-3xl glass-panel border border-white/20 flex items-center justify-center shadow-2xl relative mb-5">
              <div className="absolute inset-0 rounded-3xl bg-white/5 animate-pulse" />
              <Lock className="w-9 h-9 text-white drop-shadow-md" />
            </div>

            <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full glass-card text-xs font-mono font-bold text-zinc-300 border border-white/15 mb-3">
              <Calendar className="w-3.5 h-3.5 text-white/80" />
              <span>Rilis: {lockStatus.unlockDateStr}</span>
            </div>

            <h2 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight leading-tight">
              {lockStatus.title}
            </h2>

            <p className="text-xs sm:text-sm text-zinc-300 mt-2 leading-relaxed">
              {lockStatus.description}
            </p>

            {/* Countdown Badge */}
            {lockStatus.daysRemaining > 0 && (
              <div className="mt-5 px-5 py-2.5 rounded-2xl glass-panel border border-white/20 flex items-center gap-3">
                <Clock className="w-4 h-4 text-white" />
                <span className="text-sm font-mono font-black text-white tracking-wide">
                  {lockStatus.daysRemaining} HARI LAGI MENUJU RILIS
                </span>
              </div>
            )}

            {/* Live Telemetry Progress Card */}
            <div className="w-full mt-6 p-4 rounded-2xl glass-card border border-white/15 text-left flex flex-col gap-2.5">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-mono uppercase tracking-wider text-zinc-400">
                  Status Telemetri
                </span>
                <span className="inline-flex items-center gap-1.5 text-[11px] font-mono text-emerald-400 font-bold">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                  Merekam Real-Time
                </span>
              </div>

              <div className="grid grid-cols-2 gap-2 pt-2 border-t border-white/10 text-xs">
                <div>
                  <span className="text-zinc-500 text-[10px]">Total Terkumpul</span>
                  <p className="text-sm font-bold text-white mt-0.5">
                    {report.totalMinutes} Menit
                  </p>
                </div>
                <div>
                  <span className="text-zinc-500 text-[10px]">Lagu Diputar</span>
                  <p className="text-sm font-bold text-white mt-0.5">
                    {report.totalTracksPlayed} tracks
                  </p>
                </div>
              </div>

              {report.topTrack && (
                <div className="pt-2 border-t border-white/10 flex items-center justify-between text-xs">
                  <span className="text-zinc-400 text-[11px] truncate max-w-[200px]">
                    🎵 Top: <strong className="text-white">{report.topTrack.name}</strong>
                  </span>
                  <button
                    onClick={handlePlayTopTrack}
                    className="text-[11px] font-bold text-white hover:underline cursor-pointer flex items-center gap-1"
                  >
                    <Play className="w-3 h-3 fill-current" />
                    Putar
                  </button>
                </div>
              )}
            </div>

            {/* Test Preview Button (Allows checking report anytime if user has recorded tracks) */}
            {report.totalTracksPlayed > 0 && (
              <div className="mt-6 flex flex-col sm:flex-row items-center gap-3">
                <button
                  onClick={() => {
                    setIsPreviewMode(true);
                    setCurrentSlide(0);
                  }}
                  className="px-5 py-2.5 rounded-full bg-white text-zinc-950 text-xs font-bold shadow-lg hover:bg-zinc-200 active:scale-95 transition-all cursor-pointer flex items-center gap-2"
                >
                  <Eye className="w-3.5 h-3.5" />
                  <span>Lihat Pratinjau Raport ({report.totalMinutes} Menit)</span>
                </button>
              </div>
            )}
          </div>

          <div className="text-center text-[11px] text-zinc-500 font-mono py-2">
            musicku.app • Apple iOS 26 Audio Telemetry Engine
          </div>
        </div>
      ) : isCurrentlyEmpty ? (
        /* ─────────────────────────────────────────────────────────────
            STATE 2: EMPTY STATE (0 minutes in past month / unused year)
           ───────────────────────────────────────────────────────────── */
        <div className="relative z-20 flex-1 overflow-y-auto px-4 sm:px-6 md:px-8 py-5 max-w-4xl mx-auto w-full flex flex-col justify-between">
          {/* Top Bar with Period Selectors */}
          <div>
            <div className="flex items-center justify-between pb-4 border-b border-white/10">
              <div className="flex items-center gap-2">
                <span className="text-xs font-mono font-bold tracking-widest uppercase text-zinc-400">
                  Musicku Replay
                </span>
              </div>

              <div className="flex items-center gap-2">
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
                  className="w-9 h-9 rounded-full glass-card hover:bg-white/15 flex items-center justify-center text-white/80 hover:text-white transition-all cursor-pointer"
                  title="Tutup Replay"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Month / Year Selector Capsule */}
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
          </div>

          {/* Central Empty State Card */}
          <div className="my-auto py-8 flex flex-col items-center text-center max-w-md mx-auto">
            <div className="w-20 h-20 rounded-3xl glass-panel border border-white/20 flex items-center justify-center shadow-xl mb-5">
              <Disc3 className="w-9 h-9 text-zinc-400 animate-spin-slow" />
            </div>

            <h2 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
              {lockStatus.title}
            </h2>

            <p className="text-xs sm:text-sm text-zinc-300 mt-2 leading-relaxed">
              {lockStatus.description}
            </p>

            <button
              onClick={() => router.push("/discover")}
              className="mt-6 px-6 py-2.5 rounded-full bg-white text-zinc-950 text-xs font-bold shadow-lg hover:bg-zinc-200 active:scale-95 transition-all cursor-pointer flex items-center gap-2"
            >
              <Music className="w-3.5 h-3.5" />
              <span>Jelajahi & Putar Musik</span>
            </button>
          </div>

          <div className="text-center text-[11px] text-zinc-500 font-mono py-2">
            musicku.app • Tidak ada data dummy (100% Pemutaran Asli)
          </div>
        </div>
      ) : currentSlide < 4 ? (
        /* ─────────────────────────────────────────────────────────────
            MODE A: STORY SLIDESHOW (Slides 0 to 3)
           ───────────────────────────────────────────────────────────── */
        <div className="relative z-20 flex-1 flex flex-col justify-between max-w-lg mx-auto w-full px-4 sm:px-6 py-4">
          {/* Top Progress Bars & Controls */}
          <div className="flex flex-col gap-2">
            {/* 5-segment Story Progress Bars */}
            <div className="flex items-center gap-1.5 w-full">
              {[0, 1, 2, 3, 4].map((idx) => (
                <div
                  key={idx}
                  className="flex-1 h-1 rounded-full bg-white/20 overflow-hidden"
                >
                  <div
                    className={cn(
                      "h-full bg-white transition-all duration-300",
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

              {/* SLIDE 2: #1 TOP TRACK (Guarded against null/black screen) */}
              {currentSlide === 1 && (
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

                  {report.topTrack ? (
                    <>
                      <div className="relative w-52 h-52 sm:w-64 sm:h-64 rounded-[32px] overflow-hidden shadow-2xl border-2 border-white/25 group">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={resolveArtwork(report.topTrack.name, report.topTrack.albumArt)}
                          alt={report.topTrack.name}
                          className="w-full h-full object-cover"
                        />
                        <div className="absolute inset-0 bg-black/20 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity">
                          <button
                            onClick={handlePlayTopTrack}
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
                    </>
                  ) : (
                    <div className="flex flex-col items-center gap-3 py-10">
                      <div className="w-20 h-20 rounded-2xl glass-panel border border-white/20 flex items-center justify-center">
                        <Music className="w-8 h-8 text-zinc-400" />
                      </div>
                      <p className="text-base font-bold text-white">Belum Ada Lagu Teratas</p>
                      <p className="text-xs text-zinc-400">Putar lagu untuk menentukan lagu favoritmu.</p>
                    </div>
                  )}
                </motion.div>
              )}

              {/* SLIDE 3: #1 TOP ARTIST (Guarded against null/black screen) */}
              {currentSlide === 2 && (
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

                  {report.topArtist ? (
                    <>
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
                          Artis yang paling sering menemanimu
                        </p>
                      </div>
                      <span className="px-4 py-1.5 rounded-full glass-card text-xs font-mono font-bold text-white border border-white/20">
                        {report.topArtist.playCount} pemutaran lagu
                      </span>
                    </>
                  ) : (
                    <div className="flex flex-col items-center gap-3 py-10">
                      <div className="w-20 h-20 rounded-full glass-panel border border-white/20 flex items-center justify-center">
                        <Music className="w-8 h-8 text-zinc-400" />
                      </div>
                      <p className="text-base font-bold text-white">Belum Ada Artis Teratas</p>
                      <p className="text-xs text-zinc-400">Dengarkan lagu untuk menganalisis artis teratas.</p>
                    </div>
                  )}
                </motion.div>
              )}

              {/* SLIDE 4: TOP 5 COUNTDOWN & AURA */}
              {currentSlide === 3 && (
                <motion.div
                  key="slide-3"
                  initial={{ opacity: 0, scale: 0.92, y: 15 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.92, y: -15 }}
                  transition={{ duration: 0.4 }}
                  className="flex flex-col items-center gap-3 px-4 w-full max-w-sm"
                >
                  <span className="text-xs font-mono font-bold uppercase tracking-widest text-zinc-400">
                    Daftar Lagu Teratas & Persona
                  </span>

                  {/* Top 5 mini list */}
                  <div className="w-full space-y-1.5 my-1">
                    {report.topTracks.slice(0, 5).map((t, i) => (
                      <div
                        key={t.id}
                        onClick={() => handlePlaySpecificTrack(t)}
                        className="flex items-center justify-between p-2 rounded-xl glass-card border border-white/10 hover:border-white/25 transition-all cursor-pointer group"
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          <span className="w-5 text-center font-mono font-bold text-xs text-zinc-400 group-hover:text-white">
                            #{i + 1}
                          </span>
                          <div className="w-9 h-9 rounded-lg overflow-hidden flex-shrink-0 border border-white/15">
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img
                              src={resolveArtwork(t.name, t.albumArt)}
                              alt={t.name}
                              className="w-full h-full object-cover"
                            />
                          </div>
                          <div className="min-w-0 flex-1 text-left">
                            <p className="text-xs font-bold text-white truncate">{t.name}</p>
                            <p className="text-[11px] text-zinc-400 truncate">{t.artistName}</p>
                          </div>
                        </div>
                        <span className="text-xs font-mono text-zinc-400 pr-1">{t.playCount}x</span>
                      </div>
                    ))}
                    {report.topTracks.length === 0 && (
                      <div className="p-4 rounded-xl glass-card text-xs text-zinc-400 text-center">
                        Belum ada daftar 5 lagu teratas
                      </div>
                    )}
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

            {/* Spotlight #1 Track Card (With instant Play Now button connected to main audio engine) */}
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
                      onClick={handlePlayTopTrack}
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
                  <span>Durasi total: {report.topTrack.totalMinutes} menit</span>
                  <button
                    onClick={handlePlayTopTrack}
                    className="font-bold text-white hover:underline cursor-pointer flex items-center gap-1"
                  >
                    <span>Putar Sekarang</span>
                    <span>→</span>
                  </button>
                </div>
              </div>
            ) : (
              <div className="md:col-span-1 lg:col-span-2 rounded-[28px] glass-panel p-6 border border-white/15 flex flex-col justify-center items-center text-center">
                <Music className="w-8 h-8 text-zinc-500 mb-2" />
                <p className="text-sm font-bold text-zinc-400">Belum ada lagu yang diputar</p>
              </div>
            )}

            {/* Spotlight #1 Top Artist Card */}
            {report.topArtist ? (
              <div className="md:col-span-1 lg:col-span-2 rounded-[28px] glass-panel p-6 border border-white/15 flex flex-col justify-between">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-[11px] font-mono font-bold uppercase tracking-wider text-zinc-400">
                    #1 Top Artist
                  </span>
                  <span className="text-xs font-mono font-bold text-zinc-300">
                    👑 Artis Teratas
                  </span>
                </div>

                <div className="flex items-center gap-4 my-2">
                  <div className="w-20 h-20 rounded-full overflow-hidden shadow-xl border-2 border-white/30 flex-shrink-0">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={resolveArtwork(report.topArtist.name, report.topArtist.image)}
                      alt={report.topArtist.name}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="min-w-0 flex-1">
                    <h3 className="text-xl font-black text-white tracking-tight truncate">
                      {report.topArtist.name}
                    </h3>
                    <p className="text-xs text-zinc-400 font-semibold mt-0.5">
                      {report.topArtist.playCount} total pemutaran
                    </p>
                  </div>
                </div>

                <div className="pt-2 border-t border-white/10 text-xs text-zinc-500">
                  Artis yang paling setia menemanimu di {report.periodLabel}
                </div>
              </div>
            ) : null}

            {/* Listening Persona Aura Card */}
            <div className="md:col-span-2 rounded-[28px] glass-panel p-6 border border-white/15 flex flex-col justify-between">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[11px] font-mono font-bold uppercase tracking-wider text-zinc-400">
                  Listening Aura
                </span>
                <span className="text-xs font-mono font-bold text-zinc-300">
                  {report.aura.vibe}
                </span>
              </div>
              <div className="flex items-center gap-4 my-2">
                <div className="w-16 h-16 rounded-2xl glass-card flex items-center justify-center text-4xl shadow-md border border-white/20 flex-shrink-0">
                  {report.aura.emoji}
                </div>
                <div className="min-w-0 flex-1">
                  <h3 className="text-lg font-bold text-white truncate">
                    {report.aura.name}
                  </h3>
                  <p className="text-xs font-medium text-zinc-300 mt-1 line-clamp-2">
                    {report.aura.description}
                  </p>
                </div>
              </div>
              <div className="pt-2 border-t border-white/10 text-[11px] text-zinc-500 font-mono">
                Tagline: {report.aura.tagline}
              </div>
            </div>

            {/* Top 5 Tracks List Card */}
            <div className="md:col-span-2 lg:col-span-2 rounded-[28px] glass-panel p-6 border border-white/15">
              <div className="flex items-center justify-between mb-4">
                <h4 className="text-sm font-bold text-white">Top 5 Songs</h4>
                <span className="text-xs font-mono text-zinc-400">Ranked by Plays</span>
              </div>
              <div className="space-y-2">
                {report.topTracks.slice(0, 5).map((track, i) => (
                  <div
                    key={track.id}
                    onClick={() => handlePlaySpecificTrack(track)}
                    className="flex items-center justify-between p-2 rounded-xl glass-card hover:bg-white/10 transition-all cursor-pointer group"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <span className="w-4 font-mono font-bold text-xs text-zinc-400 group-hover:text-white">
                        {i + 1}
                      </span>
                      <div className="w-9 h-9 rounded-lg overflow-hidden flex-shrink-0 border border-white/15">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={resolveArtwork(track.name, track.albumArt)}
                          alt={track.name}
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-xs font-bold text-white truncate">{track.name}</p>
                        <p className="text-[11px] text-zinc-400 truncate">{track.artistName}</p>
                      </div>
                    </div>
                    <span className="text-xs font-mono text-zinc-400 font-semibold">{track.playCount}x</span>
                  </div>
                ))}
                {report.topTracks.length === 0 && (
                  <p className="text-xs text-zinc-500 text-center py-4">Belum ada lagu tercatat</p>
                )}
              </div>
            </div>

            {/* Top 5 Artists List Card */}
            <div className="md:col-span-1 lg:col-span-2 rounded-[28px] glass-panel p-6 border border-white/15">
              <div className="flex items-center justify-between mb-4">
                <h4 className="text-sm font-bold text-white">Top 5 Artists</h4>
                <span className="text-xs font-mono text-zinc-400">Paling Sering Didengar</span>
              </div>
              <div className="space-y-2">
                {report.topArtists.slice(0, 5).map((artist, i) => (
                  <div
                    key={artist.name}
                    className="flex items-center justify-between p-2 rounded-xl glass-card hover:bg-white/10 transition-all"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <span className="w-4 font-mono font-bold text-xs text-zinc-400">{i + 1}</span>
                      <div className="w-9 h-9 rounded-full overflow-hidden flex-shrink-0 border border-white/20">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={resolveArtwork(artist.name, artist.image)}
                          alt={artist.name}
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <p className="text-xs font-bold text-white truncate">{artist.name}</p>
                    </div>
                    <span className="text-xs font-mono text-zinc-400 font-semibold">{artist.playCount} plays</span>
                  </div>
                ))}
                {report.topArtists.length === 0 && (
                  <p className="text-xs text-zinc-500 text-center py-4">Belum ada artis tercatat</p>
                )}
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

// ─────────────────────────────────────────────────────────────────────────────
// Embedded Share Replay Card Component (HTML5 Canvas 1080x1350 Specular Titanium)
// ─────────────────────────────────────────────────────────────────────────────
function SharePosterSection({
  report,
  onShowToast,
}: {
  report: PeriodReport;
  onShowToast: (msg: string) => void;
}) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [dataUrl, setDataUrl] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    canvas.width = 1080;
    canvas.height = 1350;

    // Background Titanium Dark Gradient
    const bgGrad = ctx.createLinearGradient(0, 0, 1080, 1350);
    bgGrad.addColorStop(0, "#07080f");
    bgGrad.addColorStop(0.5, "#0e111a");
    bgGrad.addColorStop(1, "#07080f");
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, 1080, 1350);

    // Specular Titanium Card Border
    ctx.strokeStyle = "rgba(255, 255, 255, 0.12)";
    ctx.lineWidth = 4;
    ctx.strokeRect(36, 36, 1080 - 72, 1350 - 72);

    // Header Branding
    ctx.fillStyle = "#ffffff";
    ctx.font = "bold 44px sans-serif";
    ctx.fillText("MUSICKU REPLAY", 80, 130);

    ctx.fillStyle = "rgba(255, 255, 255, 0.6)";
    ctx.font = "600 24px monospace";
    ctx.fillText(report.periodLabel.toUpperCase(), 80, 175);

    // Inner Glass Card Frame
    ctx.fillStyle = "rgba(255, 255, 255, 0.04)";
    ctx.beginPath();
    ctx.roundRect(80, 230, 920, 920, 36);
    ctx.fill();
    ctx.strokeStyle = "rgba(255, 255, 255, 0.15)";
    ctx.lineWidth = 2;
    ctx.stroke();

    // Total Minutes
    ctx.fillStyle = "rgba(255, 255, 255, 0.7)";
    ctx.font = "bold 20px monospace";
    ctx.fillText("TOTAL LISTENING TIME", 140, 310);

    ctx.fillStyle = "#ffffff";
    ctx.font = "900 84px sans-serif";
    ctx.fillText(`${report.totalMinutes.toLocaleString()} MINS`, 140, 400);

    // #1 Track Spotlight
    if (report.topTrack) {
      ctx.fillStyle = "rgba(255, 255, 255, 0.65)";
      ctx.font = "bold 20px monospace";
      ctx.fillText("#1 TOP TRACK", 140, 480);

      ctx.fillStyle = "#ffffff";
      ctx.font = "bold 42px sans-serif";
      const trackName =
        report.topTrack.name.length > 30
          ? report.topTrack.name.substring(0, 28) + "..."
          : report.topTrack.name;
      ctx.fillText(trackName, 140, 535);

      ctx.fillStyle = "rgba(255, 255, 255, 0.8)";
      ctx.font = "500 26px sans-serif";
      ctx.fillText(report.topTrack.artistName, 140, 580);
    }

    // Top 5 Playlist
    ctx.fillStyle = "rgba(255, 255, 255, 0.65)";
    ctx.font = "bold 22px monospace";
    ctx.fillText("TOP 5 PLAYLIST:", 140, 680);

    report.topTracks.slice(0, 5).forEach((t, i) => {
      ctx.fillStyle = "rgba(255, 255, 255, 0.9)";
      ctx.font = "600 24px sans-serif";
      const line = `${i + 1}. ${t.name} - ${t.artistName}`;
      const truncated = line.length > 46 ? line.substring(0, 43) + "..." : line;
      ctx.fillText(truncated, 140, 730 + i * 44);
    });

    // Listening Aura Capsule
    ctx.fillStyle = "rgba(255, 255, 255, 0.1)";
    ctx.beginPath();
    ctx.roundRect(140, 970, 800, 70, 20);
    ctx.fill();
    ctx.strokeStyle = "rgba(255, 255, 255, 0.2)";
    ctx.stroke();

    ctx.fillStyle = "#ffffff";
    ctx.font = "bold 24px sans-serif";
    ctx.fillText(
      `${report.aura.emoji} Listening Aura: ${report.aura.name}`,
      170,
      1014
    );

    // Footer Watermark
    ctx.fillStyle = "rgba(255, 255, 255, 0.45)";
    ctx.font = "600 24px monospace";
    ctx.fillText("musicku.app • Apple iOS 26 Audio Experience", 80, 1220);

    setDataUrl(canvas.toDataURL("image/png"));
  }, [report]);

  const handleDownloadImage = () => {
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
      `🔥 Lagu #1: ${report.topTrack?.name || "Belum ada"} - ${report.topTrack?.artistName || ""}\n` +
      `✨ Listening Aura: ${report.aura.name} (${report.aura.emoji})\n\n` +
      `Cek musik favoritmu di: https://musicku.app/replay`
    );
    window.open(`https://api.whatsapp.com/send?text=${text}`, "_blank");
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
          text: `Raport musik saya di Musicku Replay! Lagu #1: ${report.topTrack?.name || ""}`,
        });
        onShowToast("Berhasil membagikan poster!");
      } else {
        handleDownloadImage();
      }
    } catch {
      handleDownloadImage();
    }
  };

  return (
    <div className="flex flex-col lg:flex-row items-center gap-8 py-4">
      {/* Offscreen Canvas for Rendering */}
      <canvas ref={canvasRef} className="hidden" />

      {/* Poster Preview Card */}
      <div className="relative w-64 sm:w-72 aspect-[4/5] rounded-[28px] overflow-hidden glass-panel border-2 border-white/20 shadow-2xl flex-shrink-0">
        {dataUrl && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={dataUrl} alt="Replay Poster Card" className="w-full h-full object-cover" />
        )}
      </div>

      {/* Action Controls */}
      <div className="flex flex-col items-center lg:items-start text-center lg:text-left gap-4 flex-1">
        <div>
          <span className="text-[11px] font-mono font-bold uppercase tracking-wider text-zinc-400">
            Bagikan Raport
          </span>
          <h3 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight mt-1">
            Share Replay Card
          </h3>
          <p className="text-xs sm:text-sm text-zinc-300 mt-1 max-w-md">
            Pamerkan statistik mendengarkan musikmu ke WhatsApp, Instagram Story, atau simpan poster resolusi tinggi (1080x1350) ke perangkatmu.
          </p>
        </div>

        {/* Share Buttons */}
        <div className="flex flex-wrap items-center justify-center lg:justify-start gap-3 w-full mt-2">
          {/* WhatsApp Button */}
          <button
            onClick={handleShareWhatsApp}
            className="px-5 py-2.5 rounded-full bg-[#25D366] text-black font-bold text-xs hover:bg-[#20bd5a] active:scale-95 transition-all shadow-lg flex items-center gap-2 cursor-pointer"
          >
            <MessageCircle className="w-4 h-4 fill-current" />
            <span>WhatsApp</span>
          </button>

          {/* Instagram / System Share Button */}
          <button
            onClick={handleNativeShare}
            className="px-5 py-2.5 rounded-full bg-white text-zinc-950 font-bold text-xs hover:bg-zinc-200 active:scale-95 transition-all shadow-lg flex items-center gap-2 cursor-pointer"
          >
            <Share2 className="w-4 h-4" />
            <span>Bagikan Poster</span>
          </button>

          {/* Download PNG Button */}
          <button
            onClick={handleDownloadImage}
            className="px-5 py-2.5 rounded-full glass-card hover:bg-white/15 text-white font-bold text-xs active:scale-95 transition-all border border-white/20 flex items-center gap-2 cursor-pointer"
          >
            <Download className="w-4 h-4" />
            <span>Download PNG</span>
          </button>
        </div>
      </div>
    </div>
  );
}
