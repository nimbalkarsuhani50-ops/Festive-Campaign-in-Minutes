import { Clapperboard, Download, Film, Loader2, Mic, Music2, RotateCcw, Sparkles, Type, Volume2, VolumeX } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useEffect, useMemo, useRef, useState } from "react";
import { Reveal, SectionHeading } from "../fx/primitives";
import { FestiveGlyph } from "../fx/FestiveGlyph";
import { getFestivalMotif } from "../data/festivalMotifs";
import type { CampaignData, CampaignInput } from "../types";
import { getPosterConcepts } from "../utils/posterExport";
import { renderReel, type ReelResult, type ReelStage } from "../utils/reelRenderer";

interface Props {
  input: CampaignInput;
  campaign: CampaignData;
  /** Poster artwork URLs (vertical format preferred), one per poster. */
  posterImages: (string | undefined)[];
  /** True once artwork requests have finished (or there is no AI artwork). */
  artSettled: boolean;
  onReel: (reel: ReelResult | null) => void;
}

const STAGE_LABEL: Record<ReelStage | "sound", string> = {
  sound: "Composing music & recording voiceover",
  assets: "Gathering the vertical scenes",
  audio: "Mixing voice over the soundtrack",
  frames: "Directing scenes & animating captions",
  finishing: "Encoding the MP4",
};

/** Requests (or re-uses the cached) AI voiceover / soundtrack. */
async function requestAudio(kind: "voice" | "music", text?: string, token?: string, voice?: string): Promise<string | undefined> {
  if (!text || !token) return undefined;
  try {
    const r = await fetch("/api/reel-audio", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ kind, text, token, voice }),
    });
    const j = await r.json();
    return r.ok && j.id ? `/api/reel-audio?id=${j.id}` : undefined;
  } catch {
    return undefined;
  }
}

