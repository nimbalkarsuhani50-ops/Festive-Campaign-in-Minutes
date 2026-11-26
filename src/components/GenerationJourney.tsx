import { Check, Compass, LayoutGrid, Lightbulb, PenTool, Wand2 } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useEffect, useState } from "react";
import { Mandala } from "../fx/Mandala";
import { FestiveGlyph } from "../fx/FestiveGlyph";
import { getFestivalMotif } from "../data/festivalMotifs";
import { EASE_OUT } from "../fx/primitives";
import type { FestivalName, StylePreset } from "../types";

export interface JourneyStage {
  id: string;
  title: string;
  description: string;
}

export const JOURNEY_STAGES: JourneyStage[] = [
  { id: "brief", title: "Understanding brief", description: "Analyzing brand voice, city pulse, and audience context" },
  { id: "concept", title: "Crafting concept", description: "Shaping a culturally resonant festive big idea" },
  { id: "copy", title: "Writing copy", description: "Composing English & regional taglines, posts, and reel script" },
  { id: "layout", title: "Designing layout", description: "Allocating channel budgets and structuring stage flow" },
  { id: "poster", title: "Finishing poster", description: "Layering festival motifs, color harmony, and typography" },
];

const STAGE_ICONS = [Compass, Lightbulb, PenTool, LayoutGrid, Wand2];
const GLYPHS = "ॐ✦◆✧✶❖✺卍※अकखगदीपम";

/** Letters that scramble into place, like a split-flap board. */
function ScrambleText({ text, className }: { text: string; className?: string }) {
  const [out, setOut] = useState(text);
  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      setOut(text);
      return;
    }
    let frame = 0;
    const total = 22;
    const id = window.setInterval(() => {
      frame++;
      const revealed = Math.floor((frame / total) * text.length);
      setOut(
        text
          .split("")
          .map((ch, i) =>
            ch === " " || i < revealed ? ch : GLYPHS[Math.floor(Math.random() * GLYPHS.length)]
          )
          .join("")
      );
      if (frame >= total) {
        window.clearInterval(id);
        setOut(text);
      }
    }, 34);
    return () => window.clearInterval(id);
  }, [text]);
  return (
    <span className={className} aria-label={text}>
      {out}
    </span>
  );
}

interface GenerationJourneyProps {
  isOpen: boolean;
  stageIndex: number;
  progressPercent: number;
  brand: string;
  festival: FestivalName;
  city: string;
  stylePreset: StylePreset;
  elapsedSeconds: number;
}

