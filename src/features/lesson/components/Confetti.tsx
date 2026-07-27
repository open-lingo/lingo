/**
 * Hand-rolled canvas confetti burst — no dependency, theme-token colors.
 *
 * Renders a fixed, pointer-transparent canvas and runs a single ~2s burst
 * on mount, then goes inert (the canvas stays mounted but empty). Colors
 * are sampled from the active theme's CSS variables so confetti matches
 * Light/Dark/AMOLED automatically.
 *
 * Honors reduced motion twice over: the OS-level
 * `prefers-reduced-motion: reduce` media query AND the in-app setting
 * (`root.dataset.reducedMotion`, set by SettingsContext). Either one
 * renders nothing.
 */

import { useEffect, useRef } from "react";

const PARTICLE_COUNT = 70;
const DURATION_MS = 2000;
const GRAVITY = 0.12;

function reducedMotion(): boolean {
  if (typeof window === "undefined") return true;
  if (document.documentElement.dataset.reducedMotion === "true") return true;
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

function themeColors(): string[] {
  const style = getComputedStyle(document.documentElement);
  const fromVars = ["--color-accent", "--color-warning", "--color-accent-hover"]
    .map((v) => style.getPropertyValue(v).trim())
    .filter(Boolean)
    // Tokens are stored as RGB channel triples ("156 44 44"); wrap for canvas.
    .map((triple) => `rgb(${triple})`);
  // Fallbacks keep the burst visible if a theme is missing a token.
  return fromVars.length > 0 ? fromVars : ["#22c55e", "#f59e0b", "#16a34a"];
}

type Particle = {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  color: string;
  rotation: number;
  vr: number;
};

export function Confetti() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || reducedMotion()) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    const w = window.innerWidth;
    const h = window.innerHeight;
    canvas.width = w * dpr;
    canvas.height = h * dpr;
    ctx.scale(dpr, dpr);

    const colors = themeColors();
    const particles: Particle[] = Array.from(
      { length: PARTICLE_COUNT },
      () => ({
        // Burst from the upper-center third, fanning outward.
        x: w / 2 + (Math.random() - 0.5) * w * 0.3,
        y: h * 0.3,
        vx: (Math.random() - 0.5) * 9,
        vy: -(Math.random() * 7 + 3),
        size: Math.random() * 6 + 4,
        color: colors[Math.floor(Math.random() * colors.length)],
        rotation: Math.random() * Math.PI * 2,
        vr: (Math.random() - 0.5) * 0.3,
      }),
    );

    const start = performance.now();
    let raf = 0;

    const tick = (now: number) => {
      const elapsed = now - start;
      ctx.clearRect(0, 0, w, h);
      if (elapsed > DURATION_MS) return;
      const fade = 1 - elapsed / DURATION_MS;
      for (const p of particles) {
        p.vy += GRAVITY;
        p.x += p.vx;
        p.y += p.vy;
        p.rotation += p.vr;
        ctx.save();
        ctx.globalAlpha = Math.max(0, fade);
        ctx.translate(p.x, p.y);
        ctx.rotate(p.rotation);
        ctx.fillStyle = p.color;
        ctx.fillRect(-p.size / 2, -p.size / 4, p.size, p.size / 2);
        ctx.restore();
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, []);

  return (
    <canvas
      ref={canvasRef}
      aria-hidden
      className="pointer-events-none fixed inset-0 z-50"
    />
  );
}
