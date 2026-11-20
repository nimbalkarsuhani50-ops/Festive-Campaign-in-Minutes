import confetti from "canvas-confetti";

const FESTIVE = ["#F28C38", "#F5B041", "#D4AF37", "#FFF3C4", "#E8455A", "#FF7EB6", "#FFD166"];

const fire = confetti.create(undefined, { resize: true, useWorker: true, disableForReducedMotion: true });

/** A fireworks-style finale: bursts across the sky for ~2 seconds. */
export function festiveFinale() {
  const end = Date.now() + 1900;
  const burst = () => {
    const x = 0.15 + Math.random() * 0.7;
    const y = 0.15 + Math.random() * 0.35;
    fire({
      particleCount: 70,
      startVelocity: 32,
      spread: 360,
      ticks: 110,
      gravity: 0.7,
      decay: 0.92,
      scalar: 1.05,
      origin: { x, y },
      colors: FESTIVE,
      shapes: ["star", "circle"],
      zIndex: 120,
    });
  };
  burst();
  const id = window.setInterval(() => {
    if (Date.now() > end) {
      window.clearInterval(id);
      return;
    }
    burst();
  }, 320);

  // Side cannons for a big "stage" moment
  fire({ particleCount: 90, angle: 60, spread: 70, startVelocity: 58, origin: { x: 0, y: 0.85 }, colors: FESTIVE, zIndex: 120 });
  fire({ particleCount: 90, angle: 120, spread: 70, startVelocity: 58, origin: { x: 1, y: 0.85 }, colors: FESTIVE, zIndex: 120 });
}

/** A small sparkle burst from an element (copy, like, download). */
export function sparkleFrom(el: Element | null, count = 26) {
  if (!el) return;
  const r = el.getBoundingClientRect();
  fire({
    particleCount: count,
    startVelocity: 18,
    spread: 80,
    ticks: 60,
    gravity: 0.9,
    scalar: 0.7,
    origin: {
      x: (r.left + r.width / 2) / window.innerWidth,
      y: (r.top + r.height / 2) / window.innerHeight,
    },
    colors: FESTIVE,
    shapes: ["star", "circle"],
    zIndex: 120,
  });
}
