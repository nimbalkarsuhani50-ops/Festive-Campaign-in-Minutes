import { Loader2, RefreshCw } from "lucide-react";

interface RegenerateSectionProps {
  isRegenerating: boolean;
  elapsedSeconds: number;
  onRegenerate: () => void;
}

export function RegenerateSection({
  isRegenerating,
  elapsedSeconds,
  onRegenerate,
}: RegenerateSectionProps) {
  return (
    <section
      aria-label="Regenerate Big Idea"
      className="glass-card glass-card-interactive flex flex-col items-start justify-between gap-4 rounded-2xl p-5 sm:flex-row sm:items-center sm:px-8 sm:py-6"
    >
      <div className="space-y-1">
        <h3 className="font-display text-lg font-bold text-white">
          Want a different creative hook?
        </h3>
        <p className="text-sm text-slate-300">
          One tap generates a fresh big idea, taglines, and a new poster variation.
        </p>
      </div>

      <button
        type="button"
        disabled={isRegenerating}
        onClick={onRegenerate}
        className="inline-flex items-center gap-2.5 rounded-xl border border-[#F28C38]/70 bg-[#F28C38]/15 px-5 py-2.5 text-sm font-semibold text-[#F28C38] transition-all duration-200 hover:scale-[1.03] hover:bg-[#F28C38] hover:text-[#080D1A] hover:shadow-[0_0_24px_rgba(242,140,56,0.4)] active:scale-[0.98] disabled:opacity-65 disabled:hover:scale-100 disabled:cursor-wait focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#F28C38] whitespace-nowrap shrink-0 cursor-pointer"
      >
        {isRegenerating ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
            <span className="tabular-nums">
              Regenerating ({elapsedSeconds}s)
            </span>
          </>
        ) : (
          <>
            <RefreshCw className="h-4 w-4" aria-hidden="true" />
            <span>Regenerate idea</span>
          </>
        )}
      </button>
    </section>
  );
}
