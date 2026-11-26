import { ArrayBufferTarget, Muxer } from "mp4-muxer";
import { getFestivalMotif } from "../data/festivalMotifs";
import { getFestivalTheme } from "../data/festivalThemes";
import { makePosterSVG } from "../posters.js";
import {
  DISPLAY_STACK,
  GLOBAL_SANS_STACK,
  festivalGreeting,
  loadImage,
  monogram,
  pill,
  readableOn,
  rr,
  wrap,
} from "./posterExport";

/**
 * Cinematic 9:16 brand reel, rendered in the browser:
 *  - AI voiceover + AI soundtrack, mixed (music ducks under the voice) and
 *    encoded to AAC; video encoded to H.264 with WebCodecs, muxed to MP4.
 *  - Three scenes from the posters' vertical artwork with camera moves, beat
 *    pulses (BPM from the music brief), zoom-through transitions, light leaks,
 *    festival particles, film grain, word-by-word captions and an animated end card.
 */
export interface ReelParams {
  brand: string;
  festival: string;
  city: string;
  hook: string;
  line: string;
  cta: string;
  images: (string | undefined)[];
  headline3: string;
  badge: string;
  palette?: { primary: string; secondary: string; light: string };
  voiceUrl?: string;
  musicUrl?: string;
  voiceText?: string;
  bpm?: number;
}

export interface ReelResult {
  blob: Blob;
  url: string;
  mime: string;
  ext: "mp4" | "webm";
  hasAudio: boolean;
  duration: number;
}

const W = 1080;
const H = 1920;
const FPS = 30;
const SR = 48000;
const VOICE_START = 0.7;

