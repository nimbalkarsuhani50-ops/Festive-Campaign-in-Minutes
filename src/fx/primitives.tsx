import {
  animate,
  motion,
  useInView,
  useMotionValue,
  useSpring,
  type HTMLMotionProps,
} from "motion/react";
import {
  Fragment,
  useEffect,
  useRef,
  type CSSProperties,
  type ElementType,
  type PointerEvent as ReactPointerEvent,
  type ReactNode,
} from "react";

export const EASE_OUT = [0.16, 1, 0.3, 1] as const;

/* ------------------------------------------------------------------ */
/* Reveal: fades, lifts and un-blurs content when it scrolls into view */
/* ------------------------------------------------------------------ */
export function Reveal({
  children,
  delay = 0,
  y = 36,
  className,
  amount = 0.18,
  ...rest
}: {
  children: ReactNode;
  delay?: number;
  y?: number;
  className?: string;
  amount?: number;
} & Omit<HTMLMotionProps<"div">, "children">) {
  return (
    <motion.div
      initial={{ opacity: 0, y, filter: "blur(10px)" }}
      whileInView={{ opacity: 1, y: 0, filter: "blur(0px)" }}
      viewport={{ once: true, amount }}
      transition={{ duration: 0.9, delay, ease: EASE_OUT }}
      className={className}
      {...rest}
    >
      {children}
    </motion.div>
  );
}

/* ------------------------------------------------------------------ */
/* SplitText: word-by-word (or char) blur-in reveal                    */
/* ------------------------------------------------------------------ */
export function SplitText({
  text,
  as: Tag = "span",
  className,
  style,
  delay = 0,
  stagger = 0.045,
  by = "word",
  trigger = "view",
  dir,
  charStyle,
}: {
  text: string;
  charStyle?: (index: number, total: number) => CSSProperties;
  as?: ElementType;
  className?: string;
  style?: CSSProperties;
  delay?: number;
  stagger?: number;
  by?: "word" | "char";
  trigger?: "view" | "mount";
  dir?: "ltr" | "rtl";
}) {
  const ref = useRef<HTMLElement | null>(null);
  const inView = useInView(ref, { once: true, amount: 0.3 });
  const show = trigger === "mount" || inView;

  const words = text.split(/\s+/).filter(Boolean);
  const total = words.reduce((n, w) => n + (by === "char" ? Array.from(w).length : 1), 0);
  let index = 0;

  return (
    <Tag ref={ref} className={className} style={style} dir={dir} aria-label={text}>
      {words.map((word, wi) => {
        const pieces = by === "char" ? Array.from(word) : [word];
        return (
          <Fragment key={`${word}-${wi}`}>
          <span aria-hidden="true" className={by === "char" ? "inline-block whitespace-nowrap" : "inline"}>
            {pieces.map((p, pi) => {
              const i = index++;
              return (
                <motion.span
                  key={pi}
                  className="inline-block will-change-transform"
                  style={charStyle?.(i, total)}
                  initial={{ opacity: 0, y: "0.45em", filter: "blur(12px)", rotateX: -40 }}
                  animate={
                    show
                      ? { opacity: 1, y: "0em", filter: "blur(0px)", rotateX: 0 }
                      : undefined
                  }
                  transition={{ duration: 0.8, delay: delay + i * stagger, ease: EASE_OUT }}
                >
                  {p}
                </motion.span>
              );
            })}
          </span>
          {wi < words.length - 1 ? " " : null}
          </Fragment>
        );
      })}
    </Tag>
  );
}

