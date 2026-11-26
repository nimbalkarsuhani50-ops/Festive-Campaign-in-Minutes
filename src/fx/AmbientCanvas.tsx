import { useEffect, useRef } from "react";
import { getFestivalMotif, type ParticleLayer } from "../data/festivalMotifs";

/**
 * Full-page festive atmosphere, unique to each festival: every festival lists
 * its own particle layers (shape + motion + colours) in festivalMotifs.ts.
 * Colour tokens follow the live festival theme. Particles drift away from the
 * cursor; paused when the tab is hidden; off for reduced-motion users.
 */

interface P {
  layer: number;
  x: number;
  y: number;
  vx: number;
  vy: number;
  r: number;
  rot: number;
  vr: number;
  phase: number;
  color: string;
  life: number;
  max: number;
  text?: string;
}

const rand = (a: number, b: number) => a + Math.random() * (b - a);

function resolveColors(tokens: string[]): string[] {
  const cs = getComputedStyle(document.documentElement);
  return tokens.map((t) => (t.startsWith("#") ? t : cs.getPropertyValue(`--${t}`).trim() || "#F28C38"));
}

export function AmbientCanvas({ festival }: { festival?: string }) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const motif = getFestivalMotif(festival);
  const key = festival || "Diwali";

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const layers: ParticleLayer[] = motif.layers;
    let palettes = layers.map((l) => resolveColors(l.colors));
    let w = 0;
    let h = 0;
    let raf = 0;
    let running = true;
    const mouse = { x: -9999, y: -9999 };
    const parts: P[] = [];
    const sparks: P[] = [];
    let nextBurst = 1.2;

    const spawn = (li: number, initial: boolean): P => {
      const L = layers[li];
      const pal = palettes[li];
      const r = rand(L.size[0], L.size[1]);
      const sp = rand(L.speed[0], L.speed[1]);
      const p: P = {
        layer: li,
        x: rand(0, w),
        y: rand(0, h),
        vx: 0,
        vy: 0,
        r,
        rot: rand(0, Math.PI * 2),
        vr: rand(-0.03, 0.03),
        phase: rand(0, 7),
        color: pal[Math.floor(Math.random() * pal.length)],
        life: 0,
        max: Infinity,
        text: L.text ? L.text[Math.floor(Math.random() * L.text.length)] : undefined,
      };
      switch (L.motion) {
        case "rise":
          p.y = initial ? rand(0, h) : h + r * 2 + 20;
          p.vy = -sp;
          p.vx = rand(-0.15, 0.15);
          break;
        case "fall":
          p.y = initial ? rand(0, h) : -r * 2 - 20;
          p.vy = sp;
          p.vx = rand(-0.25, 0.25);
          break;
        case "wind":
          p.x = initial ? rand(0, w) : -r * 3 - 20;
          p.y = rand(0, h);
          p.vx = sp;
          p.vy = rand(-0.15, 0.25);
          p.vr = 0;
          break;
        case "fly":
          p.x = initial ? rand(0, w) : Math.random() < 0.5 ? -40 : w + 40;
          p.y = rand(h * 0.05, h * 0.6);
          p.vx = (p.x > w / 2 && !initial ? -1 : 1) * sp;
          p.vy = rand(-0.1, 0.1);
          break;
        case "ripple":
          p.x = rand(0, w);
          p.y = rand(h * 0.6, h * 0.98);
          p.r = 0;
          p.max = L.size[1];
          p.vy = 0;
          p.vx = sp;
          break;
        case "twinkle":
          p.vy = -sp;
          break;
        case "float":
        default:
          p.vx = rand(-sp, sp);
          p.vy = rand(-sp, sp);
      }
      return p;
    };

    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      w = window.innerWidth;
      h = window.innerHeight;
      canvas.width = w * dpr;
      canvas.height = h * dpr;
      canvas.style.width = `${w}px`;
      canvas.style.height = `${h}px`;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      const scale = Math.min(1.2, Math.max(0.45, (w * h) / (1440 * 900)));
      parts.length = 0;
      layers.forEach((L, li) => {
        const n = Math.max(1, Math.round(L.count * scale));
        for (let i = 0; i < n; i++) parts.push(spawn(li, true));
      });
    };

    const glow = (x: number, y: number, r: number, color: string, a: number) => {
      ctx.globalAlpha = a;
      const g = ctx.createRadialGradient(x, y, 0, x, y, r * 6);
      g.addColorStop(0, color);
      g.addColorStop(0.3, color);
      g.addColorStop(1, "transparent");
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.arc(x, y, r * 6, 0, Math.PI * 2);
      ctx.fill();
    };

    const draw = (p: P, t: number) => {
      const L = layers[p.layer];
      const a = L.alpha ?? 1;
      const tw = 0.55 + 0.45 * Math.sin(t * 2.2 + p.phase);
      ctx.save();
      ctx.fillStyle = p.color;
      ctx.strokeStyle = p.color;
      switch (L.shape) {
        case "ember": {
          const fade = L.motion === "rise" ? Math.min(1, p.y / (h * 0.3)) : 1;
          glow(p.x, p.y, p.r, p.color, Math.min(1, p.life / 60) * fade * tw * (p.r > 2 ? 0.35 : 0.8) * a);
          break;
        }
        case "dust":
          glow(p.x, p.y, p.r, p.color, 0.5 * tw * a);
          break;
        case "cloud": {
          ctx.globalAlpha = a;
          const g = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.r);
          g.addColorStop(0, p.color);
          g.addColorStop(1, "transparent");
          ctx.fillStyle = g;
          ctx.beginPath();
          ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
          ctx.fill();
          break;
        }
        case "smoke": {
          const g = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.r);
          ctx.globalAlpha = a * (0.6 + 0.4 * Math.sin(t * 0.5 + p.phase));
          g.addColorStop(0, p.color);
          g.addColorStop(1, "transparent");
          ctx.fillStyle = g;
          ctx.beginPath();
          ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
          ctx.fill();
          break;
        }
        case "petal":
          ctx.translate(p.x, p.y);
          ctx.rotate(p.rot);
          ctx.globalAlpha = 0.62 * a;
          ctx.beginPath();
          ctx.ellipse(0, 0, p.r * 0.55, p.r, 0, 0, Math.PI * 2);
          ctx.fill();
          break;
        case "flower":
          ctx.translate(p.x, p.y);
          ctx.rotate(p.rot);
          ctx.globalAlpha = 0.7 * a;
          for (let i = 0; i < 5; i++) {
            ctx.rotate((Math.PI * 2) / 5);
            ctx.beginPath();
            ctx.ellipse(0, -p.r * 0.6, p.r * 0.35, p.r * 0.6, 0, 0, Math.PI * 2);
            ctx.fill();
          }
          ctx.fillStyle = "#F7A21B";
          ctx.beginPath();
          ctx.arc(0, 0, p.r * 0.28, 0, Math.PI * 2);
          ctx.fill();
          break;
        case "snow":
          ctx.globalAlpha = (p.r > 3 ? 0.35 : 0.8) * a;
          ctx.beginPath();
          ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
          ctx.fill();
          break;
        case "sparkle": {
          ctx.globalAlpha = tw * a;
          ctx.translate(p.x, p.y);
          const s = p.r * 2.2;
          ctx.beginPath();
          ctx.moveTo(0, -s);
          ctx.quadraticCurveTo(0, 0, s, 0);
          ctx.quadraticCurveTo(0, 0, 0, s);
          ctx.quadraticCurveTo(0, 0, -s, 0);
          ctx.quadraticCurveTo(0, 0, 0, -s);
          ctx.fill();
          break;
        }
        case "kite":
          ctx.translate(p.x, p.y);
          ctx.rotate(Math.sin(t * 0.8 + p.phase) * 0.25);
          ctx.globalAlpha = 0.6 * a;
          ctx.beginPath();
          ctx.moveTo(0, -p.r);
          ctx.lineTo(p.r * 0.75, 0);
          ctx.lineTo(0, p.r * 1.2);
          ctx.lineTo(-p.r * 0.75, 0);
          ctx.closePath();
          ctx.fill();
          ctx.strokeStyle = "rgba(255,255,255,0.4)";
          ctx.lineWidth = 1;
          ctx.beginPath();
          ctx.moveTo(0, p.r * 1.2);
          for (let i = 1; i <= 7; i++) ctx.lineTo(Math.sin(t * 2 + i + p.phase) * 5, p.r * 1.2 + i * 7);
          ctx.stroke();
          break;
        case "lantern":
          glow(p.x, p.y, p.r * 0.7, p.color, (0.3 * tw + 0.15) * a);
          ctx.globalAlpha = 0.8 * a;
          ctx.fillStyle = p.color;
          ctx.beginPath();
          ctx.ellipse(p.x, p.y, p.r * 0.7, p.r, 0, 0, Math.PI * 2);
          ctx.fill();
          ctx.fillStyle = "rgba(255,240,200,0.75)";
          ctx.beginPath();
          ctx.ellipse(p.x, p.y, p.r * 0.3, p.r * 0.55, 0, 0, Math.PI * 2);
          ctx.fill();
          break;
        case "heart": {
          ctx.translate(p.x, p.y);
          ctx.rotate(Math.sin(t + p.phase) * 0.3);
          ctx.globalAlpha = 0.5 * a;
          const s = p.r;
          ctx.beginPath();
          ctx.moveTo(0, s * 0.9);
          ctx.bezierCurveTo(-s * 1.6, -s * 0.2, -s * 0.6, -s * 1.3, 0, -s * 0.4);
          ctx.bezierCurveTo(s * 0.6, -s * 1.3, s * 1.6, -s * 0.2, 0, s * 0.9);
          ctx.fill();
          break;
        }
        case "leaf":
          ctx.translate(p.x, p.y);
          ctx.rotate(p.rot);
          ctx.globalAlpha = 0.6 * a;
          ctx.beginPath();
          ctx.moveTo(0, -p.r);
          ctx.quadraticCurveTo(p.r * 0.8, 0, 0, p.r);
          ctx.quadraticCurveTo(-p.r * 0.8, 0, 0, -p.r);
          ctx.fill();
          ctx.strokeStyle = "rgba(255,255,255,0.25)";
          ctx.lineWidth = 0.8;
          ctx.beginPath();
          ctx.moveTo(0, -p.r);
          ctx.lineTo(0, p.r);
          ctx.stroke();
          break;
        case "confetti":
          ctx.translate(p.x, p.y);
          ctx.rotate(p.rot);
          ctx.scale(1, Math.abs(Math.sin(t * 3 + p.phase)) * 0.8 + 0.2);
          ctx.globalAlpha = 0.75 * a;
          ctx.fillRect(-p.r, -p.r * 0.45, p.r * 2, p.r * 0.9);
          break;
        case "bubble":
          ctx.globalAlpha = 0.5 * a;
          ctx.lineWidth = 1.2;
          ctx.beginPath();
          ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
          ctx.stroke();
          ctx.globalAlpha = 0.35 * a;
          ctx.beginPath();
          ctx.arc(p.x - p.r * 0.35, p.y - p.r * 0.35, p.r * 0.22, 0, Math.PI * 2);
          ctx.fill();
          break;
        case "feather": {
          ctx.translate(p.x, p.y);
          ctx.rotate(Math.sin(t * 0.7 + p.phase) * 0.5 + 0.4);
          ctx.globalAlpha = 0.6 * a;
          ctx.fillStyle = "#1FA88F";
          ctx.beginPath();
          ctx.ellipse(0, 0, p.r * 0.35, p.r, 0, 0, Math.PI * 2);
          ctx.fill();
          ctx.fillStyle = "#D4AF37";
          ctx.beginPath();
          ctx.ellipse(0, -p.r * 0.45, p.r * 0.24, p.r * 0.3, 0, 0, Math.PI * 2);
          ctx.fill();
          ctx.fillStyle = "#2F6BFF";
          ctx.beginPath();
          ctx.ellipse(0, -p.r * 0.45, p.r * 0.13, p.r * 0.17, 0, 0, Math.PI * 2);
          ctx.fill();
          ctx.strokeStyle = "rgba(255,255,255,0.35)";
          ctx.lineWidth = 0.8;
          ctx.beginPath();
          ctx.moveTo(0, -p.r);
          ctx.lineTo(0, p.r * 1.4);
          ctx.stroke();
          break;
        }
        case "bat": {
          ctx.translate(p.x, p.y);
          if (p.vx < 0) ctx.scale(-1, 1);
          const flap = Math.sin(t * 12 + p.phase);
          ctx.globalAlpha = a;
          ctx.beginPath();
          ctx.moveTo(0, 0);
          ctx.quadraticCurveTo(-p.r * 0.6, -p.r * (0.2 + flap * 0.5), -p.r * 1.4, -p.r * flap * 0.3);
          ctx.quadraticCurveTo(-p.r * 0.8, p.r * 0.3, 0, p.r * 0.25);
          ctx.quadraticCurveTo(p.r * 0.8, p.r * 0.3, p.r * 1.4, -p.r * flap * 0.3);
          ctx.quadraticCurveTo(p.r * 0.6, -p.r * (0.2 + flap * 0.5), 0, 0);
          ctx.fill();
          break;
        }
        case "text":
          ctx.globalAlpha = 0.35 * a;
          ctx.font = `800 ${p.r}px "Plus Jakarta Sans", sans-serif`;
          ctx.textAlign = "center";
          ctx.fillText(p.text ?? "%", p.x, p.y);
          break;
        case "grain":
          ctx.translate(p.x, p.y);
          ctx.rotate(Math.atan2(p.vy, p.vx) + Math.sin(t + p.phase) * 0.3);
          ctx.globalAlpha = 0.65 * a;
          ctx.beginPath();
          ctx.ellipse(0, 0, p.r, p.r * 0.38, 0, 0, Math.PI * 2);
          ctx.fill();
          break;
        case "egg":
          ctx.translate(p.x, p.y);
          ctx.rotate(Math.sin(t + p.phase) * 0.4);
          ctx.globalAlpha = 0.65 * a;
          ctx.beginPath();
          ctx.ellipse(0, 0, p.r * 0.72, p.r, 0, 0, Math.PI * 2);
          ctx.fill();
          ctx.strokeStyle = "rgba(255,255,255,0.7)";
          ctx.lineWidth = 1.2;
          ctx.beginPath();
          ctx.moveTo(-p.r * 0.7, 0);
          for (let i = 0; i <= 6; i++) ctx.lineTo(-p.r * 0.7 + (i * p.r * 1.4) / 6, i % 2 ? -p.r * 0.15 : p.r * 0.15);
          ctx.stroke();
          break;
        case "ripple": {
          const k = p.r / p.max;
          ctx.globalAlpha = (1 - k) * 0.45 * a;
          ctx.lineWidth = 1.4;
          ctx.beginPath();
          ctx.ellipse(p.x, p.y, p.r, p.r * 0.28, 0, 0, Math.PI * 2);
          ctx.stroke();
          break;
        }
      }
      ctx.restore();
    };

    let t = 0;
    let last = performance.now();
    const tick = (now: number) => {
      if (!running) return;
      const dt = Math.min(0.05, (now - last) / 1000);
      last = now;
      t += dt;
      if (Math.floor(t) !== Math.floor(t - dt)) palettes = layers.map((l) => resolveColors(l.colors));
      ctx.clearRect(0, 0, w, h);

      for (let i = 0; i < parts.length; i++) {
        const p = parts[i];
        const L = layers[p.layer];
        p.life += 1;
        ctx.globalCompositeOperation = L.shape === "ember" || L.shape === "dust" || L.shape === "lantern" || L.shape === "cloud" ? "lighter" : "source-over";
        if (L.motion === "ripple") {
          p.r += p.vx;
          if (p.r > p.max) parts[i] = spawn(p.layer, false);
          draw(p, t);
          continue;
        }
        const sway = L.motion === "fly" ? Math.sin(t * 1.5 + p.phase) * 0.6 : L.motion === "twinkle" ? 0 : Math.sin(t * 0.9 + p.phase) * 0.35;
        p.x += p.vx + (L.motion === "fall" || L.motion === "rise" ? sway : 0);
        p.y += p.vy + (L.motion === "fly" ? sway : 0);
        p.rot += p.vr;
        if (L.shape !== "cloud" && L.shape !== "smoke" && L.shape !== "bat") {
          const dx = p.x - mouse.x;
          const dy = p.y - mouse.y;
          const d2 = dx * dx + dy * dy;
          if (d2 < 140 * 140) {
            const d = Math.sqrt(d2) || 1;
            const f = (1 - d / 140) * 2.2;
            p.x += (dx / d) * f;
            p.y += (dy / d) * f;
          }
        }
        const m = Math.max(80, p.r * 2);
        const out = p.y < -m || p.y > h + m || p.x < -m || p.x > w + m;
        if (out) {
          if (L.motion === "float" || L.motion === "twinkle") {
            p.x = rand(0, w);
            p.y = L.motion === "twinkle" ? h + 10 : rand(0, h);
          } else {
            parts[i] = spawn(p.layer, false);
            continue;
          }
        }
        draw(p, t);
      }

      if (motif.fireworks) {
        ctx.globalCompositeOperation = "lighter";
        nextBurst -= dt;
        if (nextBurst <= 0) {
          nextBurst = rand(motif.fireworks * 0.7, motif.fireworks * 1.3);
          const cx = rand(w * 0.1, w * 0.9);
          const cy = rand(h * 0.08, h * 0.45);
          const pal = palettes[0];
          const c = pal[Math.floor(Math.random() * pal.length)];
          for (let k = 0; k < 46; k++) {
            const ang = (Math.PI * 2 * k) / 46;
            const s = rand(1.4, 3.2);
            sparks.push({ layer: 0, x: cx, y: cy, vx: Math.cos(ang) * s, vy: Math.sin(ang) * s, r: rand(0.8, 1.8), rot: 0, vr: 0, phase: 0, color: c, life: 0, max: rand(55, 85) });
          }
        }
        for (let i = sparks.length - 1; i >= 0; i--) {
          const s = sparks[i];
          s.life += 1;
          s.x += s.vx;
          s.y += s.vy;
          s.vx *= 0.975;
          s.vy = s.vy * 0.975 + 0.03;
          if (s.life > s.max) {
            sparks.splice(i, 1);
            continue;
          }
          glow(s.x, s.y, s.r, s.color, (1 - s.life / s.max) * 0.8);
        }
      }
      ctx.globalAlpha = 1;
      ctx.globalCompositeOperation = "source-over";
      raf = requestAnimationFrame(tick);
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
      if (running) {
        last = performance.now();
        raf = requestAnimationFrame(tick);
      }
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);

  return <canvas ref={canvasRef} aria-hidden="true" className="pointer-events-none fixed inset-0 z-0" />;
}
