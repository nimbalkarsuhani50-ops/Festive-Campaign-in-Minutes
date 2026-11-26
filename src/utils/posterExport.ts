import { getAspectRatioSpec } from "../data/campaigns";
import { getFestivalTheme } from "../data/festivalThemes";
import { makePosterSVG } from "../posters.js";
import type {
  CampaignData,
  CampaignInput,
  PosterAspectRatio,
  PosterConcept,
  PosterLayout,
  StylePreset,
} from "../types";

/**
 * Ready-to-post poster composer. Draws the festival artwork, then lays a
 * Canva/Pinterest-style design on top: big headline, brand lock-up, tagline
 * and a call-to-action. Three templates rotate with the variation seed.
 */
export interface PosterCompositionParams {
  festival: string;
  brand: string;
  /** Active tagline (English or regional). */
  taglineEn: string;
  headline?: string;
  cta?: string;
  badge?: string;
  city?: string;
  seed?: number;
  stylePreset?: StylePreset;
  aspectRatio?: PosterAspectRatio;
  isRtl?: boolean;
  /** AI artwork URL (same-origin). Falls back to the vector festival scene. */
  imageUrl?: string;
  /** Explicit layout; otherwise picked from the seed. */
  layout?: PosterLayout;
  /** Brand x festival palette from the AI. */
  palette?: { primary: string; secondary: string; light: string };
}

export const GLOBAL_SANS_STACK =
  '"Plus Jakarta Sans", "Noto Sans Devanagari", "Noto Sans Tamil", "Noto Sans Telugu", "Noto Sans Bengali", "Noto Sans Kannada", "Noto Sans Malayalam", "Noto Sans Gujarati", "Noto Sans Gurmukhi", "Noto Sans Oriya", "Noto Sans Arabic", "Noto Sans SC", "Noto Sans JP", system-ui, sans-serif';
export const DISPLAY_STACK = `"Playfair Display", ${GLOBAL_SANS_STACK}`;

export const POSTER_TEMPLATE_NAMES = ["Bold Headline", "Ribbon Frame", "Sticker Pop", "Magazine Cover", "Split Panel", "Editorial"] as const;

export function posterTemplateIndex(seed = 7): number {
  return Math.abs(Math.floor(seed)) % POSTER_TEMPLATE_NAMES.length;
}

const SALE_EVENTS = new Set(["Black Friday", "Cyber Monday", "Singles' Day", "Oktoberfest"]);

export function festivalGreeting(festival: string): string {
  return SALE_EVENTS.has(festival) ? `${festival} Special` : `Happy ${festival}`;
}

const LAYOUTS: PosterLayout[] = ["Bold Headline", "Ribbon Frame", "Sticker Pop", "Magazine Cover", "Split Panel", "Editorial"];

/**
 * The campaign's three posters. AI campaigns carry their own concepts; older or
 * demo campaigns get three layouts built from their headline/CTA fields.
 */
export function getPosterConcepts(campaign: CampaignData, festival: string): PosterConcept[] {
  if (campaign.posters?.length) return campaign.posters.slice(0, 3);
  const names = ["Festive Greeting", "Brand Story", "Offer Announcement"];
  return LAYOUTS.slice(0, 3).map((layout, i) => ({
    concept: names[i],
    layout,
    visual_prompt: campaign.poster_prompt,
    headline: i === 0 ? festivalGreeting(festival) : campaign.poster_headline || festivalGreeting(festival),
    subline: i === 1 ? campaign.big_idea.split(/\s+/).slice(0, 9).join(" ") : campaign.tagline_en,
    cta: campaign.poster_cta || "Visit us today",
    badge: campaign.poster_badge || "Festive Special",
  }));
}

export const posterImageUrl = (id?: string) => (id ? `/api/poster-image?id=${id}` : undefined);

/** Fills the fields one poster needs from the generated campaign. */
export function buildPosterParams(
  input: CampaignInput,
  campaign: CampaignData,
  opts: { posterIndex?: number; seed?: number; aspectRatio?: PosterAspectRatio; useRegional?: boolean } = {}
): PosterCompositionParams {
  const aspectRatio = opts.aspectRatio ?? "instagram_feed";
  const idx = opts.posterIndex ?? 0;
  const concept = getPosterConcepts(campaign, input.festival)[idx];
  const regional =
    (opts.useRegional ?? false) && input.language !== "English" && Boolean(campaign.tagline_regional?.trim());
  return {
    festival: input.festival,
    brand: input.brand,
    taglineEn: regional ? campaign.tagline_regional : concept.subline || campaign.tagline_en,
    headline: concept.headline,
    cta: concept.cta,
    badge: concept.badge,
    city: input.city,
    seed: (opts.seed ?? 7) + idx * 5,
    stylePreset: input.stylePreset,
    aspectRatio,
    isRtl: regional && (input.language === "Arabic" || input.language === "Urdu"),
    imageUrl: posterImageUrl(concept.images?.[aspectRatio]),
    layout: concept.layout,
    palette: campaign.palette,
  };
}

// ---------- canvas helpers ----------

