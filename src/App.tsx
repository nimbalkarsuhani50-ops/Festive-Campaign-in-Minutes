import { AlertCircle, FileDown, Loader2 } from "lucide-react";
import { motion } from "motion/react";
import { useEffect, useRef, useState } from "react";
import { BigIdeaBanner } from "./components/BigIdeaBanner";
import { CampaignForm } from "./components/CampaignForm";
import { ChannelPlanSection } from "./components/ChannelPlanSection";
import {
  GenerationJourney,
  JOURNEY_STAGES,
} from "./components/GenerationJourney";
import { Header } from "./components/Header";
import { InstagramPostsSection } from "./components/InstagramPostsSection";
import { PosterSection } from "./components/PosterSection";
import { ReelScriptSection } from "./components/ReelScriptSection";
import { RegenerateSection } from "./components/RegenerateSection";
import { TaglinesSection } from "./components/TaglinesSection";
import {
  SAVED_CAMPAIGN_KEYS,
  SAVED_CAMPAIGNS,
  getRegionConfig,
  getRegionsForMarket,
} from "./data/campaigns";
import type {
  CampaignData,
  CampaignInput,
  MarketType,
  PosterAspectRatio,
  SavedCampaignKey,
} from "./types";
import { exportBoardAsPdf } from "./utils/pdfExport";

const INITIAL_INPUT: CampaignInput = {
  market: "India",
  region: "West India",
  festival: "Diwali",
  brand: "",
  city: "Pune",
  audience: "",
  budget: 250000,
  language: "Marathi",
  stylePreset: "Festive Gold",
};

