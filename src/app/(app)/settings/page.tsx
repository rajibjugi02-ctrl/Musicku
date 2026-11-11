"use client";

import { useSession, signOut } from "next-auth/react";
import { useUIStore } from "@/store/useUIStore";
import { usePlayerStore } from "@/store/usePlayerStore";
import {
  Settings, Moon, Sun, Volume2, ShieldCheck, User,
  Database, Zap, Sliders, LogOut, Sparkles
} from "lucide-react";
import { motion } from "framer-motion";

export default function SettingsPage() {
  const { data: session } = useSession();
  const { theme, toggleTheme } = useUIStore();
  const { audioQuality, setVolume, volume } = usePlayerStore();

  return (
    <div className="p-4 sm:p-8 max-w-5xl w-full mx-auto flex flex-col gap-6">
      {/* Settings Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl glass-pill flex items-center justify-center text-white shadow-lg">
            <Settings className="w-5 h-5 text-indigo-400" />
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-white tracking-tight">Preferences</h1>
            <p className="text-xs text-zinc-400">Configure your visionOS audio & interface preferences</p>
          </div>
        </div>

        <span className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1 rounded-full glass-pill text-[11px] font-mono text-emerald-400">
          <ShieldCheck className="w-3.5 h-3.5" />
          <span>System v2.4 Active</span>
        </span>
      </div>

      {/* 2-Column Bento Grid Layout */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {/* Account Profile Bento */}
        <section className="glass-card rounded-[26px] p-6 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <span className="text-xs font-semibold text-zinc-400 uppercase tracking-widest flex items-center gap-2">
                <User className="w-3.5 h-3.5 text-indigo-400" />
                <span>Account Profile</span>
              </span>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
                Active Session
              </span>
            </div>

            {session?.user ? (
              <div className="flex items-center gap-4 py-2">
                {session.user.image ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={session.user.image}
                    alt={session.user.name ?? "User"}
                    className="w-14 h-14 rounded-2xl object-cover border border-white/20 shadow-xl"
                  />
                ) : (
                  <div className="w-14 h-14 rounded-2xl glass-pill flex items-center justify-center font-bold text-lg text-white">
                    {session.user.name?.[0]?.toUpperCase() ?? "U"}
                  </div>
                )}
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-white truncate">{session.user.name ?? "User"}</p>
                  <p className="text-xs text-zinc-400 truncate mt-0.5">{session.user.email}</p>
                  <p className="text-[10px] text-zinc-500 font-mono mt-1">ID: {session.user.id.slice(0, 12)}...</p>
                </div>
              </div>
            ) : (
              <p className="text-xs text-zinc-400 py-3">User session active.</p>
            )}
          </div>

          <div className="pt-4 border-t border-white/[0.08] mt-4 flex items-center justify-between">
            <span className="text-[11px] text-zinc-500">NextAuth Auth.js v5</span>
            <button
              onClick={() => signOut({ callbackUrl: "/login" })}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl glass-pill text-xs font-medium text-rose-300 hover:text-rose-200 transition-colors"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Sign Out</span>
            </button>
          </div>
        </section>

        {/* Appearance & Glass Theme Bento */}
        <section className="glass-card rounded-[26px] p-6 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <span className="text-xs font-semibold text-zinc-400 uppercase tracking-widest flex items-center gap-2">
                <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                <span>Liquid Glass Theme</span>
              </span>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-white/10 text-zinc-300 uppercase">
                {theme} Mode
              </span>
            </div>

            <p className="text-xs text-zinc-400 mb-4 leading-relaxed">
              Switch between **Frosted Obsidian Glass** (Deep slate dark theme) and **Alabaster Liquid Glass** (Frosted milk light theme) with specular highlights.
            </p>

            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => theme !== "dark" && toggleTheme()}
                className={`p-3 rounded-2xl border text-left transition-all ${theme === "dark"
                    ? "glass-pill border-white/40 shadow-lg text-white"
                    : "glass-card border-white/10 text-zinc-400 hover:text-white"
                  }`}
              >
                <Moon className="w-4 h-4 mb-2 text-indigo-400" />
                <p className="text-xs font-semibold">Frosted Obsidian</p>
                <p className="text-[10px] text-zinc-500">Dark Mode</p>
              </button>

              <button
                onClick={() => theme !== "light" && toggleTheme()}
                className={`p-3 rounded-2xl border text-left transition-all ${theme === "light"
                    ? "glass-pill border-white/40 shadow-lg text-white"
                    : "glass-card border-white/10 text-zinc-400 hover:text-white"
                  }`}
              >
                <Sun className="w-4 h-4 mb-2 text-amber-300" />
                <p className="text-xs font-semibold">Alabaster Glass</p>
                <p className="text-[10px] text-zinc-500">Light Mode</p>
              </button>
            </div>
          </div>
        </section>

        {/* Playback & Audio Engine Bento */}
        <section className="glass-card rounded-[26px] p-6 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <span className="text-xs font-semibold text-zinc-400 uppercase tracking-widest flex items-center gap-2">
                <Sliders className="w-3.5 h-3.5 text-cyan-400" />
                <span>Audio Engine</span>
              </span>
              <span className="inline-flex items-center gap-1 text-[10px] font-mono px-2 py-0.5 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400">
                <Zap className="w-3 h-3" />
                <span>{audioQuality.toUpperCase()}</span>
              </span>
            </div>

            <div className="flex flex-col gap-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-medium text-white">Stream Bitrate</p>
                  <p className="text-[11px] text-zinc-500">Lossless 24-bit 48kHz FLAC & 320kbps High-Res</p>
                </div>
                <span className="text-xs font-mono px-2.5 py-1 rounded-xl glass-pill text-zinc-200">
                  Lossless Enabled
                </span>
              </div>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs text-zinc-300 flex items-center gap-2">
                    <Volume2 className="w-4 h-4 text-zinc-400" />
                    <span>Master Audio Output</span>
                  </span>
                  <span className="text-xs font-mono text-indigo-400">{Math.round(volume * 100)}%</span>
                </div>
                <input
                  type="range"
                  min={0}
                  max={1}
                  step={0.01}
                  value={volume}
                  onChange={(e) => setVolume(parseFloat(e.target.value))}
                  className="w-full h-2 bg-white/15 rounded-lg appearance-none cursor-pointer accent-white"
                />
              </div>
            </div>
          </div>
        </section>

        {/* Database & Cloud Sync Bento */}
        <section className="glass-card rounded-[26px] p-6 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <span className="text-xs font-semibold text-zinc-400 uppercase tracking-widest flex items-center gap-2">
                <Database className="w-3.5 h-3.5 text-emerald-400" />
                <span>Neon Cloud Database</span>
              </span>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
                Connected
              </span>
            </div>

            <p className="text-xs text-zinc-400 mb-4 leading-relaxed">
              PostgreSQL instance on Neon.tech (`ap-southeast-1` Singapore) with Prisma ORM client v5.
            </p>

            <div className="flex flex-col gap-2">
              <div className="flex items-center justify-between p-2.5 rounded-xl glass-card">
                <span className="text-[11px] text-zinc-300">PlayHistory Queue</span>
                <span className="text-[10px] font-mono text-zinc-400">Max 5 Tracks (FIFO)</span>
              </div>
              <div className="flex items-center justify-between p-2.5 rounded-xl glass-card">
                <span className="text-[11px] text-zinc-300">Liked Artists Table</span>
                <span className="text-[10px] font-mono text-zinc-400">Synchronized</span>
              </div>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
