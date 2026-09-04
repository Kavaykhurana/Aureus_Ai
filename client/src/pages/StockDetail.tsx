import { useEffect, useState } from "react";
import {
  ArrowDownRight,
  ArrowUpRight,
  ChevronLeft,
  FileText,
  GitBranch,
  Newspaper,
  Play,
  ShieldCheck,
  Star,
  TrendingUp,
} from "lucide-react";
import { useLocation, useRoute } from "wouter";
import { toast } from "sonner";
import WorkspaceLayout from "@/components/WorkspaceLayout";
import { api, type StockDetailData } from "@/lib/api";

export default function StockDetail() {
  const [, params] = useRoute("/stock/:ticker");
  const [, setLocation] = useLocation();
  const ticker = params?.ticker?.toUpperCase() ?? "NVDA";
  const [watching, setWatching] = useState(false);
  const [tab, setTab] = useState("Thesis");
  const [data, setData] = useState<StockDetailData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    api
      .getStockDetail(ticker)
      .then(setData)
      .catch(() => toast.error(`Failed to load ${ticker} detail`))
      .finally(() => setLoading(false));

    api
      .getWatchlist()
      .then((wl) => {
        const item = wl.symbols.find((s) => s.ticker === ticker);
        if (item) setWatching(item.alertArmed);
      })
      .catch(() => {});
  }, [ticker]);

  async function handleToggleWatchlist() {
    try {
      const res = await api.toggleWatchlistAlert(ticker);
      setWatching(res.alertArmed);
      toast(
        res.alertArmed ? `${ticker} added to watchlist` : `${ticker} removed from watchlist`,
        { description: "Watchlist preference updated." },
      );
    } catch {
      toast.error("Failed to update watchlist");
    }
  }

  const priceChange = data?.change ?? 0;
  const isUp = priceChange >= 0;

  return (
    <WorkspaceLayout
      eyebrow="Position intelligence"
      title={`${ticker} detail`}
      description="A focused research workspace combining market context, agent reasoning, and risk contribution for one instrument."
    >
      <div className="mt-5 flex items-center justify-between">
        <button className="secondary-button" onClick={() => setLocation("/portfolio")}>
          <ChevronLeft size={14} /> Back to portfolio
        </button>
        <button
          className={`secondary-button ${watching ? "secondary-button-active" : ""}`}
          onClick={handleToggleWatchlist}
        >
          <Star size={14} fill={watching ? "currentColor" : "none"} />{" "}
          {watching ? "Watching" : "Add to watchlist"}
        </button>
      </div>

      {/* Hero */}
      <div className="stock-hero mt-4">
        <div>
          <div className="font-mono text-[10px] uppercase tracking-[.16em] text-[#ac8272]">
            {data?.sector ?? "—"} · AI infrastructure
          </div>
          <div className="mt-2 flex items-end gap-3">
            <h2 className="font-display text-[45px] leading-none tracking-[-.05em] text-[#242424]">
              {ticker}
            </h2>
            <span className="mb-1 rounded-full bg-[#e5f0e9] px-2 py-1 font-mono text-[9px] text-[#6d846a]">
              Covered
            </span>
          </div>
          <div className="mt-3 flex items-center gap-3">
            <span className="font-display text-[26px]">
              ${loading ? "—" : (data?.price ?? 0).toFixed(2)}
            </span>
            <span
              className={`flex items-center gap-1 text-[11px] ${isUp ? "text-[#6d846a]" : "text-[#e06c43]"}`}
            >
              {isUp ? <ArrowUpRight size={14} /> : <ArrowDownRight size={14} />}
              {isUp ? "+" : ""}
              {(data?.changePct ?? 0).toFixed(2)}% today
            </span>
          </div>
        </div>

        {/* Sparkline from priceSeries */}
        <div className="stock-sparkline">
          <svg viewBox="0 0 300 100" preserveAspectRatio="none">
            {data?.priceSeries && data.priceSeries.length > 1 && (() => {
              const pts = data.priceSeries;
              const min = Math.min(...pts);
              const max = Math.max(...pts);
              const range = max - min || 1;
              const coords = pts
                .map((v, i) => {
                  const x = (i / (pts.length - 1)) * 300;
                  const y = 100 - ((v - min) / range) * 90 - 5;
                  return `${x},${y}`;
                })
                .join(" L ");
              return (
                <polyline
                  points={coords}
                  fill="none"
                  stroke="#f37a0a"
                  strokeWidth="3"
                  vectorEffect="non-scaling-stroke"
                />
              );
            })()}
            <path d="M0 100 H300" stroke="#e8dfdb" strokeWidth="1" />
          </svg>
          <div className="flex justify-between font-mono text-[9px] text-[#a18e87]">
            <span>09:30</span>
            <span>16:00</span>
          </div>
        </div>
      </div>

      {/* Metric cards */}
      <div className="mt-5 grid grid-cols-2 gap-3 xl:grid-cols-4">
        <div className="metric-card">
          <div className="metric-icon metric-icon-green">
            <TrendingUp size={16} />
          </div>
          <div className="mt-5 font-mono text-[10px] uppercase tracking-[.16em] text-[#9c8982]">
            Agent confidence
          </div>
          <div className="mt-1 font-display text-[28px]">
            {loading ? "—" : `${data?.confidence ?? 0}%`}
          </div>
          <div className="mt-2 text-[11px] text-[#6d846a]">Above entry threshold</div>
        </div>
        <div className="metric-card">
          <div className="metric-icon metric-icon-orange">
            <GitBranch size={16} />
          </div>
          <div className="mt-5 font-mono text-[10px] uppercase tracking-[.16em] text-[#9c8982]">
            P/E ratio
          </div>
          <div className="mt-1 font-display text-[28px]">
            {loading ? "—" : (data?.peRatio ?? 0).toFixed(1)}x
          </div>
          <div className="mt-2 text-[11px] text-[#e06c43]">Sector multiple</div>
        </div>
        <div className="metric-card">
          <div className="metric-icon metric-icon-brown">
            <ShieldCheck size={16} />
          </div>
          <div className="mt-5 font-mono text-[10px] uppercase tracking-[.16em] text-[#9c8982]">
            Gross margin
          </div>
          <div className="mt-1 font-display text-[28px]">
            {loading ? "—" : `${data?.grossMarginPct ?? 0}%`}
          </div>
          <div className="mt-2 text-[11px] text-[#8e7970]">Filing-based</div>
        </div>
        <div className="metric-card">
          <div className="metric-icon metric-icon-green">
            <ArrowUpRight size={16} />
          </div>
          <div className="mt-5 font-mono text-[10px] uppercase tracking-[.16em] text-[#9c8982]">
            Market cap
          </div>
          <div className="mt-1 font-display text-[28px]">
            ${loading ? "—" : `${data?.marketCapB ?? 0}B`}
          </div>
          <div className="mt-2 text-[11px] text-[#8e7970]">Approximate</div>
        </div>
      </div>

      {/* Thesis + evidence */}
      <div className="mt-5 grid gap-5 xl:grid-cols-[minmax(0,1.25fr)_minmax(330px,.75fr)]">
        <section className="panel">
          <div className="panel-header">
            <div>
              <div className="eyebrow">
                <GitBranch size={11} /> Agent synthesis
              </div>
              <h2 className="panel-title">Why Aureus is constructive</h2>
            </div>
            <button
              className="primary-button min-h-[34px] px-3"
              onClick={() => {
                setLocation(`/?ticker=${ticker}`);
                toast("Analysis launched", {
                  description: `Running fresh 5-agent pipeline for ${ticker}.`,
                });
              }}
            >
              <Play size={13} fill="currentColor" /> Run fresh analysis
            </button>
          </div>

          <div className="detail-tabs">
            {["Thesis", "Evidence", "Risk notes"].map((item) => (
              <button
                key={item}
                className={tab === item ? "detail-tab-active" : "detail-tab"}
                onClick={() => setTab(item)}
              >
                {item}
              </button>
            ))}
          </div>

          <div className="evidence-list">
            {tab === "Thesis" && data?.filingSummary && (
              <div className="evidence-item">
                <div className="evidence-mark">✦</div>
                <div>
                  <div className="text-[12px] font-semibold text-[#493a32]">Filing summary</div>
                  <div className="mt-1 text-[11px] leading-5 text-[#8e7970]">
                    {data.filingSummary}
                  </div>
                </div>
              </div>
            )}
            {tab === "Evidence" &&
              (data?.evidence ?? []).map(({ title, copy, tone }) => (
                <div className="evidence-item" key={title}>
                  <div className={`evidence-mark ${tone === "warning" ? "evidence-mark-warning" : ""}`}>
                    {tone === "warning" ? "!" : "+"}
                  </div>
                  <div>
                    <div className="text-[12px] font-semibold text-[#493a32]">{title}</div>
                    <div className="mt-1 text-[11px] leading-5 text-[#8e7970]">{copy}</div>
                  </div>
                </div>
              ))}
            {tab === "Risk notes" &&
              (data?.riskFactors ?? []).map((rf) => (
                <div className="evidence-item" key={rf}>
                  <div className="evidence-mark evidence-mark-warning">!</div>
                  <div>
                    <div className="mt-1 text-[11px] leading-5 text-[#8e7970]">{rf}</div>
                  </div>
                </div>
              ))}
            {loading && (
              <div className="px-5 py-6 text-[11px] text-[#9c8982]">Loading thesis…</div>
            )}
          </div>
        </section>

        {/* Signal sources */}
        <section className="panel">
          <div className="panel-header">
            <div>
              <div className="eyebrow">
                <Newspaper size={11} /> Market context
              </div>
              <h2 className="panel-title">Signal sources</h2>
            </div>
          </div>
          <div className="source-list">
            {(data?.sourceScores ?? []).map(({ name, score, detail }) => (
              <div className="source-card" key={name}>
                <div
                  className={`source-score ${score >= 80 ? "" : score >= 70 ? "source-score-gold" : "source-score-soft"}`}
                >
                  {score}
                </div>
                <div>
                  <b>{name}</b>
                  <small>{detail}</small>
                </div>
                <ArrowUpRight size={14} className="ml-auto text-[#6d846a]" />
              </div>
            ))}
            {loading && (
              <div className="px-5 py-6 text-[11px] text-[#9c8982]">Loading sources…</div>
            )}
          </div>
          <button
            className="secondary-button mt-4 w-full justify-center"
            onClick={() =>
              toast("Evidence report opened", {
                description: "Signed source evidence is ready for review.",
              })
            }
          >
            <FileText size={14} /> View evidence report
          </button>
        </section>
      </div>
    </WorkspaceLayout>
  );
}
