import { AlertCircle, ArrowRight, FileDown, Loader2 } from "lucide-react";
import { MotionConfig, motion } from "motion/react";
import { useEffect, useMemo, useRef, useState } from "react";
import { Hero } from "./components/Hero";
import { PresenterDock } from "./components/PresenterDock";
import { AmbientCanvas } from "./fx/AmbientCanvas";
import { festiveFinale, sparkleFrom } from "./fx/celebrate";
import { Magnetic, Reveal, SectionHeading, SpotlightCard } from "./fx/primitives";
import { initSmoothScroll, pauseSmoothScroll, scrollToId } from "./fx/smoothScroll";
import { makePosterSVG } from "./posters.js";
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
  const exportBtnRef = useRef<HTMLButtonElement | null>(null);
  const [boardKey, setBoardKey] = useState(0);

  useEffect(() => initSmoothScroll(), []);
  useEffect(() => {
    pauseSmoothScroll(journeyOpen);
  }, [journeyOpen]);

  /** Big reveal: fireworks, then glide the audience down to the Big Idea. */
  function revealBoard(delay = 450) {
    window.setTimeout(() => {
      festiveFinale();
      scrollToId("big-idea", { duration: 1.8 });
    }, delay);
  }

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
    setBoardKey((k) => k + 1);
    setValidationError(null);
    setApiError(null);
    revealBoard(250);
  }

  async function completeJourneySmoothly(currentStage: number) {
    for (let s = currentStage; s < JOURNEY_STAGES.length; s++) {
      setJourneyStage(s);
      setJourneyProgress(Math.min(96, 22 + s * 18));
      await new Promise((r) => window.setTimeout(r, 210));
    }
    setJourneyProgress(100);
    await new Promise((r) => window.setTimeout(r, 1300));
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
      setBoardKey((k) => k + 1);
      setJourneyOpen(false);
      revealBoard(700);
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
      sparkleFrom(exportBtnRef.current, 60);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "PDF export failed.";
      setApiError(`Could not export PDF (${msg}).`);
    } finally {
      setIsExportingPdf(false);
    }
  }

  return (
    <MotionConfig reducedMotion="user">
    <AmbientCanvas />
    <div className="relative z-10 min-h-screen overflow-x-clip text-slate-100">
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

      <Hero
        onStart={() => scrollToId("brief", { duration: 1.5 })}
        onDemo={() => handleLoadSaved("Diwali - Sweet Shop")}
      />

      <PresenterDock />

      <main className="mx-auto max-w-7xl space-y-28 px-4 pb-24 pt-10 sm:px-6 sm:space-y-36 lg:px-8">
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

        {!isGenerating && !campaign && <PresetShowcase onLoad={handleLoadSaved} />}

        {!isGenerating && campaign && (
          <div key={boardKey} id="campaign-board" className="space-y-28 sm:space-y-36">
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

            <InstagramPostsSection
              posts={campaign.instagram_posts}
              brand={boardInput.brand}
              festival={boardInput.festival}
              stylePreset={boardInput.stylePreset ?? "Festive Gold"}
              seed={posterSeed}
            />

            <ReelScriptSection
              reelScript={campaign.reel_script}
              brand={boardInput.brand}
              festival={boardInput.festival}
              stylePreset={boardInput.stylePreset ?? "Festive Gold"}
              seed={posterSeed}
            />

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

            <section id="export-section" aria-label="Export Board" className="scroll-section space-y-7">
              <SectionHeading index="08" kicker="Take it with you" title="Export the Board" />
              <Reveal>
                <SpotlightCard className="flex flex-col items-start justify-between gap-6 rounded-3xl p-7 sm:flex-row sm:items-center sm:px-10 sm:py-9">
                  <div className="space-y-1.5">
                    <h3 className="font-display text-2xl font-bold text-white">One-Page Stage Presentation PDF</h3>
                    <p className="text-sm text-slate-300 sm:text-base">
                      An A4 summary with your Big Idea, taglines, posts, reel script, poster, and budget chart.
                    </p>
                  </div>
                  <Magnetic strength={0.2}>
                    <button
                      ref={exportBtnRef}
                      type="button"
                      disabled={isExportingPdf}
                      onClick={handleExportPdf}
                      className="btn-primary inline-flex min-h-[54px] items-center gap-2.5 rounded-2xl px-7 text-base font-bold text-[#090E1A] disabled:opacity-70 whitespace-nowrap"
                    >
                      {isExportingPdf ? (
                        <>
                          <Loader2 className="h-5 w-5 animate-spin" aria-hidden="true" />
                          <span>Building one-page PDF...</span>
                        </>
                      ) : (
                        <>
                          <FileDown className="h-5 w-5" aria-hidden="true" />
                          <span>Export board as PDF</span>
                        </>
                      )}
                    </button>
                  </Magnetic>
                </SpotlightCard>
              </Reveal>
            </section>
          </div>
        )}
      </main>

      <footer className="border-t border-white/10 bg-[#070B16]/70 py-8 text-center text-sm text-slate-400 backdrop-blur">
        Festive Campaign Board <span aria-hidden="true">·</span> #DYPAICoE Launch <span aria-hidden="true">·</span> Dr. D. Y. Patil B-School, Pune
      </footer>
    </div>
    </MotionConfig>
  );
}

