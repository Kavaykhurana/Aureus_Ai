import { useEffect, useState } from "react";
import { ArrowUpRight, Download, MoreHorizontal, Plus, Search, SlidersHorizontal, TrendingUp, Wallet } from "lucide-react";
import { toast } from "sonner";
import { useLocation } from "wouter";
import WorkspaceLayout from "@/components/WorkspaceLayout";
import { api, PortfolioData } from "@/lib/api";

export default function Portfolio() {
  const [, setLocation] = useLocation();
  const [period, setPeriod] = useState("1M");
  const [query, setQuery] = useState("");
  const [data, setData] = useState<PortfolioData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api
      .getPortfolio()
      .then((res) => {
        setData(res);
        setLoading(false);
      })
      .catch((err) => {
        console.error("Failed to load portfolio:", err);
        setLoading(false);
      });
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

  async function handleAddPosition() {
    const sym = prompt("Enter Ticker symbol to add/rebalance:", "GOOGL");
    if (!sym) return;

    try {
      await api.addHolding({
        ticker: sym.toUpperCase(),
        name: `${sym.toUpperCase()} Alphabet Inc.`,
        weight: 3.5,
        shares: 50,
        lastPrice: 175.50,
        costBasis: 175.50,
        sector: "Technology",
      });
      const refreshed = await api.getPortfolio();
      setData(refreshed);
      toast.success(`${sym.toUpperCase()} added to portfolio`, { description: "Holdings synchronized with ledger." });
    } catch {
      toast.error("Failed to add position");
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
                  d="M0 194 C58 185, 80 165, 126 177 S201 132, 244 148 S319 99, 358 120 S426 75, 469 90 S535 39, 579 63 S655 30, 704 47 S758 14, 800 22"
                  fill="none"
                  stroke="#f37a0a"
                  strokeWidth="3"
                  vectorEffect="non-scaling-stroke"
                />
                <path
                  d="M0 210 C70 198, 100 185, 150 190 S245 158, 300 170 S400 135, 450 146 S535 108, 600 120 S710 86, 800 96"
                  fill="none"
                  stroke="#cecac8"
                  strokeWidth="2"
                  strokeDasharray="6 6"
                  vectorEffect="non-scaling-stroke"
                />
              </svg>
              <div className="chart-axis">
                <span>Apr 01</span><span>Apr 15</span><span>May 01</span><span>May 15</span><span>Jun 01</span><span>Jun 17</span>
              </div>
            </div>
            <div className="mt-4 flex items-center gap-4 text-[11px] text-[#8e7970]">
              <span><i className="legend-line legend-line-portfolio" /> Aureus portfolio</span>
              <span><i className="legend-line legend-line-benchmark" /> S&amp;P 500</span>
              <span className="ml-auto font-mono text-[#e06c43]">+{data?.quarterReturnPct || 12.7}%</span>
            </div>
          </div>
        </section>

        <section className="panel">
          <div className="panel-header">
            <div>
              <div className="eyebrow"><SlidersHorizontal size={11} /> Allocation</div>
              <h2 className="panel-title">Capital mix</h2>
            </div>
            <button className="icon-button icon-button-small" onClick={() => toast("Allocation details", { description: "Weights are calculated from latest positions." })}>
              <MoreHorizontal size={15} />
            </button>
          </div>
          <div className="px-5 pb-5">
            <div className="allocation-donut">
              <div className="allocation-center">
                <span className="font-display text-[25px]">92%</span>
                <span className="font-mono text-[9px] text-[#9c8982]">invested</span>
              </div>
            </div>
            <div className="mt-5 space-y-3">
              <div className="allocation-row"><span><i className="allocation-dot allocation-dot-orange" /> Technology</span><b>59.7%</b></div>
              <div className="allocation-row"><span><i className="allocation-dot allocation-dot-gold" /> Consumer</span><b>14.2%</b></div>
              <div className="allocation-row"><span><i className="allocation-dot allocation-dot-green" /> Cash</span><b>8.1%</b></div>
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
            <button className="secondary-button" onClick={handleAddPosition}><Plus size={14} /> Add</button>
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
    </WorkspaceLayout>
  );
}
