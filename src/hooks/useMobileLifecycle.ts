"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { usePathname, useRouter } from "next/navigation";
import { Capacitor, PluginListenerHandle } from "@capacitor/core";
import { App } from "@capacitor/app";
import { useUIStore } from "@/store/useUIStore";
import { usePlayerStore } from "@/store/usePlayerStore";

/**
 * Mobile Lifecycle Hook for Android Capacitor WebView
 * - Tiered Android hardware back button handler (Modal -> Router Back -> Double tap to exit)
 * - Graceful App.exitApp() with listener cleanup to prevent Android freeze/stuck
 * - GPU resource throttling (pauses heavy animations while audio keeps streaming via MediaSession)
 */
export function useMobileLifecycle() {
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const toastTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const lastBackPressRef = useRef<number>(0);

  const pathname = usePathname();
  const router = useRouter();

  const showToast = useCallback((msg: string, durationMs = 2000) => {
    if (toastTimeoutRef.current) {
      clearTimeout(toastTimeoutRef.current);
    }
    setToastMessage(msg);
    toastTimeoutRef.current = setTimeout(() => {
      setToastMessage(null);
    }, durationMs);
  }, []);

  // 1. Android Hardware Back Button Handling
  useEffect(() => {
    let backListenerHandle: PluginListenerHandle | null = null;

    const setupBackListener = async () => {
      try {
        backListenerHandle = await App.addListener("backButton", ({ canGoBack }) => {
          const uiState = useUIStore.getState();
          const playerState = usePlayerStore.getState();

          // Tier 1: Dismiss active overlays, modal sheets, or open sidebars first
          if (uiState.isMobilePlayerOpen) {
            uiState.closeMobilePlayer();
            return;
          }

          if (playerState.isDesktopDetailOpen) {
            playerState.setDesktopDetailOpen(false);
            return;
          }

          if (uiState.isRightSidebarOpen && window.innerWidth < 1024) {
            uiState.setRightSidebarOpen(false);
            return;
          }

          // Tier 2: Navigate back in history if not on root home
          if (pathname && pathname !== "/") {
            router.back();
            return;
          }

          // Tier 3: On Root Home ("/") - Double back press to exit gracefully
          const now = Date.now();
          if (now - lastBackPressRef.current < 2000) {
            // Second press within 2s: clean up timers and exit cleanly
            if (toastTimeoutRef.current) {
              clearTimeout(toastTimeoutRef.current);
            }
            setToastMessage(null);

            // Cleanly exit Android application
            if (Capacitor.isNativePlatform()) {
              App.exitApp();
            }
          } else {
            lastBackPressRef.current = now;
            showToast("Tekan sekali lagi untuk keluar");
          }
        });
      } catch (err) {
        console.warn("[MobileLifecycle] Hardware backButton registration:", err);
      }
    };

    setupBackListener();

    return () => {
      if (backListenerHandle) {
        backListenerHandle.remove();
      }
      if (toastTimeoutRef.current) {
        clearTimeout(toastTimeoutRef.current);
      }
    };
  }, [pathname, router, showToast]);

  // 2. Background / Visibility State Management
  // When app goes into background, pause heavy GPU/Framer animations while audio continues
  useEffect(() => {
    let appStateHandle: PluginListenerHandle | null = null;

    const handleAppState = (isActive: boolean) => {
      if (typeof document === "undefined") return;

      if (!isActive) {
        // App went to background: mark attribute for GPU throttled CSS
        document.documentElement.setAttribute("data-app-background", "true");
      } else {
        // App resumed to foreground
        document.documentElement.removeAttribute("data-app-background");
      }
    };

    // Native Capacitor App State listener
    const registerAppState = async () => {
      try {
        appStateHandle = await App.addListener("appStateChange", (state) => {
          handleAppState(state.isActive);
        });
      } catch {
        // Fallback to standard web visibilitychange
      }
    };

    registerAppState();

    // Web visibilitychange listener (works seamlessly across PWA & WebView)
    const handleVisibilityChange = () => {
      handleAppState(!document.hidden);
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      if (appStateHandle) {
        appStateHandle.remove();
      }
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      if (typeof document !== "undefined") {
        document.documentElement.removeAttribute("data-app-background");
      }
    };
  }, []);

  return { toastMessage };
}
