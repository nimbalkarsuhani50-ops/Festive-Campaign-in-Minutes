import { motion } from "motion/react";
import type { ReactNode } from "react";
import type { GlyphKind } from "../data/festivalMotifs";

/**
 * Animated icon for each festival, used in the loaders and the hero.
 * Colours come from the festival theme CSS variables.
 */
const loop = { repeat: Infinity, ease: "easeInOut" as const };
const AC = "var(--ac)";
const AC2 = "var(--ac2)";
const AC3 = "var(--ac3)";
const AC4 = "var(--ac4)";
const AC5 = "var(--ac5)";

function Svg({ className, children, animate, transition, origin = "50px 50px" }: { className: string; children: ReactNode; animate?: any; transition?: any; origin?: string }) {
  return (
    <motion.svg viewBox="0 0 100 100" className={className} aria-hidden="true" animate={animate} transition={transition} style={{ transformOrigin: origin, overflow: "visible" }}>
      {children}
    </motion.svg>
  );
}

const Flame = ({ x, y, s = 1, d = 0 }: { x: number; y: number; s?: number; d?: number }) => (
  <motion.path
    d={`M${x} ${y - 14 * s} C${x + 6 * s} ${y - 6 * s} ${x + 6 * s} ${y} ${x} ${y + 2 * s} C${x - 6 * s} ${y} ${x - 6 * s} ${y - 6 * s} ${x} ${y - 14 * s} Z`}
    fill="#FFD66B"
    style={{ transformOrigin: `${x}px ${y + 2 * s}px` }}
    animate={{ scaleY: [1, 1.18, 0.92, 1.1, 1], rotate: [0, -4, 3, -2, 0] }}
    transition={{ duration: 1.1, delay: d, ...loop }}
  />
);

