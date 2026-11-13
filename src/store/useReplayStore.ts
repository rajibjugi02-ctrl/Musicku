import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { PlayerTrack } from "@/types/music";

export interface ReplayTrackSummary {
  id: string;
  name: string;
  artistName: string;
  albumArt: string;
  albumName: string;
  duration: number;
  playCount: number;
  totalMinutes: number;
}

export interface ReplayArtistSummary {
  name: string;
  playCount: number;
  totalMinutes: number;
  image: string;
}

export interface ListeningAura {
  name: string;
  tagline: string;
  description: string;
  accentBorder: string;
  glowColor: string;
  emoji: string;
  vibe: string;
}

export interface PeriodReport {
  periodKey: string;
  periodLabel: string;
  periodType: "month" | "year";
  totalMinutes: number;
  totalTracksPlayed: number;
  uniqueArtistsCount: number;
  topTrack: ReplayTrackSummary | null;
  topArtist: ReplayArtistSummary | null;
  topTracks: ReplayTrackSummary[];
  topArtists: ReplayArtistSummary[];
  aura: ListeningAura;
  milestoneBadge: string;
}

export interface RawPlayRecord {
  trackId: string;
  name: string;
  artistName: string;
  albumName: string;
  albumArt: string;
  duration: number;
  secondsPlayed: number;
  timestamp: number;
  yearMonth: string; // YYYY-MM
  year: string; // YYYY
}

// iOS 26 Liquid Glass Monochromatic Auras (Clean Titanium, no purple/pink slop)
const AURAS: ListeningAura[] = [
  {
    name: "The Melodic Explorer",
    tagline: "Curious, Broad & Harmonic",
    description: "You journey across diverse soundscapes with an open mind, blending melodic finesse with rich vocal textures.",
    accentBorder: "border-white/25",
    glowColor: "rgba(255, 255, 255, 0.15)",
    emoji: "🌌",
    vibe: "Cosmic Harmony",
  },
  {
    name: "The Nocturnal Dreamer",
    tagline: "Deep, Ambient & Atmospheric",
    description: "Late-night serenity, velvety lows, and evocative lyrics fuel your most focused and reflective hours.",
    accentBorder: "border-zinc-400/25",
    glowColor: "rgba(255, 255, 255, 0.12)",
    emoji: "🌙",
    vibe: "Midnight Velvet",
  },
  {
    name: "The Acoustic Romantic",
    tagline: "Heartfelt, Warm & Intimate",
    description: "Honest songwriting, acoustic warmth, and emotive stories anchor your musical soul.",
    accentBorder: "border-amber-200/25",
    glowColor: "rgba(251, 191, 36, 0.15)",
    emoji: "✨",
    vibe: "Golden Hour",
  },
  {
    name: "The High-Energy Pioneer",
    tagline: "Vibrant, Driving & Dynamic",
    description: "Unstoppable rhythms, vibrant drops, and cinematic beats keep your creative energy dialed to maximum.",
    accentBorder: "border-white/30",
    glowColor: "rgba(255, 255, 255, 0.18)",
    emoji: "⚡",
    vibe: "Pulse Drive",
  },
];

// Fallback high-res cover art resolver for broken Deezer MD5 hashes or blank images
const KNOWN_ARTWORK_FALLBACKS: Record<string, string> = {
  "birds of a feather": "https://is1-ssl.mzstatic.com/image/thumb/Music211/v4/92/9f/69/929f69f1-9977-3a44-d674-11f70c852d1b/24UMGIM36186.rgb.jpg/1000x1000bb.jpg",
  "thinking out loud": "https://is1-ssl.mzstatic.com/image/thumb/Music125/v4/2d/36/f9/2d36f9a7-2c3e-ce0f-7fb6-036feecb221f/825646974450.jpg/1000x1000bb.jpg",
  "cruel summer": "https://is1-ssl.mzstatic.com/image/thumb/Music125/v4/49/3d/ab/493dab54-f920-9043-6181-80993b8116c9/19UMGIM53909.rgb.jpg/1000x1000bb.jpg",
  "yellow": "https://is1-ssl.mzstatic.com/image/thumb/Music221/v4/f5/93/8c/f5938c49-964c-31d1-4b33-78b634f71fb7/190295978075.jpg/1000x1000bb.jpg",
  "die with a smile": "https://is1-ssl.mzstatic.com/image/thumb/Music221/v4/11/ae/f2/11aef294-f57c-bab9-c9fc-529162984e62/24UMGIM85348.rgb.jpg/1000x1000bb.jpg",
};

