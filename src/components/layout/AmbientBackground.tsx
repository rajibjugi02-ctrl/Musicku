"use client";

import { usePlayerStore } from "@/store/usePlayerStore";

export default function AmbientBackground() {
  const currentTrack = usePlayerStore((s) => s.currentTrack);

  return (
    <div className="fixed inset-0 pointer-events-none -z-10 overflow-hidden select-none">
      {/* Background base tone */}
      <div className="absolute inset-0 bg-[#F2F4F8] dark:bg-[#070709] transition-colors duration-500" />

      {/* Primary ambient light orb (adapts subtly to playback) */}
      <div
        className="absolute -top-[15%] left-[20%] w-[55vw] h-[55vw] max-w-[750px] max-h-[750px] rounded-full opacity-25 blur-[130px] transition-all duration-1000 transform-gpu"
        style={{
          background: currentTrack
            ? "radial-gradient(circle, rgba(99, 102, 241, 0.4) 0%, rgba(168, 85, 247, 0.2) 50%, transparent 70%)"
            : "radial-gradient(circle, rgba(59, 130, 246, 0.25) 0%, rgba(99, 102, 241, 0.12) 50%, transparent 70%)",
        }}
      />

      {/* Secondary ambient reflection orb */}
      <div
        className="absolute -bottom-[20%] right-[15%] w-[50vw] h-[50vw] max-w-[650px] max-h-[650px] rounded-full opacity-20 blur-[140px] transition-all duration-1000 transform-gpu"
        style={{
          background: currentTrack
            ? "radial-gradient(circle, rgba(236, 72, 153, 0.3) 0%, rgba(139, 92, 246, 0.15) 50%, transparent 70%)"
            : "radial-gradient(circle, rgba(147, 51, 234, 0.2) 0%, rgba(79, 70, 229, 0.12) 50%, transparent 70%)",
        }}
      />

      {/* Tertiary subtle center glow for visionOS liquid depth */}
      <div className="absolute top-[40%] left-[50%] -translate-x-1/2 -translate-y-1/2 w-[40vw] h-[40vw] max-w-[500px] max-h-[500px] rounded-full opacity-15 blur-[120px] bg-gradient-to-tr from-cyan-500/20 to-indigo-500/20 transform-gpu pointer-events-none" />
    </div>
  );
}
