"use client";

import { useState, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  Play,
  Shuffle,
  Edit3,
  Trash2,
  Plus,
  ArrowLeft,
  Camera,
  Upload,
  Check,
  X,
  Music,
  FolderPlus,
} from "lucide-react";
import { useLibraryStore } from "@/store/useLibraryStore";
import { usePlayerStore } from "@/store/usePlayerStore";
import type { PlayerTrack } from "@/types/music";
import { cn } from "@/lib/utils";

const PRESET_COVERS = [
  "https://cdn-images.dzcdn.net/images/cover/2c45e43a9dc745330386cfc5feee0642/1000x1000-000000-80-0-0.jpg",
  "https://cdn-images.dzcdn.net/images/cover/a437f81882d2786720f4c9c10467a726/1000x1000-000000-80-0-0.jpg",
  "https://cdn-images.dzcdn.net/images/cover/cc2495870fe1a792ad0cdb05501ad5ec/1000x1000-000000-80-0-0.jpg",
  "https://cdn-images.dzcdn.net/images/cover/973809864ad1c52d8c61238662400089/1000x1000-000000-80-0-0.jpg",
  "https://cdn-images.dzcdn.net/images/cover/8eab1a9a644889aabaca1e193e05f984/1000x1000-000000-80-0-0.jpg",
  "https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=600&h=600&fit=crop",
];

