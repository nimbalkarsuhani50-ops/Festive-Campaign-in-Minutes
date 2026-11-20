import { motion } from "motion/react";
import { useEffect, type RefObject } from "react";
import { formatBudget, getRegionConfig } from "../data/campaigns";
import type { ChannelPlanItem, MarketType } from "../types";

interface ChannelPlanSectionProps {
  channelPlan: ChannelPlanItem[];
  budget: number;
  market?: MarketType;
  region?: string;
  chartRef: RefObject<HTMLDivElement | null>;
}

export function ChannelPlanSection({
  channelPlan,
  budget,
  market = "India",
  region,
  chartRef,
}: ChannelPlanSectionProps) {
  const regionCfg = getRegionConfig(market, region);

  useEffect(() => {
    const el = chartRef.current;
    if (!el || !window.Plotly) {
      return;
    }

    const channels = channelPlan.map((item) => item.channel);
    const amounts = channelPlan.map((item) =>
      Math.round((item.percent_of_budget * budget) / 100)
    );
    const hoverText = channelPlan.map((item, i) => {
      return `${item.channel}<br>${item.percent_of_budget}% · ${formatBudget(amounts[i], market, region)}`;
    });

    const data = [
      {
        type: "bar",
        x: channels,
        y: amounts,
        text: amounts.map((amt) => formatBudget(amt, market, region)),
        textposition: "outside",
        textfont: {
          family: "Plus Jakarta Sans, sans-serif",
          size: 13,
          color: "#F8FAFC",
        },
        hovertext: hoverText,
        hoverinfo: "text",
        marker: {
          color: channels.map((_, idx) =>
            idx === 0 ? "#F28C38" : "rgba(212, 175, 55, 0.85)"
          ),
          line: {
            color: "#D4AF37",
            width: 1,
          },
        },
      },
    ];

    const maxAmount = Math.max(...amounts, regionCfg.budgetMin);
    const layout = {
      paper_bgcolor: "rgba(0,0,0,0)",
      plot_bgcolor: "rgba(0,0,0,0)",
      font: {
        family: "Plus Jakarta Sans, sans-serif",
        color: "#E2E8F0",
        size: 13,
      },
      margin: { t: 36, r: 24, b: 78, l: 92 },
      xaxis: {
        tickfont: { color: "#F8FAFC", size: 12 },
        gridcolor: "rgba(212, 175, 55, 0.1)",
        linecolor: "rgba(212, 175, 55, 0.35)",
      },
      yaxis: {
        title: {
          text: `Budget Allocation (${regionCfg.currencyCode})`,
          font: { color: "#CBD5E1", size: 12 },
        },
        tickprefix: regionCfg.currencySymbol,
        tickformat: ",.0f",
        tickfont: { color: "#CBD5E1", size: 12 },
        gridcolor: "rgba(212, 175, 55, 0.14)",
        zerolinecolor: "rgba(212, 175, 55, 0.3)",
        range: [0, maxAmount * 1.22],
      },
      bargap: 0.34,
    };

    const config = {
      responsive: true,
      displayModeBar: false,
    };

    window.Plotly.react(el, data, layout, config);

    const handleResize = () => {
      if (el && window.Plotly?.Plots) {
        window.Plotly.Plots.resize(el);
      }
    };
    window.addEventListener("resize", handleResize);
    return () => {
      window.removeEventListener("resize", handleResize);
    };
  }, [channelPlan, budget, market, region, regionCfg, chartRef]);

  return (
    <motion.section
      id="channel-plan"
      aria-label="Channel Plan"
      initial={{ opacity: 0, y: 18 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: 0.18, ease: [0.16, 1, 0.3, 1] }}
      className="space-y-4"
    >
      <div className="flex flex-wrap items-baseline justify-between gap-4">
        <div className="flex items-center gap-2.5 text-sm font-semibold text-slate-300">
          <span className="text-[#F28C38] tabular-nums">06</span>
          <span aria-hidden="true">·</span>
          <h2 className="text-base font-bold text-white">Channel Plan</h2>
        </div>

        <p className="text-sm font-medium text-slate-300 tabular-nums">
          Total Budget:{" "}
          <span className="font-bold text-[#F28C38]">
            {formatBudget(budget, market, region)}
          </span>
        </p>
      </div>

      <div className="glass-card overflow-hidden rounded-2xl">
        <div className="border-b border-white/10 bg-[#0B1224]/70 p-4 sm:p-7">
          <div
            ref={chartRef}
            className="h-[320px] sm:h-[360px] w-full min-w-0"
            aria-label="Channel budget allocation bar chart"
          />
        </div>

        <div className="divide-y divide-white/10 px-5 sm:px-8">
          {channelPlan.map((item, idx) => {
            const allocatedAmount = Math.round(
              (item.percent_of_budget * budget) / 100
            );
            return (
              <div
                key={item.channel}
                className="flex flex-col gap-2 py-4 sm:flex-row sm:items-center sm:justify-between sm:gap-6"
              >
                <div className="min-w-0 space-y-0.5">
                  <p className="text-base sm:text-lg font-semibold text-white">
                    {item.channel}
                  </p>
                  <p className="text-sm text-slate-300">{item.why}</p>
                </div>

                <div className="flex items-baseline justify-between sm:justify-end gap-5 shrink-0 tabular-nums">
                  <span
                    className={`text-sm font-bold ${
                      idx === 0 ? "text-[#F28C38]" : "text-[#D4AF37]"
                    }`}
                  >
                    {item.percent_of_budget}%
                  </span>
                  <span className="min-w-[96px] text-right text-base sm:text-lg font-bold text-white">
                    {formatBudget(allocatedAmount, market, region)}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </motion.section>
  );
}