const clamp01 = (t: number) => Math.max(0, Math.min(1, t));
const ease = (t: number) => 1 - Math.pow(1 - clamp01(t), 3);
const easeBack = (t: number) => {
  const x = clamp01(t);
  const c = 1.9;
  return 1 + (c + 1) * Math.pow(x - 1, 3) + c * Math.pow(x - 1, 2);
};
const hex = (h: string | undefined, d: string) => (h && /^#[0-9a-f]{6}$/i.test(h) ? h : d);
const rgba = (h: string, a: number) => {
  const n = parseInt(h.replace("#", ""), 16);
  return `rgba(${(n >> 16) & 255},${(n >> 8) & 255},${n & 255},${a})`;
};

// ---------------- assets ----------------

async function loadScenes(p: ReelParams): Promise<HTMLImageElement[]> {
  const out: HTMLImageElement[] = [];
  for (let i = 0; i < 3; i++) {
    const src = p.images[i];
    let img: HTMLImageElement | null = null;
    if (src) img = await loadImage(src).catch(() => null);
    if (!img) {
      const url = URL.createObjectURL(new Blob([makePosterSVG(p.festival, 31 + i * 7, "Festive Gold", "instagram_story")], { type: "image/svg+xml;charset=utf-8" }));
      img = await loadImage(url).finally(() => URL.revokeObjectURL(url));
    }
    out.push(img);
  }
  return out;
}

async function fetchAudio(url: string | undefined, ctx: BaseAudioContext): Promise<AudioBuffer | null> {
  if (!url) return null;
  try {
    const buf = await (await fetch(url)).arrayBuffer();
    return await ctx.decodeAudioData(buf);
  } catch {
    return null;
  }
}

/** Mix voice over music (ducked) into one stereo buffer of `duration` seconds. */
async function mixAudio(voice: AudioBuffer | null, music: AudioBuffer | null, duration: number): Promise<AudioBuffer | null> {
  if (!voice && !music) return null;
  const off = new OfflineAudioContext(2, Math.ceil(duration * SR), SR);
  // Master bus: brick-wall-ish limiter so voice + music never clip.
  const limiter = off.createDynamicsCompressor();
  limiter.threshold.value = -6;
  limiter.knee.value = 0;
  limiter.ratio.value = 20;
  limiter.attack.value = 0.002;
  limiter.release.value = 0.2;
  const master = off.createGain();
  master.gain.value = 0.85;
  limiter.connect(master).connect(off.destination);
  if (music) {
    const src = off.createBufferSource();
    src.buffer = music;
    const g = off.createGain();
    const full = 0.6;
    const duck = 0.18;
    g.gain.setValueAtTime(0, 0);
    g.gain.linearRampToValueAtTime(full, 0.5);
    if (voice) {
      g.gain.setValueAtTime(full, VOICE_START - 0.3);
      g.gain.linearRampToValueAtTime(duck, VOICE_START);
      const vEnd = VOICE_START + voice.duration;
      g.gain.setValueAtTime(duck, vEnd);
      g.gain.linearRampToValueAtTime(full, vEnd + 0.5);
    }
    g.gain.setValueAtTime(full, Math.max(0.6, duration - 1.4));
    g.gain.linearRampToValueAtTime(0, duration);
    src.connect(g).connect(limiter);
    src.start(0);
  }
  if (voice) {
    const v = off.createBufferSource();
    v.buffer = voice;
    const comp = off.createDynamicsCompressor();
    comp.threshold.value = -18;
    comp.ratio.value = 3;
    const vg = off.createGain();
    vg.gain.value = 1.0;
    v.connect(comp).connect(vg).connect(limiter);
    v.start(VOICE_START);
  }
  const out = await off.startRendering();
  // Final safety: normalise to -1 dBFS peak.
  let peak = 0;
  for (let c = 0; c < out.numberOfChannels; c++) {
    const d = out.getChannelData(c);
    for (let i = 0; i < d.length; i++) peak = Math.max(peak, Math.abs(d[i]));
  }
  if (peak > 0.89) {
    const k = 0.89 / peak;
    for (let c = 0; c < out.numberOfChannels; c++) {
      const d = out.getChannelData(c);
      for (let i = 0; i < d.length; i++) d[i] *= k;
    }
  }
  return out;
}

// ---------------- captions ----------------

interface Cap {
  words: string[];
  start: number;
  end: number;
  wordTimes: number[];
}

/** Splits the voiceover into short caption chunks, timed by character share. */
function buildCaptions(text: string | undefined, voiceDur: number): Cap[] {
  const words = (text || "").replace(/\s+/g, " ").trim().split(" ").filter(Boolean);
  if (!words.length || voiceDur <= 0) return [];
  const weights = words.map((w) => Math.max(2, Array.from(w).length) + (/[.,!?।]$/.test(w) ? 3 : 0));
  const total = weights.reduce((a, b) => a + b, 0);
  const speak = voiceDur * 0.94;
  const times: number[] = [];
  let acc = 0;
  for (const w of weights) {
    times.push(VOICE_START + (acc / total) * speak);
    acc += w;
  }
  const caps: Cap[] = [];
  let i = 0;
  while (i < words.length) {
    let j = i;
    let chars = 0;
    while (j < words.length && j - i < 5 && chars < 26) {
      chars += Array.from(words[j]).length + 1;
      j++;
      if (/[.,!?।]$/.test(words[j - 1])) break;
    }
    caps.push({
      words: words.slice(i, j),
      wordTimes: times.slice(i, j),
      start: times[i],
      end: j < words.length ? times[j] : VOICE_START + voiceDur,
    });
    i = j;
  }
  return caps;
}

// ---------------- particles ----------------

interface Pt {
  x: number;
  y: number;
  v: number;
  r: number;
  ph: number;
  c: string;
}

function makeParticles(festival: string, colors: string[]): { pts: Pt[]; mode: "rise" | "fall" | "twinkle" } {
  const shape = getFestivalMotif(festival).layers[0]?.shape ?? "ember";
  const mode = ["petal", "flower", "leaf", "snow", "confetti", "egg", "feather", "text"].includes(shape)
    ? "fall"
    : ["sparkle"].includes(shape)
      ? "twinkle"
      : "rise";
  const pts: Pt[] = Array.from({ length: 70 }, () => ({
    x: Math.random() * W,
    y: Math.random() * H,
    v: 60 + Math.random() * 140,
    r: shape === "snow" ? 2 + Math.random() * 5 : 2 + Math.random() * 6,
    ph: Math.random() * 7,
    c: shape === "snow" ? "#FFFFFF" : colors[Math.floor(Math.random() * colors.length)],
  }));
  return { pts, mode };
}

// ---------------- frame drawing ----------------

interface Ctx2 {
  ctx: CanvasRenderingContext2D;
  scenes: HTMLImageElement[];
  p: ReelParams;
  D: number;
  caps: Cap[];
  grain: HTMLCanvasElement;
  parts: ReturnType<typeof makeParticles>;
  ac: string;
  ac2: string;
  light: string;
  onAc: string;
}

function cover(ctx: CanvasRenderingContext2D, img: HTMLImageElement, zoom: number, px: number, py: number, rot = 0) {
  const sc = Math.max(W / img.width, H / img.height) * zoom;
  const dw = img.width * sc;
  const dh = img.height * sc;
  ctx.save();
  ctx.translate(W / 2, H / 2);
  ctx.rotate(rot);
  ctx.drawImage(img, -dw / 2 + px * (dw - W) * 0.5, -dh / 2 + py * (dh - H) * 0.5, dw, dh);
  ctx.restore();
}

function titleLines(c: Ctx2, text: string, t: number, y: number, size: number, mode: "slam" | "highlight") {
  const { ctx, light } = c;
  ctx.font = `800 ${size}px ${DISPLAY_STACK}`;
  let px = size;
  let lines = wrap(ctx, text, W - 140, 3);
  while (px > 56 && (lines.some((l) => ctx.measureText(l).width > W - 140) || lines[lines.length - 1]?.endsWith("…"))) {
    px -= 4;
    ctx.font = `800 ${px}px ${DISPLAY_STACK}`;
    lines = wrap(ctx, text, W - 140, 3);
  }
  ctx.textAlign = "center";
  ctx.textBaseline = "alphabetic";
  lines.forEach((l, i) => {
    const k = t - i * 0.12;
    if (k <= 0) return;
    const e = mode === "slam" ? easeBack(k / 0.45) : ease(k / 0.4);
    const ly = y + i * px * 1.16;
    ctx.save();
    ctx.globalAlpha = clamp01(k / 0.2);
    ctx.translate(W / 2, ly);
    if (mode === "slam") ctx.scale(1.6 - 0.6 * e, 1.6 - 0.6 * e);
    else ctx.translate(0, (1 - e) * 50);
    if (mode === "highlight") {
      const tw = ctx.measureText(l).width;
      rr(ctx, -tw / 2 - 26, -px * 0.9, (tw + 52) * e, px * 1.16, 18);
      ctx.fillStyle = light;
      ctx.fill();
      ctx.fillStyle = "#16100A";
      ctx.fillText(l, 0, 0);
    } else {
      ctx.lineJoin = "round";
      ctx.lineWidth = px * 0.13;
      ctx.strokeStyle = "rgba(5,6,12,0.9)";
      ctx.strokeText(l, 0, 0);
      ctx.fillStyle = "#FFFFFF";
      ctx.fillText(l, 0, 0);
    }
    ctx.restore();
  });
}

function drawCaptions(c: Ctx2, t: number) {
  const { ctx, caps, light } = c;
  const cap = caps.find((k) => t >= k.start - 0.05 && t < k.end + 0.05);
  if (!cap) return;
  ctx.font = `800 58px ${GLOBAL_SANS_STACK}`;
  const space = ctx.measureText(" ").width;
  const widths = cap.words.map((w) => ctx.measureText(w).width);
  const lines: number[][] = [[]];
  let lw = 0;
  widths.forEach((wd, i) => {
    if (lw + wd > W - 160 && lines[lines.length - 1].length) {
      lines.push([]);
      lw = 0;
    }
    lines[lines.length - 1].push(i);
    lw += wd + space;
  });
  const baseY = H - 520 - (lines.length - 1) * 74;
  const pop = ease((t - cap.start) / 0.15);
  // Right-to-left scripts (Urdu, Arabic, Hebrew) flow from the right edge.
  const rtl = /[\u0590-\u08FF\uFB1D-\uFEFC]/.test(cap.words.join(" "));
  lines.forEach((ln, li) => {
    const total = ln.reduce((a, i) => a + widths[i], 0) + space * (ln.length - 1);
    let x = W / 2 - total / 2;
    let xr = W / 2 + total / 2;
    const y = baseY + li * 78;
    ln.forEach((i) => {
      if (rtl) {
        x = xr - widths[i];
        xr -= widths[i] + space;
      }
      const active = t >= cap.wordTimes[i] && (i === cap.words.length - 1 || t < cap.wordTimes[i + 1]);
      const said = t >= cap.wordTimes[i];
      ctx.save();
      ctx.globalAlpha = pop;
      ctx.textAlign = "left";
      ctx.direction = rtl ? "rtl" : "ltr";
      if (rtl) ctx.textAlign = "right";
      if (active) {
        rr(ctx, x - 10, y - 54, widths[i] + 20, 70, 12);
        ctx.fillStyle = light;
        ctx.fill();
        ctx.fillStyle = "#16100A";
      } else {
        ctx.lineJoin = "round";
        ctx.lineWidth = 10;
        ctx.strokeStyle = "rgba(0,0,0,0.85)";
        ctx.strokeText(cap.words[i], rtl ? x + widths[i] : x, y);
        ctx.fillStyle = said ? "#FFFFFF" : "rgba(255,255,255,0.72)";
      }
      ctx.fillText(cap.words[i], rtl ? x + widths[i] : x, y);
      ctx.restore();
      if (!rtl) x += widths[i] + space;
    });
  });
}

function drawParticles(c: Ctx2, t: number) {
  const { ctx, parts } = c;
  ctx.save();
  ctx.globalCompositeOperation = parts.mode === "fall" ? "source-over" : "lighter";
  for (const p of parts.pts) {
    const travel = (p.v * t) % (H + 100);
    const y = parts.mode === "rise" ? (p.y - travel + H + 100) % (H + 100) - 50 : parts.mode === "fall" ? (p.y + travel) % (H + 100) - 50 : p.y;
    const x = p.x + Math.sin(t * 1.3 + p.ph) * 18;
    const tw = 0.5 + 0.5 * Math.sin(t * 3 + p.ph);
    if (parts.mode === "fall") {
      ctx.globalAlpha = 0.55;
      ctx.fillStyle = p.c;
      ctx.beginPath();
      ctx.ellipse(x, y, p.r * 0.7, p.r * 1.3, t + p.ph, 0, Math.PI * 2);
      ctx.fill();
    } else {
      const g = ctx.createRadialGradient(x, y, 0, x, y, p.r * 4);
      ctx.globalAlpha = (parts.mode === "twinkle" ? tw : 0.7) * 0.8;
      g.addColorStop(0, p.c);
      g.addColorStop(1, "transparent");
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.arc(x, y, p.r * 4, 0, Math.PI * 2);
      ctx.fill();
    }
  }
  ctx.restore();
}

function drawFrame(c: Ctx2, f: number) {
  const { ctx, scenes, p, D, ac, ac2, light, onAc } = c;
  const t = f / FPS;
  const s1 = D * 0.3;
  const s2 = D * 0.58;
  const s3 = D * 0.82;
  const TR = 0.45;
  const beat = p.bpm ? 60 / p.bpm : 0;
  const pulse = beat ? Math.pow(1 - ((t % beat) / beat), 6) * 0.015 : 0;
  const shakeX = Math.sin(t * 1.7) * 0.012;
  const shakeY = Math.cos(t * 1.3) * 0.01;

  ctx.fillStyle = "#05060C";
  ctx.fillRect(0, 0, W, H);

  const layer = (i: number, start: number, end: number, zoomFrom: number, zoomTo: number, panX: number, rot: number) => {
    if (t < start - TR || t > end + TR) return;
    const local = (t - start) / (end - start);
    let alpha = 1;
    let extra = 1;
    if (t < start + TR && i > 0) {
      const k = clamp01((t - (start - TR)) / (2 * TR));
      alpha = ease(k);
      extra = 0.9 + 0.1 * ease(k);
    }
    if (t > end - TR && i < 3) {
      const k = clamp01((t - (end - TR)) / (2 * TR));
      alpha *= 1 - k;
      extra *= 1 + 0.35 * ease(k);
    }
    if (alpha <= 0) return;
    ctx.globalAlpha = alpha;
    cover(ctx, scenes[i], (zoomFrom + (zoomTo - zoomFrom) * local) * extra * (1 + pulse), panX * (local - 0.5) * 2 + shakeX, shakeY, rot * (local - 0.5));
    ctx.globalAlpha = 1;
  };
  layer(0, -1, s1, 1.06, 1.2, 0, 0);
  layer(1, s1, s2, 1.22, 1.08, 0.5, 0.02);
  layer(2, s2, s3 + 0.6, 1.05, 1.18, -0.4, -0.015);

  // end-card backdrop: blurred last scene
  if (t > s3 - 0.1) {
    const k = ease((t - s3) / 0.6);
    ctx.save();
    ctx.globalAlpha = k;
    ctx.filter = "blur(26px) brightness(0.55)";
    cover(ctx, scenes[2], 1.3, 0, 0);
    ctx.filter = "none";
    ctx.restore();
  }

  // vignette
  let g = ctx.createLinearGradient(0, 0, 0, H * 0.42);
  g.addColorStop(0, "rgba(5,6,12,0.78)");
  g.addColorStop(1, "rgba(5,6,12,0)");
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, W, H * 0.42);
  g = ctx.createLinearGradient(0, H * 0.5, 0, H);
  g.addColorStop(0, "rgba(5,6,12,0)");
  g.addColorStop(1, "rgba(5,6,12,0.9)");
  ctx.fillStyle = g;
  ctx.fillRect(0, H * 0.5, W, H * 0.5);

  drawParticles(c, t);

  // transitions: flash + coloured light leak sweeping across
  for (const tc of [s1, s2, s3]) {
    const d = Math.abs(t - tc);
    if (d < TR) {
      const k = 1 - d / TR;
      ctx.save();
      ctx.globalCompositeOperation = "lighter";
      ctx.globalAlpha = k * 0.55;
      const lx = W * (0.2 + 0.6 * clamp01((t - (tc - TR)) / (2 * TR)));
      const lg = ctx.createRadialGradient(lx, H * 0.4, 0, lx, H * 0.4, W * 0.9);
      lg.addColorStop(0, ac);
      lg.addColorStop(0.4, rgba(ac2, 0.5));
      lg.addColorStop(1, "transparent");
      ctx.fillStyle = lg;
      ctx.fillRect(0, 0, W, H);
      ctx.globalAlpha = Math.pow(k, 3) * 0.6;
      ctx.fillStyle = "#FFFFFF";
      ctx.fillRect(0, 0, W, H);
      ctx.restore();
    }
  }

  // brand chip
  if (t < s3) {
    const name = p.brand.trim() || "Your Brand";
    ctx.font = `800 38px ${DISPLAY_STACK}`;
    const bw = Math.min(W - 240, ctx.measureText(name).width + 150);
    ctx.save();
    ctx.globalAlpha = ease(t / 0.6);
    rr(ctx, W / 2 - bw / 2, 96, bw, 92, 46);
    ctx.fillStyle = "rgba(10,12,22,0.75)";
    ctx.fill();
    ctx.lineWidth = 3;
    ctx.strokeStyle = ac2;
    ctx.stroke();
    monogram(ctx, W / 2 - bw / 2 + 48, 142, 28, (name.charAt(0) || "B").toUpperCase(), ac, onAc, ac2);
    ctx.fillStyle = "#FFFFFF";
    ctx.textAlign = "left";
    ctx.fillText(name, W / 2 - bw / 2 + 92, 155);
    ctx.restore();
  }

  // scene titles
  if (t < s1 + 0.2) {
    const k = clamp01((s1 + 0.2 - t) / 0.3);
    ctx.save();
    ctx.globalAlpha = k;
    ctx.font = `800 30px ${GLOBAL_SANS_STACK}`;
    ctx.fillStyle = light;
    ctx.textAlign = "center";
    ctx.fillText(festivalGreeting(p.festival).toUpperCase().split("").join(" "), W / 2, 330);
    titleLines(c, p.hook, t - 0.25, 470, 116, "slam");
    ctx.restore();
  }
  if (t >= s1 - 0.1 && t < s2 + 0.1) {
    ctx.save();
    ctx.globalAlpha = clamp01((s2 + 0.1 - t) / 0.3);
    titleLines(c, p.line, t - s1 - 0.15, 470, 84, "highlight");
    ctx.restore();
  }
  if (t >= s2 - 0.1 && t < s3 + 0.1) {
    ctx.save();
    ctx.globalAlpha = clamp01((s3 + 0.1 - t) / 0.3);
    titleLines(c, p.headline3, t - s2 - 0.15, 470, 104, "slam");
    const k = easeBack((t - s2 - 0.5) / 0.5);
    if (t - s2 > 0.5) {
      ctx.translate(W - 200, 760);
      ctx.rotate(((14 + (1 - k) * 120) * Math.PI) / 180);
      ctx.scale(k, k);
      ctx.beginPath();
      for (let i = 0; i < 28; i++) {
        const a = (Math.PI * 2 * i) / 28;
        const r = i % 2 ? 128 : 146;
        ctx.lineTo(Math.cos(a) * r, Math.sin(a) * r);
      }
      ctx.closePath();
      ctx.fillStyle = ac;
      ctx.fill();
      ctx.fillStyle = onAc;
      ctx.textAlign = "center";
      ctx.font = `800 38px ${GLOBAL_SANS_STACK}`;
      const bl = wrap(ctx, p.badge.toUpperCase(), 200, 3);
      bl.forEach((l, i) => ctx.fillText(l, 0, (i - (bl.length - 1) / 2) * 44 + 13));
    }
    ctx.restore();
  }

  // captions (while the voice speaks, before the end card)
  if (t < s3 + 0.3) drawCaptions(c, t);

  // end card
  if (t >= s3) {
    const te = t - s3;
    const name = p.brand.trim() || "Your Brand";
    ctx.save();
    const ringK = ease(te / 0.8);
    ctx.strokeStyle = ac2;
    ctx.lineWidth = 6;
    ctx.beginPath();
    ctx.arc(W / 2, 720, 150, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * ringK);
    ctx.stroke();
    const mk = easeBack((te - 0.15) / 0.5);
    if (mk > 0) {
      ctx.save();
      ctx.translate(W / 2, 720);
      ctx.scale(mk, mk);
      monogram(ctx, 0, 0, 118, (name.charAt(0) || "B").toUpperCase(), ac, onAc, ac2);
      ctx.restore();
    }
    ctx.font = `800 100px ${DISPLAY_STACK}`;
    let px = 100;
    while (px > 48 && ctx.measureText(name).width > W - 140) {
      px -= 4;
      ctx.font = `800 ${px}px ${DISPLAY_STACK}`;
    }
    const chars = Array.from(name);
    const shown = Math.floor(clamp01((te - 0.45) / 0.6) * chars.length);
    ctx.fillStyle = "#FFFFFF";
    ctx.textAlign = "center";
    ctx.fillText(chars.slice(0, shown).join(""), W / 2, 1020);
    ctx.globalAlpha = ease((te - 0.9) / 0.4);
    ctx.font = `700 34px ${GLOBAL_SANS_STACK}`;
    ctx.fillStyle = light;
    ctx.fillText(`${p.festival.toUpperCase()}${p.city ? "  •  " + p.city.toUpperCase() : ""}`, W / 2, 1090);
    const ck = easeBack((te - 1.1) / 0.45);
    if (ck > 0) {
      const breathe = 1 + Math.sin(te * 5) * 0.025;
      ctx.globalAlpha = 1;
      ctx.translate(W / 2, 1250);
      ctx.scale(ck * breathe, ck * breathe);
      pill(ctx, 0, 0, p.cta, { px: 44, bg: ac, fg: onAc, arrow: true, minW: 560 });
      ctx.font = `700 30px ${GLOBAL_SANS_STACK}`;
      ctx.fillStyle = "rgba(255,255,255,0.75)";
      ctx.fillText("Link in bio", 0, 120);
    }
    ctx.restore();
  }

  // film grain
  ctx.save();
  ctx.globalAlpha = 0.06;
  ctx.globalCompositeOperation = "overlay";
  const gx = -((f * 37) % 256);
  const gy = -((f * 53) % 256);
  for (let y = gy; y < H; y += 256) for (let x = gx; x < W; x += 256) ctx.drawImage(c.grain, x, y);
  ctx.restore();

  // progress bar
  ctx.fillStyle = "rgba(255,255,255,0.25)";
  rr(ctx, 48, 40, W - 96, 6, 3);
  ctx.fill();
  ctx.fillStyle = "#FFFFFF";
  rr(ctx, 48, 40, (W - 96) * (t / D), 6, 3);
  ctx.fill();
}

