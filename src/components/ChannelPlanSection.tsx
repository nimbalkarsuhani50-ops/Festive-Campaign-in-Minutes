import { motion, useInView } from "motion/react";
import { useEffect, useRef, type RefObject } from "react";
import { formatBudget, getRegionConfig } from "../data/campaigns";
import { CountUp, EASE_OUT, Reveal, SectionHeading } from "../fx/primitives";
import type { ChannelPlanItem, MarketType } from "../types";

interface ChannelPlanSectionProps {
  channelPlan: ChannelPlanItem[];
  budget: number;
  market?: MarketType;
  region?: string;
  chartRef: RefObject<HTMLDivElement | null>;
}

const BAR_COLORS = ["#F28C38", "#F5B041", "#D4AF37", "#FF7EB6", "#E8A87C", "#C9A227"];

export function ChannelPlanSection({ channelPlan, budget, market = "India", region, chartRef }: ChannelPlanSectionProps) {
  const regionCfg = getRegionConfig(market, region);
  const inView = useInView(chartRef, { once: true, amount: 0.4 });
  const animatedOnce = useRef(false);

  useEffect(() => {
    const el = chartRef.current;
    if (!el || !window.Plotly) return;

    const channels = channelPlan.map((item) => item.channel);
    const amounts = channelPlan.map((item) => Math.round((item.percent_of_budget * budget) / 100));
    const hoverText = channelPlan.map(
      (item, i) => `${item.channel}<br>${item.percent_of_budget}% · ${formatBudget(amounts[i], market, region)}`
    );

    const trace = (ys: number[], showText: boolean) => ({
      type: "bar",
      x: channels,
      y: ys,
      text: showText ? amounts.map((amt) => formatBudget(amt, market, region)) : amounts.map(() => ""),
      textposition: "outside",
      textfont: { family: "Plus Jakarta Sans, sans-serif", size: 13, color: "#F8FAFC" },
      hovertext: hoverText,
      hoverinfo: "text",
      marker: {
        color: channels.map((_, idx) => BAR_COLORS[idx % BAR_COLORS.length]),
        line: { color: "rgba(255,243,196,0.6)", width: 1 },
      },
    });

    const maxAmount = Math.max(...amounts, regionCfg.budgetMin);
    const layout = (animate: boolean) => ({
      paper_bgcolor: "rgba(0,0,0,0)",
      plot_bgcolor: "rgba(0,0,0,0)",
      font: { family: "Plus Jakarta Sans, sans-serif", color: "#E2E8F0", size: 13 },
      margin: { t: 36, r: 24, b: 78, l: 92 },
      xaxis: {
        tickfont: { color: "#F8FAFC", size: 12 },
        gridcolor: "rgba(212, 175, 55, 0.1)",
        linecolor: "rgba(212, 175, 55, 0.35)",
      },
      yaxis: {
        title: { text: `Budget Allocation (${regionCfg.currencyCode})`, font: { color: "#CBD5E1", size: 12 } },
        tickprefix: regionCfg.currencySymbol,
        tickformat: ",.0f",
        tickfont: { color: "#CBD5E1", size: 12 },
        gridcolor: "rgba(212, 175, 55, 0.12)",
        zerolinecolor: "rgba(212, 175, 55, 0.3)",
        range: [0, maxAmount * 1.22],
      },
      bargap: 0.38,
      transition: animate ? { duration: 1100, easing: "elastic-out" } : { duration: 0 },
      hoverlabel: { bgcolor: "#0B1224", bordercolor: "#F28C38", font: { color: "#fff" } },
    });

    const config = { responsive: true, displayModeBar: false };

    // Always keep the real data in the chart (the PDF export reads it), but when the
    // chart first scrolls into view, grow the bars up from zero.
    if (inView && !animatedOnce.current) {
      animatedOnce.current = true;
      void window.Plotly.react(el, [trace(amounts.map(() => 0), false)], layout(false), config).then(() => {
        window.setTimeout(() => {
          void window.Plotly?.react(el, [trace(amounts, true)], layout(true), config);
        }, 60);
      });
    } else {
      void window.Plotly.react(el, [trace(amounts, true)], layout(false), config);
    }

    const handleResize = () => {
      if (el && window.Plotly?.Plots) window.Plotly.Plots.resize(el);
    };
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, [channelPlan, budget, market, region, regionCfg, chartRef, inView]);

  return (
    <section id="channel-plan" aria-label="Channel Plan" className="scroll-section space-y-7">
      <SectionHeading
        index="06"
        kicker="Where the money goes"
        title="Channel Plan"
        right={
          <div className="text-right">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">Total budget</p>
            <p className="font-display text-3xl font-bold text-[#F5B041] tabular-nums sm:text-4xl">
              <CountUp value={budget} format={(n) => formatBudget(Math.round(n), market, region)} duration={2} />
            </p>
          </div>
        }
      />

      <Reveal>
        <div className="glass-card overflow-hidden rounded-3xl">
          <div className="border-b border-white/10 bg-[#0B1224]/60 p-4 sm:p-7">
            <div ref={chartRef} className="h-[320px] w-full min-w-0 sm:h-[380px]" aria-label="Channel budget allocation bar chart" />
          </div>

          <div className="divide-y divide-white/[0.07] px-5 sm:px-8">
            {channelPlan.map((item, idx) => {
              const allocatedAmount = Math.round((item.percent_of_budget * budget) / 100);
              const color = BAR_COLORS[idx % BAR_COLORS.length];
              return (
                <motion.div
                  key={item.channel}
                  initial={{ opacity: 0, x: -24 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true, amount: 0.6 }}
                  transition={{ duration: 0.7, delay: idx * 0.08, ease: EASE_OUT }}
                  className="group py-5"
                >
                  <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between sm:gap-6">
                    <div className="min-w-0 space-y-1">
                      <p className="flex items-center gap-2.5 text-base font-semibold text-white sm:text-lg">
                        <span className="h-2.5 w-2.5 rounded-full" style={{ background: color, boxShadow: `0 0 12px ${color}` }} />
                        {item.channel}
                      </p>
                      <p className="text-sm text-slate-400">{item.why}</p>
                    </div>
                    <div className="flex shrink-0 items-baseline justify-between gap-5 tabular-nums sm:justify-end">
                      <span className="text-sm font-bold" style={{ color }}>
                        <CountUp value={item.percent_of_budget} format={(n) => `${Math.round(n)}%`} delay={idx * 0.08} />
                      </span>
                      <span className="min-w-[110px] text-right text-base font-bold text-white sm:text-lg">
                        <CountUp
                          value={allocatedAmount}
                          format={(n) => formatBudget(Math.round(n), market, region)}
                          delay={idx * 0.08}
                        />
                      </span>
                    </div>
                  </div>
                  <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-white/[0.06]">
                    <motion.div
                      initial={{ scaleX: 0 }}
                      whileInView={{ scaleX: item.percent_of_budget / 100 }}
                      viewport={{ once: true }}
                      transition={{ duration: 1.4, delay: 0.2 + idx * 0.1, ease: EASE_OUT }}
                      className="h-full origin-left rounded-full"
                      style={{ background: `linear-gradient(90deg, ${color}, ${color}66)`, boxShadow: `0 0 12px ${color}88` }}
                    />
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>
      </Reveal>
    </section>
  );
}
