import { Calendar, MapPin, Quote } from "lucide-react";
import { motion } from "motion/react";
import { getFestivalCountdownText } from "../data/campaigns";
import { EASE_OUT, Reveal, SectionHeading, SplitText } from "../fx/primitives";
import type { FestivalName } from "../types";

interface BigIdeaBannerProps {
  festival: FestivalName;
  brand: string;
  city: string;
  region?: string;
  bigIdea: string;
}

export function BigIdeaBanner({ festival, brand, city, region, bigIdea }: BigIdeaBannerProps) {
  const countdownText = getFestivalCountdownText(festival);

  return (
    <section id="big-idea" aria-label="Big Idea" className="scroll-section space-y-7">
      <SectionHeading
        index="02"
        kicker="The concept"
        title="The Big Idea"
        right={
          <div className="flex flex-wrap items-center gap-2 text-sm">
            <span className="chip font-semibold text-white">{brand}</span>
            <span className="chip">
              <MapPin className="h-3.5 w-3.5 text-[#F5B041]" aria-hidden="true" />
              {region ? `${city}, ${region}` : city}
            </span>
            <span className="chip border-[#F28C38]/40 text-[#F5B041]">{festival}</span>
          </div>
        }
      />

      <Reveal>
        <div className="aurora-border rounded-[28px] p-px">
          <div className="relative overflow-hidden rounded-[27px] bg-[#0A0F20]/95 px-6 py-10 sm:px-12 sm:py-16">
            {/* drifting glows */}
            <motion.div
              aria-hidden="true"
              animate={{ x: [0, 60, 0], y: [0, 30, 0] }}
              transition={{ duration: 14, repeat: Infinity, ease: "easeInOut" }}
              className="pointer-events-none absolute -right-24 -top-32 h-96 w-96 rounded-full bg-[radial-gradient(circle,rgba(242,140,56,0.28)_0%,transparent_70%)] blur-2xl"
            />
            <motion.div
              aria-hidden="true"
              animate={{ x: [0, -50, 0], y: [0, -20, 0] }}
              transition={{ duration: 17, repeat: Infinity, ease: "easeInOut" }}
              className="pointer-events-none absolute -bottom-40 -left-20 h-96 w-96 rounded-full bg-[radial-gradient(circle,rgba(255,126,182,0.16)_0%,transparent_70%)] blur-2xl"
            />

            <div className="relative flex flex-wrap items-center justify-between gap-4">
              <motion.span
                initial={{ opacity: 0, scale: 0.4, rotate: -20 }}
                whileInView={{ opacity: 1, scale: 1, rotate: 0 }}
                viewport={{ once: true }}
                transition={{ type: "spring", stiffness: 200, damping: 14, delay: 0.2 }}
                className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-[#F5B041] to-[#F28C38] text-[#1a0f05] shadow-[0_0_40px_rgba(242,140,56,0.5)]"
              >
                <Quote className="h-6 w-6 fill-current" aria-hidden="true" />
              </motion.span>
              <motion.span
                initial={{ opacity: 0, x: 20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.4, duration: 0.8, ease: EASE_OUT }}
                className="inline-flex items-center gap-2 rounded-full border border-[#D4AF37]/35 bg-[#D4AF37]/10 px-4 py-1.5 text-sm font-semibold text-[#F5B041] tabular-nums"
              >
                <Calendar className="h-4 w-4" aria-hidden="true" />
                {countdownText}
              </motion.span>
            </div>

            <SplitText
              key={bigIdea}
              as="p"
              text={bigIdea}
              delay={0.25}
              stagger={0.055}
              className="relative mt-10 block max-w-5xl font-display text-[1.9rem] font-bold leading-[1.18] tracking-tight text-white sm:text-5xl lg:text-[3.6rem]"
              style={{ textWrap: "balance" }}
            />
          </div>
        </div>
      </Reveal>
    </section>
  );
}
