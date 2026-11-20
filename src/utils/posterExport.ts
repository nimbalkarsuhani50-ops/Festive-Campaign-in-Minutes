import { getAspectRatioSpec } from "../data/campaigns";
import { makePosterSVG } from "../posters.js";
import type { PosterAspectRatio, StylePreset } from "../types";

export interface PosterCompositionParams {
  festival: string;
  brand: string;
  taglineEn: string;
  seed?: number;
  stylePreset?: StylePreset;
  aspectRatio?: PosterAspectRatio;
  isRtl?: boolean;
}

export interface PosterBandStyle {
  bandBg: string;
  dividerColor: string;
  festivalLabelColor: string;
  brandColor: string;
  taglineColor: string;
  brandFontFamily: string;
}

export const GLOBAL_SANS_STACK =
  '"Plus Jakarta Sans", "Noto Sans Devanagari", "Noto Sans Tamil", "Noto Sans Telugu", "Noto Sans Bengali", "Noto Sans Kannada", "Noto Sans Malayalam", "Noto Sans Gujarati", "Noto Sans Gurmukhi", "Noto Sans Oriya", "Noto Sans Arabic", "Noto Sans SC", "Noto Sans JP", system-ui, sans-serif';

export function getPosterBandStyle(
  stylePreset: StylePreset = "Festive Gold"
): PosterBandStyle {
  switch (stylePreset) {
    case "Elegant":
      return {
        bandBg: "#11131A",
        dividerColor: "#E2C799",
        festivalLabelColor: "#C9A46C",
        brandColor: "#F8F4EC",
        taglineColor: "#E2C799",
        brandFontFamily: `"Playfair Display", ${GLOBAL_SANS_STACK}`,
      };
    case "Vibrant":
      return {
        bandBg: "#1E1038",
        dividerColor: "#F28C38",
        festivalLabelColor: "#F472B6",
        brandColor: "#FFFFFF",
        taglineColor: "#FDE047",
        brandFontFamily: GLOBAL_SANS_STACK,
      };
    case "Minimal":
      return {
        bandBg: "#FAF8F5",
        dividerColor: "#15233F",
        festivalLabelColor: "#64748B",
        brandColor: "#15233F",
        taglineColor: "#C25E0A",
        brandFontFamily: `"Playfair Display", ${GLOBAL_SANS_STACK}`,
      };
    case "Festive Gold":
    default:
      return {
        bandBg: "#15233F",
        dividerColor: "#D4AF37",
        festivalLabelColor: "#D4AF37",
        brandColor: "#FFFFFF",
        taglineColor: "#F28C38",
        brandFontFamily: `"Playfair Display", ${GLOBAL_SANS_STACK}`,
      };
  }
}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = (err) => reject(err);
    img.src = src;
  });
}

function wrapTextLines(
  ctx: CanvasRenderingContext2D,
  text: string,
  maxWidth: number
): string[] {
  const clean = text.trim();
  if (!clean) return [];
  const words = clean.split(/\s+/);
  // Handle CJK strings without spaces gracefully
  if (words.length === 1 && ctx.measureText(clean).width > maxWidth) {
    const chars = Array.from(clean);
    const lines: string[] = [];
    let current = "";
    for (const ch of chars) {
      const test = current + ch;
      if (ctx.measureText(test).width <= maxWidth) {
        current = test;
      } else {
        if (current) lines.push(current);
        current = ch;
      }
    }
    if (current) lines.push(current);
    return lines;
  }

  const lines: string[] = [];
  let currentLine = "";

  for (const word of words) {
    const testLine = currentLine ? `${currentLine} ${word}` : word;
    if (ctx.measureText(testLine).width <= maxWidth) {
      currentLine = testLine;
    } else {
      if (currentLine) {
        lines.push(currentLine);
      }
      currentLine = word;
    }
  }
  if (currentLine) {
    lines.push(currentLine);
  }
  return lines;
}

