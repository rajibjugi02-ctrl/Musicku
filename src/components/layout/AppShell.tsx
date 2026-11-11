"use client";

import { usePathname } from "next/navigation";
import { useUIStore } from "@/store/useUIStore";
import LeftSidebar from "./LeftSidebar";
import RightSidebar from "./RightSidebar";
import PlayerFooter from "@/components/player/PlayerFooter";
import MobileNav from "./MobileNav";
import AmbientBackground from "./AmbientBackground";

export default function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isSettingsPage = pathname.startsWith("/settings");
  const isLeftOpen = useUIStore((s) => s.isLeftSidebarOpen);
  const isRightOpen = useUIStore((s) => s.isRightSidebarOpen);

  return (
    <div className="h-screen w-screen p-2.5 sm:p-3.5 gap-2.5 sm:gap-3.5 flex flex-col overflow-hidden relative text-zinc-900 dark:text-zinc-100 select-none">
      {/* Liquid Glass Specular Ambient Light Layer */}
      <AmbientBackground />

      {/* Main 3-Island Bento Grid */}
      <div className="flex flex-1 min-h-0 gap-2.5 sm:gap-3.5">
        {/* Left Sidebar Island */}
        <aside
          className={`
            hidden md:flex flex-col flex-shrink-0 glass-panel rounded-[28px] overflow-hidden transition-all duration-300
            ${isLeftOpen ? "md:w-60" : "md:w-0 md:opacity-0 md:pointer-events-none"}
          `}
        >
          <LeftSidebar />
        </aside>

        {/* Central Viewport Island */}
        <main className="flex-1 min-w-0 glass-panel rounded-[28px] overflow-y-auto scrollbar-thin scrollbar-thumb-white/10 scrollbar-track-transparent relative flex flex-col">
          <div className="flex-1 pb-44 md:pb-8">{children}</div>
        </main>

        {/* Right Sidebar Island (Queue & Lyrics) - Conditional: hidden on /settings */}
        {!isSettingsPage && (
          <aside
            className={`
              hidden lg:flex flex-col flex-shrink-0 glass-panel rounded-[28px] overflow-hidden transition-all duration-300
              ${isRightOpen ? "lg:w-72 xl:w-80" : "lg:w-0 lg:opacity-0 lg:pointer-events-none"}
            `}
          >
            <RightSidebar />
          </aside>
        )}
      </div>

      {/* Unified Audio Player (Desktop Docked Bar + Mobile Mini Player Capsule & Slide-Up Sheet) */}
      {!isSettingsPage && <PlayerFooter />}

      {/* Floating Glass Mobile Bottom Navbar */}
      <MobileNav />
    </div>
  );
}
