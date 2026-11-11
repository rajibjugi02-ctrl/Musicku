"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Timer, Zap, Info, Radio } from "lucide-react";
import { usePlayerStore } from "@/store/usePlayerStore";
import WaveformVisualizer from "./WaveformVisualizer";
import { cn } from "@/lib/utils";

const SLEEP_OPTIONS = [15, 30, 45, 60] as const;

export default function EnhancementsPanel() {
  const { currentTrack, sleepTimerEnd, setSleepTimer, audioQuality } = usePlayerStore();
  const [timeLeft, setTimeLeft] = useState<number | null>(null);

  useEffect(() => {
    if (!sleepTimerEnd) { setTimeLeft(null); return; }
    const id = setInterval(() => {
      const left = sleepTimerEnd - Date.now();
      if (left <= 0) {
        usePlayerStore.getState().pause();
        setSleepTimer(null);
        setTimeLeft(null);
      } else {
        setTimeLeft(left);
      }
    }, 1000);
    return () => clearInterval(id);
  }, [sleepTimerEnd, setSleepTimer]);

  const formatLeft = (ms: number) => {
    const m = Math.floor(ms / 60000);
    const s = Math.floor((ms % 60000) / 1000);
    return `${m}:${String(s).padStart(2, "0")}`;
  };

  return (
    <div className="p-4 flex flex-col gap-5 overflow-y-auto h-full">
      {/* Waveform visualizer */}
      <div>
        <p className="text-[10px] uppercase tracking-widest text-zinc-500 mb-2">Waveform</p>
        <WaveformVisualizer />
      </div>

      {/* Audio quality badge */}
      <div>
        <p className="text-[10px] uppercase tracking-widest text-zinc-500 mb-2">Audio Quality</p>
        <div className="flex items-center gap-2">
          <div className={cn(
            "flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium border",
            audioQuality === "lossless"
              ? "bg-blue-500/15 border-blue-500/30 text-blue-300"
              : "bg-zinc-800/60 border-white/10 text-zinc-400"
          )}>
            <Zap className="w-3 h-3" />
            {audioQuality === "lossless" ? "Lossless" : audioQuality === "high" ? "High Quality" : "Normal"}
          </div>
        </div>
      </div>

      {/* About the Artist */}
      {currentTrack && (
        <div>
          <p className="text-[10px] uppercase tracking-widest text-zinc-500 mb-2">About the Artist</p>
          <div className="p-3 rounded-xl bg-white/5 border border-white/8">
            <div className="flex items-center gap-2 mb-2">
              <Radio className="w-3.5 h-3.5 text-zinc-400 flex-shrink-0" />
              <p className="text-sm font-medium text-zinc-200">{currentTrack.artistName}</p>
            </div>
            <p className="text-xs text-zinc-500 leading-relaxed">
              Playing from <span className="text-zinc-400">{currentTrack.albumName}</span>.
              Explore more from this artist in the Library.
            </p>
          </div>
        </div>
      )}

      {/* Sleep timer */}
      <div>
        <p className="text-[10px] uppercase tracking-widest text-zinc-500 mb-2 flex items-center gap-1.5">
          <Timer className="w-3 h-3" /> Sleep Timer
          {timeLeft !== null && (
            <span className="text-zinc-400 normal-case tracking-normal font-mono">
              — {formatLeft(timeLeft)}
            </span>
          )}
        </p>
        <div className="flex flex-wrap gap-1.5">
          {SLEEP_OPTIONS.map((min) => (
            <button
              key={min}
              onClick={() => setSleepTimer(sleepTimerEnd ? null : min)}
              className={cn(
                "px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors",
                sleepTimerEnd
                  ? "bg-zinc-800/40 border-white/8 text-zinc-500"
                  : "bg-zinc-800/60 border-white/10 text-zinc-300 hover:bg-white/10 hover:text-white"
              )}
            >
              {min}m
            </button>
          ))}
          {sleepTimerEnd && (
            <button
              onClick={() => setSleepTimer(null)}
              className="px-3 py-1.5 rounded-lg text-xs font-medium border border-red-500/30 text-red-400 hover:bg-red-500/10 transition-colors"
            >
              Cancel
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

