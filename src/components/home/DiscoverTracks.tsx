"use client";

import { useEffect, useState } from "react";
import { Sparkles } from "lucide-react";
import TrackCard from "@/components/ui/TrackCard";
import type { SpotifyTrack } from "@/types/music";
import { spotifyTrackToPlayerTrack } from "@/lib/utils";
import { usePlayerStore } from "@/store/usePlayerStore";

export default function DiscoverTracks() {
  const [tracks, setTracks] = useState<SpotifyTrack[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/music?action=discover-tracks")
      .then((r) => (r.ok ? r.json() : []))
      .then((data) => {
        if (Array.isArray(data)) {
          setTracks(data);
          // Idle prefetch first track smoothly without blocking mobile thread
          const pTracks = data.map(spotifyTrackToPlayerTrack);
          if (pTracks[0]) {
            setTimeout(() => {
              usePlayerStore.getState().prefetchTrackStream(pTracks[0]);
            }, 1200);
          }
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const playerTracks = tracks.map(spotifyTrackToPlayerTrack);

  return (
    <section>
      <div className="flex items-center gap-2.5 mb-2">
        <Sparkles className="w-4 h-4 text-indigo-500 dark:text-indigo-400" />
        <h2 className="text-xs font-bold text-zinc-700 dark:text-zinc-300 uppercase tracking-widest">
          Trending & Discover Tracks
        </h2>
      </div>

      {loading ? (
        <div className="flex gap-4 overflow-x-hidden pt-2 pb-4">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="w-36 sm:w-40 flex-shrink-0 animate-pulse">
              <div className="w-full aspect-square rounded-[14px] bg-black/[0.06] dark:bg-white/[0.04]" />
              <div className="h-4 w-28 bg-black/[0.08] dark:bg-white/[0.06] rounded mt-2" />
              <div className="h-3 w-16 bg-black/[0.04] dark:bg-white/[0.03] rounded mt-1" />
            </div>
          ))}
        </div>
      ) : (
        <div className="flex gap-4 overflow-x-auto pt-2 pb-4 no-scrollbar">
          {playerTracks.map((t) => (
            <TrackCard key={t.id} track={t} queue={playerTracks} />
          ))}
        </div>
      )}
    </section>
  );
}
