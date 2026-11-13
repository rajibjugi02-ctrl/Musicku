"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  Library,
  Plus,
  Heart,
  Clock,
  Play,
  Trash2,
  FolderPlus,
  X,
  Sparkles,
  ChevronRight,
} from "lucide-react";
import { useLibraryStore, type CustomLibrary } from "@/store/useLibraryStore";
import { usePlayerStore } from "@/store/usePlayerStore";
import TrackCard from "@/components/ui/TrackCard";
import ArtistCard from "@/components/ui/ArtistCard";
import { cn } from "@/lib/utils";

type Tab = "libraries" | "favorites" | "artists" | "history";

export default function LibraryPage() {
  const router = useRouter();
  const {
    customLibraries,
    likedTracks,
    likedArtists,
    createLibrary,
    deleteLibrary,
    removeTrackFromLibrary,
    healArtistImages,
  } = useLibraryStore();

  // Auto-heal old Unsplash or stale cached pictures in localStorage
  useEffect(() => {
    healArtistImages();
  }, [healArtistImages]);

  const { play, queue } = usePlayerStore();

  const [activeTab, setActiveTab] = useState<Tab>("libraries");
  const [selectedLibrary, setSelectedLibrary] = useState<CustomLibrary | null>(null);

  // Create Library Modal State
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [newLibName, setNewLibName] = useState("");
  const [newLibDesc, setNewLibDesc] = useState("");

  const handleCreateLibrary = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newLibName.trim()) return;
    createLibrary(newLibName, newLibDesc);
    setNewLibName("");
    setNewLibDesc("");
    setIsCreateOpen(false);
  };

  const handlePlayAllTracks = (tracks: typeof likedTracks) => {
    if (!tracks.length) return;
    play(tracks[0], tracks);
  };

  // Sync selected library with updated store
  const currentSelectedLib = selectedLibrary
    ? customLibraries.find((l) => l.id === selectedLibrary.id) || null
    : null;

  return (
    <div className="p-4 sm:p-6 md:p-8 flex flex-col gap-5 max-w-6xl mx-auto select-none">
      {/* ─────────────────────────────────────────────────────────────
          1. COMPACT & CLEAN HEADER WITH LIQUID GLASS BUTTON
         ───────────────────────────────────────────────────────────── */}
      <div className="flex items-center justify-between gap-3 pt-1">
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-10 h-10 rounded-2xl glass-pill flex items-center justify-center text-zinc-900 dark:text-white shadow-sm flex-shrink-0">
            <Library className="w-5 h-5" />
          </div>
          <div className="min-w-0">
            <h1 className="text-xl sm:text-2xl font-bold text-zinc-900 dark:text-white tracking-tight truncate">
              Your Library
            </h1>
            <p className="text-[11px] sm:text-xs text-zinc-500 dark:text-zinc-400 truncate">
              Custom collections & favorites
            </p>
          </div>
        </div>

        {/* Apple iOS Liquid Glass Button */}
        <button
          onClick={() => setIsCreateOpen(true)}
          className="flex-shrink-0 flex items-center gap-1.5 px-3.5 sm:px-4 py-2 rounded-full bg-black/[0.06] hover:bg-black/[0.1] dark:bg-white/[0.12] dark:hover:bg-white/[0.18] backdrop-blur-2xl border border-black/10 dark:border-white/20 text-zinc-900 dark:text-white text-xs font-semibold shadow-[inset_0_1px_1px_rgba(255,255,255,0.4)] hover:scale-105 active:scale-95 transition-all cursor-pointer"
        >
          <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
          <span>Create Library</span>
        </button>
      </div>

      {/* ─────────────────────────────────────────────────────────────
          2. HORIZONTAL SCROLLABLE TABS ROW (Anti-Clipping)
         ───────────────────────────────────────────────────────────── */}
      <div className="w-full overflow-x-auto no-scrollbar py-1 -my-1">
        <div className="inline-flex rounded-2xl glass-card p-1 gap-1 min-w-full sm:min-w-0">
          {[
            { key: "libraries", label: `Libraries (${customLibraries.length})`, icon: FolderPlus },
            { key: "favorites", label: `Favorites (${likedTracks.length})`, icon: Heart },
            { key: "artists", label: `Artists (${likedArtists.length})`, icon: Sparkles },
            { key: "history", label: "Queue History", icon: Clock },
          ].map(({ key, label, icon: Icon }) => {
            const active = activeTab === key;
            return (
              <button
                key={key}
                onClick={() => {
                  setActiveTab(key as Tab);
                  setSelectedLibrary(null);
                }}
                className={cn(
                  "flex-shrink-0 whitespace-nowrap flex items-center justify-center gap-2 py-2 px-3.5 sm:px-4 rounded-xl text-xs font-medium transition-all cursor-pointer",
                  active
                    ? "glass-pill text-zinc-950 dark:text-white font-bold shadow-sm"
                    : "text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100"
                )}
              >
                <Icon className={cn("w-3.5 h-3.5", active ? "text-indigo-600 dark:text-white" : "")} />
                <span>{label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* ─────────────────────────────────────────────────────────────
          3. TAB CONTENT: CUSTOM LIBRARIES
         ───────────────────────────────────────────────────────────── */}
      {activeTab === "libraries" && (
        <div className="flex flex-col gap-6">
          {currentSelectedLib ? (
            /* Selected Library Detail View */
            <div className="flex flex-col gap-5">
              <div className="flex items-center justify-between pb-3 border-b border-black/[0.08] dark:border-white/[0.08]">
                <button
                  onClick={() => setSelectedLibrary(null)}
                  className="text-xs text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1 font-medium cursor-pointer"
                >
                  ← Back to all libraries
                </button>
                <button
                  onClick={() => {
                    deleteLibrary(currentSelectedLib.id);
                    setSelectedLibrary(null);
                  }}
                  className="flex items-center gap-1 text-xs text-rose-500 hover:text-rose-600 hover:bg-rose-500/10 px-2.5 py-1 rounded-lg transition-colors cursor-pointer"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Delete Library</span>
                </button>
              </div>

              {/* Library Banner Card */}
              <div className="p-5 sm:p-6 rounded-[28px] glass-panel flex flex-col sm:flex-row items-center gap-5 sm:gap-6 border border-black/10 dark:border-white/10">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={currentSelectedLib.coverUrl || "https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=600&h=600&fit=crop"}
                  alt={currentSelectedLib.name}
                  className="w-24 h-24 sm:w-28 sm:h-28 rounded-2xl object-cover shadow-lg border border-black/10 dark:border-white/20 flex-shrink-0"
                />
                <div className="flex-1 text-center sm:text-left">
                  <h2 className="text-xl sm:text-2xl font-bold text-zinc-900 dark:text-white">
                    {currentSelectedLib.name}
                  </h2>
                  <p className="text-xs text-zinc-600 dark:text-zinc-400 mt-1 max-w-lg">
                    {currentSelectedLib.description || "Custom music library created on Musicku"}
                  </p>
                  <div className="flex items-center justify-center sm:justify-start gap-4 mt-3">
                    <span className="text-xs font-mono text-zinc-500">
                      {currentSelectedLib.tracks.length} tracks
                    </span>
                    {currentSelectedLib.tracks.length > 0 && (
                      <button
                        onClick={() => handlePlayAllTracks(currentSelectedLib.tracks)}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-zinc-900 dark:bg-white text-white dark:text-zinc-950 text-xs font-semibold shadow hover:scale-105 active:scale-95 transition-all cursor-pointer"
                      >
                        <Play className="w-3.5 h-3.5 fill-current" />
                        <span>Play All</span>
                      </button>
                    )}
                  </div>
                </div>
              </div>

              {/* Tracks in Selected Library */}
              {currentSelectedLib.tracks.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16 text-center gap-3 glass-card rounded-[26px]">
                  <FolderPlus className="w-8 h-8 text-zinc-400" />
                  <p className="text-sm font-semibold text-zinc-900 dark:text-zinc-200">No tracks in this library</p>
                  <p className="text-xs text-zinc-500 max-w-xs">
                    Tap the &ldquo;+&rdquo; button or &ldquo;•••&rdquo; menu on any track in Discover or Search to add it to this library.
                  </p>
                </div>
              ) : (
                <div className="flex flex-col divide-y divide-black/[0.05] dark:divide-white/[0.05] glass-card rounded-[26px] p-2">
                  {currentSelectedLib.tracks.map((t, idx) => (
                    <div
                      key={`${t.id}-${idx}`}
                      className="flex items-center justify-between p-2.5 hover:bg-black/[0.03] dark:hover:bg-white/[0.03] rounded-xl transition-colors group"
                    >
                      <div
                        onClick={() => play(t, currentSelectedLib.tracks)}
                        className="flex items-center gap-3 min-w-0 flex-1 cursor-pointer"
                      >
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={t.albumArt}
                          alt={t.name}
                          className="w-10 h-10 rounded-xl object-cover flex-shrink-0 shadow-sm border border-black/10 dark:border-white/10"
                        />
                        <div className="min-w-0 flex-1">
                          <p className="text-xs font-semibold text-zinc-900 dark:text-white truncate">
                            {t.name}
                          </p>
                          <p className="text-[11px] text-zinc-500 dark:text-zinc-400 truncate">
                            {t.artistName}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => removeTrackFromLibrary(currentSelectedLib.id, t.id)}
                          title="Remove from Library"
                          className="p-1.5 rounded-lg text-zinc-400 hover:text-rose-500 hover:bg-rose-500/10 transition-colors"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ) : (
            /* ─────────────────────────────────────────────────────────────
                All Custom Libraries Grid (Responsive Cards)
               ───────────────────────────────────────────────────────────── */
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3.5 pt-1">
              {customLibraries.map((lib) => (
                <div
                  key={lib.id}
                  onClick={() => router.push(`/library/${lib.id}`)}
                  className="p-3.5 sm:p-4 rounded-[24px] glass-panel bg-white/70 dark:bg-black/30 border border-black/10 dark:border-white/10 hover:border-black/20 dark:hover:border-white/25 flex items-center justify-between gap-3 group cursor-pointer transition-all hover:scale-[1.01] active:scale-[0.99] shadow-sm hover:shadow-md"
                >
                  <div className="flex items-center gap-3.5 min-w-0 flex-1">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={lib.coverUrl || "https://cdn-images.dzcdn.net/images/cover/2c45e43a9dc745330386cfc5feee0642/1000x1000-000000-80-0-0.jpg"}
                      alt={lib.name}
                      className="w-16 h-16 rounded-2xl object-cover shadow-md border border-black/10 dark:border-white/15 flex-shrink-0 group-hover:scale-105 transition-transform"
                    />
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-bold text-zinc-900 dark:text-white truncate group-hover:text-indigo-600 dark:group-hover:text-indigo-300 transition-colors">
                        {lib.name}
                      </p>
                      <p className="text-xs text-zinc-500 dark:text-zinc-400 truncate mt-0.5">
                        {lib.tracks.length} songs
                      </p>
                      <span className="text-[10px] text-zinc-400 dark:text-zinc-500 font-mono mt-0.5 block">
                        {new Date(lib.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                  </div>

                  {/* Right Side: Quick Play & Chevron */}
                  <div className="flex items-center gap-1.5 flex-shrink-0">
                    {lib.tracks.length > 0 && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handlePlayAllTracks(lib.tracks);
                        }}
                        title="Play Collection"
                        className="w-9 h-9 rounded-full glass-pill flex items-center justify-center text-zinc-900 dark:text-white hover:scale-110 active:scale-95 transition-all shadow-sm border border-black/10 dark:border-white/20"
                      >
                        <Play className="w-3.5 h-3.5 fill-current ml-0.5" />
                      </button>
                    )}
                    <ChevronRight className="w-4 h-4 text-zinc-400 group-hover:text-zinc-900 dark:group-hover:text-white transition-colors" />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────────
          4. TAB CONTENT: FAVORITE TRACKS
         ───────────────────────────────────────────────────────────── */}
      {activeTab === "favorites" && (
        <div className="flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xs font-bold uppercase tracking-widest text-zinc-700 dark:text-zinc-400">
              Liked Songs ({likedTracks.length})
            </h2>
            {likedTracks.length > 0 && (
              <button
                onClick={() => handlePlayAllTracks(likedTracks)}
                className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-zinc-900 dark:bg-white text-white dark:text-zinc-950 text-xs font-semibold shadow hover:scale-105 active:scale-95 transition-all cursor-pointer"
              >
                <Play className="w-3.5 h-3.5 fill-current ml-0.5" />
                <span>Play All</span>
              </button>
            )}
          </div>

          {likedTracks.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-center gap-3.5 glass-panel rounded-[28px] border border-black/10 dark:border-white/10">
              <div className="w-12 h-12 rounded-2xl glass-pill flex items-center justify-center text-rose-500">
                <Heart className="w-6 h-6" />
              </div>
              <p className="text-sm font-bold text-zinc-900 dark:text-zinc-200">No favorite songs yet</p>
              <p className="text-xs text-zinc-500 max-w-xs">
                Tap the heart icon on any song card or in the player bar to add songs to your favorites.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 sm:gap-5 pt-3 pb-6">
              {likedTracks.map((t) => (
                <TrackCard key={t.id} track={t} queue={likedTracks} />
              ))}
            </div>
          )}
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────────
          5. TAB CONTENT: LIKED ARTISTS
         ───────────────────────────────────────────────────────────── */}
      {activeTab === "artists" && (
        <div className="flex flex-col gap-4">
          <h2 className="text-xs font-bold uppercase tracking-widest text-zinc-700 dark:text-zinc-400">
            Favorite Artists ({likedArtists.length})
          </h2>

          {likedArtists.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-center gap-3.5 glass-panel rounded-[28px] border border-black/10 dark:border-white/10">
              <div className="w-12 h-12 rounded-2xl glass-pill flex items-center justify-center text-indigo-500">
                <Sparkles className="w-6 h-6" />
              </div>
              <p className="text-sm font-bold text-zinc-900 dark:text-zinc-200">No liked artists yet</p>
              <p className="text-xs text-zinc-500 max-w-xs">
                Tap the heart on any artist card in Discover or Search to pin them to your library.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 sm:gap-5 pt-3 pb-6">
              {likedArtists.map((a) => (
                <ArtistCard key={a.id} artist={a} />
              ))}
            </div>
          )}
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────────
          6. TAB CONTENT: RECENT QUEUE HISTORY
         ───────────────────────────────────────────────────────────── */}
      {activeTab === "history" && (
        <div className="flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xs font-bold uppercase tracking-widest text-zinc-700 dark:text-zinc-400">
              Active Queue ({queue.length})
            </h2>
            {queue.length > 0 && (
              <button
                onClick={() => handlePlayAllTracks(queue)}
                className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-zinc-900 dark:bg-white text-white dark:text-zinc-950 text-xs font-semibold shadow hover:scale-105 active:scale-95 transition-all cursor-pointer"
              >
                <Play className="w-3.5 h-3.5 fill-current ml-0.5" />
                <span>Play Queue</span>
              </button>
            )}
          </div>

          {queue.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-center gap-3.5 glass-panel rounded-[28px] border border-black/10 dark:border-white/10">
              <Clock className="w-8 h-8 text-zinc-400" />
              <p className="text-sm font-bold text-zinc-900 dark:text-zinc-200">Queue is empty</p>
              <p className="text-xs text-zinc-500">Play any track to start building your queue history.</p>
            </div>
          ) : (
            <div className="flex gap-4 overflow-x-auto pt-3 pb-6 no-scrollbar">
              {queue.map((t) => (
                <TrackCard key={t.id} track={t} queue={queue} />
              ))}
            </div>
          )}
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────────
          CREATE LIBRARY MODAL DIALOG
         ───────────────────────────────────────────────────────────── */}
      <AnimatePresence>
        {isCreateOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsCreateOpen(false)}
              className="absolute inset-0 bg-black/60 dark:bg-black/75 backdrop-blur-md"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.92, y: 16 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.92, y: 16 }}
              transition={{ type: "spring", stiffness: 300, damping: 28 }}
              className="relative w-full max-w-md glass-panel rounded-[28px] p-6 shadow-2xl z-10 flex flex-col gap-4 text-zinc-900 dark:text-zinc-100 border border-black/10 dark:border-white/15"
            >
              <div className="flex items-center justify-between pb-3 border-b border-black/[0.08] dark:border-white/[0.08]">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-2xl glass-pill flex items-center justify-center text-zinc-900 dark:text-white">
                    <FolderPlus className="w-4 h-4" />
                  </div>
                  <h3 className="text-sm font-bold tracking-tight text-zinc-900 dark:text-white">
                    Create New Library
                  </h3>
                </div>
                <button
                  onClick={() => setIsCreateOpen(false)}
                  className="p-1.5 rounded-full hover:bg-black/5 dark:hover:bg-white/10 text-zinc-400 hover:text-zinc-900 dark:hover:text-white cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <form onSubmit={handleCreateLibrary} className="flex flex-col gap-3">
                <div>
                  <label className="text-[11px] font-semibold text-zinc-600 dark:text-zinc-400 mb-1 block">
                    Library Name
                  </label>
                  <input
                    type="text"
                    autoFocus
                    required
                    value={newLibName}
                    onChange={(e) => setNewLibName(e.target.value)}
                    placeholder="e.g. Night Drive, Workout Beats..."
                    className="w-full px-3.5 py-2.5 rounded-xl glass-card text-xs text-zinc-900 dark:text-white placeholder:text-zinc-400 focus:outline-none focus:border-black/30 dark:focus:border-white/30"
                  />
                </div>

                <div>
                  <label className="text-[11px] font-semibold text-zinc-600 dark:text-zinc-400 mb-1 block">
                    Description (optional)
                  </label>
                  <textarea
                    rows={2}
                    value={newLibDesc}
                    onChange={(e) => setNewLibDesc(e.target.value)}
                    placeholder="Add an optional description for this collection..."
                    className="w-full px-3.5 py-2 rounded-xl glass-card text-xs text-zinc-900 dark:text-white placeholder:text-zinc-400 focus:outline-none focus:border-black/30 dark:focus:border-white/30 resize-none"
                  />
                </div>

                <div className="flex items-center justify-end gap-2.5 mt-2">
                  <button
                    type="button"
                    onClick={() => setIsCreateOpen(false)}
                    className="px-3.5 py-2 rounded-xl text-xs font-medium text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={!newLibName.trim()}
                    className="px-4 py-2 rounded-full bg-black/[0.08] dark:bg-white/[0.16] hover:bg-black/[0.12] dark:hover:bg-white/[0.22] disabled:opacity-50 text-zinc-900 dark:text-white text-xs font-semibold shadow-sm border border-black/10 dark:border-white/20 transition-all cursor-pointer"
                  >
                    Create Library
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
