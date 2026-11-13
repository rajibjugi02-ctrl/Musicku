"use client";

import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  X,
  Share2,
  Copy,
  Download,
  Check,
  MessageSquareQuote,
  Sparkles,
} from "lucide-react";
import { useLyricsStore } from "@/store/useLyricsStore";
import type { PlayerTrack, LrcLine } from "@/types/music";
import { cn } from "@/lib/utils";

interface ShareLyricsModalProps {
  track: PlayerTrack;
  isOpen: boolean;
  onClose: () => void;
}

export default function ShareLyricsModal({ track, isOpen, onClose }: ShareLyricsModalProps) {
  const { lines: storeLines } = useLyricsStore();
  const [lines, setLines] = useState<LrcLine[]>([]);
  const [selectedIndices, setSelectedIndices] = useState<number[]>([0, 1]);
  const [copied, setCopied] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Initialize or fetch lyrics for the track
  useEffect(() => {
    if (!isOpen) return;

    if (storeLines && storeLines.length > 0) {
      setLines(storeLines);
      setSelectedIndices([0, Math.min(1, storeLines.length - 1)]);
      return;
    }

    // Fallback fetch if opened without store lyrics loaded
    fetch(`/api/lyrics?track=${encodeURIComponent(track.name)}&artist=${encodeURIComponent(track.artistName)}`)
      .then((r) => r.json())
      .then((data) => {
        if (Array.isArray(data.lines) && data.lines.length > 0) {
          setLines(data.lines);
          setSelectedIndices([0, Math.min(1, data.lines.length - 1)]);
        } else {
          // Synthetic preview lines if no synced lyrics
          setLines([
            { time: 0, text: `♪ ${track.name} ♪` },
            { time: 5, text: `Performed by ${track.artistName}` },
            { time: 10, text: `From the album "${track.albumName || track.name}"` },
            { time: 15, text: `Streamed in Lossless Audio on Musicku` },
          ]);
          setSelectedIndices([0, 1]);
        }
      })
      .catch(() => {
        setLines([
          { time: 0, text: `♪ ${track.name} ♪` },
          { time: 5, text: `By ${track.artistName}` },
        ]);
        setSelectedIndices([0, 1]);
      });
  }, [isOpen, track, storeLines]);

  const showToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 2500);
  };

  const toggleLine = (idx: number) => {
    if (selectedIndices.includes(idx)) {
      if (selectedIndices.length === 1) return; // Keep at least 1 line
      setSelectedIndices(selectedIndices.filter((i) => i !== idx));
    } else {
      if (selectedIndices.length >= 4) {
        showToast("Maximum 4 lines for lyric card");
        return;
      }
      setSelectedIndices([...selectedIndices, idx].sort((a, b) => a - b));
    }
  };

  const selectedText = selectedIndices
    .map((i) => lines[i]?.text)
    .filter(Boolean)
    .join("\n");

  const formattedShareQuote = `"${selectedText}"\n\n— ${track.name} by ${track.artistName} 🎵\nListen on Musicku`;

  const handleCopyText = async () => {
    try {
      await navigator.clipboard.writeText(formattedShareQuote);
      setCopied(true);
      showToast("Lyrics copied to clipboard!");
      setTimeout(() => setCopied(false), 2000);
    } catch {
      showToast("Failed to copy lyrics");
    }
  };

  const handleWhatsApp = () => {
    const url = `https://api.whatsapp.com/send?text=${encodeURIComponent(formattedShareQuote)}`;
    window.open(url, "_blank");
  };

  // Render high-res PNG image card (1080x1350 Instagram Story / 9:16 aspect)
  const generateCardImage = async (): Promise<Blob | null> => {
    const canvas = canvasRef.current;
    if (!canvas) return null;
    const ctx = canvas.getContext("2d");
    if (!ctx) return null;

    canvas.width = 1080;
    canvas.height = 1350;

    // 1. Apple Music iOS 26 Deep Glass Liquid Gradient Background
    const grad = ctx.createLinearGradient(0, 0, 1080, 1350);
    grad.addColorStop(0, "#180c2c");
    grad.addColorStop(0.4, "#0f172a");
    grad.addColorStop(1, "#070709");
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, 1080, 1350);

    // Ambient Specular Circles
    ctx.fillStyle = "rgba(99, 102, 241, 0.18)";
    ctx.beginPath();
    ctx.arc(200, 300, 400, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = "rgba(236, 72, 153, 0.15)";
    ctx.beginPath();
    ctx.arc(880, 800, 450, 0, Math.PI * 2);
    ctx.fill();

    // 2. Card Container (Frosted Glass Border & Panel)
    const cardX = 90;
    const cardY = 120;
    const cardW = 900;
    const cardH = 1110;
    const radius = 64;

    ctx.save();
    ctx.beginPath();
    ctx.roundRect(cardX, cardY, cardW, cardH, radius);
    ctx.fillStyle = "rgba(255, 255, 255, 0.08)";
    ctx.fill();
    ctx.lineWidth = 3;
    ctx.strokeStyle = "rgba(255, 255, 255, 0.22)";
    ctx.stroke();
    ctx.restore();

    // 3. Album Art Header
    try {
      const img = new Image();
      img.crossOrigin = "anonymous";
      img.src = track.albumArt;
      await new Promise((resolve) => {
        img.onload = resolve;
        img.onerror = resolve;
      });

      if (img.width) {
        ctx.save();
        ctx.beginPath();
        ctx.roundRect(cardX + 60, cardY + 60, 180, 180, 36);
        ctx.clip();
        ctx.drawImage(img, cardX + 60, cardY + 60, 180, 180);
        ctx.restore();
      }
    } catch { }

    // Track Title & Artist
    ctx.fillStyle = "#ffffff";
    ctx.font = "bold 44px -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif";
    ctx.fillText(track.name.slice(0, 30), cardX + 270, cardY + 130);

    ctx.fillStyle = "rgba(255, 255, 255, 0.65)";
    ctx.font = "500 34px -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif";
    ctx.fillText(track.artistName.slice(0, 35), cardX + 270, cardY + 185);

    // 4. Large Lyric Lines with Bold Quotation
    ctx.fillStyle = "rgba(255, 255, 255, 0.96)";
    ctx.font = "bold 56px -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif";

    const selectedLines = selectedIndices.map((i) => lines[i]?.text).filter(Boolean);
    let startY = cardY + 420;

    selectedLines.forEach((line) => {
      // Basic word wrapping
      const words = line.split(" ");
      let currentLine = "";
      for (const word of words) {
        const testLine = currentLine ? `${currentLine} ${word}` : word;
        const metrics = ctx.measureText(testLine);
        if (metrics.width > cardW - 140 && currentLine) {
          ctx.fillText(currentLine, cardX + 70, startY);
          currentLine = word;
          startY += 78;
        } else {
          currentLine = testLine;
        }
      }
      if (currentLine) {
        ctx.fillText(currentLine, cardX + 70, startY);
        startY += 95;
      }
    });

    // 5. Apple Music Style Watermark Footer
    ctx.fillStyle = "rgba(255, 255, 255, 0.4)";
    ctx.font = "600 28px -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif";
    ctx.fillText("Musicku • Apple iOS 26 Liquid Audio", cardX + 70, cardY + cardH - 60);

    return new Promise((resolve) => {
      canvas.toBlob((blob) => resolve(blob), "image/png");
    });
  };

  const handleShareCard = async () => {
    setIsGenerating(true);
    try {
      const blob = await generateCardImage();
      if (!blob) throw new Error("Could not generate card");

      const file = new File([blob], `${track.name.replace(/\s+/g, "_")}_lyrics.png`, {
        type: "image/png",
      });

      if (navigator.canShare && navigator.canShare({ files: [file] })) {
        await navigator.share({
          files: [file],
          title: `${track.name} Lyrics`,
          text: formattedShareQuote,
        });
        showToast("Shared successfully!");
      } else {
        // Fallback: Download file directly
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `${track.name}_lyrics_card.png`;
        a.click();
        URL.revokeObjectURL(url);
        await navigator.clipboard.writeText(formattedShareQuote);
        showToast("Lyric card downloaded & text copied for Instagram! 📸");
      }
    } catch {
      showToast("Download failed, please try copying text");
    } finally {
      setIsGenerating(false);
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[150] flex items-center justify-center p-3 sm:p-4 bg-black/70 backdrop-blur-2xl">
        <motion.div
          initial={{ opacity: 0, scale: 0.94, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.94, y: 20 }}
          className="w-full max-w-lg max-h-[92dvh] rounded-[32px] overflow-hidden flex flex-col glass-panel bg-zinc-950/90 text-white border border-white/15 shadow-2xl"
        >
          {/* Header */}
          <div className="flex items-center justify-between px-5 py-4 border-b border-white/10 sticky top-0 bg-zinc-950/80 backdrop-blur-xl z-10">
            <div className="flex items-center gap-2">
              <MessageSquareQuote className="w-5 h-5 text-indigo-400" />
              <div>
                <h3 className="text-sm font-bold leading-tight">Share Track & Lyrics</h3>
                <p className="text-[11px] text-white/50">Pick 1 to 4 lines to preview & share</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-1.5 rounded-full hover:bg-white/10 text-white/70 hover:text-white transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Body */}
          <div className="p-4 sm:p-5 overflow-y-auto space-y-4 flex-1">
            {/* Live Lyric Card Preview */}
            <div className="rounded-3xl p-5 bg-gradient-to-br from-zinc-900/90 via-zinc-950 to-black border border-white/15 shadow-xl relative overflow-hidden">
              <div className="flex items-center gap-3 pb-3 border-b border-white/10">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={track.albumArt}
                  alt={track.name}
                  className="w-12 h-12 rounded-xl object-cover shadow-md border border-white/15 flex-shrink-0"
                />
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-bold text-white truncate">{track.name}</p>
                  <p className="text-[11px] text-white/60 truncate">{track.artistName}</p>
                </div>
                <span className="text-[9px] font-mono uppercase tracking-wider px-2 py-0.5 rounded-full bg-white/10 text-white/70">
                  Card Preview
                </span>
              </div>

              {/* Highlighted Lyrics Quote */}
              <div className="py-4 space-y-2">
                {selectedIndices.map((idx) => (
                  <p
                    key={idx}
                    className="text-base sm:text-lg font-extrabold text-white leading-snug drop-shadow-sm tracking-tight"
                  >
                    &ldquo;{lines[idx]?.text}&rdquo;
                  </p>
                ))}
              </div>

              <div className="flex items-center justify-between pt-2 border-t border-white/10 text-[10px] text-white/40 font-mono">
                <span>Musicku • Liquid Audio</span>
                <span>{selectedIndices.length}/4 lines selected</span>
              </div>
            </div>

            {/* Lyric Line Selector List */}
            <div>
              <span className="text-xs font-bold text-white/70 uppercase tracking-widest block mb-2 px-1">
                Select Lyrics
              </span>
              <div className="space-y-1.5 max-h-56 overflow-y-auto pr-1 no-scrollbar">
                {lines.map((line, idx) => {
                  const isSelected = selectedIndices.includes(idx);
                  return (
                    <div
                      key={idx}
                      onClick={() => toggleLine(idx)}
                      className={cn(
                        "p-3 rounded-2xl border transition-all cursor-pointer flex items-center justify-between gap-3 text-xs",
                        isSelected
                          ? "bg-indigo-600/30 border-indigo-400 text-white font-bold shadow-sm"
                          : "bg-white/5 border-white/5 text-white/60 hover:bg-white/10 hover:text-white"
                      )}
                    >
                      <span className="truncate flex-1">{line.text}</span>
                      <div
                        className={cn(
                          "w-4 h-4 rounded-full flex items-center justify-center flex-shrink-0 transition-all",
                          isSelected ? "bg-indigo-500 text-white" : "border border-white/30"
                        )}
                      >
                        {isSelected && <Check className="w-2.5 h-2.5" />}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Action Sharing Footer */}
          <div className="p-4 bg-zinc-950/90 border-t border-white/10 flex flex-wrap sm:flex-nowrap gap-2 items-center justify-between">
            <button
              onClick={handleWhatsApp}
              className="flex-1 py-2.5 px-3 rounded-2xl bg-emerald-600/30 hover:bg-emerald-600/40 border border-emerald-500/40 text-emerald-200 text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer"
            >
              <Share2 className="w-3.5 h-3.5" />
              <span>WhatsApp</span>
            </button>

            <button
              onClick={handleShareCard}
              disabled={isGenerating}
              className="flex-1 py-2.5 px-3 rounded-2xl bg-white hover:bg-zinc-200 text-zinc-950 text-xs font-bold flex items-center justify-center gap-1.5 shadow-lg shadow-white/10 transition-all cursor-pointer disabled:opacity-50"
            >
              {isGenerating ? (
                <Sparkles className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <Download className="w-3.5 h-3.5" />
              )}
              <span>Share / Save Card</span>
            </button>

            <button
              onClick={handleCopyText}
              className="py-2.5 px-3 rounded-2xl bg-white/10 hover:bg-white/15 text-white text-xs font-semibold flex items-center justify-center gap-1.5 transition-all cursor-pointer"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copied ? "Copied" : "Copy"}</span>
            </button>
          </div>

          {/* Hidden Canvas for High-Res 1080x1350 Card Generation */}
          <canvas ref={canvasRef} className="hidden" />

          {/* Toast */}
          {toastMsg && (
            <div className="absolute top-4 left-1/2 -translate-x-1/2 px-4 py-2 rounded-full glass-panel bg-black/90 text-white text-xs font-semibold border border-white/20 shadow-2xl z-20">
              {toastMsg}
            </div>
          )}
        </motion.div>
      </div>
    </AnimatePresence>
  );
}

