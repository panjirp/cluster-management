"use client";

import { useEffect, useRef } from "react";

type Particle = {
  x: number;
  y: number;
  r: number;
  vx: number;
  vy: number;
  baseAlpha: number;
  twinkleSpeed: number;
  twinklePhase: number;
};

type Orb = {
  x: number;
  y: number;
  r: number;
  vx: number;
  vy: number;
  alpha: number;
};

/**
 * Background animasi ala Grass.io: partikel bercahaya yang melayang
 * (drifting + berkelip) dan beberapa orbs gradien yang bergerak pelan,
 * sehingga memberi kesan "video bergerak" di belakang konten aplikasi.
 *
 * Warna aksen diambil dari CSS var --canvas-accent (per tema), format "r g b".
 */
/** Warna aksen lime brand Grass ("r g b"), dipakai sebagai fallback & override. */
export const GRASS_ACCENT_LIME = "171 246 0";

function parseAccent(raw: string): [number, number, number] {
  const parts = raw.split(/\s+/).map(Number);
  if (parts.length === 3 && parts.every((n) => !Number.isNaN(n))) {
    return [parts[0], parts[1], parts[2]];
  }
  return parseAccent(GRASS_ACCENT_LIME); // fallback lime
}

function readAccent(): [number, number, number] {
  return parseAccent(
    getComputedStyle(document.documentElement).getPropertyValue("--canvas-accent").trim()
  );
}

/**
 * @param accentOverride - Warna aksen tetap "r g b" (opsional). Jika diberikan,
 * dipakai langsung dan tidak mengikuti --canvas-accent / perubahan tema.
 * Berguna untuk halaman yang selalu bergaya dark (mis. login).
 */
export function GrassBackground({ accentOverride }: { accentOverride?: string }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  // accentOverride adalah nilai tetap saat mount — dibaca lewat ref agar
  // useEffect ([]) tetap bersih tanpa melanggar react-hooks/exhaustive-deps.
  const accentOverrideRef = useRef(accentOverride);

  useEffect(() => {
    const canvasEl = canvasRef.current;
    if (!canvasEl) return;
    const canvasCtx = canvasEl.getContext("2d");
    if (!canvasCtx) return;

    // Alias bertipe eksplisit agar aman dipakai di dalam closure (function
    // declaration bersifat hoisted sehingga narrowing tidak berlaku di sana).
    const el: HTMLCanvasElement = canvasEl;
    const ctx: CanvasRenderingContext2D = canvasCtx;

    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);

    let particles: Particle[] = [];
    let orbs: Orb[] = [];
    let raf = 0;
    let w = 0;
    let h = 0;

    function seed() {
      const count = Math.min(110, Math.floor((w * h) / 16000));
      particles = Array.from({ length: count }, () => ({
        x: Math.random() * w,
        y: Math.random() * h,
        r: 0.8 + Math.random() * 1.7,
        vx: (Math.random() - 0.5) * 0.16,
        vy: -(0.05 + Math.random() * 0.22),
        baseAlpha: 0.12 + Math.random() * 0.28,
        twinkleSpeed: 0.4 + Math.random() * 1.4,
        twinklePhase: Math.random() * Math.PI * 2,
      }));
      orbs = [
        { x: w * 0.82, y: h * 0.08, r: Math.max(w, h) * 0.45, vx: 8, vy: 4, alpha: 0.05 },
        { x: w * 0.06, y: h * 0.92, r: Math.max(w, h) * 0.4, vx: -6, vy: -5, alpha: 0.04 },
        { x: w * 0.5, y: h * 0.55, r: Math.max(w, h) * 0.34, vx: 5, vy: 7, alpha: 0.03 },
      ];
    }

    function resize() {
      w = window.innerWidth;
      h = window.innerHeight;
      el.width = Math.floor(w * dpr);
      el.height = Math.floor(h * dpr);
      el.style.width = `${w}px`;
      el.style.height = `${h}px`;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      seed();
    }

    const fixedAccent = accentOverrideRef.current;
    let accent = fixedAccent ? parseAccent(fixedAccent) : readAccent();

    // Ikuti perubahan tema (class dark/light di <html>) agar warna partikel
    // selalu cocok dengan --canvas-accent yang aktif (kecuali accentOverride).
    const themeObserver = fixedAccent
      ? null
      : new MutationObserver(() => {
          accent = readAccent();
        });
    if (themeObserver) {
      themeObserver.observe(document.documentElement, { attributes: true, attributeFilter: ["class"] });
    }

    function draw(t: number) {
      ctx.clearRect(0, 0, w, h);

      // Orbs gradien yang bergerak pelan (kesan cahaya bergulir seperti video)
      for (const orb of orbs) {
        orb.x += orb.vx * 0.016;
        orb.y += orb.vy * 0.016;
        if (orb.x < -orb.r) orb.x = w + orb.r;
        if (orb.x > w + orb.r) orb.x = -orb.r;
        if (orb.y < -orb.r) orb.y = h + orb.r;
        if (orb.y > h + orb.r) orb.y = -orb.r;
        const g = ctx.createRadialGradient(orb.x, orb.y, 0, orb.x, orb.y, orb.r);
        g.addColorStop(0, `rgba(${accent.join(",")},${orb.alpha})`);
        g.addColorStop(1, "rgba(0,0,0,0)");
        ctx.fillStyle = g;
        ctx.fillRect(orb.x - orb.r, orb.y - orb.r, orb.r * 2, orb.r * 2);
      }

      // Partikel kecil melayang ke atas sambil berkelip
      for (const p of particles) {
        p.x += p.vx;
        p.y += p.vy;
        if (p.y < -10) {
          p.y = h + 10;
          p.x = Math.random() * w;
        }
        if (p.x < -10) p.x = w + 10;
        if (p.x > w + 10) p.x = -10;
        const alpha = p.baseAlpha * (0.55 + 0.45 * Math.sin(p.twinkleSpeed * t * 0.001 + p.twinklePhase));
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(${accent.join(",")},${Math.max(0, alpha)})`;
        ctx.fill();
      }
    }

    function loop(t: number) {
      draw(t);
      raf = requestAnimationFrame(loop);
    }

    resize();
    window.addEventListener("resize", resize);
    if (reduced) {
      draw(0); // satu frame statis, hormati prefers-reduced-motion
    } else {
      raf = requestAnimationFrame(loop);
    }

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", resize);
      themeObserver?.disconnect();
    };
  }, []);

  return <canvas ref={canvasRef} aria-hidden className="pointer-events-none fixed inset-0 -z-10" />;
}