/** Empty state: the three saved stage campaigns as poster cards. */
function PresetShowcase({ onLoad }: { onLoad: (key: SavedCampaignKey) => void }) {
  const cards = useMemo(
    () =>
      SAVED_CAMPAIGN_KEYS.map((key, i) => {
        const preset = SAVED_CAMPAIGNS[key];
        const svg = makePosterSVG(preset.input.festival, 11 + i * 5, "Festive Gold", "instagram_feed").replace(
          "<svg ",
          '<svg preserveAspectRatio="xMidYMid slice" style="width:100%;height:100%;display:block;" '
        );
        return { key, preset, svg };
      }),
    []
  );

  return (
    <section aria-label="Saved stage campaigns" className="space-y-7">
      <SectionHeading
        index="✦"
        kicker="Or start from a showcase"
        title="Saved Stage Campaigns"
        right={<p className="text-sm text-slate-400">Instant, no network needed</p>}
      />
      <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
        {cards.map(({ key, preset, svg }, i) => (
          <motion.div
            key={key}
            initial={{ opacity: 0, y: 50, rotate: i === 0 ? -4 : i === 2 ? 4 : 0 }}
            whileInView={{ opacity: 1, y: 0, rotate: 0 }}
            viewport={{ once: true, amount: 0.3 }}
            transition={{ duration: 1, delay: i * 0.12, ease: [0.16, 1, 0.3, 1] }}
          >
            <SpotlightCard
              tilt={6}
              onClick={() => onLoad(key)}
              className="group cursor-pointer overflow-hidden rounded-3xl"
            >
              <div className="relative aspect-[4/3] overflow-hidden">
                <div
                  className="h-full w-full transition-transform duration-[1.2s] ease-out group-hover:scale-110"
                  dangerouslySetInnerHTML={{ __html: svg }}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-[#0A0F20] via-[#0A0F20]/30 to-transparent" />
                <span className="absolute left-4 top-4 rounded-full bg-black/50 px-3 py-1 text-xs font-semibold text-[#FFE7A3] backdrop-blur">
                  {preset.input.festival}
                </span>
              </div>
              <div className="space-y-3 p-6">
                <p className="font-display text-2xl font-bold text-white">{preset.input.brand}</p>
                <p className="line-clamp-2 text-sm text-slate-300">{preset.campaign.tagline_en}</p>
                <p className="inline-flex items-center gap-2 pt-1 text-sm font-semibold text-[#F5B041]">
                  Load this campaign
                  <ArrowRight className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1.5" aria-hidden="true" />
                </p>
              </div>
            </SpotlightCard>
          </motion.div>
        ))}
      </div>
    </section>
  );
}