export default function CustomLibraryDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();

  const { customLibraries, updateCustomLibrary, deleteLibrary, removeTrackFromLibrary } = useLibraryStore();
  const { play } = usePlayerStore();

  const library = customLibraries.find((l) => l.id === id);

  // Edit Library Modal State
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [editName, setEditName] = useState("");
  const [editDesc, setEditDesc] = useState("");
  const [editCover, setEditCover] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const openEditModal = () => {
    if (!library) return;
    setEditName(library.name);
    setEditDesc(library.description || "");
    setEditCover(library.coverUrl || PRESET_COVERS[0]);
    setIsEditOpen(true);
  };

  const handleSaveEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!library || !editName.trim()) return;
    updateCustomLibrary(library.id, {
      name: editName.trim(),
      description: editDesc.trim(),
      coverUrl: editCover.trim(),
    });
    setIsEditOpen(false);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      alert("Please select an image smaller than 5MB");
      return;
    }
    const reader = new FileReader();
    reader.onload = (event) => {
      const dataUrl = event.target?.result as string;
      if (dataUrl) setEditCover(dataUrl);
    };
    reader.readAsDataURL(file);
  };

  const handleDelete = () => {
    if (!library) return;
    if (confirm(`Are you sure you want to delete "${library.name}"?`)) {
      deleteLibrary(library.id);
      router.push("/library");
    }
  };

  const handlePlayAll = () => {
    if (!library || library.tracks.length === 0) return;
    play(library.tracks[0], library.tracks);
  };

  const handleShufflePlay = () => {
    if (!library || library.tracks.length === 0) return;
    const shuffled = [...library.tracks].sort(() => Math.random() - 0.5);
    play(shuffled[0], shuffled);
  };

  if (!library) {
    return (
      <div className="p-6 md:p-8 flex flex-col items-center justify-center min-h-[60vh] text-center gap-4">
        <div className="w-16 h-16 rounded-full glass-card flex items-center justify-center text-zinc-400">
          <FolderPlus className="w-8 h-8" />
        </div>
        <h2 className="text-xl font-bold text-zinc-900 dark:text-white">Library Not Found</h2>
        <p className="text-xs text-zinc-500 max-w-sm">
          This library may have been removed or does not exist.
        </p>
        <button
          onClick={() => router.push("/library")}
          className="flex items-center gap-2 px-4 py-2 rounded-full glass-pill text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:scale-105 transition-transform"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Library</span>
        </button>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 md:p-8 flex flex-col gap-6 max-w-6xl mx-auto w-full">
      {/* Top Navigation Bar */}
      <div className="flex items-center justify-between pb-2 border-b border-black/[0.08] dark:border-white/[0.08]">
        <button
          onClick={() => router.push("/library")}
          className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full glass-pill text-xs font-semibold text-zinc-700 dark:text-zinc-300 hover:text-zinc-950 dark:hover:text-white transition-all cursor-pointer"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>All Libraries</span>
        </button>

        <div className="flex items-center gap-2">
          <button
            onClick={openEditModal}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full glass-card hover:bg-white/10 text-xs font-medium text-zinc-800 dark:text-zinc-200 transition-all cursor-pointer"
          >
            <Edit3 className="w-3.5 h-3.5" />
            <span>Edit Library</span>
          </button>
          <button
            onClick={handleDelete}
            title="Delete Library"
            className="p-1.5 rounded-full hover:bg-rose-500/10 text-zinc-400 hover:text-rose-500 transition-colors cursor-pointer"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Library Hero Banner */}
      <div className="glass-panel rounded-[28px] p-6 sm:p-8 flex flex-col sm:flex-row items-center sm:items-end gap-6 sm:gap-8 relative overflow-hidden border border-black/10 dark:border-white/10 shadow-xl">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={library.coverUrl || PRESET_COVERS[0]}
          alt={library.name}
          className="w-36 h-36 sm:w-44 sm:h-44 rounded-3xl object-cover shadow-2xl border border-black/15 dark:border-white/20 flex-shrink-0 group-hover:scale-105 transition-transform"
        />

        <div className="flex-1 text-center sm:text-left min-w-0">
          <span className="text-[11px] font-mono uppercase tracking-widest text-indigo-600 dark:text-indigo-400">
            Custom Collection
          </span>
          <h1 className="text-2xl sm:text-3xl md:text-4xl font-extrabold text-zinc-900 dark:text-white mt-1 truncate">
            {library.name}
          </h1>
          {library.description && (
            <p className="text-xs sm:text-sm text-zinc-600 dark:text-zinc-400 mt-2 max-w-xl line-clamp-2">
              {library.description}
            </p>
          )}

          <div className="flex items-center justify-center sm:justify-start gap-3 mt-4 text-xs font-medium text-zinc-500">
            <span>{library.tracks.length} tracks</span>
            <span>•</span>
            <span>Created {new Date(library.createdAt).toLocaleDateString()}</span>
          </div>

          {/* Action Play Buttons */}
          <div className="flex items-center justify-center sm:justify-start gap-3 mt-5">
            <button
              onClick={handlePlayAll}
              disabled={library.tracks.length === 0}
              className="flex items-center gap-2 px-5 py-2.5 rounded-full bg-zinc-950 dark:bg-white text-white dark:text-zinc-950 text-xs font-bold shadow-lg hover:scale-105 active:scale-95 disabled:opacity-40 disabled:pointer-events-none transition-all cursor-pointer"
            >
              <Play className="w-3.5 h-3.5 fill-current" />
              <span>Play All</span>
            </button>
            <button
              onClick={handleShufflePlay}
              disabled={library.tracks.length === 0}
              className="flex items-center gap-2 px-4 py-2.5 rounded-full glass-pill text-zinc-800 dark:text-zinc-200 text-xs font-bold hover:scale-105 active:scale-95 disabled:opacity-40 disabled:pointer-events-none transition-all cursor-pointer"
            >
              <Shuffle className="w-3.5 h-3.5" />
              <span>Shuffle</span>
            </button>
            <button
              onClick={() => router.push("/search")}
              className="flex items-center gap-1.5 px-3.5 py-2.5 rounded-full glass-card text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 transition-all cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add Songs</span>
            </button>
          </div>
        </div>
      </div>

      {/* Tracks Section */}
      <div className="flex flex-col gap-3">
        <h2 className="text-xs font-bold text-zinc-700 dark:text-zinc-400 uppercase tracking-widest px-1">
          Tracks ({library.tracks.length})
        </h2>

        {library.tracks.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center gap-3.5 glass-panel rounded-[26px] border border-black/5 dark:border-white/5">
            <div className="w-12 h-12 rounded-full glass-card flex items-center justify-center text-zinc-400">
              <Music className="w-6 h-6" />
            </div>
            <p className="text-sm font-bold text-zinc-900 dark:text-white">This library is empty</p>
            <p className="text-xs text-zinc-500 max-w-xs">
              Explore music and tap &ldquo;Add to Playlist&rdquo; from the &ldquo;•••&rdquo; menu to collect songs here.
            </p>
            <button
              onClick={() => router.push("/search")}
              className="mt-2 flex items-center gap-1.5 px-4 py-2 rounded-full glass-pill text-xs font-bold text-indigo-600 dark:text-indigo-400 hover:scale-105 transition-transform"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Search & Add Tracks</span>
            </button>
          </div>
        ) : (
          <div className="flex flex-col gap-2">
            {library.tracks.map((t: PlayerTrack, idx: number) => (
              <div
                key={`${t.id}-${idx}`}
                className="group flex items-center justify-between p-2.5 sm:p-3 rounded-2xl glass-card hover:bg-white/40 dark:hover:bg-white/[0.08] transition-all border border-black/5 dark:border-white/5"
              >
                <div
                  onClick={() => play(t, library.tracks)}
                  className="flex items-center gap-3.5 min-w-0 flex-1 cursor-pointer"
                >
                  <span className="w-5 text-center text-xs font-mono text-zinc-400">
                    {idx + 1}
                  </span>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={t.albumArt}
                    alt={t.name}
                    className="w-11 h-11 rounded-xl object-cover flex-shrink-0 shadow-sm border border-black/10 dark:border-white/10"
                  />
                  <div className="min-w-0 flex-1">
                    <p className="text-xs sm:text-sm font-bold text-zinc-900 dark:text-white truncate group-hover:text-indigo-600 dark:group-hover:text-indigo-300 transition-colors">
                      {t.name}
                    </p>
                    <p className="text-[11px] text-zinc-500 dark:text-zinc-400 truncate">
                      {t.artistName}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-[11px] font-mono text-zinc-400 mr-2">
                    {Math.floor((t.duration || 180000) / 60000)}:
                    {String(Math.floor(((t.duration || 180000) % 60000) / 1000)).padStart(2, "0")}
                  </span>
                  <button
                    onClick={() => removeTrackFromLibrary(library.id, t.id)}
                    title="Remove track"
                    className="p-1.5 rounded-lg text-zinc-400 hover:text-rose-500 hover:bg-rose-500/10 transition-colors cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Edit Library Modal */}
      <AnimatePresence>
        {isEditOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-2xl"
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0, y: 15 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 15 }}
              className="w-[92vw] max-w-md max-h-[85dvh] rounded-[28px] overflow-hidden flex flex-col glass-panel bg-white/95 dark:bg-zinc-900/95 border border-black/10 dark:border-white/15 shadow-2xl"
            >
              {/* Header */}
              <div className="flex items-center justify-between px-6 py-4 border-b border-black/5 dark:border-white/10 sticky top-0 bg-inherit z-10">
                <h3 className="text-sm font-bold text-zinc-900 dark:text-white">Edit Library Details</h3>
                <button
                  onClick={() => setIsEditOpen(false)}
                  className="p-1.5 rounded-full hover:bg-black/10 dark:hover:bg-white/10 text-zinc-500 transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Body */}
              <form onSubmit={handleSaveEdit} className="p-6 overflow-y-auto space-y-5 flex-1">
                {/* Cover Picture Section */}
                <div className="flex flex-col items-center gap-3">
                  <div className="relative group cursor-pointer" onClick={() => fileInputRef.current?.click()}>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={editCover || PRESET_COVERS[0]}
                      alt="Cover Preview"
                      className="w-28 h-28 rounded-2xl object-cover shadow-lg border border-black/15 dark:border-white/20"
                    />
                    <div className="absolute inset-0 bg-black/40 rounded-2xl flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity text-white">
                      <Camera className="w-6 h-6 mb-1" />
                      <span className="text-[10px] font-semibold">Change</span>
                    </div>
                  </div>

                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleFileUpload}
                    className="hidden"
                  />

                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full glass-card text-[11px] font-semibold text-indigo-600 dark:text-indigo-400"
                  >
                    <Upload className="w-3 h-3" />
                    <span>Upload from device</span>
                  </button>

                  {/* Preset Covers */}
                  <div className="w-full">
                    <span className="text-[10px] font-mono text-zinc-500 uppercase tracking-wider block mb-2 text-center">
                      Or pick aesthetic preset
                    </span>
                    <div className="flex justify-center gap-2 flex-wrap">
                      {PRESET_COVERS.map((url, i) => (
                        <button
                          key={i}
                          type="button"
                          onClick={() => setEditCover(url)}
                          className={cn(
                            "w-10 h-10 rounded-xl overflow-hidden border transition-all cursor-pointer",
                            editCover === url
                              ? "ring-2 ring-indigo-500 scale-105 border-transparent"
                              : "border-black/10 dark:border-white/10 opacity-70 hover:opacity-100"
                          )}
                        >
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img src={url} alt={`Preset ${i}`} className="w-full h-full object-cover" />
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Name Input */}
                <div>
                  <label className="text-xs font-semibold text-zinc-700 dark:text-zinc-300 block mb-1.5">
                    Library Name
                  </label>
                  <input
                    type="text"
                    required
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    placeholder="e.g. Midnight Beats"
                    className="w-full px-3.5 py-2.5 rounded-xl glass-card text-xs text-zinc-900 dark:text-white placeholder:text-zinc-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                {/* Description Input */}
                <div>
                  <label className="text-xs font-semibold text-zinc-700 dark:text-zinc-300 block mb-1.5">
                    Description (optional)
                  </label>
                  <textarea
                    rows={3}
                    value={editDesc}
                    onChange={(e) => setEditDesc(e.target.value)}
                    placeholder="Add an optional description for this collection..."
                    className="w-full px-3.5 py-2 rounded-xl glass-card text-xs text-zinc-900 dark:text-white placeholder:text-zinc-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
                  />
                </div>

                {/* Footer Buttons */}
                <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-black/5 dark:border-white/10">
                  <button
                    type="button"
                    onClick={() => setIsEditOpen(false)}
                    className="px-4 py-2 rounded-xl text-xs font-semibold text-zinc-600 dark:text-zinc-400 hover:bg-black/5 dark:hover:bg-white/5 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-md hover:scale-105 active:scale-95 transition-all cursor-pointer"
                  >
                    <Check className="w-3.5 h-3.5" />
                    <span>Save Changes</span>
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