function makeGrain(): HTMLCanvasElement {
  const g = document.createElement("canvas");
  g.width = g.height = 256;
  const gx = g.getContext("2d")!;
  const img = gx.createImageData(256, 256);
  for (let i = 0; i < img.data.length; i += 4) {
    const v = Math.random() * 255;
    img.data[i] = img.data[i + 1] = img.data[i + 2] = v;
    img.data[i + 3] = 255;
  }
  gx.putImageData(img, 0, 0);
  return g;
}

// ---------------- encoding ----------------

async function encodeAudio(muxer: Muxer<ArrayBufferTarget>, buf: AudioBuffer): Promise<void> {
  const enc = new AudioEncoder({ output: (chunk, meta) => muxer.addAudioChunk(chunk, meta), error: (e) => console.error(e) });
  enc.configure({ codec: "mp4a.40.2", sampleRate: SR, numberOfChannels: 2, bitrate: 160_000 });
  const L = buf.getChannelData(0);
  const R = buf.numberOfChannels > 1 ? buf.getChannelData(1) : L;
  const CH = 1024;
  for (let i = 0; i < buf.length; i += CH) {
    const n = Math.min(CH, buf.length - i);
    const data = new Float32Array(n * 2);
    data.set(L.subarray(i, i + n), 0);
    data.set(R.subarray(i, i + n), n);
    const ad = new AudioData({ format: "f32-planar", sampleRate: SR, numberOfFrames: n, numberOfChannels: 2, timestamp: Math.round((i / SR) * 1e6), data });
    enc.encode(ad);
    ad.close();
  }
  await enc.flush();
}

