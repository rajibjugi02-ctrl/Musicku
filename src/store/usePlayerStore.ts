import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { PlayerTrack } from "@/types/music";

interface CachedStream {
  streamUrl: string;
  duration: number;
  isFallback: boolean;
}

interface PlayerState {
  currentTrack: PlayerTrack | null;
  queue: PlayerTrack[];
  isPlaying: boolean;
  isBuffering: boolean;        // true when audio element is buffering / waiting
  volume: number;              // 0–1
  position: number;            // ms
  duration: number;            // ms
  streamUrl: string | null;     // resolved audio stream URL
  isResolvingStream: boolean;  // stream resolver loading state
  isFallbackStream: boolean;   // true if using 30s preview fallback
  seekTarget: number | null;    // pending seek position in ms
  isShuffle: boolean;
  repeatMode: "none" | "one" | "all";
  audioQuality: "normal" | "lossless" | "hi-res";
  sleepTimerEnd: number | null; // Date.now() ms, null = off, -1 = end of track
  sleepTimerOption: "off" | "15" | "30" | "45" | "60" | "end-of-track";
  isDesktopDetailOpen: boolean; // slide-up desktop track detail sheet
  streamCache: Record<string, CachedStream>; // client-side prefetch cache

  // Actions
  play: (track: PlayerTrack, queue?: PlayerTrack[]) => void;
  pause: () => void;
  resume: () => void;
  togglePlay: () => void;
  next: () => void;
  prev: () => void;
  seekTo: (ms: number) => void;
  clearSeekTarget: () => void;
  setPosition: (ms: number) => void;
  setDuration: (ms: number) => void;
  setStream: (url: string | null, isFallback?: boolean) => void;
  setResolvingStream: (loading: boolean) => void;
  setBuffering: (buffering: boolean) => void;
  setVolume: (v: number) => void;
  setAudioQuality: (q: "normal" | "lossless" | "hi-res") => void;
  setDesktopDetailOpen: (open: boolean) => void;
  prefetchTrackStream: (track: PlayerTrack) => Promise<void>;
  prefetchTrack: (track: PlayerTrack) => Promise<void>;
  generateSmartRadioQueue: (track: PlayerTrack) => Promise<void>;
  addToQueue: (track: PlayerTrack) => void;
  removeFromQueue: (index: number) => void;
  reorderQueue: (from: number, to: number) => void;
  clearQueue: () => void;
  shuffleQueue: () => void;
  toggleShuffle: () => void;
  cycleRepeat: () => void;
  setSleepTimer: (option: "off" | "15" | "30" | "45" | "60" | "end-of-track") => void;
}

