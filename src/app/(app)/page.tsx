import { Suspense } from "react";
import Link from "next/link";
import PlayHistory from "@/components/home/PlayHistory";
import SmartRecommendations from "@/components/home/SmartRecommendations";
import DiscoverTracks from "@/components/home/DiscoverTracks";
import DiscoverArtists from "@/components/home/DiscoverArtists";
import { Sparkles } from "lucide-react";

export default function HomePage() {
  return (
    <div className="p-4 sm:p-6 md:p-8 flex flex-col gap-8">
      {/* Liquid Glass Hero Pill / Header */}
      <div className="glass-panel rounded-[28px] p-6 relative overflow-hidden flex flex-col md:flex-row md:items-center justify-between gap-4 border border-black/[0.08] dark:border-white/[0.08]">
        <div className="relative z-10">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full glass-pill text-[11px] font-mono tracking-wider text-indigo-600 dark:text-indigo-300 mb-2.5">
            <Sparkles className="w-3.5 h-3.5" />
            <span>VISIONOS LIQUID AUDIO</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-zinc-900 dark:text-white">
            Discover Music
          </h1>
          <p className="text-xs sm:text-sm text-zinc-600 dark:text-zinc-400 mt-1 max-w-md">
            Stream high-fidelity tracks with real-time timestamped lyrics and liquid glass aesthetics.
          </p>
        </div>

        {/* Musicku Replay Highlight Pill */}
        <Link href="/replay" className="relative z-10 flex-shrink-0">
          <div className="group flex items-center gap-3.5 px-4 py-3 rounded-2xl glass-card bg-gradient-to-r from-indigo-500/15 via-purple-500/15 to-pink-500/15 hover:from-indigo-500/25 hover:to-pink-500/25 border border-indigo-500/25 dark:border-indigo-400/30 shadow-md transition-all cursor-pointer">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-indigo-500 to-pink-500 flex items-center justify-center text-white shadow-sm group-hover:scale-108 transition-transform">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-indigo-600 dark:text-indigo-300 block leading-tight">
                Raport Musik Kamu
              </span>
              <p className="text-xs font-bold text-zinc-900 dark:text-white mt-0.5 group-hover:underline">
                Musicku Replay 2026 →
              </p>
            </div>
          </div>
        </Link>
      </div>

      {/* 5 Last Played History (FIFO) */}
      <Suspense fallback={<SectionSkeleton />}>
        <PlayHistory />
      </Suspense>

      {/* Smart Recommendations */}
      <Suspense fallback={<SectionSkeleton />}>
        <SmartRecommendations />
      </Suspense>

      {/* Discover Tracks */}
      <Suspense fallback={<SectionSkeleton />}>
        <DiscoverTracks />
      </Suspense>

      {/* Discover Artists */}
      <Suspense fallback={<SectionSkeleton />}>
        <DiscoverArtists />
      </Suspense>
    </div>
  );
}

function SectionSkeleton() {
  return (
    <div className="animate-pulse">
      <div className="h-4 w-36 bg-black/10 dark:bg-white/10 rounded-full mb-3" />
      <div className="flex gap-4 overflow-hidden">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="w-36 sm:w-40 flex-shrink-0">
            <div className="w-full aspect-square rounded-[14px] bg-black/[0.06] dark:bg-white/[0.04]" />
            <div className="h-4 w-28 bg-black/[0.08] dark:bg-white/[0.06] rounded mt-2" />
            <div className="h-3 w-16 bg-black/[0.04] dark:bg-white/[0.03] rounded mt-1" />
          </div>
        ))}
      </div>
    </div>
  );
}
