import { Calendar } from "lucide-react";
import { motion } from "motion/react";
import { getFestivalCountdownText } from "../data/campaigns";
import type { FestivalName } from "../types";

interface BigIdeaBannerProps {
  festival: FestivalName;
  brand: string;
  city: string;
  region?: string;
  bigIdea: string;
}

export function BigIdeaBanner({
  festival,
  brand,
  city,
  region,
  bigIdea,
}: BigIdeaBannerProps) {
  const countdownText = getFestivalCountdownText(festival);

  return (
    <motion.section
      id="big-idea"
      aria-label="Big Idea"
      initial={{ opacity: 0, y: 18 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
      className="space-y-4"
    >
      <div className="flex flex-col gap-2 sm:flex-row sm:items-baseline sm:justify-between">
        <div className="flex items-center gap-2.5 text-sm font-semibold text-slate-300">
          <span className="text-[#F28C38] tabular-nums">02</span>
          <span aria-hidden="true">·</span>
          <h2 className="text-base font-bold text-white">Big Idea</h2>
        </div>

        <div className="flex flex-wrap items-center gap-2 text-sm text-slate-300">
          <span className="font-semibold text-white">{brand}</span>
          <span aria-hidden="true">·</span>
          <span>{region ? `${city}, ${region}` : city}</span>
          <span aria-hidden="true">·</span>
          <span className="text-[#D4AF37]">{festival}</span>
        </div>
      </div>

      <div className="glass-card glass-card-interactive relative overflow-hidden rounded-2xl border border-[#D4AF37]/35 p-6 sm:p-10">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -top-24 -right-24 h-64 w-64 rounded-full bg-[radial-gradient(circle,rgba(242,140,56,0.22)_0%,transparent_70%)] blur-2xl"
        />

        <div className="relative flex flex-col gap-4 border-b border-white/10 pb-5 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm font-medium text-slate-300">
            Core Campaign Concept
          </p>
          <div className="inline-flex items-center gap-2 text-sm font-semibold text-[#F28C38] tabular-nums whitespace-nowrap shrink-0">
            <Calendar className="h-4 w-4 text-[#D4AF37]" aria-hidden="true" />
            <span>{countdownText}</span>
          </div>
        </div>

        <p
          className="relative mt-6 max-w-5xl font-display text-2xl sm:text-3xl lg:text-[2.5rem] font-bold leading-[1.2] tracking-tight text-white"
          style={{ textWrap: "balance" }}
        >
          {bigIdea}
        </p>
      </div>
    </motion.section>
  );
}