/* ------------------------------------------------------------------ */
/* SpotlightCard: glass card with cursor spotlight, glowing border and */
/* a gentle 3D tilt                                                    */
/* ------------------------------------------------------------------ */
export function SpotlightCard({
  children,
  className = "",
  tilt = 3,
  as = "div",
  ...rest
}: {
  children: ReactNode;
  className?: string;
  tilt?: number;
  as?: "div" | "article";
} & Omit<HTMLMotionProps<"div">, "children">) {
  const rx = useSpring(0, { stiffness: 220, damping: 22 });
  const ry = useSpring(0, { stiffness: 220, damping: 22 });

  function onMove(e: ReactPointerEvent<HTMLDivElement>) {
    const el = e.currentTarget;
    const r = el.getBoundingClientRect();
    const px = (e.clientX - r.left) / r.width;
    const py = (e.clientY - r.top) / r.height;
    el.style.setProperty("--mx", `${px * 100}%`);
    el.style.setProperty("--my", `${py * 100}%`);
    if (tilt) {
      rx.set((0.5 - py) * tilt);
      ry.set((px - 0.5) * tilt);
    }
  }
  function onLeave() {
    rx.set(0);
    ry.set(0);
  }

  const Comp = as === "article" ? motion.article : motion.div;
  return (
    <Comp
      onPointerMove={onMove}
      onPointerLeave={onLeave}
      style={{ rotateX: rx, rotateY: ry, transformPerspective: 1100 }}
      className={`glass-card spotlight ${className}`}
      {...rest}
    >
      {children}
    </Comp>
  );
}

/* ------------------------------------------------------------------ */
/* Magnetic: the child drifts toward the cursor                        */
/* ------------------------------------------------------------------ */
export function Magnetic({
  children,
  strength = 0.28,
  className,
}: {
  children: ReactNode;
  strength?: number;
  className?: string;
}) {
  const x = useSpring(0, { stiffness: 260, damping: 18, mass: 0.6 });
  const y = useSpring(0, { stiffness: 260, damping: 18, mass: 0.6 });
  return (
    <motion.div
      className={className}
      style={{ x, y }}
      onPointerMove={(e) => {
        const r = e.currentTarget.getBoundingClientRect();
        x.set((e.clientX - (r.left + r.width / 2)) * strength);
        y.set((e.clientY - (r.top + r.height / 2)) * strength);
      }}
      onPointerLeave={() => {
        x.set(0);
        y.set(0);
      }}
    >
      {children}
    </motion.div>
  );
}

/* ------------------------------------------------------------------ */
/* CountUp: animates a number when it scrolls into view                */
/* ------------------------------------------------------------------ */
export function CountUp({
  value,
  format = (n) => Math.round(n).toLocaleString(),
  duration = 1.6,
  delay = 0,
  className,
}: {
  value: number;
  format?: (n: number) => string;
  duration?: number;
  delay?: number;
  className?: string;
}) {
  const ref = useRef<HTMLSpanElement | null>(null);
  const inView = useInView(ref, { once: true, amount: 0.5 });
  const mv = useMotionValue(0);
  const formatRef = useRef(format);
  formatRef.current = format;

  useEffect(() => {
    if (!inView) return;
    const controls = animate(mv, value, {
      duration,
      delay,
      ease: [0.16, 1, 0.3, 1],
      onUpdate: (v) => {
        if (ref.current) ref.current.textContent = formatRef.current(v);
      },
    });
    return () => controls.stop();
  }, [inView, value, duration, delay, mv]);

  return (
    <span ref={ref} className={className}>
      {format(0)}
    </span>
  );
}

/* ------------------------------------------------------------------ */
/* SectionHeading: numbered eyebrow with a line that draws itself      */
/* ------------------------------------------------------------------ */
export function SectionHeading({
  index,
  title,
  kicker,
  right,
}: {
  index: string;
  title: string;
  kicker?: string;
  right?: ReactNode;
}) {
  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-3">
          <motion.span
            initial={{ opacity: 0, scale: 0.6 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, ease: EASE_OUT }}
            className="section-index font-display text-sm font-bold tabular-nums"
          >
            {index}
          </motion.span>
          <motion.span
            aria-hidden="true"
            initial={{ scaleX: 0 }}
            whileInView={{ scaleX: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 1.1, delay: 0.15, ease: EASE_OUT }}
            className="h-px max-w-[220px] flex-1 origin-left bg-gradient-to-r from-[#F28C38] via-[#D4AF37]/60 to-transparent"
          />
          {kicker && (
            <span className="text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-400">
              {kicker}
            </span>
          )}
        </div>
        <SplitText
          as="h2"
          text={title}
          className="mt-3 block font-display text-3xl font-bold tracking-tight text-white sm:text-[2.6rem] sm:leading-[1.1]"
          stagger={0.06}
        />
      </div>
      {right && (
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8, delay: 0.25, ease: EASE_OUT }}
          className="shrink-0"
        >
          {right}
        </motion.div>
      )}
    </div>
  );
}
