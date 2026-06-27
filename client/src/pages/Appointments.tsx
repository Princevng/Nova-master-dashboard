import { useState } from "react";
import { NovaLayout } from "@/components/NovaLayout";
import { trpc } from "@/lib/trpc";
import { CalendarDays, User, Stethoscope } from "lucide-react";

type Status = "all" | "booked" | "rescheduled" | "cancelled" | "no_show";

const tabs: { label: string; value: Status }[] = [
  { label: "All", value: "all" },
  { label: "Booked", value: "booked" },
  { label: "Rescheduled", value: "rescheduled" },
  { label: "Cancelled", value: "cancelled" },
  { label: "No-Show", value: "no_show" },
];

const statusStyles: Record<string, { bg: string; text: string; label: string }> = {
  booked: { bg: "oklch(0.93 0.06 155)", text: "oklch(0.38 0.10 155)", label: "Booked" },
  rescheduled: { bg: "oklch(0.93 0.05 240)", text: "oklch(0.38 0.10 240)", label: "Rescheduled" },
  cancelled: { bg: "oklch(0.95 0.03 25)", text: "oklch(0.50 0.12 25)", label: "Cancelled" },
  no_show: { bg: "oklch(0.93 0.02 60)", text: "oklch(0.45 0.04 60)", label: "No-Show" },
};

function formatDateTime(date: Date) {
  return new Date(date).toLocaleString("en-US", {
    weekday: "short", month: "short", day: "numeric",
    hour: "numeric", minute: "2-digit", hour12: true,
  });
}

export default function Appointments() {
  const [activeTab, setActiveTab] = useState<Status>("all");
  const { data: appts = [], isLoading } = trpc.appointments.list.useQuery({ status: activeTab });

  return (
    <NovaLayout title="Appointments" subtitle="All bookings managed by Nova">
      {/* Tabs */}
      <div className="flex gap-1 p-1 rounded-xl mb-6 w-fit" style={{ background: "var(--color-muted)" }}>
        {tabs.map((tab) => (
          <button
            key={tab.value}
            onClick={() => setActiveTab(tab.value)}
            className="px-4 py-2 rounded-lg text-sm font-medium transition-all duration-150"
            style={{
              background: activeTab === tab.value ? "var(--color-card)" : "transparent",
              color: activeTab === tab.value ? "var(--color-foreground)" : "var(--color-muted-foreground)",
              boxShadow: activeTab === tab.value ? "var(--shadow-card)" : "none",
            }}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Table */}
      <div className="nova-card overflow-hidden">
        <div
          className="grid items-center px-5 py-3 border-b text-xs uppercase tracking-widest"
          style={{
            gridTemplateColumns: "1.8fr 1.2fr 1.2fr 1.2fr 1fr",
            borderColor: "var(--color-border)",
            color: "var(--color-muted-foreground)",
            background: "var(--color-muted)",
          }}
        >
          <span>Date & Time</span>
          <span>Client</span>
          <span>Service</span>
          <span>Provider</span>
          <span>Status</span>
        </div>

        {isLoading ? (
          Array.from({ length: 6 }).map((_, i) => (
            <div
              key={i}
              className="grid items-center px-5 py-4 border-b animate-pulse"
              style={{ gridTemplateColumns: "1.8fr 1.2fr 1.2fr 1.2fr 1fr", borderColor: "var(--color-border)" }}
            >
              {Array.from({ length: 5 }).map((_, j) => (
                <div key={j} className="h-4 rounded" style={{ background: "var(--color-muted)", width: "65%" }} />
              ))}
            </div>
          ))
        ) : appts.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 gap-3">
            <CalendarDays size={32} strokeWidth={1} style={{ color: "var(--color-muted-foreground)" }} />
            <p className="text-sm" style={{ color: "var(--color-muted-foreground)" }}>No appointments found for this filter.</p>
          </div>
        ) : (
          appts.map((appt) => {
            const style = statusStyles[appt.status] ?? statusStyles.booked;
            return (
              <div
                key={appt.id}
                className="grid items-center px-5 py-4 border-b transition-colors duration-150 animate-fade-in"
                style={{ gridTemplateColumns: "1.8fr 1.2fr 1.2fr 1.2fr 1fr", borderColor: "var(--color-border)" }}
                onMouseEnter={(e) => { (e.currentTarget as HTMLDivElement).style.background = "var(--color-muted)"; }}
                onMouseLeave={(e) => { (e.currentTarget as HTMLDivElement).style.background = "transparent"; }}
              >
                <div className="flex items-center gap-2">
                  <CalendarDays size={13} style={{ color: "var(--color-muted-foreground)", flexShrink: 0 }} />
                  <span className="text-sm" style={{ color: "var(--color-foreground)" }}>
                    {formatDateTime(appt.startTime)}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <User size={13} style={{ color: "var(--color-muted-foreground)", flexShrink: 0 }} />
                  <span className="text-sm truncate" style={{ color: "var(--color-foreground)" }}>
                    {appt.clientName ?? appt.clientPhone ?? "—"}
                  </span>
                </div>
                <span className="text-sm truncate" style={{ color: "var(--color-foreground)" }}>
                  {appt.serviceName ?? "—"}
                </span>
                <div className="flex items-center gap-2">
                  <Stethoscope size={13} style={{ color: "var(--color-muted-foreground)", flexShrink: 0 }} />
                  <span className="text-sm truncate" style={{ color: "var(--color-foreground)" }}>
                    {appt.providerName ?? "—"}
                  </span>
                </div>
                <span
                  className="inline-block text-xs px-2.5 py-1 rounded-full font-medium w-fit"
                  style={{ background: style.bg, color: style.text }}
                >
                  {style.label}
                </span>
              </div>
            );
          })
        )}
      </div>
    </NovaLayout>
  );
}
