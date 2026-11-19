"use client";

import { useState, useEffect } from "react";
import { Disc } from "lucide-react";
import { getOptimizedImageUrl, cn } from "@/lib/utils";

interface SmartCoverProps {
  src?: string | null;
  alt: string;
  className?: string;
  size?: number; // Target pixel dimension (e.g. 250, 300)
  priority?: boolean;
}

/**
 * Lightweight, 60fps image component optimized for mobile Android WebView.
 * - Downscales heavy CDN image URLs to 250-300px
 * - decoding="async" and loading="lazy" for zero-lag thread execution
 * - Clean fade-in on load and graceful SVG fallback on network errors
 */
export default function SmartCover({
  src,
  alt,
  className,
  size = 300,
  priority = false,
}: SmartCoverProps) {
  const [hasError, setHasError] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);

  // Reset error state if image source updates
  useEffect(() => {
    setHasError(false);
    setIsLoaded(false);
  }, [src]);

  const optimizedSrc = getOptimizedImageUrl(src, size);

  if (!src || hasError || !optimizedSrc) {
    return (
      <div
        className={cn(
          "w-full h-full flex items-center justify-center bg-zinc-900/60 text-zinc-500 border border-white/5",
          className
        )}
      >
        <Disc className="w-1/3 h-1/3 text-zinc-600 animate-[spin_10s_linear_infinite]" />
      </div>
    );
  }

  return (
    <div className={cn("relative w-full h-full overflow-hidden bg-black/10", className)}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={optimizedSrc}
        alt={alt}
        loading={priority ? "eager" : "lazy"}
        decoding="async"
        onLoad={() => setIsLoaded(true)}
        onError={() => setHasError(true)}
        className={cn(
          "w-full h-full object-cover transition-opacity duration-300",
          isLoaded ? "opacity-100" : "opacity-0"
        )}
      />
    </div>
  );
}
