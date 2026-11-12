"use client";

import { motion, AnimatePresence } from "framer-motion";
import { X, Sparkles, Disc, Mic2, Calendar, Clock, Radio, Award } from "lucide-react";
import type { PlayerTrack } from "@/types/music";

interface TrackCreditsModalProps {
  track: PlayerTrack;
  isOpen: boolean;
  onClose: () => void;
}

export default function TrackCreditsModal({ track, isOpen, onClose }: TrackCreditsModalProps) {
  if (!isOpen) return null;

  const durationMin = Math.floor((track.duration || 180000) / 60000);
  const durationSec = String(Math.floor(((track.duration || 180000) % 60000) / 1000)).padStart(2, "0");

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[150] flex items-center justify-center p-4 bg-black/70 backdrop-blur-2xl">
        <motion.div
          initial={{ opacity: 0, scale: 0.94, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.94, y: 15 }}
          className="w-full max-w-sm rounded-[32px] overflow-hidden flex flex-col glass-panel bg-zinc-950/90 text-white border border-white/15 shadow-2xl"
        >
          {/* Header */}
          <div className="flex items-center justify-between px-5 py-4 border-b border-white/10">
            <div className="flex items-center gap-2">
              <Award className="w-5 h-5 text-indigo-400" />
              <h3 className="text-sm font-bold">Track Credits</h3>
            </div>
            <button
              onClick={onClose}
              className="p-1.5 rounded-full hover:bg-white/10 text-white/70 hover:text-white transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Body */}
          <div className="p-5 space-y-4">
            <div className="flex items-center gap-3.5 pb-4 border-b border-white/10">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={track.albumArt}
                alt={track.name}
                className="w-14 h-14 rounded-2xl object-cover shadow-lg border border-white/15 flex-shrink-0"
              />
              <div className="min-w-0 flex-1">
                <p className="text-sm font-bold text-white truncate">{track.name}</p>
                <p className="text-xs text-white/60 truncate mt-0.5">{track.artistName}</p>
              </div>
            </div>

            <div className="space-y-3 text-xs">
              <div className="flex items-center justify-between p-2.5 rounded-2xl bg-white/5 border border-white/5">
                <div className="flex items-center gap-2 text-white/60">
                  <Mic2 className="w-4 h-4 text-indigo-400" />
                  <span>Primary Artist</span>
                </div>
                <span className="font-bold text-white truncate max-w-[170px]">{track.artistName}</span>
              </div>

              <div className="flex items-center justify-between p-2.5 rounded-2xl bg-white/5 border border-white/5">
                <div className="flex items-center gap-2 text-white/60">
                  <Disc className="w-4 h-4 text-purple-400" />
                  <span>Album</span>
                </div>
                <span className="font-bold text-white truncate max-w-[170px]">
                  {track.albumName || track.name}
                </span>
              </div>

              <div className="flex items-center justify-between p-2.5 rounded-2xl bg-white/5 border border-white/5">
                <div className="flex items-center gap-2 text-white/60">
                  <Sparkles className="w-4 h-4 text-amber-400" />
                  <span>Audio Resolution</span>
                </div>
                <span className="font-mono font-bold text-amber-300">24-bit / 192kHz ALAC</span>
              </div>

              <div className="flex items-center justify-between p-2.5 rounded-2xl bg-white/5 border border-white/5">
                <div className="flex items-center gap-2 text-white/60">
                  <Clock className="w-4 h-4 text-emerald-400" />
                  <span>Duration</span>
                </div>
                <span className="font-mono text-white">{durationMin}:{durationSec}</span>
              </div>

              <div className="flex items-center justify-between p-2.5 rounded-2xl bg-white/5 border border-white/5">
                <div className="flex items-center gap-2 text-white/60">
                  <Radio className="w-4 h-4 text-sky-400" />
                  <span>Master Engine</span>
                </div>
                <span className="font-mono text-xs text-sky-300">Apple iOS 26 Studio</span>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="p-4 border-t border-white/10 bg-zinc-950">
            <button
              onClick={onClose}
              className="w-full py-2.5 rounded-2xl bg-white/10 hover:bg-white/15 text-white text-xs font-bold transition-all cursor-pointer"
            >
              Close
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