export function resolveArtwork(trackName?: string, currentUrl?: string): string {
  if (
    currentUrl &&
    currentUrl.trim() !== "" &&
    !currentUrl.includes("d41d8cd98f00b204e9800998ecf8427e") &&
    !currentUrl.includes("placeholder")
  ) {
    return currentUrl;
  }
  const cleanName = (trackName || "").toLowerCase().trim();
  for (const [key, url] of Object.entries(KNOWN_ARTWORK_FALLBACKS)) {
    if (cleanName.includes(key)) {
      return url;
    }
  }
  return "https://is1-ssl.mzstatic.com/image/thumb/Music211/v4/92/9f/69/929f69f1-9977-3a44-d674-11f70c852d1b/24UMGIM36186.rgb.jpg/1000x1000bb.jpg";
}

interface ReplayState {
  records: RawPlayRecord[];
  activePeriodType: "month" | "year";
  selectedMonth: string;
  selectedYear: string;

  setActivePeriodType: (type: "month" | "year") => void;
  setSelectedMonth: (ym: string) => void;
  setSelectedYear: (y: string) => void;

  recordListening: (track: PlayerTrack, seconds: number) => void;
  getPeriodReport: (type: "month" | "year", periodKey?: string) => PeriodReport;
  resetAllTelemetry: () => void;
}

