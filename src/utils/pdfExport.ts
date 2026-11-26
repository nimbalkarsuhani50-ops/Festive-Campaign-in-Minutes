import { jsPDF } from "jspdf";
import {
  formatBudget,
  getFestivalCountdownText,
  getRegionConfig,
} from "../data/campaigns";
import { getFestivalTheme } from "../data/festivalThemes";
import type { CampaignData, CampaignInput } from "../types";
import {
  GLOBAL_SANS_STACK,
  buildPosterParams,
  composePosterPngDataUrl,
  getPosterConcepts,
} from "./posterExport";

interface PdfExportParams {
  input: CampaignInput;
  campaign: CampaignData;
  /** Kept for backwards compatibility; the budget chart is now drawn natively. */
  chartElement?: HTMLElement | null;
  posterSeed?: number;
}

const PX_PER_MM = 6;
const PAGE_W = 210;
const PAGE_H = 297;
const M = 12;
const CW = PAGE_W - M * 2;

function rgb(hex: string): [number, number, number] {
  const n = parseInt(hex.replace("#", ""), 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

/**
 * Renders text with the browser's font stack so Indic scripts, Arabic, CJK and
 * currency glyphs (₹ € £) come out correctly — jsPDF's built-in fonts can't.
 * Returns the image plus its height in mm.
 */
function textImage(opts: {
  text: string;
  widthMm: number;
  fontPt: number;
  color: string;
  weight?: number;
  family?: string;
  maxLines?: number;
  align?: "left" | "center" | "right";
  rtl?: boolean;
}): { dataUrl: string; heightMm: number } {
  const {
    text,
    widthMm,
    fontPt,
    color,
    weight = 500,
    family = GLOBAL_SANS_STACK,
    maxLines = 6,
    align = "left",
    rtl = false,
  } = opts;
  const widthPx = Math.round(widthMm * PX_PER_MM);
  const fontPx = fontPt * 0.3528 * PX_PER_MM;
  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas context unavailable");
  ctx.font = `${weight} ${fontPx}px ${family}`;
  ctx.direction = rtl ? "rtl" : "ltr";

  const clean = text.replace(/\s+/g, " ").trim();
  const spaced = clean.includes(" ");
  const units = spaced ? clean.split(" ") : Array.from(clean);
  const joiner = spaced ? " " : "";
  const lines: string[] = [];
  let cur = "";
  for (const u of units) {
    const test = cur ? cur + joiner + u : u;
    if (ctx.measureText(test).width <= widthPx || !cur) cur = test;
    else {
      lines.push(cur);
      cur = u;
    }
  }
  if (cur) lines.push(cur);
  const shown = lines.slice(0, maxLines);
  if (lines.length > maxLines) {
    shown[maxLines - 1] = shown[maxLines - 1].replace(/[\s.,;:!-]*$/, "") + "…";
  }

  const lineH = Math.round(fontPx * 1.4);
  const heightPx = Math.max(lineH, shown.length * lineH);
  canvas.width = widthPx;
  canvas.height = heightPx;
  // resizing resets the context
  ctx.font = `${weight} ${fontPx}px ${family}`;
  ctx.fillStyle = color;
  ctx.textBaseline = "middle";
  ctx.direction = rtl ? "rtl" : "ltr";
  ctx.textAlign = align;
  const x = align === "right" ? widthPx - 3 : align === "center" ? widthPx / 2 : 3;
  shown.forEach((l, i) => ctx.fillText(l, x, i * lineH + lineH / 2));
  return { dataUrl: canvas.toDataURL("image/png"), heightMm: heightPx / PX_PER_MM };
}

/** Re-encodes a PNG data URL as JPEG so the PDF stays small. */
function toJpeg(pngDataUrl: string, quality = 0.9): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      const c = document.createElement("canvas");
      c.width = img.width;
      c.height = img.height;
      const g = c.getContext("2d");
      if (!g) return reject(new Error("Canvas unavailable"));
      g.drawImage(img, 0, 0);
      resolve(c.toDataURL("image/jpeg", quality));
    };
    img.onerror = reject;
    img.src = pngDataUrl;
  });
}

