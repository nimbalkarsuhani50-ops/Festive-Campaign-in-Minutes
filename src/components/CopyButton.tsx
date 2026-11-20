import { Check, Copy } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useRef, useState } from "react";
import { sparkleFrom } from "../fx/celebrate";

interface CopyButtonProps {
  textToCopy: string;
  label?: string;
}

export function CopyButton({ textToCopy, label = "Copy" }: CopyButtonProps) {
  const [copied, setCopied] = useState(false);
  const ref = useRef<HTMLButtonElement | null>(null);

  async function handleCopy() {
    try {
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(textToCopy);
      } else {
        const textarea = document.createElement("textarea");
        textarea.value = textToCopy;
        textarea.style.position = "fixed";
        textarea.style.opacity = "0";
        document.body.appendChild(textarea);
        textarea.select();
        document.execCommand("copy");
        document.body.removeChild(textarea);
      }
      setCopied(true);
      sparkleFrom(ref.current, 18);
      window.setTimeout(() => setCopied(false), 1800);
    } catch {
      setCopied(false);
    }
  }

  return (
    <motion.button
      ref={ref}
      type="button"
      onClick={handleCopy}
      whileTap={{ scale: 0.92 }}
      className={`relative inline-flex items-center gap-2 overflow-hidden rounded-full border px-4 py-2 text-sm font-medium transition-colors duration-300 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#F28C38] whitespace-nowrap shrink-0 cursor-pointer ${
        copied
          ? "border-[#F28C38] bg-[#F28C38]/15 text-[#F5B041] shadow-[0_0_20px_rgba(242,140,56,0.35)]"
          : "border-white/15 bg-white/[0.04] text-slate-200 hover:border-[#D4AF37]/60 hover:bg-white/[0.09] hover:text-white"
      }`}
      aria-label={copied ? "Copied to clipboard" : label}
    >
      <AnimatePresence mode="wait" initial={false}>
        <motion.span
          key={copied ? "y" : "n"}
          initial={{ y: 14, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: -14, opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="inline-flex items-center gap-2"
        >
          {copied ? (
            <>
              <Check className="h-4 w-4" aria-hidden="true" /> Copied
            </>
          ) : (
            <>
              <Copy className="h-4 w-4 text-[#D4AF37]" aria-hidden="true" /> {label}
            </>
          )}
        </motion.span>
      </AnimatePresence>
    </motion.button>
  );
}
