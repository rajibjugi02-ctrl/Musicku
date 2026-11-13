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
  accentGradient: string;
  glowColor: string;
  emoji: string;
  vibe: string;
}

export interface PeriodReport {
  periodKey: string; // e.g., "2026-11" or "2026"
  periodLabel: string; // e.g., "November 2026" or "2026 Wrapped"
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
  yearMonth: string; // "YYYY-MM"
  year: string; // "YYYY"
}

const AURAS: ListeningAura[] = [
  {
    name: "The Melodic Explorer",
    tagline: "Curious, Broad & Harmonium",
    description: "You journey across diverse soundscapes with an open mind, blending melodic finesse with rich vocal textures.",
    accentGradient: "from-indigo-500 via-purple-500 to-pink-500",
    glowColor: "rgba(99, 102, 241, 0.4)",
    emoji: "🌌",
    vibe: "Cosmic Harmony",
  },
  {
    name: "The Nocturnal Dreamer",
    tagline: "Deep, Ambient & Atmospheric",
    description: "Late-night serenity, velvety lows, and evocative lyrics fuel your most focused and reflective hours.",
    accentGradient: "from-blue-600 via-cyan-500 to-indigo-700",
    glowColor: "rgba(37, 99, 235, 0.4)",
    emoji: "🌙",
    vibe: "Midnight Velvet",
  },
  {
    name: "The Acoustic Romantic",
    tagline: "Heartfelt, Warm & Intimate",
    description: "Honest songwriting, acoustic warmth, and emotive stories anchor your musical soul.",
    accentGradient: "from-rose-500 via-amber-500 to-orange-400",
    glowColor: "rgba(244, 63, 94, 0.4)",
    emoji: "✨",
    vibe: "Golden Hour",
  },
  {
    name: "The High-Energy Pioneer",
    tagline: "Vibrant, Driving & Dynamic",
    description: "Unstoppable rhythms, vibrant drops, and cinematic beats keep your creative energy dialed to maximum.",
    accentGradient: "from-emerald-400 via-teal-500 to-cyan-600",
    glowColor: "rgba(16, 185, 129, 0.4)",
    emoji: "⚡",
    vibe: "Pulse Drive",
  },
];

const SEED_TRACKS: PlayerTrack[] = [
  {
    id: "seed-1",
    uri: "spotify:track:seed-1",
    name: "BIRDS OF A FEATHER",
    artistName: "Billie Eilish",
    albumName: "HIT ME HARD AND SOFT",
    albumArt: "https://cdn-images.dzcdn.net/images/cover/a437f81882d2786720f4c9c10467a726/1000x1000-000000-80-0-0.jpg",
    duration: 196000,
    previewUrl: null,
    explicit: false,
  },
  {
    id: "seed-2",
    uri: "spotify:track:seed-2",
    name: "Thinking Out Loud",
    artistName: "Ed Sheeran",
    albumName: "x (Deluxe Edition)",
    albumArt: "https://cdn-images.dzcdn.net/images/cover/2c45e43a9dc745330386cfc5feee0642/1000x1000-000000-80-0-0.jpg",
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
    albumArt: "https://cdn-images.dzcdn.net/images/cover/cc2495870fe1a792ad0cdb05501ad5ec/1000x1000-000000-80-0-0.jpg",
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
    albumArt: "https://cdn-images.dzcdn.net/images/cover/973809864ad1c52d8c61238662400089/1000x1000-000000-80-0-0.jpg",
    duration: 269000,
    previewUrl: null,
    explicit: false,
  },
  {
    id: "seed-5",
    uri: "spotify:track:seed-5",
    name: "Die With A Smile",
    artistName: "Lady Gaga & Bruno Mars",
    albumName: "Die With A Smile",
    albumArt: "https://cdn-images.dzcdn.net/images/cover/8eab1a9a644889aabaca1e193e05f984/1000x1000-000000-80-0-0.jpg",
    duration: 251000,
    previewUrl: null,
    explicit: false,
  },
];

