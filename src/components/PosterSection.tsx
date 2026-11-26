import { Download, Images, Loader2, RefreshCw, Sparkles } from "lucide-react";
import { motion, useInView } from "motion/react";
import { useEffect, useMemo, useRef, useState } from "react";
import { POSTER_ASPECT_RATIOS, getAspectRatioSpec } from "../data/campaigns";
import { sparkleFrom } from "../fx/celebrate";
import { FestiveGlyph } from "../fx/FestiveGlyph";
import { getFestivalMotif } from "../data/festivalMotifs";
import { Magnetic, Reveal, SectionHeading } from "../fx/primitives";
import type { CampaignData, CampaignInput, PosterAspectRatio } from "../types";
import {
  buildPosterParams,
  composePosterPngDataUrl,
  downloadPosterPng,
  getPosterConcepts,
  type PosterCompositionParams,
} from "../utils/posterExport";

interface PosterSectionProps {
  input: CampaignInput;
  campaign: CampaignData;
  aspectRatio: PosterAspectRatio;
  posterSeed: number;
  revealKey: number;
  /** Keys like "0|instagram_feed" for artwork still being generated. */
  artPending: Record<string, boolean>;
  artError: string | null;
  onChangeAspectRatio: (ratio: PosterAspectRatio) => void;
  onNewArtwork: (posterIndex: number) => void;
}

