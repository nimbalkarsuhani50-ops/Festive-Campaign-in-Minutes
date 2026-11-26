import { Music2, Pause, Play, RotateCcw } from "lucide-react";
import { AnimatePresence, motion, useInView } from "motion/react";
import { useEffect, useMemo, useRef, useState } from "react";
import { EASE_OUT, Reveal, SectionHeading, SpotlightCard } from "../fx/primitives";
import { makePosterSVG } from "../posters.js";
import type { FestivalName, ReelScript, StylePreset } from "../types";

interface ReelScriptSectionProps {
  reelScript: ReelScript;
  brand: string;
  festival: FestivalName;
  stylePreset: StylePreset;
  seed: number;
}

const DURATION = 15;

export function ReelScriptSection({ reelScript, brand, festival, stylePreset, seed }: ReelScriptSectionProps) {
  const beats = [
    { label: "Hook", range: "0–3s", start: 0, end: 3, content: reelScript.hook_0_3s },
    { label: "Scene", range: "3–10s", start: 3, end: 10, content: reelScript.scene_3_10s },
    { label: "Call to action", range: "10–15s", start: 10, end: 15, content: reelScript.cta_10_15s },
  ];

  const [t, setT] = useState(0);
  const [playing, setPlaying] = useState(true);
  const wrapRef = useRef<HTMLDivElement | null>(null);
  const inView = useInView(wrapRef, { amount: 0.45 });
  const lastRef = useRef<number | null>(null);

  useEffect(() => {
    if (!playing || !inView) {
      lastRef.current = null;
      return;
    }
    let raf = 0;
    const step = (now: number) => {
      if (lastRef.current !== null) {
        const dt = (now - lastRef.current) / 1000;
        setT((prev) => (prev + dt >= DURATION ? 0 : prev + dt));
      }
      lastRef.current = now;
      raf = requestAnimationFrame(step);
    };
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, [playing, inView]);

  const active = t < 3 ? 0 : t < 10 ? 1 : 2;
  const beat = beats[active];

  const svg = useMemo(
    () =>
      makePosterSVG(festival, seed + 101, stylePreset, "instagram_story").replace(
        "<svg ",
        '<svg preserveAspectRatio="xMidYMid slice" style="width:100%;height:100%;display:block;" '
      ),
    [festival, seed, stylePreset]
  );

  const handle = (brand || "brand").toLowerCase().replace(/[^a-z0-9]+/g, "");

  return (
    <section id="reel-script" aria-label="Reel Script" className="scroll-section space-y-7">
      <SectionHeading
        index="05"
        kicker="Short-form video"
        title="15-Second Reel"
        right={
          <div className="flex items-center gap-2">
            <button type="button" onClick={() => setPlaying((p) => !p)} className="dock-btn h-10 w-10 border border-white/15" aria-label={playing ? "Pause reel" : "Play reel"}>
              {playing ? <Pause className="h-4 w-4" aria-hidden="true" /> : <Play className="h-4 w-4" aria-hidden="true" />}
            </button>
            <button type="button" onClick={() => { setT(0); setPlaying(true); }} className="dock-btn h-10 w-10 border border-white/15" aria-label="Restart reel">
              <RotateCcw className="h-4 w-4" aria-hidden="true" />
            </button>
          </div>
        }
      />

      <Reveal>
        <div ref={wrapRef} className="grid grid-cols-1 items-center gap-8 lg:grid-cols-12">
          {/* Phone */}
          <div className="flex justify-center lg:col-span-5">
            <motion.div
              initial={{ rotateY: -24, rotateX: 8, opacity: 0, y: 40 }}
              whileInView={{ rotateY: -8, rotateX: 4, opacity: 1, y: 0 }}
              whileHover={{ rotateY: 0, rotateX: 0, scale: 1.02 }}
              viewport={{ once: true }}
              transition={{ duration: 1.2, ease: EASE_OUT }}
              style={{ transformPerspective: 1400 }}
              className="relative w-[280px] rounded-[44px] border border-white/15 bg-[#05070d] p-2.5 shadow-[0_40px_100px_-20px_rgba(0,0,0,0.9),0_0_80px_-20px_rgba(var(--ac-rgb),0.45)] sm:w-[300px]"
            >
              <div className="relative aspect-[9/19.5] overflow-hidden rounded-[36px]">
                {/* Ken Burns background */}
                <div
                  className="absolute inset-0 will-change-transform"
                  style={{
                    transform: `scale(${1.08 + (t / DURATION) * 0.2}) translateX(${active === 1 ? -12 : 0}px)`,
                    transition: "transform 0.8s ease-out",
                  }}
                  dangerouslySetInnerHTML={{ __html: svg }}
                />
                <div className="absolute inset-0 bg-gradient-to-b from-black/50 via-black/10 to-black/80" />

                {/* Story progress segments */}
                <div className="absolute inset-x-4 top-10 flex gap-1">
                  {beats.map((b, i) => {
                    const fill = Math.min(1, Math.max(0, (t - b.start) / (b.end - b.start)));
                    return (
                      <div key={b.label} className="h-[3px] overflow-hidden rounded-full bg-white/30" style={{ flex: b.end - b.start }}>
                        <div className="h-full rounded-full bg-white" style={{ width: `${(i < active ? 1 : fill) * 100}%` }} />
                      </div>
                    );
                  })}
                </div>

                <div className="absolute inset-x-4 top-14 flex items-center gap-2">
                  <span className="flex h-7 w-7 items-center justify-center rounded-full bg-gradient-to-br from-[var(--ac3)] to-[var(--ac)] text-xs font-bold text-[#1a0f05]">
                    {(brand || "B").charAt(0).toUpperCase()}
                  </span>
                  <span className="text-xs font-semibold text-white">{handle}</span>
                  <span className="text-xs text-white/60 tabular-nums">· 0:{String(Math.floor(t)).padStart(2, "0")}</span>
                </div>

                {/* Beat caption */}
                <div className="absolute inset-x-5 bottom-16 top-28 flex items-center justify-center">
                  <AnimatePresence mode="wait">
                    <motion.div
                      key={active}
                      initial={{ opacity: 0, y: 30, scale: 0.92, filter: "blur(10px)" }}
                      animate={{ opacity: 1, y: 0, scale: 1, filter: "blur(0px)" }}
                      exit={{ opacity: 0, y: -24, scale: 1.05, filter: "blur(10px)" }}
                      transition={{ duration: 0.55, ease: EASE_OUT }}
                      className="text-center"
                    >
                      <span className="inline-block rounded-full bg-[var(--ac)] px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-[0.2em] text-[#1a0f05]">
                        {beat.label}
                      </span>
                      <p className="mt-3 text-[17px] font-bold leading-snug text-white [text-shadow:0_2px_16px_rgba(0,0,0,0.85)]">
                        {beat.content}
                      </p>
                    </motion.div>
                  </AnimatePresence>
                </div>

                <div className="absolute inset-x-4 bottom-5 flex items-center gap-2 text-white/85">
                  <Music2 className="h-3.5 w-3.5" aria-hidden="true" />
                  <div className="overflow-hidden whitespace-nowrap text-[11px]">
                    <motion.span
                      className="inline-block"
                      animate={{ x: ["0%", "-50%"] }}
                      transition={{ duration: 9, repeat: Infinity, ease: "linear" }}
                    >
                      {festival} beats · Original audio · {handle} &nbsp;&nbsp;&nbsp; {festival} beats · Original audio · {handle} &nbsp;&nbsp;&nbsp;
                    </motion.span>
                  </div>
                </div>
              </div>
              <div className="absolute left-1/2 top-5 h-5 w-20 -translate-x-1/2 rounded-full bg-black" />
            </motion.div>
          </div>

          {/* Timeline */}
          <div className="space-y-4 lg:col-span-7">
            <div className="relative h-2 overflow-hidden rounded-full bg-white/[0.08]">
              <div
                className="absolute inset-y-0 left-0 rounded-full bg-gradient-to-r from-[var(--ac)] via-[var(--ac3)] to-[var(--ac5)] shadow-[0_0_14px_rgba(var(--ac3-rgb),0.8)]"
                style={{ width: `${(t / DURATION) * 100}%` }}
              />
              {[3, 10].map((m) => (
                <span key={m} className="absolute top-0 h-full w-px bg-white/40" style={{ left: `${(m / DURATION) * 100}%` }} />
              ))}
            </div>

            {beats.map((b, i) => {
              const on = i === active;
              return (
                <SpotlightCard
                  key={b.label}
                  tilt={0}
                  onClick={() => setT(b.start + 0.01)}
                  className={`cursor-pointer rounded-2xl p-5 transition-[border-color,background-color,opacity] duration-500 sm:p-6 ${
                    on ? "!border-[color:var(--ac)]/70 !bg-[var(--ac)]/[0.08] opacity-100" : "opacity-60 hover:opacity-90"
                  }`}
                >
                  <div className="flex items-center justify-between gap-4">
                    <span className={`text-sm font-bold tabular-nums ${on ? "text-[color:var(--ac3)]" : "text-slate-400"}`}>
                      {b.range} · {b.label}
                    </span>
                    <span className="text-xs font-semibold text-slate-500 tabular-nums">Beat 0{i + 1}</span>
                  </div>
                  <p className={`mt-2 text-base font-medium leading-relaxed sm:text-lg ${on ? "text-white" : "text-slate-300"}`}>
                    {b.content}
                  </p>
                  {on && (
                    <motion.div layoutId="beat-bar" className="mt-4 h-0.5 rounded-full bg-gradient-to-r from-[var(--ac)] to-transparent" />
                  )}
                </SpotlightCard>
              );
            })}
          </div>
        </div>
      </Reveal>
    </section>
  );
}
