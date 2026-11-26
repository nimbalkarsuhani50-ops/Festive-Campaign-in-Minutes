import JSZip from "jszip";
import { getFestivalTheme } from "../data/festivalThemes";
import { makePosterSVG } from "../posters.js";
import type { CampaignData, CampaignInput, InstagramPost } from "../types";
import {
  DISPLAY_STACK,
  GLOBAL_SANS_STACK,
  buildPosterParams,
  composePosterPngDataUrl,
  getPosterConcepts,
  loadImage,
  rr,
  wrap,
} from "./posterExport";
import type { ReelResult } from "./reelRenderer";

const SW = 1080;
const SH = 1350;

/** Renders one carousel slide exactly as it appears on the board, as a PNG. */
export async function composeSlidePng(opts: {
  post: InstagramPost;
  index: number;
  total: number;
  brand: string;
  festival: string;
  image?: string;
  accent?: string;
  seed?: number;
}): Promise<string> {
  const { post, index, total, brand, festival } = opts;
  if (document.fonts?.load) await document.fonts.load(`800 80px "Playfair Display"`).catch(() => undefined);
  const c = document.createElement("canvas");
  c.width = SW;
  c.height = SH;
  const ctx = c.getContext("2d")!;
  let img: HTMLImageElement | null = null;
  if (opts.image) img = await loadImage(opts.image).catch(() => null);
  if (!img) {
    const url = URL.createObjectURL(
      new Blob([makePosterSVG(festival, (opts.seed ?? 7) + index * 13 + 3, "Festive Gold", "instagram_feed")], { type: "image/svg+xml;charset=utf-8" })
    );
    img = await loadImage(url).finally(() => URL.revokeObjectURL(url));
  }
  const zoom = index > 2 ? 1.18 : 1;
  const sc = Math.max(SW / img.width, SH / img.height) * zoom;
  const ox = index === 3 ? -0.2 : index === 4 ? 0.2 : 0;
  ctx.drawImage(img, (SW - img.width * sc) / 2 + ox * (img.width * sc - SW), (SH - img.height * sc) / 2, img.width * sc, img.height * sc);

  let g = ctx.createLinearGradient(0, 0, 0, SH * 0.35);
  g.addColorStop(0, "rgba(0,0,0,0.65)");
  g.addColorStop(1, "rgba(0,0,0,0)");
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, SW, SH * 0.35);
  g = ctx.createLinearGradient(0, SH * 0.45, 0, SH);
  g.addColorStop(0, "rgba(0,0,0,0)");
  g.addColorStop(1, "rgba(0,0,0,0.88)");
  ctx.fillStyle = g;
  ctx.fillRect(0, SH * 0.45, SW, SH * 0.55);

  const th = getFestivalTheme(festival);
  const accent = opts.accent && /^#[0-9a-f]{6}$/i.test(opts.accent) ? opts.accent : th.ac4;

  // counter + angle chip
  ctx.font = `800 30px ${GLOBAL_SANS_STACK}`;
  const counter = `${index + 1}/${total}`;
  const cw = ctx.measureText(counter).width + 40;
  rr(ctx, 48, 48, cw, 58, 29);
  ctx.fillStyle = "rgba(0,0,0,0.5)";
  ctx.fill();
  ctx.fillStyle = "#FFFFFF";
  ctx.textAlign = "center";
  ctx.fillText(counter, 48 + cw / 2, 88);
  const angle = (post.angle || `Slide ${index + 1}`).toUpperCase();
  ctx.font = `800 26px ${GLOBAL_SANS_STACK}`;
  const aw = ctx.measureText(angle).width + 48;
  rr(ctx, SW - 48 - aw, 48, aw, 58, 29);
  ctx.fillStyle = th.ac;
  ctx.fill();
  ctx.fillStyle = "#16100A";
  ctx.fillText(angle, SW - 48 - aw / 2, 87);

  // text block from the bottom up
  ctx.textAlign = "left";
  const m = 64;
  const headline = post.headline || post.caption.split(/\s+/).slice(0, 5).join(" ");
  let px = 92;
  ctx.font = `800 ${px}px ${DISPLAY_STACK}`;
  let lines = wrap(ctx, headline, SW - m * 2 - 40, 3);
  while (px > 50 && (lines.some((l) => ctx.measureText(l).width > SW - m * 2 - 40) || lines[lines.length - 1]?.endsWith("…"))) {
    px -= 4;
    ctx.font = `800 ${px}px ${DISPLAY_STACK}`;
    lines = wrap(ctx, headline, SW - m * 2 - 40, 3);
  }
  ctx.font = `600 34px ${GLOBAL_SANS_STACK}`;
  const sub = post.subline ? wrap(ctx, post.subline, SW - m * 2, 2) : [];
  let y = SH - m - (index < total - 1 ? 60 : 0) - sub.length * 46;
  const headTop = y - 40 - (lines.length - 1) * px * 1.18;
  ctx.font = `800 24px ${GLOBAL_SANS_STACK}`;
  ctx.fillStyle = th.ac4;
  ctx.fillText(`${festival} · ${brand}`.toUpperCase(), m, headTop - px - 10);
  ctx.font = `800 ${px}px ${DISPLAY_STACK}`;
  lines.forEach((l, i) => {
    const ly = headTop + i * px * 1.18;
    const tw = ctx.measureText(l).width;
    rr(ctx, m - 14, ly - px * 0.88, tw + 28, px * 1.12, 12);
    ctx.fillStyle = accent;
    ctx.fill();
    ctx.fillStyle = "#16100A";
    ctx.fillText(l, m, ly);
  });
  ctx.font = `600 34px ${GLOBAL_SANS_STACK}`;
  ctx.fillStyle = "#F1F5F9";
  sub.forEach((l, i) => ctx.fillText(l, m, y + 20 + i * 46));
  if (index < total - 1) {
    ctx.font = `800 26px ${GLOBAL_SANS_STACK}`;
    ctx.fillStyle = th.ac3;
    ctx.fillText("SWIPE →", m, SH - m);
  }
  return c.toDataURL("image/png");
}

