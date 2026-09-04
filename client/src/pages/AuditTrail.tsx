import { useEffect, useState } from "react";
import { CheckCircle2, Download, FileCheck2, Filter, Search, ShieldCheck, UserRound } from "lucide-react";
import { toast } from "sonner";
import WorkspaceLayout from "@/components/WorkspaceLayout";
import { api, AuditEvent } from "@/lib/api";

export default function AuditTrail() {
  const [filter, setFilter] = useState("All events");
  const [query, setQuery] = useState("");
  const [events, setEvents] = useState<AuditEvent[]>([]);
  const [meta, setMeta] = useState({
    eventsToday: 1284,
    integrityPct: 100,
    humanActionsCount: 18,
    retentionPolicy: "7 yrs",
  });

  useEffect(() => {
    api
      .getAuditEvents(filter, query)
      .then((res) => {
        setEvents(res.events);
        setMeta({
          eventsToday: res.eventsToday,
          integrityPct: res.integrityPct,
          humanActionsCount: res.humanActionsCount,
          retentionPolicy: res.retentionPolicy,
        });
      })
      .catch((err) => console.error("Error fetching audit trail:", err));
  }, [filter, query]);

  function handleExportCsv() {
    if (!events.length) return;
    const headers = "ID,Time,Agent,Category,Message,Hash,SignedBy,Status\n";
    const rows = events
      .map(
        (e) =>
          `"${e.id}","${e.time}","${e.agent}","${e.category}","${e.message.replace(/"/g, '""')}","${e.hash}","${e.signed_by}","${e.status}"`
      )
      .join("\n");
    const blob = new Blob([headers + rows], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `aureus_audit_trail_${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    toast.success("Audit CSV exported", { description: "Signed audit logs downloaded." });
  }

  return (
    <WorkspaceLayout
      eyebrow="Governance & traceability"
      title="Audit trail"
      description="A durable record of every signal, policy check, human decision, and execution handoff across the Aureus workspace."
    >
      <div className="mt-5 grid grid-cols-2 gap-3 xl:grid-cols-4">
        <div className="metric-card">
          <div className="metric-icon metric-icon-green"><FileCheck2 size={16} /></div>
          <div className="mt-5 font-mono text-[10px] uppercase tracking-[0.16em] text-[#9c8982]">Events today</div>
          <div className="mt-1 font-display text-[28px] tracking-[-.04em]">{meta.eventsToday.toLocaleString()}</div>
          <div className="mt-2 text-[11px] text-[#8e7970]">All streams indexed</div>
        </div>
        <div className="metric-card">
          <div className="metric-icon metric-icon-brown"><ShieldCheck size={16} /></div>
          <div className="mt-5 font-mono text-[10px] uppercase tracking-[0.16em] text-[#9c8982]">Integrity</div>
          <div className="mt-1 font-display text-[28px] tracking-[-.04em]">{meta.integrityPct}%</div>
          <div className="mt-2 text-[11px] text-[#6d846a]">SHA-256 verified chains</div>
        </div>
        <div className="metric-card">
          <div className="metric-icon metric-icon-orange"><UserRound size={16} /></div>
          <div className="mt-5 font-mono text-[10px] uppercase tracking-[0.16em] text-[#9c8982]">Human actions</div>
          <div className="mt-1 font-display text-[28px] tracking-[-.04em]">{meta.humanActionsCount}</div>
          <div className="mt-2 text-[11px] text-[#8e7970]">Operator approvals logged</div>
        </div>
        <div className="metric-card">
          <div className="metric-icon metric-icon-green"><CheckCircle2 size={16} /></div>
          <div className="mt-5 font-mono text-[10px] uppercase tracking-[0.16em] text-[#9c8982]">Retention</div>
          <div className="mt-1 font-display text-[28px] tracking-[-.04em]">{meta.retentionPolicy}</div>
          <div className="mt-2 text-[11px] text-[#8e7970]">SEC/FINRA compliant</div>
        </div>
      </div>

      <section className="panel mt-5">
        <div className="panel-header">
          <div>
            <div className="eyebrow"><FileCheck2 size={11} /> Trace log</div>
            <h2 className="panel-title">
              Decision events <span className="font-mono text-[10px] font-normal text-[#9c8982]">/ {events.length} shown</span>
            </h2>
          </div>
          <div className="flex gap-2">
            <div className="mini-search">
              <Search size={14} />
              <input
                aria-label="Search audit events"
                placeholder="Search events"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
              />
            </div>
            <button className="secondary-button" onClick={handleExportCsv}>
              <Download size={14} /> Export
            </button>
          </div>
        </div>
        <div className="audit-toolbar">
          <div className="flex items-center gap-2 text-[10px] text-[#9c8982]">
            <Filter size={13} /> Filter by agent
          </div>
          <div className="flex flex-wrap gap-2">
            {["All events", "Analyst", "Risk", "Compliance", "Strategist", "Guardrail", "Human", "System"].map((item) => (
              <button
                key={item}
                className={`audit-filter ${filter === item ? "audit-filter-active" : ""}`}
                onClick={() => setFilter(item)}
              >
                {item}
              </button>
            ))}
          </div>
        </div>
        <div className="audit-list">
          {events.map((e) => (
            <div className="audit-event" key={e.id}>
              <div className="audit-time">
                {e.time}
                <span className={`audit-dot audit-dot-${e.tone || "neutral"}`} />
              </div>
              <div className="audit-agent">{e.agent}</div>
              <div className="min-w-0">
                <div className="text-[11px] text-[#594941]">{e.message}</div>
                <div className="mt-1 font-mono text-[9px] text-[#a18e87]">
                  hash {e.hash ? `0x${e.hash.slice(0, 8)}…${e.hash.slice(-4)}` : "signed event"} · {e.signed_by}
                </div>
              </div>
              <CheckCircle2 size={14} className="ml-auto text-[#99ae92]" />
            </div>
          ))}
          {events.length === 0 && (
            <div className="px-5 py-10 text-center text-[11px] text-[#9c8982]">
              No matching audit events.
            </div>
          )}
        </div>
      </section>
    </WorkspaceLayout>
  );
}
