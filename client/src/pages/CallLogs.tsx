import { useState } from "react";
import { NovaLayout } from "@/components/NovaLayout";
import { trpc } from "@/lib/trpc";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Badge } from "@/components/ui/badge";
import { Phone, Clock, ChevronRight, Mic, AlertTriangle, Moon } from "lucide-react";
import { cn } from "@/lib/utils";

type CallLog = {
  id: number;
  callerPhone: string | null;
  callerName: string | null;
  intent: string | null;
  outcome: string | null;
  durationSeconds: number | null;
  transcript: string | null;
  notes: string | null;
  isAfterHours: boolean | null;
  wasEscalated: boolean | null;
  callStart: Date;
};

function intentColor(intent: string | null) {
  switch (intent?.toLowerCase()) {
    case "booking": return "oklch(0.93 0.06 155)";
    case "reschedule": return "oklch(0.93 0.05 240)";
    case "cancellation": return "oklch(0.95 0.03 25)";
    case "faq": return "oklch(0.93 0.03 75)";
    case "medical": return "oklch(0.93 0.04 280)";
    default: return "oklch(0.93 0.01 60)";
  }
}

function intentTextColor(intent: string | null) {
  switch (intent?.toLowerCase()) {
    case "booking": return "oklch(0.38 0.10 155)";
    case "reschedule": return "oklch(0.38 0.10 240)";
    case "cancellation": return "oklch(0.50 0.12 25)";
    case "faq": return "oklch(0.45 0.06 70)";
    case "medical": return "oklch(0.42 0.10 280)";
    default: return "oklch(0.45 0.02 60)";
  }
}

function outcomeColor(outcome: string | null) {
  if (!outcome) return "oklch(0.93 0.01 60)";
  if (outcome.toLowerCase().includes("booked")) return "oklch(0.93 0.06 155)";
  if (outcome.toLowerCase().includes("escalat")) return "oklch(0.95 0.03 25)";
  if (outcome.toLowerCase().includes("answer")) return "oklch(0.93 0.03 75)";
  return "oklch(0.93 0.01 60)";
}

function formatDuration(secs: number | null) {
  if (!secs) return "—";
  const m = Math.floor(secs / 60);
  const s = secs % 60;
  return `${m}:${s.toString().padStart(2, "0")}`;
}

function formatTime(date: Date) {
  return new Date(date).toLocaleString("en-US", {
    month: "short", day: "numeric", hour: "numeric", minute: "2-digit", hour12: true,
  });
}

