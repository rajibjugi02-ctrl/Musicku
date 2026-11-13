"use client";

import { useUIStore } from "@/store/useUIStore";
import { ListMusic, Mic2, Sparkles, X } from "lucide-react";
import QueuePanel from "@/components/queue/QueuePanel";
import LyricsPanel from "@/components/lyrics/LyricsPanel";
import EnhancementsPanel from "@/components/enhancements/EnhancementsPanel";
import { cn } from "@/lib/utils";

const TABS = [
  { key: "queue", label: "Queue", icon: ListMusic },
  { key: "lyrics", label: "Lyrics", icon: Mic2 },
  { key: "enhancements", label: "Controls", icon: Sparkles },
] as const;

type Panel = "queue" | "lyrics" | "enhancements";

export default function RightSidebar({ onClose }: { onClose?: () => void } = {}) {
  const { rightPanel, setRightPanel } = useUIStore();

  return (
    <div className="flex flex-col h-full overflow-hidden select-none">
      {/* Segmented Glass Tab Controller */}
      <div className="p-3 border-b border-black/[0.08] dark:border-white/[0.08] flex-shrink-0 flex items-center justify-between gap-2">
        <div className="flex-1 flex rounded-2xl glass-card p-1 gap-1">
          {TABS.map(({ key, label, icon: Icon }) => {
            const active = rightPanel === key;
            return (
              <button
                key={key}
                onClick={() => setRightPanel(key as Panel)}
                className={cn(
                  "flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl text-xs font-medium transition-all cursor-pointer",
                  active
                    ? "glass-pill text-zinc-950 dark:text-white font-bold shadow-sm"
                    : "text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-200"
                )}
              >
                <Icon className={cn("w-3.5 h-3.5", active ? "text-indigo-600 dark:text-white" : "text-zinc-500 dark:text-zinc-400")} />
                <span>{label}</span>
              </button>
            );
          })}
        </div>

        {onClose && (
          <button
            onClick={onClose}
            className="p-2 rounded-xl glass-card hover:bg-black/5 dark:hover:bg-white/10 text-zinc-600 dark:text-zinc-400 hover:text-zinc-950 dark:hover:text-white transition-all cursor-pointer flex-shrink-0"
            title="Tutup Panel"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Active Panel View */}
      <div className="flex-1 overflow-hidden relative">
        <div className={cn("h-full", rightPanel === "queue" ? "block" : "hidden")}>
          <QueuePanel />
        </div>
        <div className={cn("h-full", rightPanel === "lyrics" ? "block" : "hidden")}>
          <LyricsPanel />
        </div>
        <div className={cn("h-full", rightPanel === "enhancements" ? "block" : "hidden")}>
          <EnhancementsPanel />
        </div>
      </div>
    </div>
  );
}
