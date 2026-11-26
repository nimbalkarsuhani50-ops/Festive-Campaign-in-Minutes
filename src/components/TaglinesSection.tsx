import { Globe2, Languages } from "lucide-react";
import { Reveal, SectionHeading, SplitText, SpotlightCard } from "../fx/primitives";
import type { RegionalLanguage } from "../types";
import { CopyButton } from "./CopyButton";

interface TaglinesSectionProps {
  taglineEn: string;
  taglineRegional: string;
  language: RegionalLanguage;
}

export function TaglinesSection({ taglineEn, taglineRegional, language }: TaglinesSectionProps) {
  const isRtl = language === "Arabic" || language === "Urdu";

  return (
    <section id="taglines" aria-label="Taglines" className="scroll-section space-y-7">
      <SectionHeading index="05" kicker="Two voices, one idea" title="Campaign Taglines" />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Reveal>
          <SpotlightCard className="flex h-full flex-col justify-between gap-10 rounded-3xl p-7 sm:p-10">
            <div className="space-y-5">
              <p className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">
                <Globe2 className="h-4 w-4 text-[color:var(--ac2)]" aria-hidden="true" /> English
              </p>
              <SplitText
                key={taglineEn}
                as="p"
                text={taglineEn}
                stagger={0.07}
                className="block font-display text-3xl font-bold leading-[1.15] text-white sm:text-[2.6rem]"
              />
            </div>
            <div className="flex items-center justify-between border-t border-white/10 pt-5">
              <span className="text-xs font-medium text-slate-400">Primary hook</span>
              <CopyButton textToCopy={taglineEn} label="Copy English" />
            </div>
          </SpotlightCard>
        </Reveal>

        <Reveal delay={0.12}>
          <SpotlightCard className="flex h-full flex-col justify-between gap-10 rounded-3xl p-7 sm:p-10">
            <div className="space-y-5">
              <p className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">
                <Languages className="h-4 w-4 text-[color:var(--ac)]" aria-hidden="true" /> {language}
              </p>
              <SplitText
                key={taglineRegional}
                as="p"
                dir={isRtl ? "rtl" : "ltr"}
                text={taglineRegional}
                stagger={0.09}
                delay={0.2}
                className="block text-3xl font-bold leading-[1.35] text-[color:var(--ac3)] drop-shadow-[0_0_28px_rgba(var(--ac3-rgb),0.35)] sm:text-[2.6rem]"
              />
            </div>
            <div className="flex items-center justify-between border-t border-white/10 pt-5">
              <span className="text-xs font-medium text-[color:var(--ac)]">
                {language === "English" ? "Global adaptation" : "Regional adaptation"}
              </span>
              <CopyButton textToCopy={taglineRegional} label={`Copy ${language}`} />
            </div>
          </SpotlightCard>
        </Reveal>
      </div>
    </section>
  );
}
