"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Mic2, Loader2, Play, ArrowDownCircle } from "lucide-react";
import { useLyricsStore } from "@/store/useLyricsStore";
import { usePlayerStore } from "@/store/usePlayerStore";
import { cn } from "@/lib/utils";

export default function LyricsPanel() {
  const { lines, activeLine, isLoading, isInstrumental } = useLyricsStore();
  const { currentTrack, position, seekTo, resume } = usePlayerStore();

  const containerRef = useRef<HTMLDivElement>(null);
  const activeLineRef = useRef<HTMLDivElement>(null);
  const isUserScrollingRef = useRef(false);
  const scrollTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const [showResumeScroll, setShowResumeScroll] = useState(false);

  // Auto-scroll to center when active line changes
  useEffect(() => {
    if (isUserScrollingRef.current) return;
    if (activeLineRef.current) {
      activeLineRef.current.scrollIntoView({
        behavior: "smooth",
        block: "center",
      });
    }
  }, [activeLine]);

  // Initial scroll into view on mount or when switching tabs
  useEffect(() => {
    const timer = setTimeout(() => {
      if (activeLineRef.current) {
        activeLineRef.current.scrollIntoView({
          behavior: "smooth",
          block: "center",
        });
      }
    }, 150);
    return () => clearTimeout(timer);
  }, []);

  // Detect manual user scrolling and pause auto-scroll for 3 seconds
  const handleUserScroll = useCallback(() => {
    isUserScrollingRef.current = true;
    setShowResumeScroll(true);

    if (scrollTimeoutRef.current) {
      clearTimeout(scrollTimeoutRef.current);
    }

    scrollTimeoutRef.current = setTimeout(() => {
      isUserScrollingRef.current = false;
      setShowResumeScroll(false);
      activeLineRef.current?.scrollIntoView({
        behavior: "smooth",
        block: "center",
      });
    }, 3000);
  }, []);

  const handleResumeAutoScroll = () => {
    isUserScrollingRef.current = false;
    setShowResumeScroll(false);
    activeLineRef.current?.scrollIntoView({
      behavior: "smooth",
      block: "center",
    });
  };

  const handleLineClick = (lineTimeSec: number) => {
    seekTo(lineTimeSec * 1000);
    resume();
    isUserScrollingRef.current = false;
    setShowResumeScroll(false);
  };

  if (!currentTrack) {
    return (
      <div className="flex flex-col items-center justify-center h-full gap-3 text-center p-6 text-zinc-500">
        <div className="w-12 h-12 rounded-full glass-card flex items-center justify-center">
          <Mic2 className="w-6 h-6 text-zinc-400" />
        </div>
        <p className="text-xs font-medium">Select a track to view live lyrics</p>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center h-full gap-3 text-center">
        <Loader2 className="w-6 h-6 text-indigo-500 animate-spin" />
        <p className="text-xs text-zinc-500 dark:text-zinc-400 font-mono tracking-wide">
          Syncing Apple Music lyrics...
        </p>
      </div>
    );
  }

  if (!lines.length) {
    return (
      <div className="flex flex-col items-center justify-center h-full gap-3 text-center p-6 text-zinc-500">
        <div className="w-12 h-12 rounded-full glass-card flex items-center justify-center">
          <Mic2 className="w-6 h-6 text-zinc-400" />
        </div>
        <p className="text-xs text-zinc-500 dark:text-zinc-400 font-medium">No synced lyrics available for</p>
        <p className="text-xs font-semibold text-zinc-900 dark:text-white tracking-wide">{currentTrack.name}</p>
      </div>
    );
  }

  const currentSec = position / 1000;
  const isIntroInstrumental = lines.length > 0 && lines[0].time > 4 && currentSec < lines[0].time;

  return (
    <div className="relative h-full overflow-hidden flex flex-col">
      {/* Floating Resume Auto-Scroll Pill */}
      <AnimatePresence>
        {showResumeScroll && (
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.95 }}
            className="absolute bottom-6 left-1/2 -translate-x-1/2 z-20"
          >
            <button
              onClick={handleResumeAutoScroll}
              className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-full glass-pill text-xs font-medium text-zinc-900 dark:text-white shadow-lg shadow-black/10 dark:shadow-black/40 hover:scale-105 active:scale-95 transition-all"
            >
              <ArrowDownCircle className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
              <span>Sync to current lyric</span>
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main Lyrics Container */}
      <div
        ref={containerRef}
        onWheel={handleUserScroll}
        onTouchMove={handleUserScroll}
        className="apple-lyrics-viewport flex-1 overflow-y-auto px-5 py-8 flex flex-col gap-6 scrollbar-none select-none outline-none border-0 ring-0 scroll-smooth"
        style={{
          WebkitMaskImage: "linear-gradient(to bottom, transparent 0%, rgba(0,0,0,1) 10%, rgba(0,0,0,1) 88%, transparent 100%)",
          maskImage: "linear-gradient(to bottom, transparent 0%, rgba(0,0,0,1) 10%, rgba(0,0,0,1) 88%, transparent 100%)",
          WebkitTapHighlightColor: "transparent",
          WebkitBackfaceVisibility: "hidden",
          backfaceVisibility: "hidden",
        }}
      >
        <div className="h-32 flex-shrink-0" />

        {/* Instrumental Prelude Dots */}
        {isIntroInstrumental && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex items-center gap-2 py-4 justify-start text-zinc-800 dark:text-white/70 select-none"
          >
            <span className="text-xs uppercase font-mono tracking-widest text-zinc-500 mr-2">Intro</span>
            {[0, 1, 2].map((dot) => (
              <motion.span
                key={dot}
                animate={{
                  opacity: [0.25, 1, 0.25],
                  scale: [0.85, 1.25, 0.85],
                }}
                transition={{
                  duration: 1.2,
                  repeat: Infinity,
                  delay: dot * 0.2,
                  ease: "easeInOut",
                }}
                className="w-2.5 h-2.5 rounded-full bg-zinc-900 dark:bg-white shadow-sm"
              />
            ))}
          </motion.div>
        )}

        {/* Lyrics Line Stream (Apple Music Stepped Typography) */}
        {lines.map((line, i) => {
          const isActive = i === activeLine;
          const distance = activeLine >= 0 ? Math.abs(i - activeLine) : 99;

          const isGapAfterThisLine =
            isActive &&
            isInstrumental &&
            lines[i + 1] &&
            lines[i + 1].time - line.time > 5;

          // Apple Music stepped blur and opacity values
          let targetBlur = "blur(0px)";
          let targetOpacity = 1;
          let targetScale = 1.0;
          let typographyColor = "text-zinc-950 dark:text-white font-black text-xl md:text-2xl";

          if (isActive) {
            targetBlur = "blur(0px)";
            targetOpacity = 1;
            targetScale = 1.0;
            typographyColor = "text-zinc-950 dark:text-white font-black text-xl md:text-2xl";
          } else if (distance === 1) {
            targetBlur = "blur(0.8px)";
            targetOpacity = 0.45;
            targetScale = 0.98;
            typographyColor = "text-zinc-700 dark:text-zinc-400 font-semibold text-base md:text-lg";
          } else if (distance === 2) {
            targetBlur = "blur(1.6px)";
            targetOpacity = 0.30;
            targetScale = 0.96;
            typographyColor = "text-zinc-600 dark:text-zinc-500 font-medium text-base md:text-lg";
          } else {
            targetBlur = "blur(2.2px)";
            targetOpacity = 0.18;
            targetScale = 0.94;
            typographyColor = "text-zinc-500 dark:text-zinc-600 font-medium text-base md:text-lg";
          }

          return (
            <div
              key={`${i}-${line.time}`}
              ref={isActive ? activeLineRef : undefined}
              className="apple-lyric-line relative group transition-all duration-300 select-none outline-none border-0 ring-0 bg-transparent"
              style={{
                WebkitBackfaceVisibility: "hidden",
                backfaceVisibility: "hidden",
                WebkitTransform: "translateZ(0)",
                transform: "translateZ(0)",
                WebkitTapHighlightColor: "transparent",
                outline: "none",
                border: "none",
                boxShadow: "none",
              }}
            >
              <motion.div
                onClick={() => handleLineClick(line.time)}
                animate={{
                  scale: targetScale,
                  opacity: targetOpacity,
                  filter: targetBlur,
                }}
                whileHover={{
                  opacity: 0.85,
                  filter: "blur(0px)",
                  scale: isActive ? 1.0 : 0.98,
                }}
                transition={{
                  duration: 0.25,
                  ease: [0.25, 0.1, 0.25, 1],
                }}
                className={cn(
                  "cursor-pointer origin-left transition-colors text-left select-none outline-none border-0 ring-0",
                  typographyColor
                )}
                style={{
                  WebkitTapHighlightColor: "transparent",
                  outline: "none",
                  border: "none",
                  boxShadow: "none",
                }}
              >
                <span
                  className="inline-block leading-relaxed select-none outline-none border-0 ring-0"
                  style={{
                    textShadow: isActive
                      ? "0 0 20px rgba(255,255,255,0.45), 0 0 42px rgba(255,255,255,0.18)"
                      : "none",
                  }}
                >
                  {line.text}
                </span>

                {!isActive && (
                  <span className="inline-flex items-center ml-2.5 opacity-0 group-hover:opacity-100 text-[10px] font-mono text-zinc-500 dark:text-zinc-400 align-middle transition-opacity select-none">
                    <Play className="w-2.5 h-2.5 inline mr-1 fill-current" />
                    {Math.floor(line.time / 60)}:{String(Math.floor(line.time % 60)).padStart(2, "0")}
                  </span>
                )}
              </motion.div>

              {/* Instrumental Gap Dots Indicator between lines */}
              {isGapAfterThisLine && (
                <motion.div
                  initial={{ opacity: 0, y: 4 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="flex items-center gap-2 mt-4 ml-1 text-zinc-800 dark:text-white/70"
                >
                  <span className="text-[10px] uppercase font-mono tracking-widest text-zinc-500 mr-1.5">
                    Instrumental
                  </span>
                  {[0, 1, 2].map((dot) => (
                    <motion.span
                      key={dot}
                      animate={{
                        opacity: [0.25, 1, 0.25],
                        scale: [0.85, 1.25, 0.85],
                      }}
                      transition={{
                        duration: 1.2,
                        repeat: Infinity,
                        delay: dot * 0.2,
                        ease: "easeInOut",
                      }}
                      className="w-2 h-2 rounded-full bg-zinc-900 dark:bg-white shadow-sm"
                    />
                  ))}
                </motion.div>
              )}
            </div>
          );
        })}

        <div className="h-44 flex-shrink-0" />
      </div>
    </div>
  );
}
