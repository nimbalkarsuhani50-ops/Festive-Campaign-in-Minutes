import { FileDown, Loader2 } from "lucide-react";
import { motion, useScroll, useSpring } from "motion/react";
import { scrollToId } from "../fx/smoothScroll";
import { useActiveSection } from "../fx/useActiveSection";

interface HeaderProps {
  hasCampaign: boolean;
  isExportingPdf: boolean;
  onExportPdf: () => void;
}

const NAV = [
  { id: "brief", label: "Brief" },
  { id: "big-idea", label: "Big Idea" },
  { id: "poster-section", label: "Posters" },
  { id: "reel-script", label: "Reel" },
  { id: "instagram-posts", label: "Carousel" },
  { id: "channel-plan", label: "Budget" },
];

export function Header({ hasCampaign, isExportingPdf, onExportPdf }: HeaderProps) {
  const { scrollYProgress } = useScroll();
  const progress = useSpring(scrollYProgress, { stiffness: 140, damping: 30, mass: 0.4 });
  const active = useActiveSection(NAV.map((n) => n.id));

  return (
    <header className="sticky top-0 z-40 border-b border-white/[0.07] bg-[#080D1A]/70 backdrop-blur-2xl backdrop-saturate-150">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-6 px-4 sm:px-6 lg:px-8">
        <a
          href="#top"
          onClick={(e) => {
            e.preventDefault();
            scrollToId("top");
          }}
          className="group flex items-center gap-2.5 whitespace-nowrap"
        >
          <span className="relative flex h-8 w-8 items-center justify-center rounded-xl bg-gradient-to-br from-[var(--ac3)] to-[var(--ac)] shadow-[0_0_24px_rgba(var(--ac-rgb),0.55)]">
            <svg viewBox="0 0 24 24" className="h-4.5 w-4.5 text-[#1a0f05]" aria-hidden="true">
              {/* diya flame */}
              <path
                fill="currentColor"
                d="M12 2c1.8 2.6 3.4 4.6 3.4 7a3.4 3.4 0 1 1-6.8 0c0-2.4 1.6-4.4 3.4-7Zm-8 12h16c-.6 3.6-3.9 6-8 6s-7.4-2.4-8-6Z"
              />
            </svg>
            <span className="absolute inset-0 rounded-xl ring-1 ring-white/40 transition-transform duration-500 group-hover:rotate-45" />
          </span>
          <span className="font-display text-base font-bold tracking-tight text-white sm:text-xl">
            Festive Campaign <span className="text-[color:var(--ac3)]">Board</span>
          </span>
        </a>

        <nav aria-label="Workspace sections" className="hidden items-center gap-1 lg:flex">
          {NAV.map((item) => {
            const isActive = active === item.id;
            const disabled = item.id !== "brief" && !hasCampaign;
            return (
              <a
                key={item.id}
                href={`#${item.id}`}
                aria-current={isActive ? "true" : undefined}
                aria-disabled={disabled || undefined}
                onClick={(e) => {
                  e.preventDefault();
                  if (!disabled) scrollToId(item.id);
                }}
                className={`relative isolate rounded-full px-3.5 py-1.5 text-sm font-medium transition-colors duration-300 ${
                  isActive ? "text-[#090E1A]" : disabled ? "cursor-default text-slate-600" : "text-slate-300 hover:text-white"
                }`}
              >
                {isActive && (
                  <motion.span
                    layoutId="nav-pill"
                    className="absolute inset-0 -z-10 rounded-full bg-gradient-to-r from-[var(--ac3)] to-[var(--ac)] shadow-[0_0_18px_rgba(var(--ac-rgb),0.45)]"
                    transition={{ type: "spring", stiffness: 380, damping: 32 }}
                  />
                )}
                <span className="relative">{item.label}</span>
              </a>
            );
          })}
        </nav>

        <button
          type="button"
          disabled={!hasCampaign || isExportingPdf}
          onClick={onExportPdf}
          className="inline-flex items-center gap-2 rounded-full border border-[color:var(--ac2)]/50 bg-white/[0.06] px-4 py-2 text-sm font-semibold text-white transition-all duration-300 hover:border-[color:var(--ac)] hover:bg-[var(--ac)]/15 hover:shadow-[0_0_20px_rgba(var(--ac-rgb),0.28)] active:scale-[0.97] disabled:cursor-not-allowed disabled:opacity-40 whitespace-nowrap"
        >
          {isExportingPdf ? (
            <Loader2 className="h-4 w-4 animate-spin text-[color:var(--ac)]" aria-hidden="true" />
          ) : (
            <FileDown className="h-4 w-4 text-[color:var(--ac)]" aria-hidden="true" />
          )}
          <span className="hidden sm:inline">{isExportingPdf ? "Exporting..." : "Export PDF"}</span>
        </button>
      </div>

      {/* Scroll progress */}
      <motion.div
        aria-hidden="true"
        style={{ scaleX: progress }}
        className="absolute inset-x-0 -bottom-px h-[2px] origin-left bg-gradient-to-r from-[var(--ac)] via-[var(--ac3)] to-[var(--ac5)] shadow-[0_0_12px_rgba(var(--ac3-rgb),0.8)]"
      />
    </header>
  );
}
