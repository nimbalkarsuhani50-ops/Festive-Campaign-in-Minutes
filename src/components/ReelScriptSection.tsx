import { motion } from "motion/react";
import type { ReelScript } from "../types";

interface ReelScriptSectionProps {
  reelScript: ReelScript;
}

export function ReelScriptSection({ reelScript }: ReelScriptSectionProps) {
  const segments = [
    {
      step: "01",
      label: "0-3 s Hook",
      content: reelScript.hook_0_3s,
    },
    {
      step: "02",
      label: "3-10 s Scene",
      content: reelScript.scene_3_10s,
    },
    {
      step: "03",
      label: "10-15 s CTA",
      content: reelScript.cta_10_15s,
    },
  ];

  return (
    <motion.section
      aria-label="Reel Script"
      initial={{ opacity: 0, y: 18 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: 0.14, ease: [0.16, 1, 0.3, 1] }}
      className="space-y-4"
    >
      <div className="flex items-center gap-2.5 text-sm font-semibold text-slate-300">
        <span className="text-[#F28C38] tabular-nums">05</span>
        <span aria-hidden="true">·</span>
        <h2 className="text-base font-bold text-white">
          15-Second Reel Script
        </h2>
      </div>

      <div className="glass-card glass-card-interactive rounded-2xl overflow-hidden">
        <div className="grid grid-cols-1 divide-y divide-white/10 md:grid-cols-3 md:divide-y-0 md:divide-x">
          {segments.map((seg) => (
            <div key={seg.label} className="p-6 sm:p-7 space-y-3">
              <div className="flex items-center justify-between gap-3">
                <span className="text-sm font-bold text-[#F28C38] tabular-nums">
                  {seg.label}
                </span>
                <span className="text-xs font-semibold text-slate-400 tabular-nums">
                  Beat {seg.step}
                </span>
              </div>
              <p className="text-base sm:text-lg font-medium leading-relaxed text-slate-100">
                {seg.content}
              </p>
            </div>
          ))}
        </div>
      </div>
    </motion.section>
  );
}