export async function exportBoardAsPdf({
  input,
  campaign,
  posterSeed,
}: PdfExportParams): Promise<void> {
  if (document.fonts?.load) {
    await Promise.all([
      document.fonts.load(`800 40px "Playfair Display"`),
      document.fonts.load(`700 30px "Plus Jakarta Sans"`),
      document.fonts.load(`500 30px "Plus Jakarta Sans"`),
    ]).catch(() => undefined);
  }
  if (document.fonts?.ready) await document.fonts.ready;

  const th = getFestivalTheme(input.festival);
  const market = input.market ?? "India";
  const regionCfg = getRegionConfig(market, input.region);
  const isRtl = input.language === "Arabic" || input.language === "Urdu";
  const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4", compress: true });

  let y = 0;
  let pageNo = 0;

  const paintPage = () => {
    pageNo += 1;
    doc.setFillColor(...rgb(th.bg0));
    doc.rect(0, 0, PAGE_W, PAGE_H, "F");
    doc.setFillColor(...rgb(th.ac));
    doc.rect(0, 0, PAGE_W, 2.2, "F");
    doc.setFillColor(...rgb(th.ac2));
    doc.rect(0, 2.2, PAGE_W, 0.5, "F");
    const foot = textImage({
      text: `${input.brand}  •  ${input.festival} campaign board  •  page ${pageNo}`,
      widthMm: CW,
      fontPt: 7.5,
      color: "#94A3B8",
      align: "center",
      maxLines: 1,
    });
    doc.addImage(foot.dataUrl, "PNG", M, PAGE_H - 9, CW, foot.heightMm);
    y = 12;
  };
  const newPage = () => {
    doc.addPage();
    paintPage();
  };
  const need = (h: number) => {
    if (y + h > PAGE_H - 14) newPage();
  };

  const card = (x: number, yy: number, w: number, h: number) => {
    doc.setFillColor(...rgb(th.bg1));
    doc.setDrawColor(...rgb(th.ac2));
    doc.setLineWidth(0.3);
    doc.roundedRect(x, yy, w, h, 2.5, 2.5, "FD");
  };

  const label = (text: string, x: number, yy: number, w = 80) => {
    const img = textImage({ text: text.toUpperCase(), widthMm: w, fontPt: 7.5, weight: 800, color: th.ac2, maxLines: 1 });
    doc.addImage(img.dataUrl, "PNG", x, yy, w, img.heightMm);
    return img.heightMm;
  };

  const para = (
    text: string,
    x: number,
    yy: number,
    w: number,
    o: { pt?: number; color?: string; weight?: number; family?: string; lines?: number; align?: "left" | "center" | "right"; rtl?: boolean } = {}
  ) => {
    const img = textImage({
      text,
      widthMm: w,
      fontPt: o.pt ?? 9.5,
      color: o.color ?? "#E8ECF4",
      weight: o.weight ?? 500,
      family: o.family,
      maxLines: o.lines ?? 6,
      align: o.align,
      rtl: o.rtl,
    });
    doc.addImage(img.dataUrl, "PNG", x, yy, w, img.heightMm);
    return img.heightMm;
  };

  // ===== PAGE 1: cover =====
  paintPage();
  const countdown = getFestivalCountdownText(input.festival);
  const loc = input.region ? `${input.city}, ${input.region}` : input.city;

  para(`${input.festival.toUpperCase()}  •  ${countdown}`, M, y, CW, { pt: 9, weight: 800, color: th.ac3, lines: 1 });
  y += 6.5;
  y += para(input.brand, M, y, CW, { pt: 30, weight: 800, family: `"Playfair Display", ${GLOBAL_SANS_STACK}`, color: "#FFFFFF", lines: 1 });
  y += 1;
  y += para(
    `${loc}  •  ${input.language}  •  Audience: ${input.audience}  •  Budget: ${formatBudget(input.budget, market, input.region)}`,
    M, y, CW, { pt: 9, color: "#CBD5E1", lines: 2 }
  );
  y += 4;

  // Poster (left) + big idea / taglines (right)
  const posterW = 88;
  const posterH = (posterW * 5) / 4;
  const posterUrl = await toJpeg(
    await composePosterPngDataUrl(
      buildPosterParams(input, campaign, { seed: posterSeed, aspectRatio: "instagram_feed" })
    )
  );
  doc.addImage(posterUrl, "JPEG", M, y, posterW, posterH);
  doc.setDrawColor(...rgb(th.ac2));
  doc.setLineWidth(0.5);
  doc.rect(M, y, posterW, posterH, "D");

  const rx = M + posterW + 6;
  const rw = CW - posterW - 6;
  let ry = y;

  // Taglines card sized to its content; big idea fills the rest of the poster height.
  const enImg = textImage({ text: campaign.tagline_en, widthMm: rw - 8, fontPt: 10.5, weight: 800, color: th.ac3, maxLines: 2 });
  const regImg = textImage({ text: campaign.tagline_regional, widthMm: rw - 8, fontPt: 10.5, weight: 700, color: th.ac4, maxLines: 3, align: isRtl ? "right" : "left", rtl: isRtl });
  const tagCardH = 12 + enImg.heightMm + 1 + regImg.heightMm + 4;
  const ideaH = posterH - tagCardH - 4;

  card(rx, ry, rw, ideaH);
  label("The big idea", rx + 4, ry + 4, rw - 8);
  para(campaign.big_idea, rx + 4, ry + 12, rw - 8, { pt: 14, weight: 800, color: "#FFFFFF", family: `"Playfair Display", ${GLOBAL_SANS_STACK}`, lines: 9 });
  ry += ideaH + 4;

  card(rx, ry, rw, tagCardH);
  label("Taglines", rx + 4, ry + 4, rw - 8);
  doc.addImage(enImg.dataUrl, "PNG", rx + 4, ry + 11, rw - 8, enImg.heightMm);
  doc.addImage(regImg.dataUrl, "PNG", rx + 4, ry + 12 + enImg.heightMm, rw - 8, regImg.heightMm);
  y += posterH + 6;

  // Reel script: three columns
  const colW = (CW - 8 - 8) / 3;
  const reel = [
    ["HOOK", campaign.reel_script.hook_0_3s],
    ["SCENE", campaign.reel_script.scene_3_10s],
    ["CALL TO ACTION", campaign.reel_script.cta_10_15s],
  ] as const;
  const reelImgs = reel.map(([, t]) => textImage({ text: t, widthMm: colW, fontPt: 8.5, color: "#E2E8F0", maxLines: 9 }));
  const voImg = campaign.reel_text?.voiceover
    ? textImage({ text: `Voiceover: “${campaign.reel_text.voiceover}”`, widthMm: CW - 8, fontPt: 8.5, weight: 600, color: th.ac4, maxLines: 3, rtl: /[\u0590-\u08FF]/.test(campaign.reel_text.voiceover), align: /[\u0590-\u08FF]/.test(campaign.reel_text.voiceover) ? "right" : "left" })
    : null;
  const reelH = 16 + Math.max(...reelImgs.map((i) => i.heightMm)) + 2 + (voImg ? voImg.heightMm + 3 : 0);
  need(reelH + 4);
  card(M, y, CW, reelH);
  label(campaign.reel_text?.voiceover ? "Reel script & voiceover" : "Reel script", M + 4, y + 4, CW - 8);
  reel.forEach(([tag], i) => {
    const x = M + 4 + i * (colW + 4);
    para(tag, x, y + 10.5, colW, { pt: 7.5, weight: 800, color: th.ac, lines: 1 });
    doc.addImage(reelImgs[i].dataUrl, "PNG", x, y + 15, colW, reelImgs[i].heightMm);
  });
  if (voImg) doc.addImage(voImg.dataUrl, "PNG", M + 4, y + reelH - voImg.heightMm - 3, CW - 8, voImg.heightMm);
  y += reelH + 6;

  // Channel budget — native bars (no chart library needed)
  const rows = campaign.channel_plan.slice(0, 5);
  const planH = 13 + rows.length * 11.5;
  need(planH + 4);
  card(M, y, CW, planH);
  label(`Channel budget split  (${regionCfg.currencyCode})`, M + 4, y + 4, CW - 8);
  let by = y + 12;
  rows.forEach((item, i) => {
    const amount = Math.round((item.percent_of_budget * input.budget) / 100);
    para(item.channel, M + 4, by, 70, { pt: 8.5, weight: 800, color: "#FFFFFF", lines: 1 });
    para(`${item.percent_of_budget}%  •  ${regionCfg.currencySymbol}${amount.toLocaleString(regionCfg.locale)}`, M + CW - 64, by, 60, { pt: 8.5, weight: 800, color: th.ac3, lines: 1, align: "right" });
    const barW = CW - 8;
    doc.setFillColor(255, 255, 255);
    doc.setGState?.(new (doc as any).GState({ opacity: 0.08 }));
    doc.roundedRect(M + 4, by + 5.2, barW, 2.6, 1.3, 1.3, "F");
    doc.setGState?.(new (doc as any).GState({ opacity: 1 }));
    doc.setFillColor(...rgb(i % 2 ? th.ac2 : th.ac));
    doc.roundedRect(M + 4, by + 5.2, Math.max(2, (barW * item.percent_of_budget) / 100), 2.6, 1.3, 1.3, "F");
    by += 11.5;
  });
  y += planH + 6;

  // ===== PAGE 2: the three posters, then the carousel =====
  newPage();
  para("READY-TO-POST POSTERS", M, y, CW, { pt: 8, weight: 800, color: th.ac3, lines: 1 });
  y += 6;
  y += para("Three posters, three concepts", M, y, CW, { pt: 18, weight: 800, family: `"Playfair Display", ${GLOBAL_SANS_STACK}`, color: "#FFFFFF", lines: 1 }) + 3;
  const concepts = getPosterConcepts(campaign, input.festival);
  const pw = (CW - 8) / 3;
  const ph = (pw * 5) / 4;
  for (let i = 0; i < concepts.length; i++) {
    const x = M + i * (pw + 4);
    const jpg = await toJpeg(
      await composePosterPngDataUrl(buildPosterParams(input, campaign, { posterIndex: i, seed: posterSeed, aspectRatio: "instagram_feed" })),
      0.86
    );
    doc.addImage(jpg, "JPEG", x, y, pw, ph);
    doc.setDrawColor(...rgb(th.ac2));
    doc.setLineWidth(0.3);
    doc.rect(x, y, pw, ph, "D");
    para(`${i + 1}. ${concepts[i].concept}`, x, y + ph + 2, pw, { pt: 8.5, weight: 800, color: "#FFFFFF", lines: 1 });
    para(`${concepts[i].layout}  •  ${concepts[i].cta}`, x, y + ph + 6.5, pw, { pt: 7.5, color: "#94A3B8", lines: 1 });
  }
  y += ph + 15;

  para("INSTAGRAM CAROUSEL", M, y, CW, { pt: 8, weight: 800, color: th.ac3, lines: 1 });
  y += 6;
  need(40);
  y += para(`${campaign.instagram_posts.length} slides, one story`, M, y, CW, { pt: 18, weight: 800, family: `"Playfair Display", ${GLOBAL_SANS_STACK}`, color: "#FFFFFF", lines: 1 }) + 3;

  campaign.instagram_posts.forEach((post, idx) => {
    const head = post.headline || post.angle || `Slide ${idx + 1}`;
    const capImg = textImage({ text: post.caption, widthMm: CW - 24, fontPt: 9.5, color: "#E8ECF4", maxLines: 5 });
    const tagImg = textImage({ text: post.hashtags, widthMm: CW - 24, fontPt: 8.5, weight: 700, color: th.ac3, maxLines: 2 });
    const h = 14 + capImg.heightMm + tagImg.heightMm + 4;
    need(h + 4);
    card(M, y, CW, h);
    doc.setFillColor(...rgb(th.ac));
    doc.circle(M + 8, y + 8, 4.2, "F");
    para(String(idx + 1), M + 3.8, y + 5.4, 8.4, { pt: 10, weight: 800, color: "#16100A", align: "center", lines: 1 });
    const tag = post.angle ? `${post.angle.toUpperCase()}  •  ` : "";
    para(`${tag}${head}`, M + 16, y + 5, CW - 22, { pt: 10.5, weight: 800, color: "#FFFFFF", lines: 1 });
    doc.addImage(capImg.dataUrl, "PNG", M + 16, y + 12, CW - 24, capImg.heightMm);
    doc.addImage(tagImg.dataUrl, "PNG", M + 16, y + 13 + capImg.heightMm, CW - 24, tagImg.heightMm);
    y += h + 4;
  });

  const brandSlug = (input.brand || "campaign").trim().replace(/[/\\?%*:|"<>]/g, "-").replace(/\s+/g, "-");
  const festivalSlug = input.festival.replace(/\s+/g, "-");
  doc.save(`${brandSlug}-${festivalSlug}-campaign-board.pdf`);
}
