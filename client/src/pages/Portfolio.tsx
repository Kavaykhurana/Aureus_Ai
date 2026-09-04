import { useEffect, useMemo, useState } from "react";
import { ArrowUpRight, Check, Download, MoreHorizontal, Plus, Search, SlidersHorizontal, TrendingUp, Wallet, X } from "lucide-react";
import { toast } from "sonner";
import { useLocation } from "wouter";
import WorkspaceLayout from "@/components/WorkspaceLayout";
import { api, PortfolioData } from "@/lib/api";

const PERIOD_CONFIGS: Record<
  string,
  {
    portfolioPath: string;
    benchmarkPath: string;
    dates: string[];
    portfolioReturn: string;
    benchmarkReturn: string;
  }
> = {
  "1W": {
    portfolioPath: "M0 160 C120 150, 240 135, 360 140 S520 105, 640 115 S720 95, 800 80",
    benchmarkPath: "M0 165 C120 162, 240 155, 360 158 S520 140, 640 145 S720 135, 800 130",
    dates: ["Jun 10", "Jun 11", "Jun 12", "Jun 13", "Jun 16", "Jun 17"],
    portfolioReturn: "+2.4%",
    benchmarkReturn: "+0.9%",
  },
  "1M": {
    portfolioPath: "M0 180 C80 165, 160 150, 240 155 S400 120, 480 130 S640 90, 720 100 S760 65, 800 50",
    benchmarkPath: "M0 190 C80 185, 160 175, 240 180 S400 155, 480 160 S640 135, 720 140 S760 125, 800 115",
    dates: ["May 18", "May 25", "Jun 01", "Jun 08", "Jun 15", "Jun 17"],
    portfolioReturn: "+6.8%",
    benchmarkReturn: "+3.1%",
  },
  "3M": {
    portfolioPath: "M0 194 C58 185, 80 165, 126 177 S201 132, 244 148 S319 99, 358 120 S426 75, 469 90 S535 39, 579 63 S655 30, 704 47 S758 14, 800 22",
    benchmarkPath: "M0 210 C70 198, 100 185, 150 190 S245 158, 300 170 S400 135, 450 146 S535 108, 600 120 S710 86, 800 96",
    dates: ["Apr 01", "Apr 15", "May 01", "May 15", "Jun 01", "Jun 17"],
    portfolioReturn: "+12.7%",
    benchmarkReturn: "+5.4%",
  },
  "1Y": {
    portfolioPath: "M0 215 C70 200, 140 180, 210 185 S350 130, 420 145 S560 70, 630 85 S720 25, 800 15",
    benchmarkPath: "M0 220 C70 215, 140 200, 210 205 S350 165, 420 175 S560 120, 630 130 S720 90, 800 85",
    dates: ["Jun 23", "Sep 23", "Dec 23", "Feb 24", "Apr 24", "Jun 24"],
    portfolioReturn: "+34.2%",
    benchmarkReturn: "+18.5%",
  },
};

