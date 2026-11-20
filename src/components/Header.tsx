import { FileDown, Loader2 } from "lucide-react";

interface HeaderProps {
  hasCampaign: boolean;
  isExportingPdf: boolean;
  onExportPdf: () => void;
}

export function Header({
  hasCampaign,
  isExportingPdf,
  onExportPdf,
}: HeaderProps) {
  return (
    <header className="sticky top-0 z-30 border-b border-white/10 bg-[#080D1A]/80 backdrop-blur-xl">
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-8 px-4 py-3.5 sm:px-6 lg:px-8">
        <a
          href="#brief"
          className="font-display text-lg sm:text-xl font-bold tracking-tight text-white transition-colors hover:text-[#F28C38] whitespace-nowrap shrink-0"
        >
          Festive Campaign Board
        </a>

        <nav
          aria-label="Workspace sections"
          className="hidden md:flex items-center gap-7 text-sm font-medium text-slate-300"
        >
          <a
            href="#brief"
            className="border-b-2 border-transparent py-1 transition-all duration-200 hover:border-[#F28C38] hover:text-white whitespace-nowrap shrink-0"
          >
            Brief
          </a>
          <a
            href="#big-idea"
            className="border-b-2 border-transparent py-1 transition-all duration-200 hover:border-[#F28C38] hover:text-white whitespace-nowrap shrink-0"
          >
            Big Idea
          </a>
          <a
            href="#instagram-posts"
            className="border-b-2 border-transparent py-1 transition-all duration-200 hover:border-[#F28C38] hover:text-white whitespace-nowrap shrink-0"
          >
            Content
          </a>
          <a
            href="#channel-plan"
            className="border-b-2 border-transparent py-1 transition-all duration-200 hover:border-[#F28C38] hover:text-white whitespace-nowrap shrink-0"
          >
            Channels
          </a>
          <a
            href="#poster-section"
            className="border-b-2 border-transparent py-1 transition-all duration-200 hover:border-[#F28C38] hover:text-white whitespace-nowrap shrink-0"
          >
            Poster
          </a>
        </nav>

        <div className="flex items-center shrink-0">
          <button
            type="button"
            disabled={!hasCampaign || isExportingPdf}
            onClick={onExportPdf}
            className="inline-flex items-center gap-2 rounded-lg border border-[#D4AF37]/50 bg-white/[0.06] px-4 py-2 text-sm font-semibold text-white transition-all duration-200 hover:scale-[1.02] hover:border-[#F28C38] hover:bg-[#F28C38]/15 hover:shadow-[0_0_20px_rgba(242,140,56,0.28)] active:scale-[0.98] disabled:opacity-40 disabled:hover:scale-100 disabled:hover:shadow-none disabled:cursor-not-allowed focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#F28C38] whitespace-nowrap shrink-0 cursor-pointer"
          >
            {isExportingPdf ? (
              <Loader2 className="h-4 w-4 animate-spin text-[#F28C38]" aria-hidden="true" />
            ) : (
              <FileDown className="h-4 w-4 text-[#F28C38]" aria-hidden="true" />
            )}
            <span>{isExportingPdf ? "Exporting..." : "Export PDF"}</span>
          </button>
        </div>
      </div>
    </header>
  );
}
