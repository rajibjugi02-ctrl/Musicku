import { create } from "zustand";
import type { LrcLine } from "@/types/music";

interface LyricsState {
  lines: LrcLine[];
  activeLine: number;          // -1 if in instrumental prelude before first line
  isLoading: boolean;
  isInstrumental: boolean;     // true if current gap > 5s before next lyric
  instrumentalCountdown: number; // seconds remaining in current instrumental section

  setLyrics: (lines: LrcLine[]) => void;
  setActiveLine: (index: number) => void;
  setLoading: (v: boolean) => void;
  clearLyrics: () => void;

  // Called continuously with playback position in seconds
  syncToPosition: (positionSec: number) => void;
}

export const useLyricsStore = create<LyricsState>((set, get) => ({
  lines: [],
  activeLine: -1,
  isLoading: false,
  isInstrumental: false,
  instrumentalCountdown: 0,

  setLyrics: (lines) => set({ lines, activeLine: -1, isInstrumental: false }),
  setActiveLine: (index) => set({ activeLine: index }),
  setLoading: (v) => set({ isLoading: v }),
  clearLyrics: () =>
    set({
      lines: [],
      activeLine: -1,
      isLoading: false,
      isInstrumental: false,
      instrumentalCountdown: 0,
    }),

  syncToPosition(positionSec) {
    const { lines } = get();
    if (!lines.length) return;

    // Case 1: Before the first lyric line
    if (positionSec < lines[0].time) {
      const gap = lines[0].time - positionSec;
      set({
        activeLine: -1,
        isInstrumental: gap > 4,
        instrumentalCountdown: Math.ceil(gap),
      });
      return;
    }

    // Case 2: In between or at a lyric line
    let active = 0;
    for (let i = 0; i < lines.length; i++) {
      if (lines[i].time <= positionSec) {
        active = i;
      } else {
        break;
      }
    }

    const currentLine = lines[active];
    const nextLine = lines[active + 1];

    let isGap = false;
    let countdown = 0;

    if (nextLine) {
      const gapDuration = nextLine.time - currentLine.time;
      const timeUntilNext = nextLine.time - positionSec;
      // If gap between lines is > 5s and we have passed the current line's text window (> 3s)
      if (gapDuration > 5 && timeUntilNext > 2 && positionSec - currentLine.time > 2.5) {
        isGap = true;
        countdown = Math.ceil(timeUntilNext);
      }
    }

    set({
      activeLine: active,
      isInstrumental: isGap,
      instrumentalCountdown: countdown,
    });
  },
}));