export async function composePosterPngDataUrl({
  festival,
  brand,
  taglineEn,
  seed = 7,
  stylePreset = "Festive Gold",
  aspectRatio = "instagram_feed",
  isRtl = false,
}: PosterCompositionParams): Promise<string> {
  if (document.fonts?.ready) {
    await document.fonts.ready;
  }

  const spec = getAspectRatioSpec(aspectRatio);
  const { width, height } = spec;

  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;

  const ctx = canvas.getContext("2d");
  if (!ctx) {
    throw new Error("Could not initialize 2D canvas context.");
  }

  const svgString = makePosterSVG(festival, seed, stylePreset, aspectRatio);
  const svgBlob = new Blob([svgString], {
    type: "image/svg+xml;charset=utf-8",
  });
  const svgUrl = URL.createObjectURL(svgBlob);

  try {
    const img = await loadImage(svgUrl);
    ctx.drawImage(img, 0, 0, width, height);
  } finally {
    URL.revokeObjectURL(svgUrl);
  }

  const bandStyle = getPosterBandStyle(stylePreset);

  // Bottom brand band (~16% of poster height)
  const bandHeight = Math.round(height * 0.16);
  const bandY = height - bandHeight;
  const isVertical = height > 1500;

  ctx.fillStyle = bandStyle.bandBg;
  ctx.fillRect(0, bandY, width, bandHeight);

  // Crisp divider line along top edge of the band
  ctx.fillStyle = bandStyle.dividerColor;
  ctx.fillRect(0, bandY, width, 4);

  const maxTextWidth = width - 112;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";

  // Small festival eyebrow label
  ctx.font = `600 ${isVertical ? 22 : 18}px ${GLOBAL_SANS_STACK}`;
  ctx.fillStyle = bandStyle.festivalLabelColor;
  ctx.fillText(festival.toUpperCase(), width / 2, bandY + bandHeight * 0.19);

  // Exact brand name as typed
  const displayBrand = brand.trim() || "Brand Name";
  let brandFontSize = isVertical ? 66 : 56;
  while (brandFontSize > 28) {
    ctx.font = `700 ${brandFontSize}px ${bandStyle.brandFontFamily}`;
    if (ctx.measureText(displayBrand).width <= maxTextWidth) {
      break;
    }
    brandFontSize -= 2;
  }

  ctx.fillStyle = bandStyle.brandColor;
  ctx.fillText(displayBrand, width / 2, bandY + bandHeight * 0.48);

  // Poster tagline (English or selected global/regional language)
  const displayTagline = taglineEn.trim();
  ctx.direction = isRtl ? "rtl" : "ltr";
  let taglineFontSize = isVertical ? 32 : 27;
  ctx.font = `500 ${taglineFontSize}px ${GLOBAL_SANS_STACK}`;
  let taglineLines = wrapTextLines(ctx, displayTagline, maxTextWidth);

  if (taglineLines.length > 2) {
    taglineFontSize = isVertical ? 26 : 22;
    ctx.font = `500 ${taglineFontSize}px ${GLOBAL_SANS_STACK}`;
    taglineLines = wrapTextLines(ctx, displayTagline, maxTextWidth).slice(0, 2);
  }

  ctx.fillStyle = bandStyle.taglineColor;
  if (taglineLines.length <= 1) {
    ctx.fillText(taglineLines[0] ?? "", width / 2, bandY + bandHeight * 0.79);
  } else {
    ctx.fillText(taglineLines[0], width / 2, bandY + bandHeight * 0.73);
    ctx.fillText(taglineLines[1], width / 2, bandY + bandHeight * 0.89);
  }
  ctx.direction = "ltr";

  return canvas.toDataURL("image/png");
}

function sanitizeFileSegment(value: string): string {
  return value
    .trim()
    .replace(/[/\\?%*:|"<>]/g, "-")
    .replace(/\s+/g, "-");
}

export async function downloadPosterPng(
  params: PosterCompositionParams
): Promise<void> {
  const dataUrl = await composePosterPngDataUrl(params);
  const brandSlug = sanitizeFileSegment(params.brand || "brand");
  const festivalSlug = sanitizeFileSegment(params.festival || "festival");
  const ratioSlug = sanitizeFileSegment(
    params.aspectRatio ?? "instagram_feed"
  ).replace(/_/g, "-");

  const link = document.createElement("a");
  link.href = dataUrl;
  link.download = `${brandSlug}-${festivalSlug}-${ratioSlug}.png`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}
