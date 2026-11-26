import { Database, Loader2 } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { Reveal, SectionHeading } from "../fx/primitives";
import { makePosterSVG } from "../posters.js";
import { fetchHistory, type HistorySummary } from "../utils/history";

interface Props {
  /** Bumps whenever something was saved so the list refreshes. */
  refreshKey: number;
  onLoad: (id: string) => void;
}

function Thumb({ item }: { item: HistorySummary }) {
  const src = useMemo(
    () =>
      `data:image/svg+xml;charset=utf-8,${encodeURIComponent(
        makePosterSVG(item.festival, item.posterSeed || 7, item.stylePreset, "instagram_feed")
      )}`,
    [item.festival, item.posterSeed, item.stylePreset]
  );
  if (item.thumb) {
    return <img src={`/api/poster-image?id=${item.thumb}`} alt="" className="aspect-[4/5] w-full object-cover" loading="lazy" draggable={false} />;
  }
  return <img src={src} alt="" className="aspect-[4/5] w-full object-cover" loading="lazy" draggable={false} />;
}

export function HistorySection({ refreshKey, onLoad }: Props) {
  const [items, setItems] = useState<HistorySummary[] | null>(null);
  const [persisted, setPersisted] = useState(true);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    let alive = true;
    fetchHistory()
      .then((r) => {
        if (!alive) return;
        setItems(r.items);
        setPersisted(r.persisted);
        setFailed(false);
      })
      .catch(() => alive && setFailed(true));
    return () => {
      alive = false;
    };
  }, [refreshKey]);

  return (
    <section id="history" aria-label="Campaign history" className="space-y-7">
      <SectionHeading
        index="✦"
        kicker="Central library"
        title="Past Campaigns & Posters"
        right={
          <p className="inline-flex items-center gap-2 text-sm text-slate-400">
            <Database className="h-4 w-4" aria-hidden="true" />
            {failed ? "History unavailable" : persisted ? "Saved to the shared database" : "Database not connected yet — temporary memory only"}
          </p>
        }
      />
      <Reveal>
        {items === null && !failed && (
          <div className="flex items-center gap-3 text-slate-400">
            <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" /> Loading…
          </div>
        )}
        {items && items.length === 0 && (
          <p className="text-slate-400">Nothing saved yet. Every campaign you generate lands here automatically.</p>
        )}
        {items && items.length > 0 && (
          <div className="grid grid-cols-2 gap-5 md:grid-cols-4 lg:grid-cols-6">
            {items.map((it) => (
              <button
                key={it.id}
                type="button"
                onClick={() => onLoad(it.id)}
                className="group glass-card glass-card-interactive overflow-hidden rounded-2xl text-left cursor-pointer"
              >
                <div className="overflow-hidden">
                  <div className="transition-transform duration-500 group-hover:scale-105">
                    <Thumb item={it} />
                  </div>
                </div>
                <div className="space-y-0.5 p-3">
                  <p className="truncate text-sm font-bold text-white">{it.brand}</p>
                  <p className="truncate text-xs text-[color:var(--ac3)]">
                    {it.festival} · {it.city}
                  </p>
                  <p className="text-[11px] text-slate-400">{new Date(it.updatedAt).toLocaleDateString()}</p>
                </div>
              </button>
            ))}
          </div>
        )}
      </Reveal>
    </section>
  );
}