export const useReplayStore = create<ReplayState>()(
  persist(
    (set, get) => {
      const now = new Date();
      const initialYear = String(now.getFullYear());
      const initialMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;

      return {
        // 100% Real-Time: Zero Mock / Zero Seed records on initialization
        records: [],
        activePeriodType: "month",
        selectedMonth: initialMonth,
        selectedYear: initialYear,

        setActivePeriodType: (type) => set({ activePeriodType: type }),
        setSelectedMonth: (ym) => set({ selectedMonth: ym }),
        setSelectedYear: (y) => set({ selectedYear: y }),

        recordListening: (track, seconds) => {
          if (!track || seconds <= 0) return;
          const timestamp = Date.now();
          const dateObj = new Date(timestamp);
          const year = String(dateObj.getFullYear());
          const monthStr = String(dateObj.getMonth() + 1).padStart(2, "0");
          const yearMonth = `${year}-${monthStr}`;

          const resolvedArt = resolveArtwork(track.name, track.albumArt);

          set((s) => {
            const currentRecords = s.records || [];
            const latest = currentRecords[0];

            // Coalesce rapid 5s playback heartbeat intervals into the same session
            if (
              latest &&
              latest.trackId === track.id &&
              latest.yearMonth === yearMonth &&
              timestamp - latest.timestamp < 15000
            ) {
              const updatedRecord: RawPlayRecord = {
                ...latest,
                secondsPlayed: latest.secondsPlayed + Math.round(seconds),
                timestamp,
                albumArt: resolvedArt,
              };
              return {
                records: [updatedRecord, ...currentRecords.slice(1)],
              };
            }

            // Start a new distinct playback record
            const newRecord: RawPlayRecord = {
              trackId: track.id,
              name: track.name,
              artistName: track.artistName,
              albumName: track.albumName || "Single",
              albumArt: resolvedArt,
              duration: track.duration || 180000,
              secondsPlayed: Math.round(seconds),
              timestamp,
              yearMonth,
              year,
            };

            return {
              records: [newRecord, ...currentRecords.slice(0, 1999)],
            };
          });
        },

        getPeriodReport: (type, periodKey) => {
          const state = get();
          const targetKey = periodKey || (type === "month" ? state.selectedMonth : state.selectedYear);

          // Filter records by exact calendar month (YYYY-MM) or year (YYYY)
          const matching = (state.records || []).filter((r) =>
            type === "month" ? r.yearMonth === targetKey : r.year === targetKey
          );

          if (matching.length === 0) {
            let emptyLabel = targetKey;
            if (type === "month") {
              const [y, m] = targetKey.split("-");
              const monthNames = [
                "Januari", "Februari", "Maret", "April", "Mei", "Juni",
                "Juli", "Agustus", "September", "Oktober", "November", "Desember",
              ];
              const mIdx = parseInt(m, 10) - 1;
              emptyLabel = `${monthNames[mIdx] || m} ${y}`;
            } else {
              emptyLabel = `Year ${targetKey} Wrapped`;
            }

            return {
              periodKey: targetKey,
              periodLabel: emptyLabel,
              periodType: type,
              totalMinutes: 0,
              totalTracksPlayed: 0,
              uniqueArtistsCount: 0,
              topTrack: null,
              topArtist: null,
              topTracks: [],
              topArtists: [],
              aura: AURAS[0],
              milestoneBadge: "Pendengar Baru",
            };
          }

          const totalSeconds = matching.reduce((acc, r) => acc + (r.secondsPlayed || 0), 0);
          const totalMinutes = Math.round(totalSeconds / 60);
          const totalTracksPlayed = matching.length;

          // Track map with resolved high-res artworks
          const trackMap = new Map<string, ReplayTrackSummary>();
          matching.forEach((r) => {
            const resolvedArt = resolveArtwork(r.name, r.albumArt);
            const existing = trackMap.get(r.trackId);
            if (existing) {
              existing.playCount += 1;
              existing.totalMinutes += Math.round(r.secondsPlayed / 60);
            } else {
              trackMap.set(r.trackId, {
                id: r.trackId,
                name: r.name,
                artistName: r.artistName,
                albumArt: resolvedArt,
                albumName: r.albumName,
                duration: r.duration,
                playCount: 1,
                totalMinutes: Math.round(r.secondsPlayed / 60),
              });
            }
          });

          const sortedTracks = Array.from(trackMap.values())
            .sort((a, b) => b.playCount - a.playCount || b.totalMinutes - a.totalMinutes)
            .slice(0, 5);

          // Artist map
          const artistMap = new Map<string, ReplayArtistSummary>();
          matching.forEach((r) => {
            const resolvedArt = resolveArtwork(r.name, r.albumArt);
            const existing = artistMap.get(r.artistName);
            if (existing) {
              existing.playCount += 1;
              existing.totalMinutes += Math.round(r.secondsPlayed / 60);
            } else {
              artistMap.set(r.artistName, {
                name: r.artistName,
                playCount: 1,
                totalMinutes: Math.round(r.secondsPlayed / 60),
                image: resolvedArt,
              });
            }
          });

          const sortedArtists = Array.from(artistMap.values())
            .sort((a, b) => b.playCount - a.playCount || b.totalMinutes - a.totalMinutes)
            .slice(0, 5);

          const topTrack = sortedTracks[0] || null;
          const topArtist = sortedArtists[0] || null;
          const uniqueArtistsCount = artistMap.size;

          const auraIndex = (totalMinutes + totalTracksPlayed) % AURAS.length;
          const aura = AURAS[auraIndex];

          let milestoneBadge = "Pendengar Baru";
          if (totalMinutes > 1500) milestoneBadge = "Top 0.5% Superfan";
          else if (totalMinutes > 600) milestoneBadge = "Top 1% Devotee";
          else if (totalMinutes > 250) milestoneBadge = "Avid Listener";
          else if (totalMinutes > 30) milestoneBadge = "Music Explorer";

          let periodLabel = targetKey;
          if (type === "month") {
            const [y, m] = targetKey.split("-");
            const monthNames = [
              "Januari", "Februari", "Maret", "April", "Mei", "Juni",
              "Juli", "Agustus", "September", "Oktober", "November", "Desember",
            ];
            const mIdx = parseInt(m, 10) - 1;
            periodLabel = `${monthNames[mIdx] || m} ${y}`;
          } else {
            periodLabel = `Year ${targetKey} Wrapped`;
          }

          return {
            periodKey: targetKey,
            periodLabel,
            periodType: type,
            totalMinutes,
            totalTracksPlayed,
            uniqueArtistsCount,
            topTrack,
            topArtist,
            topTracks: sortedTracks,
            topArtists: sortedArtists,
            aura,
            milestoneBadge,
          };
        },

        resetAllTelemetry: () => {
          set({ records: [] });
        },
      };
    },
    {
      name: "musicku-replay-v3",
      version: 3,
      // Purge any legacy seed dummy records and force year to current year (remove 2025)
      migrate: (persistedState: any) => {
        if (persistedState) {
          const currentYear = String(new Date().getFullYear());
          persistedState.selectedYear = currentYear;

          if (persistedState.records && Array.isArray(persistedState.records)) {
            persistedState.records = persistedState.records
              .filter(
                (r: RawPlayRecord) =>
                  r &&
                  r.trackId &&
                  !r.trackId.startsWith("seed") &&
                  r.year !== "2025"
              )
              .map((r: RawPlayRecord) => ({
                ...r,
                albumArt: resolveArtwork(r.name, r.albumArt),
              }));
          }
        }
        return persistedState;
      },
    }
  )
);