export function FestiveGlyph({ kind, className = "h-16 w-16" }: { kind: GlyphKind; className?: string }) {
  const c = className;
  switch (kind) {
    case "diya":
      return (
        <Svg className={c}>
          <motion.circle cx="50" cy="40" r="26" fill={AC3} style={{ transformOrigin: "50px 40px" }} animate={{ scale: [0.85, 1.15, 0.85], opacity: [0.15, 0.35, 0.15] }} transition={{ duration: 1.6, ...loop }} />
          <Flame x={50} y={46} s={2} />
          <path d="M18 56 Q50 92 82 56 Q70 60 50 60 Q30 60 18 56 Z" fill={AC} />
          <path d="M22 56 Q50 64 78 56" stroke={AC4} strokeWidth="3" fill="none" strokeLinecap="round" />
        </Svg>
      );
    case "holi":
      return (
        <Svg className={c}>
          {[AC, AC2, AC3, AC5].map((col, i) => (
            <motion.circle key={i} cx={50 + Math.cos((i * Math.PI) / 2) * 14} cy={50 + Math.sin((i * Math.PI) / 2) * 14} r="16" fill={col} style={{ mixBlendMode: "screen" }} animate={{ scale: [0.7, 1.25, 0.7], opacity: [0.6, 0.95, 0.6] }} transition={{ duration: 2, delay: i * 0.25, ...loop }} />
          ))}
          {Array.from({ length: 10 }).map((_, i) => (
            <motion.circle key={`d${i}`} cx="50" cy="50" r="2.4" fill={i % 2 ? AC5 : AC3} animate={{ x: [0, Math.cos(i * 0.63) * 44], y: [0, Math.sin(i * 0.63) * 44], opacity: [1, 0] }} transition={{ duration: 1.6, delay: i * 0.08, repeat: Infinity, ease: "easeOut" }} />
          ))}
        </Svg>
      );
    case "dandiya":
      return (
        <Svg className={c}>
          <motion.g animate={{ rotate: [-28, -8, -28] }} transition={{ duration: 0.8, ...loop }} style={{ transformOrigin: "30px 84px" }}>
            <rect x="26" y="14" width="8" height="72" rx="4" fill={AC} />
            {[22, 38, 54, 70].map((y) => <rect key={y} x="26" y={y} width="8" height="5" fill={AC4} />)}
          </motion.g>
          <motion.g animate={{ rotate: [28, 8, 28] }} transition={{ duration: 0.8, ...loop }} style={{ transformOrigin: "70px 84px" }}>
            <rect x="66" y="14" width="8" height="72" rx="4" fill={AC5} />
            {[22, 38, 54, 70].map((y) => <rect key={y} x="66" y={y} width="8" height="5" fill={AC4} />)}
          </motion.g>
          <motion.circle cx="50" cy="26" r="5" fill={AC3} animate={{ scale: [0, 1.6, 0], opacity: [0, 1, 0] }} transition={{ duration: 0.8, repeat: Infinity }} />
        </Svg>
      );
    case "lotus":
      return (
        <Svg className={c} animate={{ scale: [0.96, 1.04, 0.96] }} transition={{ duration: 2.6, ...loop }} origin="50px 74px">
          {[-78, -52, 52, 78].map((r) => (
            <path key={r} d="M50 74 C40 58 42 40 50 26 C58 40 60 58 50 74 Z" fill={AC5} opacity="0.85" transform={`rotate(${r} 50 74)`} />
          ))}
          {[-26, 26].map((r) => (
            <path key={r} d="M50 74 C38 56 40 34 50 18 C60 34 62 56 50 74 Z" fill={AC3} transform={`rotate(${r} 50 74)`} />
          ))}
          <path d="M50 74 C38 54 40 28 50 10 C60 28 62 54 50 74 Z" fill={AC} />
          <path d="M18 80 Q50 92 82 80" stroke={AC2} strokeWidth="3" fill="none" strokeLinecap="round" />
          <motion.circle cx="50" cy="62" r="4" fill={AC4} animate={{ opacity: [0.4, 1, 0.4] }} transition={{ duration: 1.4, ...loop }} />
        </Svg>
      );
    case "modak":
      return (
        <Svg className={c} animate={{ y: [0, -4, 0] }} transition={{ duration: 1.8, ...loop }}>
          <path d="M50 12 C56 24 82 44 80 66 C78 82 22 82 20 66 C18 44 44 24 50 12 Z" fill={AC3} />
          {[-24, -12, 0, 12, 24].map((x) => <path key={x} d={`M50 14 Q${50 + x * 1.2} 46 ${50 + x} 78`} stroke={AC} strokeWidth="2.4" fill="none" opacity="0.8" />)}
          <ellipse cx="50" cy="80" rx="30" ry="5" fill={AC2} opacity="0.6" />
          <motion.circle cx="50" cy="12" r="4" fill={AC4} animate={{ opacity: [0.4, 1, 0.4] }} transition={{ duration: 1.2, ...loop }} />
        </Svg>
      );
    case "rakhi":
      return (
        <Svg className={c}>
          <motion.path d="M4 54 Q28 46 36 52 M64 52 Q72 46 96 54" stroke={AC5} strokeWidth="4" fill="none" strokeLinecap="round" animate={{ pathLength: [0.6, 1, 0.6] }} transition={{ duration: 2, ...loop }} />
          <motion.g animate={{ rotate: 360 }} transition={{ duration: 10, repeat: Infinity, ease: "linear" }} style={{ transformOrigin: "50px 52px" }}>
            {Array.from({ length: 10 }).map((_, i) => <ellipse key={i} cx="50" cy="32" rx="6" ry="12" fill={i % 2 ? AC : AC3} transform={`rotate(${i * 36} 50 52)`} />)}
          </motion.g>
          <circle cx="50" cy="52" r="10" fill={AC2} />
          <circle cx="50" cy="52" r="5" fill={AC4} />
        </Svg>
      );
    case "crescent":
      return (
        <Svg className={c}>
          <defs>
            <mask id="fg-crescent">
              <rect width="100" height="100" fill="white" />
              <circle cx="60" cy="42" r="30" fill="black" />
            </mask>
          </defs>
          <motion.g animate={{ rotate: [-6, 6, -6] }} transition={{ duration: 4, ...loop }} style={{ transformOrigin: "50px 50px" }}>
            <circle cx="44" cy="52" r="36" fill={AC2} mask="url(#fg-crescent)" />
          </motion.g>
          <motion.path d="M74 30 l4 9 10 1 -7 7 2 10 -9 -5 -9 5 2 -10 -7 -7 10 -1 Z" fill={AC4} animate={{ scale: [0.85, 1.15, 0.85], opacity: [0.7, 1, 0.7] }} transition={{ duration: 1.8, ...loop }} style={{ transformOrigin: "74px 44px" }} />
        </Svg>
      );
    case "tree":
      return (
        <Svg className={c}>
          <path d="M50 14 L76 50 L64 50 L84 78 L16 78 L36 50 L24 50 Z" fill="#1E7A3C" />
          <rect x="44" y="78" width="12" height="12" fill="#7C4A1E" />
          {[[40, 44, AC], [60, 58, AC3], [36, 68, AC5], [64, 72, AC], [50, 34, AC3]].map(([x, y, col], i) => (
            <motion.circle key={i} cx={x as number} cy={y as number} r="4" fill={col as string} animate={{ opacity: [0.4, 1, 0.4] }} transition={{ duration: 1.2, delay: i * 0.2, ...loop }} />
          ))}
          <motion.path d="M50 2 l3 7 8 1 -6 5 2 8 -7 -4 -7 4 2 -8 -6 -5 8 -1 Z" fill="#FFD66B" animate={{ scale: [0.9, 1.2, 0.9] }} transition={{ duration: 1.4, ...loop }} style={{ transformOrigin: "50px 12px" }} />
        </Svg>
      );
    case "pongalPot":
      return (
        <Svg className={c}>
          {[0, 1, 2].map((i) => (
            <motion.circle key={i} cx={42 + i * 8} cy="30" r="7" fill="#FFF6E0" style={{ transformOrigin: `${42 + i * 8}px 30px` }} animate={{ y: [2, -16], opacity: [1, 0], scale: [0.7, 1.3] }} transition={{ duration: 1.6, delay: i * 0.5, repeat: Infinity, ease: "easeOut" }} />
          ))}
          <path d="M26 38 Q50 30 74 38 Q70 30 50 28 Q30 30 26 38 Z" fill="#FFF6E0" />
          <path d="M28 38 Q16 60 30 80 Q50 92 70 80 Q84 60 72 38 Z" fill={AC} />
          <path d="M26 54 Q50 64 74 54" stroke={AC4} strokeWidth="4" fill="none" />
          {[34, 46, 58, 70].map((x) => <circle key={x} cx={x - 2} cy="68" r="2.4" fill={AC4} />)}
        </Svg>
      );
    case "pookalam":
      return (
        <Svg className={c} animate={{ rotate: 360 }} transition={{ duration: 16, repeat: Infinity, ease: "linear" }}>
          {[44, 36, 28, 20, 12].map((r, i) => <circle key={r} cx="50" cy="50" r={r} fill={["#FFD43B", "#FF8A1E", "#E8364B", "#FFFFFF", "#8B3FD9"][i]} />)}
          {Array.from({ length: 12 }).map((_, i) => <ellipse key={i} cx="50" cy="12" rx="4" ry="8" fill="#E8364B" transform={`rotate(${i * 30} 50 50)`} />)}
          <circle cx="50" cy="50" r="5" fill="#FFD43B" />
        </Svg>
      );
    case "wheat":
      return (
        <Svg className={c} animate={{ rotate: [-6, 6, -6] }} transition={{ duration: 2.6, ...loop }} origin="50px 92px">
          {[-14, 0, 14].map((x, j) => (
            <g key={x} transform={`rotate(${x} 50 92)`}>
              <line x1="50" y1="92" x2="50" y2="20" stroke={AC2} strokeWidth="2.5" />
              {Array.from({ length: 6 }).map((_, i) => (
                <g key={i}>
                  <ellipse cx="45" cy={24 + i * 8} rx="4" ry="7" fill={j === 1 ? AC3 : AC} transform={`rotate(-25 45 ${24 + i * 8})`} />
                  <ellipse cx="55" cy={24 + i * 8} rx="4" ry="7" fill={j === 1 ? AC3 : AC} transform={`rotate(25 55 ${24 + i * 8})`} />
                </g>
              ))}
            </g>
          ))}
        </Svg>
      );
    case "bonfire":
      return (
        <Svg className={c}>
          <rect x="18" y="78" width="64" height="8" rx="4" fill="#7C4A1E" transform="rotate(12 50 82)" />
          <rect x="18" y="78" width="64" height="8" rx="4" fill="#5C3416" transform="rotate(-12 50 82)" />
          <motion.path d="M50 10 C70 34 76 56 50 80 C24 56 30 34 50 10 Z" fill={AC} style={{ transformOrigin: "50px 80px" }} animate={{ scaleY: [1, 1.12, 0.94, 1.08, 1], rotate: [0, 3, -3, 2, 0] }} transition={{ duration: 1, ...loop }} />
          <motion.path d="M50 34 C62 48 64 62 50 78 C36 62 38 48 50 34 Z" fill={AC3} style={{ transformOrigin: "50px 78px" }} animate={{ scaleY: [1, 1.2, 0.9, 1] }} transition={{ duration: 0.8, ...loop }} />
          <path d="M50 54 C56 62 56 70 50 78 C44 70 44 62 50 54 Z" fill="#FFF3C4" />
        </Svg>
      );
    case "kite":
      return (
        <Svg className={c} animate={{ rotate: [-10, 10, -10], y: [0, -6, 0] }} transition={{ duration: 3, ...loop }}>
          <path d="M50 8 L80 40 L50 74 L20 40 Z" fill={AC} />
          <path d="M50 8 L50 74 M20 40 L80 40" stroke={AC4} strokeWidth="2.5" />
          <path d="M50 8 L80 40 L50 40 Z" fill={AC3} />
          <path d="M50 74 Q40 82 52 88 Q62 94 48 98" stroke={AC2} strokeWidth="2.5" fill="none" />
        </Svg>
      );
    case "feather":
      return (
        <Svg className={c} animate={{ rotate: [-12, 12, -12] }} transition={{ duration: 3, ...loop }} origin="50px 96px">
          <path d="M50 96 L50 30" stroke={AC2} strokeWidth="2" />
          <ellipse cx="50" cy="42" rx="20" ry="36" fill="#1FA88F" />
          {Array.from({ length: 10 }).map((_, i) => <path key={i} d={`M50 ${12 + i * 7} L${i % 2 ? 30 : 70} ${20 + i * 7}`} stroke="#7FE0C4" strokeWidth="1.2" opacity="0.6" />)}
          <ellipse cx="50" cy="32" rx="12" ry="15" fill="#D4AF37" />
          <ellipse cx="50" cy="33" rx="8" ry="10" fill="#1FA88F" />
          <motion.ellipse cx="50" cy="34" rx="5" ry="6" fill="#2F6BFF" animate={{ opacity: [0.7, 1, 0.7] }} transition={{ duration: 1.6, ...loop }} />
        </Svg>
      );
    case "sunrise":
      return (
        <Svg className={c}>
          <motion.g animate={{ y: [10, 0, 10] }} transition={{ duration: 3.2, ...loop }}>
            {Array.from({ length: 9 }).map((_, i) => <line key={i} x1="50" y1="62" x2={50 + Math.cos(Math.PI + (i * Math.PI) / 8) * 42} y2={62 + Math.sin(Math.PI + (i * Math.PI) / 8) * 42} stroke={AC3} strokeWidth="3" strokeLinecap="round" opacity="0.7" />)}
            <circle cx="50" cy="62" r="22" fill={AC} />
          </motion.g>
          <rect x="0" y="62" width="100" height="40" fill="var(--bg1)" />
          {[68, 76, 84].map((y, i) => <motion.path key={y} d={`M10 ${y} Q30 ${y - 4} 50 ${y} T90 ${y}`} stroke={AC4} strokeWidth="2.4" fill="none" opacity={0.8 - i * 0.2} animate={{ x: [-4, 4, -4] }} transition={{ duration: 2 + i, ...loop }} />)}
        </Svg>
      );
    case "dhol":
      return (
        <Svg className={c} animate={{ rotate: [-4, 4, -4] }} transition={{ duration: 0.5, ...loop }}>
          <rect x="20" y="30" width="60" height="44" rx="8" fill={AC} />
          <ellipse cx="20" cy="52" rx="8" ry="22" fill={AC4} />
          <ellipse cx="80" cy="52" rx="8" ry="22" fill={AC4} />
          {[30, 42, 54, 66].map((x) => <path key={x} d={`M${x} 30 L${x + 8} 74`} stroke={AC2} strokeWidth="2" />)}
          <motion.line x1="88" y1="20" x2="78" y2="40" stroke={AC3} strokeWidth="4" strokeLinecap="round" animate={{ rotate: [0, 20, 0] }} transition={{ duration: 0.5, ...loop }} style={{ transformOrigin: "88px 20px" }} />
        </Svg>
      );
    case "gudi":
      return (
        <Svg className={c}>
          <rect x="48" y="20" width="4" height="76" fill="#8B5A2B" />
          <path d="M44 22 Q50 8 56 22 Z" fill={AC2} />
          <motion.path d="M52 26 Q76 30 72 58 Q60 54 52 58 Z" fill={AC} animate={{ skewY: [0, 6, 0] }} transition={{ duration: 2, ...loop }} style={{ transformOrigin: "52px 26px" }} />
          {[0, 1, 2].map((i) => <ellipse key={i} cx={40 - i * 4} cy={30 + i * 6} rx="3" ry="7" fill="#3FAE49" transform={`rotate(-40 ${40 - i * 4} ${30 + i * 6})`} />)}
          {[0, 1, 2, 3].map((i) => <circle key={i} cx={44 + i * 4} cy="26" r="2.4" fill="#FFD43B" />)}
        </Svg>
      );
    case "moonSieve":
      return (
        <Svg className={c}>
          <motion.circle cx="50" cy="50" r="30" fill="#FFF6DA" animate={{ opacity: [0.75, 1, 0.75] }} transition={{ duration: 2.4, ...loop }} />
          <motion.g animate={{ x: [-6, 6, -6] }} transition={{ duration: 3.6, ...loop }}>
            <circle cx="50" cy="50" r="36" fill="none" stroke={AC2} strokeWidth="6" />
            {Array.from({ length: 7 }).map((_, i) => <line key={i} x1={26 + i * 8} y1="22" x2={26 + i * 8} y2="78" stroke={AC2} strokeWidth="1" opacity="0.5" />)}
            {Array.from({ length: 7 }).map((_, i) => <line key={`h${i}`} x1="22" y1={26 + i * 8} x2="78" y2={26 + i * 8} stroke={AC2} strokeWidth="1" opacity="0.5" />)}
          </motion.g>
        </Svg>
      );
    case "mangoLeaves":
      return (
        <Svg className={c}>
          <path d="M6 22 Q50 34 94 22" stroke={AC2} strokeWidth="3" fill="none" />
          {[14, 28, 42, 58, 72, 86].map((x, i) => (
            <motion.ellipse key={x} cx={x} cy="46" rx="6" ry="18" fill={i % 2 ? "#3FAE49" : "#2E8B3A"} animate={{ rotate: [-8, 8, -8] }} transition={{ duration: 2, delay: i * 0.15, ...loop }} style={{ transformOrigin: `${x}px 28px` }} />
          ))}
          {[21, 50, 79].map((x) => <circle key={x} cx={x} cy="30" r="4" fill={AC} />)}
        </Svg>
      );
    case "konna":
      return (
        <Svg className={c}>
          <path d="M50 4 L50 30" stroke="#3FAE49" strokeWidth="3" />
          {Array.from({ length: 14 }).map((_, i) => (
            <motion.circle key={i} cx={50 + Math.sin(i * 1.3) * (8 + i * 1.6)} cy={22 + i * 5} r={6 - i * 0.2} fill={i % 3 ? "#FFD43B" : "#F7B500"} animate={{ y: [0, 3, 0] }} transition={{ duration: 1.6, delay: i * 0.08, ...loop }} />
          ))}
        </Svg>
      );
    case "bow":
      return (
        <Svg className={c}>
          <path d="M30 10 Q74 50 30 90" stroke={AC2} strokeWidth="5" fill="none" strokeLinecap="round" />
          <motion.path d="M30 10 L30 90" stroke={AC4} strokeWidth="1.6" animate={{ d: ["M30 10 Q44 50 30 90", "M30 10 Q30 50 30 90"] }} transition={{ duration: 1.4, ...loop }} />
          <motion.g animate={{ x: [0, 40], opacity: [1, 0] }} transition={{ duration: 1.4, repeat: Infinity, ease: "easeIn" }}>
            <line x1="40" y1="50" x2="88" y2="50" stroke={AC} strokeWidth="3" />
            <path d="M88 50 L80 45 L80 55 Z" fill={AC} />
            <path d="M40 50 L34 45 M40 50 L34 55" stroke={AC3} strokeWidth="2.4" />
          </motion.g>
        </Svg>
      );
    case "trishul":
      return (
        <Svg className={c}>
          <motion.circle cx="50" cy="36" r="30" fill={AC} animate={{ opacity: [0.12, 0.28, 0.12] }} transition={{ duration: 2.4, ...loop }} />
          <rect x="47" y="30" width="6" height="66" fill={AC4} />
          <path d="M50 6 L56 28 L44 28 Z" fill={AC4} />
          <path d="M26 16 Q28 40 50 40 Q72 40 74 16 L68 30 Q60 34 50 34 Q40 34 32 30 Z" fill={AC4} />
          <ellipse cx="50" cy="58" rx="9" ry="6" fill={AC} />
          <line x1="44" y1="58" x2="56" y2="58" stroke={AC4} strokeWidth="2" />
        </Svg>
      );
    case "firework":
      return (
        <Svg className={c}>
          {Array.from({ length: 12 }).map((_, i) => (
            <motion.line key={i} x1="50" y1="50" x2={50 + Math.cos((i * Math.PI) / 6) * 40} y2={50 + Math.sin((i * Math.PI) / 6) * 40} stroke={i % 3 === 0 ? AC : i % 3 === 1 ? AC3 : AC5} strokeWidth="4" strokeLinecap="round" animate={{ pathLength: [0, 1, 1], opacity: [1, 1, 0] }} transition={{ duration: 1.4, repeat: Infinity, ease: "easeOut" }} />
          ))}
          <circle cx="50" cy="50" r="6" fill={AC4} />
        </Svg>
      );
    case "heart":
      return (
        <Svg className={c} animate={{ scale: [1, 1.15, 1, 1.1, 1] }} transition={{ duration: 1.3, ...loop }}>
          <path d="M50 86 C10 58 12 22 34 18 C44 16 50 26 50 30 C50 26 56 16 66 18 C88 22 90 58 50 86 Z" fill={AC} />
          <path d="M30 30 Q34 24 40 26" stroke={AC4} strokeWidth="4" strokeLinecap="round" fill="none" />
        </Svg>
      );
    case "egg":
      return (
        <Svg className={c} animate={{ rotate: [-10, 10, -10] }} transition={{ duration: 1.6, ...loop }} origin="50px 88px">
          <ellipse cx="50" cy="52" rx="28" ry="36" fill="#F9A8D4" />
          <path d="M22 44 L30 38 L38 44 L46 38 L54 44 L62 38 L70 44 L78 38" stroke="#FFFFFF" strokeWidth="3" fill="none" />
          <path d="M23 62 Q50 72 77 62" stroke="#A5F3FC" strokeWidth="5" fill="none" />
          {[36, 50, 64].map((x) => <circle key={x} cx={x} cy="52" r="3" fill="#FDE68A" />)}
        </Svg>
      );
    case "fanoos":
      return (
        <Svg className={c} animate={{ rotate: [-8, 8, -8] }} transition={{ duration: 2.6, ...loop }} origin="50px 2px">
          <line x1="50" y1="0" x2="50" y2="14" stroke={AC2} strokeWidth="2.5" />
          <path d="M38 14 L62 14 L56 22 L44 22 Z" fill={AC2} />
          <path d="M40 22 L60 22 L72 56 L50 84 L28 56 Z" fill={AC} opacity="0.9" />
          <motion.path d="M44 30 L56 30 L64 56 L50 74 L36 56 Z" fill="#FFF3C4" animate={{ opacity: [0.4, 0.85, 0.4] }} transition={{ duration: 1.4, ...loop }} />
          <path d="M40 22 L50 84 L60 22 M28 56 L72 56" stroke={AC2} strokeWidth="1.6" fill="none" />
          <circle cx="50" cy="90" r="4" fill={AC2} />
        </Svg>
      );
    case "menorah":
      return (
        <Svg className={c}>
          {Array.from({ length: 9 }).map((_, i) => {
            const x = 14 + i * 9;
            const top = i === 4 ? 30 : 38;
            return (
              <g key={i}>
                <rect x={x - 2} y={top} width="4" height="16" fill="#DBEAFE" />
                <Flame x={x} y={top - 2} s={0.7} d={i * 0.1} />
              </g>
            );
          })}
          <path d="M14 54 Q14 74 50 74 Q86 74 86 54" stroke={AC2} strokeWidth="3" fill="none" />
          <path d="M32 54 Q32 68 50 68 Q68 68 68 54" stroke={AC2} strokeWidth="3" fill="none" />
          <rect x="48" y="54" width="4" height="30" fill={AC2} />
          <rect x="36" y="84" width="28" height="6" rx="2" fill={AC2} />
        </Svg>
      );
    case "lantern":
      return (
        <Svg className={c} animate={{ rotate: [-8, 8, -8] }} transition={{ duration: 2.6, ...loop }} origin="50px 4px">
          <line x1="50" y1="2" x2="50" y2="18" stroke={AC2} strokeWidth="3" />
          <rect x="38" y="16" width="24" height="6" rx="2" fill={AC2} />
          <ellipse cx="50" cy="50" rx="30" ry="28" fill={AC} />
          <motion.ellipse cx="50" cy="50" rx="16" ry="20" fill={AC4} animate={{ opacity: [0.35, 0.7, 0.35] }} transition={{ duration: 1.4, ...loop }} />
          {[-18, 0, 18].map((x) => <path key={x} d={`M${50 + x} 23 Q${50 + x * 1.6} 50 ${50 + x} 77`} stroke={AC2} strokeWidth="1.6" fill="none" opacity="0.8" />)}
          <rect x="38" y="76" width="24" height="6" rx="2" fill={AC2} />
          <path d="M50 82 L50 96" stroke={AC2} strokeWidth="3" />
        </Svg>
      );
    case "pumpkin":
      return (
        <Svg className={c}>
          <rect x="47" y="12" width="6" height="14" rx="2" fill="#3F6212" />
          <ellipse cx="34" cy="56" rx="20" ry="30" fill={AC} />
          <ellipse cx="66" cy="56" rx="20" ry="30" fill={AC} />
          <ellipse cx="50" cy="56" rx="22" ry="32" fill={AC3} />
          <motion.g animate={{ opacity: [0.6, 1, 0.7, 1, 0.6] }} transition={{ duration: 1.2, ...loop }}>
            <path d="M34 46 L42 40 L44 50 Z M66 46 L58 40 L56 50 Z" fill="#FFE08A" />
            <path d="M32 64 Q50 78 68 64 L62 66 L58 62 L54 68 L50 62 L46 68 L42 62 L38 66 Z" fill="#FFE08A" />
          </motion.g>
        </Svg>
      );
    case "leaf":
      return (
        <Svg className={c} animate={{ rotate: [-14, 14, -14] }} transition={{ duration: 3, ...loop }}>
          <path d="M50 92 C20 70 14 40 50 8 C86 40 80 70 50 92 Z" fill={AC} />
          <path d="M50 92 L50 22 M50 44 L34 32 M50 44 L66 32 M50 62 L32 50 M50 62 L68 50" stroke={AC4} strokeWidth="2.5" strokeLinecap="round" fill="none" />
        </Svg>
      );
    case "sale":
      return (
        <Svg className={c} animate={{ rotate: [-8, 8, -8] }} transition={{ duration: 1.8, ...loop }}>
          <path d="M14 30 L52 12 L88 50 L50 88 Z" fill={AC} />
          <circle cx="42" cy="28" r="6" fill="#0B0B0B" />
          <motion.text x="56" y="62" textAnchor="middle" fontSize="22" fontWeight="900" fill="#0B0B0B" fontFamily="Plus Jakarta Sans, sans-serif" animate={{ opacity: [1, 0.4, 1] }} transition={{ duration: 0.9, ...loop }}>%</motion.text>
        </Svg>
      );
    case "cart":
      return (
        <Svg className={c} animate={{ x: [-6, 6, -6] }} transition={{ duration: 1.4, ...loop }}>
          <path d="M8 20 L22 20 L32 64 L80 64 L88 32 L26 32" stroke={AC} strokeWidth="5" fill="none" strokeLinejoin="round" strokeLinecap="round" />
          <circle cx="38" cy="78" r="6" fill={AC2} />
          <circle cx="74" cy="78" r="6" fill={AC2} />
          <motion.text x="58" y="56" textAnchor="middle" fontSize="18" fontWeight="900" fill={AC4} fontFamily="Plus Jakarta Sans, sans-serif" animate={{ y: [56, 50, 56] }} transition={{ duration: 0.7, ...loop }}>%</motion.text>
        </Svg>
      );
    case "stein":
      return (
        <Svg className={c} animate={{ rotate: [-6, 6, -6] }} transition={{ duration: 1.8, ...loop }}>
          <path d="M22 26 L68 26 L64 88 L26 88 Z" fill="#F7B500" />
          <path d="M68 38 Q86 40 84 58 Q82 74 66 72" stroke="#E2E8F0" strokeWidth="6" fill="none" />
          <path d="M18 26 Q24 10 36 18 Q44 6 56 16 Q68 10 72 26 Z" fill="#FFFFFF" />
          {[0, 1, 2].map((i) => <motion.circle key={i} cx={34 + i * 10} cy="80" r="2.4" fill="#FFF3C4" animate={{ y: [2, -46], opacity: [1, 0] }} transition={{ duration: 1.6, delay: i * 0.4, repeat: Infinity }} />)}
        </Svg>
      );
    case "tulip":
      return (
        <Svg className={c} animate={{ rotate: [-6, 6, -6] }} transition={{ duration: 2.6, ...loop }} origin="50px 96px">
          <path d="M50 96 L50 44" stroke="#3FAE49" strokeWidth="4" />
          <path d="M50 76 Q30 66 32 50 Q46 58 50 76 Z" fill="#3FAE49" />
          <path d="M32 18 Q34 48 50 50 Q66 48 68 18 Q60 28 50 14 Q40 28 32 18 Z" fill={AC} />
          <path d="M42 22 Q46 40 50 48" stroke={AC5} strokeWidth="2" fill="none" />
        </Svg>
      );
    case "tie":
      return (
        <Svg className={c} animate={{ rotate: [-6, 6, -6] }} transition={{ duration: 2.2, ...loop }} origin="50px 10px">
          <path d="M40 10 L60 10 L56 22 L44 22 Z" fill={AC2} />
          <path d="M44 22 L56 22 L66 74 L50 92 L34 74 Z" fill={AC} />
          {[34, 48, 62].map((y) => <path key={y} d={`M${42 + (y - 34) * 0.1} ${y} L${60 - (y - 34) * 0.05} ${y + 8}`} stroke={AC4} strokeWidth="3" opacity="0.6" />)}
        </Svg>
      );
    case "elevens":
      return (
        <Svg className={c} animate={{ scale: [1, 1.08, 1] }} transition={{ duration: 0.9, ...loop }}>
          <rect x="6" y="22" width="88" height="56" rx="12" fill={AC} />
          <text x="50" y="63" textAnchor="middle" fontSize="34" fontWeight="900" fill="#FFFFFF" fontFamily="Plus Jakarta Sans, sans-serif">11.11</text>
        </Svg>
      );
    default:
      return (
        <Svg className={c}>
          <circle cx="50" cy="50" r="30" fill={AC} />
        </Svg>
      );
  }
}
