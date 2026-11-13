"use client";

import { useEffect, useState } from "react";
import { Users } from "lucide-react";
import ArtistCard from "@/components/ui/ArtistCard";
import type { SpotifyArtist } from "@/types/music";

export default function DiscoverArtists() {
  const [artists, setArtists] = useState<SpotifyArtist[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/music?action=discover-artists")
      .then((r) => (r.ok ? r.json() : []))
      .then((data) => {
        if (Array.isArray(data)) setArtists(data);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  return (
    <section>
      <div className="flex items-center gap-2.5 mb-2">
        <Users className="w-4 h-4 text-purple-500 dark:text-purple-400" />
        <h2 className="text-xs font-bold text-zinc-700 dark:text-zinc-300 uppercase tracking-widest">
          Featured Artists
        </h2>
      </div>

      {loading ? (
        <div className="flex gap-4 overflow-x-hidden pt-2 pb-4">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="w-36 sm:w-40 flex-shrink-0 animate-pulse">
              <div className="w-full aspect-square rounded-[14px] bg-black/[0.06] dark:bg-white/[0.04]" />
              <div className="h-4 w-24 bg-black/[0.08] dark:bg-white/[0.06] rounded mt-2" />
              <div className="h-3 w-16 bg-black/[0.04] dark:bg-white/[0.03] rounded mt-1" />
            </div>
          ))}
        </div>
      ) : (
        <div className="flex gap-4 overflow-x-auto pt-2 pb-4 no-scrollbar">
          {artists.map((a) => (
            <ArtistCard key={a.id} artist={a} />
          ))}
        </div>
      )}
    </section>
  );
}
