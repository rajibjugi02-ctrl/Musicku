"use client";

import { useState, useEffect, useRef } from "react";
import { Search, Loader2, X, Compass, Flame } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import TrackCard from "@/components/ui/TrackCard";
import ArtistCard from "@/components/ui/ArtistCard";
import type { SpotifyTrack, SpotifyArtist, PlayerTrack } from "@/types/music";
import { spotifyTrackToPlayerTrack } from "@/lib/utils";
import { usePlayerStore } from "@/store/usePlayerStore";

function useDebounce<T>(value: T, ms: number): T {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const id = setTimeout(() => setDebounced(value), ms);
    return () => clearTimeout(id);
  }, [value, ms]);
  return debounced;
}

const QUICK_SEARCHES = ["NIKI", "Backburner", "Taylor Swift", "The Weeknd", "Billie Eilish", "Pop Hits"];

export default function SearchPage() {
  const [query, setQuery] = useState("");
  const [tracks, setTracks] = useState<SpotifyTrack[]>([]);
  const [artists, setArtists] = useState<SpotifyArtist[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const debouncedQ = useDebounce(query, 300);

  const abortControllerRef = useRef<AbortController | null>(null);

  useEffect(() => {
    const trimmed = debouncedQ.trim();
    if (!trimmed) {
      setTracks([]);
      setArtists([]);
      setIsLoading(false);
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
        abortControllerRef.current = null;
      }
      return;
    }

    // Cancel any previous in-flight search request to prevent stale results
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    const controller = new AbortController();
    abortControllerRef.current = controller;

    setIsLoading(true);

    fetch(`/api/music?action=search&q=${encodeURIComponent(trimmed)}`, {
      signal: controller.signal,
    })
      .then(async (res) => {
        if (!res.ok) throw new Error("Search failed");
        return res.json();
      })
      .then((data) => {
        if (Array.isArray(data.tracks)) {
          setTracks(data.tracks);
          // Auto-prefetch top 3 search results for instant playback
          const pTracks = data.tracks.map(spotifyTrackToPlayerTrack);
          pTracks.slice(0, 3).forEach((t: PlayerTrack) => {
            usePlayerStore.getState().prefetchTrackStream(t);
          });
        }
        setArtists(Array.isArray(data.artists) ? data.artists : []);
      })
      .catch((err: any) => {
        if (err?.name === "AbortError") {
          return; // Aborted by newer keystroke
        }
        console.error("Search fetch error:", err);
      })
      .finally(() => {
        if (abortControllerRef.current === controller) {
          setIsLoading(false);
        }
      });

    return () => {
      controller.abort();
    };
  }, [debouncedQ]);

  const playerTracks = tracks.map(spotifyTrackToPlayerTrack);

  return (
    <div className="p-4 sm:p-6 md:p-8 flex flex-col gap-6">
      {/* Search Input Bar (visionOS Glass Pill) */}
      <div className="relative max-w-xl">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400 pointer-events-none" />
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search songs, artists, albums (e.g. Backburner, NIKI)..."
          className="w-full h-12 pl-11 pr-11 rounded-2xl glass-card text-zinc-900 dark:text-white placeholder:text-zinc-500 text-sm focus:outline-none focus:border-black/20 dark:focus:border-white/30 focus:shadow-[0_0_24px_rgba(0,0,0,0.06)] dark:focus:shadow-[0_0_24px_rgba(255,255,255,0.08)] transition-all"
        />
        <AnimatePresence>
          {query && (
            <motion.button
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              onClick={() => setQuery("")}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-white p-1 rounded-full hover:bg-white/10 transition-colors"
            >
              <X className="w-4 h-4" />
            </motion.button>
          )}
        </AnimatePresence>
        {isLoading && (
          <div className="absolute right-11 top-1/2 -translate-y-1/2">
            <Loader2 className="w-4 h-4 text-indigo-400 animate-spin" />
          </div>
        )}
      </div>

      {/* Quick Search Chips */}
      {!query && (
        <div className="flex flex-col gap-3">
          <div className="flex items-center gap-2 text-xs font-bold text-zinc-700 dark:text-zinc-400 uppercase tracking-widest">
            <Flame className="w-3.5 h-3.5 text-amber-500" />
            <span>Popular Suggestions</span>
          </div>
          <div className="flex flex-wrap gap-2">
            {QUICK_SEARCHES.map((term) => (
              <button
                key={term}
                onClick={() => setQuery(term)}
                className="px-3.5 py-1.5 rounded-full glass-card text-xs font-medium text-zinc-700 dark:text-zinc-300 hover:text-zinc-950 dark:hover:text-white hover:border-black/20 dark:hover:border-white/25 transition-all"
              >
                {term}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Results View */}
      <AnimatePresence mode="wait">
        {!query ? (
          <motion.div
            key="idle"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex flex-col items-center justify-center py-20 text-center gap-3"
          >
            <div className="w-14 h-14 rounded-3xl glass-pill flex items-center justify-center text-zinc-500 dark:text-zinc-400 shadow-xl">
              <Compass className="w-7 h-7" />
            </div>
            <p className="text-sm font-bold text-zinc-900 dark:text-zinc-200">Explore millions of tracks</p>
            <p className="text-xs text-zinc-600 dark:text-zinc-400 max-w-xs">
              Type any track or artist name to search across the catalog with instant playback.
            </p>
          </motion.div>
        ) : (
          <motion.div
            key="results"
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-col gap-8"
          >
            {/* Artists Matches */}
            {artists.length > 0 && (
              <section>
                <h2 className="text-xs font-bold text-zinc-700 dark:text-zinc-400 uppercase tracking-widest mb-2">
                  Artists
                </h2>
                <div className="flex gap-3.5 sm:gap-4 overflow-x-auto pt-2 pb-4 no-scrollbar">
                  {artists.map((a) => (
                    <ArtistCard key={a.id} artist={a} carousel />
                  ))}
                </div>
              </section>
            )}

            {/* Songs Matches */}
            {playerTracks.length > 0 && (
              <section>
                <h2 className="text-xs font-bold text-zinc-700 dark:text-zinc-400 uppercase tracking-widest mb-2">
                  Tracks ({playerTracks.length})
                </h2>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 sm:gap-5 pt-3 pb-6">
                  {playerTracks.map((t) => (
                    <TrackCard key={t.id} track={t} queue={playerTracks} />
                  ))}
                </div>
              </section>
            )}

            {!isLoading && tracks.length === 0 && artists.length === 0 && (
              <div className="py-16 text-center text-zinc-600 dark:text-zinc-400 text-xs">
                No matching tracks or artists found for &ldquo;{query}&rdquo;.
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
