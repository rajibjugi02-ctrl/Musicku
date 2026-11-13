"use client";

import { useMemo } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence, Reorder } from "framer-motion";
import { X, GripVertical, Music2, Shuffle } from "lucide-react";
import { usePlayerStore } from "@/store/usePlayerStore";
import { useUIStore } from "@/store/useUIStore";

export default function QueuePanel() {
  const router = useRouter();
  const { queue, currentTrack, removeFromQueue, play, prefetchTrackStream, shuffleQueue } = usePlayerStore();

  const currentIdx = useMemo(
    () => queue.findIndex((t) => t.id === currentTrack?.id),
    [queue, currentTrack]
  );
  const upNext = queue.slice(currentIdx + 1);

  return (
    <div className="flex flex-col h-full overflow-y-auto">
      {/* Now playing */}
      {currentTrack && (
        <div className="p-4 border-b border-black/[0.08] dark:border-white/10">
          <p className="text-[10px] uppercase font-bold tracking-widest text-zinc-500 dark:text-zinc-400 mb-2">
            Now Playing
          </p>
          <div className="flex items-center gap-3">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={currentTrack.albumArt} alt="" className="w-10 h-10 rounded-xl object-cover shadow-sm border border-black/10 dark:border-white/15" />
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold text-zinc-950 dark:text-zinc-100 truncate">{currentTrack.name}</p>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  usePlayerStore.getState().setDesktopDetailOpen(false);
                  useUIStore.getState().closeMobilePlayer();
                  router.push(`/artist/${encodeURIComponent(currentTrack.artistName)}`);
                }}
                className="text-xs text-zinc-600 dark:text-zinc-400 hover:text-zinc-950 dark:hover:text-white truncate block text-left hover:underline cursor-pointer"
              >
                {currentTrack.artistName}
              </button>
            </div>
            {/* Animated bars indicator */}
            <div className="flex items-end gap-0.5 h-4 flex-shrink-0">
              {[0, 1, 2].map((i) => (
                <motion.div
                  key={i}
                  className="w-0.5 bg-indigo-600 dark:bg-white/80 rounded-full"
                  animate={{ height: ["30%", "100%", "50%", "80%", "30%"] }}
                  transition={{ duration: 1.2, repeat: Infinity, delay: i * 0.2 }}
                />
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Up next */}
      <div className="p-4 flex-1">
        <div className="flex items-center justify-between mb-3">
          <p className="text-[10px] uppercase font-bold tracking-widest text-zinc-500 dark:text-zinc-400">
            Up Next ({upNext.length})
          </p>
          {upNext.length > 1 && (
            <button
              onClick={() => shuffleQueue()}
              title="Shuffle Up Next Queue"
              className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-semibold text-zinc-700 dark:text-zinc-300 hover:text-zinc-950 dark:hover:text-white bg-black/5 dark:bg-white/5 hover:bg-black/10 dark:hover:bg-white/10 border border-black/10 dark:border-white/10 transition-all cursor-pointer active:scale-95 shadow-sm"
            >
              <Shuffle className="w-3 h-3 text-indigo-600 dark:text-indigo-400" />
              <span>Shuffle</span>
            </button>
          )}
        </div>

        {upNext.length === 0 ? (
          <div className="flex flex-col items-center gap-2 mt-8 text-center py-6">
            <Music2 className="w-8 h-8 text-zinc-400 dark:text-zinc-600" />
            <p className="text-xs text-zinc-500 dark:text-zinc-400">Antrean lagu berikutnya kosong</p>
          </div>
        ) : (
          <Reorder.Group
            axis="y"
            values={upNext}
            onReorder={(newOrder) => {
              const before = queue.slice(0, currentIdx + 1);
              const after = queue.slice(currentIdx + 1 + newOrder.length);
              const reordered = [...before, ...newOrder, ...after];
              usePlayerStore.setState({ queue: reordered });
            }}
            className="flex flex-col gap-1.5"
          >
            <AnimatePresence>
              {upNext.map((track, i) => (
                <Reorder.Item
                  key={track.id}
                  value={track}
                  onMouseEnter={() => prefetchTrackStream(track)}
                  className="flex items-center gap-2.5 p-2 rounded-xl hover:bg-black/5 dark:hover:bg-white/5 border border-transparent hover:border-black/5 dark:hover:border-white/10 group cursor-pointer transition-colors"
                  onClick={() => play(track, queue)}
                >
                  <GripVertical className="w-3.5 h-3.5 text-zinc-400 dark:text-zinc-600 group-hover:text-zinc-600 dark:group-hover:text-zinc-400 flex-shrink-0 cursor-grab active:cursor-grabbing" />
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={track.albumArt} alt="" className="w-9 h-9 rounded-lg object-cover flex-shrink-0 shadow-sm border border-black/10 dark:border-white/10" />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-semibold text-zinc-900 dark:text-zinc-200 truncate">{track.name}</p>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        usePlayerStore.getState().setDesktopDetailOpen(false);
                        useUIStore.getState().closeMobilePlayer();
                        router.push(`/artist/${encodeURIComponent(track.artistName)}`);
                      }}
                      className="text-[11px] text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white truncate block text-left hover:underline cursor-pointer"
                    >
                      {track.artistName}
                    </button>
                  </div>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      removeFromQueue(currentIdx + 1 + i);
                    }}
                    className="opacity-0 group-hover:opacity-100 p-1 rounded text-zinc-400 hover:text-rose-500 dark:text-zinc-500 dark:hover:text-rose-400 transition-opacity flex-shrink-0 cursor-pointer"
                    title="Hapus dari antrean"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </Reorder.Item>
              ))}
            </AnimatePresence>
          </Reorder.Group>
        )}
      </div>
    </div>
  );
}
