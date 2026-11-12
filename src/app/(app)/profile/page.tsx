"use client";

import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useSession } from "next-auth/react";
import Link from "next/link";
import {
  Camera,
  Edit3,
  Settings,
  Heart,
  Music,
  Check,
  X,
  Sparkles,
  Upload,
  ArrowRight,
  FolderPlus,
  User,
} from "lucide-react";
import { useProfileStore } from "@/store/useProfileStore";
import { useLibraryStore } from "@/store/useLibraryStore";
import TrackCard from "@/components/ui/TrackCard";
import { cn } from "@/lib/utils";

// Curated avatar presets for quick selection (No default female photo)
const PRESET_AVATARS = [
  "https://cdn-images.dzcdn.net/images/artist/cc2495870fe1a792ad0cdb05501ad5ec/1000x1000-000000-80-0-0.jpg",
  "https://cdn-images.dzcdn.net/images/artist/581693b4724a7fcfa754455101e13a44/1000x1000-000000-80-0-0.jpg",
  "https://cdn-images.dzcdn.net/images/artist/8eab1a9a644889aabaca1e193e05f984/1000x1000-000000-80-0-0.jpg",
  "https://cdn-images.dzcdn.net/images/artist/973809864ad1c52d8c61238662400089/1000x1000-000000-80-0-0.jpg",
  "https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=500&h=500&fit=crop",
];

