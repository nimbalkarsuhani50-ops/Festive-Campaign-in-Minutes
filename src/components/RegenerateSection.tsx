import { Loader2, Wand2 } from "lucide-react";
import { motion } from "motion/react";
import { Magnetic, Reveal } from "../fx/primitives";

interface RegenerateSectionProps {
  isRegenerating: boolean;
  elapsedSeconds: number;
  onRegenerate: () => void;
}

export function RegenerateSection({ isRegenerating, elapsedSeconds, onRegenerate }: RegenerateSectionProps) {
  return (
    <Reveal>
      <section
        aria-label="Regenerate Big Idea"
        className="aurora-border relative overflow-hidden rounded-3xl p-px"
      >
        <div className="flex flex-col items-start justify-between gap-5 rounded-[23px] bg-[#0A0F20]/95 p-6 sm:flex-row sm:items-center sm:px-10 sm:py-8">
          <div className="space-y-1.5">
            <h3 className="font-display text-2xl font-bold text-white">Want a different creative hook?</h3>
            <p className="text-sm text-slate-300 sm:text-base">
              One tap generates a fresh big idea, taglines, and a new poster variation.
            </p>
          </div>

          <Magnetic>
            <motion.button
              type="button"
              disabled={isRegenerating}
              onClick={onRegenerate}
              whileTap={{ scale: 0.95 }}
              className="btn-primary group inline-flex min-h-[52px] items-center gap-2.5 rounded-2xl px-7 text-base font-bold text-[#090E1A] disabled:cursor-wait disabled:opacity-80 whitespace-nowrap"
            >
              {isRegenerating ? (
                <>
                  <Loader2 className="h-5 w-5 animate-spin" aria-hidden="true" />
                  <span className="tabular-nums">Reimagining ({elapsedSeconds}s)</span>
                </>
              ) : (
                <>
                  <Wand2 className="h-5 w-5 transition-transform duration-500 group-hover:-rotate-12 group-hover:scale-110" aria-hidden="true" />
                  <span>Regenerate idea</span>
                </>
              )}
            </motion.button>
          </Magnetic>
        </div>
      </section>
    </Reveal>
  );
}
