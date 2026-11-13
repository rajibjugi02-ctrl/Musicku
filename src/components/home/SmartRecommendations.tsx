"use client";

import { useEffect, useState } from "react";
import { Compass } from "lucide-react";
import TrackCard from "@/components/ui/TrackCard";
import { usePlayerStore } from "@/store/usePlayerStore";
import type { SpotifyTrack } from "@/types/music";
import { spotifyTrackToPlayerTrack } from "@/lib/utils";

export default function SmartRecommendations() {
  const [tracks, setTracks] = useState<SpotifyTrack[]>([]);
  const currentTrack = usePlayerStore((s) => s.currentTrack);

  useEffect(() => {
    const params = new URLSearchParams({
      action: "recommendations",
      seedTrack: currentTrack?.id || "",
      seedArtist: currentTrack?.artistName || "pop",
    });

    fetch(`/api/music?${params}`)
      .then((r) => (r.ok ? r.json() : []))
      .then((data) => {
        if (Array.isArray(data) && data.length > 0) {
          setTracks(data);
        }
      })
      .catch(() => { });
  }, [currentTrack?.id, currentTrack?.artistName]);

  if (!tracks.length) return null;

  const playerTracks = tracks.map(spotifyTrackToPlayerTrack);

  return (
    <section>
      <div className="flex items-center gap-2.5 mb-2">
        <Compass className="w-4 h-4 text-cyan-500 dark:text-cyan-400" />
        <h2 className="text-xs font-bold text-zinc-700 dark:text-zinc-300 uppercase tracking-widest">
          {currentTrack ? `Because you listened to ${currentTrack.artistName}` : "Smart Recommendations"}
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
