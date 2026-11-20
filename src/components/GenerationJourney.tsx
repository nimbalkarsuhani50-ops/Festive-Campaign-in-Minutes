import {
  Check,
  Compass,
  LayoutGrid,
  Lightbulb,
  PenTool,
  Wand2,
} from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import type { FestivalName, StylePreset } from "../types";

export interface JourneyStage {
  id: string;
  title: string;
  description: string;
}

export const JOURNEY_STAGES: JourneyStage[] = [
  {
    id: "brief",
    title: "Understanding brief",
    description: "Analyzing brand voice, city pulse, and audience context",
  },
  {
    id: "concept",
    title: "Crafting concept",
    description: "Shaping a culturally resonant festive big idea",
  },
  {
    id: "copy",
    title: "Writing copy",
    description: "Composing English & regional taglines, posts, and reel script",
  },
  {
    id: "layout",
    title: "Designing layout",
    description: "Allocating channel budgets and structuring stage flow",
  },
  {
    id: "poster",
    title: "Finishing poster",
    description: "Layering festival motifs, color harmony, and typography",
  },
];

const STAGE_ICONS = [Compass, Lightbulb, PenTool, LayoutGrid, Wand2];

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
  const clampedStage = Math.max(0, Math.min(stageIndex, JOURNEY_STAGES.length - 1));
  const currentStage = JOURNEY_STAGES[clampedStage];
  const ActiveIcon = STAGE_ICONS[clampedStage] ?? Wand2;

  const radius = 54;
  const circumference = 2 * Math.PI * radius;
  const strokeOffset =
    circumference - (Math.min(100, Math.max(0, progressPercent)) / 100) * circumference;

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          role="dialog"
          aria-modal="true"
          aria-label="Generating festive campaign"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.25 }}
          className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-[#060914]/90 p-4 backdrop-blur-2xl"
        >
          {/* Ambient festive radial glow */}
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-0 overflow-hidden"
          >
            <motion.div
              animate={{ scale: [1, 1.12, 1], opacity: [0.35, 0.55, 0.35] }}
              transition={{ duration: 4.5, repeat: Infinity, ease: "easeInOut" }}
              className="absolute top-1/2 left-1/2 h-[520px] w-[520px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[radial-gradient(circle,rgba(242,140,56,0.22)_0%,rgba(212,175,55,0.1)_42%,transparent_72%)] blur-2xl"
            />
          </div>

          <motion.div
            initial={{ opacity: 0, scale: 0.94, y: 18 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: -12 }}
            transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
            className="relative w-full max-w-xl rounded-2xl border border-white/15 bg-[#0D1428]/90 p-6 shadow-[0_24px_80px_rgba(0,0,0,0.75)] sm:p-10"
          >
            {/* Brief context metadata */}
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-white/10 pb-4 text-xs font-medium text-slate-300">
              <div className="flex flex-wrap items-center gap-2">
                <span className="font-semibold text-white">{brand || "Brand"}</span>
                <span aria-hidden="true">·</span>
                <span className="text-[#F28C38]">{festival}</span>
                <span aria-hidden="true">·</span>
                <span>{city}</span>
                <span aria-hidden="true">·</span>
                <span className="text-[#D4AF37]">{stylePreset}</span>
              </div>
              <span className="font-semibold text-slate-400 tabular-nums">
                {elapsedSeconds}s
              </span>
            </div>

            {/* Central Progress Ring & Morphing Stage Icon */}
            <div className="mt-8 flex flex-col items-center text-center">
              <div className="relative flex h-36 w-36 items-center justify-center">
                <svg
                  className="h-36 w-36 -rotate-90"
                  viewBox="0 0 132 132"
                  aria-hidden="true"
                >
                  <defs>
                    <linearGradient id="journeyRingGrad" x1="0" y1="0" x2="1" y2="1">
                      <stop offset="0%" stopColor="#F28C38" />
                      <stop offset="55%" stopColor="#F5B041" />
                      <stop offset="100%" stopColor="#D4AF37" />
                    </linearGradient>
                  </defs>
                  <circle
                    cx="66"
                    cy="66"
                    r={radius}
                    fill="none"
                    stroke="rgba(255,255,255,0.08)"
                    strokeWidth="7"
                  />
                  <motion.circle
                    cx="66"
                    cy="66"
                    r={radius}
                    fill="none"
                    stroke="url(#journeyRingGrad)"
                    strokeWidth="7"
                    strokeLinecap="round"
                    strokeDasharray={circumference}
                    animate={{ strokeDashoffset: strokeOffset }}
                    transition={{ duration: 0.4, ease: "easeOut" }}
                  />
                </svg>

                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <AnimatePresence mode="wait">
                    <motion.div
                      key={currentStage.id}
                      initial={{ opacity: 0, scale: 0.65, rotate: -14 }}
                      animate={{ opacity: 1, scale: 1, rotate: 0 }}
                      exit={{ opacity: 0, scale: 0.7, rotate: 14 }}
                      transition={{ duration: 0.28, ease: [0.16, 1, 0.3, 1] }}
                      className="flex h-12 w-12 items-center justify-center rounded-xl bg-[#F28C38]/15 text-[#F28C38] shadow-[0_0_24px_rgba(242,140,56,0.3)]"
                    >
                      <ActiveIcon className="h-6 w-6" aria-hidden="true" />
                    </motion.div>
                  </AnimatePresence>
                  <span className="mt-1.5 text-xs font-bold tracking-wide text-[#D4AF37] tabular-nums">
                    {Math.round(progressPercent)}%
                  </span>
                </div>
              </div>

              <AnimatePresence mode="wait">
                <motion.div
                  key={currentStage.id}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  transition={{ duration: 0.25 }}
                  className="mt-5 space-y-1.5"
                >
                  <h2 className="font-display text-2xl sm:text-3xl font-bold tracking-tight text-white">
                    {currentStage.title}
                  </h2>
                  <p className="text-sm text-slate-300">
                    {currentStage.description}
                  </p>
                </motion.div>
              </AnimatePresence>
            </div>

            {/* 5-Stage Stepper Checklist */}
            <ol className="mt-8 space-y-2.5">
              {JOURNEY_STAGES.map((stage, idx) => {
                const isDone = idx < clampedStage || progressPercent >= 100;
                const isActive = idx === clampedStage && progressPercent < 100;
                const StepIcon = STAGE_ICONS[idx] ?? Wand2;

                return (
                  <motion.li
                    key={stage.id}
                    animate={{
                      opacity: isDone || isActive ? 1 : 0.45,
                    }}
                    transition={{ duration: 0.25 }}
                    className={`flex items-center justify-between gap-4 rounded-xl border px-4 py-3 transition-colors ${
                      isActive
                        ? "border-[#F28C38]/55 bg-[#F28C38]/10 shadow-[0_0_20px_rgba(242,140,56,0.12)]"
                        : isDone
                          ? "border-[#D4AF37]/25 bg-white/[0.03]"
                          : "border-white/[0.06] bg-white/[0.015]"
                    }`}
                  >
                    <div className="flex items-center gap-3.5 min-w-0">
                      <div
                        className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-xs font-bold transition-colors ${
                          isDone
                            ? "bg-[#D4AF37] text-[#080D1A]"
                            : isActive
                              ? "bg-[#F28C38] text-[#080D1A]"
                              : "bg-white/10 text-slate-400"
                        }`}
                      >
                        {isDone ? (
                          <Check className="h-4 w-4 stroke-[2.75]" aria-hidden="true" />
                        ) : (
                          <StepIcon className="h-4 w-4" aria-hidden="true" />
                        )}
                      </div>
                      <div className="min-w-0">
                        <p
                          className={`text-sm font-semibold truncate ${
                            isActive || isDone ? "text-white" : "text-slate-400"
                          }`}
                        >
                          {stage.title}
                        </p>
                      </div>
                    </div>

                    <span className="text-xs font-semibold tabular-nums shrink-0">
                      {isDone ? (
                        <span className="text-[#D4AF37]">Done</span>
                      ) : isActive ? (
                        <span className="text-[#F28C38]">Crafting...</span>
                      ) : (
                        <span className="text-slate-500">Queued</span>
                      )}
                    </span>
                  </motion.li>
                );
              })}
            </ol>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
