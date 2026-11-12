import { create } from "zustand";
import type { LrcLine } from "@/types/music";

interface LyricsState {
  lines: LrcLine[];
  activeLine: number;          // -1 if in instrumental prelude before first line
  isLoading: boolean;
  isInstrumental: boolean;     // true if current gap > 5s before next lyric
  instrumentalCountdown: number; // seconds remaining in current instrumental section
  lyricOffset: number;         // manual user timing offset in seconds (e.g. -0.5s, +0.5s)

  setLyrics: (lines: LrcLine[]) => void;
  setActiveLine: (index: number) => void;
  setLoading: (v: boolean) => void;
  setLyricOffset: (offset: number) => void;
  adjustLyricOffset: (delta: number) => void;
  resetLyricOffset: () => void;
  clearLyrics: () => void;

  fetchLyrics: (track: string, artist: string, durationSec: number) => Promise<void>;
  syncToPosition: (positionSec: number) => void;
}

let activeFetchController: AbortController | null = null;

export const useLyricsStore = create<LyricsState>((set, get) => ({
  lines: [],
  activeLine: -1,
  isLoading: false,
  isInstrumental: false,
  instrumentalCountdown: 0,
  lyricOffset: 0,

  setLyrics: (lines) => set({ lines, activeLine: -1, isInstrumental: false }),
  setActiveLine: (index) => set({ activeLine: index }),
  setLoading: (v) => set({ isLoading: v }),
  setLyricOffset: (offset) => set({ lyricOffset: Math.round(offset * 10) / 10 }),
  adjustLyricOffset: (delta) =>
    set((s) => ({
      lyricOffset: Math.max(-10, Math.min(10, Math.round((s.lyricOffset + delta) * 10) / 10)),
    })),
  resetLyricOffset: () => set({ lyricOffset: 0 }),
  clearLyrics: () =>
    set({
      lines: [],
      activeLine: -1,
      isLoading: false,
      isInstrumental: false,
      instrumentalCountdown: 0,
    }),

  async fetchLyrics(track, artist, durationSec) {
    if (!track.trim()) return;

    if (activeFetchController) {
      activeFetchController.abort();
    }
    const controller = new AbortController();
    activeFetchController = controller;

    set({ isLoading: true });

    try {
      const params = new URLSearchParams({
        track: track.trim(),
        artist: artist.trim(),
        duration: String(Math.round(durationSec)),
      });

      const res = await fetch(`/api/lyrics?${params}`, { signal: controller.signal });
      if (res.ok) {
        const data = await res.json();
        const lines: LrcLine[] = data.lines || [];
        set({ lines, isLoading: false, activeLine: -1 });
      } else {
        set({ lines: [], isLoading: false });
      }
    } catch (err: unknown) {
      if ((err as Error)?.name === "AbortError") return;
      set({ lines: [], isLoading: false });
    } finally {
      if (activeFetchController === controller) {
        activeFetchController = null;
      }
    }
  },

  syncToPosition(positionSec) {
    const { lines, lyricOffset } = get();
    if (!lines.length) return;

    // +0.15s lead-time visual compensation so highlight hits right on vocal onset
    const effectiveTime = positionSec + lyricOffset + 0.15;

    // Case 1: In prelude before first line
    if (effectiveTime < lines[0].time) {
      const gap = lines[0].time - effectiveTime;
      set({
        activeLine: -1,
        isInstrumental: gap > 3,
        instrumentalCountdown: Math.max(0, Math.ceil(gap)),
      });
      return;
    }

    // Case 2: In between or at a lyric line
    let active = 0;
    for (let i = 0; i < lines.length; i++) {
      if (lines[i].time <= effectiveTime) {
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
      const timeUntilNext = nextLine.time - effectiveTime;
      // Gap > 5s and past current vocal window (> 2.5s)
      if (gapDuration > 5 && timeUntilNext > 2 && effectiveTime - currentLine.time > 2.5) {
        isGap = true;
        countdown = Math.max(0, Math.ceil(timeUntilNext));
      }
    }

    set({
      activeLine: active,
      isInstrumental: isGap,
      instrumentalCountdown: countdown,
    });
  },
}));
