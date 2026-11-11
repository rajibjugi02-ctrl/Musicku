"use client";

import { useEffect, useRef } from "react";
import { usePlayerStore } from "@/store/usePlayerStore";

export default function WaveformVisualizer() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const frameRef = useRef<number>(0);
  const isPlaying = usePlayerStore((s) => s.isPlaying);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const BAR_COUNT = 32;
    const heights = Array.from({ length: BAR_COUNT }, () => Math.random() * 0.4 + 0.1);
    const targets = Array.from({ length: BAR_COUNT }, () => Math.random());

    const draw = () => {
      const { width, height } = canvas;
      ctx.clearRect(0, 0, width, height);

      const barW = width / BAR_COUNT - 1.5;

      heights.forEach((h, i) => {
        // Smoothly interpolate toward target
        if (isPlaying) {
          heights[i] += (targets[i] - h) * 0.12;
          if (Math.abs(targets[i] - heights[i]) < 0.01) {
            targets[i] = Math.random() * 0.9 + 0.05;
          }
        } else {
          // Decay to flat when paused
          heights[i] = Math.max(0.05, h * 0.95);
        }

        const barH = heights[i] * height;
        const x = i * (barW + 1.5);
        const y = (height - barH) / 2;

        ctx.fillStyle = "rgba(255,255,255,0.25)";
        ctx.beginPath();
        ctx.roundRect(x, y, barW, barH, 2);
        ctx.fill();
      });

      frameRef.current = requestAnimationFrame(draw);
    };

    frameRef.current = requestAnimationFrame(draw);
    return () => cancelAnimationFrame(frameRef.current);
  }, [isPlaying]);

  return (
    <canvas
      ref={canvasRef}
      width={240}
      height={48}
      className="w-full h-12 rounded-lg"
    />
  );
}

