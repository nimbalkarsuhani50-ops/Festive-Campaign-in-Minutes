import { Check, Copy } from "lucide-react";
import { useState } from "react";

interface CopyButtonProps {
  textToCopy: string;
  label?: string;
}

export function CopyButton({ textToCopy, label = "Copy" }: CopyButtonProps) {
  const [copied, setCopied] = useState(false);

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
      window.setTimeout(() => setCopied(false), 1800);
    } catch {
      setCopied(false);
    }
  }

  return (
    <button
      type="button"
      onClick={handleCopy}
      className={`inline-flex items-center gap-2 rounded-lg border px-3.5 py-2 text-sm font-medium transition-all duration-200 hover:scale-[1.03] active:scale-[0.97] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#F28C38] whitespace-nowrap shrink-0 cursor-pointer ${
        copied
          ? "border-[#F28C38] bg-[#F28C38]/15 text-[#F28C38] shadow-[0_0_16px_rgba(242,140,56,0.25)]"
          : "border-white/15 bg-white/[0.04] text-slate-200 hover:border-[#D4AF37]/60 hover:bg-white/[0.09] hover:text-white"
      }`}
      aria-label={copied ? "Copied to clipboard" : label}
    >
      {copied ? (
        <>
          <Check className="h-4 w-4 text-[#F28C38]" aria-hidden="true" />
          <span>Copied</span>
        </>
      ) : (
        <>
          <Copy className="h-4 w-4 text-[#D4AF37]" aria-hidden="true" />
          <span>{label}</span>
        </>
      )}
    </button>
  );
}