export default function App() {
  const [input, setInput] = useState<CampaignInput>(INITIAL_INPUT);
  const [selectedPreset, setSelectedPreset] = useState<SavedCampaignKey | "">("");
  const [campaign, setCampaign] = useState<CampaignData | null>(null);
  const [boardInput, setBoardInput] = useState<CampaignInput>(INITIAL_INPUT);

  const [isGenerating, setIsGenerating] = useState(false);
  const [isRegenerating, setIsRegenerating] = useState(false);
  const [isExportingPdf, setIsExportingPdf] = useState(false);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);

  // Full-screen animated generation journey state
  const [journeyOpen, setJourneyOpen] = useState(false);
  const [journeyStage, setJourneyStage] = useState(0);
  const [journeyProgress, setJourneyProgress] = useState(0);

  // Poster aspect ratio, variation seed & reveal animation trigger
  const [aspectRatio, setAspectRatio] =
    useState<PosterAspectRatio>("instagram_feed");
  const [posterSeed, setPosterSeed] = useState(7);
  const [posterRevealKey, setPosterRevealKey] = useState(1);

  const [validationError, setValidationError] = useState<string | null>(null);
  const [apiError, setApiError] = useState<string | null>(null);

  const chartRef = useRef<HTMLDivElement | null>(null);
  const journeyIntervalRef = useRef<number | null>(null);

  useEffect(() => {
    if (!isGenerating && !isRegenerating) {
      return;
    }
    setElapsedSeconds(0);
    const startTime = Date.now();
    const timerId = window.setInterval(() => {
      setElapsedSeconds(Math.floor((Date.now() - startTime) / 1000));
    }, 250);
    return () => window.clearInterval(timerId);
  }, [isGenerating, isRegenerating]);

  useEffect(() => {
    return () => {
      if (journeyIntervalRef.current !== null) {
        window.clearInterval(journeyIntervalRef.current);
      }
    };
  }, []);

  function handleChangeMarket(nextMarket: MarketType) {
    setValidationError(null);
    const regions = getRegionsForMarket(nextMarket);
    const nextRegion = regions[0];
    setInput((prev) => {
      const updated: CampaignInput = {
        ...prev,
        market: nextMarket,
        region: nextRegion.id,
        festival: nextRegion.defaultFestival,
        language: nextRegion.defaultLanguage,
        city: nextRegion.defaultCity,
        budget: nextRegion.defaultBudget,
      };
      if (campaign) {
        setBoardInput((prevBoard) => ({
          ...prevBoard,
          market: nextMarket,
          region: nextRegion.id,
          budget: nextRegion.defaultBudget,
        }));
      }
      return updated;
    });
  }

  function handleChangeRegion(regionId: string) {
    setValidationError(null);
    const market = input.market ?? "India";
    const prevRegionCfg = getRegionConfig(market, input.region);
    const nextRegionCfg = getRegionConfig(market, regionId);

    setInput((prev) => {
      const keepCustomCity =
        prev.city.trim() !== "" && prev.city !== prevRegionCfg.defaultCity;
      const nextBudget =
        prevRegionCfg.currencyCode === nextRegionCfg.currencyCode
          ? Math.min(
              nextRegionCfg.budgetMax,
              Math.max(nextRegionCfg.budgetMin, prev.budget)
            )
          : nextRegionCfg.defaultBudget;

      const updated: CampaignInput = {
        ...prev,
        region: nextRegionCfg.id,
        festival: nextRegionCfg.defaultFestival,
        language: nextRegionCfg.defaultLanguage,
        city: keepCustomCity ? prev.city : nextRegionCfg.defaultCity,
        budget: nextBudget,
      };
      if (campaign) {
        setBoardInput((prevBoard) => ({
          ...prevBoard,
          region: nextRegionCfg.id,
          budget: nextBudget,
        }));
      }
      return updated;
    });
  }

  function handleChangeInput<K extends keyof CampaignInput>(
    field: K,
    value: CampaignInput[K]
  ) {
    setValidationError(null);
    setInput((prev) => {
      const next = { ...prev, [field]: value };
      if (campaign) {
        setBoardInput((prevBoard) => ({ ...prevBoard, [field]: value }));
      }
      return next;
    });
  }

  function handleLoadSaved(key: SavedCampaignKey) {
    const preset = SAVED_CAMPAIGNS[key];
    if (!preset) return;
    const stylePreset = input.stylePreset ?? "Festive Gold";
    const nextInput = { ...preset.input, stylePreset };
    setSelectedPreset(key);
    setInput(nextInput);
    setBoardInput(nextInput);
    setCampaign({
      ...preset.campaign,
      instagram_posts: preset.campaign.instagram_posts.map((p) => ({ ...p })),
      reel_script: { ...preset.campaign.reel_script },
      channel_plan: preset.campaign.channel_plan.map((c) => ({ ...c })),
    });
    setPosterRevealKey((k) => k + 1);
    setValidationError(null);
    setApiError(null);
  }

  async function completeJourneySmoothly(currentStage: number) {
    for (let s = currentStage; s < JOURNEY_STAGES.length; s++) {
      setJourneyStage(s);
      setJourneyProgress(Math.min(96, 22 + s * 18));
      await new Promise((r) => window.setTimeout(r, 210));
    }
    setJourneyProgress(100);
    await new Promise((r) => window.setTimeout(r, 340));
  }

  async function handleGenerate(e: React.FormEvent) {
    e.preventDefault();
    setValidationError(null);
    setApiError(null);

    if (!input.brand.trim() || !input.city.trim() || !input.audience.trim()) {
      setValidationError(
        "Please enter Brand name, City, and Target audience before generating."
      );
      return;
    }

    const activeMarket = input.market ?? "India";
    const regionCfg = getRegionConfig(activeMarket, input.region);

    setSelectedPreset("");
    setIsGenerating(true);
    setJourneyStage(0);
    setJourneyProgress(14);
    setJourneyOpen(true);

    let activeStage = 0;
    if (journeyIntervalRef.current !== null) {
      window.clearInterval(journeyIntervalRef.current);
    }
    journeyIntervalRef.current = window.setInterval(() => {
      activeStage = Math.min(3, activeStage + 1);
      setJourneyStage(activeStage);
      setJourneyProgress(22 + activeStage * 20);
    }, 750);

    try {
      const response = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...input,
          market: activeMarket,
          region: regionCfg.id,
          currencySymbol: regionCfg.currencySymbol,
          currencyCode: regionCfg.currencyCode,
          locale: regionCfg.locale,
          stylePreset: input.stylePreset ?? "Festive Gold",
        }),
      });
      const payload = await response.json();
      if (!response.ok) {
        throw new Error(payload?.error || "Unable to generate campaign right now.");
      }

      if (journeyIntervalRef.current !== null) {
        window.clearInterval(journeyIntervalRef.current);
        journeyIntervalRef.current = null;
      }

      await completeJourneySmoothly(activeStage);

      setCampaign(payload as CampaignData);
      setBoardInput({
        ...input,
        market: activeMarket,
        region: regionCfg.id,
        stylePreset: input.stylePreset ?? "Festive Gold",
      });
      setPosterSeed((s) => s + 1);
      setPosterRevealKey((k) => k + 1);
      setJourneyOpen(false);
    } catch (err) {
      if (journeyIntervalRef.current !== null) {
        window.clearInterval(journeyIntervalRef.current);
        journeyIntervalRef.current = null;
      }
      setJourneyOpen(false);
      const msg = err instanceof Error ? err.message : "Request failed.";
      setApiError(
        `Could not reach Gemini right now (${msg}). You can load one of the saved stage campaigns below as an instant backup.`
      );
    } finally {
      setIsGenerating(false);
    }
  }

  async function handleRegenerate() {
    if (!campaign || isRegenerating) return;
    setApiError(null);
    setIsRegenerating(true);
    const activeMarket = boardInput.market ?? "India";
    const regionCfg = getRegionConfig(activeMarket, boardInput.region);

    try {
      const response = await fetch("/api/regenerate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...boardInput,
          market: activeMarket,
          region: regionCfg.id,
          currencySymbol: regionCfg.currencySymbol,
          currencyCode: regionCfg.currencyCode,
          stylePreset: boardInput.stylePreset ?? "Festive Gold",
          previousBigIdea: campaign.big_idea,
          previousTaglineEn: campaign.tagline_en,
        }),
      });
      const payload = await response.json();
      if (!response.ok) {
        throw new Error(payload?.error || "Unable to regenerate idea right now.");
      }
      setCampaign((prev) =>
        prev
          ? {
              ...prev,
              big_idea: payload.big_idea,
              tagline_en: payload.tagline_en,
              tagline_regional: payload.tagline_regional,
            }
          : prev
      );
      setPosterSeed((s) => s + 1);
      setPosterRevealKey((k) => k + 1);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Request failed.";
      setApiError(
        `Could not regenerate right now (${msg}). You can try again or load a saved campaign instead.`
      );
    } finally {
      setIsRegenerating(false);
    }
  }

  function handleRegeneratePosterVariation() {
    setPosterSeed((s) => s + 1);
    setPosterRevealKey((k) => k + 1);
  }

  async function handleExportPdf() {
    if (!campaign || isExportingPdf) return;
    setIsExportingPdf(true);
    try {
      await exportBoardAsPdf({
        input: boardInput,
        campaign,
        chartElement: chartRef.current,
        posterSeed,
      });
    } catch (err) {
      const msg = err instanceof Error ? err.message : "PDF export failed.";
      setApiError(`Could not export PDF (${msg}).`);
    } finally {
      setIsExportingPdf(false);
    }
  }

  return (
    <div className="min-h-screen overflow-x-hidden text-slate-100">
      <Header
        hasCampaign={Boolean(campaign)}
        isExportingPdf={isExportingPdf}
        onExportPdf={handleExportPdf}
      />

      <GenerationJourney
        isOpen={journeyOpen}
        stageIndex={journeyStage}
        progressPercent={journeyProgress}
        brand={input.brand}
        festival={input.festival}
        city={input.city}
        stylePreset={input.stylePreset ?? "Festive Gold"}
        elapsedSeconds={elapsedSeconds}
      />

      <main className="mx-auto max-w-7xl space-y-12 px-4 py-8 sm:px-6 sm:py-10 lg:px-8">
        <CampaignForm
          input={input}
          selectedPreset={selectedPreset}
          isGenerating={isGenerating}
          elapsedSeconds={elapsedSeconds}
          validationError={validationError}
          onChangeMarket={handleChangeMarket}
          onChangeRegion={handleChangeRegion}
          onChangeInput={handleChangeInput}
          onGenerate={handleGenerate}
          onLoadSaved={handleLoadSaved}
        />

        {apiError && (
          <motion.div
            role="alert"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="glass-card flex flex-col gap-4 rounded-2xl border-[#F28C38]/55 p-6 sm:flex-row sm:items-center sm:justify-between"
          >
            <div className="flex items-start gap-3">
              <AlertCircle
                className="mt-0.5 h-5 w-5 shrink-0 text-[#F28C38]"
                aria-hidden="true"
              />
              <div className="space-y-1">
                <p className="text-base font-bold text-white">
                  Live generation interrupted
                </p>
                <p className="text-sm text-slate-300">{apiError}</p>
              </div>
            </div>

            <div className="flex flex-wrap gap-2 shrink-0">
              {SAVED_CAMPAIGN_KEYS.map((presetKey) => (
                <button
                  key={presetKey}
                  type="button"
                  onClick={() => handleLoadSaved(presetKey)}
                  className="rounded-lg border border-white/15 bg-white/[0.05] px-3.5 py-2 text-xs font-semibold text-white transition-all duration-200 hover:scale-[1.02] hover:border-[#F28C38] hover:text-[#F28C38] whitespace-nowrap shrink-0 cursor-pointer"
                >
                  Load {presetKey}
                </button>
              ))}
            </div>
          </motion.div>
        )}

        {!isGenerating && !campaign && (
          <motion.section
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            className="glass-card rounded-2xl px-6 py-14 text-center sm:px-10"
          >
            <h2 className="font-display text-2xl sm:text-3xl font-bold text-white">
              Ready for your global stage presentation
            </h2>
            <p className="mx-auto mt-3 max-w-2xl text-base text-slate-300">
              Choose India or an International region above, select your language and style preset, and click{" "}
              <span className="font-semibold text-[#F28C38]">
                Generate campaign
              </span>
              — or load a saved stage campaign below.
            </p>
            <div className="mt-7 flex flex-wrap items-center justify-center gap-3">
              {SAVED_CAMPAIGN_KEYS.map((presetKey) => (
                <button
                  key={presetKey}
                  type="button"
                  onClick={() => handleLoadSaved(presetKey)}
                  className="rounded-xl border border-white/15 bg-white/[0.05] px-5 py-2.5 text-sm font-semibold text-white transition-all duration-200 hover:scale-[1.03] hover:border-[#F28C38] hover:bg-[#F28C38]/15 hover:shadow-[0_0_20px_rgba(242,140,56,0.22)] active:scale-[0.98] whitespace-nowrap shrink-0 cursor-pointer"
                >
                  {presetKey}
                </button>
              ))}
            </div>
          </motion.section>
        )}

        {!isGenerating && campaign && (
          <div id="campaign-board" className="space-y-12">
            <BigIdeaBanner
              festival={boardInput.festival}
              brand={boardInput.brand}
              city={boardInput.city}
              region={boardInput.region}
              bigIdea={campaign.big_idea}
            />

            <TaglinesSection
              taglineEn={campaign.tagline_en}
              taglineRegional={campaign.tagline_regional}
              language={boardInput.language}
            />

            <InstagramPostsSection posts={campaign.instagram_posts} />

            <ReelScriptSection reelScript={campaign.reel_script} />

            <ChannelPlanSection
              channelPlan={campaign.channel_plan}
              budget={input.budget}
              market={boardInput.market}
              region={boardInput.region}
              chartRef={chartRef}
            />

            <RegenerateSection
              isRegenerating={isRegenerating}
              elapsedSeconds={elapsedSeconds}
              onRegenerate={handleRegenerate}
            />

            <PosterSection
              festival={boardInput.festival}
              brand={boardInput.brand}
              taglineEn={campaign.tagline_en}
              taglineRegional={campaign.tagline_regional}
              language={boardInput.language}
              posterPrompt={campaign.poster_prompt}
              stylePreset={boardInput.stylePreset ?? "Festive Gold"}
              aspectRatio={aspectRatio}
              posterSeed={posterSeed}
              revealKey={posterRevealKey}
              onChangeAspectRatio={setAspectRatio}
              onRegenerateVariation={handleRegeneratePosterVariation}
            />

            <section id="export-section" aria-label="Export Board" className="space-y-4">
              <div className="flex items-center gap-2.5 text-sm font-semibold text-slate-300">
                <span className="text-[#F28C38] tabular-nums">08</span>
                <span aria-hidden="true">·</span>
                <h2 className="text-base font-bold text-white">Export Board</h2>
              </div>

              <div className="glass-card glass-card-interactive flex flex-col items-start justify-between gap-5 rounded-2xl p-6 sm:flex-row sm:items-center sm:px-8">
                <div className="space-y-1">
                  <h3 className="font-display text-xl font-bold text-white">
                    One-Page Stage Presentation PDF
                  </h3>
                  <p className="text-sm text-slate-300">
                    Downloads an A4 summary including your Big Idea, taglines, posts, reel script, poster, and budget chart.
                  </p>
                </div>

                <button
                  type="button"
                  disabled={isExportingPdf}
                  onClick={handleExportPdf}
                  className="inline-flex items-center gap-2.5 rounded-xl border border-[#D4AF37]/60 bg-white/[0.08] px-6 py-3 text-sm font-bold text-white transition-all duration-200 hover:scale-[1.03] hover:border-[#F28C38] hover:bg-[#F28C38] hover:text-[#080D1A] hover:shadow-[0_0_24px_rgba(242,140,56,0.4)] active:scale-[0.98] disabled:opacity-60 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#F28C38] whitespace-nowrap shrink-0 cursor-pointer"
                >
                  {isExportingPdf ? (
                    <>
                      <Loader2
                        className="h-4 w-4 animate-spin"
                        aria-hidden="true"
                      />
                      <span>Building one-page PDF...</span>
                    </>
                  ) : (
                    <>
                      <FileDown className="h-4 w-4" aria-hidden="true" />
                      <span>Export board as PDF</span>
                    </>
                  )}
                </button>
              </div>
            </section>
          </div>
        )}
      </main>

      <footer className="border-t border-white/10 bg-[#070B16]/70 py-6 text-center text-sm text-slate-400">
        Festive Campaign Board <span aria-hidden="true">·</span> #DYPAICoE Launch <span aria-hidden="true">·</span> Dr. D. Y. Patil B-School, Pune
      </footer>
    </div>
  );
}
