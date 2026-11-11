import { create } from "zustand";
import { persist } from "zustand/middleware";

type View = "home" | "search" | "library" | "liked-artists";
type RightPanel = "queue" | "lyrics" | "enhancements";
type Theme = "dark" | "light";

interface UIState {
  view: View;
  rightPanel: RightPanel;
  theme: Theme;
  isLeftSidebarOpen: boolean;
  isRightSidebarOpen: boolean;
  isMobilePlayerOpen: boolean;
  accentColor: string;

  setView: (v: View) => void;
  setRightPanel: (p: RightPanel) => void;
  toggleTheme: () => void;
  setTheme: (t: Theme) => void;
  toggleLeftSidebar: () => void;
  toggleRightSidebar: () => void;
  openMobilePlayer: () => void;
  closeMobilePlayer: () => void;
  toggleMobilePlayer: () => void;
  setAccentColor: (color: string) => void;
}

export const useUIStore = create<UIState>()(
  persist(
    (set) => ({
      view: "home",
      rightPanel: "queue",
      theme: "dark",
      isLeftSidebarOpen: true,
      isRightSidebarOpen: true,
      isMobilePlayerOpen: false,
      accentColor: "#a3a3a3",

      setView: (v) => set({ view: v }),
      setRightPanel: (p) => set({ rightPanel: p }),
      toggleTheme: () =>
        set((s) => ({ theme: s.theme === "dark" ? "light" : "dark" })),
      setTheme: (t) => set({ theme: t }),
      toggleLeftSidebar: () =>
        set((s) => ({ isLeftSidebarOpen: !s.isLeftSidebarOpen })),
      toggleRightSidebar: () =>
        set((s) => ({ isRightSidebarOpen: !s.isRightSidebarOpen })),
      openMobilePlayer: () => set({ isMobilePlayerOpen: true }),
      closeMobilePlayer: () => set({ isMobilePlayerOpen: false }),
      toggleMobilePlayer: () =>
        set((s) => ({ isMobilePlayerOpen: !s.isMobilePlayerOpen })),
      setAccentColor: (color) => set({ accentColor: color }),
    }),
    { name: "musicku-ui", partialize: (s) => ({ theme: s.theme }) }
  )
);