/** Composes a poster to a PNG data URL whenever its inputs change. */
function useComposed(params: PosterCompositionParams | null) {
  const [url, setUrl] = useState<string | null>(null);
  const key = params ? JSON.stringify(params) : "";
  useEffect(() => {
    if (!params) return;
    let alive = true;
    composePosterPngDataUrl(params)
      .then((u) => alive && setUrl(u))
      .catch(() => alive && setUrl(null));
    return () => {
      alive = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);
  return url;
}

function PosterThumb({
  params,
  festival,
  index,
  concept,
  layout,
  active,
  pending,
  onSelect,
}: {
  params: PosterCompositionParams;
  festival: string;
  index: number;
  concept: string;
  layout: string;
  active: boolean;
  pending: boolean;
  onSelect: () => void;
}) {
  const url = useComposed(params);
  return (
    <button
      type="button"
      onClick={onSelect}
      aria-pressed={active}
      className={`group relative overflow-hidden rounded-2xl border text-left transition-all duration-300 cursor-pointer ${
        active
          ? "border-[color:var(--ac)] shadow-[0_0_28px_rgba(var(--ac-rgb),0.35)]"
          : "border-white/12 hover:border-[color:var(--ac2)]/60"
      }`}
    >
      <div className="relative aspect-[4/5] bg-black/30">
        {url && <img src={url} alt="" className="h-full w-full object-cover" draggable={false} />}
        {pending && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-black/55 px-2 text-center text-xs font-semibold text-white backdrop-blur-[2px]">
            <FestiveGlyph kind={getFestivalMotif(festival).glyph} className="h-10 w-10" />
            {getFestivalMotif(festival).working}…
          </div>
        )}
      </div>
      <div className="space-y-0.5 bg-black/35 px-3 py-2.5">
        <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[color:var(--ac3)]">Poster {index + 1}</p>
        <p className="truncate text-sm font-semibold text-white">{concept}</p>
        <p className="text-[11px] text-slate-400">{layout}</p>
      </div>
    </button>
  );
}

export function PosterSection({
  input,
  campaign,
  aspectRatio,
  posterSeed,
  revealKey,
  artPending,
  artError,
  onChangeAspectRatio,
  onNewArtwork,
}: PosterSectionProps) {
  const language = input.language;
  const [selected, setSelected] = useState(0);
  const [isDownloading, setIsDownloading] = useState<"one" | "all" | null>(null);
  const [tilt, setTilt] = useState({ rx: 0, ry: 0 });
  const [glare, setGlare] = useState({ x: 50, y: 50, on: false });
  const downloadRef = useRef<HTMLButtonElement | null>(null);
  const stageRef = useRef<HTMLDivElement | null>(null);
  const stageInView = useInView(stageRef, { once: true, amount: 0.3 });
  const [copyLang, setCopyLang] = useState<"english" | "regional">("english");

  useEffect(() => setSelected(0), [revealKey]);

  const concepts = useMemo(() => getPosterConcepts(campaign, input.festival), [campaign, input.festival]);
  const useRegional = copyLang === "regional";
  const allParams = useMemo(
    () => concepts.map((_, i) => buildPosterParams(input, campaign, { posterIndex: i, seed: posterSeed, aspectRatio, useRegional })),
    [concepts, input, campaign, posterSeed, aspectRatio, useRegional]
  );
  const thumbParams = useMemo(
    () => concepts.map((_, i) => buildPosterParams(input, campaign, { posterIndex: i, seed: posterSeed, aspectRatio: "instagram_feed", useRegional })),
    [concepts, input, campaign, posterSeed, useRegional]
  );
  const current = allParams[selected] ?? allParams[0];
  const posterPng = useComposed(current);
  const concept = concepts[selected] ?? concepts[0];
  const ratioSpec = getAspectRatioSpec(aspectRatio);
  const isVertical = aspectRatio !== "instagram_feed";
  const hasAiArt = Boolean(campaign.posters?.some((p) => p.token));
  const pendingHere = Boolean(artPending[`${selected}|${aspectRatio}`]);

  async function downloadOne() {
    setIsDownloading("one");
    try {
      await downloadPosterPng(current);
      sparkleFrom(downloadRef.current, 40);
    } finally {
      setIsDownloading(null);
    }
  }

  async function downloadAll() {
    setIsDownloading("all");
    try {
      for (const p of allParams) {
        await downloadPosterPng(p);
        await new Promise((r) => setTimeout(r, 350));
      }
    } finally {
      setIsDownloading(null);
    }
  }

  function handlePointerMove(e: React.MouseEvent<HTMLDivElement>) {
    const rect = e.currentTarget.getBoundingClientRect();
    const px = (e.clientX - rect.left) / rect.width - 0.5;
    const py = (e.clientY - rect.top) / rect.height - 0.5;
    setTilt({ rx: Number((-py * 10).toFixed(2)), ry: Number((px * 10).toFixed(2)) });
    setGlare({ x: (px + 0.5) * 100, y: (py + 0.5) * 100, on: true });
  }

  return (
    <section id="poster-section" aria-label="Campaign Posters" className="scroll-section space-y-7">
      <SectionHeading
        index="03"
        kicker="Ready to post"
        title="Three Posters"
        right={
          <div className="flex flex-wrap items-center gap-2.5">
            <button
              type="button"
              onClick={() => onNewArtwork(selected)}
              disabled={pendingHere}
              className="inline-flex items-center gap-2 rounded-xl border border-white/15 bg-white/[0.05] px-4 py-2.5 text-sm font-semibold text-white transition-all duration-200 hover:border-[color:var(--ac2)]/65 hover:bg-white/[0.1] disabled:opacity-60 cursor-pointer"
            >
              <RefreshCw className={`h-4 w-4 text-[color:var(--ac2)] ${pendingHere ? "animate-spin" : ""}`} aria-hidden="true" />
              <span>{hasAiArt ? "New artwork" : "New variation"}</span>
            </button>
            <button
              type="button"
              onClick={downloadAll}
              disabled={isDownloading !== null}
              className="inline-flex items-center gap-2 rounded-xl border border-white/15 bg-white/[0.05] px-4 py-2.5 text-sm font-semibold text-white transition-all duration-200 hover:border-[color:var(--ac2)]/65 hover:bg-white/[0.1] disabled:opacity-60 cursor-pointer"
            >
              {isDownloading === "all" ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" /> : <Images className="h-4 w-4" aria-hidden="true" />}
              <span>Download all 3</span>
            </button>
            <Magnetic strength={0.2}>
              <button
                ref={downloadRef}
                type="button"
                disabled={isDownloading !== null}
                onClick={downloadOne}
                className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-[var(--ac)] to-[var(--ac3)] px-5 py-2.5 text-sm font-bold text-[#090E1A] shadow-[0_6px_24px_-4px_rgba(var(--ac-rgb),0.5)] transition-all duration-200 hover:scale-[1.03] disabled:opacity-70 cursor-pointer"
              >
                {isDownloading === "one" ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" /> : <Download className="h-4 w-4" aria-hidden="true" />}
                <span>Download PNG</span>
              </button>
            </Magnetic>
          </div>
        }
      />

      <Reveal>
        <div className="glass-card relative overflow-hidden rounded-3xl p-5 sm:p-8 lg:p-10">
          <div className="grid grid-cols-3 gap-3 sm:gap-5 lg:hidden">
            {thumbParams.map((p, i) => (
              <PosterThumb
                key={i}
                params={p}
                festival={input.festival}
                index={i}
                concept={concepts[i].concept}
                layout={concepts[i].layout}
                active={i === selected}
                pending={Boolean(artPending[`${i}|instagram_feed`])}
                onSelect={() => setSelected(i)}
              />
            ))}
          </div>

          <div className="mt-6 grid grid-cols-1 gap-8 lg:mt-0 lg:grid-cols-12 lg:items-start">
            {/* Stage */}
            <div ref={stageRef} className="flex justify-center lg:col-span-6" style={{ perspective: "1200px" }}>
              <motion.div
                key={`${revealKey}-${selected}-${aspectRatio}`}
                initial={{ opacity: 0, scale: 0.92, rotateX: 10, y: 30 }}
                animate={stageInView ? { opacity: 1, scale: 1, rotateX: tilt.rx, rotateY: tilt.ry, y: 0 } : undefined}
                transition={{ type: "spring", stiffness: 190, damping: 22 }}
                onMouseMove={handlePointerMove}
                onMouseLeave={() => {
                  setTilt({ rx: 0, ry: 0 });
                  setGlare((g) => ({ ...g, on: false }));
                }}
                style={{ transformStyle: "preserve-3d" }}
                className={`relative w-full overflow-hidden rounded-xl border border-[color:var(--ac2)]/45 shadow-[0_24px_60px_-12px_rgba(0,0,0,0.8),0_0_40px_-10px_rgba(var(--ac-rgb),0.28)] ${
                  isVertical ? "aspect-[9/16] max-w-[330px]" : "aspect-[4/5] max-w-[460px]"
                }`}
              >
                {posterPng ? (
                  <img src={posterPng} alt={`${concept.concept} poster for ${input.brand}`} className="h-full w-full object-cover" draggable={false} />
                ) : (
                  <div className="flex h-full w-full items-center justify-center bg-black/30">
                    <FestiveGlyph kind={getFestivalMotif(input.festival).glyph} className="h-20 w-20" />
                  </div>
                )}
                {pendingHere && (
                  <div className="absolute inset-x-0 bottom-0 flex items-center justify-center gap-2 bg-black/70 py-2.5 text-xs font-semibold text-white backdrop-blur">
                    <FestiveGlyph kind={getFestivalMotif(input.festival).glyph} className="h-5 w-5" />
                    {getFestivalMotif(input.festival).working}: AI is painting this poster…
                  </div>
                )}
                <div
                  aria-hidden="true"
                  className="pointer-events-none absolute inset-0 mix-blend-overlay transition-opacity duration-300"
                  style={{
                    opacity: glare.on ? 1 : 0,
                    background: `radial-gradient(circle at ${glare.x}% ${glare.y}%, rgba(255,255,255,0.5), transparent 55%)`,
                  }}
                />
              </motion.div>
            </div>

            {/* Controls */}
            <div className="space-y-6 lg:col-span-6">
              <div className="hidden grid-cols-3 gap-4 lg:grid">
                {thumbParams.map((p, i) => (
                  <PosterThumb
                    key={i}
                    params={p}
                    festival={input.festival}
                    index={i}
                    concept={concepts[i].concept}
                    layout={concepts[i].layout}
                    active={i === selected}
                    pending={Boolean(artPending[`${i}|instagram_feed`])}
                    onSelect={() => setSelected(i)}
                  />
                ))}
              </div>

              {artError && (
                <p className="rounded-xl border border-[color:var(--ac)]/40 bg-[var(--ac)]/10 px-4 py-3 text-sm text-slate-200">
                  AI artwork unavailable right now ({artError}). Showing designed festival artwork instead.
                </p>
              )}

              <div className="space-y-2.5">
                <p className="text-xs font-semibold uppercase tracking-wider text-[color:var(--ac)]">Format</p>
                <div role="radiogroup" aria-label="Poster format" className="grid grid-cols-1 gap-2 sm:grid-cols-3">
                  {POSTER_ASPECT_RATIOS.map((opt) => {
                    const on = aspectRatio === opt.id;
                    return (
                      <button
                        key={opt.id}
                        type="button"
                        role="radio"
                        aria-checked={on}
                        onClick={() => onChangeAspectRatio(opt.id)}
                        className={`flex items-center justify-between gap-3 rounded-xl border px-4 py-2.5 text-left transition-all duration-200 cursor-pointer ${
                          on
                            ? "border-[color:var(--ac)] bg-[var(--ac)]/16 text-white"
                            : "border-white/12 bg-white/[0.03] text-slate-300 hover:border-[color:var(--ac2)]/45 hover:text-white"
                        }`}
                      >
                        <span className="text-sm font-semibold">{opt.label}</span>
                        <span className="text-xs font-bold tabular-nums text-[color:var(--ac)]">{opt.ratioLabel}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {language !== "English" && (
                <div className="space-y-2">
                  <p className="text-xs font-semibold uppercase tracking-wider text-[color:var(--ac2)]">Poster line</p>
                  <div className="grid grid-cols-2 gap-2 rounded-xl border border-white/12 bg-[#0A1022]/80 p-1">
                    {(["english", "regional"] as const).map((k) => (
                      <button
                        key={k}
                        type="button"
                        onClick={() => setCopyLang(k)}
                        className={`rounded-lg px-3 py-2 text-xs font-semibold transition-all cursor-pointer ${
                          copyLang === k ? "bg-[var(--ac)] text-[#090E1A]" : "text-slate-300 hover:text-white"
                        }`}
                      >
                        {k === "english" ? "English subline" : `${language} tagline`}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              <dl className="divide-y divide-white/10 border-y border-white/10 text-sm">
                {[
                  ["Concept", concept.concept],
                  ["Headline", concept.headline],
                  ["Call to action", concept.cta],
                  ["Layout", concept.layout],
                  ["Size", `${ratioSpec.width} × ${ratioSpec.height} px (${ratioSpec.ratioLabel})`],
                ].map(([k, v]) => (
                  <div key={k} className="flex items-center justify-between gap-4 py-2.5">
                    <dt className="font-medium text-slate-400">{k}</dt>
                    <dd className="max-w-[60%] truncate text-right font-semibold text-white">{v}</dd>
                  </div>
                ))}
              </dl>

              {concept.visual_prompt && (
                <div className="space-y-1.5">
                  <p className="text-xs font-semibold text-[color:var(--ac2)]">Art direction</p>
                  <p className="text-sm leading-relaxed text-slate-300">{concept.visual_prompt}</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </Reveal>
    </section>
  );
}