export function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = (err) => reject(err);
    img.src = src;
  });
}

type Ctx = CanvasRenderingContext2D;

export function rr(ctx: Ctx, x: number, y: number, w: number, h: number, r: number) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

export function wrap(ctx: Ctx, text: string, maxWidth: number, maxLines: number): string[] {
  const clean = text.trim().replace(/\s+/g, " ");
  if (!clean) return [];
  const units = clean.includes(" ") ? clean.split(" ") : Array.from(clean);
  const joiner = clean.includes(" ") ? " " : "";
  const lines: string[] = [];
  let cur = "";
  for (const u of units) {
    const test = cur ? cur + joiner + u : u;
    if (ctx.measureText(test).width <= maxWidth || !cur) cur = test;
    else {
      lines.push(cur);
      cur = u;
    }
  }
  if (cur) lines.push(cur);
  // Avoid a lone word on the last line ("widow") when the line above can spare one.
  if (lines.length >= 2 && lines.length <= maxLines && joiner === " ") {
    const last = lines[lines.length - 1].split(" ");
    const prev = lines[lines.length - 2].split(" ");
    if (last.length === 1 && prev.length >= 3) {
      const moved = prev.pop() as string;
      const candidate = `${moved} ${last[0]}`;
      if (ctx.measureText(candidate).width <= maxWidth) {
        lines[lines.length - 2] = prev.join(" ");
        lines[lines.length - 1] = candidate;
      } else prev.push(moved);
    }
  }
  if (lines.length > maxLines) {
    const kept = lines.slice(0, maxLines);
    kept[maxLines - 1] = kept[maxLines - 1].replace(/[\s.,;:!-]*$/, "") + "…";
    return kept;
  }
  return lines;
}

function fit(ctx: Ctx, text: string, weight: number, family: string, max: number, start: number, min: number) {
  let px = start;
  while (px > min) {
    ctx.font = `${weight} ${px}px ${family}`;
    if (ctx.measureText(text).width <= max) break;
    px -= 2;
  }
  ctx.font = `${weight} ${px}px ${family}`;
  return px;
}

function star(ctx: Ctx, cx: number, cy: number, r: number, fill: string) {
  ctx.save();
  ctx.fillStyle = fill;
  ctx.beginPath();
  for (let i = 0; i < 8; i++) {
    const a = (Math.PI / 4) * i - Math.PI / 2;
    const rad = i % 2 === 0 ? r : r * 0.28;
    ctx.lineTo(cx + Math.cos(a) * rad, cy + Math.sin(a) * rad);
  }
  ctx.closePath();
  ctx.fill();
  ctx.restore();
}

