import { useEffect, useState } from "react";

/** Returns the id of the last listed section whose top has passed the header line. */
export function useActiveSection(ids: string[], line?: number): string | null {
  const [active, setActive] = useState<string | null>(null);
  const key = ids.join("|");

  useEffect(() => {
    let raf = 0;
    const compute = () => {
      raf = 0;
      let current: string | null = null;
      const threshold = line ?? Math.round(window.innerHeight * 0.4);
      for (const id of ids) {
        const el = document.getElementById(id);
        if (!el) continue;
        if (el.getBoundingClientRect().top - threshold <= 0) current = id;
      }
      // At the very bottom, light up the last section
      if (window.innerHeight + window.scrollY >= document.documentElement.scrollHeight - 4) {
        const last = [...ids].reverse().find((id) => document.getElementById(id));
        if (last) current = last;
      }
      setActive(current);
    };
    const onScroll = () => {
      if (!raf) raf = requestAnimationFrame(compute);
    };
    compute();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    const mo = new MutationObserver(onScroll);
    mo.observe(document.body, { childList: true, subtree: true });
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
      mo.disconnect();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key, line]);

  return active;
}