function generateSeedRecords(): RawPlayRecord[] {
  const records: RawPlayRecord[] = [];
  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth() + 1; // 1-12

  // Distribute realistic listening plays across recent months
  const playDistribution = [
    { track: SEED_TRACKS[0], count: 48, minutesPerPlay: 3.2 },
    { track: SEED_TRACKS[1], count: 36, minutesPerPlay: 4.6 },
    { track: SEED_TRACKS[2], count: 31, minutesPerPlay: 2.9 },
    { track: SEED_TRACKS[3], count: 24, minutesPerPlay: 4.4 },
    { track: SEED_TRACKS[4], count: 19, minutesPerPlay: 4.1 },
  ];

  playDistribution.forEach(({ track, count, minutesPerPlay }) => {
    for (let i = 0; i < count; i++) {
      // Pick a random month between Jan and currentMonth
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
  selectedMonth: string; // "YYYY-MM"
  selectedYear: string; // "YYYY"

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

          const newRecord: RawPlayRecord = {
            trackId: track.id,
            name: track.name,
            artistName: track.artistName,
            albumName: track.albumName,
            albumArt: track.albumArt,
            duration: track.duration,
            secondsPlayed: Math.round(seconds),
            timestamp: Date.now(),
            yearMonth,
            year,
          };

          set((s) => ({
            records: [newRecord, ...s.records.slice(0, 1999)], // keep last 2000 records
          }));
        },

        getPeriodReport: (type, periodKey) => {
          const state = get();
          const targetKey = periodKey || (type === "month" ? state.selectedMonth : state.selectedYear);

          // Filter records by period
          const matching = state.records.filter((r) =>
            type === "month" ? r.yearMonth === targetKey : r.year === targetKey
          );

          // Calculate total minutes & track counts
          const totalSeconds = matching.reduce((acc, r) => acc + (r.secondsPlayed || 0), 0);
          const totalMinutes = Math.max(1, Math.round(totalSeconds / 60));
          const totalTracksPlayed = matching.length;

          // Aggregate top tracks
          const trackMap = new Map<string, ReplayTrackSummary>();
          matching.forEach((r) => {
            const existing = trackMap.get(r.trackId);
            if (existing) {
              existing.playCount += 1;
              existing.totalMinutes += Math.round(r.secondsPlayed / 60);
            } else {
              trackMap.set(r.trackId, {
                id: r.trackId,
                name: r.name,
                artistName: r.artistName,
                albumArt: r.albumArt,
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

          // Aggregate top artists
          const artistMap = new Map<string, ReplayArtistSummary>();
          matching.forEach((r) => {
            const existing = artistMap.get(r.artistName);
            if (existing) {
              existing.playCount += 1;
              existing.totalMinutes += Math.round(r.secondsPlayed / 60);
            } else {
              artistMap.set(r.artistName, {
                name: r.artistName,
                playCount: 1,
                totalMinutes: Math.round(r.secondsPlayed / 60),
                image: r.albumArt,
              });
            }
          });

          const sortedArtists = Array.from(artistMap.values())
            .sort((a, b) => b.playCount - a.playCount || b.totalMinutes - a.totalMinutes)
            .slice(0, 5);

          const topTrack = sortedTracks[0] || null;
          const topArtist = sortedArtists[0] || null;
          const uniqueArtistsCount = artistMap.size;

          // Determine Listening Aura based on top tracks & mood
          const auraIndex = (totalMinutes + totalTracksPlayed) % AURAS.length;
          const aura = AURAS[auraIndex];

          // Milestone badge (e.g. "Top 1% Listener", "Audiophile Gold", etc.)
          let milestoneBadge = "Music Enthusiast";
          if (totalMinutes > 1500) milestoneBadge = "Top 0.5% Superfan";
          else if (totalMinutes > 600) milestoneBadge = "Top 1% Devotee";
          else if (totalMinutes > 250) milestoneBadge = "Avid Listener";

          // Format label
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
    }
  )
);

