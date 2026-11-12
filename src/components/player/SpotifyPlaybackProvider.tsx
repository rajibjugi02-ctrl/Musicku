"use client";

import { useEffect, useRef, useCallback } from "react";
import { usePathname } from "next/navigation";
import { useSession } from "next-auth/react";
import { usePlayerStore } from "@/store/usePlayerStore";
import { useLyricsStore } from "@/store/useLyricsStore";
import { useMediaSession } from "@/hooks/useMediaSession";

declare global {
  interface Window {
    Spotify: {
      Player: new (options: SpotifyPlayerInit) => SpotifyPlayer;
    };
    onSpotifyWebPlaybackSDKReady: () => void;
  }
}

interface SpotifyPlayerInit {
  name: string;
  getOAuthToken: (cb: (token: string) => void) => void;
  volume: number;
}

interface SpotifyPlayer {
  connect: () => Promise<boolean>;
  disconnect: () => void;
  addListener: (event: string, cb: (data: unknown) => void) => void;
  removeListener: (event: string, cb?: (data: unknown) => void) => void;
  getCurrentState: () => Promise<SpotifyPlaybackState | null>;
  setVolume: (v: number) => Promise<void>;
  pause: () => Promise<void>;
  resume: () => Promise<void>;
  seek: (ms: number) => Promise<void>;
  nextTrack: () => Promise<void>;
  previousTrack: () => Promise<void>;
  _options: { getOAuthToken: (cb: (t: string) => void) => void };
}

interface SpotifyPlaybackState {
  paused: boolean;
  position: number;
  duration: number;
  track_window: {
    current_track: {
      id: string;
      uri: string;
      name: string;
      duration_ms: number;
      album: { name: string; images: { url: string }[] };
      artists: { name: string }[];
    };
  };
}

