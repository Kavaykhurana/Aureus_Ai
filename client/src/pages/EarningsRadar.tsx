import { useEffect, useMemo, useState } from "react";
import {
  Bell,
  CalendarDays,
  Check,
  ChevronRight,
  Clock3,
  ExternalLink,
  Filter,
  Plus,
  RotateCcw,
  Sparkles,
  TrendingUp,
  X,
} from "lucide-react";
import { useLocation } from "wouter";
import { toast } from "sonner";
import WorkspaceLayout from "@/components/WorkspaceLayout";
import { api, type EarningsData } from "@/lib/api";

export default function EarningsRadar() {
  const [, setLocation] = useLocation();
  const [horizon, setHorizon] = useState("30 days");
  const [data, setData] = useState<EarningsData | null>(null);
  const [loading, setLoading] = useState(true);

  // Filters
  const [showFilters, setShowFilters] = useState(false);
  const [impactFilter, setImpactFilter] = useState("All");
  const [alertFilter, setAlertFilter] = useState("All");

  // Add custom catalyst modal
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [catForm, setCatForm] = useState({
    ticker: "",
    title: "",
    date_str: "Apr 25",
    timing: "Post-market",
    impact: "High",
    move_str: "±6.5%",
  });

  function refreshEarnings() {
    return api
      .getEarnings()
      .then(setData)
      .catch(() => toast.error("Failed to load earnings radar"))
      .finally(() => setLoading(false));
  }

  useEffect(() => {
    refreshEarnings();
  }, []);

  // Filter catalysts by horizon, impact, and alert status
  const filteredCatalysts = useMemo(() => {
    if (!data?.catalysts) return [];
    return data.catalysts.filter((cat) => {
      // Horizon filter
      if (horizon === "7 days") {
        const d = cat.date_str.toLowerCase();
        // Match only items in late March near Mar 18
        if (!d.includes("mar 18") && !d.includes("mar 20") && !d.includes("mar 22")) {
          return false;
        }
      } else if (horizon === "30 days") {
        const d = cat.date_str.toLowerCase();
        // Skip May events in 30-day view
        if (d.includes("may")) {
          return false;
        }
      }

      // Impact filter
      if (impactFilter !== "All" && cat.impact !== impactFilter) {
        return false;
      }

      // Alert filter
      if (alertFilter === "Armed" && !cat.alertArmed) {
        return false;
      }

      return true;
    });
  }, [data, horizon, impactFilter, alertFilter]);

  const activeFilterCount = (impactFilter !== "All" ? 1 : 0) + (alertFilter !== "All" ? 1 : 0);

  async function handleAddCatalyst(e: React.FormEvent) {
    e.preventDefault();
    const sym = catForm.ticker.trim().toUpperCase();
    if (!sym || !catForm.title.trim()) {
      toast.error("Ticker and catalyst title required");
      return;
    }

    setSubmitting(true);
    try {
      await api.addCatalyst({
        ticker: sym,
        title: catForm.title.trim(),
        date_str: catForm.date_str.trim() || "Apr 25",
        timing: catForm.timing,
        impact: catForm.impact,
        move_str: catForm.move_str,
      });
      await refreshEarnings();
      toast.success(`${sym} catalyst added`, {
        description: "Added to market catalyst radar and armed for telemetry.",
      });
      setIsAddOpen(false);
      setCatForm({
        ticker: "",
        title: "",
        date_str: "Apr 25",
        timing: "Post-market",
        impact: "High",
        move_str: "±6.5%",
      });
    } catch {
      toast.error("Failed to add catalyst");
    } finally {
      setSubmitting(false);
    }
  }

  async function toggleAlert(ticker: string) {
    try {
      const res = await api.toggleEarningsAlert(ticker);
      setData((prev) =>
        prev
          ? {
              ...prev,
              catalysts: prev.catalysts.map((c) =>
                c.ticker === ticker ? { ...c, alertArmed: res.alertArmed } : c,
              ),
            }
          : prev,
      );
      const armed = res.alertArmed;
      toast(armed ? `${ticker} alert armed` : `${ticker} alert muted`, {
        description: "Earnings notification preference updated.",
      });
    } catch {
      toast.error("Failed to toggle earnings alert");
    }
  }

  return (
    <WorkspaceLayout
      eyebrow={`Saved view · ${(data?.trackedCount ?? 0).toString().padStart(2, "0")} events`}
      title="Earnings radar"
      description="Upcoming catalysts ranked by expected market impact, portfolio relevance, and the amount of attention your agents should allocate."
    >
      <div className="radar-hero mt-5">
        <div>
          <div className="eyebrow">
            <Sparkles size={11} /> Catalyst intelligence
          </div>
          <h2 className="mt-3 font-display text-[31px] tracking-[-.04em]">Know what moves next.</h2>
          <p className="mt-2 max-w-xl text-[11px] leading-5 text-[#8e7970]">
            Aureus watches filings, estimates, implied volatility, and portfolio exposure to surface
            the events that deserve a proactive review.
          </p>
        </div>
        <div className="radar-orb">
          <CalendarDays size={22} />
          <span>{data?.trackedCount ?? "—"}</span>
          <small>events</small>
        </div>
      </div>

      <div className="mt-5 grid grid-cols-2 gap-3 xl:grid-cols-4">
        <div className="metric-card">
          <div className="metric-icon metric-icon-orange">
            <CalendarDays size={16} />
          </div>
          <div className="mt-5 font-mono text-[10px] uppercase tracking-[.16em] text-[#9c8982]">
            Next catalyst
          </div>
          <div className="mt-1 font-display text-[28px]">
            {loading ? "—" : data?.nextCatalyst ?? "—"}
          </div>
          <div className="mt-2 text-[11px] text-[#e06c43]">
            {data?.nextCatalystName ?? "Loading…"}
          </div>
        </div>
        <div className="metric-card">
          <div className="metric-icon metric-icon-brown">
            <TrendingUp size={16} />
          </div>
          <div className="mt-5 font-mono text-[10px] uppercase tracking-[.16em] text-[#9c8982]">
            High impact
          </div>
          <div className="mt-1 font-display text-[28px]">
            {(data?.highImpactCount ?? 0).toString().padStart(2, "0")}
          </div>
          <div className="mt-2 text-[11px] text-[#8e7970]">Within selected horizon</div>
        </div>
        <div className="metric-card">
          <div className="metric-icon metric-icon-green">
            <Bell size={16} />
          </div>
          <div className="mt-5 font-mono text-[10px] uppercase tracking-[.16em] text-[#9c8982]">
            Tracked events
          </div>
          <div className="mt-1 font-display text-[28px]">
            {(data?.catalysts.filter((c) => c.alertArmed).length ?? 0).toString().padStart(2, "0")}
          </div>
          <div className="mt-2 text-[11px] text-[#6d846a]">Alerts armed</div>
        </div>
        <div className="metric-card">
          <div className="metric-icon metric-icon-orange">
            <Clock3 size={16} />
          </div>
          <div className="mt-5 font-mono text-[10px] uppercase tracking-[.16em] text-[#9c8982]">
            Last refresh
          </div>
          <div className="mt-1 font-display text-[28px]">
            {loading ? "—" : data?.lastRefresh ?? "—"}
          </div>
          <div className="mt-2 text-[11px] text-[#8e7970]">Market calendar synced</div>
        </div>
      </div>

      <section className="panel mt-5">
        <div className="panel-header">
          <div>
            <div className="eyebrow">
              <CalendarDays size={11} /> Event calendar
            </div>
            <h2 className="panel-title">Upcoming catalysts</h2>
          </div>
          <div className="flex gap-2">
            <div className="flex items-center gap-1 rounded-md bg-[#f2e8e4] p-1">
              {["7 days", "30 days", "90 days"].map((item) => (
                <button
                  key={item}
                  className={`range-button ${horizon === item ? "range-button-active" : ""}`}
                  onClick={() => {
                    setHorizon(item);
                    toast(`${item} horizon selected`, {
                      description: "Earnings radar horizon updated.",
                    });
                  }}
                >
                  {item}
                </button>
              ))}
            </div>
            <button
              className={`secondary-button ${showFilters ? "secondary-button-active" : ""}`}
              onClick={() => setShowFilters(!showFilters)}
            >
              <Filter size={14} /> Filter
              {activeFilterCount > 0 && (
                <span className="ml-1 rounded-full bg-[#e06c43] px-1.5 py-0.2 font-mono text-[9px] text-white">
                  {activeFilterCount}
                </span>
              )}
            </button>
          </div>
        </div>

        {showFilters && (
          <div className="border-b border-[#ebdcd3] bg-[#fdf9f5] px-5 py-3 animate-in fade-in duration-150">
            <div className="flex flex-wrap items-center gap-4 text-[11px]">
              <div className="flex items-center gap-2">
                <span className="font-mono text-[9px] uppercase tracking-[0.14em] text-[#9c8982]">Impact:</span>
                {["All", "High", "Medium"].map((lvl) => (
                  <button
                    key={lvl}
                    className={`audit-filter ${impactFilter === lvl ? "audit-filter-active" : ""}`}
                    onClick={() => setImpactFilter(lvl)}
                  >
                    {lvl}
                  </button>
                ))}
              </div>
              <div className="flex items-center gap-2">
                <span className="font-mono text-[9px] uppercase tracking-[0.14em] text-[#9c8982]">Status:</span>
                {["All", "Armed"].map((st) => (
                  <button
                    key={st}
                    className={`audit-filter ${alertFilter === st ? "audit-filter-active" : ""}`}
                    onClick={() => setAlertFilter(st)}
                  >
                    {st === "Armed" ? "Armed only" : "All"}
                  </button>
                ))}
              </div>
              {activeFilterCount > 0 && (
                <button
                  className="ml-auto flex items-center gap-1 font-mono text-[10px] text-[#e06c43] hover:underline"
                  onClick={() => {
                    setImpactFilter("All");
                    setAlertFilter("All");
                  }}
                >
                  <RotateCcw size={11} /> Reset
                </button>
              )}
            </div>
          </div>
        )}

        <div className="earnings-list">
          {loading && (
            <div className="px-5 py-10 text-center text-[11px] text-[#9c8982]">
              Loading earnings calendar…
            </div>
          )}
          {!loading &&
            filteredCatalysts.map((cat) => (
              <div className="earnings-row" key={cat.id}>
                <div className="earnings-date">
                  <b>{cat.date_str.split(" ")[0]}</b>
                  <span>{cat.date_str.split(" ")[1]}</span>
                </div>
                <button
                  className="ticker-avatar"
                  onClick={() => setLocation(`/stock/${cat.ticker}`)}
                >
                  {cat.ticker.slice(0, 1)}
                </button>
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <button
                      className="ticker-link font-semibold"
                      onClick={() => setLocation(`/stock/${cat.ticker}`)}
                    >
                      {cat.ticker}
                    </button>
                    <span className={`impact-badge impact-badge-${cat.tone}`}>{cat.impact}</span>
                  </div>
                  <div className="mt-1 text-[11px] text-[#8e7970]">{cat.title}</div>
                </div>
                <div className="hidden text-[10px] text-[#9c8982] md:block">{cat.timing}</div>
                <div className="hidden font-mono text-[10px] text-[#e06c43] sm:block">
                  {cat.move_str}
                </div>
                <button
                  className={`alert-toggle ${cat.alertArmed ? "alert-toggle-on" : ""}`}
                  onClick={() => toggleAlert(cat.ticker)}
                  aria-label={`Toggle ${cat.ticker} earnings alert`}
                >
                  <Bell size={14} />
                </button>
                <button
                  className="earnings-open"
                  title={`Open ${cat.ticker} detail`}
                  onClick={() => setLocation(`/stock/${cat.ticker}`)}
                >
                  <ExternalLink size={14} />
                </button>
                <ChevronRight
                  size={14}
                  className="cursor-pointer text-[#b39e94] hover:text-[#40332c]"
                  onClick={() => setLocation(`/stock/${cat.ticker}`)}
                />
              </div>
            ))}
          {!loading && !filteredCatalysts.length && (
            <div className="px-5 py-10 text-center text-[11px] text-[#9c8982]">
              No catalysts match the selected horizon and filters.
            </div>
          )}
        </div>

        <div className="panel-footer-action">
          <button
            className="secondary-button"
            onClick={() => setIsAddOpen(true)}
          >
            <Plus size={14} /> Add custom catalyst
          </button>
        </div>
      </section>

      {/* Add Custom Catalyst Modal */}
      {isAddOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="relative w-full max-w-md rounded-xl border border-[#ded2c2] bg-[#fbf6f0] p-6 shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-[#e8dacc]">
              <div className="flex items-center gap-2">
                <div className="metric-icon metric-icon-orange p-1.5"><CalendarDays size={16} /></div>
                <h3 className="font-display text-[20px] text-[#34261f]">Add Custom Catalyst</h3>
              </div>
              <button
                className="icon-button icon-button-small"
                onClick={() => setIsAddOpen(false)}
              >
                <X size={15} />
              </button>
            </div>
            <form onSubmit={handleAddCatalyst} className="mt-4 space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="field-label">Ticker symbol</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. TSLA"
                    maxLength={8}
                    className="w-full rounded-md border border-[#d8c7b8] bg-white px-3 py-2 font-mono text-[13px] text-[#34261f] outline-none focus:border-[#e06c43]"
                    value={catForm.ticker}
                    onChange={(e) => setCatForm({ ...catForm, ticker: e.target.value.toUpperCase() })}
                  />
                </div>
                <div>
                  <label className="field-label">Date string</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Apr 25"
                    className="w-full rounded-md border border-[#d8c7b8] bg-white px-3 py-2 font-mono text-[12px] text-[#34261f] outline-none focus:border-[#e06c43]"
                    value={catForm.date_str}
                    onChange={(e) => setCatForm({ ...catForm, date_str: e.target.value })}
                  />
                </div>
              </div>
              <div>
                <label className="field-label">Catalyst title / description</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Q1 Earnings Call & Margin Guidance"
                  className="w-full rounded-md border border-[#d8c7b8] bg-white px-3 py-2 text-[12px] text-[#34261f] outline-none focus:border-[#e06c43]"
                  value={catForm.title}
                  onChange={(e) => setCatForm({ ...catForm, title: e.target.value })}
                />
              </div>
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="field-label">Timing</label>
                  <select
                    className="w-full rounded-md border border-[#d8c7b8] bg-white px-2 py-2 text-[11px] text-[#34261f] outline-none focus:border-[#e06c43]"
                    value={catForm.timing}
                    onChange={(e) => setCatForm({ ...catForm, timing: e.target.value })}
                  >
                    <option value="Post-market">Post-market</option>
                    <option value="Pre-market">Pre-market</option>
                    <option value="During session">During session</option>
                  </select>
                </div>
                <div>
                  <label className="field-label">Impact</label>
                  <select
                    className="w-full rounded-md border border-[#d8c7b8] bg-white px-2 py-2 text-[11px] text-[#34261f] outline-none focus:border-[#e06c43]"
                    value={catForm.impact}
                    onChange={(e) => setCatForm({ ...catForm, impact: e.target.value })}
                  >
                    <option value="High">High</option>
                    <option value="Medium">Medium</option>
                    <option value="Low">Low</option>
                  </select>
                </div>
                <div>
                  <label className="field-label">Implied Move</label>
                  <input
                    type="text"
                    placeholder="±6.5%"
                    className="w-full rounded-md border border-[#d8c7b8] bg-white px-2 py-2 font-mono text-[11px] text-[#34261f] outline-none focus:border-[#e06c43]"
                    value={catForm.move_str}
                    onChange={(e) => setCatForm({ ...catForm, move_str: e.target.value })}
                  />
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
                  {submitting ? "Adding..." : "Add catalyst"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </WorkspaceLayout>
  );
}
