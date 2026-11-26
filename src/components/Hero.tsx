import { ArrowDown, PlayCircle, Sparkles } from "lucide-react";
import { AnimatePresence, motion, useScroll, useTransform } from "motion/react";
import { useEffect, useRef, useState } from "react";
import { FESTIVALS, LANGUAGES } from "../data/campaigns";
import { Mandala } from "../fx/Mandala";
import { FestiveGlyph } from "../fx/FestiveGlyph";
import { getFestivalMotif } from "../data/festivalMotifs";
import { CountUp, EASE_OUT, Magnetic, SplitText } from "../fx/primitives";

type Greeting = { greeting: string; lang: string; dir?: "rtl" };
const G = (greeting: string, lang: string, dir?: "rtl"): Greeting => ({ greeting, lang, dir });

/** Native-language greeting(s) for each festival; the hero cycles through them. */
const GREETINGS: Record<string, Greeting[]> = {
  Diwali: [G("शुभ दीपावली", "Marathi"), G("Happy Diwali", "English")],
  Holi: [G("होली है!", "Hindi"), G("Happy Holi", "English")],
  Navratri: [G("શુભ નવરાત્રી", "Gujarati"), G("Happy Navratri", "English")],
  "Durga Puja": [G("শুভ শারদীয়া", "Bengali"), G("Shubho Pujo", "English")],
  "Ganesh Chaturthi": [G("गणपती बाप्पा मोरया", "Marathi"), G("Happy Ganesh Chaturthi", "English")],
  "Raksha Bandhan": [G("रक्षाबंधन की शुभकामनाएं", "Hindi"), G("Happy Raksha Bandhan", "English")],
  Eid: [G("عيد مبارك", "Arabic", "rtl"), G("Eid Mubarak", "English")],
  Christmas: [G("Merry Christmas", "English"), G("Joyeux Noël", "French")],
  Pongal: [G("பொங்கல் வாழ்த்துக்கள்", "Tamil"), G("Happy Pongal", "English")],
  Onam: [G("ഓണാശംസകൾ", "Malayalam"), G("Happy Onam", "English")],
  Baisakhi: [G("ਵਿਸਾਖੀ ਦੀਆਂ ਵਧਾਈਆਂ", "Punjabi"), G("Happy Baisakhi", "English")],
  Lohri: [G("ਲੋਹੜੀ ਦੀਆਂ ਵਧਾਈਆਂ", "Punjabi"), G("Happy Lohri", "English")],
  "Makar Sankranti": [G("मकर संक्रांतीच्या शुभेच्छा", "Marathi"), G("Happy Uttarayan", "English")],
  Janmashtami: [G("जय श्री कृष्ण", "Hindi"), G("Happy Janmashtami", "English")],
  Chhath: [G("छठ पूजा की शुभकामनाएं", "Hindi"), G("Happy Chhath Puja", "English")],
  Bihu: [G("ৰঙালী বিহুৰ শুভেচ্ছা", "Assamese"), G("Happy Bihu", "English")],
  "Gudi Padwa": [G("गुढीपाडव्याच्या शुभेच्छा", "Marathi"), G("Happy Gudi Padwa", "English")],
  Ugadi: [G("ಯುಗಾದಿ ಹಬ್ಬದ ಶುಭಾಶಯಗಳು", "Kannada"), G("ఉగాది శుభాకాంక్షలు", "Telugu")],
  Vishu: [G("വിഷു ആശംസകൾ", "Malayalam"), G("Happy Vishu", "English")],
  "Karva Chauth": [G("करवा चौथ की शुभकामनाएं", "Hindi"), G("Happy Karva Chauth", "English")],
  Dussehra: [G("विजयादशमी की शुभकामनाएं", "Hindi"), G("Happy Dussehra", "English")],
  "Maha Shivratri": [G("हर हर महादेव", "Hindi"), G("Happy Maha Shivratri", "English")],
  "New Year": [G("Happy New Year", "English"), G("नया साल मुबारक", "Hindi")],
  "Valentine's Day": [G("Happy Valentine's Day", "English"), G("Je t'aime", "French")],
  Easter: [G("Happy Easter", "English"), G("Felices Pascuas", "Spanish")],
  Ramadan: [G("رمضان كريم", "Arabic", "rtl"), G("Ramadan Kareem", "English")],
  Hanukkah: [G("חג חנוכה שמח", "Hebrew", "rtl"), G("Happy Hanukkah", "English")],
  "Chinese New Year": [G("新年快乐", "Chinese"), G("恭喜发财", "Chinese")],
  Halloween: [G("Happy Halloween", "English"), G("Trick or treat!", "English")],
  Thanksgiving: [G("Happy Thanksgiving", "English"), G("Give thanks", "English")],
  "Black Friday": [G("Black Friday Deals", "English"), G("Doors open now", "English")],
  "Cyber Monday": [G("Cyber Monday Deals", "English"), G("Click. Save. Smile.", "English")],
  Oktoberfest: [G("O'zapft is!", "German"), G("Prost!", "German")],
  "Mother's Day": [G("Happy Mother's Day", "English"), G("माँ, तुम सबसे खास हो", "Hindi")],
  "Father's Day": [G("Happy Father's Day", "English"), G("पापा, आप हीरो हो", "Hindi")],
  "Singles' Day": [G("双十一快乐", "Chinese"), G("Happy 11.11", "English")],
};

