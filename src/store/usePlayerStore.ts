import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { PlayerTrack } from "@/types/music";

interface PlayerState {
  currentTrack: PlayerTrack | null;
  queue: PlayerTrack[];
  isPlaying: boolean;
  volume: number;         // 0–1
  position: number;       // ms
  duration: number;       // ms
  isShuffle: boolean;
  repeatMode: "none" | "one" | "all";
  audioQuality: "normal" | "high" | "lossless";
  sleepTimerEnd: number | null; // Date.now() ms, null = off

  // Actions
  play: (track: PlayerTrack, queue?: PlayerTrack[]) => void;
  pause: () => void;
  resume: () => void;
  togglePlay: () => void;
  next: () => void;
  prev: () => void;
  setPosition: (ms: number) => void;
  setVolume: (v: number) => void;
  addToQueue: (track: PlayerTrack) => void;
  removeFromQueue: (index: number) => void;
  reorderQueue: (from: number, to: number) => void;
  clearQueue: () => void;
  toggleShuffle: () => void;
  cycleRepeat: () => void;
  setSleepTimer: (minutes: number | null) => void;
}

export const usePlayerStore = create<PlayerState>()(
  persist(
    (set, get) => ({
      currentTrack: null,
      queue: [],
      isPlaying: false,
      volume: 0.8,
      position: 0,
      duration: 0,
      isShuffle: false,
      repeatMode: "none",
      audioQuality: "high",
      sleepTimerEnd: null,

      play(track, queue) {
        set({
          currentTrack: track,
          queue: queue ?? get().queue,
          isPlaying: true,
          position: 0,
        });
      },

      pause() {
        set({ isPlaying: false });
      },

      resume() {
        set({ isPlaying: true });
      },

      togglePlay() {
        set((s) => ({ isPlaying: !s.isPlaying }));
      },

      next() {
        const { queue, currentTrack, isShuffle, repeatMode } = get();
        if (!currentTrack) return;

        if (repeatMode === "one") {
          set({ position: 0, isPlaying: true });
          return;
        }

        const idx = queue.findIndex((t) => t.id === currentTrack.id);
        let nextIdx = isShuffle
          ? Math.floor(Math.random() * queue.length)
          : idx + 1;

        if (nextIdx >= queue.length) {
          if (repeatMode === "all") nextIdx = 0;
          else { set({ isPlaying: false }); return; }
        }

        set({ currentTrack: queue[nextIdx], position: 0, isPlaying: true });
      },

      prev() {
        const { queue, currentTrack, position } = get();
        // If more than 3s in, restart; otherwise go back
        if (position > 3000) { set({ position: 0 }); return; }

        if (!currentTrack) return;
        const idx = queue.findIndex((t) => t.id === currentTrack.id);
        const prevIdx = Math.max(0, idx - 1);
        set({ currentTrack: queue[prevIdx], position: 0, isPlaying: true });
      },

      setPosition(ms) { set({ position: ms }); },
      setVolume(v) { set({ volume: Math.min(1, Math.max(0, v)) }); },

      addToQueue(track) {
        set((s) => ({ queue: [...s.queue, track] }));
      },

      removeFromQueue(index) {
        set((s) => ({ queue: s.queue.filter((_, i) => i !== index) }));
      },

      reorderQueue(from, to) {
        set((s) => {
          const q = [...s.queue];
          const [moved] = q.splice(from, 1);
          q.splice(to, 0, moved);
          return { queue: q };
        });
      },

      clearQueue() { set({ queue: [] }); },
      toggleShuffle() { set((s) => ({ isShuffle: !s.isShuffle })); },

      cycleRepeat() {
        set((s) => ({
          repeatMode:
            s.repeatMode === "none" ? "all" : s.repeatMode === "all" ? "one" : "none",
        }));
      },

      setSleepTimer(minutes) {
        set({
          sleepTimerEnd: minutes ? Date.now() + minutes * 60_000 : null,
        });
      },
    }),
    {
      name: "musicku-player",
      partialize: (s) => ({ volume: s.volume, isShuffle: s.isShuffle, repeatMode: s.repeatMode }),
    }
  )
);
