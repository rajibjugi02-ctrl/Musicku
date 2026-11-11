"use client";

import { useMemo } from "react";
import { motion, AnimatePresence, Reorder } from "framer-motion";
import { X, GripVertical, Music2, Shuffle } from "lucide-react";
import { usePlayerStore } from "@/store/usePlayerStore";

export default function QueuePanel() {
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
        <div className="p-4 border-b border-white/8">
          <p className="text-[10px] uppercase tracking-widest text-zinc-500 mb-2">Now Playing</p>
          <div className="flex items-center gap-3">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={currentTrack.albumArt} alt="" className="w-10 h-10 rounded-md object-cover" />
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium text-zinc-100 truncate">{currentTrack.name}</p>
              <p className="text-xs text-zinc-500 truncate">{currentTrack.artistName}</p>
            </div>
            {/* Animated bars indicator */}
            <div className="flex items-end gap-0.5 h-4 flex-shrink-0">
              {[0, 1, 2].map((i) => (
                <motion.div
                  key={i}
                  className="w-0.5 bg-white/60 rounded-full"
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
          <p className="text-[10px] uppercase tracking-widest text-zinc-500">
            Up Next ({upNext.length})
          </p>
          {upNext.length > 1 && (
            <button
              onClick={() => shuffleQueue()}
              title="Shuffle Up Next Queue"
              className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-medium text-zinc-400 hover:text-white bg-white/5 hover:bg-white/10 border border-white/10 hover:border-white/20 transition-all cursor-pointer active:scale-95 shadow-sm"
            >
              <Shuffle className="w-3 h-3 text-indigo-400" />
              <span>Shuffle</span>
            </button>
          )}
        </div>

        {upNext.length === 0 ? (
          <div className="flex flex-col items-center gap-2 mt-8 text-center">
            <Music2 className="w-8 h-8 text-zinc-700" />
            <p className="text-xs text-zinc-600">Queue is empty</p>
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
            className="flex flex-col gap-1"
          >
            <AnimatePresence>
              {upNext.map((track, i) => (
                <Reorder.Item
                  key={track.id}
                  value={track}
                  onMouseEnter={() => prefetchTrackStream(track)}
                  className="flex items-center gap-2 p-2 rounded-lg hover:bg-white/5 group cursor-pointer"
                  onClick={() => play(track, queue)}
                >
                  <GripVertical className="w-3.5 h-3.5 text-zinc-700 group-hover:text-zinc-500 flex-shrink-0 cursor-grab active:cursor-grabbing" />
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={track.albumArt} alt="" className="w-8 h-8 rounded object-cover flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium text-zinc-200 truncate">{track.name}</p>
                    <p className="text-[10px] text-zinc-600 truncate">{track.artistName}</p>
                  </div>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      removeFromQueue(currentIdx + 1 + i);
                    }}
                    className="opacity-0 group-hover:opacity-100 text-zinc-600 hover:text-zinc-300 transition-opacity flex-shrink-0"
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
