import { Download, Loader2, RefreshCw } from "lucide-react";
import { AnimatePresence, motion, useInView } from "motion/react";
import { sparkleFrom } from "../fx/celebrate";
import { Magnetic, Reveal, SectionHeading } from "../fx/primitives";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  POSTER_ASPECT_RATIOS,
  getAspectRatioSpec,
} from "../data/campaigns";
import { makePosterSVG } from "../posters.js";
import type {
  FestivalName,
  PosterAspectRatio,
  RegionalLanguage,
  StylePreset,
} from "../types";
import { downloadPosterPng, getPosterBandStyle } from "../utils/posterExport";

interface PosterSectionProps {
  festival: FestivalName;
  brand: string;
  taglineEn: string;
  taglineRegional: string;
  language: RegionalLanguage;
  posterPrompt: string;
  stylePreset: StylePreset;
  aspectRatio: PosterAspectRatio;
  posterSeed: number;
  revealKey: number;
  onChangeAspectRatio: (ratio: PosterAspectRatio) => void;
  onRegenerateVariation: () => void;
}

export function PosterSection({
  festival,
  brand,
  taglineEn,
  taglineRegional,
  language,
  posterPrompt,
  stylePreset,
  aspectRatio,
  posterSeed,
  revealKey,
  onChangeAspectRatio,
  onRegenerateVariation,
}: PosterSectionProps) {
  const [isDownloading, setIsDownloading] = useState(false);
  const [tilt, setTilt] = useState<{ rx: number; ry: number }>({ rx: 0, ry: 0 });
  const [glare, setGlare] = useState<{ x: number; y: number; on: boolean }>({ x: 50, y: 50, on: false });
  const downloadRef = useRef<HTMLButtonElement | null>(null);
  const stageRef = useRef<HTMLDivElement | null>(null);
  const stageInView = useInView(stageRef, { once: true, amount: 0.35 });
  const [posterCopyLang, setPosterCopyLang] = useState<"regional" | "english">(
    language !== "English" ? "regional" : "english"
  );

  useEffect(() => {
    setPosterCopyLang(language !== "English" ? "regional" : "english");
  }, [language]);

  const ratioSpec = getAspectRatioSpec(aspectRatio);
  const isVertical = aspectRatio !== "instagram_feed";
  const showRegional =
    language !== "English" &&
    posterCopyLang === "regional" &&
    Boolean(taglineRegional.trim());

  const activeTagline = showRegional ? taglineRegional : taglineEn;
  const isRtl =
    showRegional && (language === "Arabic" || language === "Urdu");

  const posterSvg = useMemo(() => {
    const rawSvg = makePosterSVG(festival, posterSeed, stylePreset, aspectRatio);
    return rawSvg.replace(
      "<svg ",
      '<svg style="width:100%;height:100%;display:block;" '
    );
  }, [festival, posterSeed, stylePreset, aspectRatio]);

  const bandStyle = useMemo(
    () => getPosterBandStyle(stylePreset),
    [stylePreset]
  );

  async function handleDownload() {
    setIsDownloading(true);
    try {
      await downloadPosterPng({
        festival,
        brand,
        taglineEn: activeTagline,
        seed: posterSeed,
        stylePreset,
        aspectRatio,
        isRtl,
      });
      sparkleFrom(downloadRef.current, 40);
    } finally {
      setIsDownloading(false);
    }
  }

  function handlePointerMove(e: React.MouseEvent<HTMLDivElement>) {
    const rect = e.currentTarget.getBoundingClientRect();
    const px = (e.clientX - rect.left) / rect.width - 0.5;
    const py = (e.clientY - rect.top) / rect.height - 0.5;
    setTilt({
      rx: Number((-py * 14).toFixed(2)),
      ry: Number((px * 14).toFixed(2)),
    });
    setGlare({ x: (px + 0.5) * 100, y: (py + 0.5) * 100, on: true });
  }

  function handlePointerLeave() {
    setTilt({ rx: 0, ry: 0 });
    setGlare((g) => ({ ...g, on: false }));
  }

  const curtainKey = `${revealKey}-${posterSeed}-${stylePreset}-${festival}-${aspectRatio}`;

  return (
    <section id="poster-section" aria-label="Campaign Poster" className="scroll-section space-y-7">
      <SectionHeading
        index="07"
        kicker="Print & social ready"
        title="The Poster"
        right={
        <div className="flex flex-wrap items-center gap-2.5">
          <button
            type="button"
            onClick={onRegenerateVariation}
            className="inline-flex items-center gap-2 rounded-xl border border-white/15 bg-white/[0.05] px-4 py-2.5 text-sm font-semibold text-white transition-all duration-200 hover:scale-[1.02] hover:border-[#D4AF37]/65 hover:bg-white/[0.1] active:scale-[0.98] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#F28C38] whitespace-nowrap shrink-0 cursor-pointer"
          >
            <RefreshCw className="h-4 w-4 text-[#D4AF37]" aria-hidden="true" />
            <span>New variation</span>
          </button>

          <Magnetic strength={0.2}>
          <button
            ref={downloadRef}
            type="button"
            disabled={isDownloading}
            onClick={handleDownload}
            className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-[#F28C38] to-[#F5A623] px-5 py-2.5 text-sm font-bold text-[#090E1A] shadow-[0_6px_24px_-4px_rgba(242,140,56,0.5)] transition-all duration-200 hover:scale-[1.03] hover:shadow-[0_10px_28px_-4px_rgba(242,140,56,0.72)] active:scale-[0.98] disabled:opacity-70 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white whitespace-nowrap shrink-0 cursor-pointer"
          >
            {isDownloading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
                <span>Preparing PNG...</span>
              </>
            ) : (
              <>
                <Download className="h-4 w-4" aria-hidden="true" />
                <span>Download PNG</span>
              </>
            )}
          </button>
          </Magnetic>
        </div>
        }
      />

      <Reveal>
      <div className="glass-card relative overflow-hidden rounded-3xl p-5 sm:p-8 lg:p-12">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute left-[8%] top-1/2 h-[520px] w-[520px] -translate-y-1/2 rounded-full bg-[radial-gradient(circle,rgba(242,140,56,0.25)_0%,rgba(212,175,55,0.08)_45%,transparent_70%)] blur-2xl lg:left-[12%]"
        />
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-12 lg:items-center">
          {/* 3D Perspective Reveal Poster Showcase */}
          <div
            ref={stageRef}
            className="relative lg:col-span-7 flex justify-center"
            style={{ perspective: "1200px" }}
          >
            <motion.div
              key={curtainKey}
              initial={{ opacity: 0, scale: 0.86, rotateX: 16, rotateY: -18, y: 40 }}
              animate={
                stageInView
                  ? { opacity: 1, scale: 1, rotateX: tilt.rx, rotateY: tilt.ry, y: 0 }
                  : undefined
              }
              transition={{
                opacity: { duration: 0.45 },
                scale: { type: "spring", stiffness: 180, damping: 20 },
                rotateX: { type: "spring", stiffness: 210, damping: 22 },
                rotateY: { type: "spring", stiffness: 210, damping: 22 },
                y: { type: "spring", stiffness: 180, damping: 20 },
              }}
              onMouseMove={handlePointerMove}
              onMouseLeave={handlePointerLeave}
              style={{ transformStyle: "preserve-3d" }}
              className={`relative w-full overflow-hidden rounded-xl border border-[#D4AF37]/45 shadow-[0_24px_60px_-12px_rgba(0,0,0,0.8),0_0_40px_-10px_rgba(242,140,56,0.28)] ${
                isVertical
                  ? "aspect-[9/16] max-w-[330px]"
                  : "aspect-[4/5] max-w-[440px]"
              }`}
            >
              <div
                className="h-full w-full"
                dangerouslySetInnerHTML={{ __html: posterSvg }}
              />

              {/* Typography Brand Band matching PNG export 1:1 */}
              <div
                className="absolute inset-x-0 bottom-0 flex h-[16%] flex-col items-center justify-center px-5 text-center"
                style={{
                  backgroundColor: bandStyle.bandBg,
                  borderTop: `2px solid ${bandStyle.dividerColor}`,
                }}
              >
                <span
                  className="text-[10px] font-semibold tracking-[0.18em] uppercase"
                  style={{ color: bandStyle.festivalLabelColor }}
                >
                  {festival}
                </span>
                <p
                  className="mt-0.5 w-full truncate text-lg sm:text-2xl font-bold tracking-tight"
                  style={{
                    color: bandStyle.brandColor,
                    fontFamily: bandStyle.brandFontFamily,
                  }}
                >
                  {brand}
                </p>
                <p
                  dir={isRtl ? "rtl" : "ltr"}
                  className="mt-0.5 w-full truncate text-xs sm:text-sm font-medium"
                  style={{ color: bandStyle.taglineColor }}
                >
                  {activeTagline}
                </p>
              </div>

              {/* Metallic shine sweep on reveal */}
              {stageInView && <div
                aria-hidden="true"
                className="poster-shine-sweep pointer-events-none absolute inset-y-0 left-0 w-1/2 bg-gradient-to-r from-transparent via-white/30 to-transparent"
              />}

              {/* Holographic glare that follows the cursor */}
              <div
                aria-hidden="true"
                className="pointer-events-none absolute inset-0 mix-blend-overlay transition-opacity duration-300"
                style={{
                  opacity: glare.on ? 1 : 0,
                  background: `radial-gradient(circle at ${glare.x}% ${glare.y}%, rgba(255,255,255,0.55), rgba(255,231,163,0.18) 25%, transparent 55%)`,
                }}
              />
              <div
                aria-hidden="true"
                className="pointer-events-none absolute inset-0 mix-blend-color-dodge transition-opacity duration-300"
                style={{
                  opacity: glare.on ? 0.22 : 0,
                  background: `linear-gradient(${115 + (glare.x - 50) * 0.8}deg, transparent 20%, rgba(255,126,182,0.6) 38%, rgba(245,176,65,0.6) 50%, rgba(120,200,255,0.5) 62%, transparent 80%)`,
                }}
              />

              {/* Curtain reveal: two gold panels part to unveil the poster */}
              <AnimatePresence>
                <motion.div
                  key={`l-${curtainKey}`}
                  aria-hidden="true"
                  initial={{ x: "0%" }}
                  animate={stageInView ? { x: "-101%" } : undefined}
                  transition={{ duration: 1.1, delay: 0.25, ease: [0.76, 0, 0.24, 1] }}
                  className="curtain pointer-events-none absolute inset-y-0 left-0 w-1/2"
                />
                <motion.div
                  key={`r-${curtainKey}`}
                  aria-hidden="true"
                  initial={{ x: "0%" }}
                  animate={stageInView ? { x: "101%" } : undefined}
                  transition={{ duration: 1.1, delay: 0.25, ease: [0.76, 0, 0.24, 1] }}
                  className="curtain curtain-right pointer-events-none absolute inset-y-0 right-0 w-1/2"
                />
              </AnimatePresence>
            </motion.div>
          </div>

          <div className="lg:col-span-5 space-y-6">
            {/* Aspect Ratio Selector */}
            <div className="space-y-2.5">
              <p className="text-xs font-semibold uppercase tracking-wider text-[#F28C38]">
                Social Format & Aspect Ratio
              </p>
              <div
                role="radiogroup"
                aria-label="Poster aspect ratio"
                className="grid grid-cols-1 gap-2 sm:grid-cols-3 lg:grid-cols-1"
              >
                {POSTER_ASPECT_RATIOS.map((opt) => {
                  const isActive = aspectRatio === opt.id;
                  return (
                    <button
                      key={opt.id}
                      type="button"
                      role="radio"
                      aria-checked={isActive}
                      onClick={() => onChangeAspectRatio(opt.id)}
                      className={`flex items-center justify-between gap-3 rounded-xl border px-4 py-2.5 text-left transition-all duration-200 cursor-pointer ${
                        isActive
                          ? "border-[#F28C38] bg-[#F28C38]/16 text-white shadow-[0_0_20px_rgba(242,140,56,0.2)]"
                          : "border-white/12 bg-white/[0.03] text-slate-300 hover:border-[#D4AF37]/45 hover:bg-white/[0.07] hover:text-white"
                      }`}
                    >
                      <span className="text-sm font-semibold">{opt.label}</span>
                      <span className="text-xs font-bold tabular-nums text-[#F28C38]">
                        {opt.ratioLabel}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Poster Copy Language Switch */}
            {language !== "English" && (
              <div className="space-y-2">
                <p className="text-xs font-semibold uppercase tracking-wider text-[#D4AF37]">
                  Poster Tagline Language
                </p>
                <div className="grid grid-cols-2 gap-2 rounded-xl border border-white/12 bg-[#0A1022]/80 p-1">
                  <button
                    type="button"
                    onClick={() => setPosterCopyLang("regional")}
                    className={`rounded-lg px-3 py-2 text-xs font-semibold transition-all cursor-pointer ${
                      posterCopyLang === "regional"
                        ? "bg-[#F28C38] text-[#090E1A]"
                        : "text-slate-300 hover:text-white"
                    }`}
                  >
                    {language}
                  </button>
                  <button
                    type="button"
                    onClick={() => setPosterCopyLang("english")}
                    className={`rounded-lg px-3 py-2 text-xs font-semibold transition-all cursor-pointer ${
                      posterCopyLang === "english"
                        ? "bg-[#F28C38] text-[#090E1A]"
                        : "text-slate-300 hover:text-white"
                    }`}
                  >
                    English
                  </button>
                </div>
              </div>
            )}

            <dl className="divide-y divide-white/10 border-y border-white/10 text-sm">
              <div className="flex items-center justify-between gap-4 py-3">
                <dt className="font-medium text-slate-400">Style Preset</dt>
                <dd className="font-semibold text-[#F28C38]">{stylePreset}</dd>
              </div>
              <div className="flex items-center justify-between gap-4 py-3">
                <dt className="font-medium text-slate-400">Dimensions</dt>
                <dd className="font-semibold text-white tabular-nums">
                  {ratioSpec.width} × {ratioSpec.height} px ({ratioSpec.ratioLabel})
                </dd>
              </div>
              <div className="flex items-center justify-between gap-4 py-3">
                <dt className="font-medium text-slate-400">Festival Motif</dt>
                <dd className="font-semibold text-white">{festival}</dd>
              </div>
              <div className="flex items-center justify-between gap-4 py-3">
                <dt className="font-medium text-slate-400">Brand Lockup</dt>
                <dd className="font-semibold text-white truncate max-w-[200px]">
                  {brand}
                </dd>
              </div>
            </dl>

            {posterPrompt && (
              <div className="space-y-1.5">
                <p className="text-xs font-semibold text-[#D4AF37]">
                  Art Direction Prompt
                </p>
                <p className="text-sm leading-relaxed text-slate-200">
                  {posterPrompt}
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
      </Reveal>
    </section>
  );
}