export const usePlayerStore = create<PlayerState>()(
  persist(
    (set, get) => ({
      currentTrack: null,
      queue: [],
      isPlaying: false,
      isBuffering: false,
      volume: 0.85,
      position: 0,
      duration: 0,
      streamUrl: null,
      isResolvingStream: false,
      isFallbackStream: false,
      seekTarget: null,
      isShuffle: false,
      repeatMode: "none",
      audioQuality: "lossless",
      sleepTimerEnd: null,
      sleepTimerOption: "off",
      isDesktopDetailOpen: false,
      streamCache: {},

      play(track, queue) {
        const cached = get().streamCache[track.id];

        // Detect if queue is single-track or consists solely of songs from this single artist
        const isMonoArtistQueue =
          !queue ||
          queue.length <= 1 ||
          queue.every(
            (t) =>
              (t.artistName || "").toLowerCase().trim() ===
              (track.artistName || "").toLowerCase().trim()
          );

        set({
          currentTrack: track,
          queue: queue ?? (get().queue.length ? get().queue : [track]),
          isPlaying: true,
          position: 0,
          duration: cached?.duration || track.duration || 180000,
          streamUrl: cached?.streamUrl || null,
          seekTarget: null,
          isResolvingStream: !cached,
          isFallbackStream: false,
          isBuffering: !cached,
        });

        // Trigger Smart Radio Auto-Queue to mix ~35% current artist + ~65% similar vibe artists (Fisher-Yates shuffled)
        if (isMonoArtistQueue) {
          get().generateSmartRadioQueue(track);
        }
      },

      pause() {
        set({ isPlaying: false, isBuffering: false });
      },

      resume() {
        set({ isPlaying: true });
      },

      togglePlay() {
        set((s) => ({ isPlaying: !s.isPlaying }));
      },

      next() {
        const { queue, currentTrack, isShuffle, repeatMode, streamCache } = get();
        if (!currentTrack || queue.length === 0) return;

        if (repeatMode === "one") {
          set({ position: 0, seekTarget: 0, isPlaying: true });
          return;
        }

        const idx = queue.findIndex((t) => t.id === currentTrack.id);
        let nextIdx = isShuffle
          ? Math.floor(Math.random() * queue.length)
          : idx + 1;

        if (nextIdx >= queue.length) {
          if (repeatMode === "all") nextIdx = 0;
          else {
            set({ isPlaying: false, isBuffering: false });
            return;
          }
        }

        const nextTrack = queue[nextIdx] || queue[0];
        const cached = streamCache[nextTrack.id];

        set({
          currentTrack: nextTrack,
          position: 0,
          duration: cached?.duration || nextTrack.duration || 180000,
          streamUrl: cached?.streamUrl || null,
          seekTarget: null,
          isResolvingStream: !cached,
          isFallbackStream: cached?.isFallback || false,
          isPlaying: true,
          isBuffering: !cached,
        });
      },

      prev() {
        const { queue, currentTrack, position, streamCache } = get();
        if (position > 3000) {
          set({ position: 0, seekTarget: 0 });
          return;
        }

        if (!currentTrack || queue.length === 0) return;
        const idx = queue.findIndex((t) => t.id === currentTrack.id);
        const prevIdx = Math.max(0, idx - 1);
        const prevTrack = queue[prevIdx];
        const cached = streamCache[prevTrack.id];

        set({
          currentTrack: prevTrack,
          position: 0,
          duration: cached?.duration || prevTrack.duration || 180000,
          streamUrl: cached?.streamUrl || null,
          seekTarget: null,
          isResolvingStream: !cached,
          isFallbackStream: cached?.isFallback || false,
          isPlaying: true,
          isBuffering: !cached,
        });
      },

      seekTo(ms) {
        const target = Math.max(0, Math.min(ms, get().duration || ms));
        set({ position: target, seekTarget: target });
      },

      clearSeekTarget() {
        set({ seekTarget: null });
      },

      setPosition(ms) {
        set({ position: ms });
      },

      setDuration(ms) {
        set({ duration: ms });
      },

      setStream(url, isFallback = false) {
        set({
          streamUrl: url,
          isFallbackStream: isFallback,
          isResolvingStream: false,
          isBuffering: false,
        });
      },

      setResolvingStream(loading) {
        set({ isResolvingStream: loading });
      },

      setBuffering(buffering) {
        set({ isBuffering: buffering });
      },

      setVolume(v) {
        set({ volume: Math.min(1, Math.max(0, v)) });
      },

      async prefetchTrackStream(track) {
        if (!track || !track.id || get().streamCache[track.id]) return;

        try {
          const params = new URLSearchParams({
            title: track.name,
            artist: track.artistName,
            duration: String(track.duration || 0),
            previewUrl: track.previewUrl || "",
          });

          const res = await fetch(`/api/stream?${params}`);
          if (!res.ok) return;

          const data = await res.json();
          // Prefer direct streamUrl or proxyUrl
          const targetUrl = data.streamUrl || data.proxyUrl;

          if (targetUrl) {
            set((s) => ({
              streamCache: {
                ...s.streamCache,
                [track.id]: {
                  streamUrl: targetUrl,
                  duration: data.duration || track.duration || 180000,
                  isFallback: !!data.isFallback,
                },
              },
            }));
          }
        } catch {
          // Silent catch for background prefetch
        }
      },

      async prefetchTrack(track) {
        return get().prefetchTrackStream(track);
      },

      async generateSmartRadioQueue(track) {
        if (!track || !track.artistName) return;
        try {
          const params = new URLSearchParams({
            action: "radio",
            artist: track.artistName,
            track: track.name,
            trackId: track.id,
          });

          const res = await fetch(`/api/music?${params}`);
          if (!res.ok) return;

          const data = await res.json();
          if (Array.isArray(data) && data.length > 0) {
            const mappedTracks: PlayerTrack[] = data.map((t: {
              id: string;
              name: string;
              duration_ms?: number;
              explicit?: boolean;
              album?: { name: string; images?: { url: string }[] };
              artists?: { name: string }[];
            }) => ({
              id: t.id,
              uri: `spotify:track:${t.id}`,
              name: t.name,
              artistName: t.artists?.[0]?.name || track.artistName,
              albumName: t.album?.name || "",
              albumArt: t.album?.images?.[0]?.url || track.albumArt,
              duration: t.duration_ms || 180000,
              previewUrl: null,
              explicit: t.explicit || false,
            }));

            // Only update queue if currentTrack is still this track
            const current = get().currentTrack;
            if (current && current.id === track.id) {
              set({ queue: [track, ...mappedTracks] });
            }
          }
        } catch {
          // Silent fallback
        }
      },

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

      clearQueue() {
        set({ queue: [] });
      },

      shuffleQueue() {
        const { queue, currentTrack } = get();
        if (queue.length <= 1) return;

        const currentIdx = queue.findIndex((t) => t.id === currentTrack?.id);
        const head = currentIdx !== -1 ? queue.slice(0, currentIdx + 1) : [];
        const tail = currentIdx !== -1 ? queue.slice(currentIdx + 1) : [...queue];

        // Fisher-Yates Shuffle on tail (Up Next)
        const shuffled = [...tail];
        for (let i = shuffled.length - 1; i > 0; i--) {
          const j = Math.floor(Math.random() * (i + 1));
          [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
        }

        set({ queue: [...head, ...shuffled], isShuffle: true });
      },

      toggleShuffle() {
        const nextShuffle = !get().isShuffle;
        set({ isShuffle: nextShuffle });
        if (nextShuffle) {
          get().shuffleQueue();
        }
      },

      cycleRepeat() {
        set((s) => ({
          repeatMode:
            s.repeatMode === "none" ? "all" : s.repeatMode === "all" ? "one" : "none",
        }));
      },

      setAudioQuality(audioQuality) {
        set({ audioQuality });
      },

      setDesktopDetailOpen(isDesktopDetailOpen) {
        set({ isDesktopDetailOpen });
      },

      setSleepTimer(option) {
        if (option === "off") {
          set({ sleepTimerOption: "off", sleepTimerEnd: null });
        } else if (option === "end-of-track") {
          set({ sleepTimerOption: "end-of-track", sleepTimerEnd: -1 });
        } else {
          const minutes = parseInt(option, 10);
          set({
            sleepTimerOption: option,
            sleepTimerEnd: Date.now() + minutes * 60_000,
          });
        }
      },
    }),
    {
      name: "musicku-player-storage",
      partialize: (s) => ({
        volume: s.volume,
        isShuffle: s.isShuffle,
        repeatMode: s.repeatMode,
        audioQuality: s.audioQuality,
      }),
    }
  )
);
