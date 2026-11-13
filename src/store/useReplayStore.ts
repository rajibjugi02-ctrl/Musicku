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

// Verified high-res Apple Music / iTunes CDN artworks (100% genuine cover art)
const SEED_TRACKS: PlayerTrack[] = [
  {
    id: "seed-1",
    uri: "spotify:track:seed-1",
    name: "BIRDS OF A FEATHER",
    artistName: "Billie Eilish",
    albumName: "HIT ME HARD AND SOFT",
    albumArt: "https://is1-ssl.mzstatic.com/image/thumb/Music211/v4/92/9f/69/929f69f1-9977-3a44-d674-11f70c852d1b/24UMGIM36186.rgb.jpg/1000x1000bb.jpg",
    duration: 196000,
    previewUrl: null,
    explicit: false,
  },
  {
    id: "seed-2",
    uri: "spotify:track:seed-2",
    name: "Thinking Out Loud",
    artistName: "Ed Sheeran",
    albumName: "x (Wembley Edition)",
    albumArt: "https://is1-ssl.mzstatic.com/image/thumb/Music125/v4/2d/36/f9/2d36f9a7-2c3e-ce0f-7fb6-036feecb221f/825646974450.jpg/1000x1000bb.jpg",
    duration: 281000,
    previewUrl: null,
    explicit: false,
  },
  {
    id: "seed-3",
    uri: "spotify:track:seed-3",
    name: "Cruel Summer",
    artistName: "Taylor Swift",
    albumName: "Lover",
    albumArt: "https://is1-ssl.mzstatic.com/image/thumb/Music125/v4/49/3d/ab/493dab54-f920-9043-6181-80993b8116c9/19UMGIM53909.rgb.jpg/1000x1000bb.jpg",
    duration: 178000,
    previewUrl: null,
    explicit: false,
  },
  {
    id: "seed-4",
    uri: "spotify:track:seed-4",
    name: "Yellow",
    artistName: "Coldplay",
    albumName: "Parachutes",
    albumArt: "https://is1-ssl.mzstatic.com/image/thumb/Music221/v4/f5/93/8c/f5938c49-964c-31d1-4b33-78b634f71fb7/190295978075.jpg/1000x1000bb.jpg",
    duration: 269000,
    previewUrl: null,
    explicit: false,
  },
  {
    id: "seed-5",
    uri: "spotify:track:seed-5",
    name: "Die With A Smile",
    artistName: "Lady Gaga & Bruno Mars",
    albumName: "Die With A Smile - Single",
    albumArt: "https://is1-ssl.mzstatic.com/image/thumb/Music221/v4/11/ae/f2/11aef294-f57c-bab9-c9fc-529162984e62/24UMGIM85348.rgb.jpg/1000x1000bb.jpg",
    duration: 251000,
    previewUrl: null,
    explicit: false,
  },
];

// Known track artwork dictionary to rescue any legacy empty placeholders
const TRACK_ARTWORK_FALLBACKS: Record<string, string> = {
  "birds of a feather": "https://is1-ssl.mzstatic.com/image/thumb/Music211/v4/92/9f/69/929f69f1-9977-3a44-d674-11f70c852d1b/24UMGIM36186.rgb.jpg/1000x1000bb.jpg",
  "thinking out loud": "https://is1-ssl.mzstatic.com/image/thumb/Music125/v4/2d/36/f9/2d36f9a7-2c3e-ce0f-7fb6-036feecb221f/825646974450.jpg/1000x1000bb.jpg",
  "cruel summer": "https://is1-ssl.mzstatic.com/image/thumb/Music125/v4/49/3d/ab/493dab54-f920-9043-6181-80993b8116c9/19UMGIM53909.rgb.jpg/1000x1000bb.jpg",
  "yellow": "https://is1-ssl.mzstatic.com/image/thumb/Music221/v4/f5/93/8c/f5938c49-964c-31d1-4b33-78b634f71fb7/190295978075.jpg/1000x1000bb.jpg",
  "die with a smile": "https://is1-ssl.mzstatic.com/image/thumb/Music221/v4/11/ae/f2/11aef294-f57c-bab9-c9fc-529162984e62/24UMGIM85348.rgb.jpg/1000x1000bb.jpg",
};

export function resolveArtwork(trackName?: string, currentUrl?: string): string {
  if (currentUrl && !currentUrl.includes("d41d8cd98f00b204e9800998ecf8427e") && !currentUrl.includes("placeholder")) {
    return currentUrl;
  }
  const cleanName = (trackName || "").toLowerCase().trim();
  for (const [key, url] of Object.entries(TRACK_ARTWORK_FALLBACKS)) {
    if (cleanName.includes(key)) {
      return url;
    }
  }
  return SEED_TRACKS[0].albumArt;
}

