"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Plus, Check, FolderPlus, Library } from "lucide-react";
import { useLibraryStore } from "@/store/useLibraryStore";
import type { PlayerTrack } from "@/types/music";
import { cn } from "@/lib/utils";

interface Props {
  track: PlayerTrack | null;
  isOpen: boolean;
  onClose: () => void;
}

export default function AddToLibraryModal({ track, isOpen, onClose }: Props) {
  const { customLibraries, createLibrary, addTrackToLibrary, removeTrackFromLibrary, isTrackInLibrary } =
    useLibraryStore();

  const [isCreating, setIsCreating] = useState(false);
  const [newLibName, setNewLibName] = useState("");
  const [newLibDesc, setNewLibDesc] = useState("");

  if (!isOpen || !track) return null;

  const handleCreateAndAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newLibName.trim()) return;

    const newId = createLibrary(newLibName, newLibDesc, track.albumArt);
    addTrackToLibrary(newId, track);

    setNewLibName("");
    setNewLibDesc("");
    setIsCreating(false);
  };

  const handleToggleLibrary = (libraryId: string) => {
    const inLib = isTrackInLibrary(libraryId, track.id);
    if (inLib) {
      removeTrackFromLibrary(libraryId, track.id);
    } else {
      addTrackToLibrary(libraryId, track);
    }
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="absolute inset-0 bg-black/60 dark:bg-black/75 backdrop-blur-md"
        />

        {/* Modal Window */}
        <motion.div
          initial={{ opacity: 0, scale: 0.92, y: 16 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.92, y: 16 }}
          transition={{ type: "spring", stiffness: 300, damping: 28 }}
          className="relative w-full max-w-md glass-panel rounded-[28px] p-6 shadow-2xl z-10 flex flex-col gap-4 text-zinc-900 dark:text-zinc-100"
        >
          {/* Header */}
          <div className="flex items-center justify-between pb-3 border-b border-black/[0.08] dark:border-white/[0.08]">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-2xl glass-pill flex items-center justify-center text-indigo-500 dark:text-indigo-400">
                <Library className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-sm font-bold tracking-tight text-zinc-900 dark:text-white">Add to Library</h3>
                <p className="text-[11px] text-zinc-500 dark:text-zinc-400 truncate max-w-[220px]">
                  {track.name} • {track.artistName}
                </p>
              </div>
            </div>

            <button
              onClick={onClose}
              className="p-1.5 rounded-full hover:bg-black/5 dark:hover:bg-white/10 text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Library List */}
          <div className="flex flex-col gap-2 max-h-60 overflow-y-auto pr-1 scrollbar-thin">
            {customLibraries.map((lib) => {
              const inLib = isTrackInLibrary(lib.id, track.id);
              return (
                <div
                  key={lib.id}
                  onClick={() => handleToggleLibrary(lib.id)}
                  className={cn(
                    "flex items-center justify-between p-3 rounded-2xl glass-card cursor-pointer transition-all",
                    inLib
                      ? "border-indigo-500/40 bg-indigo-500/10 dark:bg-indigo-500/20"
                      : "hover:bg-black/5 dark:hover:bg-white/5"
                  )}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={lib.coverUrl || track.albumArt}
                      alt={lib.name}
                      className="w-10 h-10 rounded-xl object-cover flex-shrink-0 shadow-sm"
                    />
                    <div className="min-w-0">
                      <p className="text-xs font-semibold truncate text-zinc-900 dark:text-white">{lib.name}</p>
                      <p className="text-[10px] text-zinc-500 dark:text-zinc-400">{lib.tracks.length} songs</p>
                    </div>
                  </div>

                  <div
                    className={cn(
                      "w-6 h-6 rounded-full flex items-center justify-center transition-all",
                      inLib
                        ? "bg-indigo-500 text-white shadow-sm"
                        : "border border-zinc-300 dark:border-white/20 text-transparent"
                    )}
                  >
                    <Check className="w-3.5 h-3.5 stroke-[3]" />
                  </div>
                </div>
              );
            })}
          </div>

          {/* New Library Creator Form */}
          {isCreating ? (
            <form onSubmit={handleCreateAndAdd} className="flex flex-col gap-2.5 pt-2">
              <input
                type="text"
                autoFocus
                value={newLibName}
                onChange={(e) => setNewLibName(e.target.value)}
                placeholder="Library / Playlist Name (e.g. Chill Beats)..."
                className="w-full px-3.5 py-2.5 rounded-xl glass-card text-xs text-zinc-900 dark:text-white placeholder:text-zinc-400 focus:outline-none focus:border-indigo-500 transition-all"
              />
              <input
                type="text"
                value={newLibDesc}
                onChange={(e) => setNewLibDesc(e.target.value)}
                placeholder="Description (optional)..."
                className="w-full px-3.5 py-2 rounded-xl glass-card text-xs text-zinc-900 dark:text-white placeholder:text-zinc-400 focus:outline-none focus:border-indigo-500 transition-all"
              />
              <div className="flex items-center justify-end gap-2 mt-1">
                <button
                  type="button"
                  onClick={() => setIsCreating(false)}
                  className="px-3 py-1.5 rounded-xl text-xs text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={!newLibName.trim()}
                  className="px-4 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white text-xs font-semibold shadow-md transition-all"
                >
                  Create & Add
                </button>
              </div>
            </form>
          ) : (
            <button
              onClick={() => setIsCreating(true)}
              className="flex items-center justify-center gap-2 py-2.5 rounded-2xl glass-card hover:bg-black/5 dark:hover:bg-white/10 text-xs font-medium text-indigo-600 dark:text-indigo-400 transition-all border-dashed"
            >
              <FolderPlus className="w-4 h-4" />
              <span>+ Create New Library</span>
            </button>
          )}
        </motion.div>
      </div>
    </AnimatePresence>
  );
}

