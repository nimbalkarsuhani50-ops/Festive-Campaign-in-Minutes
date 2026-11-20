import { Globe, Loader2, MapPin, Sparkles } from "lucide-react";
import {
  FESTIVALS,
  INDIA_FESTIVALS,
  INTERNATIONAL_FESTIVALS,
  SAVED_CAMPAIGN_KEYS,
  STYLE_PRESETS,
  formatBudget,
  getRegionConfig,
  getRegionsForMarket,
} from "../data/campaigns";
import type {
  CampaignInput,
  FestivalName,
  MarketType,
  RegionalLanguage,
  SavedCampaignKey,
  StylePreset,
} from "../types";

interface CampaignFormProps {
  input: CampaignInput;
  selectedPreset: SavedCampaignKey | "";
  isGenerating: boolean;
  elapsedSeconds: number;
  validationError: string | null;
  onChangeMarket: (market: MarketType) => void;
  onChangeRegion: (regionId: string) => void;
  onChangeInput: <K extends keyof CampaignInput>(
    field: K,
    value: CampaignInput[K]
  ) => void;
  onGenerate: (e: React.FormEvent) => void;
  onLoadSaved: (key: SavedCampaignKey) => void;
}

export function CampaignForm({
  input,
  selectedPreset,
  isGenerating,
  elapsedSeconds,
  validationError,
  onChangeMarket,
  onChangeRegion,
  onChangeInput,
  onGenerate,
  onLoadSaved,
}: CampaignFormProps) {
  const activeMarket: MarketType = input.market ?? "India";
  const regionConfig = getRegionConfig(activeMarket, input.region);
  const marketRegions = getRegionsForMarket(activeMarket);
  const activeStyle: StylePreset = input.stylePreset ?? "Festive Gold";

  const marketFestivalPool =
    activeMarket === "India" ? INDIA_FESTIVALS : INTERNATIONAL_FESTIVALS;
  const suggestedSet = new Set(regionConfig.suggestedFestivals);
  const otherMarketFestivals = marketFestivalPool.filter(
    (f) => !suggestedSet.has(f)
  );
  const globalExtraFestivals = FESTIVALS.filter(
    (f) => !marketFestivalPool.includes(f)
  );

  return (
    <section id="brief" aria-label="Campaign Brief" className="space-y-5">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <div className="flex items-center gap-2.5 text-sm font-semibold text-slate-300">
            <span className="text-[#F28C38] tabular-nums">01</span>
            <span aria-hidden="true">·</span>
            <span>Global Campaign Brief</span>
          </div>
          <h1 className="mt-1 font-display text-3xl sm:text-4xl font-bold tracking-tight text-white">
            Craft Your Festive Campaign
          </h1>
        </div>
        <p className="text-sm text-slate-300">
          Dr. D. Y. Patil B-School, Pune <span aria-hidden="true">·</span> #DYPAICoE Launch
        </p>
      </div>

      <div className="glass-card rounded-2xl p-5 sm:p-8">
        {/* Saved Stage Campaigns quick-load bar */}
        <div className="mb-7 flex flex-col gap-3 border-b border-white/10 pb-6 lg:flex-row lg:items-center lg:justify-between">
          <div className="space-y-0.5">
            <p className="text-sm font-semibold text-white">
              Saved Stage Campaigns
            </p>
            <p className="text-xs sm:text-sm text-slate-300">
              Load a curated stage campaign instantly or configure your global market below
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {SAVED_CAMPAIGN_KEYS.map((presetKey) => {
              const isActive = selectedPreset === presetKey;
              return (
                <button
                  key={presetKey}
                  type="button"
                  aria-pressed={isActive}
                  onClick={() => onLoadSaved(presetKey)}
                  className={`rounded-lg border px-3.5 py-2 text-sm font-medium transition-all duration-200 hover:scale-[1.02] active:scale-[0.98] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#F28C38] whitespace-nowrap shrink-0 cursor-pointer ${
                    isActive
                      ? "border-[#F28C38] bg-[#F28C38]/20 text-white shadow-[0_0_20px_rgba(242,140,56,0.28)]"
                      : "border-white/15 bg-white/[0.04] text-slate-200 hover:border-[#D4AF37]/60 hover:bg-white/[0.09] hover:text-white"
                  }`}
                >
                  {presetKey}
                </button>
              );
            })}
          </div>
        </div>

        <form onSubmit={onGenerate} className="space-y-7">
          {/* Step 1: Market & Country/Region Selection */}
          <div className="rounded-xl border border-white/12 bg-white/[0.03] p-4 sm:p-5">
            <div className="grid grid-cols-1 gap-4 lg:grid-cols-12 lg:items-center">
              <div className="lg:col-span-5 space-y-2">
                <p className="text-xs font-semibold uppercase tracking-wider text-[#D4AF37]">
                  Step 1 · Choose Your Market
                </p>
                <div
                  role="radiogroup"
                  aria-label="Target market"
                  className="grid grid-cols-2 gap-2 rounded-xl border border-white/12 bg-[#0A1022]/90 p-1"
                >
                  {(["India", "International"] as MarketType[]).map((mkt) => {
                    const isSelected = activeMarket === mkt;
                    return (
                      <button
                        key={mkt}
                        type="button"
                        role="radio"
                        aria-checked={isSelected}
                        onClick={() => onChangeMarket(mkt)}
                        className={`inline-flex items-center justify-center gap-2 rounded-lg px-3.5 py-2.5 text-sm font-semibold transition-all duration-200 whitespace-nowrap cursor-pointer ${
                          isSelected
                            ? "bg-gradient-to-r from-[#F28C38] to-[#F5A623] text-[#090E1A] shadow-[0_4px_16px_rgba(242,140,56,0.38)]"
                            : "text-slate-300 hover:bg-white/[0.06] hover:text-white"
                        }`}
                      >
                        {mkt === "India" ? (
                          <MapPin className="h-4 w-4 shrink-0" aria-hidden="true" />
                        ) : (
                          <Globe className="h-4 w-4 shrink-0" aria-hidden="true" />
                        )}
                        <span>{mkt}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="lg:col-span-4">
                <label
                  htmlFor="region-select"
                  className="mb-2 block text-xs font-semibold uppercase tracking-wider text-slate-300"
                >
                  {activeMarket === "India"
                    ? "Indian Region"
                    : "Country / Region"}
                </label>
                <select
                  id="region-select"
                  value={regionConfig.id}
                  onChange={(e) => onChangeRegion(e.target.value)}
                  className="w-full rounded-xl border border-white/15 bg-[#0A1022]/90 px-3.5 py-2.5 text-sm sm:text-base font-medium text-white transition-colors focus:border-[#F28C38] focus:outline-none focus:ring-2 focus:ring-[#F28C38]/30 cursor-pointer"
                >
                  {marketRegions.map((reg) => (
                    <option
                      key={reg.id}
                      value={reg.id}
                      className="bg-[#0D1526] text-white"
                    >
                      {reg.label}
                    </option>
                  ))}
                </select>
              </div>

              <div className="lg:col-span-3">
                <label
                  htmlFor="language-select"
                  className="mb-2 block text-xs font-semibold uppercase tracking-wider text-slate-300"
                >
                  Campaign Language
                </label>
                <select
                  id="language-select"
                  value={input.language}
                  onChange={(e) =>
                    onChangeInput("language", e.target.value as RegionalLanguage)
                  }
                  className="w-full rounded-xl border border-white/15 bg-[#0A1022]/90 px-3.5 py-2.5 text-sm sm:text-base font-medium text-white transition-colors focus:border-[#F28C38] focus:outline-none focus:ring-2 focus:ring-[#F28C38]/30 cursor-pointer"
                >
                  {regionConfig.languages.map((lang) => (
                    <option
                      key={lang}
                      value={lang}
                      className="bg-[#0D1526] text-white"
                    >
                      {lang}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Step 2: Festival, Brand, City, Audience, Budget */}
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
            <div className="min-w-0">
              <label
                htmlFor="festival-select"
                className="mb-2 block text-sm font-medium text-slate-200"
              >
                Festival / Moment
              </label>
              <select
                id="festival-select"
                value={input.festival}
                onChange={(e) =>
                  onChangeInput("festival", e.target.value as FestivalName)
                }
                className="w-full rounded-xl border border-white/15 bg-[#0A1022]/80 px-3.5 py-2.5 text-base font-medium text-white transition-colors focus:border-[#F28C38] focus:outline-none focus:ring-2 focus:ring-[#F28C38]/30 cursor-pointer"
              >
                <optgroup
                  label={`Suggested for ${regionConfig.id}`}
                  className="bg-[#0D1526] text-[#F28C38]"
                >
                  {regionConfig.suggestedFestivals.map((fest) => (
                    <option
                      key={fest}
                      value={fest}
                      className="bg-[#0D1526] text-white"
                    >
                      {fest}
                    </option>
                  ))}
                </optgroup>
                {otherMarketFestivals.length > 0 && (
                  <optgroup
                    label={`More ${activeMarket} Festivals`}
                    className="bg-[#0D1526] text-slate-300"
                  >
                    {otherMarketFestivals.map((fest) => (
                      <option
                        key={fest}
                        value={fest}
                        className="bg-[#0D1526] text-white"
                      >
                        {fest}
                      </option>
                    ))}
                  </optgroup>
                )}
                {globalExtraFestivals.length > 0 && (
                  <optgroup
                    label="Global Calendar"
                    className="bg-[#0D1526] text-slate-400"
                  >
                    {globalExtraFestivals.map((fest) => (
                      <option
                        key={fest}
                        value={fest}
                        className="bg-[#0D1526] text-white"
                      >
                        {fest}
                      </option>
                    ))}
                  </optgroup>
                )}
              </select>
            </div>

            <div className="min-w-0">
              <label
                htmlFor="brand-input"
                className="mb-2 block text-sm font-medium text-slate-200"
              >
                Brand name
              </label>
              <input
                id="brand-input"
                type="text"
                value={input.brand}
                onChange={(e) => onChangeInput("brand", e.target.value)}
                placeholder={
                  activeMarket === "India"
                    ? "e.g. Mithai Mahal"
                    : "e.g. Maison Lumière"
                }
                className="w-full rounded-xl border border-white/15 bg-[#0A1022]/80 px-3.5 py-2.5 text-base text-white placeholder:text-slate-500 transition-colors focus:border-[#F28C38] focus:outline-none focus:ring-2 focus:ring-[#F28C38]/30"
              />
            </div>

            <div className="min-w-0">
              <label
                htmlFor="city-input"
                className="mb-2 block text-sm font-medium text-slate-200"
              >
                City
              </label>
              <input
                id="city-input"
                type="text"
                value={input.city}
                onChange={(e) => onChangeInput("city", e.target.value)}
                placeholder={`e.g. ${regionConfig.defaultCity}`}
                className="w-full rounded-xl border border-white/15 bg-[#0A1022]/80 px-3.5 py-2.5 text-base text-white placeholder:text-slate-500 transition-colors focus:border-[#F28C38] focus:outline-none focus:ring-2 focus:ring-[#F28C38]/30"
              />
            </div>

            <div className="min-w-0">
              <label
                htmlFor="audience-input"
                className="mb-2 block text-sm font-medium text-slate-200"
              >
                Target audience
              </label>
              <input
                id="audience-input"
                type="text"
                value={input.audience}
                onChange={(e) => onChangeInput("audience", e.target.value)}
                placeholder={`e.g. ${input.festival} gift shoppers`}
                className="w-full rounded-xl border border-white/15 bg-[#0A1022]/80 px-3.5 py-2.5 text-base text-white placeholder:text-slate-500 transition-colors focus:border-[#F28C38] focus:outline-none focus:ring-2 focus:ring-[#F28C38]/30"
              />
            </div>
          </div>

          {/* Budget Slider */}
          <div className="rounded-xl border border-white/10 bg-[#0A1022]/55 p-4 sm:px-5">
            <div className="mb-2 flex items-baseline justify-between gap-4">
              <label
                htmlFor="budget-slider"
                className="text-sm font-medium text-slate-200"
              >
                Campaign Budget ({regionConfig.currencyCode})
              </label>
              <span className="text-lg font-bold text-[#F28C38] tabular-nums">
                {formatBudget(input.budget, activeMarket, regionConfig.id)}
              </span>
            </div>
            <input
              id="budget-slider"
              type="range"
              min={regionConfig.budgetMin}
              max={regionConfig.budgetMax}
              step={regionConfig.budgetStep}
              value={Math.min(
                regionConfig.budgetMax,
                Math.max(regionConfig.budgetMin, input.budget)
              )}
              onChange={(e) => onChangeInput("budget", Number(e.target.value))}
              className="stage-slider w-full"
            />
            <div className="mt-1.5 flex justify-between text-xs text-slate-400 tabular-nums">
              <span>
                {formatBudget(regionConfig.budgetMin, activeMarket, regionConfig.id)}
              </span>
              <span>
                {formatBudget(regionConfig.budgetMax, activeMarket, regionConfig.id)}
              </span>
            </div>
          </div>

          {/* Style Presets + Primary Generate CTA */}
          <div className="flex flex-col gap-6 border-t border-white/10 pt-6 lg:flex-row lg:items-end lg:justify-between">
            <div className="flex-1 space-y-2.5">
              <div className="flex items-center justify-between gap-2">
                <p className="text-sm font-medium text-slate-200">
                  Style Preset
                </p>
                <span className="text-xs text-slate-400">
                  Shapes copy tone & poster composition
                </span>
              </div>

              <div
                role="radiogroup"
                aria-label="Campaign style preset"
                className="grid grid-cols-2 gap-3 sm:grid-cols-4"
              >
                {STYLE_PRESETS.map((preset) => {
                  const isSelected = activeStyle === preset.id;
                  return (
                    <button
                      key={preset.id}
                      type="button"
                      role="radio"
                      aria-checked={isSelected}
                      onClick={() => onChangeInput("stylePreset", preset.id)}
                      className={`group flex flex-col items-start gap-2 rounded-xl border p-3 text-left transition-all duration-200 hover:-translate-y-0.5 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#F28C38] cursor-pointer ${
                        isSelected
                          ? "border-[#F28C38] bg-[#F28C38]/14 shadow-[0_0_24px_rgba(242,140,56,0.22)]"
                          : "border-white/12 bg-white/[0.03] hover:border-[#D4AF37]/45 hover:bg-white/[0.07]"
                      }`}
                    >
                      <div className="flex w-full items-center justify-between gap-2">
                        <span className="text-sm font-semibold text-white whitespace-nowrap">
                          {preset.id}
                        </span>
                        <span className="flex items-center gap-1 shrink-0" aria-hidden="true">
                          {preset.swatches.map((hex) => (
                            <span
                              key={hex}
                              className="h-2.5 w-2.5 rounded-full border border-white/25"
                              style={{ backgroundColor: hex }}
                            />
                          ))}
                        </span>
                      </div>
                      <span className="text-[11px] leading-snug text-slate-300 line-clamp-2">
                        {preset.subtitle}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="lg:w-64 shrink-0">
              <button
                type="submit"
                disabled={isGenerating}
                className="inline-flex w-full min-h-[52px] items-center justify-center gap-2.5 rounded-xl bg-gradient-to-r from-[#F28C38] to-[#F5A623] px-6 py-3.5 text-base font-bold text-[#090E1A] shadow-[0_8px_28px_-4px_rgba(242,140,56,0.5)] transition-all duration-200 hover:scale-[1.02] hover:shadow-[0_12px_34px_-4px_rgba(242,140,56,0.72)] active:scale-[0.98] disabled:opacity-75 disabled:hover:scale-100 disabled:cursor-wait focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white whitespace-nowrap shrink-0 cursor-pointer"
              >
                {isGenerating ? (
                  <>
                    <Loader2 className="h-5 w-5 animate-spin" aria-hidden="true" />
                    <span className="tabular-nums">
                      Crafting ({elapsedSeconds}s)
                    </span>
                  </>
                ) : (
                  <>
                    <Sparkles className="h-5 w-5" aria-hidden="true" />
                    <span>Generate campaign</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {validationError && (
            <p
              role="alert"
              className="rounded-xl border border-amber-400/40 bg-amber-500/10 px-4 py-3 text-sm font-medium text-amber-200"
            >
              {validationError}
            </p>
          )}
        </form>
      </div>
    </section>
  );
}
