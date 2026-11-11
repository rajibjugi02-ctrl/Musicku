import { create } from "zustand";
import type { LrcLine } from "@/types/music";

interface LyricsState {
  lines: LrcLine[];
  activeLine: number;
  isLoading: boolean;

  setLyrics: (lines: LrcLine[]) => void;
  setActiveLine: (index: number) => void;
  setLoading: (v: boolean) => void;
  clearLyrics: () => void;

  // Call this every tick with current playback position (seconds)
  syncToPosition: (positionSec: number) => void;
}

export const useLyricsStore = create<LyricsState>((set, get) => ({
  lines: [],
  activeLine: 0,
  isLoading: false,

  setLyrics: (lines) => set({ lines, activeLine: 0 }),
  setActiveLine: (index) => set({ activeLine: index }),
  setLoading: (v) => set({ isLoading: v }),
  clearLyrics: () => set({ lines: [], activeLine: 0, isLoading: false }),

  syncToPosition(positionSec) {
    const { lines } = get();
    if (!lines.length) return;

    let active = 0;
    for (let i = 0; i < lines.length; i++) {
      if (lines[i].time <= positionSec) active = i;
      else break;
    }

    if (active !== get().activeLine) set({ activeLine: active });
  },
}));