export function ReelStudioSection({ input, campaign, posterImages, artSettled, onReel }: Props) {
  const [status, setStatus] = useState<"waiting" | "rendering" | "ready" | "error">("waiting");
  const [progress, setProgress] = useState(0);
  const [stage, setStage] = useState<ReelStage | "sound">("sound");
  const [muted, setMuted] = useState(true);
  const [reel, setReel] = useState<ReelResult | null>(null);
  const [run, setRun] = useState(0);
  const lastKey = useRef("");

  const concepts = useMemo(() => getPosterConcepts(campaign, input.festival), [campaign, input.festival]);
  const text = useMemo(() => {
    const rt = campaign.reel_text;
    return {
      hook: rt?.hook || campaign.tagline_en,
      line: rt?.line || campaign.big_idea.split(/\s+/).slice(0, 8).join(" "),
      cta: rt?.cta || concepts[0]?.cta || "Visit us today",
      music: rt?.music_mood || "Upbeat festive percussion",
    };
  }, [campaign, concepts]);

  const key = `${input.brand}|${campaign.big_idea}|${posterImages.join(",")}|${run}`;

  useEffect(() => {
    if (!artSettled || key === lastKey.current) return;
    lastKey.current = key;
    let alive = true;
    setStatus("rendering");
    setProgress(0);
    setStage("sound");
    const rt = campaign.reel_text;
    const bpm = Number((rt?.music_prompt?.match(/(\d{2,3})\s*BPM/i) ?? [0, 0])[1]) || undefined;
    Promise.all([
      requestAudio("voice", rt?.voiceover, rt?.voice_token, rt?.voice),
      requestAudio("music", rt?.music_prompt, rt?.music_token),
    ])
      .then(([voiceUrl, musicUrl]) =>
        renderReel(
          {
            brand: input.brand,
            festival: input.festival,
            city: input.city,
            hook: text.hook,
            line: text.line,
            cta: text.cta,
            images: posterImages,
            headline3: concepts[2]?.headline || concepts[0]?.headline || "",
            badge: concepts[2]?.badge || "Festive Special",
            palette: campaign.palette,
            voiceUrl,
            musicUrl,
            voiceText: rt?.voiceover,
            bpm,
          },
          (p, st) => {
            if (!alive) return;
            setProgress(p);
            setStage(st);
          }
        )
      )
      .then((r) => {
        if (!alive) {
          URL.revokeObjectURL(r.url);
          return;
        }
        setReel((old) => {
          if (old) URL.revokeObjectURL(old.url);
          return r;
        });
        onReel(r);
        setStatus("ready");
      })
      .catch(() => alive && setStatus("error"));
    return () => {
      alive = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key, artSettled]);

  const D = reel?.duration ?? 14;
  const sec = (f: number) => `${(D * f).toFixed(1).replace(/\.0$/, "")}s`;
  const fileName = `${(input.brand || "brand").trim().replace(/\s+/g, "-")}-${input.festival.replace(/\s+/g, "-")}-reel.${reel?.ext ?? "mp4"}`;
  const beats = [
    { label: "Hook", range: `0–${sec(0.3)}`, on: text.hook, direction: campaign.reel_script.hook_0_3s },
    { label: "Payoff", range: `${sec(0.3)}–${sec(0.58)}`, on: text.line, direction: campaign.reel_script.scene_3_10s },
    { label: "Offer", range: `${sec(0.58)}–${sec(0.82)}`, on: concepts[2]?.headline ?? "", direction: campaign.reel_script.cta_10_15s },
    { label: "Brand end card", range: `${sec(0.82)}–${sec(1)}`, on: text.cta, direction: `${input.brand} logo reveal with the call to action and “Link in bio”.` },
  ];

  return (
    <section id="reel-script" aria-label="Brand Reel" className="scroll-section space-y-7">
      <SectionHeading
        index="04"
        kicker="Made for Reels & Shorts"
        title="Brand Reel with Voice & Music"
        right={
          <div className="flex items-center gap-2.5">
            <button
              type="button"
              onClick={() => setRun((r) => r + 1)}
              disabled={status === "rendering" || !artSettled}
              className="inline-flex items-center gap-2 rounded-xl border border-white/15 bg-white/[0.05] px-4 py-2.5 text-sm font-semibold text-white transition-all hover:border-[color:var(--ac2)]/65 disabled:opacity-50 cursor-pointer"
            >
              <RotateCcw className="h-4 w-4" aria-hidden="true" />
              Re-create
            </button>
            <a
              href={reel?.url}
              download={fileName}
              aria-disabled={!reel}
              className={`inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-[var(--ac)] to-[var(--ac3)] px-5 py-2.5 text-sm font-bold text-[#090E1A] shadow-[0_6px_24px_-4px_rgba(var(--ac-rgb),0.5)] transition-all ${
                reel ? "hover:scale-[1.03]" : "pointer-events-none opacity-50"
              }`}
            >
              <Download className="h-4 w-4" aria-hidden="true" />
              Download {reel?.ext === "webm" ? "WebM" : "MP4"}
            </a>
          </div>
        }
      />

      <Reveal>
        <div className="glass-card relative overflow-hidden rounded-3xl p-5 sm:p-8 lg:p-10">
          <div aria-hidden="true" className="pointer-events-none absolute -left-24 top-10 h-[420px] w-[420px] rounded-full bg-[radial-gradient(circle,rgba(var(--ac-rgb),0.22),transparent_70%)] blur-2xl" />
          <div className="relative grid grid-cols-1 gap-10 lg:grid-cols-12 lg:items-center">
            {/* Phone */}
            <div className="flex justify-center lg:col-span-5">
              <div className="relative w-full max-w-[300px] rounded-[2.6rem] border border-white/15 bg-black p-2.5 shadow-[0_30px_80px_-20px_rgba(0,0,0,0.9),0_0_60px_-20px_rgba(var(--ac-rgb),0.45)]">
                <div className="relative aspect-[9/16] overflow-hidden rounded-[2.1rem] bg-[#06070D]">
                  <AnimatePresence mode="wait">
                    {status === "ready" && reel ? (
                      <motion.video
                        key={reel.url}
                        initial={{ opacity: 0, scale: 1.04 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ duration: 0.6 }}
                        src={reel.url}
                        className="h-full w-full object-cover"
                        autoPlay
                        muted={muted}
                        loop
                        playsInline
                        controls
                      />
                    ) : (
                      <motion.div key="making" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0">
                        {posterImages.filter(Boolean).slice(0, 3).map((src, i) => (
                          <motion.img
                            key={src}
                            src={src}
                            alt=""
                            className="absolute inset-0 h-full w-full object-cover blur-[6px]"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: [0, 0.55, 0.55, 0], scale: [1.1, 1.18] }}
                            transition={{ duration: 3.6, delay: i * 1.2, repeat: Infinity, repeatDelay: 0 }}
                          />
                        ))}
                        <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-black/40 to-black/80" />
                        <div className="absolute inset-0 flex flex-col items-center justify-center gap-5 px-6 text-center">
                          {status === "error" ? (
                            <>
                              <Film className="h-10 w-10 text-[color:var(--ac)]" aria-hidden="true" />
                              <p className="text-sm font-semibold text-white">Couldn't create the reel in this browser.</p>
                              <p className="text-xs text-slate-300">Try Re-create, or use Chrome / Edge.</p>
                            </>
                          ) : (
                            <>
                              <div className="relative h-24 w-24">
                                <svg viewBox="0 0 100 100" className="h-full w-full -rotate-90">
                                  <circle cx="50" cy="50" r="44" fill="none" stroke="rgba(255,255,255,0.12)" strokeWidth="6" />
                                  <circle
                                    cx="50"
                                    cy="50"
                                    r="44"
                                    fill="none"
                                    stroke="var(--ac)"
                                    strokeWidth="6"
                                    strokeLinecap="round"
                                    strokeDasharray={2 * Math.PI * 44}
                                    strokeDashoffset={2 * Math.PI * 44 * (1 - (status === "waiting" ? 0.06 : progress))}
                                    style={{ transition: "stroke-dashoffset 0.3s" }}
                                  />
                                </svg>
                                <div className="absolute inset-0 flex items-center justify-center">
                                  {status === "waiting" ? (
                                    <FestiveGlyph kind={getFestivalMotif(input.festival).glyph} className="h-12 w-12" />
                                  ) : (
                                    <span className="text-lg font-bold tabular-nums text-white">{Math.round(progress * 100)}%</span>
                                  )}
                                </div>
                              </div>
                              <div className="space-y-1">
                                <p className="font-display text-xl font-bold text-white">Creating your reel</p>
                                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[color:var(--ac3)]">{status === "waiting" ? getFestivalMotif(input.festival).working : STAGE_LABEL[stage]}…</p>
                              </div>
                            </>
                          )}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                  {status === "ready" && reel?.hasAudio && (
                    <button
                      type="button"
                      onClick={() => setMuted((m) => !m)}
                      className="absolute right-3 top-14 z-10 inline-flex items-center gap-1.5 rounded-full bg-black/60 px-3 py-1.5 text-xs font-bold text-white backdrop-blur hover:bg-black/80 cursor-pointer"
                    >
                      {muted ? <VolumeX className="h-4 w-4" aria-hidden="true" /> : <Volume2 className="h-4 w-4" aria-hidden="true" />}
                      {muted ? "Tap for sound" : "Sound on"}
                    </button>
                  )}
                </div>
              </div>
            </div>

            {/* Script */}
            <div className="space-y-6 lg:col-span-7">
              <div className="flex flex-wrap items-center gap-2">
                <span className="inline-flex items-center gap-1.5 rounded-full border border-white/12 bg-white/[0.05] px-3 py-1 text-xs font-semibold text-slate-200">
                  <Clapperboard className="h-3.5 w-3.5 text-[color:var(--ac)]" aria-hidden="true" /> 9:16 · {reel ? `${Math.round(reel.duration)} seconds` : "12–20 seconds"} · 1080×1920
                </span>
                <span className="inline-flex items-center gap-1.5 rounded-full border border-white/12 bg-white/[0.05] px-3 py-1 text-xs font-semibold text-slate-200">
                  <Music2 className="h-3.5 w-3.5 text-[color:var(--ac)]" aria-hidden="true" /> {campaign.reel_text?.music_token ? "AI soundtrack" : "Add music"}: {text.music}
                </span>
              </div>

              {campaign.reel_text?.voiceover && (
                <div className="rounded-2xl border border-[color:var(--ac)]/30 bg-[var(--ac)]/[0.07] p-4">
                  <p className="mb-1.5 flex items-center gap-2 text-xs font-bold uppercase tracking-[0.18em] text-[color:var(--ac3)]">
                    <Mic className="h-3.5 w-3.5" aria-hidden="true" /> Voiceover · {campaign.reel_text.voice ?? "Kore"} voice · {input.language}
                  </p>
                  <p className="text-base leading-relaxed text-white">{campaign.reel_text.voiceover}</p>
                </div>
              )}
              <ol className="relative space-y-4 border-l border-white/12 pl-6">
                {beats.map((b, i) => (
                  <motion.li
                    key={b.label}
                    initial={{ opacity: 0, x: 24 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: i * 0.12, duration: 0.6 }}
                    className="relative"
                  >
                    <span className="absolute -left-[33px] top-1 flex h-4 w-4 items-center justify-center rounded-full bg-[var(--ac)] shadow-[0_0_14px_rgba(var(--ac-rgb),0.8)]" />
                    <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-4">
                      <div className="mb-2 flex items-center justify-between gap-3">
                        <p className="text-sm font-bold text-white">{b.label}</p>
                        <span className="rounded-full bg-black/40 px-2.5 py-0.5 text-[11px] font-bold tabular-nums text-[color:var(--ac3)]">{b.range}</span>
                      </div>
                      <p className="mb-2 flex items-start gap-2 font-display text-lg font-bold leading-snug text-[color:var(--ac4)]">
                        <Type className="mt-1 h-4 w-4 shrink-0 text-[color:var(--ac)]" aria-hidden="true" />
                        “{b.on}”
                      </p>
                      <p className="text-sm leading-relaxed text-slate-300">{b.direction}</p>
                    </div>
                  </motion.li>
                ))}
              </ol>
              <p className="flex items-center gap-2 text-xs text-slate-400">
                <Sparkles className="h-3.5 w-3.5 text-[color:var(--ac)]" aria-hidden="true" />
                {campaign.reel_text?.music_token ? `Built from your posters' vertical artwork, with an AI voiceover and an AI soundtrack: ${campaign.reel_text.music_prompt}` : "Built from your three posters' artwork. Add the suggested music in Instagram before posting."}
              </p>
            </div>
          </div>
        </div>
      </Reveal>
    </section>
  );
}
