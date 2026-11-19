"use client";

import { usePlayerStore } from "@/store/usePlayerStore";

/**
 * Liquid Glass Specular Ambient Light Layer
 * Monochromatic Apple iOS 26 styling with zero purple/pink slop.
 * Mobile GPU optimized: uses lightweight blur on mobile screens to prevent
 * Android WebView compositor freeze during app switching and close gestures.
 */
export default function AmbientBackground() {
  const currentTrack = usePlayerStore((s) => s.currentTrack);

  return (
    <div className="fixed inset-0 pointer-events-none -z-10 overflow-hidden select-none">
      {/* Background base tone */}
      <div className="absolute inset-0 bg-[#F2F4F8] dark:bg-[#070709] transition-colors duration-500" />

      {/* Mobile-optimized single specular accent (< 768px): ultra-lightweight, no layered freeze */}
      <div
        className="sm:hidden absolute top-[10%] left-[25%] w-[50vw] h-[50vw] max-w-[300px] max-h-[300px] rounded-full opacity-10 dark:opacity-15 blur-[20px] bg-white pointer-events-none transform-gpu"
        style={{ transform: "translate3d(0, 0, 0)" }}
      />

      {/* Desktop / Tablet Primary Ambient Specular Orb (>= 640px) */}
      <div
        className="hidden sm:block absolute -top-[15%] left-[20%] w-[60vw] h-[60vw] max-w-[750px] max-h-[750px] rounded-full opacity-15 dark:opacity-20 blur-[90px] transition-all duration-1000 transform-gpu will-change-transform"
        style={{
          background: currentTrack
            ? "radial-gradient(circle, rgba(255, 255, 255, 0.25) 0%, rgba(200, 200, 210, 0.10) 50%, transparent 70%)"
            : "radial-gradient(circle, rgba(255, 255, 255, 0.15) 0%, rgba(180, 180, 190, 0.06) 50%, transparent 70%)",
          transform: "translate3d(0, 0, 0)",
        }}
      />

      {/* Desktop / Tablet Secondary Specular Reflection Orb (>= 640px) */}
      <div
        className="hidden sm:block absolute -bottom-[20%] right-[15%] w-[55vw] h-[55vw] max-w-[650px] max-h-[650px] rounded-full opacity-10 dark:opacity-15 blur-[90px] transition-all duration-1000 transform-gpu will-change-transform"
        style={{
          background: currentTrack
            ? "radial-gradient(circle, rgba(240, 240, 250, 0.20) 0%, rgba(160, 160, 175, 0.08) 50%, transparent 70%)"
            : "radial-gradient(circle, rgba(220, 220, 230, 0.12) 0%, rgba(140, 140, 150, 0.05) 50%, transparent 70%)",
          transform: "translate3d(0, 0, 0)",
        }}
      />
    </div>
  );
}
