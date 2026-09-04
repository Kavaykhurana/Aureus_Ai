import { useEffect, useState } from "react";
import {
  Bell,
  CalendarDays,
  ChevronRight,
  Clock3,
  ExternalLink,
  Filter,
  Plus,
  Sparkles,
  TrendingUp,
} from "lucide-react";
import { toast } from "sonner";
import WorkspaceLayout from "@/components/WorkspaceLayout";
import { api, type EarningsData } from "@/lib/api";

export default function EarningsRadar() {
  const [horizon, setHorizon] = useState("30 days");
  const [data, setData] = useState<EarningsData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api
      .getEarnings()
      .then(setData)
      .catch(() => toast.error("Failed to load earnings radar"))
      .finally(() => setLoading(false));
  }, []);

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
              className="secondary-button"
              onClick={() =>
                toast("Radar filters", {
                  description:
                    "Filter drawer is ready for sector, impact, and portfolio relevance.",
                })
              }
            >
              <Filter size={14} /> Filter
            </button>
          </div>
        </div>

        <div className="earnings-list">
          {loading && (
            <div className="px-5 py-10 text-center text-[11px] text-[#9c8982]">
              Loading earnings calendar…
            </div>
          )}
          {!loading &&
            (data?.catalysts ?? []).map((cat) => (
              <div className="earnings-row" key={cat.id}>
                <div className="earnings-date">
                  <b>{cat.date_str.split(" ")[0]}</b>
                  <span>{cat.date_str.split(" ")[1]}</span>
                </div>
                <div className="ticker-avatar">{cat.ticker.slice(0, 1)}</div>
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <b className="text-[12px] text-[#40332c]">{cat.ticker}</b>
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
                  onClick={() =>
                    toast(`${cat.ticker} catalyst opened`, {
                      description: "Analyst estimates and implied-move context are ready.",
                    })
                  }
                >
                  <ExternalLink size={14} />
                </button>
                <ChevronRight size={14} className="text-[#b39e94]" />
              </div>
            ))}
        </div>

        <div className="panel-footer-action">
          <button
            className="secondary-button"
            onClick={() =>
              toast("Add catalyst", {
                description: "Custom catalyst tracking is ready for a ticker or filing date.",
              })
            }
          >
            <Plus size={14} /> Add custom catalyst
          </button>
        </div>
      </section>
    </WorkspaceLayout>
  );
}