/** Dark or white text, whichever reads better on this colour. */
export function readableOn(hex: string): string {
  const n = parseInt(hex.replace("#", ""), 16);
  const [r, g, b] = [(n >> 16) & 255, (n >> 8) & 255, n & 255].map((v) => {
    const c = v / 255;
    return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b > 0.32 ? "#16100A" : "#FFFFFF";
}

export function alpha(hex: string, a: number) {
  const n = parseInt(hex.replace("#", ""), 16);
  return `rgba(${(n >> 16) & 255},${(n >> 8) & 255},${n & 255},${a})`;
}

/** Sticker-style text: dark outline + fill, the signature Canva headline look. */
function stickerText(ctx: Ctx, text: string, x: number, y: number, fill: string, outline: string, px: number) {
  ctx.save();
  ctx.lineJoin = "round";
  ctx.lineWidth = Math.max(6, px * 0.16);
  ctx.strokeStyle = outline;
  ctx.shadowColor = "rgba(0,0,0,0.35)";
  ctx.shadowBlur = 14;
  ctx.shadowOffsetY = 6;
  ctx.strokeText(text, x, y);
  ctx.shadowColor = "transparent";
  ctx.fillStyle = fill;
  ctx.fillText(text, x, y);
  ctx.restore();
}

export function pill(ctx: Ctx, cx: number, cy: number, text: string, opts: { px: number; bg: string; fg: string; border?: string; padX?: number; minW?: number; arrow?: boolean }) {
  ctx.save();
  ctx.font = `800 ${opts.px}px ${GLOBAL_SANS_STACK}`;
  const label = opts.arrow ? `${text}  →` : text;
  const tw = ctx.measureText(label).width;
  const padX = opts.padX ?? opts.px * 0.9;
  const w = Math.max(opts.minW ?? 0, tw + padX * 2);
  const h = opts.px * 2.1;
  rr(ctx, cx - w / 2, cy - h / 2, w, h, h / 2);
  ctx.fillStyle = opts.bg;
  ctx.shadowColor = "rgba(0,0,0,0.35)";
  ctx.shadowBlur = 18;
  ctx.shadowOffsetY = 8;
  ctx.fill();
  ctx.shadowColor = "transparent";
  if (opts.border) {
    ctx.lineWidth = 3;
    ctx.strokeStyle = opts.border;
    ctx.stroke();
  }
  ctx.fillStyle = opts.fg;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(label, cx, cy + opts.px * 0.04);
  ctx.restore();
  return { w, h };
}

export function monogram(ctx: Ctx, cx: number, cy: number, r: number, letter: string, bg: string, fg: string, ring: string) {
  ctx.save();
  ctx.beginPath();
  ctx.arc(cx, cy, r + 5, 0, Math.PI * 2);
  ctx.fillStyle = ring;
  ctx.fill();
  ctx.beginPath();
  ctx.arc(cx, cy, r, 0, Math.PI * 2);
  ctx.fillStyle = bg;
  ctx.fill();
  ctx.fillStyle = fg;
  ctx.font = `800 ${r * 1.15}px ${DISPLAY_STACK}`;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(letter, cx, cy + r * 0.06);
  ctx.restore();
}

function scrim(ctx: Ctx, w: number, y0: number, y1: number, color: string, a0: number, a1: number) {
  const g = ctx.createLinearGradient(0, y0, 0, y1);
  g.addColorStop(0, alpha(color, a0));
  g.addColorStop(1, alpha(color, a1));
  ctx.fillStyle = g;
  ctx.fillRect(0, Math.min(y0, y1), w, Math.abs(y1 - y0));
}

// ---------- main composer ----------

export async function composePosterPngDataUrl(params: PosterCompositionParams): Promise<string> {
  const {
    festival,
    brand,
    taglineEn,
    seed = 7,
    stylePreset = "Festive Gold",
    aspectRatio = "instagram_feed",
    isRtl = false,
  } = params;
  const headline = (params.headline || festivalGreeting(festival)).trim();
  const cta = (params.cta || "Visit us today").trim();
  const badge = (params.badge || "Festive Special").trim();
  const city = (params.city || "").trim();

  if (document.fonts?.load) {
    await Promise.all([
      document.fonts.load(`800 80px "Playfair Display"`),
      document.fonts.load(`700 40px "Playfair Display"`),
      document.fonts.load(`800 40px "Plus Jakarta Sans"`),
      document.fonts.load(`500 30px "Plus Jakarta Sans"`),
    ]).catch(() => undefined);
  }
  if (document.fonts?.ready) await document.fonts.ready;

  const { width: W, height: H } = getAspectRatioSpec(aspectRatio);
  const tall = H > 1500;
  const canvas = document.createElement("canvas");
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Could not initialize 2D canvas context.");

  // 1. artwork: AI image (cover-fit) or the vector festival scene
  let drewPhoto = false;
  if (params.imageUrl) {
    try {
      const img = await loadImage(params.imageUrl);
      const sc = Math.max(W / img.width, H / img.height);
      const dw = img.width * sc;
      const dh = img.height * sc;
      ctx.drawImage(img, (W - dw) / 2, (H - dh) / 2, dw, dh);
      drewPhoto = true;
    } catch {
      drewPhoto = false;
    }
  }
  if (!drewPhoto) {
    const svg = makePosterSVG(festival, seed, stylePreset, aspectRatio);
    const url = URL.createObjectURL(new Blob([svg], { type: "image/svg+xml;charset=utf-8" }));
    try {
      ctx.drawImage(await loadImage(url), 0, 0, W, H);
    } finally {
      URL.revokeObjectURL(url);
    }
  }

  // 2. palette
  const base = getFestivalTheme(festival);
  const pal = params.palette;
  const hexOk = (h?: string) => !!h && /^#[0-9a-f]{6}$/i.test(h.trim());
  const th = {
    ...base,
    ac: hexOk(pal?.primary) ? pal!.primary.trim() : base.ac,
    ac2: hexOk(pal?.secondary) ? pal!.secondary.trim() : base.ac2,
    ac4: hexOk(pal?.light) ? pal!.light.trim() : base.ac4,
  };
  const light = stylePreset === "Minimal";
  const ink = light ? "#1B1410" : "#FFFFFF";
  const cardBg = light ? "rgba(255,252,246,0.97)" : alpha(th.bg0, 0.93);
  const scrimBase = light ? "#F6EEDF" : "#05060C";
  const accentText = light ? "#7C2D12" : th.ac4;
  const onAccent = readableOn(th.ac);
  const outline = light ? "#7C2D12" : alpha(th.bg0, 1);
  const initial = (brand.trim().charAt(0) || "B").toUpperCase();
  const brandName = brand.trim() || "Your Brand";
  const tpl = params.layout ? Math.max(0, LAYOUTS.indexOf(params.layout)) : posterTemplateIndex(seed);
  const m = 56; // outer margin

  ctx.textBaseline = "alphabetic";
  ctx.direction = "ltr";

  // 3. templates ---------------------------------------------------------
  if (tpl === 0) {
    // BOLD HEADLINE — greeting pill, giant outlined headline, brand card
    scrim(ctx, W, 0, H * 0.4, scrimBase, light ? 0.78 : 0.82, 0);
    scrim(ctx, W, H * 0.62, H, scrimBase, 0, light ? 0.55 : 0.6);

    ctx.textAlign = "center";
    pill(ctx, W / 2, tall ? 170 : 108, festivalGreeting(festival).toUpperCase(), {
      px: tall ? 26 : 22, bg: th.ac, fg: onAccent, padX: 34,
    });

    ctx.textAlign = "center";
    const hw = W - m * 2;
    let px = tall ? 150 : 124;
    ctx.font = `800 ${px}px ${DISPLAY_STACK}`;
    let lines = wrap(ctx, headline, hw, 3);
    while (px > 64 && (lines.some((l) => ctx.measureText(l).width > hw) || lines[lines.length - 1]?.endsWith("…"))) {
      px -= 4;
      ctx.font = `800 ${px}px ${DISPLAY_STACK}`;
      lines = wrap(ctx, headline, hw, 3);
    }
    const y0 = (tall ? 330 : 250) + (lines.length === 1 ? px * 0.2 : 0);
    ctx.font = `800 ${px}px ${DISPLAY_STACK}`;
    lines.forEach((l, i) =>
      stickerText(ctx, l, W / 2, y0 + i * px * 1.04, i === lines.length - 1 && lines.length > 1 ? th.ac4 : light ? "#FFF8EC" : "#FFFFFF", outline, px)
    );

    const ch = tall ? 330 : 276;
    const cy = H - m - ch;
    rr(ctx, m, cy, W - m * 2, ch, 48);
    ctx.fillStyle = cardBg;
    ctx.shadowColor = "rgba(0,0,0,0.45)";
    ctx.shadowBlur = 36;
    ctx.shadowOffsetY = 14;
    ctx.fill();
    ctx.shadowColor = "transparent";
    ctx.lineWidth = 4;
    ctx.strokeStyle = th.ac2;
    ctx.stroke();

    monogram(ctx, m + 84, cy + 76, 44, initial, th.ac, onAccent, th.ac2);
    ctx.textAlign = "left";
    ctx.fillStyle = ink;
    fit(ctx, brandName, 800, DISPLAY_STACK, W - m * 2 - 220, 54, 30);
    ctx.fillText(brandName, m + 150, cy + 80);
    if (city) {
      ctx.font = `700 22px ${GLOBAL_SANS_STACK}`;
      ctx.fillStyle = accentText;
      ctx.fillText(city.toUpperCase(), m + 152, cy + 112);
    }

    ctx.direction = isRtl ? "rtl" : "ltr";
    ctx.textAlign = "center";
    ctx.font = `600 ${tall ? 34 : 30}px ${GLOBAL_SANS_STACK}`;
    ctx.fillStyle = light ? "#3B2A1E" : "#E8ECF4";
    const tl = wrap(ctx, taglineEn, W - m * 2 - 90, 2);
    tl.forEach((l, i) => ctx.fillText(l, W / 2, cy + 168 + i * 42));
    ctx.direction = "ltr";

    pill(ctx, W / 2, cy + ch - (tall ? 56 : 48), cta, { px: 28, bg: th.ac, fg: onAccent, arrow: true, minW: 420 });
  } else if (tpl === 1) {
    // RIBBON FRAME — inset frame, banner ribbon headline, centred stack
    scrim(ctx, W, 0, H * 0.3, scrimBase, light ? 0.6 : 0.6, 0);
    scrim(ctx, W, H * 0.58, H, scrimBase, 0, light ? 0.8 : 0.88);

    ctx.lineWidth = 7;
    ctx.strokeStyle = th.ac2;
    rr(ctx, 28, 28, W - 56, H - 56, 42);
    ctx.stroke();
    ctx.lineWidth = 2;
    ctx.strokeStyle = alpha(th.ac4, 0.7);
    rr(ctx, 46, 46, W - 92, H - 92, 30);
    ctx.stroke();
    [[46, 46], [W - 46, 46], [46, H - 46], [W - 46, H - 46]].forEach(([x, y]) => {
      star(ctx, x, y, 22, th.ac4);
    });

    // brand pill
    ctx.textAlign = "center";
    const topY = tall ? 150 : 112;
    ctx.font = `800 30px ${DISPLAY_STACK}`;
    const bw = Math.min(W - 260, ctx.measureText(brandName).width + 150);
    rr(ctx, W / 2 - bw / 2, topY - 40, bw, 80, 40);
    ctx.fillStyle = cardBg;
    ctx.fill();
    ctx.lineWidth = 3;
    ctx.strokeStyle = th.ac2;
    ctx.stroke();
    monogram(ctx, W / 2 - bw / 2 + 42, topY, 26, initial, th.ac, onAccent, th.ac2);
    ctx.fillStyle = ink;
    ctx.textAlign = "left";
    fit(ctx, brandName, 800, DISPLAY_STACK, bw - 110, 32, 20);
    ctx.fillText(brandName, W / 2 - bw / 2 + 86, topY + 11);

    // ribbon
    const ry = tall ? 300 : 232;
    const rh = tall ? 190 : 168;
    const rx = 74;
    const rw = W - rx * 2;
    ctx.save();
    ctx.fillStyle = alpha(th.ac, 0.55);
    ctx.beginPath();
    ctx.moveTo(rx - 30, ry + 26); ctx.lineTo(rx + 40, ry + 26); ctx.lineTo(rx + 40, ry + rh + 26); ctx.lineTo(rx - 30, ry + rh + 26); ctx.lineTo(rx - 4, ry + rh / 2 + 26); ctx.closePath();
    ctx.fill();
    ctx.beginPath();
    ctx.moveTo(rx + rw + 30, ry + 26); ctx.lineTo(rx + rw - 40, ry + 26); ctx.lineTo(rx + rw - 40, ry + rh + 26); ctx.lineTo(rx + rw + 30, ry + rh + 26); ctx.lineTo(rx + rw + 4, ry + rh / 2 + 26); ctx.closePath();
    ctx.fill();
    const rg = ctx.createLinearGradient(0, ry, 0, ry + rh);
    rg.addColorStop(0, th.ac4);
    rg.addColorStop(0.18, th.ac);
    rg.addColorStop(1, th.ac);
    ctx.fillStyle = rg;
    ctx.shadowColor = "rgba(0,0,0,0.4)";
    ctx.shadowBlur = 26;
    ctx.shadowOffsetY = 12;
    ctx.fillRect(rx, ry, rw, rh);
    ctx.shadowColor = "transparent";
    ctx.strokeStyle = alpha("#FFFFFF", 0.55);
    ctx.lineWidth = 3;
    ctx.setLineDash([14, 10]);
    ctx.strokeRect(rx + 16, ry + 16, rw - 32, rh - 32);
    ctx.restore();

    ctx.textAlign = "center";
    ctx.fillStyle = onAccent;
    const hw = rw - 110;
    let px = tall ? 112 : 98;
    ctx.font = `800 ${px}px ${DISPLAY_STACK}`;
    let hl = wrap(ctx, headline, hw, 2);
    while (px > 46 && (hl.some((l) => ctx.measureText(l).width > hw) || hl[hl.length - 1]?.endsWith("…"))) {
      px -= 4;
      ctx.font = `800 ${px}px ${DISPLAY_STACK}`;
      hl = wrap(ctx, headline, hw, 2);
    }
    if (hl.length === 1) ctx.fillText(hl[0], W / 2, ry + rh / 2 + px * 0.34);
    else hl.forEach((l, i) => ctx.fillText(l, W / 2, ry + rh / 2 + px * (i === 0 ? -0.06 : 0.9) - (hl.length === 2 ? px * 0.05 : 0)));

    // bottom stack
    ctx.direction = isRtl ? "rtl" : "ltr";
    ctx.fillStyle = light ? "#2B1D12" : "#FFFFFF";
    ctx.font = `700 ${tall ? 44 : 40}px ${DISPLAY_STACK}`;
    const tl = wrap(ctx, taglineEn, W - 220, 3);
    const baseY = H - (tall ? 330 : 270) - (tl.length - 1) * 26;
    tl.forEach((l, i) => ctx.fillText(l, W / 2, baseY + i * 54));
    ctx.direction = "ltr";
    if (city) {
      ctx.font = `700 22px ${GLOBAL_SANS_STACK}`;
      ctx.fillStyle = light ? "#7C2D12" : th.ac4;
      ctx.fillText(`${festival.toUpperCase()}  •  ${city.toUpperCase()}`, W / 2, H - (tall ? 205 : 170));
    }
    pill(ctx, W / 2, H - (tall ? 130 : 108), cta, { px: 30, bg: th.ac, fg: onAccent, arrow: true, minW: 440 });
  } else if (tpl === 2) {
    // STICKER POP — corner badge, stacked highlighter headline, CTA chip
    scrim(ctx, W, H * 0.36, H, scrimBase, 0, light ? 0.88 : 0.92);
    scrim(ctx, W, 0, H * 0.18, scrimBase, light ? 0.55 : 0.55, 0);

    // brand chip (top-left)
    ctx.font = `800 28px ${DISPLAY_STACK}`;
    const bw = Math.min(W - 520, ctx.measureText(brandName).width + 128);
    const by = m + 36;
    rr(ctx, m, by - 38, bw, 76, 38);
    ctx.fillStyle = cardBg;
    ctx.fill();
    ctx.lineWidth = 3;
    ctx.strokeStyle = th.ac2;
    ctx.stroke();
    monogram(ctx, m + 40, by, 24, initial, th.ac, onAccent, th.ac2);
    ctx.fillStyle = ink;
    ctx.textAlign = "left";
    fit(ctx, brandName, 800, DISPLAY_STACK, bw - 108, 30, 18);
    ctx.fillText(brandName, m + 80, by + 10);

    // tilted badge (top-right)
    ctx.save();
    ctx.translate(W - 175, tall ? 250 : 215);
    ctx.rotate((12 * Math.PI) / 180);
    const br = 118;
    ctx.beginPath();
    for (let i = 0; i < 24; i++) {
      const a = (Math.PI * 2 * i) / 24;
      const r = i % 2 ? br - 14 : br;
      ctx.lineTo(Math.cos(a) * r, Math.sin(a) * r);
    }
    ctx.closePath();
    ctx.fillStyle = th.ac5;
    ctx.shadowColor = "rgba(0,0,0,0.45)";
    ctx.shadowBlur = 24;
    ctx.shadowOffsetY = 10;
    ctx.fill();
    ctx.shadowColor = "transparent";
    ctx.beginPath();
    ctx.arc(0, 0, br - 30, 0, Math.PI * 2);
    ctx.lineWidth = 3;
    ctx.setLineDash([8, 8]);
    ctx.strokeStyle = "rgba(255,255,255,0.8)";
    ctx.stroke();
    ctx.setLineDash([]);
    ctx.fillStyle = "#FFFFFF";
    ctx.textAlign = "center";
    ctx.font = `800 34px ${GLOBAL_SANS_STACK}`;
    const bl = wrap(ctx, badge.toUpperCase(), 170, 3);
    bl.forEach((l, i) => {
      ctx.fillStyle = "#1A0B14";
      ctx.fillText(l, 0, (i - (bl.length - 1) / 2) * 40 + 12);
    });
    ctx.restore();

    // stacked headline with highlighter bars
    ctx.textAlign = "left";
    const hw = W - m * 2 - 30;
    let px = tall ? 138 : 112;
    ctx.font = `800 ${px}px ${DISPLAY_STACK}`;
    let hl = wrap(ctx, headline, hw, 3);
    while (px > 58 && (hl.some((l) => ctx.measureText(l).width > hw) || hl[hl.length - 1]?.endsWith("…"))) {
      px -= 4;
      ctx.font = `800 ${px}px ${DISPLAY_STACK}`;
      hl = wrap(ctx, headline, hw, 3);
    }
    const lh = px * 1.22;
    const footer = tall ? 250 : 215;
    const tagLines: string[] = (() => {
      ctx.font = `600 ${tall ? 34 : 30}px ${GLOBAL_SANS_STACK}`;
      return wrap(ctx, taglineEn, W - m * 2 - 20, 2);
    })();
    const tagH = tagLines.length * 44 + 20;
    const startY = H - footer - tagH - (hl.length - 1) * lh - 20;
    hl.forEach((l, i) => {
      ctx.font = `800 ${px}px ${DISPLAY_STACK}`;
      const tw = ctx.measureText(l).width;
      const y = startY + i * lh;
      ctx.save();
      ctx.translate(m, y);
      ctx.rotate(((i % 2 ? 1.4 : -1.4) * Math.PI) / 180);
      const last = i === hl.length - 1;
      rr(ctx, -14, -px * 0.9, tw + 40, px * 1.12, 16);
      ctx.fillStyle = last ? "#FFFFFF" : th.ac;
      ctx.shadowColor = "rgba(0,0,0,0.35)";
      ctx.shadowBlur = 16;
      ctx.shadowOffsetY = 8;
      ctx.fill();
      ctx.shadowColor = "transparent";
      ctx.fillStyle = last ? "#16100A" : onAccent;
      ctx.fillText(l, 4, 0);
      ctx.restore();
    });

    ctx.direction = isRtl ? "rtl" : "ltr";
    ctx.textAlign = isRtl ? "right" : "left";
    ctx.font = `600 ${tall ? 34 : 30}px ${GLOBAL_SANS_STACK}`;
    ctx.fillStyle = light ? "#2B1D12" : "#F1F5F9";
    const tgY = startY + (hl.length - 1) * lh + 62;
    tagLines.forEach((l, i) => ctx.fillText(l, isRtl ? W - m : m, tgY + i * 44));
    ctx.direction = "ltr";

    // CTA chip + location
    ctx.textAlign = "left";
    const cyy = H - m - (tall ? 70 : 54);
    ctx.font = `800 28px ${GLOBAL_SANS_STACK}`;
    const chipW = ctx.measureText(`${cta}  →`).width + 28 * 1.8;
    pill(ctx, m + chipW / 2, cyy, cta, { px: 28, bg: "#FFFFFF", fg: "#16100A", arrow: true });
    if (city) {
      ctx.textAlign = "right";
      ctx.font = `700 24px ${GLOBAL_SANS_STACK}`;
      ctx.fillStyle = light ? "#7C2D12" : th.ac4;
      ctx.fillText(`${festival.toUpperCase()} • ${city.toUpperCase()}`, W - m, cyy + 8);
    }
  } else if (tpl === 3) {
    // MAGAZINE COVER — brand as masthead, headline bottom-left, editorial CTA
    scrim(ctx, W, 0, H * 0.3, "#05060C", 0.75, 0);
    scrim(ctx, W, H * 0.5, H, "#05060C", 0, 0.9);
    ctx.textAlign = "center";
    ctx.fillStyle = "#FFFFFF";
    const mpx = fit(ctx, brandName.toUpperCase(), 800, DISPLAY_STACK, W - m * 2, tall ? 170 : 150, 54);
    ctx.save();
    ctx.shadowColor = alpha(th.ac, 0.65);
    ctx.shadowBlur = 30;
    ctx.fillText(brandName.toUpperCase(), W / 2, (tall ? 150 : 110) + mpx * 0.72);
    ctx.restore();
    const ruleY = (tall ? 150 : 110) + mpx * 0.95;
    ctx.fillStyle = th.ac2;
    ctx.fillRect(m, ruleY, W - m * 2, 3);
    ctx.font = `800 22px ${GLOBAL_SANS_STACK}`;
    ctx.fillStyle = th.ac4;
    ctx.fillText(`${festivalGreeting(festival).toUpperCase()}   •   ${(city || "").toUpperCase()}   •   ${badge.toUpperCase()}`, W / 2, ruleY + 40);

    ctx.textAlign = "left";
    const hw = W - m * 2 - 40;
    let px = tall ? 124 : 104;
    ctx.font = `800 ${px}px ${DISPLAY_STACK}`;
    let hl = wrap(ctx, headline, hw, 3);
    while (px > 54 && (hl.some((l) => ctx.measureText(l).width > hw) || hl[hl.length - 1]?.endsWith("…"))) {
      px -= 4;
      ctx.font = `800 ${px}px ${DISPLAY_STACK}`;
      hl = wrap(ctx, headline, hw, 3);
    }
    ctx.font = `600 ${tall ? 34 : 30}px ${GLOBAL_SANS_STACK}`;
    const sub = wrap(ctx, taglineEn, W - m * 2, 2);
    const ctaY = H - m - (tall ? 40 : 26);
    const subTop = ctaY - 70 - sub.length * 42;
    const headTop = subTop - 30 - (hl.length - 1) * px * 1.02;
    ctx.font = `800 ${px}px ${DISPLAY_STACK}`;
    hl.forEach((l, i) => stickerText(ctx, l, m, headTop + i * px * 1.02, i === hl.length - 1 ? th.ac4 : "#FFFFFF", alpha("#05060C", 0.9), px));
    ctx.direction = isRtl ? "rtl" : "ltr";
    ctx.textAlign = isRtl ? "right" : "left";
    ctx.font = `600 ${tall ? 34 : 30}px ${GLOBAL_SANS_STACK}`;
    ctx.fillStyle = "#E8ECF4";
    sub.forEach((l, i) => ctx.fillText(l, isRtl ? W - m : m, subTop + 20 + i * 42));
    ctx.direction = "ltr";
    ctx.textAlign = "left";
    ctx.font = `800 30px ${GLOBAL_SANS_STACK}`;
    ctx.fillStyle = th.ac4;
    const ctaTxt = `${cta.toUpperCase()}  →`;
    ctx.fillText(ctaTxt, m, ctaY);
    ctx.fillStyle = th.ac;
    ctx.fillRect(m, ctaY + 12, ctx.measureText(ctaTxt).width, 4);
  } else if (tpl === 4) {
    // SPLIT PANEL — photo on top, solid brand-colour panel with curved edge below
    const panelTop = H * (tall ? 0.6 : 0.6);
    scrim(ctx, W, 0, H * 0.2, "#05060C", 0.55, 0);
    const panelColor = light ? "#FBF6EC" : th.ac;
    const panelInk = light ? "#1B1410" : readableOn(th.ac);
    ctx.save();
    ctx.beginPath();
    ctx.moveTo(0, panelTop + 60);
    ctx.quadraticCurveTo(W / 2, panelTop - 60, W, panelTop + 60);
    ctx.lineTo(W, H);
    ctx.lineTo(0, H);
    ctx.closePath();
    ctx.fillStyle = panelColor;
    ctx.shadowColor = "rgba(0,0,0,0.45)";
    ctx.shadowBlur = 40;
    ctx.fill();
    ctx.restore();
    ctx.strokeStyle = th.ac2;
    ctx.lineWidth = 5;
    ctx.beginPath();
    ctx.moveTo(0, panelTop + 60);
    ctx.quadraticCurveTo(W / 2, panelTop - 60, W, panelTop + 60);
    ctx.stroke();

    // brand chip on the photo
    ctx.font = `800 28px ${DISPLAY_STACK}`;
    const bw = Math.min(W - 200, ctx.measureText(brandName).width + 128);
    rr(ctx, W / 2 - bw / 2, m, bw, 76, 38);
    ctx.fillStyle = cardBg;
    ctx.fill();
    monogram(ctx, W / 2 - bw / 2 + 40, m + 38, 24, initial, th.ac, onAccent, th.ac2);
    ctx.fillStyle = ink;
    ctx.textAlign = "left";
    fit(ctx, brandName, 800, DISPLAY_STACK, bw - 108, 30, 18);
    ctx.fillText(brandName, W / 2 - bw / 2 + 80, m + 48);

    ctx.textAlign = "center";
    ctx.font = `800 22px ${GLOBAL_SANS_STACK}`;
    ctx.fillStyle = alpha(panelInk === "#FFFFFF" ? "#FFFFFF" : "#16100A", 0.75);
    ctx.fillText(festivalGreeting(festival).toUpperCase(), W / 2, panelTop + 60);
    let px = tall ? 104 : 88;
    const hw = W - m * 2;
    ctx.font = `800 ${px}px ${DISPLAY_STACK}`;
    let hl = wrap(ctx, headline, hw, 2);
    while (px > 48 && (hl.some((l) => ctx.measureText(l).width > hw) || hl[hl.length - 1]?.endsWith("…"))) {
      px -= 4;
      ctx.font = `800 ${px}px ${DISPLAY_STACK}`;
      hl = wrap(ctx, headline, hw, 2);
    }
    ctx.fillStyle = panelInk;
    hl.forEach((l, i) => ctx.fillText(l, W / 2, panelTop + 80 + px * 0.9 + i * px * 1.02));
    const afterHead = panelTop + 80 + px * 0.9 + (hl.length - 1) * px * 1.02;
    ctx.direction = isRtl ? "rtl" : "ltr";
    ctx.font = `600 ${tall ? 32 : 28}px ${GLOBAL_SANS_STACK}`;
    ctx.fillStyle = alpha(panelInk === "#FFFFFF" ? "#FFFFFF" : "#16100A", 0.85);
    wrap(ctx, taglineEn, W - m * 2 - 40, 2).forEach((l, i) => ctx.fillText(l, W / 2, afterHead + 56 + i * 38));
    ctx.direction = "ltr";
    pill(ctx, W / 2, H - m - 30, cta, {
      px: 28,
      bg: panelInk === "#FFFFFF" ? "#FFFFFF" : "#16100A",
      fg: panelInk === "#FFFFFF" ? "#16100A" : "#FFFFFF",
      arrow: true,
      minW: 400,
    });
  } else {
    // EDITORIAL — quiet luxury: thin frame, spaced caps, elegant serif headline
    scrim(ctx, W, H * 0.45, H, "#05060C", 0, 0.88);
    scrim(ctx, W, 0, H * 0.18, "#05060C", 0.5, 0);
    ctx.strokeStyle = alpha("#FFFFFF", 0.75);
    ctx.lineWidth = 2;
    ctx.strokeRect(36, 36, W - 72, H - 72);
    ctx.textAlign = "center";
    ctx.fillStyle = "#FFFFFF";
    ctx.font = `700 26px ${GLOBAL_SANS_STACK}`;
    const spaced = brandName.toUpperCase().split("").join(" ");
    fit(ctx, spaced, 700, GLOBAL_SANS_STACK, W - 200, 26, 16);
    ctx.fillText(spaced, W / 2, 104);
    ctx.font = `600 20px ${GLOBAL_SANS_STACK}`;
    ctx.fillStyle = th.ac4;
    ctx.fillText(`${festival.toUpperCase()} ${new Date().getFullYear()}`, W / 2, 140);

    let px = tall ? 92 : 80;
    const hw = W - 200;
    ctx.font = `italic 600 ${px}px ${DISPLAY_STACK}`;
    let hl = wrap(ctx, headline, hw, 3);
    while (px > 44 && (hl.some((l) => ctx.measureText(l).width > hw) || hl[hl.length - 1]?.endsWith("…"))) {
      px -= 4;
      ctx.font = `italic 600 ${px}px ${DISPLAY_STACK}`;
      hl = wrap(ctx, headline, hw, 3);
    }
    const bottom = H - (tall ? 200 : 160);
    ctx.font = `500 ${tall ? 30 : 27}px ${GLOBAL_SANS_STACK}`;
    const sub = wrap(ctx, taglineEn, W - 240, 2);
    const subY = bottom - sub.length * 38;
    const headY = subY - 50 - (hl.length - 1) * px * 1.05;
    ctx.font = `italic 600 ${px}px ${DISPLAY_STACK}`;
    ctx.fillStyle = "#FFFFFF";
    hl.forEach((l, i) => ctx.fillText(l, W / 2, headY + i * px * 1.05));
    ctx.fillStyle = th.ac2;
    ctx.fillRect(W / 2 - 50, subY - 26, 100, 3);
    ctx.direction = isRtl ? "rtl" : "ltr";
    ctx.font = `500 ${tall ? 30 : 27}px ${GLOBAL_SANS_STACK}`;
    ctx.fillStyle = "#E8ECF4";
    sub.forEach((l, i) => ctx.fillText(l, W / 2, subY + 20 + i * 38));
    ctx.direction = "ltr";
    ctx.font = `800 24px ${GLOBAL_SANS_STACK}`;
    ctx.fillStyle = th.ac4;
    ctx.fillText(`${cta.toUpperCase()}  →`, W / 2, H - (tall ? 110 : 84));
  }

  return canvas.toDataURL("image/png");
}

function sanitizeFileSegment(value: string): string {
  return value.trim().replace(/[/\\?%*:|"<>]/g, "-").replace(/\s+/g, "-");
}

export async function downloadPosterPng(params: PosterCompositionParams): Promise<void> {
  const dataUrl = await composePosterPngDataUrl(params);
  const link = document.createElement("a");
  link.href = dataUrl;
  link.download = `${sanitizeFileSegment(params.brand || "brand")}-${sanitizeFileSegment(
    params.festival || "festival"
  )}-${sanitizeFileSegment(params.aspectRatio ?? "instagram_feed").replace(/_/g, "-")}.png`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}
