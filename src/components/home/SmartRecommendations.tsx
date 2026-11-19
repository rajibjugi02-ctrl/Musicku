"use client";

import { useEffect, useState } from "react";
import { Sparkles } from "lucide-react";
import TrackCard from "@/components/ui/TrackCard";
import { usePlayerStore } from "@/store/usePlayerStore";
import { useReplayStore } from "@/store/useReplayStore";
import { useLibraryStore } from "@/store/useLibraryStore";
import type { SpotifyTrack } from "@/types/music";
import { spotifyTrackToPlayerTrack } from "@/lib/utils";

export default function SmartRecommendations() {
  const [tracks, setTracks] = useState<SpotifyTrack[]>([]);
  const currentTrack = usePlayerStore((s) => s.currentTrack);
  const getPeriodReport = useReplayStore((s) => s.getPeriodReport);
  const likedArtists = useLibraryStore((s) => s.likedArtists);

  useEffect(() => {
    const report = getPeriodReport("year");
    const topArtistsList = (report.topArtists || []).map((a) => a.name);
    const likedArtistsList = (likedArtists || []).map((a) => a.name);

    const merged = Array.from(
      new Set(
        [
          currentTrack?.artistName,
          ...topArtistsList,
          ...likedArtistsList,
        ].filter(Boolean) as string[]
      )
    );

    const params = new URLSearchParams();
    if (merged.length > 0) {
      params.set("artists", merged.slice(0, 4).join(","));
    }
    if (currentTrack?.id) {
      params.set("seedTracks", currentTrack.id);
    }

    fetch(`/api/recommendations?${params.toString()}`)
      .then((r) => (r.ok ? r.json() : []))
      .then((data) => {
        if (Array.isArray(data) && data.length > 0) {
          setTracks(data);
        }
      })
      .catch(() => {});
  }, [currentTrack?.id, currentTrack?.artistName, getPeriodReport, likedArtists]);

  if (!tracks.length) return null;

  const playerTracks = tracks.map(spotifyTrackToPlayerTrack);

  return (
    <section>
      <div className="flex items-center gap-2.5 mb-2">
        <Sparkles className="w-4 h-4 text-indigo-500 dark:text-indigo-400" />
        <h2 className="text-xs font-bold text-zinc-700 dark:text-zinc-300 uppercase tracking-widest">
          {currentTrack
            ? `Rekomendasi Berdasarkan ${currentTrack.artistName}`
            : "Rekomendasi Spesial Untukmu"}
        </h2>
      </div>
      <div className="flex gap-4 overflow-x-auto pt-2 pb-4 no-scrollbar">
        {playerTracks.map((t) => (
          <TrackCard key={t.id} track={t} queue={playerTracks} carousel />
        ))}
      </div>
    </section>
  );
}
