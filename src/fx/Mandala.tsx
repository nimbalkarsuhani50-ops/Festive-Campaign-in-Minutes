import { motion } from "motion/react";
import { useId } from "react";

interface Ring {
  r1: number;
  r2: number;
  count: number;
  width: number;
  spin: number;
}

const RINGS: Ring[] = [
  { r1: 18, r2: 62, count: 8, width: 16, spin: 1 },
  { r1: 58, r2: 112, count: 12, width: 18, spin: -1 },
  { r1: 106, r2: 160, count: 16, width: 17, spin: 1 },
  { r1: 156, r2: 214, count: 24, width: 14, spin: -1 },
  { r1: 210, r2: 248, count: 36, width: 9, spin: 1 },
];

function petalPath(r1: number, r2: number, w: number) {
  const mid = (r1 + r2) / 2;
  return `M0,${-r1} C${w},${-mid + 8} ${w * 0.6},${-r2 + 6} 0,${-r2} C${-w * 0.6},${-r2 + 6} ${-w},${-mid + 8} 0,${-r1} Z`;
}

/**
 * A rangoli mandala that draws itself stroke by stroke, then slowly breathes and
 * rotates. `progress` (0-1) can drive how much of it has been drawn.
 */
export function Mandala({
  className,
  progress,
  spinSeconds = 140,
}: {
  className?: string;
  progress?: number;
  spinSeconds?: number;
}) {
  const uid = useId().replace(/:/g, "");
  const controlled = typeof progress === "number";

  return (
    <svg viewBox="-260 -260 520 520" className={className} aria-hidden="true">
      <defs>
        <linearGradient id={`g1${uid}`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="var(--ac4)" />
          <stop offset="45%" stopColor="var(--ac3)" />
          <stop offset="100%" stopColor="var(--ac)" />
        </linearGradient>
        <linearGradient id={`g2${uid}`} x1="1" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="var(--ac5)" />
          <stop offset="100%" stopColor="var(--ac)" />
        </linearGradient>
        <radialGradient id={`core${uid}`}>
          <stop offset="0%" stopColor="var(--ac4)" stopOpacity="1" />
          <stop offset="40%" stopColor="var(--ac3)" stopOpacity="0.7" />
          <stop offset="100%" stopColor="var(--ac)" stopOpacity="0" />
        </radialGradient>
        <filter id={`glow${uid}`} x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation="2.4" result="b" />
          <feMerge>
            <feMergeNode in="b" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>

      <motion.circle
        r={46}
        fill={`url(#core${uid})`}
        animate={{ scale: [1, 1.18, 1], opacity: [0.7, 1, 0.7] }}
        transition={{ duration: 3.6, repeat: Infinity, ease: "easeInOut" }}
      />

      <g filter={`url(#glow${uid})`}>
        {RINGS.map((ring, ri) => {
          const ringStart = ri / RINGS.length;
          const ringProgress = controlled
            ? Math.max(0, Math.min(1, (progress! - ringStart) * RINGS.length))
            : undefined;
          return (
            <motion.g
              key={ri}
              animate={{ rotate: 360 * ring.spin }}
              transition={{ duration: spinSeconds + ri * 25, repeat: Infinity, ease: "linear" }}
            >
              {Array.from({ length: ring.count }).map((_, i) => {
                const angle = (360 / ring.count) * i;
                return (
                  <motion.path
                    key={i}
                    d={petalPath(ring.r1, ring.r2, ring.width)}
                    transform={`rotate(${angle})`}
                    fill="none"
                    stroke={ri % 2 === 0 ? `url(#g1${uid})` : `url(#g2${uid})`}
                    strokeWidth={ri === 4 ? 1 : 1.4}
                    strokeLinecap="round"
                    initial={{ pathLength: 0, opacity: 0 }}
                    animate={
                      controlled
                        ? { pathLength: ringProgress, opacity: ringProgress! > 0 ? 0.95 : 0 }
                        : { pathLength: 1, opacity: 0.9 }
                    }
                    transition={
                      controlled
                        ? { duration: 0.6, ease: "easeOut" }
                        : {
                            duration: 1.6,
                            delay: 0.25 + ri * 0.28 + (i / ring.count) * 0.5,
                            ease: [0.16, 1, 0.3, 1],
                          }
                    }
                  />
                );
              })}
              {Array.from({ length: ring.count }).map((_, i) => {
                const a = ((360 / ring.count) * (i + 0.5) * Math.PI) / 180;
                const rr = ring.r2 - 4;
                return (
                  <motion.circle
                    key={`d${i}`}
                    cx={Math.sin(a) * rr}
                    cy={-Math.cos(a) * rr}
                    r={ri === 4 ? 1.4 : 2.2}
                    fill="var(--ac4)"
                    initial={{ opacity: 0, scale: 0 }}
                    animate={
                      controlled
                        ? { opacity: ringProgress! >= 1 ? 1 : 0, scale: ringProgress! >= 1 ? 1 : 0 }
                        : { opacity: [0, 1, 0.5, 1], scale: 1 }
                    }
                    transition={{
                      duration: controlled ? 0.4 : 2.4,
                      delay: controlled ? i * 0.01 : 1.2 + ri * 0.3 + i * 0.02,
                    }}
                  />
                );
              })}
            </motion.g>
          );
        })}
      </g>
    </svg>
  );
}