export default function Portfolio() {
  const [, setLocation] = useLocation();
  const [period, setPeriod] = useState("1M");
  const [query, setQuery] = useState("");
  const [data, setData] = useState<PortfolioData | null>(null);
  const [loading, setLoading] = useState(true);

  // Add position modal state
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [addForm, setAddForm] = useState({
    ticker: "",
    name: "",
    weight: "3.5",
    shares: "50",
    lastPrice: "150.00",
    sector: "Technology",
  });

  function refreshPortfolio() {
    return api
      .getPortfolio()
      .then((res) => {
        setData(res);
        setLoading(false);
      })
      .catch((err) => {
        console.error("Failed to load portfolio:", err);
        setLoading(false);
      });
  }

  useEffect(() => {
    refreshPortfolio();
  }, []);

  const holdingsList = data?.holdings || [
    { ticker: "NVDA", name: "NVIDIA Corporation", weight: 28.4, last_price: 132.40, return_pct: 18.2, tone: "green", shares: 1520, cost_basis: 112.0, sector: "Technology" },
    { ticker: "MSFT", name: "Microsoft Corporation", weight: 19.7, last_price: 445.70, return_pct: 11.6, tone: "green", shares: 313, cost_basis: 399.4, sector: "Technology" },
    { ticker: "AMZN", name: "Amazon.com, Inc.", weight: 14.2, last_price: 186.10, return_pct: 8.9, tone: "green", shares: 540, cost_basis: 170.9, sector: "Consumer" },
    { ticker: "META", name: "Meta Platforms", weight: 11.6, last_price: 498.20, return_pct: 6.3, tone: "green", shares: 165, cost_basis: 468.6, sector: "Technology" },
    { ticker: "CASH", name: "Cash & equivalents", weight: 8.1, last_price: 1.0, return_pct: 0.0, tone: "neutral", shares: 57382, cost_basis: 1.0, sector: "Cash" },
  ];

  const filtered = holdingsList.filter((h) =>
    `${h.ticker} ${h.name}`.toLowerCase().includes(query.toLowerCase())
  );

  const sectorBreakdown = useMemo(() => {
    const map: Record<string, number> = {};
    holdingsList.forEach((h) => {
      const sec = h.sector || "Other";
      map[sec] = (map[sec] || 0) + (h.weight || 0);
    });
    return Object.entries(map)
      .map(([sector, weight]) => ({ sector, weight: Number(weight.toFixed(1)) }))
      .sort((a, b) => b.weight - a.weight);
  }, [holdingsList]);

  const investedPct = useMemo(() => {
    const cashWeight = holdingsList.find((h) => h.ticker === "CASH")?.weight || 0;
    return Math.max(0, Math.min(100, Math.round(100 - cashWeight)));
  }, [holdingsList]);

  async function handleConfirmAdd(e: React.FormEvent) {
    e.preventDefault();
    const sym = addForm.ticker.trim().toUpperCase();
    if (!sym) {
      toast.error("Ticker symbol required");
      return;
    }

    setSubmitting(true);
    try {
      await api.addHolding({
        ticker: sym,
        name: addForm.name.trim() || `${sym} Corporation`,
        weight: Number(addForm.weight) || 3.0,
        shares: Number(addForm.shares) || 50,
        lastPrice: Number(addForm.lastPrice) || 100.0,
        costBasis: Number(addForm.lastPrice) || 100.0,
        sector: addForm.sector || "Technology",
      });
      await refreshPortfolio();
      toast.success(`${sym} added to portfolio`, { description: "Holdings ledger updated." });
      setIsAddOpen(false);
      setAddForm({
        ticker: "",
        name: "",
        weight: "3.5",
        shares: "50",
        lastPrice: "150.00",
        sector: "Technology",
      });
    } catch {
      toast.error("Failed to add position");
    } finally {
      setSubmitting(false);
    }
  }

  function handleExportCsv() {
    if (!data?.holdings) return;
    const headers = "Ticker,Name,Weight,LastPrice,CostBasis,ReturnPct,Sector\n";
    const rows = data.holdings
      .map((h) => `${h.ticker},"${h.name}",${h.weight}%,$${h.last_price},$${h.cost_basis},${h.return_pct}%,${h.sector}`)
      .join("\n");
    const blob = new Blob([headers + rows], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `aureus_portfolio_${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    toast.success("Portfolio CSV exported", { description: "Download complete." });
  }

  return (
    <WorkspaceLayout
      eyebrow="Portfolio intelligence"
      title="Portfolio overview"
      description="A live view of capital allocation, performance attribution, and positions currently covered by the Aureus agent fabric."
    >
      <div className="mt-5 grid grid-cols-2 gap-3 xl:grid-cols-4">
        <div className="metric-card">
          <div className="metric-icon metric-icon-green"><Wallet size={16} /></div>
          <div className="mt-5 font-mono text-[10px] uppercase tracking-[0.16em] text-[#9c8982]">Total value</div>
          <div className="mt-1 font-display text-[28px] tracking-[-.04em] text-[#242424]">
            ${data ? Math.round(data.totalValue).toLocaleString() : "708,420"}
          </div>
          <div className="mt-2 text-[11px] text-[#8e7970]">+{data?.quarterReturnPct || 12.7}% this quarter</div>
        </div>
        <div className="metric-card">
          <div className="metric-icon metric-icon-brown"><TrendingUp size={16} /></div>
          <div className="mt-5 font-mono text-[10px] uppercase tracking-[0.16em] text-[#9c8982]">Today's P&amp;L</div>
          <div className="mt-1 font-display text-[28px] tracking-[-.04em] text-[#242424]">
            +${data ? data.pnlToday.toLocaleString() : "4,832"}
          </div>
          <div className="mt-2 flex items-center gap-1 text-[11px] text-[#6d846a]">
            <ArrowUpRight size={13} /> +{data?.pnlTodayPct || 0.68}% vs open
          </div>
        </div>
        <div className="metric-card">
          <div className="metric-icon metric-icon-orange"><SlidersHorizontal size={16} /></div>
          <div className="mt-5 font-mono text-[10px] uppercase tracking-[0.16em] text-[#9c8982]">Concentration</div>
          <div className="mt-1 font-display text-[28px] tracking-[-.04em] text-[#242424]">
            {data?.concentrationPct || 28.4}%
          </div>
          <div className="mt-2 text-[11px] text-[#8e7970]">Largest position · {data?.concentrationTicker || "NVDA"}</div>
        </div>
        <div className="metric-card">
          <div className="metric-icon metric-icon-green"><ArrowUpRight size={16} /></div>
          <div className="mt-5 font-mono text-[10px] uppercase tracking-[0.16em] text-[#9c8982]">Alpha capture</div>
          <div className="mt-1 font-display text-[28px] tracking-[-.04em] text-[#242424]">
            +{data?.alphaCapture || 2.5}%
          </div>
          <div className="mt-2 text-[11px] text-[#8e7970]">vs S&amp;P 500 · 3M</div>
        </div>
      </div>

      <div className="mt-5 grid gap-5 xl:grid-cols-[minmax(0,1.25fr)_minmax(300px,.75fr)]">
        <section className="panel">
          <div className="panel-header">
            <div>
              <div className="eyebrow"><TrendingUp size={11} /> Performance</div>
              <h2 className="panel-title">Portfolio return</h2>
            </div>
            <div className="flex items-center gap-1 rounded-md bg-[#f2e8e4] p-1">
              {["1W", "1M", "3M", "1Y"].map((item) => (
                <button
                  key={item}
                  className={`range-button ${period === item ? "range-button-active" : ""}`}
                  onClick={() => {
                    setPeriod(item);
                    toast(`${item} performance view`, { description: "Portfolio period updated." });
                  }}
                >
                  {item}
                </button>
              ))}
            </div>
          </div>
          <div className="px-5 pb-5">
            <div className="portfolio-chart">
              <div className="chart-fill" />
              <svg viewBox="0 0 800 230" preserveAspectRatio="none" className="chart-svg">
                <path
                  d={PERIOD_CONFIGS[period]?.portfolioPath || PERIOD_CONFIGS["1M"].portfolioPath}
                  fill="none"
                  stroke="#f37a0a"
                  strokeWidth="3"
                  vectorEffect="non-scaling-stroke"
                />
                <path
                  d={PERIOD_CONFIGS[period]?.benchmarkPath || PERIOD_CONFIGS["1M"].benchmarkPath}
                  fill="none"
                  stroke="#cecac8"
                  strokeWidth="2"
                  strokeDasharray="6 6"
                  vectorEffect="non-scaling-stroke"
                />
              </svg>
              <div className="chart-axis">
                {(PERIOD_CONFIGS[period]?.dates || PERIOD_CONFIGS["1M"].dates).map((d, i) => (
                  <span key={i}>{d}</span>
                ))}
              </div>
            </div>
            <div className="mt-4 flex items-center gap-4 text-[11px] text-[#8e7970]">
              <span><i className="legend-line legend-line-portfolio" /> Aureus portfolio</span>
              <span><i className="legend-line legend-line-benchmark" /> S&amp;P 500 ({PERIOD_CONFIGS[period]?.benchmarkReturn || "+5.4%"})</span>
              <span className="ml-auto font-mono text-[#e06c43]">
                {PERIOD_CONFIGS[period]?.portfolioReturn || `+${data?.quarterReturnPct || 12.7}%`}
              </span>
            </div>
          </div>
        </section>

        <section className="panel">
          <div className="panel-header">
            <div>
              <div className="eyebrow"><SlidersHorizontal size={11} /> Allocation</div>
              <h2 className="panel-title">Capital mix</h2>
            </div>
            <button className="icon-button icon-button-small" onClick={() => toast("Allocation breakdown", { description: "Weights calculated dynamically from live portfolio positions." })}>
              <MoreHorizontal size={15} />
            </button>
          </div>
          <div className="px-5 pb-5">
            <div className="allocation-donut">
              <div className="allocation-center">
                <span className="font-display text-[25px]">{investedPct}%</span>
                <span className="font-mono text-[9px] text-[#9c8982]">invested</span>
              </div>
            </div>
            <div className="mt-5 space-y-3">
              {sectorBreakdown.slice(0, 5).map((item) => {
                const dotClass =
                  item.sector === "Technology"
                    ? "allocation-dot-orange"
                    : item.sector === "Consumer" || item.sector === "Healthcare"
                      ? "allocation-dot-gold"
                      : "allocation-dot-green";
                return (
                  <div className="allocation-row" key={item.sector}>
                    <span>
                      <i className={`allocation-dot ${dotClass}`} /> {item.sector}
                    </span>
                    <b>{item.weight}%</b>
                  </div>
                );
              })}
            </div>
          </div>
        </section>
      </div>

      <section className="panel mt-5">
        <div className="panel-header">
          <div>
            <div className="eyebrow"><Wallet size={11} /> Positions</div>
            <h2 className="panel-title">
              Active holdings <span className="font-mono text-[10px] font-normal text-[#9c8982]">/ {filtered.length} instruments</span>
            </h2>
          </div>
          <div className="flex gap-2">
            <div className="mini-search">
              <Search size={14} />
              <input aria-label="Search holdings" placeholder="Search holdings" value={query} onChange={(e) => setQuery(e.target.value)} />
            </div>
            <button className="secondary-button" onClick={() => setIsAddOpen(true)}><Plus size={14} /> Add</button>
            <button className="secondary-button" onClick={handleExportCsv}><Download size={14} /> Export</button>
          </div>
        </div>
        <div className="table-wrap">
          <table className="data-table">
            <thead>
              <tr>
                <th>Instrument</th>
                <th>Weight</th>
                <th>Last price</th>
                <th>Return</th>
                <th>Agent view</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((h) => (
                <tr key={h.ticker}>
                  <td>
                    <div className="flex items-center gap-3">
                      <div className="ticker-avatar">{h.ticker.slice(0, 1)}</div>
                      <div>
                        <button className="ticker-link" onClick={() => setLocation(`/stock/${h.ticker}`)}>{h.ticker}</button>
                        <small>{h.name}</small>
                      </div>
                    </div>
                  </td>
                  <td className="font-mono">{h.weight}%</td>
                  <td className="font-mono">{h.last_price > 1 ? `$${h.last_price.toFixed(2)}` : "—"}</td>
                  <td className={h.tone === "green" ? "positive-text font-mono" : "font-mono"}>
                    {h.return_pct > 0 ? `+${h.return_pct}%` : h.return_pct < 0 ? `${h.return_pct}%` : "—"}
                  </td>
                  <td>
                    <span className="table-status">{h.tone === "green" ? "Covered" : "Monitored"}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* In-app Add Position Modal */}
      {isAddOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="relative w-full max-w-md rounded-xl border border-[#ded2c2] bg-[#fbf6f0] p-6 shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-[#e8dacc]">
              <div className="flex items-center gap-2">
                <div className="metric-icon metric-icon-orange p-1.5"><Plus size={16} /></div>
                <h3 className="font-display text-[20px] text-[#34261f]">Add / Rebalance Position</h3>
              </div>
              <button
                className="icon-button icon-button-small"
                onClick={() => setIsAddOpen(false)}
              >
                <X size={15} />
              </button>
            </div>
            <form onSubmit={handleConfirmAdd} className="mt-4 space-y-4">
              <div>
                <label className="field-label">Ticker symbol</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. AAPL, PLTR, TSLA"
                  maxLength={8}
                  className="w-full rounded-md border border-[#d8c7b8] bg-white px-3 py-2 font-mono text-[13px] text-[#34261f] outline-none focus:border-[#e06c43]"
                  value={addForm.ticker}
                  onChange={(e) => setAddForm({ ...addForm, ticker: e.target.value.toUpperCase() })}
                />
              </div>
              <div>
                <label className="field-label">Company / asset name</label>
                <input
                  type="text"
                  placeholder="e.g. Apple Inc."
                  className="w-full rounded-md border border-[#d8c7b8] bg-white px-3 py-2 text-[12px] text-[#34261f] outline-none focus:border-[#e06c43]"
                  value={addForm.name}
                  onChange={(e) => setAddForm({ ...addForm, name: e.target.value })}
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="field-label">Weight (% of fund)</label>
                  <input
                    type="number"
                    step="0.1"
                    min="0.1"
                    max="50"
                    required
                    className="w-full rounded-md border border-[#d8c7b8] bg-white px-3 py-2 font-mono text-[12px] text-[#34261f] outline-none focus:border-[#e06c43]"
                    value={addForm.weight}
                    onChange={(e) => setAddForm({ ...addForm, weight: e.target.value })}
                  />
                </div>
                <div>
                  <label className="field-label">Shares / units</label>
                  <input
                    type="number"
                    min="1"
                    required
                    className="w-full rounded-md border border-[#d8c7b8] bg-white px-3 py-2 font-mono text-[12px] text-[#34261f] outline-none focus:border-[#e06c43]"
                    value={addForm.shares}
                    onChange={(e) => setAddForm({ ...addForm, shares: e.target.value })}
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="field-label">Last price ($)</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0.01"
                    required
                    className="w-full rounded-md border border-[#d8c7b8] bg-white px-3 py-2 font-mono text-[12px] text-[#34261f] outline-none focus:border-[#e06c43]"
                    value={addForm.lastPrice}
                    onChange={(e) => setAddForm({ ...addForm, lastPrice: e.target.value })}
                  />
                </div>
                <div>
                  <label className="field-label">Sector</label>
                  <select
                    className="w-full rounded-md border border-[#d8c7b8] bg-white px-3 py-2 text-[12px] text-[#34261f] outline-none focus:border-[#e06c43]"
                    value={addForm.sector}
                    onChange={(e) => setAddForm({ ...addForm, sector: e.target.value })}
                  >
                    <option value="Technology">Technology</option>
                    <option value="Healthcare">Healthcare</option>
                    <option value="Financials">Financials</option>
                    <option value="Consumer">Consumer</option>
                    <option value="Communication">Communication</option>
                    <option value="Industrials">Industrials</option>
                    <option value="Energy">Energy</option>
                    <option value="Cash">Cash</option>
                  </select>
                </div>
              </div>
              <div className="mt-5 flex items-center justify-end gap-2 border-t border-[#e8dacc] pt-4">
                <button
                  type="button"
                  className="secondary-button"
                  onClick={() => setIsAddOpen(false)}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="primary-button"
                  disabled={submitting}
                >
                  <Check size={14} />
                  {submitting ? "Adding..." : "Add position"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </WorkspaceLayout>
  );
}
