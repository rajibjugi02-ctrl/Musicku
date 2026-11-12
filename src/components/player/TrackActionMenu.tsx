"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useRouter } from "next/navigation";
import {
  Star,
  Plus,
  Share2,
  ListPlus,
  Radio,
  Disc,
  Mic2,
  Info,
  MessageSquareQuote,
  ThumbsDown,
  Check,
  X,
  Copy,
  ExternalLink,
} from "lucide-react";
import { useLibraryStore } from "@/store/useLibraryStore";
import { usePlayerStore } from "@/store/usePlayerStore";
import { useUIStore } from "@/store/useUIStore";
import type { PlayerTrack } from "@/types/music";
import { cn } from "@/lib/utils";
import ShareLyricsModal from "./ShareLyricsModal";
import TrackCreditsModal from "./TrackCreditsModal";

interface TrackActionMenuProps {
  track: PlayerTrack;
  isOpen: boolean;
  onClose: () => void;
  onOpenPlaylistModal: () => void;
}

export default function TrackActionMenu({
  track,
  isOpen,
  onClose,
  onOpenPlaylistModal,
}: TrackActionMenuProps) {
  const router = useRouter();
  const { toggleLikeTrack, isTrackLiked } = useLibraryStore();
  const { next } = usePlayerStore();
  const { closeMobilePlayer } = useUIStore();

  const [shareViewOpen, setShareViewOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [isShareLyricsOpen, setIsShareLyricsOpen] = useState(false);
  const [isCreditsOpen, setIsCreditsOpen] = useState(false);

  const isFavorited = isTrackLiked(track.id);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 2500);
  };

  const handleFavorite = () => {
    toggleLikeTrack(track);
    showToast(isFavorited ? "Removed from Favorites" : "Added to Favorites");
  };

  const handleGoToArtist = () => {
    onClose();
    closeMobilePlayer();
    router.push(`/artist/${encodeURIComponent(track.artistName)}`);
  };

  const handleGoToAlbum = () => {
    onClose();
    closeMobilePlayer();
    router.push(`/search?q=${encodeURIComponent(track.albumName || track.name)}`);
  };

  const handleCreateStation = () => {
    showToast(`Radio station for "${track.name}" created!`);
    usePlayerStore.getState().generateSmartRadioQueue(track);
    onClose();
  };

  const handleSuggestLess = () => {
    showToast("We'll recommend less like this");
    setTimeout(() => {
      onClose();
      next();
    }, 600);
  };

  // Sharing utilities
  const shareUrl = typeof window !== "undefined" ? `${window.location.origin}/search?q=${encodeURIComponent(track.name)}` : "";
  const shareText = `Listening to "${track.name}" by ${track.artistName} on Musicku! 🎵`;

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(`${shareText}\n${shareUrl}`);
      setCopied(true);
      showToast("Link copied to clipboard!");
      setTimeout(() => setCopied(false), 2000);
    } catch {
      showToast("Unable to copy link");
    }
  };

  const handleNativeShare = async () => {
    if (typeof navigator !== "undefined" && navigator.share) {
      try {
        await navigator.share({
          title: track.name,
          text: shareText,
          url: shareUrl,
        });
        onClose();
      } catch {
        // User dismissed share
      }
    } else {
      setShareViewOpen(true);
    }
  };

  const handleWhatsApp = () => {
    window.open(`https://api.whatsapp.com/send?text=${encodeURIComponent(`${shareText} ${shareUrl}`)}`, "_blank");
  };

  const handleTelegram = () => {
    window.open(`https://t.me/share/url?url=${encodeURIComponent(shareUrl)}&text=${encodeURIComponent(shareText)}`, "_blank");
  };

  const handleTwitter = () => {
    window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}&url=${encodeURIComponent(shareUrl)}`, "_blank");
  };

  const handleInstagram = async () => {
    await handleCopyLink();
    showToast("Copied! Open Instagram Stories or DM to paste link 📸");
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop Tap Target */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 z-[120] bg-black/40 backdrop-blur-[2px]"
          />

          {/* Toast Notification */}
          {toastMessage && (
            <motion.div
              initial={{ opacity: 0, y: -20, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -20, scale: 0.95 }}
              className="fixed top-6 inset-x-4 mx-auto max-w-xs z-[140] glass-panel bg-black/80 text-white text-xs font-medium py-2.5 px-4 rounded-2xl shadow-2xl flex items-center justify-center gap-2 text-center border border-white/20"
            >
              <Check className="w-4 h-4 text-emerald-400" />
              <span>{toastMessage}</span>
            </motion.div>
          )}

          {/* Popover Bubble Menu */}
          <motion.div
            initial={{ opacity: 0, scale: 0.75, y: -10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.75, y: -10 }}
            transition={{ type: "spring", stiffness: 420, damping: 24 }}
            style={{ transformOrigin: "top right" }}
            className="fixed top-14 right-4 z-[130] w-[290px] glass-panel bg-[#181c2c]/90 dark:bg-[#121624]/95 text-white rounded-[26px] p-2 shadow-[0_25px_60px_rgba(0,0,0,0.6)] border border-white/20 backdrop-blur-2xl overflow-hidden select-none"
          >
            {!shareViewOpen ? (
              <div className="flex flex-col">
                {/* Top Quick Actions Row */}
                <div className="grid grid-cols-3 gap-1 p-1 bg-white/5 rounded-[20px] mb-2">
                  <button
                    onClick={() => {
                      onClose();
                      onOpenPlaylistModal();
                    }}
                    className="flex flex-col items-center justify-center py-2.5 rounded-2xl hover:bg-white/10 active:scale-95 transition-all text-center cursor-pointer"
                  >
                    <Plus className="w-5 h-5 text-zinc-200 mb-1" />
                    <span className="text-[10px] font-medium text-zinc-300">Add</span>
                  </button>

                  <button
                    onClick={handleFavorite}
                    className="flex flex-col items-center justify-center py-2.5 rounded-2xl hover:bg-white/10 active:scale-95 transition-all text-center cursor-pointer"
                  >
                    <Star
                      className={cn(
                        "w-5 h-5 mb-1 transition-colors",
                        isFavorited ? "text-amber-400 fill-amber-400" : "text-zinc-200"
                      )}
                    />
                    <span className="text-[10px] font-medium text-zinc-300">Favorite</span>
                  </button>

                  <button
                    onClick={handleNativeShare}
                    className="flex flex-col items-center justify-center py-2.5 rounded-2xl hover:bg-white/10 active:scale-95 transition-all text-center cursor-pointer"
                  >
                    <Share2 className="w-5 h-5 text-zinc-200 mb-1" />
                    <span className="text-[10px] font-medium text-zinc-300">Share</span>
                  </button>
                </div>

                {/* Menu List */}
                <div className="flex flex-col text-xs font-medium divide-y divide-white/[0.08]">
                  {/* Add to Playlist */}
                  <button
                    onClick={() => {
                      onClose();
                      onOpenPlaylistModal();
                    }}
                    className="flex items-center gap-3.5 px-3 py-2.5 hover:bg-white/10 active:bg-white/15 rounded-xl transition-colors cursor-pointer text-left"
                  >
                    <ListPlus className="w-4 h-4 text-zinc-300 flex-shrink-0" />
                    <span>Add to Playlist</span>
                  </button>

                  {/* Create Station */}
                  <button
                    onClick={handleCreateStation}
                    className="flex items-center gap-3.5 px-3 py-2.5 hover:bg-white/10 active:bg-white/15 rounded-xl transition-colors cursor-pointer text-left"
                  >
                    <Radio className="w-4 h-4 text-zinc-300 flex-shrink-0" />
                    <span>Create Station</span>
                  </button>

                  {/* Go to Album */}
                  <button
                    onClick={handleGoToAlbum}
                    className="flex items-center gap-3.5 px-3 py-2.5 hover:bg-white/10 active:bg-white/15 rounded-xl transition-colors cursor-pointer text-left"
                  >
                    <Disc className="w-4 h-4 text-zinc-300 flex-shrink-0" />
                    <div className="min-w-0 flex-1">
                      <p className="truncate">Go to Album</p>
                      <p className="text-[10px] text-zinc-400 truncate font-normal">
                        {track.albumName || track.name}
                      </p>
                    </div>
                  </button>

                  {/* Go to Artist */}
                  <button
                    onClick={handleGoToArtist}
                    className="flex items-center gap-3.5 px-3 py-2.5 hover:bg-white/10 active:bg-white/15 rounded-xl transition-colors cursor-pointer text-left"
                  >
                    <Mic2 className="w-4 h-4 text-zinc-300 flex-shrink-0" />
                    <div className="min-w-0 flex-1">
                      <p className="truncate">Go to Artist</p>
                      <p className="text-[10px] text-zinc-400 truncate font-normal">
                        {track.artistName}
                      </p>
                    </div>
                  </button>

                  {/* View Credits */}
                  <button
                    onClick={() => setIsCreditsOpen(true)}
                    className="flex items-center gap-3.5 px-3 py-2.5 hover:bg-white/10 active:bg-white/15 rounded-xl transition-colors cursor-pointer text-left"
                  >
                    <Info className="w-4 h-4 text-zinc-300 flex-shrink-0" />
                    <span>View Credits</span>
                  </button>

                  {/* Share Lyrics */}
                  <button
                    onClick={() => setIsShareLyricsOpen(true)}
                    className="flex items-center gap-3.5 px-3 py-2.5 hover:bg-white/10 active:bg-white/15 rounded-xl transition-colors cursor-pointer text-left"
                  >
                    <MessageSquareQuote className="w-4 h-4 text-zinc-300 flex-shrink-0" />
                    <span>Share Track & Lyrics</span>
                  </button>

                  {/* Suggest Less */}
                  <button
                    onClick={handleSuggestLess}
                    className="flex items-center gap-3.5 px-3 py-2.5 hover:bg-white/10 active:bg-white/15 rounded-xl transition-colors cursor-pointer text-left text-zinc-300 hover:text-rose-400"
                  >
                    <ThumbsDown className="w-4 h-4 flex-shrink-0" />
                    <span>Suggest Less</span>
                  </button>
                </div>
              </div>
            ) : (
              /* Share Sub-Panel */
              <div className="flex flex-col p-1">
                <div className="flex items-center justify-between pb-2 mb-2 border-b border-white/10">
                  <span className="text-xs font-bold text-white">Share Song</span>
                  <button
                    onClick={() => setShareViewOpen(false)}
                    className="p-1 rounded-full hover:bg-white/10 text-zinc-400 hover:text-white"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>

                <div className="grid grid-cols-2 gap-2 text-xs font-medium">
                  <button
                    onClick={handleWhatsApp}
                    className="flex items-center gap-2 p-2.5 rounded-xl bg-emerald-500/20 text-emerald-300 hover:bg-emerald-500/30 transition-colors cursor-pointer"
                  >
                    <Share2 className="w-4 h-4" />
                    <span>WhatsApp</span>
                  </button>

                  <button
                    onClick={handleInstagram}
                    className="flex items-center gap-2 p-2.5 rounded-xl bg-gradient-to-r from-purple-500/20 to-pink-500/20 text-pink-300 hover:opacity-90 transition-all cursor-pointer"
                  >
                    <ExternalLink className="w-4 h-4" />
                    <span>Instagram</span>
                  </button>

                  <button
                    onClick={handleTelegram}
                    className="flex items-center gap-2 p-2.5 rounded-xl bg-sky-500/20 text-sky-300 hover:bg-sky-500/30 transition-colors cursor-pointer"
                  >
                    <Share2 className="w-4 h-4" />
                    <span>Telegram</span>
                  </button>

                  <button
                    onClick={handleTwitter}
                    className="flex items-center gap-2 p-2.5 rounded-xl bg-zinc-700/30 text-zinc-200 hover:bg-zinc-700/50 transition-colors cursor-pointer"
                  >
                    <Share2 className="w-4 h-4" />
                    <span>X (Twitter)</span>
                  </button>
                </div>

                <button
                  onClick={handleCopyLink}
                  className="w-full mt-2.5 py-2 px-3 rounded-xl bg-white/10 hover:bg-white/15 text-white flex items-center justify-center gap-2 text-xs font-semibold transition-all cursor-pointer"
                >
                  {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copied ? "Copied!" : "Copy Link"}</span>
                </button>
              </div>
            )}
          </motion.div>
        </>
      )}

      {/* Share Track & Lyrics Modal */}
      <ShareLyricsModal
        track={track}
        isOpen={isShareLyricsOpen}
        onClose={() => setIsShareLyricsOpen(false)}
      />

      {/* View Credits Modal */}
      <TrackCreditsModal
        track={track}
        isOpen={isCreditsOpen}
        onClose={() => setIsCreditsOpen(false)}
      />
    </AnimatePresence>
  );
}