export function GenerationJourney({
  isOpen,
  stageIndex,
  progressPercent,
  brand,
  festival,
  city,
  stylePreset,
  elapsedSeconds,
}: GenerationJourneyProps) {
  const motif = getFestivalMotif(festival);
  const clampedStage = Math.max(0, Math.min(stageIndex, JOURNEY_STAGES.length - 1));
  const currentStage = JOURNEY_STAGES[clampedStage];
  const done = progressPercent >= 100;
  const pct = Math.min(100, Math.max(0, progressPercent));

  const radius = 200;
  const circumference = 2 * Math.PI * radius;

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          role="dialog"
          aria-modal="true"
          aria-label="Generating festive campaign"
          data-lenis-prevent
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0, transition: { duration: 0.7, delay: 0.15 } }}
          transition={{ duration: 0.5 }}
          className="fixed inset-0 z-50 flex flex-col items-center justify-center overflow-hidden bg-[#04060E]/95 px-4 backdrop-blur-2xl"
        >
          {/* Aurora backdrop */}
          <div aria-hidden="true" className="pointer-events-none absolute inset-0">
            <div className="aurora aurora-a" />
            <div className="aurora aurora-b" />
            <div className="aurora aurora-c" />
          </div>

          {/* Brief chips */}
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.7, ease: EASE_OUT }}
            className="relative z-10 flex flex-wrap items-center justify-center gap-2"
          >
            {[brand || "Brand", festival, city, "3 posters + reel"].map((chip, i) => (
              <motion.span
                key={chip + i}
                initial={{ opacity: 0, scale: 0.6 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.3 + i * 0.1, type: "spring", stiffness: 300, damping: 20 }}
                className={`rounded-full border px-3.5 py-1 text-xs font-semibold sm:text-sm ${
                  i === 0
                    ? "border-white/25 bg-white/10 text-white"
                    : i === 1
                      ? "border-[color:var(--ac)]/50 bg-[var(--ac)]/10 text-[color:var(--ac3)]"
                      : "border-white/10 bg-white/[0.04] text-slate-300"
                }`}
              >
                {chip}
              </motion.span>
            ))}
            <span className="rounded-full border border-white/10 bg-white/[0.04] px-3 py-1 text-xs font-semibold tabular-nums text-slate-400 sm:text-sm">
              {elapsedSeconds}s
            </span>
          </motion.div>

          {/* Mandala + ring core */}
          <motion.div
            initial={{ scale: 0.6, opacity: 0, rotate: -30 }}
            animate={done ? { scale: 1.25, opacity: 1, rotate: 0 } : { scale: 1, opacity: 1, rotate: 0 }}
            transition={{ duration: done ? 0.6 : 1.1, ease: EASE_OUT }}
            className="relative z-10 my-6 aspect-square w-[min(78vw,52vh,440px)]"
          >
            <div className="absolute inset-[22%] rounded-full bg-[radial-gradient(circle,rgba(var(--ac3-rgb),0.45),transparent_70%)] blur-2xl" />
            <Mandala className="absolute inset-0 h-full w-full" progress={0.12 + (pct / 100) * 0.88} spinSeconds={60} />

            <svg viewBox="-230 -230 460 460" className="absolute inset-0 h-full w-full -rotate-90" aria-hidden="true">
              <defs>
                <linearGradient id="jring" x1="0" y1="0" x2="1" y2="1">
                  <stop offset="0%" stopColor="var(--ac)" />
                  <stop offset="55%" stopColor="var(--ac3)" />
                  <stop offset="100%" stopColor="var(--ac5)" />
                </linearGradient>
              </defs>
              <circle r={radius} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="3" />
              <motion.circle
                r={radius}
                fill="none"
                stroke="url(#jring)"
                strokeWidth="4"
                strokeLinecap="round"
                strokeDasharray={circumference}
                initial={{ strokeDashoffset: circumference }}
                animate={{ strokeDashoffset: circumference - (pct / 100) * circumference }}
                transition={{ duration: 0.7, ease: "easeOut" }}
                style={{ filter: "drop-shadow(0 0 8px rgba(var(--ac3-rgb),0.8))" }}
              />
            </svg>

            {/* Orbiting sparks */}
            {[0, 1, 2].map((i) => (
              <motion.div
                key={i}
                className="absolute inset-0"
                animate={{ rotate: i % 2 ? -360 : 360 }}
                transition={{ duration: 6 + i * 3, repeat: Infinity, ease: "linear" }}
              >
                <span
                  className="absolute left-1/2 h-2 w-2 -translate-x-1/2 rounded-full bg-[var(--ac4)] shadow-[0_0_16px_6px_rgba(var(--ac3-rgb),0.7)]"
                  style={{ top: `${2 + i * 9}%` }}
                />
              </motion.div>
            ))}

            {/* Centre readout */}
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <AnimatePresence mode="wait">
                {done ? (
                  <motion.div
                    key="done"
                    initial={{ scale: 0, rotate: -90 }}
                    animate={{ scale: 1, rotate: 0 }}
                    transition={{ type: "spring", stiffness: 260, damping: 16 }}
                    className="flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-br from-[var(--ac4)] to-[var(--ac)] text-[#1a0f05] shadow-[0_0_60px_rgba(var(--ac3-rgb),0.9)]"
                  >
                    <Check className="h-10 w-10 stroke-[3]" aria-hidden="true" />
                  </motion.div>
                ) : (
                  <motion.div key="pct" className="flex flex-col items-center gap-1">
                  <FestiveGlyph kind={motif.glyph} className="h-16 w-16 drop-shadow-[0_0_18px_rgba(var(--ac3-rgb),0.7)] sm:h-20 sm:w-20" />
                  <motion.span
                    className="font-display text-5xl font-bold tabular-nums text-white drop-shadow-[0_0_24px_rgba(var(--ac3-rgb),0.6)] sm:text-6xl"
                  >
                    {Math.round(pct)}
                    <span className="text-2xl text-[color:var(--ac3)]">%</span>
                  </motion.span>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </motion.div>

          {/* Stage title */}
          <div className="relative z-10 h-[5.5rem] text-center">
            <AnimatePresence mode="wait">
              <motion.div
                key={done ? "ready" : currentStage.id}
                initial={{ opacity: 0, y: 14, filter: "blur(8px)" }}
                animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
                exit={{ opacity: 0, y: -14, filter: "blur(8px)" }}
                transition={{ duration: 0.4, ease: EASE_OUT }}
              >
                <h2 className="font-display text-3xl font-bold tracking-tight text-white sm:text-4xl">
                  <ScrambleText text={done ? "Your campaign is ready" : currentStage.title} />
                </h2>
                <p className="mt-2 text-sm text-slate-300 sm:text-base">
                  {done ? "Raising the curtain..." : `${motif.lines[clampedStage]} · ${currentStage.description}`}
                </p>
              </motion.div>
            </AnimatePresence>
          </div>

          {/* Stage rail */}
          <ol className="relative z-10 mt-6 flex w-full max-w-3xl items-center justify-between gap-1 px-2">
            <div aria-hidden="true" className="absolute left-6 right-6 top-4 h-px bg-white/10" />
            <motion.div
              aria-hidden="true"
              className="absolute left-6 top-4 h-px origin-left bg-gradient-to-r from-[var(--ac)] to-[var(--ac3)] shadow-[0_0_10px_rgba(var(--ac3-rgb),0.9)]"
              style={{ right: "1.5rem" }}
              initial={{ scaleX: 0 }}
              animate={{ scaleX: done ? 1 : clampedStage / (JOURNEY_STAGES.length - 1) }}
              transition={{ duration: 0.6, ease: EASE_OUT }}
            />
            {JOURNEY_STAGES.map((stage, idx) => {
              const isDone = idx < clampedStage || done;
              const isActive = idx === clampedStage && !done;
              const Icon = STAGE_ICONS[idx] ?? Wand2;
              return (
                <li key={stage.id} className="relative flex flex-1 flex-col items-center gap-2">
                  <motion.span
                    animate={{
                      scale: isActive ? 1.15 : 1,
                      boxShadow: isActive
                        ? "0 0 0 6px rgba(var(--ac-rgb),0.18), 0 0 24px rgba(var(--ac-rgb),0.7)"
                        : "0 0 0 0 rgba(0,0,0,0)",
                    }}
                    transition={{ type: "spring", stiffness: 300, damping: 20 }}
                    className={`flex h-8 w-8 items-center justify-center rounded-full text-xs font-bold ${
                      isDone
                        ? "bg-[var(--ac2)] text-[#080D1A]"
                        : isActive
                          ? "bg-[var(--ac)] text-[#080D1A]"
                          : "border border-white/15 bg-[#0B1224] text-slate-500"
                    }`}
                  >
                    {isDone ? <Check className="h-4 w-4 stroke-[3]" aria-hidden="true" /> : <Icon className="h-4 w-4" aria-hidden="true" />}
                  </motion.span>
                  <span
                    className={`hidden text-center text-[11px] font-semibold sm:block ${
                      isActive ? "text-[color:var(--ac3)]" : isDone ? "text-slate-200" : "text-slate-500"
                    }`}
                  >
                    {stage.title}
                  </span>
                </li>
              );
            })}
          </ol>

          {/* Finale flash */}
          <AnimatePresence>
            {done && (
              <motion.div
                aria-hidden="true"
                initial={{ opacity: 0, scale: 0.2 }}
                animate={{ opacity: [0, 0.85, 0], scale: [0.2, 2.6, 3.2] }}
                transition={{ duration: 0.9, ease: "easeOut" }}
                className="pointer-events-none absolute left-1/2 top-1/2 z-20 h-[60vmin] w-[60vmin] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[radial-gradient(circle,#FFF3C4_0%,rgba(var(--ac3-rgb),0.6)_35%,transparent_70%)]"
              />
            )}
          </AnimatePresence>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
