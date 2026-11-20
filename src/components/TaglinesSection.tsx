import { motion } from "motion/react";
import type { RegionalLanguage } from "../types";
import { CopyButton } from "./CopyButton";

interface TaglinesSectionProps {
  taglineEn: string;
  taglineRegional: string;
  language: RegionalLanguage;
}

export function TaglinesSection({
  taglineEn,
  taglineRegional,
  language,
}: TaglinesSectionProps) {
  const isRtl = language === "Arabic" || language === "Urdu";

  return (
    <motion.section
      aria-label="Taglines"
      initial={{ opacity: 0, y: 18 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: 0.05, ease: [0.16, 1, 0.3, 1] }}
      className="space-y-4"
    >
      <div className="flex items-center gap-2.5 text-sm font-semibold text-slate-300">
        <span className="text-[#F28C38] tabular-nums">03</span>
        <span aria-hidden="true">·</span>
        <h2 className="text-base font-bold text-white">Campaign Taglines</h2>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div className="glass-card glass-card-interactive flex flex-col justify-between gap-6 rounded-2xl p-6 sm:p-8">
          <div className="space-y-2.5">
            <p className="text-xs font-semibold tracking-wide text-slate-400">
              English Tagline
            </p>
            <p className="font-display text-2xl sm:text-[1.85rem] font-bold leading-snug text-white">
              {taglineEn}
            </p>
          </div>
          <div className="flex items-center justify-between border-t border-white/10 pt-4">
            <span className="text-xs font-medium text-slate-400">Primary hook</span>
            <CopyButton textToCopy={taglineEn} label="Copy English" />
          </div>
        </div>

        <div className="glass-card glass-card-interactive flex flex-col justify-between gap-6 rounded-2xl p-6 sm:p-8">
          <div className="space-y-2.5">
            <p className="text-xs font-semibold tracking-wide text-slate-400">
              {language} Tagline
            </p>
            <p
              dir={isRtl ? "rtl" : "ltr"}
              className="text-2xl sm:text-[1.85rem] font-bold leading-snug text-[#F5B041]"
            >
              {taglineRegional}
            </p>
          </div>
          <div className="flex items-center justify-between border-t border-white/10 pt-4">
            <span className="text-xs font-medium text-[#F28C38]">
              {language === "English" ? "Global adaptation" : "Regional adaptation"}
            </span>
            <CopyButton
              textToCopy={taglineRegional}
              label={`Copy ${language}`}
            />
          </div>
        </div>
      </div>
    </motion.section>
  );
}