export function downloadDataUrl(dataUrl: string, name: string) {
  const a = document.createElement("a");
  a.href = dataUrl;
  a.download = name;
  document.body.appendChild(a);
  a.click();
  a.remove();
}

const slug = (s: string) => (s || "brand").trim().replace(/[/\\?%*:|"<>]/g, "-").replace(/\s+/g, "-");
const b64 = (dataUrl: string) => dataUrl.split(",")[1];

function captionsText(input: CampaignInput, c: CampaignData): string {
  const concepts = getPosterConcepts(c, input.festival);
  const out = [
    `${input.brand} — ${input.festival} campaign (${input.city})`,
    "",
    `BIG IDEA: ${c.big_idea}`,
    `TAGLINE: ${c.tagline_en}`,
    `TAGLINE (${input.language}): ${c.tagline_regional}`,
    "",
    "POSTERS",
    ...concepts.map((p, i) => `${i + 1}. ${p.concept} — "${p.headline}" / ${p.subline} / CTA: ${p.cta}`),
    "",
    "INSTAGRAM CAROUSEL",
    ...c.instagram_posts.flatMap((p, i) => [`Slide ${i + 1}${p.angle ? ` (${p.angle})` : ""}: ${p.headline ?? ""}`, p.caption, p.hashtags, ""]),
    "REEL",
    c.reel_text ? `On-screen: ${c.reel_text.hook} | ${c.reel_text.line} | ${c.reel_text.cta}  •  Music: ${c.reel_text.music_mood}` : "",
    `Hook (0-3s): ${c.reel_script.hook_0_3s}`,
    `Scene: ${c.reel_script.scene_3_10s}`,
    `CTA: ${c.reel_script.cta_10_15s}`,
    "",
    "BUDGET SPLIT",
    ...c.channel_plan.map((ch) => `${ch.channel}: ${ch.percent_of_budget}% — ${ch.why}`),
  ];
  return out.join("\n");
}

/** Everything in one ZIP: 3 posters, 5 slides, the reel and all the copy. */
export async function downloadCampaignKit(opts: {
  input: CampaignInput;
  campaign: CampaignData;
  posterSeed: number;
  slideImages: (string | undefined)[];
  reel: ReelResult | null;
  onProgress?: (msg: string) => void;
}) {
  const { input, campaign } = opts;
  const zip = new JSZip();
  const concepts = getPosterConcepts(campaign, input.festival);
  for (let i = 0; i < concepts.length; i++) {
    opts.onProgress?.(`Poster ${i + 1}/${concepts.length}`);
    const png = await composePosterPngDataUrl(buildPosterParams(input, campaign, { posterIndex: i, seed: opts.posterSeed }));
    zip.file(`posters/${i + 1}-${slug(concepts[i].concept)}.png`, b64(png), { base64: true });
  }
  const posts = campaign.instagram_posts.slice(0, 5);
  for (let i = 0; i < posts.length; i++) {
    opts.onProgress?.(`Carousel slide ${i + 1}/${posts.length}`);
    const png = await composeSlidePng({
      post: posts[i],
      index: i,
      total: posts.length,
      brand: input.brand,
      festival: input.festival,
      image: opts.slideImages[i],
      accent: campaign.palette?.light,
      seed: opts.posterSeed,
    });
    zip.file(`carousel/slide-${i + 1}.png`, b64(png), { base64: true });
  }
  if (opts.reel) zip.file(`reel/${slug(input.brand)}-reel.${opts.reel.ext}`, opts.reel.blob);
  zip.file("captions-and-copy.txt", captionsText(input, campaign));
  opts.onProgress?.("Zipping");
  const blob = await zip.generateAsync({ type: "blob" });
  const url = URL.createObjectURL(blob);
  downloadDataUrl(url, `${slug(input.brand)}-${slug(input.festival)}-campaign-kit.zip`);
  setTimeout(() => URL.revokeObjectURL(url), 10_000);
}
