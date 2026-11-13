"use client";

import { useEffect, useState } from "react";
import { Clock } from "lucide-react";
import TrackCard from "@/components/ui/TrackCard";
import type { PlayerTrack } from "@/types/music";

interface HistoryItem {
  id: string;
  trackId: string;
  trackName: string;
  artistName: string;
  albumName: string;
  albumArt: string;
  duration: number;
  playedAt: string;
}

export default function PlayHistory() {
  const [history, setHistory] = useState<HistoryItem[]>([]);

  useEffect(() => {
    fetch("/api/history")
      .then((r) => (r.ok ? r.json() : []))
      .then(setHistory)
      .catch(() => {});
  }, []);

  if (!history.length) return null;

  const tracks: PlayerTrack[] = history.map((h) => ({
    id: h.trackId,
    uri: `spotify:track:${h.trackId}`,
    name: h.trackName,
    artistName: h.artistName,
    albumName: h.albumName,
    albumArt: h.albumArt,
    duration: h.duration,
    previewUrl: null,
    explicit: false,
  }));

  return (
    <section>
      <div className="flex items-center gap-2.5 mb-2">
        <Clock className="w-4 h-4 text-emerald-500 dark:text-emerald-400" />
        <h2 className="text-xs font-bold text-zinc-700 dark:text-zinc-300 uppercase tracking-widest">Recently Played (5 Tracks)</h2>
      </div>
      <div className="flex gap-4 overflow-x-auto pt-2 pb-4 no-scrollbar">
        {tracks.map((t) => (
          <TrackCard key={t.id} track={t} queue={tracks} />
        ))}
      </div>
    </section>
  );
}
