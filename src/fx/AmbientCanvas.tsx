import { useEffect, useRef } from "react";

interface Ember {
  x: number;
  y: number;
  r: number;
  vy: number;
  sway: number;
  phase: number;
  hue: number;
  life: number;
  twinkle: number;
}

/**
 * Full-page canvas of rising diya embers and soft bokeh.
 * Embers drift away from the cursor. Pauses when the tab is hidden and
 * is skipped entirely for reduced-motion users.
 */
export function AmbientCanvas() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let w = 0;
    let h = 0;
    let dpr = 1;
    let raf = 0;
    let running = true;
    const mouse = { x: -9999, y: -9999 };
    const embers: Ember[] = [];

    const spawn = (initial = false): Ember => ({
      x: Math.random() * w,
      y: initial ? Math.random() * h : h + 20,
      r: Math.random() < 0.08 ? 2.2 + Math.random() * 2.4 : 0.6 + Math.random() * 1.6,
      vy: 0.18 + Math.random() * 0.55,
      sway: 0.3 + Math.random() * 0.9,
      phase: Math.random() * Math.PI * 2,
      hue: 28 + Math.random() * 22,
      life: 0,
      twinkle: 0.6 + Math.random() * 2.2,
    });

    const resize = () => {
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      w = window.innerWidth;
      h = window.innerHeight;
      canvas.width = w * dpr;
      canvas.height = h * dpr;
      canvas.style.width = `${w}px`;
      canvas.style.height = `${h}px`;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      const target = Math.round(Math.min(140, (w * h) / 14000));
      while (embers.length < target) embers.push(spawn(true));
      embers.length = Math.min(embers.length, target);
    };

    const onMove = (e: PointerEvent) => {
      mouse.x = e.clientX;
      mouse.y = e.clientY;
    };
    const onLeave = () => {
      mouse.x = -9999;
      mouse.y = -9999;
    };
    const onVis = () => {
      running = document.visibilityState === "visible";
      if (running) raf = requestAnimationFrame(tick);
    };

    let t = 0;
    const tick = () => {
      if (!running) return;
      t += 1 / 60;
      ctx.clearRect(0, 0, w, h);
      ctx.globalCompositeOperation = "lighter";

      for (let i = 0; i < embers.length; i++) {
        const e = embers[i];
        e.life += 1;
        e.y -= e.vy;
        e.x += Math.sin(t * e.sway + e.phase) * 0.35;

        const dx = e.x - mouse.x;
        const dy = e.y - mouse.y;
        const d2 = dx * dx + dy * dy;
        if (d2 < 140 * 140) {
          const d = Math.sqrt(d2) || 1;
          const f = (1 - d / 140) * 2.2;
          e.x += (dx / d) * f;
          e.y += (dy / d) * f;
        }

        if (e.y < -30 || e.x < -40 || e.x > w + 40) {
          embers[i] = spawn();
          continue;
        }

        const fadeIn = Math.min(1, e.life / 90);
        const heightFade = Math.min(1, e.y / (h * 0.35));
        const tw = 0.55 + 0.45 * Math.sin(t * e.twinkle + e.phase);
        const alpha = fadeIn * heightFade * tw * (e.r > 2 ? 0.35 : 0.8);

        const glow = e.r * 6;
        const g = ctx.createRadialGradient(e.x, e.y, 0, e.x, e.y, glow);
        g.addColorStop(0, `hsla(${e.hue}, 100%, 70%, ${alpha})`);
        g.addColorStop(0.25, `hsla(${e.hue}, 95%, 55%, ${alpha * 0.45})`);
        g.addColorStop(1, `hsla(${e.hue}, 90%, 50%, 0)`);
        ctx.fillStyle = g;
        ctx.beginPath();
        ctx.arc(e.x, e.y, glow, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.globalCompositeOperation = "source-over";
      raf = requestAnimationFrame(tick);
    };

    resize();
    window.addEventListener("resize", resize);
    window.addEventListener("pointermove", onMove, { passive: true });
    document.addEventListener("pointerleave", onLeave);
    document.addEventListener("visibilitychange", onVis);
    raf = requestAnimationFrame(tick);

    return () => {
      running = false;
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", resize);
      window.removeEventListener("pointermove", onMove);
      document.removeEventListener("pointerleave", onLeave);
      document.removeEventListener("visibilitychange", onVis);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      aria-hidden="true"
      className="pointer-events-none fixed inset-0 z-0"
    />
  );
}
