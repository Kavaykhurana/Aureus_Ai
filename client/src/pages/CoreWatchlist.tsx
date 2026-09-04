import { useEffect, useMemo, useState } from "react";
import {
  ArrowUpRight,
  Bell,
  MoreHorizontal,
  Plus,
  Search,
  Star,
  Target,
  TrendingUp,
} from "lucide-react";
import { useLocation } from "wouter";
import { toast } from "sonner";
import WorkspaceLayout from "@/components/WorkspaceLayout";
import { api, type WatchlistData } from "@/lib/api";

export default function CoreWatchlist() {
  const [, setLocation] = useLocation();
  const [data, setData] = useState<WatchlistData | null>(null);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");
  const [sort, setSort] = useState("Signal");

  useEffect(() => {
    api
      .getWatchlist()
      .then(setData)
      .catch(() => toast.error("Failed to load watchlist"))
      .finally(() => setLoading(false));
  }, []);

  const filtered = useMemo(() => {
    const symbols = data?.symbols ?? [];
    return [...symbols]
      .filter(({ ticker, name }) =>
        `${ticker} ${name}`.toLowerCase().includes(query.toLowerCase()),
      )
      .sort((a, b) =>
        sort === "Signal"
          ? b.confidence - a.confidence
          : sort === "Change"
            ? b.change_pct - a.change_pct
            : a.ticker.localeCompare(b.ticker),
      );
  }, [data, query, sort]);

  async function toggleAlert(ticker: string) {
    try {
      const res = await api.toggleWatchlistAlert(ticker);
      setData((prev) =>
        prev
          ? {
              ...prev,
              symbols: prev.symbols.map((s) =>
                s.ticker === ticker ? { ...s, alertArmed: res.alertArmed } : s,
              ),
            }
          : prev,
      );
      const armed = res.alertArmed;
      toast(armed ? `${ticker} alert armed` : `${ticker} alert muted`, {
        description: "Watchlist alert preference updated.",
      });
    } catch {
      toast.error("Failed to toggle alert");
    }
  }

  return (
    <WorkspaceLayout
      eyebrow={`Saved view · ${(data?.symbols.length ?? 0).toString().padStart(2, "0")} instruments`}
      title="Core watchlist"
      description="Your highest-priority names, ranked by the latest Aureus signal and ready for fast research or alerting."
    >
      <div className="watchlist-banner mt-5">
        <div className="flex items-start gap-3">
          <div className="watchlist-banner-icon">
            <Star size={16} fill="currentColor" />
          </div>
          <div>
            <div className="font-mono text-[9px] uppercase tracking-[.16em] text-[#d96846]">
              Focused coverage
            </div>
            <h2 className="mt-2 font-display text-[27px] tracking-[-.04em]">
              Signals worth watching.
            </h2>
            <p className="mt-1 max-w-xl text-[11px] leading-5 text-[#8e7970]">
              The watchlist refreshes when a signal changes materially, a policy threshold is
              approached, or a new event enters the evidence chain.
            </p>
          </div>
        </div>
        <button
          className="secondary-button"
          onClick={() =>
            toast("Watchlist saved", { description: "Your current view is already synchronized." })
          }
        >
          <Bell size={14} /> Manage alerts
        </button>
      </div>

      <div className="mt-5 grid grid-cols-2 gap-3 xl:grid-cols-4">
        <div className="metric-card">
          <div className="metric-icon metric-icon-green">
            <TrendingUp size={16} />
          </div>
          <div className="mt-5 font-mono text-[10px] uppercase tracking-[.16em] text-[#9c8982]">
            Bullish signals
          </div>
          <div className="mt-1 font-display text-[28px]">
            {(data?.bullishCount ?? 0).toString().padStart(2, "0")}
          </div>
          <div className="mt-2 text-[11px] text-[#6d846a]">Above 70 confidence</div>
        </div>
        <div className="metric-card">
          <div className="metric-icon metric-icon-orange">
            <Target size={16} />
          </div>
          <div className="mt-5 font-mono text-[10px] uppercase tracking-[.16em] text-[#9c8982]">
            Avg confidence
          </div>
          <div className="mt-1 font-display text-[28px]">{data?.avgConfidence ?? "—"}</div>
          <div className="mt-2 text-[11px] text-[#8e7970]">+4.2 pts this week</div>
        </div>
        <div className="metric-card">
          <div className="metric-icon metric-icon-brown">
            <Bell size={16} />
          </div>
          <div className="mt-5 font-mono text-[10px] uppercase tracking-[.16em] text-[#9c8982]">
            Active alerts
          </div>
          <div className="mt-1 font-display text-[28px]">
            {(data?.activeAlerts ?? 0).toString().padStart(2, "0")}
          </div>
          <div className="mt-2 text-[11px] text-[#8e7970]">
            Across {data?.symbols.length ?? 0} instruments
          </div>
        </div>
        <div className="metric-card">
          <div className="metric-icon metric-icon-green">
            <ArrowUpRight size={16} />
          </div>
          <div className="mt-5 font-mono text-[10px] uppercase tracking-[.16em] text-[#9c8982]">
            Net move
          </div>
          <div className="mt-1 font-display text-[28px]">
            {data?.netMovePct !== undefined
              ? `${data.netMovePct >= 0 ? "+" : ""}${data.netMovePct.toFixed(1)}%`
              : "—"}
          </div>
          <div className="mt-2 text-[11px] text-[#6d846a]">Today&apos;s weighted return</div>
        </div>
      </div>

      <section className="panel mt-5">
        <div className="panel-header">
          <div>
            <div className="eyebrow">
              <Star size={11} /> Priority names
            </div>
            <h2 className="panel-title">
              Signal watchlist{" "}
              <span className="font-mono text-[10px] font-normal text-[#9c8982]">
                / {filtered.length} shown
              </span>
            </h2>
          </div>
          <div className="flex gap-2">
            <div className="mini-search">
              <Search size={14} />
              <input
                aria-label="Search watchlist"
                placeholder="Search symbols"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
              />
            </div>
            <button
              className="secondary-button"
              onClick={() =>
                toast("Add to watchlist", {
                  description: "Type a ticker in the command center to start coverage.",
                })
              }
            >
              <Plus size={14} /> Add symbol
            </button>
          </div>
        </div>

        <div className="watchlist-controls">
          <span className="text-[10px] text-[#9c8982]">Sort by</span>
          {["Signal", "Change", "Symbol"].map((item) => (
            <button
              key={item}
              className={`audit-filter ${sort === item ? "audit-filter-active" : ""}`}
              onClick={() => setSort(item)}
            >
              {item}
            </button>
          ))}
        </div>

        <div className="watchlist-list">
          {loading && (
            <div className="px-5 py-10 text-center text-[11px] text-[#9c8982]">
              Loading watchlist…
            </div>
          )}
          {!loading &&
            filtered.map((sym) => (
              <div className="watchlist-row" key={sym.ticker}>
                <button
                  className="ticker-avatar"
                  onClick={() => setLocation(`/stock/${sym.ticker}`)}
                >
                  {sym.ticker.slice(0, 1)}
                </button>
                <div className="min-w-0">
                  <button
                    className="ticker-link"
                    onClick={() => setLocation(`/stock/${sym.ticker}`)}
                  >
                    {sym.ticker}
                  </button>
                  <small>{sym.name}</small>
                </div>
                <div className="hidden sm:block">
                  <div className="font-mono text-[11px] text-[#594941]">
                    ${sym.price.toFixed(2)}
                  </div>
                  <div
                    className={`mt-1 text-[10px] ${sym.tone === "green" ? "positive-text" : sym.tone === "warning" ? "text-[#e06c43]" : "text-[#9c8982]"}`}
                  >
                    {sym.change_pct >= 0 ? "+" : ""}
                    {sym.change_pct.toFixed(2)}%
                  </div>
                </div>
                <div className="signal-meter">
                  <div className="flex justify-between">
                    <span className="font-mono text-[9px] text-[#9c8982]">Signal</span>
                    <b>{sym.confidence}</b>
                  </div>
                  <div className="risk-bar">
                    <div
                      className={`risk-bar-fill ${sym.tone === "green" ? "risk-low" : sym.tone === "warning" ? "risk-high" : "risk-moderate"}`}
                      style={{ width: `${sym.confidence}%` }}
                    />
                  </div>
                </div>
                <span
                  className={`history-decision history-decision-${sym.tone === "green" ? "positive" : sym.tone === "warning" ? "warning" : "neutral"}`}
                >
                  {sym.signal}
                </span>
                <button
                  className={`alert-toggle ${sym.alertArmed ? "alert-toggle-on" : ""}`}
                  onClick={() => toggleAlert(sym.ticker)}
                  aria-label={`Toggle ${sym.ticker} alert`}
                >
                  <Bell size={14} />
                </button>
                <button
                  className="icon-button icon-button-small"
                  onClick={() =>
                    toast(`${sym.ticker} actions`, {
                      description:
                        "Open detail or run a fresh analysis from the instrument workspace.",
                    })
                  }
                >
                  <MoreHorizontal size={14} />
                </button>
              </div>
            ))}
        </div>
      </section>
    </WorkspaceLayout>
  );
}
