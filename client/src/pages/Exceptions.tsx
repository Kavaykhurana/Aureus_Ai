import { useEffect, useMemo, useState } from "react";
import {
  AlertOctagon,
  ArrowRight,
  Check,
  Clock3,
  Filter,
  ShieldAlert,
  UserRound,
  X,
} from "lucide-react";
import { useLocation } from "wouter";
import { toast } from "sonner";
import WorkspaceLayout from "@/components/WorkspaceLayout";
import { api, type ExceptionItem } from "@/lib/api";

export default function Exceptions() {
  const [, setLocation] = useLocation();
  const [items, setItems] = useState<ExceptionItem[]>([]);
  const [filter, setFilter] = useState("All");
  const [openCount, setOpenCount] = useState(0);
  const [avgAgeMinutes, setAvgAgeMinutes] = useState(0);
  const [resolvedToday, setResolvedToday] = useState(0);
  const [ownerCoveragePct, setOwnerCoveragePct] = useState(100);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api
      .getExceptions()
      .then((data) => {
        setItems(data.items);
        setOpenCount(data.openCount);
        setAvgAgeMinutes(data.avgAgeMinutes);
        setResolvedToday(data.resolvedToday);
        setOwnerCoveragePct(data.ownerCoveragePct);
      })
      .catch(() => toast.error("Failed to load exceptions"))
      .finally(() => setLoading(false));
  }, []);

  const filtered = useMemo(
    () =>
      items.filter((item) => {
        if (filter === "All") return true;
        return item.severity === filter || item.status === filter;
      }),
    [items, filter],
  );

  async function resolve(id: string) {
    try {
      await api.resolveException(id);
      setItems((current) =>
        current.map((item) => (item.id === id ? { ...item, status: "Resolved" } : item)),
      );
      setOpenCount((c) => Math.max(0, c - 1));
      setResolvedToday((r) => r + 1);
      toast("Exception resolved", {
        description: `${id} has been marked resolved and added to the audit trail.`,
      });
    } catch {
      toast.error("Failed to resolve exception");
    }
  }

  async function dismiss(id: string) {
    try {
      await api.dismissException(id);
      setItems((current) =>
        current.map((item) => (item.id === id ? { ...item, status: "Dismissed" } : item)),
      );
      setOpenCount((c) => Math.max(0, c - 1));
      toast("Exception dismissed", {
        description: `${id} dismissed and recorded in audit log.`,
      });
    } catch {
      toast.error("Failed to dismiss exception");
    }
  }

  function handleInvestigate(item: ExceptionItem) {
    if (item.ticker) {
      setLocation(`/stock/${item.ticker}`);
    } else if (item.owner === "Risk") {
      setLocation("/risk");
    } else if (item.owner === "Guardrail" || item.owner === "Compliance") {
      setLocation("/policies");
    } else if (item.owner === "Research") {
      setLocation("/history");
    } else {
      setLocation("/");
    }
  }

  const fmtAge = (m: number) => (m < 60 ? `${m}m` : `${Math.round(m / 60)}h`);

  return (
    <WorkspaceLayout
      eyebrow={`Saved view · ${openCount.toString().padStart(2, "0")} open items`}
      title="Exceptions"
      description="A focused triage queue for policy breaches, stale evidence, and human approvals that need attention before the next decision."
    >
      <div className="exception-banner mt-5">
        <div className="exception-banner-icon">
          <AlertOctagon size={20} />
        </div>
        <div>
          <div className="font-mono text-[9px] uppercase tracking-[.16em] text-[#d96846]">
            Operator attention
          </div>
          <h2 className="mt-2 font-display text-[29px] tracking-[-.04em]">
            Resolve the edge cases.
          </h2>
          <p className="mt-1 text-[11px] leading-5 text-[#8e7970]">
            Exceptions never disappear silently. Resolve, acknowledge, or route each issue to a
            supporting workspace.
          </p>
        </div>
        <div className="ml-auto text-right">
          <div className="font-display text-[40px] text-[#e06c43]">{openCount}</div>
          <div className="font-mono text-[9px] uppercase tracking-[.12em] text-[#9c8982]">
            open now
          </div>
        </div>
      </div>

      <div className="mt-5 grid grid-cols-2 gap-3 xl:grid-cols-4">
        <div className="metric-card">
          <div className="metric-icon metric-icon-orange">
            <AlertOctagon size={16} />
          </div>
          <div className="mt-5 font-mono text-[10px] uppercase tracking-[.16em] text-[#9c8982]">
            Open exceptions
          </div>
          <div className="mt-1 font-display text-[28px]">{openCount.toString().padStart(2, "0")}</div>
          <div className="mt-2 text-[11px] text-[#e06c43]">
            {items.filter((i) => i.severity === "High" && i.status === "Open").length} high severity
          </div>
        </div>
        <div className="metric-card">
          <div className="metric-icon metric-icon-brown">
            <Clock3 size={16} />
          </div>
          <div className="mt-5 font-mono text-[10px] uppercase tracking-[.16em] text-[#9c8982]">
            Avg age
          </div>
          <div className="mt-1 font-display text-[28px]">{fmtAge(avgAgeMinutes)}</div>
          <div className="mt-2 text-[11px] text-[#8e7970]">Within response SLA</div>
        </div>
        <div className="metric-card">
          <div className="metric-icon metric-icon-green">
            <Check size={16} />
          </div>
          <div className="mt-5 font-mono text-[10px] uppercase tracking-[.16em] text-[#9c8982]">
            Resolved today
          </div>
          <div className="mt-1 font-display text-[28px]">{resolvedToday}</div>
          <div className="mt-2 text-[11px] text-[#6d846a]">+4 vs yesterday</div>
        </div>
        <div className="metric-card">
          <div className="metric-icon metric-icon-orange">
            <UserRound size={16} />
          </div>
          <div className="mt-5 font-mono text-[10px] uppercase tracking-[.16em] text-[#9c8982]">
            Owner coverage
          </div>
          <div className="mt-1 font-display text-[28px]">{ownerCoveragePct}%</div>
          <div className="mt-2 text-[11px] text-[#8e7970]">Every item assigned</div>
        </div>
      </div>

      <section className="panel mt-5">
        <div className="panel-header">
          <div>
            <div className="eyebrow">
              <ShieldAlert size={11} /> Triage queue
            </div>
            <h2 className="panel-title">
              Exception inbox{" "}
              <span className="font-mono text-[10px] font-normal text-[#9c8982]">
                / {filtered.length} shown
              </span>
            </h2>
          </div>
          <div className="flex flex-wrap gap-2">
            {["All", "Open", "High", "Medium", "Low", "Resolved", "Dismissed"].map((item) => (
              <button
                key={item}
                className={`audit-filter ${filter === item ? "audit-filter-active" : ""}`}
                onClick={() => setFilter(item)}
              >
                <Filter size={10} /> {item}
              </button>
            ))}
          </div>
        </div>

        <div className="exception-list">
          {loading && (
            <div className="px-5 py-10 text-center text-[11px] text-[#9c8982]">
              Loading exceptions…
            </div>
          )}
          {!loading &&
            filtered.map((item) => (
              <div className="exception-row" key={item.id}>
                <div
                  className={`exception-severity exception-severity-${item.severity.toLowerCase()}`}
                >
                  <AlertOctagon size={15} />
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-[9px] text-[#a18e87]">{item.id}</span>
                    <span
                      className={`impact-badge impact-badge-${item.severity === "High" ? "orange" : item.severity === "Medium" ? "gold" : "green"}`}
                    >
                      {item.severity}
                    </span>
                  </div>
                  <div className="mt-2 text-[12px] font-semibold text-[#493a32]">{item.title}</div>
                  <div className="mt-1 text-[11px] leading-4 text-[#8e7970]">{item.details}</div>
                  <div className="mt-2 flex items-center gap-3 font-mono text-[9px] text-[#a18e87]">
                    <span>{item.time}</span>
                    <span>·</span>
                    <span>{item.owner} owner</span>
                    <span>·</span>
                    <span className={item.status === "Open" ? "text-[#e06c43] font-semibold" : ""}>{item.status}</span>
                  </div>
                </div>
                <div className="ml-auto flex flex-col gap-2 sm:flex-row">
                  {item.status === "Open" && (
                    <button className="secondary-button" onClick={() => resolve(item.id)}>
                      <Check size={13} /> Resolve
                    </button>
                  )}
                  <button
                    className="secondary-button"
                    onClick={() => handleInvestigate(item)}
                  >
                    <ArrowRight size={13} /> Investigate
                  </button>
                  {item.status === "Open" && (
                    <button
                      className="icon-button icon-button-small"
                      aria-label={`Dismiss ${item.id}`}
                      title="Dismiss exception"
                      onClick={() => dismiss(item.id)}
                    >
                      <X size={14} />
                    </button>
                  )}
                </div>
              </div>
            ))}
          {!loading && !filtered.length && (
            <div className="px-5 py-10 text-center text-[11px] text-[#9c8982]">
              No exceptions match this filter.
            </div>
          )}
        </div>
      </section>
    </WorkspaceLayout>
  );
}
