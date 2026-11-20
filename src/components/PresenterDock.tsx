import { ChevronDown, ChevronUp, Maximize2, Minimize2 } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useEffect, useState } from "react";
import { scrollToId } from "../fx/smoothScroll";
import { useActiveSection } from "../fx/useActiveSection";

const SECTIONS = [
  { id: "top", label: "Intro" },
  { id: "brief", label: "Brief" },
  { id: "big-idea", label: "Big Idea" },
  { id: "taglines", label: "Taglines" },
  { id: "instagram-posts", label: "Instagram" },
  { id: "reel-script", label: "Reel" },
  { id: "channel-plan", label: "Channels" },
  { id: "poster-section", label: "Poster" },
  { id: "export-section", label: "Export" },
];

function isTyping(target: EventTarget | null) {
  const el = target as HTMLElement | null;
  if (!el) return false;
  const tag = el.tagName;
  return tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT" || el.isContentEditable;
}

/**
 * Stage presenter controls: a vertical dot rail on the right edge, plus
 * clicker-friendly keys (→ / PageDown next, ← / PageUp previous, F fullscreen).
 */
export function PresenterDock() {
  const [present, setPresent] = useState<string[]>(["top", "brief"]);
  const active = useActiveSection(present) ?? "top";
  const [isFull, setIsFull] = useState(false);
  const [showHint, setShowHint] = useState(true);

  // Track which sections currently exist on the page
  useEffect(() => {
    const update = () => {
      const ids = SECTIONS.map((s) => s.id).filter((id) => document.getElementById(id));
      setPresent((prev) => (prev.join() === ids.join() ? prev : ids));
    };
    update();
    const mo = new MutationObserver(update);
    mo.observe(document.body, { childList: true, subtree: true });
    return () => mo.disconnect();
  }, []);

  useEffect(() => {
    const t = window.setTimeout(() => setShowHint(false), 7000);
    const onFs = () => setIsFull(Boolean(document.fullscreenElement));
    document.addEventListener("fullscreenchange", onFs);
    return () => {
      window.clearTimeout(t);
      document.removeEventListener("fullscreenchange", onFs);
    };
  }, []);

  useEffect(() => {
    const go = (dir: 1 | -1) => {
      const idx = Math.max(0, present.indexOf(active));
      const next = present[Math.min(present.length - 1, Math.max(0, idx + dir))];
      if (next) scrollToId(next, { duration: 1.25 });
    };
    const onKey = (e: KeyboardEvent) => {
      if (isTyping(e.target) || e.metaKey || e.ctrlKey || e.altKey) return;
      if (document.querySelector('[role="dialog"][aria-modal="true"]')) return;
      if (e.key === "ArrowRight" || e.key === "PageDown") {
        e.preventDefault();
        go(1);
      } else if (e.key === "ArrowLeft" || e.key === "PageUp") {
        e.preventDefault();
        go(-1);
      } else if (e.key === "f" || e.key === "F") {
        toggleFullscreen();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [present, active]);

  function toggleFullscreen() {
    if (document.fullscreenElement) void document.exitFullscreen();
    else void document.documentElement.requestFullscreen?.();
  }

  const idx = present.indexOf(active);

  return (
    <>
      <nav
        aria-label="Presentation sections"
        className="fixed right-4 top-1/2 z-30 hidden -translate-y-1/2 flex-col items-end gap-3 xl:flex"
      >
        {present.map((id) => {
          const s = SECTIONS.find((x) => x.id === id)!;
          const on = id === active;
          return (
            <button
              key={id}
              type="button"
              onClick={() => scrollToId(id)}
              className="group flex items-center gap-3"
              aria-label={`Go to ${s.label}`}
              aria-current={on ? "true" : undefined}
            >
              <span
                className={`text-[11px] font-semibold uppercase tracking-[0.18em] transition-all duration-300 ${
                  on
                    ? "translate-x-0 text-[#F5B041] opacity-100"
                    : "translate-x-2 text-slate-400 opacity-0 group-hover:translate-x-0 group-hover:opacity-100"
                }`}
              >
                {s.label}
              </span>
              <span className="relative flex h-3 w-3 items-center justify-center">
                {on && (
                  <motion.span
                    layoutId="dock-dot"
                    className="absolute h-3 w-3 rounded-full bg-[#F28C38] shadow-[0_0_14px_rgba(242,140,56,0.9)]"
                    transition={{ type: "spring", stiffness: 420, damping: 30 }}
                  />
                )}
                <span className={`h-1.5 w-1.5 rounded-full ${on ? "bg-white" : "bg-white/30 group-hover:bg-white/70"}`} />
              </span>
            </button>
          );
        })}
      </nav>

      <div className="fixed bottom-5 right-5 z-30 flex items-center gap-1.5 rounded-full border border-white/10 bg-[#0B1224]/75 p-1.5 shadow-[0_12px_40px_rgba(0,0,0,0.5)] backdrop-blur-xl">
        <AnimatePresence>
          {showHint && (
            <motion.span
              initial={{ opacity: 0, width: 0 }}
              animate={{ opacity: 1, width: "auto" }}
              exit={{ opacity: 0, width: 0 }}
              className="hidden overflow-hidden whitespace-nowrap pl-3 pr-1 text-xs text-slate-300 sm:block"
            >
              <kbd className="kbd">←</kbd> <kbd className="kbd">→</kbd> navigate · <kbd className="kbd">F</kbd> fullscreen
            </motion.span>
          )}
        </AnimatePresence>
        <button
          type="button"
          onClick={() => present[idx - 1] && scrollToId(present[idx - 1])}
          disabled={idx <= 0}
          aria-label="Previous section"
          className="dock-btn"
        >
          <ChevronUp className="h-4 w-4" aria-hidden="true" />
        </button>
        <span className="min-w-[3.2rem] text-center text-xs font-semibold tabular-nums text-slate-300">
          {String(Math.max(0, idx) + 1).padStart(2, "0")}
          <span className="text-slate-500"> / {String(present.length).padStart(2, "0")}</span>
        </span>
        <button
          type="button"
          onClick={() => present[idx + 1] && scrollToId(present[idx + 1])}
          disabled={idx >= present.length - 1}
          aria-label="Next section"
          className="dock-btn"
        >
          <ChevronDown className="h-4 w-4" aria-hidden="true" />
        </button>
        <button type="button" onClick={toggleFullscreen} aria-label="Toggle fullscreen" className="dock-btn">
          {isFull ? <Minimize2 className="h-4 w-4" aria-hidden="true" /> : <Maximize2 className="h-4 w-4" aria-hidden="true" />}
        </button>
      </div>
    </>
  );
}