export function SpotifyPlaybackProvider({ children }: { children: React.ReactNode }) {
  useMediaSession();
  const { data: session } = useSession();
  const pathname = usePathname();
  const isAuthPage = pathname === "/login" || pathname === "/register";

  const spotifyPlayerRef = useRef<SpotifyPlayer | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const activeFetchControllerRef = useRef<AbortController | null>(null);
  const watchdogTimerRef = useRef<NodeJS.Timeout | null>(null);
  const consecutiveFailuresRef = useRef<number>(0);
  const lastSkipTimeRef = useRef<number>(0);

  const {
    currentTrack,
    queue,
    isShuffle,
    isPlaying,
    volume,
    seekTarget,
    streamCache,
    setPosition,
    setDuration,
    setStream,
    setResolvingStream,
    setBuffering,
    clearSeekTarget,
    prefetchTrackStream,
    next,
  } = usePlayerStore();

  const syncToPosition = useLyricsStore((s) => s.syncToPosition);

  // Initialize Spotify Web Playback SDK if token is available
  const initSpotify = useCallback(() => {
    const token = (session as { spotifyAccessToken?: string })?.spotifyAccessToken;
    if (!token || spotifyPlayerRef.current) return;

    const player = new window.Spotify.Player({
      name: "Musicku Web Player",
      getOAuthToken: (cb) => cb(token),
      volume,
    });

    player.addListener("player_state_changed", (state) => {
      const s = state as SpotifyPlaybackState;
      if (!s) return;
      setPosition(s.position);
      syncToPosition(s.position / 1000);
      if (s.duration) setDuration(s.duration);
    });

    player.connect();
    spotifyPlayerRef.current = player;
  }, [session, volume, setPosition, setDuration, syncToPosition]);

  useEffect(() => {
    const token = (session as { spotifyAccessToken?: string })?.spotifyAccessToken;
    if (!token) return;

    if (document.getElementById("spotify-sdk")) {
      initSpotify();
      return;
    }

    window.onSpotifyWebPlaybackSDKReady = initSpotify;
    const script = document.createElement("script");
    script.id = "spotify-sdk";
    script.src = "https://sdk.scdn.co/spotify-player.js";
    script.async = true;
    document.head.appendChild(script);

    return () => {
      spotifyPlayerRef.current?.disconnect();
    };
  }, [initSpotify, session]);

  // Ensure singleton HTML5 Audio element with Anti-Stall Watchdog
  useEffect(() => {
    if (!audioRef.current) {
      const audio = new Audio();
      audio.preload = "auto";
      audio.setAttribute("playsinline", "true");
      audioRef.current = audio;
    }

    const audio = audioRef.current;

    const onTimeUpdate = () => {
      if (!audio) return;
      const ms = audio.currentTime * 1000;
      setPosition(ms);
      syncToPosition(audio.currentTime);
    };

    const onLoadedMetadata = () => {
      if (!audio) return;
      const dur = audio.duration;
      // Strict Full-Track Guard: If audio duration is < 45 seconds (preview audio), reject and auto-skip
      if (Number.isFinite(dur) && dur > 0 && dur < 45) {
        const now = Date.now();
        if (now - lastSkipTimeRef.current < 2500) return;
        lastSkipTimeRef.current = now;

        console.warn("Detected 30s preview audio (duration < 45s). Skipping to next full-track...");
        audio.pause();
        audio.removeAttribute("src");
        next();
        return;
      }
      if (Number.isFinite(dur) && dur >= 45) {
        setDuration(dur * 1000);
      }
    };

    const clearWatchdog = () => {
      if (watchdogTimerRef.current) {
        clearTimeout(watchdogTimerRef.current);
        watchdogTimerRef.current = null;
      }
    };

    const startWatchdog = () => {
      clearWatchdog();
      // Watchdog: If audio buffer stays stalled > 8s, auto-skip smoothly to next track
      watchdogTimerRef.current = setTimeout(() => {
        console.warn("Audio stream stalled > 8s. Auto-skipping to next track in queue...");
        if (audio) {
          audio.pause();
          audio.removeAttribute("src");
        }
        next();
      }, 8000);
    };

    const onWaiting = () => {
      setBuffering(true);
      startWatchdog();
    };

    const onPlaying = () => {
      setBuffering(false);
      clearWatchdog();
      consecutiveFailuresRef.current = 0;
    };

    const onCanPlay = () => {
      setBuffering(false);
      clearWatchdog();
    };

    const onEnded = () => {
      clearWatchdog();
      next();
    };

    const onError = () => {
      clearWatchdog();
      if (!audio || !audio.getAttribute("src")) return;

      const now = Date.now();
      if (now - lastSkipTimeRef.current < 2500) return;
      lastSkipTimeRef.current = now;

      consecutiveFailuresRef.current += 1;
      if (consecutiveFailuresRef.current >= 3) {
        console.warn("Multiple consecutive tracks failed to stream. Halting auto-skip.");
        audio.pause();
        audio.removeAttribute("src");
        usePlayerStore.setState({ isPlaying: false, isBuffering: false, isResolvingStream: false });
        return;
      }

      console.warn("Audio stream playback failed. Auto-skipping to next track in queue...");
      audio.pause();
      audio.removeAttribute("src");
      next();
    };

    audio.addEventListener("timeupdate", onTimeUpdate);
    audio.addEventListener("loadedmetadata", onLoadedMetadata);
    audio.addEventListener("waiting", onWaiting);
    audio.addEventListener("playing", onPlaying);
    audio.addEventListener("canplay", onCanPlay);
    audio.addEventListener("ended", onEnded);
    audio.addEventListener("error", onError);

    return () => {
      clearWatchdog();
      audio.removeEventListener("timeupdate", onTimeUpdate);
      audio.removeEventListener("loadedmetadata", onLoadedMetadata);
      audio.removeEventListener("waiting", onWaiting);
      audio.removeEventListener("playing", onPlaying);
      audio.removeEventListener("canplay", onCanPlay);
      audio.removeEventListener("ended", onEnded);
      audio.removeEventListener("error", onError);
    };
  }, [next, setBuffering, setDuration, setPosition, setStream, syncToPosition]);

  // Handle stream resolution & instant prefetch
  useEffect(() => {
    // Abort previous fetch request when switching songs quickly
    if (activeFetchControllerRef.current) {
      activeFetchControllerRef.current.abort();
      activeFetchControllerRef.current = null;
    }

    if (isAuthPage || !session?.user) {
      if (audioRef.current && !audioRef.current.paused) {
        audioRef.current.pause();
        audioRef.current.removeAttribute("src");
      }
      return;
    }

    if (!currentTrack) {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.removeAttribute("src");
      }
      return;
    }

    const spotifyToken = (session as { spotifyAccessToken?: string })?.spotifyAccessToken;
    if (spotifyToken && spotifyPlayerRef.current) {
      return;
    }

    const audio = audioRef.current;
    if (!audio) return;

    // Trigger prefetch for the next track in queue
    const currentIdx = queue.findIndex((t) => t.id === currentTrack.id);
    const nextIdx = isShuffle
      ? Math.floor(Math.random() * queue.length)
      : currentIdx + 1;
    if (queue[nextIdx] && queue[nextIdx].id !== currentTrack.id) {
      prefetchTrackStream(queue[nextIdx]);
    }

    // Check client-side stream cache first (instant 0ms playback)
    const cached = streamCache[currentTrack.id];
    if (cached) {
      setStream(cached.streamUrl, false);
      if (audio.src !== cached.streamUrl) {
        audio.src = cached.streamUrl;
        audio.load();
      }
      if (usePlayerStore.getState().isPlaying) {
        audio.play().catch(() => {});
      }
      return;
    }

    const controller = new AbortController();
    activeFetchControllerRef.current = controller;

    setResolvingStream(true);
    setBuffering(true);

    const params = new URLSearchParams({
      title: currentTrack.name,
      artist: currentTrack.artistName,
      duration: String(currentTrack.duration || 0),
    });

    fetch(`/api/stream?${params}`, { signal: controller.signal })
      .then(async (res) => {
        if (!res.ok) throw new Error(`Stream not available (${res.status})`);
        return res.json();
      })
      .then((data) => {
        if (controller.signal.aborted) return;

        const targetUrl = data.streamUrl || data.proxyUrl;
        if (targetUrl) {
          consecutiveFailuresRef.current = 0;
          setStream(targetUrl, false);

          if (audio.src !== targetUrl) {
            audio.src = targetUrl;
            audio.load();
          }

          if (usePlayerStore.getState().isPlaying) {
            audio.play().catch(() => {});
          }
        } else {
          throw new Error("No targetUrl in stream response");
        }
      })
      .catch((err) => {
        if (controller.signal.aborted) return;
        console.warn(`Could not resolve full-track stream for ${currentTrack.name}:`, err.message);
        setResolvingStream(false);
        setBuffering(false);

        consecutiveFailuresRef.current += 1;
        if (consecutiveFailuresRef.current >= 3) {
          console.warn("Multiple consecutive tracks failed. Pausing playback to prevent infinite loop.");
          usePlayerStore.setState({ isPlaying: false });
          return;
        }

        const now = Date.now();
        if (now - lastSkipTimeRef.current < 2500) return;
        lastSkipTimeRef.current = now;

        setTimeout(() => {
          next();
        }, 800);
      });

    return () => {
      controller.abort();
    };
  }, [
    currentTrack,
    session,
    queue,
    isShuffle,
    streamCache,
    setBuffering,
    setResolvingStream,
    setStream,
    prefetchTrackStream,
  ]);

  // Handle play/pause sync
  useEffect(() => {
    const spotifyToken = (session as { spotifyAccessToken?: string })?.spotifyAccessToken;
    if (spotifyToken && spotifyPlayerRef.current) {
      if (isPlaying) spotifyPlayerRef.current.resume();
      else spotifyPlayerRef.current.pause();
      return;
    }

    const audio = audioRef.current;
    if (!audio || !audio.src) return;

    if (isPlaying) {
      audio.play().catch(() => {});
    } else {
      audio.pause();
    }
  }, [isPlaying, session]);

  // Handle volume changes
  useEffect(() => {
    if (spotifyPlayerRef.current) {
      spotifyPlayerRef.current.setVolume(volume);
    }
    if (audioRef.current) {
      audioRef.current.volume = volume;
    }
  }, [volume]);

  // Handle seekTarget triggers (slider scrub or lyric click)
  useEffect(() => {
    if (seekTarget === null) return;

    const targetSec = seekTarget / 1000;

    if (spotifyPlayerRef.current) {
      spotifyPlayerRef.current.seek(seekTarget);
    }

    if (audioRef.current) {
      audioRef.current.currentTime = targetSec;
      if (isPlaying && audioRef.current.paused) {
        audioRef.current.play().catch(() => {});
      }
    }

    clearSeekTarget();
  }, [seekTarget, clearSeekTarget, isPlaying]);

  return <>{children}</>;
}
