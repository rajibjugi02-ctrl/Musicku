"use client";

import { useEffect, useState } from "react";
import { Heart, Sparkles, Users } from "lucide-react";
import ArtistCard from "@/components/ui/ArtistCard";
import { useLibraryStore } from "@/store/useLibraryStore";
import type { SpotifyArtist } from "@/types/music";

export default function LikedArtistsPage() {
  const { likedArtists, healArtistImages } = useLibraryStore();
  const [dbArtists, setDbArtists] = useState<SpotifyArtist[]>([]);

  // Auto-heal old Unsplash or stale cached pictures in localStorage
  useEffect(() => {
    healArtistImages();
  }, [healArtistImages]);

  // Optionally fetch from DB if logged in, but prioritize client store
  useEffect(() => {
    fetch("/api/liked-artists")
      .then((r) => (r.ok ? r.json() : []))
      .then((data) => {
        if (Array.isArray(data)) {
          const mapped: SpotifyArtist[] = data.map((a: {
            artistId: string;
            artistName: string;
            artistImage: string;
            genres?: string[];
            followers?: number;
          }) => ({
            id: a.artistId,
            name: a.artistName,
            images: a.artistImage ? [{ url: a.artistImage, width: 600, height: 600 }] : [],
            genres: a.genres || [],
            followers: { total: a.followers || 0 },
            popularity: 0,
            external_urls: { spotify: `https://open.spotify.com/artist/${a.artistId}` },
          }));
          setDbArtists(mapped);
        }
      })
      .catch(() => {});
  }, []);

  // Merge client store and DB artists, deduplicated by id
  const artistMap = new Map<string, SpotifyArtist>();
  likedArtists.forEach((a) => artistMap.set(a.id, a));
  dbArtists.forEach((a) => {
    if (!artistMap.has(a.id)) {
      artistMap.set(a.id, a);
    }
  });

  const mergedArtists = Array.from(artistMap.values());

  return (
    <div className="p-4 sm:p-8 flex flex-col gap-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-2xl glass-pill flex items-center justify-center text-rose-500 shadow-md">
          <Heart className="w-5 h-5 fill-current" />
        </div>
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-zinc-900 dark:text-white tracking-tight">
            Liked Artists
          </h1>
          <p className="text-xs text-zinc-600 dark:text-zinc-400">
            Artists and musicians you have favorited ({mergedArtists.length})
          </p>
        </div>
      </div>

      {mergedArtists.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center gap-3.5 glass-panel rounded-[28px] border border-black/[0.08] dark:border-white/[0.08]">
          <div className="w-14 h-14 rounded-2xl glass-pill flex items-center justify-center text-zinc-500 dark:text-zinc-400">
            <Users className="w-7 h-7" />
          </div>
          <div>
            <h3 className="text-base font-bold text-zinc-900 dark:text-zinc-100">
              No liked artists yet
            </h3>
            <p className="text-xs text-zinc-600 dark:text-zinc-400 max-w-sm mt-1">
              Tap the heart icon on any artist card in Discover or Search to add them to your collection.
            </p>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3 sm:gap-4 pt-3 pb-6">
          {mergedArtists.map((a) => (
            <ArtistCard key={a.id} artist={a} className="w-full" />
          ))}
        </div>
      )}
    </div>
  );
}