export default function ProfilePage() {
  const { data: session } = useSession();
  const { name, username, bio, avatarUrl, updateProfile, syncWithSession } = useProfileStore();
  const { customLibraries, likedTracks, likedArtists } = useLibraryStore();

  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Sync session and purge legacy default woman photo from user's storage
  useEffect(() => {
    if (session?.user) {
      syncWithSession(session.user);
    }
    if (
      avatarUrl &&
      (avatarUrl.includes("324c50c04a5a944117cd3daa0963fc63") ||
        avatarUrl.includes("photo-1534528741775"))
    ) {
      updateProfile({ avatarUrl: "" });
    }
  }, [session, avatarUrl, syncWithSession, updateProfile]);

  // Edit form state
  const [editName, setEditName] = useState(name);
  const [editUsername, setEditUsername] = useState(username);
  const [editBio, setEditBio] = useState(bio);
  const [editAvatar, setEditAvatar] = useState(avatarUrl);
  const [isUploading, setIsUploading] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 2500);
  };

  const handleOpenEdit = () => {
    setEditName(name);
    setEditUsername(username);
    setEditBio(bio);
    const isLegacy =
      avatarUrl &&
      (avatarUrl.includes("324c50c04a5a944117cd3daa0963fc63") ||
        avatarUrl.includes("photo-1534528741775"));
    setEditAvatar(isLegacy ? "" : avatarUrl);
    setIsEditModalOpen(true);
  };

  // Image Upload with Canvas Compression
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    const reader = new FileReader();

    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        // Compress to max 500x500 square avatar
        const canvas = document.createElement("canvas");
        const maxDim = 500;
        let width = img.width;
        let height = img.height;

        if (width > height) {
          if (width > maxDim) {
            height = Math.round((height * maxDim) / width);
            width = maxDim;
          }
        } else {
          if (height > maxDim) {
            width = Math.round((width * maxDim) / height);
            height = maxDim;
          }
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext("2d");
        if (ctx) {
          ctx.drawImage(img, 0, 0, width, height);
          const dataUrl = canvas.toDataURL("image/jpeg", 0.88);
          setEditAvatar(dataUrl);
        }
        setIsUploading(false);
      };
      img.src = event.target?.result as string;
    };

    reader.readAsDataURL(file);
  };

  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editName.trim()) return;

    updateProfile({
      name: editName.trim(),
      username: editUsername.trim(),
      bio: editBio.trim(),
      avatarUrl: editAvatar,
    });

    setIsEditModalOpen(false);
    showToast("Profile updated successfully! ✨");
  };

  return (
    <div className="px-3 sm:px-6 md:px-8 py-4 sm:py-6 flex flex-col gap-6 sm:gap-8 w-full max-w-5xl mx-auto select-none pb-44 md:pb-8 text-zinc-950 dark:text-zinc-100">
      {/* Toast Notification */}
      <AnimatePresence>
        {toastMessage && (
          <motion.div
            initial={{ opacity: 0, y: -20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.95 }}
            className="fixed top-6 inset-x-4 mx-auto max-w-xs z-[100] glass-panel bg-black/85 text-white text-xs font-medium py-2.5 px-4 rounded-2xl shadow-2xl flex items-center justify-center gap-2 border border-white/20"
          >
            <Check className="w-4 h-4 text-emerald-400" />
            <span>{toastMessage}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ─────────────────────────────────────────────────────────────
          1. PROFILE HEADER CARD (High Contrast Light & Dark Mode)
         ───────────────────────────────────────────────────────────── */}
      <div className="relative rounded-[32px] glass-panel p-6 sm:p-8 overflow-hidden border border-black/10 dark:border-white/10 shadow-lg bg-white/85 dark:bg-white/[0.04]">
        {/* Subtle Ambient Specular Glow */}
        <div className="absolute -top-16 -right-16 w-48 h-48 rounded-full bg-indigo-500/15 blur-3xl pointer-events-none" />
        <div className="absolute -bottom-16 -left-16 w-48 h-48 rounded-full bg-purple-500/15 blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col sm:flex-row items-center sm:items-start gap-6 text-center sm:text-left">
          {/* Avatar with Edit Camera Overlay */}
          <div className="relative group">
            <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-full overflow-hidden shadow-xl border-2 border-black/15 dark:border-white/25 bg-zinc-200 dark:bg-zinc-800 flex items-center justify-center">
              {avatarUrl &&
                !avatarUrl.includes("324c50c04a5a944117cd3daa0963fc63") &&
                !avatarUrl.includes("photo-1534528741775") ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={avatarUrl}
                  alt={name || "Profile"}
                  className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-zinc-200 to-zinc-300 dark:from-zinc-800 dark:to-zinc-900 text-zinc-500 dark:text-zinc-400">
                  <User className="w-12 h-12 stroke-[1.6]" />
                </div>
              )}
            </div>
            <button
              onClick={handleOpenEdit}
              title="Change Profile Photo"
              className="absolute bottom-0 right-0 w-8 h-8 rounded-full bg-zinc-950 text-white dark:bg-white dark:text-zinc-950 flex items-center justify-center shadow-md hover:scale-110 active:scale-95 transition-all border border-black/10 dark:border-white/20 cursor-pointer"
            >
              <Camera className="w-4 h-4" />
            </button>
          </div>

          {/* User Info Details */}
          <div className="flex-1 min-w-0">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h1 className="text-2xl sm:text-3xl font-extrabold text-zinc-950 dark:text-white tracking-tight leading-tight">
                  {name || "Musicku User"}
                </h1>
                <p className="text-xs sm:text-sm font-mono text-zinc-600 dark:text-zinc-400 mt-0.5">
                  @{username || "user"}
                </p>
              </div>

              {/* Action Buttons: High Contrast in Light & Dark Mode */}
              <div className="flex items-center justify-center sm:justify-start gap-2.5 mt-2 sm:mt-0">
                <button
                  onClick={handleOpenEdit}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-full bg-zinc-950 text-white hover:bg-zinc-800 dark:bg-white/10 dark:text-white dark:hover:bg-white/20 backdrop-blur-2xl border border-black/10 dark:border-white/20 text-xs font-semibold shadow-sm hover:scale-105 active:scale-95 transition-all cursor-pointer"
                >
                  <Edit3 className="w-3.5 h-3.5" />
                  <span>Edit Profile</span>
                </button>

                <Link
                  href="/settings"
                  title="Settings"
                  className="w-9 h-9 rounded-full bg-zinc-100 hover:bg-zinc-200 text-zinc-900 dark:bg-white/10 dark:text-white dark:hover:bg-white/20 border border-black/10 dark:border-white/20 flex items-center justify-center transition-all cursor-pointer shadow-sm"
                >
                  <Settings className="w-4 h-4" />
                </Link>
              </div>
            </div>

            {/* User Bio */}
            <p className="text-xs sm:text-sm text-zinc-700 dark:text-zinc-300 mt-3.5 max-w-xl leading-relaxed">
              {bio || "No bio added yet. Click Edit Profile to tell others about your music vibe."}
            </p>
          </div>
        </div>
      </div>

      {/* ─────────────────────────────────────────────────────────────
          2. MUSIC COLLECTION STATS (High Contrast Numbers & Labels)
         ───────────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-3 gap-3 sm:gap-4">
        {/* Playlists / Libraries */}
        <Link href="/library">
          <motion.div
            whileHover={{ y: -3, scale: 1.01 }}
            whileTap={{ scale: 0.98 }}
            className="p-4 rounded-[24px] glass-panel bg-white/85 dark:bg-black/30 border border-black/10 dark:border-white/10 hover:border-black/20 dark:hover:border-white/25 flex flex-col items-center justify-center text-center gap-1 shadow-sm transition-all cursor-pointer group"
          >
            <div className="w-9 h-9 rounded-2xl glass-pill flex items-center justify-center text-indigo-600 dark:text-indigo-400 mb-1 group-hover:scale-110 transition-transform">
              <FolderPlus className="w-4 h-4" />
            </div>
            <span className="text-2xl sm:text-3xl font-extrabold text-zinc-950 dark:text-white">
              {customLibraries.length}
            </span>
            <span className="text-xs font-semibold text-zinc-600 dark:text-zinc-400">
              Libraries
            </span>
          </motion.div>
        </Link>

        {/* Liked Songs */}
        <Link href="/library">
          <motion.div
            whileHover={{ y: -3, scale: 1.01 }}
            whileTap={{ scale: 0.98 }}
            className="p-4 rounded-[24px] glass-panel bg-white/85 dark:bg-black/30 border border-black/10 dark:border-white/10 hover:border-black/20 dark:hover:border-white/25 flex flex-col items-center justify-center text-center gap-1 shadow-sm transition-all cursor-pointer group"
          >
            <div className="w-9 h-9 rounded-2xl glass-pill flex items-center justify-center text-rose-500 mb-1 group-hover:scale-110 transition-transform">
              <Heart className="w-4 h-4 fill-current" />
            </div>
            <span className="text-2xl sm:text-3xl font-extrabold text-zinc-950 dark:text-white">
              {likedTracks.length}
            </span>
            <span className="text-xs font-semibold text-zinc-600 dark:text-zinc-400">
              Liked Songs
            </span>
          </motion.div>
        </Link>

        {/* Liked Artists */}
        <Link href="/liked-artists">
          <motion.div
            whileHover={{ y: -3, scale: 1.01 }}
            whileTap={{ scale: 0.98 }}
            className="p-4 rounded-[24px] glass-panel bg-white/85 dark:bg-black/30 border border-black/10 dark:border-white/10 hover:border-black/20 dark:hover:border-white/25 flex flex-col items-center justify-center text-center gap-1 shadow-sm transition-all cursor-pointer group"
          >
            <div className="w-9 h-9 rounded-2xl glass-pill flex items-center justify-center text-amber-500 mb-1 group-hover:scale-110 transition-transform">
              <Sparkles className="w-4 h-4" />
            </div>
            <span className="text-2xl sm:text-3xl font-extrabold text-zinc-950 dark:text-white">
              {likedArtists.length}
            </span>
            <span className="text-xs font-semibold text-zinc-600 dark:text-zinc-400">
              Artists
            </span>
          </motion.div>
        </Link>
      </div>

      {/* ─────────────────────────────────────────────────────────────
          3. USER'S FAVORITE TRACKS PREVIEW
         ───────────────────────────────────────────────────────────── */}
      <section>
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Heart className="w-4 h-4 text-rose-500 fill-current" />
            <h2 className="text-xs font-bold text-zinc-800 dark:text-zinc-300 uppercase tracking-widest">
              Favorite Tracks ({likedTracks.length})
            </h2>
          </div>
          {likedTracks.length > 0 && (
            <Link
              href="/library"
              className="text-xs text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1 font-semibold"
            >
              <span>View all</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          )}
        </div>

        {likedTracks.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-14 text-center gap-2.5 glass-panel rounded-[28px] border border-black/10 dark:border-white/10 bg-white/80 dark:bg-black/20">
            <div className="w-12 h-12 rounded-2xl glass-pill flex items-center justify-center text-zinc-400">
              <Music className="w-6 h-6" />
            </div>
            <p className="text-sm font-bold text-zinc-950 dark:text-zinc-100">No favorite songs yet</p>
            <p className="text-xs text-zinc-600 dark:text-zinc-400 max-w-xs">
              Tap the heart icon on any track to pin it to your profile.
            </p>
          </div>
        ) : (
          <div className="flex gap-4 overflow-x-auto pt-2 pb-4 px-1 -mx-1 no-scrollbar">
            {likedTracks.slice(0, 10).map((t) => (
              <TrackCard key={t.id} track={t} queue={likedTracks} />
            ))}
          </div>
        )}
      </section>

      {/* ─────────────────────────────────────────────────────────────
          4. EDIT PROFILE MODAL (Compact, Proportional & Pure Blur)
         ───────────────────────────────────────────────────────────── */}
      <AnimatePresence>
        {isEditModalOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-3 bg-black/60 backdrop-blur-2xl">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              transition={{ type: "spring", stiffness: 420, damping: 28 }}
              className="w-[92vw] max-w-[380px] max-h-[80dvh] rounded-[28px] overflow-hidden flex flex-col glass-panel bg-white/95 dark:bg-zinc-900/95 border border-black/10 dark:border-white/15 shadow-2xl text-zinc-950 dark:text-zinc-100"
            >
              {/* Sticky Modal Header */}
              <div className="flex items-center justify-between px-5 py-3.5 border-b border-black/[0.08] dark:border-white/[0.08] sticky top-0 bg-inherit backdrop-blur-xl z-10 flex-shrink-0">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-xl bg-zinc-100 dark:bg-white/10 flex items-center justify-center text-zinc-950 dark:text-white">
                    <Edit3 className="w-3.5 h-3.5" />
                  </div>
                  <h3 className="text-sm font-bold tracking-tight text-zinc-950 dark:text-white">
                    Edit Profile
                  </h3>
                </div>
                <button
                  type="button"
                  onClick={() => setIsEditModalOpen(false)}
                  className="p-1 rounded-full hover:bg-black/5 dark:hover:bg-white/10 text-zinc-400 hover:text-zinc-900 dark:hover:text-white cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Scrollable Form Body */}
              <form onSubmit={handleSaveProfile} className="flex flex-col flex-1 min-h-0 overflow-hidden">
                <div className="p-5 overflow-y-auto space-y-4 flex-1 overscroll-contain">
                  {/* 1. Avatar Uploader & Presets */}
                  <div className="flex flex-col gap-2.5">
                    <label className="text-xs font-bold text-zinc-900 dark:text-zinc-200">
                      Profile Photo
                    </label>
                    <div className="flex items-center gap-3.5">
                      <div className="relative w-16 h-16 rounded-full overflow-hidden shadow-md border-2 border-black/15 dark:border-white/20 flex-shrink-0 flex items-center justify-center bg-zinc-200 dark:bg-zinc-800">
                        {editAvatar &&
                          !editAvatar.includes("324c50c04a5a944117cd3daa0963fc63") &&
                          !editAvatar.includes("photo-1534528741775") ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={editAvatar}
                            alt="Preview"
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <User className="w-8 h-8 text-zinc-400 dark:text-zinc-500 stroke-[1.5]" />
                        )}
                        {isUploading && (
                          <div className="absolute inset-0 bg-black/60 flex items-center justify-center text-[9px] text-white">
                            ...
                          </div>
                        )}
                      </div>

                      <div className="flex flex-col gap-1.5 flex-1">
                        <input
                          ref={fileInputRef}
                          type="file"
                          accept="image/*"
                          onChange={handleFileChange}
                          className="hidden"
                        />
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => fileInputRef.current?.click()}
                            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-zinc-100 dark:bg-white/10 text-xs font-semibold text-zinc-900 dark:text-white hover:bg-zinc-200 dark:hover:bg-white/15 transition-all cursor-pointer border border-black/10 dark:border-white/15"
                          >
                            <Upload className="w-3 h-3" />
                            <span>Upload</span>
                          </button>

                          {editAvatar && (
                            <button
                              type="button"
                              onClick={() => setEditAvatar("")}
                              className="px-2.5 py-1.5 rounded-xl bg-rose-500/10 text-rose-600 dark:text-rose-400 hover:bg-rose-500/20 text-xs font-semibold transition-all cursor-pointer border border-rose-500/20"
                            >
                              Remove
                            </button>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Presets */}
                    <div className="flex items-center gap-2 overflow-x-auto py-1 no-scrollbar">
                      {PRESET_AVATARS.map((url, i) => (
                        <button
                          key={i}
                          type="button"
                          onClick={() => setEditAvatar(url)}
                          className={cn(
                            "w-9 h-9 rounded-full overflow-hidden border-2 transition-all cursor-pointer flex-shrink-0",
                            editAvatar === url
                              ? "border-indigo-600 dark:border-white scale-110 shadow-sm"
                              : "border-transparent opacity-70 hover:opacity-100"
                          )}
                        >
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img src={url} alt={`Preset ${i}`} className="w-full h-full object-cover" />
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* 2. Display Name */}
                  <div>
                    <label className="text-xs font-bold text-zinc-900 dark:text-zinc-200 mb-1 block">
                      Display Name
                    </label>
                    <input
                      type="text"
                      required
                      value={editName}
                      onChange={(e) => setEditName(e.target.value)}
                      placeholder="Your full name"
                      className="w-full px-3 py-2 rounded-xl bg-zinc-100 dark:bg-white/5 border border-black/15 dark:border-white/15 text-xs text-zinc-950 dark:text-white placeholder:text-zinc-400 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                    />
                  </div>

                  {/* 3. Username */}
                  <div>
                    <label className="text-xs font-bold text-zinc-900 dark:text-zinc-200 mb-1 block">
                      Username
                    </label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-mono text-zinc-400 select-none">
                        @
                      </span>
                      <input
                        type="text"
                        required
                        value={editUsername}
                        onChange={(e) => setEditUsername(e.target.value)}
                        placeholder="username"
                        className="w-full pl-7 pr-3 py-2 rounded-xl bg-zinc-100 dark:bg-white/5 border border-black/15 dark:border-white/15 text-xs font-mono text-zinc-950 dark:text-white placeholder:text-zinc-400 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                      />
                    </div>
                  </div>

                  {/* 4. Bio */}
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="text-xs font-bold text-zinc-900 dark:text-zinc-200">
                        Bio
                      </label>
                      <span className="text-[10px] font-mono text-zinc-400">
                        {editBio.length}/160
                      </span>
                    </div>
                    <textarea
                      rows={2}
                      maxLength={160}
                      value={editBio}
                      onChange={(e) => setEditBio(e.target.value)}
                      placeholder="Tell other listeners about your taste in music..."
                      className="w-full px-3 py-2 rounded-xl bg-zinc-100 dark:bg-white/5 border border-black/15 dark:border-white/15 text-xs text-zinc-950 dark:text-white placeholder:text-zinc-400 focus:outline-none focus:ring-1 focus:ring-indigo-500 resize-none leading-relaxed"
                    />
                  </div>
                </div>

                {/* Sticky Glass Footer */}
                <div className="flex items-center justify-end gap-2 px-5 py-3 border-t border-black/[0.08] dark:border-white/[0.08] bg-inherit backdrop-blur-xl flex-shrink-0">
                  <button
                    type="button"
                    onClick={() => setIsEditModalOpen(false)}
                    className="px-3.5 py-1.5 rounded-xl text-xs font-semibold text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={!editName.trim()}
                    className="px-4 py-2 rounded-xl bg-zinc-950 text-white dark:bg-white dark:text-zinc-950 text-xs font-bold shadow-md hover:scale-105 active:scale-95 transition-all cursor-pointer disabled:opacity-50"
                  >
                    Save Changes
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