function TranscriptDrawer({ log, open, onClose }: { log: CallLog | null; open: boolean; onClose: () => void }) {
  if (!log) return null;
  return (
    <Sheet open={open} onOpenChange={onClose}>
      <SheetContent
        className="w-full sm:max-w-lg overflow-y-auto"
        style={{ background: "var(--color-card)", borderLeft: "1px solid var(--color-border)" }}
      >
        <SheetHeader className="pb-5 border-b" style={{ borderColor: "var(--color-border)" }}>
          <SheetTitle style={{ fontFamily: "var(--font-display)", fontWeight: 400, fontSize: "1.25rem" }}>
            Call Transcript
          </SheetTitle>
          <div className="flex items-center gap-2 mt-1 flex-wrap">
            <span className="text-sm" style={{ color: "var(--color-muted-foreground)" }}>
              {log.callerName ?? log.callerPhone ?? "Unknown Caller"}
            </span>
            <span className="text-xs" style={{ color: "var(--color-muted-foreground)" }}>·</span>
            <span className="text-xs" style={{ color: "var(--color-muted-foreground)" }}>
              {formatTime(log.callStart)}
            </span>
            {log.isAfterHours && (
              <span className="flex items-center gap-1 text-xs px-2 py-0.5 rounded-full" style={{ background: "oklch(0.93 0.04 260)", color: "oklch(0.42 0.10 260)" }}>
                <Moon size={10} /> After Hours
              </span>
            )}
            {log.wasEscalated && (
              <span className="flex items-center gap-1 text-xs px-2 py-0.5 rounded-full" style={{ background: "oklch(0.95 0.03 25)", color: "oklch(0.50 0.12 25)" }}>
                <AlertTriangle size={10} /> Escalated
              </span>
            )}
          </div>
        </SheetHeader>

        <div className="mt-5 space-y-4">
          {/* Meta */}
          <div className="grid grid-cols-2 gap-3">
            {[
              { label: "Intent", value: log.intent ?? "—" },
              { label: "Outcome", value: log.outcome ?? "—" },
              { label: "Duration", value: formatDuration(log.durationSeconds) },
              { label: "Phone", value: log.callerPhone ?? "—" },
            ].map((item) => (
              <div key={item.label} className="nova-card p-3">
                <p className="text-xs uppercase tracking-widest mb-1" style={{ color: "var(--color-muted-foreground)" }}>{item.label}</p>
                <p className="text-sm font-medium" style={{ color: "var(--color-foreground)" }}>{item.value}</p>
              </div>
            ))}
          </div>

          {/* Notes */}
          {log.notes && (
            <div>
              <p className="text-xs uppercase tracking-widest mb-2" style={{ color: "var(--color-muted-foreground)" }}>Notes</p>
              <p className="text-sm leading-relaxed" style={{ color: "var(--color-foreground)" }}>{log.notes}</p>
            </div>
          )}

          {/* Transcript */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <Mic size={13} style={{ color: "var(--color-muted-foreground)" }} />
              <p className="text-xs uppercase tracking-widest" style={{ color: "var(--color-muted-foreground)" }}>Full Transcript</p>
            </div>
            <div
              className="rounded-xl p-4 text-sm leading-relaxed whitespace-pre-wrap"
              style={{ background: "var(--color-muted)", color: "var(--color-foreground)", fontFamily: "monospace", fontSize: "0.8rem" }}
            >
              {log.transcript ?? "No transcript available for this call."}
            </div>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}

export default function CallLogs() {
  const [selectedLog, setSelectedLog] = useState<CallLog | null>(null);
  const { data: logs = [], isLoading } = trpc.callLogs.list.useQuery({ limit: 50, offset: 0 });

  return (
    <NovaLayout title="Call Logs" subtitle="Every conversation Nova has handled">
      <div className="nova-card overflow-hidden">
        {/* Table Header */}
        <div
          className="grid items-center px-5 py-3 border-b text-xs uppercase tracking-widest"
          style={{
            gridTemplateColumns: "1.5fr 1fr 1fr 1fr 0.7fr 2fr 40px",
            borderColor: "var(--color-border)",
            color: "var(--color-muted-foreground)",
            background: "var(--color-muted)",
          }}
        >
          <span>Timestamp</span>
          <span>Caller</span>
          <span>Intent</span>
          <span>Outcome</span>
          <span>Duration</span>
          <span>Notes</span>
          <span />
        </div>

        {/* Rows */}
        {isLoading ? (
          Array.from({ length: 8 }).map((_, i) => (
            <div
              key={i}
              className="grid items-center px-5 py-4 border-b animate-pulse"
              style={{ gridTemplateColumns: "1.5fr 1fr 1fr 1fr 0.7fr 2fr 40px", borderColor: "var(--color-border)" }}
            >
              {Array.from({ length: 6 }).map((_, j) => (
                <div key={j} className="h-4 rounded" style={{ background: "var(--color-muted)", width: "70%" }} />
              ))}
              <div />
            </div>
          ))
        ) : logs.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 gap-3">
            <Phone size={32} strokeWidth={1} style={{ color: "var(--color-muted-foreground)" }} />
            <p className="text-sm" style={{ color: "var(--color-muted-foreground)" }}>No calls yet. Nova is ready and listening.</p>
          </div>
        ) : (
          logs.map((log, i) => (
            <div
              key={log.id}
              className={cn(
                "grid items-center px-5 py-4 border-b cursor-pointer transition-colors duration-150",
                i === 0 ? "animate-new-row" : ""
              )}
              style={{
                gridTemplateColumns: "1.5fr 1fr 1fr 1fr 0.7fr 2fr 40px",
                borderColor: "var(--color-border)",
              }}
              onClick={() => setSelectedLog(log as CallLog)}
              onMouseEnter={(e) => { (e.currentTarget as HTMLDivElement).style.background = "var(--color-muted)"; }}
              onMouseLeave={(e) => { (e.currentTarget as HTMLDivElement).style.background = "transparent"; }}
            >
              <div className="flex items-center gap-2">
                {log.isAfterHours && <Moon size={12} style={{ color: "oklch(0.55 0.08 260)", flexShrink: 0 }} />}
                <span className="text-sm" style={{ color: "var(--color-foreground)" }}>
                  {formatTime(log.callStart)}
                </span>
              </div>
              <span className="text-sm" style={{ color: "var(--color-foreground)" }}>
                {log.callerName ?? log.callerPhone ?? "Unknown"}
              </span>
              <span>
                <span
                  className="inline-block text-xs px-2.5 py-1 rounded-full font-medium"
                  style={{ background: intentColor(log.intent), color: intentTextColor(log.intent) }}
                >
                  {log.intent ?? "—"}
                </span>
              </span>
              <span>
                <span
                  className="inline-block text-xs px-2.5 py-1 rounded-full font-medium"
                  style={{ background: outcomeColor(log.outcome), color: "var(--color-foreground)" }}
                >
                  {log.outcome ?? "—"}
                </span>
              </span>
              <div className="flex items-center gap-1.5 text-sm" style={{ color: "var(--color-muted-foreground)" }}>
                <Clock size={12} />
                {formatDuration(log.durationSeconds)}
              </div>
              <span className="text-sm truncate pr-2" style={{ color: "var(--color-muted-foreground)" }}>
                {log.notes ?? log.transcript?.slice(0, 60) ?? "—"}
              </span>
              <ChevronRight size={14} style={{ color: "var(--color-muted-foreground)" }} />
            </div>
          ))
        )}
      </div>

      <TranscriptDrawer
        log={selectedLog}
        open={!!selectedLog}
        onClose={() => setSelectedLog(null)}
      />
    </NovaLayout>
  );
}
