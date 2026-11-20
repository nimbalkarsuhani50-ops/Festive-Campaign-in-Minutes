import { ArrowDown, PlayCircle, Sparkles } from "lucide-react";
import { AnimatePresence, motion, useScroll, useTransform } from "motion/react";
import { useEffect, useRef, useState } from "react";
import { FESTIVALS, LANGUAGES, STYLE_PRESETS } from "../data/campaigns";
import { Mandala } from "../fx/Mandala";
import { CountUp, EASE_OUT, Magnetic, SplitText } from "../fx/primitives";

const GREETINGS: { festival: string; greeting: string; lang: string; dir?: "rtl" }[] = [
  { festival: "Diwali", greeting: "शुभ दीपावली", lang: "Marathi" },
  { festival: "Eid", greeting: "عيد مبارك", lang: "Arabic", dir: "rtl" },
  { festival: "Onam", greeting: "ഓണാശംസകൾ", lang: "Malayalam" },
  { festival: "Christmas", greeting: "Joyeux Noël", lang: "French" },
  { festival: "Durga Puja", greeting: "শুভ শারদীয়া", lang: "Bengali" },
  { festival: "Chinese New Year", greeting: "新年快乐", lang: "Chinese" },
  { festival: "Pongal", greeting: "பொங்கல் வாழ்த்துக்கள்", lang: "Tamil" },
  { festival: "Ganesh Chaturthi", greeting: "गणपती बाप्पा मोरया", lang: "Marathi" },
  { festival: "Baisakhi", greeting: "ਵਿਸਾਖੀ ਦੀਆਂ ਵਧਾਈਆਂ", lang: "Punjabi" },
  { festival: "Ugadi", greeting: "ಯುಗಾದಿ ಹಬ್ಬದ ಶುಭಾಶಯಗಳು", lang: "Kannada" },
];

const RAMP = ["#FFE7A3", "#F5B041", "#F28C38", "#FF7E8A"];
function goldRamp(i: number, total: number) {
  const t = total <= 1 ? 0 : i / (total - 1);
  const seg = Math.min(RAMP.length - 2, Math.floor(t * (RAMP.length - 1)));
  const local = t * (RAMP.length - 1) - seg;
  const a = RAMP[seg];
  const b = RAMP[seg + 1];
  const mix = (x: string, y: string) => {
    const pa = parseInt(x, 16);
    const pb = parseInt(y, 16);
    return Math.round(pa + (pb - pa) * local);
  };
  const r = mix(a.slice(1, 3), b.slice(1, 3));
  const g = mix(a.slice(3, 5), b.slice(3, 5));
  const bl = mix(a.slice(5, 7), b.slice(5, 7));
  return {
    color: `rgb(${r}, ${g}, ${bl})`,
    textShadow: `0 0 32px rgba(${r}, ${g}, ${bl}, 0.35)`,
  };
}

interface HeroProps {
  onStart: () => void;
  onDemo: () => void;
}

