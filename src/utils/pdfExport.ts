import {
  formatBudget,
  getFestivalCountdownText,
  getRegionConfig,
} from "../data/campaigns";
import type { CampaignData, CampaignInput } from "../types";
import { composePosterPngDataUrl, GLOBAL_SANS_STACK } from "./posterExport";

interface PdfExportParams {
  input: CampaignInput;
  campaign: CampaignData;
  chartElement: HTMLElement | null;
  posterSeed?: number;
}

function renderUnicodeTextToPng(options: {
  text: string;
  fontSizePx: number;
  fontWeight?: string;
  color: string;
  bgColor: string;
  widthPx: number;
  maxLines?: number;
  align?: CanvasTextAlign;
  isRtl?: boolean;
}): { dataUrl: string; heightPx: number } {
  const {
    text,
    fontSizePx,
    fontWeight = "600",
    color,
    bgColor,
    widthPx,
    maxLines = 2,
    align = "left",
    isRtl = false,
  } = options;

  const scale = 2;
  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d");
  if (!ctx) {
    throw new Error("Canvas context unavailable");
  }

  const fontSpec = `${fontWeight} ${fontSizePx}px ${GLOBAL_SANS_STACK}`;
  ctx.font = fontSpec;
  ctx.direction = isRtl ? "rtl" : "ltr";

  const clean = text.trim();
  const words = clean.split(/\s+/);
  const lines: string[] = [];

  if (words.length === 1 && ctx.measureText(clean).width > widthPx - 8) {
    let current = "";
    for (const ch of Array.from(clean)) {
      const test = current + ch;
      if (ctx.measureText(test).width <= widthPx - 8) {
        current = test;
      } else {
        if (current) lines.push(current);
        current = ch;
      }
    }
    if (current) lines.push(current);
  } else {
    let current = "";
    for (const word of words) {
      const test = current ? `${current} ${word}` : word;
      if (ctx.measureText(test).width <= widthPx - 8) {
        current = test;
      } else {
        if (current) lines.push(current);
        current = word;
      }
    }
    if (current) lines.push(current);
  }

  const clipped = lines.slice(0, maxLines);
  const lineHeight = Math.round(fontSizePx * 1.4);
  const heightPx = Math.max(lineHeight, clipped.length * lineHeight + 4);

  canvas.width = widthPx * scale;
  canvas.height = heightPx * scale;
  ctx.scale(scale, scale);

  ctx.fillStyle = bgColor;
  ctx.fillRect(0, 0, widthPx, heightPx);

  ctx.font = fontSpec;
  ctx.fillStyle = color;
  ctx.textAlign = align;
  ctx.textBaseline = "top";
  ctx.direction = isRtl ? "rtl" : "ltr";

  const xPos =
    align === "right" ? widthPx - 4 : align === "center" ? widthPx / 2 : 4;
  clipped.forEach((line, idx) => {
    ctx.fillText(line, xPos, idx * lineHeight + 2);
  });

  return { dataUrl: canvas.toDataURL("image/png"), heightPx };
}

function truncateText(text: string, maxChars: number): string {
  const clean = text.replace(/\s+/g, " ").trim();
  if (clean.length <= maxChars) return clean;
  return `${clean.slice(0, maxChars - 1).trim()}…`;
}