const RAMP = ["var(--ac4)", "var(--ac3)", "var(--ac)", "#FF7E8A"];
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
  festival?: string;
}

export function Hero({ onStart, onDemo, festival = "Diwali" }: HeroProps) {
  const glyph = getFestivalMotif(festival).glyph;
  const [gi, setGi] = useState(0);
  const ref = useRef<HTMLElement | null>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start start", "end start"] });
  const mandalaY = useTransform(scrollYProgress, [0, 1], [0, 220]);
  const mandalaScale = useTransform(scrollYProgress, [0, 1], [1, 1.35]);
  const contentY = useTransform(scrollYProgress, [0, 1], [0, -120]);
  const contentOpacity = useTransform(scrollYProgress, [0, 0.75], [1, 0]);

  const greetings = GREETINGS[festival] ?? GREETINGS.Diwali;
  useEffect(() => {
    setGi(0);
    const id = window.setInterval(() => setGi((i) => i + 1), 2800);
    return () => window.clearInterval(id);
  }, [festival]);

  const g = greetings[gi % greetings.length];

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
        <div className="absolute inset-[18%] rounded-full bg-[radial-gradient(circle,rgba(var(--ac-rgb),0.35)_0%,rgba(var(--ac2-rgb),0.12)_40%,transparent_70%)] blur-3xl" />
        <Mandala className="relative h-full w-full" />
        <AnimatePresence mode="wait">
          <motion.div
            key={glyph}
            initial={{ opacity: 0, scale: 0.6, rotate: -20 }}
            animate={{ opacity: 1, scale: 1, rotate: 0 }}
            exit={{ opacity: 0, scale: 0.6, rotate: 20 }}
            transition={{ duration: 0.7, ease: EASE_OUT }}
            className="absolute inset-[34%] flex items-center justify-center"
          >
            <div className="absolute inset-0 rounded-full bg-[radial-gradient(circle,rgba(var(--ac3-rgb),0.45),transparent_70%)] blur-2xl" />
            <FestiveGlyph kind={glyph} className="relative h-full w-full drop-shadow-[0_0_30px_rgba(var(--ac3-rgb),0.6)]" />
          </motion.div>
        </AnimatePresence>
      </motion.div>

      <motion.div
        style={{ y: contentY, opacity: contentOpacity }}
        className="relative z-10 mx-auto w-full max-w-7xl px-4 py-16 sm:px-6 lg:px-8"
      >
        <motion.div
          initial={{ opacity: 0, y: 16, scale: 0.96 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.8, ease: EASE_OUT }}
          className="inline-flex items-center gap-2.5 rounded-full border border-[color:var(--ac2)]/35 bg-white/[0.04] px-4 py-1.5 text-xs font-semibold tracking-wide text-slate-200 backdrop-blur-md sm:text-sm"
        >
          <span className="relative flex h-2 w-2">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[var(--ac)] opacity-75" />
            <span className="relative inline-flex h-2 w-2 rounded-full bg-[var(--ac)]" />
          </span>
          #DYPAICoE Launch <span className="text-slate-500">·</span> Dr. D. Y. Patil B-School, Pune
        </motion.div>
        <AnimatePresence mode="wait">
          <motion.div
            key={festival}
            initial={{ opacity: 0, x: -12 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 12 }}
            transition={{ duration: 0.4 }}
            className="ml-0 mt-3 inline-flex items-center gap-2 rounded-full border border-[color:var(--ac)]/40 bg-[var(--ac)]/10 py-1 pl-1.5 pr-4 text-xs font-semibold text-[color:var(--ac4)] backdrop-blur-md sm:ml-3 sm:mt-0 sm:text-sm"
          >
            <FestiveGlyph kind={glyph} className="h-6 w-6" />
            Now designing for {festival}
          </motion.div>
        </AnimatePresence>

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
                key={`${festival}-${gi % greetings.length}`}
                dir={g.dir}
                initial={{ y: "110%", opacity: 0, filter: "blur(8px)" }}
                animate={{ y: "0%", opacity: 1, filter: "blur(0px)" }}
                exit={{ y: "-110%", opacity: 0, filter: "blur(8px)" }}
                transition={{ duration: 0.7, ease: EASE_OUT }}
                className="inline-flex items-baseline gap-3 whitespace-nowrap font-bold text-[color:var(--ac3)]"
              >
                {g.greeting}
                <span className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400 sm:text-sm">
                  {festival} · {g.lang}
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
              className="inline-flex min-h-[56px] items-center gap-3 rounded-2xl border border-white/15 bg-white/[0.05] px-7 text-base font-semibold text-white backdrop-blur-md transition-colors duration-300 hover:border-[color:var(--ac2)]/70 hover:bg-white/[0.1] sm:text-lg"
            >
              <PlayCircle className="h-5 w-5 text-[color:var(--ac3)]" aria-hidden="true" />
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
            { n: 3, label: "AI posters per brand" },
          ].map((s, i) => (
            <div key={s.label}>
              <dt className="sr-only">{s.label}</dt>
              <dd className="font-display text-3xl font-bold text-white sm:text-4xl">
                <CountUp value={s.n} delay={2.2 + i * 0.15} />
                <span className="text-[color:var(--ac)]">+</span>
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
            className="h-2 w-1 rounded-full bg-[var(--ac3)]"
          />
        </span>
        <ArrowDown className="h-3.5 w-3.5" aria-hidden="true" />
      </motion.button>
    </section>
  );
}
