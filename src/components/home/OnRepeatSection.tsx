"use client";

import { useMemo } from "react";
import { Flame } from "lucide-react";
import TrackCard from "@/components/ui/TrackCard";
import { useReplayStore, resolveArtwork } from "@/store/useReplayStore";
import { isInstrumentalTrack } from "@/lib/utils";
import type { PlayerTrack } from "@/types/music";

export default function OnRepeatSection() {
  const records = useReplayStore((s) => s.records);

  const topRepeatedTracks: PlayerTrack[] = useMemo(() => {
    if (!records || records.length === 0) return [];

    // Aggregate play stats by track ID and track key
    const trackMap = new Map<
      string,
      {
        id: string;
        name: string;
        artistName: string;
        albumName: string;
        albumArt: string;
        duration: number;
        playCount: number;
        secondsPlayed: number;
        lastPlayed: number;
      }
    >();

    for (const record of records) {
      const key = `${record.name.toLowerCase()}:${record.artistName.toLowerCase()}`;
      const existing = trackMap.get(key) || trackMap.get(record.trackId);

      if (existing) {
        existing.playCount += 1;
        existing.secondsPlayed += record.secondsPlayed || 0;
        existing.lastPlayed = Math.max(existing.lastPlayed, record.timestamp);
        if (!existing.albumArt && record.albumArt) {
          existing.albumArt = record.albumArt;
        }
      } else {
        const item = {
          id: record.trackId,
          name: record.name,
          artistName: record.artistName,
          albumName: record.albumName || "Single",
          albumArt: record.albumArt,
          duration: record.duration || 180000,
          playCount: 1,
          secondsPlayed: record.secondsPlayed || 0,
          lastPlayed: record.timestamp,
        };
        trackMap.set(key, item);
      }
    }

    const aggregated = Array.from(trackMap.values());

    // Sort by playCount descending, then secondsPlayed descending
    aggregated.sort((a, b) => {
      if (b.playCount !== a.playCount) {
        return b.playCount - a.playCount;
      }
      return b.secondsPlayed - a.secondsPlayed;
    });

    return aggregated.slice(0, 10).map((t) => ({
      id: t.id,
      uri: `spotify:track:${t.id}`,
      name: t.name,
      artistName: t.artistName,
      albumName: t.albumName,
      albumArt: resolveArtwork(t.name, t.albumArt),
      duration: t.duration,
      previewUrl: null,
      explicit: false,
      isInstrumental: isInstrumentalTrack(t.name, t.albumName),
    }));
  }, [records]);

  if (topRepeatedTracks.length === 0) {
    return null;
  }

  return (
    <section>
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2.5">
          <Flame className="w-4 h-4 text-amber-500 dark:text-amber-400" />
          <h2 className="text-xs font-bold text-zinc-700 dark:text-zinc-300 uppercase tracking-widest">
            On Repeat / Sering Kamu Putar
          </h2>
        </div>
        <span className="text-[11px] font-mono text-zinc-400 dark:text-zinc-500">
          Top {topRepeatedTracks.length} Lagu
        </span>
      </div>
      <div className="flex gap-4 overflow-x-auto pt-2 pb-4 no-scrollbar">
        {topRepeatedTracks.map((track) => (
          <TrackCard
            key={track.id}
            track={track}
            queue={topRepeatedTracks}
            carousel
          />
        ))}
      </div>
    </section>
  );
}