export async function exportBoardAsPdf({
  input,
  campaign,
  chartElement,
  posterSeed,
}: PdfExportParams): Promise<void> {
  if (!window.jspdf?.jsPDF) {
    throw new Error("PDF library is still loading. Please try again in a moment.");
  }

  if (document.fonts?.ready) {
    await document.fonts.ready;
  }

  const market = input.market ?? "India";
  const regionCfg = getRegionConfig(market, input.region);
  const isRtl = input.language === "Arabic" || input.language === "Urdu";

  const doc = new window.jspdf.jsPDF({
    orientation: "portrait",
    unit: "mm",
    format: "a4",
  });

  const pageW = doc.internal.pageSize.getWidth(); // 210mm
  const pageH = doc.internal.pageSize.getHeight(); // 297mm
  const margin = 10;
  const contentW = pageW - margin * 2; // 190mm

  // Deep navy stage canvas background
  doc.setFillColor(13, 21, 38); // #0D1526
  doc.rect(0, 0, pageW, pageH, "F");

  // 1. HEADER BAR
  doc.setFillColor(21, 35, 63); // #15233F
  doc.setDrawColor(212, 175, 55); // #D4AF37
  doc.setLineWidth(0.35);
  doc.roundedRect(margin, 10, contentW, 23, 2, 2, "FD");

  doc.setFont("helvetica", "bold");
  doc.setFontSize(16);
  doc.setTextColor(255, 255, 255);
  doc.text(truncateText(input.brand, 40), margin + 5, 19);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(9.5);
  doc.setTextColor(212, 175, 55);
  const countdown = getFestivalCountdownText(input.festival);
  const locationLabel = input.region ? `${input.city}, ${input.region}` : input.city;
  doc.text(
    truncateText(`${input.festival} (${countdown})  •  ${locationLabel}  •  ${input.language}`, 74),
    margin + 5,
    26.5
  );

  // Render formatted regional currency budget via canvas so ₹ / € / £ / AED glyphs render cleanly
  const budgetImg = renderUnicodeTextToPng({
    text: `Budget: ${formatBudget(input.budget, market, input.region)}`,
    fontSizePx: 22,
    fontWeight: "700",
    color: "#F28C38",
    bgColor: "#15233F",
    widthPx: 360,
    maxLines: 1,
    align: "right",
  });
  const budgetWmm = 64;
  const budgetHmm = (budgetImg.heightPx / 360) * budgetWmm;
  doc.addImage(
    budgetImg.dataUrl,
    "PNG",
    pageW - margin - budgetWmm - 4,
    13.5,
    budgetWmm,
    budgetHmm
  );

  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  doc.setTextColor(203, 213, 225);
  doc.text(
    truncateText(`Audience: ${input.audience}`, 48),
    pageW - margin - 5,
    26.5,
    { align: "right" }
  );

  // 2. MAIN TWO-COLUMN BODY (y = 37 to 180)
  const leftW = 108;
  const rightX = margin + leftW + 4; // 122mm
  const rightW = contentW - leftW - 4; // 78mm

  // Left Col - Big Idea Card (y=37, h=33)
  doc.setFillColor(21, 35, 63);
  doc.roundedRect(margin, 37, leftW, 33, 2, 2, "FD");
  doc.setFont("helvetica", "bold");
  doc.setFontSize(8);
  doc.setTextColor(212, 175, 55);
  doc.text("BIG IDEA", margin + 4, 43);

  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  doc.setTextColor(255, 255, 255);
  const bigIdeaLines = doc.splitTextToSize(campaign.big_idea, leftW - 8).slice(0, 4);
  doc.text(bigIdeaLines, margin + 4, 49.5);

  // Left Col - Taglines Card (y=73, h=31)
  doc.setFillColor(22, 35, 63);
  doc.roundedRect(margin, 73, leftW, 31, 2, 2, "FD");
  doc.setFont("helvetica", "bold");
  doc.setFontSize(8);
  doc.setTextColor(212, 175, 55);
  doc.text("TAGLINES", margin + 4, 79);

  doc.setFont("helvetica", "bold");
  doc.setFontSize(10);
  doc.setTextColor(242, 140, 56);
  const enLines = doc.splitTextToSize(campaign.tagline_en, leftW - 8).slice(0, 2);
  doc.text(enLines, margin + 4, 85);

  const regionalWidthPx = 620;
  const regionalImg = renderUnicodeTextToPng({
    text: campaign.tagline_regional,
    fontSizePx: 22,
    fontWeight: "600",
    color: "#F28C38",
    bgColor: "#16233F",
    widthPx: regionalWidthPx,
    maxLines: 2,
    align: isRtl ? "right" : "left",
    isRtl,
  });
  const regWmm = leftW - 8;
  const regHmm = Math.min(11, (regionalImg.heightPx / regionalWidthPx) * regWmm);
  doc.addImage(regionalImg.dataUrl, "PNG", margin + 4, 93, regWmm, regHmm);

  // Left Col - 3 Instagram Captions (y=107, h=51)
  doc.setFillColor(22, 35, 63);
  doc.roundedRect(margin, 107, leftW, 51, 2, 2, "FD");
  doc.setFont("helvetica", "bold");
  doc.setFontSize(8);
  doc.setTextColor(212, 175, 55);
  doc.text("INSTAGRAM CAPTIONS", margin + 4, 113);

  let capY = 119;
  campaign.instagram_posts.slice(0, 3).forEach((post, idx) => {
    doc.setFont("helvetica", "bold");
    doc.setFontSize(8.5);
    doc.setTextColor(242, 140, 56);
    doc.text(`${idx + 1}.`, margin + 4, capY);

    doc.setFont("helvetica", "normal");
    doc.setFontSize(8.2);
    doc.setTextColor(241, 245, 249);
    const shortCap = truncateText(post.caption, 115);
    const capLines = doc.splitTextToSize(shortCap, leftW - 14).slice(0, 2);
    doc.text(capLines, margin + 9, capY);
    capY += 12.5;
  });

  // Left Col - Condensed 1-line Reel Script (y=161, h=20)
  doc.setFillColor(22, 35, 63);
  doc.roundedRect(margin, 161, leftW, 20, 2, 2, "FD");
  doc.setFont("helvetica", "bold");
  doc.setFontSize(8);
  doc.setTextColor(212, 175, 55);
  doc.text("15-SEC REEL SCRIPT", margin + 4, 166.5);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(7.6);
  doc.setTextColor(226, 232, 240);
  const oneLineReel = `0-3s: ${truncateText(campaign.reel_script.hook_0_3s, 48)} | 3-10s: ${truncateText(campaign.reel_script.scene_3_10s, 58)} | 10-15s: ${truncateText(campaign.reel_script.cta_10_15s, 48)}`;
  const reelLines = doc.splitTextToSize(oneLineReel, leftW - 8).slice(0, 3);
  doc.text(reelLines, margin + 4, 171.5);

  // Right Col - Composed 4:5 Poster PNG (x=122, y=37, w=78, h=97.5)
  const posterDataUrl = await composePosterPngDataUrl({
    festival: input.festival,
    brand: input.brand,
    taglineEn:
      input.language !== "English" && campaign.tagline_regional
        ? campaign.tagline_regional
        : campaign.tagline_en,
    seed: posterSeed,
    stylePreset: input.stylePreset,
    aspectRatio: "instagram_feed",
    isRtl: input.language !== "English" && isRtl,
  });
  const posterW = rightW;
  const posterH = (posterW * 5) / 4; // 97.5mm
  doc.addImage(posterDataUrl, "PNG", rightX, 37, posterW, posterH);
  doc.setDrawColor(212, 175, 55);
  doc.rect(rightX, 37, posterW, posterH, "D");

  // Right Col - Channel Allocation Table under poster (y=137.5, h=43.5)
  doc.setFillColor(22, 35, 63);
  doc.roundedRect(rightX, 137.5, rightW, 43.5, 2, 2, "FD");
  doc.setFont("helvetica", "bold");
  doc.setFontSize(8);
  doc.setTextColor(212, 175, 55);
  doc.text("BUDGET SPLIT", rightX + 4, 143);

  let chY = 149;
  campaign.channel_plan.slice(0, 5).forEach((item) => {
    const amount = Math.round((item.percent_of_budget * input.budget) / 100);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(7.8);
    doc.setTextColor(241, 245, 249);
    doc.text(truncateText(item.channel, 24), rightX + 4, chY);

    doc.setFont("helvetica", "bold");
    doc.setTextColor(242, 140, 56);
    doc.text(
      `${item.percent_of_budget}% (${regionCfg.currencyCode} ${amount.toLocaleString(regionCfg.locale)})`,
      rightX + rightW - 4,
      chY,
      { align: "right" }
    );
    chY += 6.2;
  });

  // 3. BOTTOM CHANNEL CHART IMAGE (y=185, h=100, w=190)
  doc.setFillColor(22, 35, 63);
  doc.setDrawColor(212, 175, 55);
  doc.roundedRect(margin, 185, contentW, 99, 2, 2, "FD");
  doc.setFont("helvetica", "bold");
  doc.setFontSize(8.5);
  doc.setTextColor(212, 175, 55);
  doc.text("CHANNEL BUDGET ALLOCATION", margin + 4, 191);

  if (chartElement && window.Plotly?.toImage) {
    const chartImgData = await window.Plotly.toImage(chartElement, {
      format: "png",
      width: 1100,
      height: 500,
    });
    doc.addImage(chartImgData, "PNG", margin + 3, 193, contentW - 6, 88);
  }

  // Footer
  doc.setFont("helvetica", "normal");
  doc.setFontSize(7.5);
  doc.setTextColor(148, 163, 184);
  doc.text(
    "Festive Campaign Board  •  #DYPAICoE Launch, Dr. D. Y. Patil B-School, Pune",
    pageW / 2,
    291,
    { align: "center" }
  );

  const brandSlug = (input.brand || "campaign")
    .trim()
    .replace(/[/\\?%*:|"<>]/g, "-")
    .replace(/\s+/g, "-");
  const festivalSlug = input.festival.replace(/\s+/g, "-");
  doc.save(`${brandSlug}-${festivalSlug}-campaign-board.pdf`);
}
