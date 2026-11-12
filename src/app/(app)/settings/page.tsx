"use client";

import { useState, useEffect } from "react";
import { useSession, signOut } from "next-auth/react";
import { useUIStore } from "@/store/useUIStore";
import { usePlayerStore } from "@/store/usePlayerStore";
import {
  Settings,
  Moon,
  Sun,
  Volume2,
  ShieldCheck,
  User,
  Sliders,
  LogOut,
  Sparkles,
  Timer,
  Check,
} from "lucide-react";
import { cn } from "@/lib/utils";

const SLEEP_OPTIONS = [
  { value: "off", label: "Off" },
  { value: "15", label: "15m" },
  { value: "30", label: "30m" },
  { value: "45", label: "45m" },
  { value: "60", label: "60m" },
  { value: "end-of-track", label: "End of Track" },
] as const;

export default function SettingsPage() {
  const { data: session } = useSession();
  const { theme, toggleTheme } = useUIStore();
  const {
    audioQuality,
    setAudioQuality,
    volume,
    setVolume,
    sleepTimerOption,
    sleepTimerEnd,
    setSleepTimer,
  } = usePlayerStore();

  const [remainingSec, setRemainingSec] = useState<number | null>(null);

  // Live Countdown updater for Sleep Timer
  useEffect(() => {
    if (!sleepTimerEnd || sleepTimerEnd <= 0) {
      setRemainingSec(null);
      return;
    }

    const update = () => {
      const diff = Math.max(0, Math.floor((sleepTimerEnd - Date.now()) / 1000));
      setRemainingSec(diff);
    };

    update();
    const interval = setInterval(update, 1000);
    return () => clearInterval(interval);
  }, [sleepTimerEnd]);

  const formatCountdown = (sec: number) => {
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${m}:${String(s).padStart(2, "0")} remaining`;
  };

  return (
    <div className="px-3 sm:px-6 md:px-8 py-4 sm:py-6 max-w-5xl w-full mx-auto flex flex-col gap-6 select-none pb-44 md:pb-8 text-zinc-950 dark:text-zinc-100">
      {/* Settings Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl glass-pill flex items-center justify-center text-zinc-950 dark:text-white shadow-lg">
            <Settings className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl font-extrabold text-zinc-950 dark:text-white tracking-tight">
              Settings & Preferences
            </h1>
            <p className="text-xs text-zinc-600 dark:text-zinc-400">
              Configure your visionOS audio quality, timer, and display theme
            </p>
          </div>
        </div>

        <span className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1 rounded-full glass-pill text-[11px] font-mono text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
          <ShieldCheck className="w-3.5 h-3.5" />
          <span>v2.6 Apple iOS Audio</span>
        </span>
      </div>

      {/* 2-Column Bento Grid Layout */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {/* 1. Audio Engine & Lossless Quality Bento */}
        <section className="glass-panel rounded-[28px] p-6 flex flex-col justify-between bg-white/85 dark:bg-white/[0.04] border border-black/[0.08] dark:border-white/[0.1] shadow-sm">
          <div>
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-bold text-zinc-800 dark:text-zinc-300 uppercase tracking-widest flex items-center gap-2">
                <Sliders className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
                <span>Audio Streaming Quality</span>
              </span>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-600 dark:text-indigo-300 font-bold uppercase">
                {audioQuality === "hi-res"
                  ? "Hi-Res Lossless"
                  : audioQuality === "lossless"
                  ? "ALAC Lossless"
                  : "AAC 160kbps"}
              </span>
            </div>

            <p className="text-xs text-zinc-600 dark:text-zinc-400 mb-4 leading-relaxed">
              Lossless streaming delivers bit-perfect studio recordings up to 24-bit/192kHz ALAC without audio compression artifacts.
            </p>

            {/* Audio Quality Selection Cards */}
            <div className="flex flex-col gap-2.5">
              {[
                {
                  id: "hi-res" as const,
                  title: "Hi-Res Lossless",
                  subtitle: "ALAC up to 24-bit / 192 kHz Studio Master",
                  badge: "Studio Bit-Perfect",
                },
                {
                  id: "lossless" as const,
                  title: "Apple Lossless",
                  subtitle: "ALAC up to 24-bit / 48 kHz High Fidelity",
                  badge: "Full Dynamic Range",
                },
                {
                  id: "normal" as const,
                  title: "High Efficiency",
                  subtitle: "AAC 160 kbps Fast & Data Saving",
                  badge: "Ultra Low Latency",
                },
              ].map((opt) => {
                const isSelected = audioQuality === opt.id;
                return (
                  <button
                    key={opt.id}
                    onClick={() => setAudioQuality(opt.id)}
                    className={cn(
                      "p-3 rounded-2xl border text-left transition-all flex items-center justify-between gap-3 cursor-pointer",
                      isSelected
                        ? "bg-indigo-50 dark:bg-white/10 border-indigo-500 dark:border-white/30 shadow-md ring-1 ring-indigo-500/20"
                        : "bg-black/[0.02] dark:bg-black/20 border-black/[0.06] dark:border-white/[0.06] hover:bg-black/[0.04] dark:hover:bg-white/[0.06]"
                    )}
                  >
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <p className={cn("text-xs font-bold", isSelected ? "text-indigo-600 dark:text-white" : "text-zinc-900 dark:text-zinc-200")}>
                          {opt.title}
                        </p>
                        <span className="text-[9px] font-mono px-1.5 py-0.5 rounded-full bg-black/5 dark:bg-white/10 text-zinc-600 dark:text-zinc-400">
                          {opt.badge}
                        </span>
                      </div>
                      <p className="text-[11px] text-zinc-500 dark:text-zinc-400 mt-0.5 truncate">
                        {opt.subtitle}
                      </p>
                    </div>
                    <div
                      className={cn(
                        "w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 transition-all",
                        isSelected ? "bg-indigo-600 text-white shadow-sm" : "border border-zinc-400 dark:border-zinc-600"
                      )}
                    >
                      {isSelected && <Check className="w-3 h-3 stroke-[3]" />}
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Master Volume Slider */}
            <div className="mt-5 pt-4 border-t border-black/[0.08] dark:border-white/[0.08]">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs text-zinc-700 dark:text-zinc-300 flex items-center gap-2 font-medium">
                  <Volume2 className="w-4 h-4 text-zinc-500" />
                  <span>Master Playback Volume</span>
                </span>
                <span className="text-xs font-mono font-bold text-indigo-600 dark:text-indigo-400">
                  {Math.round(volume * 100)}%
                </span>
              </div>
              <input
                type="range"
                min={0}
                max={1}
                step={0.01}
                value={volume}
                onChange={(e) => setVolume(parseFloat(e.target.value))}
                className="w-full h-2 bg-black/10 dark:bg-white/15 rounded-lg appearance-none cursor-pointer accent-indigo-600 dark:accent-white"
              />
            </div>
          </div>
        </section>

        {/* 2. Sleep Timer Bento */}
        <section className="glass-panel rounded-[28px] p-6 flex flex-col justify-between bg-white/85 dark:bg-white/[0.04] border border-black/[0.08] dark:border-white/[0.1] shadow-sm">
          <div>
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-bold text-zinc-800 dark:text-zinc-300 uppercase tracking-widest flex items-center gap-2">
                <Timer className="w-3.5 h-3.5 text-amber-500" />
                <span>Sleep Timer</span>
              </span>
              {remainingSec !== null && remainingSec > 0 ? (
                <span className="text-[10px] font-mono px-2.5 py-0.5 rounded-full bg-amber-500/15 border border-amber-500/30 text-amber-600 dark:text-amber-300 font-bold animate-pulse">
                  {formatCountdown(remainingSec)}
                </span>
              ) : sleepTimerOption === "end-of-track" ? (
                <span className="text-[10px] font-mono px-2.5 py-0.5 rounded-full bg-indigo-500/15 border border-indigo-500/30 text-indigo-600 dark:text-indigo-300 font-bold">
                  Pauses after current track
                </span>
              ) : (
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-black/5 dark:bg-white/10 text-zinc-500">
                  Inactive
                </span>
              )}
            </div>

            <p className="text-xs text-zinc-600 dark:text-zinc-400 mb-4 leading-relaxed">
              Automatically stops music playback when you fall asleep. Choose a duration or pause seamlessly at the end of the current song.
            </p>

            {/* Sleep Timer Preset Pills */}
            <div className="grid grid-cols-3 gap-2">
              {SLEEP_OPTIONS.map((opt) => {
                const isSelected = sleepTimerOption === opt.value;
                return (
                  <button
                    key={opt.value}
                    onClick={() => setSleepTimer(opt.value)}
                    className={cn(
                      "py-2.5 px-3 rounded-2xl border text-xs font-bold transition-all text-center cursor-pointer",
                      isSelected
                        ? "bg-amber-500 text-white border-amber-500 shadow-md shadow-amber-500/20 scale-[1.02]"
                        : "bg-black/[0.02] dark:bg-black/20 border-black/[0.06] dark:border-white/[0.06] text-zinc-700 dark:text-zinc-300 hover:bg-black/[0.05] dark:hover:bg-white/[0.06]"
                    )}
                  >
                    {opt.label}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="pt-4 border-t border-black/[0.08] dark:border-white/[0.08] mt-6 flex items-center justify-between text-[11px] text-zinc-500">
            <span>Power saving standby</span>
            <span>Zero background drain</span>
          </div>
        </section>

        {/* 3. Appearance & Theme Bento */}
        <section className="glass-panel rounded-[28px] p-6 flex flex-col justify-between bg-white/85 dark:bg-white/[0.04] border border-black/[0.08] dark:border-white/[0.1] shadow-sm">
          <div>
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-bold text-zinc-800 dark:text-zinc-300 uppercase tracking-widest flex items-center gap-2">
                <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                <span>Liquid Glass Appearance</span>
              </span>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-black/5 dark:bg-white/10 text-zinc-700 dark:text-zinc-300 font-bold uppercase">
                {theme} Mode
              </span>
            </div>

            <p className="text-xs text-zinc-600 dark:text-zinc-400 mb-4 leading-relaxed">
              Switch between **Frosted Obsidian** (OLED deep slate dark theme) and **Alabaster Glass** (Crisp high-contrast light theme).
            </p>

            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => theme !== "dark" && toggleTheme()}
                className={cn(
                  "p-3.5 rounded-2xl border text-left transition-all cursor-pointer",
                  theme === "dark"
                    ? "bg-white/15 border-white/40 shadow-lg text-white font-bold"
                    : "bg-black/[0.02] dark:bg-black/20 border-black/[0.08] dark:border-white/[0.08] text-zinc-600 hover:text-zinc-950"
                )}
              >
                <Moon className="w-4 h-4 mb-2 text-indigo-400" />
                <p className="text-xs font-bold">Frosted Obsidian</p>
                <p className="text-[10px] text-zinc-500 font-normal mt-0.5">Dark Mode</p>
              </button>

              <button
                onClick={() => theme !== "light" && toggleTheme()}
                className={cn(
                  "p-3.5 rounded-2xl border text-left transition-all cursor-pointer",
                  theme === "light"
                    ? "bg-amber-50/80 border-amber-400 shadow-md text-zinc-950 font-bold"
                    : "bg-black/[0.02] dark:bg-black/20 border-black/[0.08] dark:border-white/[0.08] text-zinc-400 hover:text-zinc-100"
                )}
              >
                <Sun className="w-4 h-4 mb-2 text-amber-500" />
                <p className="text-xs font-bold">Alabaster Glass</p>
                <p className="text-[10px] text-zinc-500 font-normal mt-0.5">Light Mode</p>
              </button>
            </div>
          </div>
        </section>

        {/* 4. Account Profile Bento */}
        <section className="glass-panel rounded-[28px] p-6 flex flex-col justify-between bg-white/85 dark:bg-white/[0.04] border border-black/[0.08] dark:border-white/[0.1] shadow-sm">
          <div>
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-bold text-zinc-800 dark:text-zinc-300 uppercase tracking-widest flex items-center gap-2">
                <User className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
                <span>Account Profile</span>
              </span>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 font-bold">
                Active Session
              </span>
            </div>

            {session?.user ? (
              <div className="flex items-center gap-3.5 py-2">
                {session.user.image ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={session.user.image}
                    alt={session.user.name ?? "User"}
                    className="w-12 h-12 rounded-2xl object-cover border border-black/10 dark:border-white/20 shadow-md flex-shrink-0"
                  />
                ) : (
                  <div className="w-12 h-12 rounded-2xl glass-pill flex items-center justify-center font-bold text-base text-zinc-900 dark:text-white flex-shrink-0">
                    {session.user.name?.[0]?.toUpperCase() ?? "U"}
                  </div>
                )}
                <div className="min-w-0">
                  <p className="text-xs sm:text-sm font-bold text-zinc-900 dark:text-white truncate">
                    {session.user.name ?? "User"}
                  </p>
                  <p className="text-[11px] text-zinc-600 dark:text-zinc-400 truncate mt-0.5">
                    {session.user.email}
                  </p>
                </div>
              </div>
            ) : (
              <p className="text-xs text-zinc-500 py-3">Logged in as Local Listener.</p>
            )}
          </div>

          <div className="pt-4 border-t border-black/[0.08] dark:border-white/[0.08] mt-4 flex items-center justify-between">
            <span className="text-[11px] text-zinc-500">NextAuth Auth.js v5</span>
            <button
              onClick={() => signOut({ callbackUrl: "/login" })}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl glass-pill text-xs font-semibold text-rose-600 dark:text-rose-400 hover:bg-rose-500/10 transition-colors cursor-pointer"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Sign Out</span>
            </button>
          </div>
        </section>
      </div>
    </div>
  );
}
