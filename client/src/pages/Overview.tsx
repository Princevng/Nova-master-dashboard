import { NovaLayout } from "@/components/NovaLayout";
import { trpc } from "@/lib/trpc";
import { Phone, CalendarDays, Moon, ShieldCheck, TrendingUp, PhoneMissed } from "lucide-react";
import { ResponsiveContainer, AreaChart, Area, Tooltip } from "recharts";

function SparkCard({
  label,
  value,
  icon: Icon,
  color,
  data,
  dataKey,
}: {
  label: string;
  value: number;
  icon: React.ElementType;
  color: string;
  data: { date: string; calls: number; booked: number }[];
  dataKey: "calls" | "booked";
}) {
  return (
    <div className="nova-card p-5 flex flex-col gap-4 animate-slide-up">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs font-medium uppercase tracking-widest" style={{ color: "var(--color-muted-foreground)" }}>
            {label}
          </p>
          <p
            className="text-3xl font-light mt-1"
            style={{ fontFamily: "var(--font-display)", color: "var(--color-foreground)" }}
          >
            {value.toLocaleString()}
          </p>
        </div>
        <div
          className="flex items-center justify-center w-10 h-10 rounded-xl"
          style={{ background: color + "20", color }}
        >
          <Icon size={18} strokeWidth={1.5} />
        </div>
      </div>
      <div className="h-12 -mx-1">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} margin={{ top: 2, right: 2, bottom: 2, left: 2 }}>
            <defs>
              <linearGradient id={`grad-${label}`} x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor={color} stopOpacity={0.25} />
                <stop offset="95%" stopColor={color} stopOpacity={0} />
              </linearGradient>
            </defs>
            <Tooltip
              contentStyle={{
                background: "var(--color-card)",
                border: "1px solid var(--color-border)",
                borderRadius: "8px",
                fontSize: "11px",
                padding: "4px 8px",
                boxShadow: "var(--shadow-card)",
              }}
              itemStyle={{ color: "var(--color-foreground)" }}
              labelFormatter={() => ""}
            />
            <Area
              type="monotone"
              dataKey={dataKey}
              stroke={color}
              strokeWidth={1.5}
              fill={`url(#grad-${label})`}
              dot={false}
              activeDot={{ r: 3, fill: color, strokeWidth: 0 }}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

function SkeletonCard() {
  return (
    <div className="nova-card p-5 animate-pulse">
      <div className="flex items-start justify-between mb-4">
        <div>
          <div className="h-3 w-24 rounded" style={{ background: "var(--color-muted)" }} />
          <div className="h-8 w-16 rounded mt-2" style={{ background: "var(--color-muted)" }} />
        </div>
        <div className="w-10 h-10 rounded-xl" style={{ background: "var(--color-muted)" }} />
      </div>
      <div className="h-12 rounded" style={{ background: "var(--color-muted)" }} />
    </div>
  );
}

export default function Overview() {
  const { data, isLoading } = trpc.metrics.getOverview.useQuery();

  const sparkline = data?.sparkline ?? [];

  const cards = [
    {
      label: "Total Calls Today",
      value: data?.today.totalCalls ?? 0,
      icon: Phone,
      color: "oklch(0.62 0.08 75)",
      dataKey: "calls" as const,
    },
    {
      label: "Total Calls This Week",
      value: data?.week.totalCalls ?? 0,
      icon: TrendingUp,
      color: "oklch(0.58 0.12 240)",
      dataKey: "calls" as const,
    },
    {
      label: "Total Calls This Month",
      value: data?.month.totalCalls ?? 0,
      icon: Phone,
      color: "oklch(0.55 0.10 280)",
      dataKey: "calls" as const,
    },
    {
      label: "After-Hours Calls",
      value: data?.today.afterHoursCalls ?? 0,
      icon: Moon,
      color: "oklch(0.52 0.10 260)",
      dataKey: "calls" as const,
    },
    {
      label: "Missed Calls Prevented",
      value: data?.today.missedCallsPrevented ?? 0,
      icon: PhoneMissed,
      color: "oklch(0.58 0.12 155)",
      dataKey: "calls" as const,
    },
    {
      label: "Appointments Booked",
      value: data?.month.appointmentsBooked ?? 0,
      icon: CalendarDays,
      color: "oklch(0.62 0.10 50)",
      dataKey: "booked" as const,
    },
  ];

  return (
    <NovaLayout
      title="Overview"
      subtitle="Your AI receptionist performance at a glance"
    >
      {/* Nova Status Banner */}
      <div
        className="flex items-center gap-3 px-5 py-3 rounded-xl mb-7 border"
        style={{
          background: "oklch(0.97 0.03 75 / 0.5)",
          borderColor: "oklch(0.85 0.05 75)",
        }}
      >
        <div className="flex items-center gap-2">
          <span
            className="inline-block w-2 h-2 rounded-full"
            style={{ background: "oklch(0.58 0.12 155)", boxShadow: "0 0 6px oklch(0.58 0.12 155)" }}
          />
          <span className="text-sm font-medium" style={{ color: "oklch(0.45 0.06 70)" }}>
            Nova is Active
          </span>
        </div>
        <span className="text-sm" style={{ color: "oklch(0.55 0.04 70)" }}>
          · Serenity Aesthetics & Wellness · +1 (214) 555-0100
        </span>
        <div className="ml-auto flex items-center gap-1.5">
          <ShieldCheck size={14} style={{ color: "oklch(0.58 0.12 155)" }} />
          <span className="text-xs" style={{ color: "oklch(0.55 0.04 70)" }}>All systems operational</span>
        </div>
      </div>

      {/* KPI Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-5">
        {isLoading
          ? Array.from({ length: 6 }).map((_, i) => <SkeletonCard key={i} />)
          : cards.map((card, i) => (
              <div key={card.label} style={{ animationDelay: `${i * 60}ms` }}>
                <SparkCard {...card} data={sparkline} />
              </div>
            ))}
      </div>

      {/* Recent Activity Summary */}
      {!isLoading && (
        <div className="mt-8 nova-card p-6 animate-slide-up" style={{ animationDelay: "360ms" }}>
          <h2
            className="text-lg font-light mb-4"
            style={{ fontFamily: "var(--font-display)", color: "var(--color-foreground)" }}
          >
            14-Day Trend
          </h2>
          <div className="h-40">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={sparkline} margin={{ top: 4, right: 4, bottom: 4, left: 4 }}>
                <defs>
                  <linearGradient id="grad-trend-calls" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="oklch(0.62 0.08 75)" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="oklch(0.62 0.08 75)" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="grad-trend-booked" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="oklch(0.58 0.12 155)" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="oklch(0.58 0.12 155)" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <Tooltip
                  contentStyle={{
                    background: "var(--color-card)",
                    border: "1px solid var(--color-border)",
                    borderRadius: "8px",
                    fontSize: "12px",
                    padding: "6px 10px",
                    boxShadow: "var(--shadow-card)",
                  }}
                />
                <Area type="monotone" dataKey="calls" name="Total Calls" stroke="oklch(0.62 0.08 75)" strokeWidth={2} fill="url(#grad-trend-calls)" dot={false} />
                <Area type="monotone" dataKey="booked" name="Booked" stroke="oklch(0.58 0.12 155)" strokeWidth={2} fill="url(#grad-trend-booked)" dot={false} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}
    </NovaLayout>
  );
}