function generateSeedRecords(): RawPlayRecord[] {
  const records: RawPlayRecord[] = [];
  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth() + 1;

  const playDistribution = [
    { track: SEED_TRACKS[0], count: 48, minutesPerPlay: 3.2 },
    { track: SEED_TRACKS[1], count: 36, minutesPerPlay: 4.6 },
    { track: SEED_TRACKS[2], count: 31, minutesPerPlay: 2.9 },
    { track: SEED_TRACKS[3], count: 24, minutesPerPlay: 4.4 },
    { track: SEED_TRACKS[4], count: 19, minutesPerPlay: 4.1 },
  ];

  playDistribution.forEach(({ track, count, minutesPerPlay }) => {
    for (let i = 0; i < count; i++) {
      const m = Math.floor(Math.random() * currentMonth) + 1;
      const monthStr = String(m).padStart(2, "0");
      const yearMonth = `${currentYear}-${monthStr}`;

      records.push({
        trackId: track.id,
        name: track.name,
        artistName: track.artistName,
        albumName: track.albumName,
        albumArt: track.albumArt,
        duration: track.duration,
        secondsPlayed: Math.round(minutesPerPlay * 60),
        timestamp: Date.now() - (count - i) * 86400000 * 2,
        yearMonth,
        year: String(currentYear),
      });
    }
  });

  return records;
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
        records: generateSeedRecords(),
        activePeriodType: "month",
        selectedMonth: initialMonth,
        selectedYear: initialYear,

        setActivePeriodType: (type) => set({ activePeriodType: type }),
        setSelectedMonth: (ym) => set({ selectedMonth: ym }),
        setSelectedYear: (y) => set({ selectedYear: y }),

        recordListening: (track, seconds) => {
          if (!track || seconds <= 0) return;
          const currentDate = new Date();
          const year = String(currentDate.getFullYear());
          const monthStr = String(currentDate.getMonth() + 1).padStart(2, "0");
          const yearMonth = `${year}-${monthStr}`;

          const resolvedArt = resolveArtwork(track.name, track.albumArt);

          const newRecord: RawPlayRecord = {
            trackId: track.id,
            name: track.name,
            artistName: track.artistName,
            albumName: track.albumName,
            albumArt: resolvedArt,
            duration: track.duration,
            secondsPlayed: Math.round(seconds),
            timestamp: Date.now(),
            yearMonth,
            year,
          };

          set((s) => ({
            records: [newRecord, ...s.records.slice(0, 1999)],
          }));
        },

        getPeriodReport: (type, periodKey) => {
          const state = get();
          const targetKey = periodKey || (type === "month" ? state.selectedMonth : state.selectedYear);

          const matching = state.records.filter((r) =>
            type === "month" ? r.yearMonth === targetKey : r.year === targetKey
          );

          const totalSeconds = matching.reduce((acc, r) => acc + (r.secondsPlayed || 0), 0);
          const totalMinutes = Math.max(1, Math.round(totalSeconds / 60));
          const totalTracksPlayed = matching.length;

          // Track map with resolved high-res artworks
          const trackMap = new Map<string, ReplayTrackSummary>();
          matching.forEach((r) => {
            const resolvedArt = resolveArtwork(r.name, r.albumArt);
            const existing = trackMap.get(r.trackId);
            if (existing) {
              existing.playCount += 1;
              existing.totalMinutes += Math.round(r.secondsPlayed / 60);
              if (existing.albumArt.includes("d41d8cd98f00b204e9800998ecf8427e") || existing.albumArt.includes("placeholder")) {
                existing.albumArt = resolvedArt;
              }
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
              if (existing.image.includes("d41d8cd98f00b204e9800998ecf8427e") || existing.image.includes("placeholder")) {
                existing.image = resolvedArt;
              }
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

          let milestoneBadge = "Avid Listener";
          if (totalMinutes > 1500) milestoneBadge = "Top 0.5% Superfan";
          else if (totalMinutes > 600) milestoneBadge = "Top 1% Devotee";
          else if (totalMinutes > 250) milestoneBadge = "Avid Listener";

          let periodLabel = targetKey;
          if (type === "month") {
            const [y, m] = targetKey.split("-");
            const monthNames = [
              "January", "February", "March", "April", "May", "June",
              "July", "August", "September", "October", "November", "December",
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
          set({ records: generateSeedRecords() });
        },
      };
    },
    {
      name: "musicku-replay",
      // Sanitize legacy records to clear any broken Deezer 404 images from user's storage
      migrate: (persistedState: any) => {
        if (persistedState?.records && Array.isArray(persistedState.records)) {
          persistedState.records = persistedState.records.map((r: RawPlayRecord) => ({
            ...r,
            albumArt: resolveArtwork(r.name, r.albumArt),
          }));
        }
        return persistedState;
      },
    }
  )
);
