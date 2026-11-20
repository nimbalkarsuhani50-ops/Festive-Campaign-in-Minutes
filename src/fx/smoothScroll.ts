import Lenis from "lenis";

let lenis: Lenis | null = null;

const HEADER_OFFSET = -84;

export function initSmoothScroll(): () => void {
  if (typeof window === "undefined") return () => {};
  const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  if (reduce) return () => {};

  lenis = new Lenis({
    lerp: 0.085,
    smoothWheel: true,
    wheelMultiplier: 0.95,
    anchors: { offset: HEADER_OFFSET },
    autoRaf: true,
  });

  return () => {
    lenis?.destroy();
    lenis = null;
  };
}

export function scrollToId(id: string, opts: { duration?: number } = {}) {
  const el = document.getElementById(id);
  if (!el) return;
  if (lenis) {
    lenis.scrollTo(el, {
      offset: HEADER_OFFSET,
      duration: opts.duration ?? 1.4,
      easing: (t) => 1 - Math.pow(1 - t, 4),
    });
  } else {
    const top = el.getBoundingClientRect().top + window.scrollY + HEADER_OFFSET;
    window.scrollTo({ top, behavior: "smooth" });
  }
}

export function pauseSmoothScroll(paused: boolean) {
  if (!lenis) return;
  if (paused) lenis.stop();
  else lenis.start();
}