export function Hero({ onStart, onDemo }: HeroProps) {
  const [gi, setGi] = useState(0);
  const ref = useRef<HTMLElement | null>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start start", "end start"] });
  const mandalaY = useTransform(scrollYProgress, [0, 1], [0, 220]);
  const mandalaScale = useTransform(scrollYProgress, [0, 1], [1, 1.35]);
  const contentY = useTransform(scrollYProgress, [0, 1], [0, -120]);
  const contentOpacity = useTransform(scrollYProgress, [0, 0.75], [1, 0]);

  useEffect(() => {
    const id = window.setInterval(() => setGi((i) => (i + 1) % GREETINGS.length), 2600);
    return () => window.clearInterval(id);
  }, []);

  const g = GREETINGS[gi];

  return (
    <section
      ref={ref}
      id="top"
      aria-label="Introduction"
      className="relative flex min-h-[calc(100svh-64px)] items-center overflow-hidden"
    >
      {/* Mandala backdrop */}
      <motion.div
        aria-hidden="true"
        style={{ y: mandalaY, scale: mandalaScale }}
        className="pointer-events-none absolute left-1/2 top-1/2 -z-0 h-[min(118vw,900px)] w-[min(118vw,900px)] -translate-x-1/2 -translate-y-1/2 opacity-[0.32] lg:left-[72%] lg:opacity-60"
      >
        <div className="absolute inset-[18%] rounded-full bg-[radial-gradient(circle,rgba(242,140,56,0.35)_0%,rgba(212,175,55,0.12)_40%,transparent_70%)] blur-3xl" />
        <Mandala className="relative h-full w-full" />
      </motion.div>

      <motion.div
        style={{ y: contentY, opacity: contentOpacity }}
        className="relative z-10 mx-auto w-full max-w-7xl px-4 py-16 sm:px-6 lg:px-8"
      >
        <motion.div
          initial={{ opacity: 0, y: 16, scale: 0.96 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.8, ease: EASE_OUT }}
          className="inline-flex items-center gap-2.5 rounded-full border border-[#D4AF37]/35 bg-white/[0.04] px-4 py-1.5 text-xs font-semibold tracking-wide text-slate-200 backdrop-blur-md sm:text-sm"
        >
          <span className="relative flex h-2 w-2">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[#F28C38] opacity-75" />
            <span className="relative inline-flex h-2 w-2 rounded-full bg-[#F28C38]" />
          </span>
          #DYPAICoE Launch <span className="text-slate-500">·</span> Dr. D. Y. Patil B-School, Pune
        </motion.div>

        <h1 className="mt-7 max-w-4xl font-display text-[2.9rem] font-bold leading-[1.02] tracking-tight text-white sm:text-7xl lg:text-[6.2rem]">
          <SplitText text="Festive campaigns," by="char" trigger="mount" stagger={0.028} delay={0.2} className="block" />
          <SplitText
            text="crafted in minutes."
            by="char"
            trigger="mount"
            stagger={0.028}
            delay={0.75}
            className="block pb-2"
            charStyle={goldRamp}
          />
        </h1>

        {/* Rotating multilingual greeting */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.5, duration: 0.8 }}
          className="mt-6 flex flex-wrap items-center gap-x-4 gap-y-2 text-lg text-slate-300 sm:text-2xl"
        >
          <span>One brief. Every festival.</span>
          <span className="relative inline-flex h-[1.6em] min-w-[12ch] items-center overflow-hidden">
            <AnimatePresence mode="popLayout">
              <motion.span
                key={gi}
                dir={g.dir}
                initial={{ y: "110%", opacity: 0, filter: "blur(8px)" }}
                animate={{ y: "0%", opacity: 1, filter: "blur(0px)" }}
                exit={{ y: "-110%", opacity: 0, filter: "blur(8px)" }}
                transition={{ duration: 0.7, ease: EASE_OUT }}
                className="inline-flex items-baseline gap-3 whitespace-nowrap font-bold text-[#F5B041]"
              >
                {g.greeting}
                <span className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400 sm:text-sm">
                  {g.festival} · {g.lang}
                </span>
              </motion.span>
            </AnimatePresence>
          </span>
        </motion.div>

        <motion.p
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1.7, duration: 0.9, ease: EASE_OUT }}
          className="mt-6 max-w-2xl text-base leading-relaxed text-slate-300 sm:text-lg"
        >
          A big idea, bilingual taglines, Instagram posts, a 15-second reel, a channel budget and a
          print-ready poster, generated live from a single brief.
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1.9, duration: 0.9, ease: EASE_OUT }}
          className="mt-10 flex flex-wrap items-center gap-4"
        >
          <Magnetic>
            <button
              type="button"
              onClick={onStart}
              className="btn-primary group relative inline-flex min-h-[56px] items-center gap-3 overflow-hidden rounded-2xl px-8 text-base font-bold text-[#090E1A] sm:text-lg"
            >
              <Sparkles className="h-5 w-5 transition-transform duration-500 group-hover:rotate-180" aria-hidden="true" />
              Start the brief
            </button>
          </Magnetic>
          <Magnetic strength={0.2}>
            <button
              type="button"
              onClick={onDemo}
              className="inline-flex min-h-[56px] items-center gap-3 rounded-2xl border border-white/15 bg-white/[0.05] px-7 text-base font-semibold text-white backdrop-blur-md transition-colors duration-300 hover:border-[#D4AF37]/70 hover:bg-white/[0.1] sm:text-lg"
            >
              <PlayCircle className="h-5 w-5 text-[#F5B041]" aria-hidden="true" />
              Play the Diwali demo
            </button>
          </Magnetic>
        </motion.div>

        <motion.dl
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 2.2, duration: 1 }}
          className="mt-14 grid max-w-xl grid-cols-3 gap-6 border-t border-white/10 pt-6"
        >
          {[
            { n: FESTIVALS.length, label: "Festivals & moments" },
            { n: LANGUAGES.length, label: "Languages & scripts" },
            { n: STYLE_PRESETS.length, label: "Art-directed styles" },
          ].map((s, i) => (
            <div key={s.label}>
              <dt className="sr-only">{s.label}</dt>
              <dd className="font-display text-3xl font-bold text-white sm:text-4xl">
                <CountUp value={s.n} delay={2.2 + i * 0.15} />
                <span className="text-[#F28C38]">+</span>
              </dd>
              <p className="mt-1 text-xs font-medium text-slate-400 sm:text-sm">{s.label}</p>
            </div>
          ))}
        </motion.dl>
      </motion.div>

      <motion.button
        type="button"
        onClick={onStart}
        aria-label="Scroll to the brief"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 2.6 }}
        className="absolute bottom-6 left-1/2 z-10 -translate-x-1/2 flex flex-col items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.25em] text-slate-400 hover:text-white"
      >
        <span className="flex h-10 w-6 justify-center rounded-full border border-white/25 pt-2">
          <motion.span
            animate={{ y: [0, 12, 0], opacity: [1, 0.2, 1] }}
            transition={{ duration: 1.8, repeat: Infinity, ease: "easeInOut" }}
            className="h-2 w-1 rounded-full bg-[#F5B041]"
          />
        </span>
        <ArrowDown className="h-3.5 w-3.5" aria-hidden="true" />
      </motion.button>
    </section>
  );
}
