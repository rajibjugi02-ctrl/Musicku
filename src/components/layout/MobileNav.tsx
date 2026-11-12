"use client";

import { useRef, useState, useEffect } from "react";
import { motion, useMotionValue, useSpring } from "framer-motion";
import { usePathname, useRouter } from "next/navigation";
import { Home, Search, Library, Heart, User } from "lucide-react";
import { useProfileStore } from "@/store/useProfileStore";
import { cn } from "@/lib/utils";

const TABS = [
  { href: "/", label: "Home", icon: Home },
  { href: "/search", label: "Search", icon: Search },
  { href: "/library", label: "Library", icon: Library },
  { href: "/liked-artists", label: "Liked", icon: Heart },
  { href: "/profile", label: "Profile", icon: User },
] as const;

// 64px width per tab (5 * 64px = 320px track)
const TAB_WIDTH = 64;
const TOTAL_TRACK_WIDTH = TABS.length * TAB_WIDTH; // 320px

export default function MobileNav() {
  const pathname = usePathname();
  const router = useRouter();
  const { avatarUrl } = useProfileStore();

  const activeIdx = Math.max(0, TABS.findIndex((t) => t.href === pathname));
  const isRealAvatar =
    avatarUrl &&
    !avatarUrl.includes("324c50c04a5a944117cd3daa0963fc63") &&
    !avatarUrl.includes("photo-1534528741775");

  // Physics-based spring position for the Liquid Lens Pill
  const dragX = useMotionValue(activeIdx * TAB_WIDTH);
  const springX = useSpring(dragX, { stiffness: 450, damping: 32, mass: 0.6 });

  const [isPressing, setIsPressing] = useState(false);
  const [scrubbedIdx, setScrubbedIdx] = useState<number | null>(null);
  const isDraggingRef = useRef(false);
  const trackRef = useRef<HTMLDivElement>(null);
  const lastHapticIdx = useRef(activeIdx);

  // Sync indicator position whenever route changes externally
  useEffect(() => {
    if (!isDraggingRef.current) {
      dragX.set(activeIdx * TAB_WIDTH);
      setScrubbedIdx(null);
    }
  }, [activeIdx, dragX]);

  const activeOrScrubbedIndex = scrubbedIdx !== null ? scrubbedIdx : activeIdx;

  const updatePositionFromPointer = (clientX: number) => {
    if (!trackRef.current) return;
    const rect = trackRef.current.getBoundingClientRect();
    const relativeX = clientX - rect.left - TAB_WIDTH / 2;
    const maxOffset = TOTAL_TRACK_WIDTH - TAB_WIDTH;
    const clamped = Math.max(0, Math.min(relativeX, maxOffset));
    dragX.set(clamped);

    // Track active index under finger reactively
    const currentIdx = Math.max(0, Math.min(Math.round(clamped / TAB_WIDTH), TABS.length - 1));
    setScrubbedIdx(currentIdx);

    // Subtle Taptic Engine haptic vibration when scrubbing past tab boundaries
    if (currentIdx !== lastHapticIdx.current) {
      lastHapticIdx.current = currentIdx;
      if (typeof window !== "undefined" && "vibrate" in navigator) {
        try {
          navigator.vibrate(8);
        } catch { }
      }
    }
  };

  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    isDraggingRef.current = true;
    setIsPressing(true);
    try {
      e.currentTarget.setPointerCapture(e.pointerId);
    } catch { }
    updatePositionFromPointer(e.clientX);
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!isDraggingRef.current) return;
    updatePositionFromPointer(e.clientX);
  };

  const handlePointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!isDraggingRef.current) return;
    isDraggingRef.current = false;
    setIsPressing(false);
    try {
      e.currentTarget.releasePointerCapture(e.pointerId);
    } catch { }

    // Snap to nearest tab index
    const currentX = dragX.get();
    const finalIdx = Math.max(0, Math.min(Math.round(currentX / TAB_WIDTH), TABS.length - 1));
    dragX.set(finalIdx * TAB_WIDTH);
    setScrubbedIdx(null);

    // Navigate only on pointer release
    const targetTab = TABS[finalIdx];
    if (targetTab && pathname !== targetTab.href) {
      router.push(targetTab.href);
    }
  };

  return (
    <>
      {/* ─────────────────────────────────────────────────────────────
          1. BOTTOM ADAPTIVE AMBIENT VIGNETTE SHIELD
          Vignette frost matching theme background
         ───────────────────────────────────────────────────────────── */}
      <div
        aria-hidden="true"
        className="pointer-events-none fixed bottom-0 inset-x-0 h-44 bg-gradient-to-t from-[#F2F4F8]/95 via-[#F2F4F8]/60 to-transparent dark:from-[#070709]/95 dark:via-[#070709]/60 dark:to-transparent z-30 md:hidden transition-colors duration-300"
      />

      {/* ─────────────────────────────────────────────────────────────
          2. FLOATING iOS 26 LIQUID GLASS SCRUBBING TAB BAR (h-[62px])
         ───────────────────────────────────────────────────────────── */}
      <div className="md:hidden fixed bottom-4 inset-x-0 flex justify-center z-50 pointer-events-none select-none">
        <div
          ref={trackRef}
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          onPointerCancel={handlePointerUp}
          style={{
            WebkitBackdropFilter: "blur(28px) saturate(190%)",
            backdropFilter: "blur(28px) saturate(190%)",
            width: TOTAL_TRACK_WIDTH + 12, // 332px
            transform: "translateZ(0)",
          }}
          className="pointer-events-auto touch-none relative h-[62px] flex items-center p-1.5 rounded-full bg-white/85 dark:bg-zinc-950/75 border border-black/10 dark:border-white/[0.16] shadow-[0_16px_40px_rgba(0,0,0,0.14)] dark:shadow-[0_20px_50px_rgba(0,0,0,0.65)] cursor-pointer select-none"
        >
          {/* Inner 320px Track Container */}
          <div className="relative w-[320px] h-[50px] mx-auto overflow-hidden rounded-full">
            {/* ───────────────────────────────────────────────────────────
                LAYER 1: CONVEX LIQUID LENS PILL (z-10, Empty Liquid Glass)
               ─────────────────────────────────────────────────────────── */}
            <motion.div
              style={{
                x: springX,
                width: TAB_WIDTH,
                transform: "translateZ(0)",
                willChange: "transform",
              }}
              animate={{
                scaleX: isPressing ? 1.08 : 1,
                scaleY: isPressing ? 1.1 : 1,
              }}
              transition={{
                scaleX: { type: "spring", stiffness: 500, damping: 25 },
                scaleY: { type: "spring", stiffness: 500, damping: 25 },
              }}
              className={cn(
                "absolute top-0 bottom-0 rounded-full z-10 pointer-events-none transition-shadow duration-200",
                "bg-white/85 dark:bg-white/[0.22] border border-white/60 dark:border-white/35",
                isPressing
                  ? "shadow-[0_4px_24px_rgba(10,132,255,0.35),inset_0_1.5px_2px_rgba(255,255,255,0.9)] dark:shadow-[0_4px_28px_rgba(10,132,255,0.5),inset_0_1.5px_2px_rgba(255,255,255,0.7)]"
                  : "shadow-[0_2px_14px_rgba(10,132,255,0.18),inset_0_1px_1.5px_rgba(255,255,255,0.7)] dark:shadow-[0_3px_18px_rgba(10,132,255,0.3),inset_0_1px_1.5px_rgba(255,255,255,0.5)]"
              )}
            />

            {/* ───────────────────────────────────────────────────────────
                LAYER 2: SINGLE-LAYER NAVIGATION BUTTONS (z-20)
                Rendered HANYA SATU KALI — 100% bebas ghosting / teks double
               ─────────────────────────────────────────────────────────── */}
            <div className="absolute inset-0 flex items-center z-20 pointer-events-none">
              {TABS.map(({ href, label, icon: Icon }, idx) => {
                const isActive = idx === activeOrScrubbedIndex;
                const isProfile = href === "/profile";
                return (
                  <div
                    key={href}
                    style={{ width: TAB_WIDTH }}
                    className={cn(
                      "flex flex-col items-center justify-center gap-0.5 select-none transition-colors duration-150 antialiased",
                      isActive
                        ? "text-[#0A84FF]"
                        : "text-zinc-500 dark:text-zinc-400"
                    )}
                  >
                    {isProfile && isRealAvatar ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={avatarUrl}
                        alt="Profile"
                        className={cn(
                          "w-4 h-4 rounded-full object-cover transition-transform duration-150",
                          isActive
                            ? "ring-2 ring-[#0A84FF] scale-105 opacity-100"
                            : "opacity-75 grayscale-[20%]"
                        )}
                      />
                    ) : (
                      <Icon
                        className={cn(
                          "w-4 h-4 transition-transform duration-150",
                          isActive ? "stroke-[2.2] scale-105" : "stroke-[1.8]"
                        )}
                      />
                    )}
                    <span
                      className={cn(
                        "text-[10px] tracking-tight leading-none transition-all duration-150",
                        isActive ? "font-bold text-[#0A84FF]" : "font-medium"
                      )}
                    >
                      {label}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