async function pickVideoCodec(): Promise<string | null> {
  for (const codec of ["avc1.640028", "avc1.4d0028", "avc1.42002a"]) {
    const s = await VideoEncoder.isConfigSupported({ codec, width: W, height: H, bitrate: 9_000_000, framerate: FPS }).catch(() => ({ supported: false }));
    if (s.supported) return codec;
  }
  return null;
}

async function audioSupported(): Promise<boolean> {
  if (typeof AudioEncoder === "undefined") return false;
  const s = await AudioEncoder.isConfigSupported({ codec: "mp4a.40.2", sampleRate: SR, numberOfChannels: 2, bitrate: 160_000 }).catch(() => ({ supported: false }));
  return Boolean(s.supported);
}

export type ReelStage = "assets" | "audio" | "frames" | "finishing";

export async function renderReel(
  p: ReelParams,
  onProgress: (fraction: number, stage: ReelStage) => void = () => {}
): Promise<ReelResult> {
  onProgress(0, "assets");
  if (document.fonts?.load) {
    await Promise.all([
      document.fonts.load(`800 100px "Playfair Display"`),
      document.fonts.load(`800 58px "Plus Jakarta Sans"`),
    ]).catch(() => undefined);
  }
  const decodeCtx = new OfflineAudioContext(2, SR, SR);
  const [scenes, voice, music] = await Promise.all([loadScenes(p), fetchAudio(p.voiceUrl, decodeCtx), fetchAudio(p.musicUrl, decodeCtx)]);
  const D = Math.min(22, Math.max(12, voice ? VOICE_START + voice.duration + 2.6 : 12));
  onProgress(0.05, "audio");
  const mixed = await mixAudio(voice, music, D);
  const caps = buildCaptions(p.voiceText, voice?.duration ?? 0);

  const th = getFestivalTheme(p.festival);
  const ac = hex(p.palette?.primary, th.ac);
  const c: Ctx2 = {
    ctx: null as unknown as CanvasRenderingContext2D,
    scenes,
    p,
    D,
    caps,
    grain: makeGrain(),
    parts: makeParticles(p.festival, [th.ac, th.ac3, th.ac4, hex(p.palette?.light, th.ac4)]),
    ac,
    ac2: hex(p.palette?.secondary, th.ac2),
    light: hex(p.palette?.light, th.ac4),
    onAc: readableOn(ac),
  };
  const canvas = document.createElement("canvas");
  canvas.width = W;
  canvas.height = H;
  c.ctx = canvas.getContext("2d")!;
  const FRAMES = Math.round(D * FPS);

  const codec = typeof VideoEncoder !== "undefined" ? await pickVideoCodec() : null;
  if (codec) {
    const withAudio = Boolean(mixed) && (await audioSupported());
    const muxer = new Muxer({
      target: new ArrayBufferTarget(),
      video: { codec: "avc", width: W, height: H },
      audio: withAudio ? { codec: "aac", numberOfChannels: 2, sampleRate: SR } : undefined,
      fastStart: "in-memory",
    });
    let err: unknown = null;
    const enc = new VideoEncoder({ output: (chunk, meta) => muxer.addVideoChunk(chunk, meta), error: (e) => (err = e) });
    enc.configure({ codec, width: W, height: H, bitrate: 9_000_000, framerate: FPS });
    for (let f = 0; f < FRAMES; f++) {
      if (err) throw err;
      drawFrame(c, f);
      const frame = new VideoFrame(canvas, { timestamp: Math.round((f * 1e6) / FPS), duration: Math.round(1e6 / FPS) });
      enc.encode(frame, { keyFrame: f % 60 === 0 });
      frame.close();
      if (enc.encodeQueueSize > 6) await new Promise((r) => setTimeout(r, 0));
      if (f % 6 === 0) {
        onProgress(0.08 + (f / FRAMES) * 0.85, "frames");
        await new Promise((r) => setTimeout(r, 0));
      }
    }
    await enc.flush();
    onProgress(0.95, "finishing");
    if (withAudio && mixed) await encodeAudio(muxer, mixed);
    muxer.finalize();
    const blob = new Blob([muxer.target.buffer], { type: "video/mp4" });
    onProgress(1, "finishing");
    return { blob, url: URL.createObjectURL(blob), mime: "video/mp4", ext: "mp4", hasAudio: withAudio, duration: D };
  }

  // Fallback: real-time MediaRecorder capture (video + audio via WebAudio stream).
  const stream = canvas.captureStream(FPS);
  let audioCtx: AudioContext | null = null;
  if (mixed) {
    audioCtx = new AudioContext({ sampleRate: SR });
    const dest = audioCtx.createMediaStreamDestination();
    const src = audioCtx.createBufferSource();
    src.buffer = mixed;
    src.connect(dest);
    dest.stream.getAudioTracks().forEach((tr) => stream.addTrack(tr));
    src.start();
  }
  const mime = ["video/mp4;codecs=avc1,mp4a.40.2", "video/webm;codecs=vp9,opus", "video/webm"].find((m) => MediaRecorder.isTypeSupported(m)) ?? "video/webm";
  const rec = new MediaRecorder(stream, { mimeType: mime, videoBitsPerSecond: 8_000_000 });
  const chunks: Blob[] = [];
  rec.ondataavailable = (e) => e.data.size && chunks.push(e.data);
  const done = new Promise<void>((r) => (rec.onstop = () => r()));
  rec.start();
  const start = performance.now();
  await new Promise<void>((resolve) => {
    const tick = () => {
      const f = Math.min(FRAMES - 1, Math.floor(((performance.now() - start) / 1000) * FPS));
      drawFrame(c, f);
      onProgress(f / FRAMES, "frames");
      if (f >= FRAMES - 1) resolve();
      else requestAnimationFrame(tick);
    };
    tick();
  });
  rec.stop();
  await done;
  audioCtx?.close();
  const type = mime.startsWith("video/mp4") ? "video/mp4" : "video/webm";
  const blob = new Blob(chunks, { type });
  return { blob, url: URL.createObjectURL(blob), mime: type, ext: type === "video/mp4" ? "mp4" : "webm", hasAudio: Boolean(mixed), duration: D };
}
