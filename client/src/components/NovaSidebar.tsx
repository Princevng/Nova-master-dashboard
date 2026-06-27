import { Link, useLocation } from "wouter";
import {
  LayoutDashboard,
  Phone,
  CalendarDays,
  BookOpen,
  Settings,
  Users,
  Sparkles,
  LogOut,
  ChevronRight,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";

const navItems = [
  { label: "Overview", icon: LayoutDashboard, href: "/dashboard" },
  { label: "Call Logs", icon: Phone, href: "/dashboard/calls" },
  { label: "Appointments", icon: CalendarDays, href: "/dashboard/appointments" },
  { label: "Knowledge Base", icon: BookOpen, href: "/dashboard/knowledge" },
  { label: "Settings", icon: Settings, href: "/dashboard/settings" },
  { label: "Team", icon: Users, href: "/dashboard/team" },
];

export function NovaSidebar() {
  const [location] = useLocation();
  const { user } = useAuth();
  const logout = trpc.auth.logout.useMutation({
    onSuccess: () => { window.location.href = "/"; },
  });

  return (
    <aside
      className="fixed inset-y-0 left-0 z-40 flex flex-col w-64"
      style={{
        background: "var(--color-sidebar)",
        boxShadow: "var(--shadow-sidebar)",
      }}
    >
      {/* Brand */}
      <div className="flex items-center gap-3 px-6 py-7 border-b" style={{ borderColor: "var(--color-sidebar-border)" }}>
        <div
          className="flex items-center justify-center w-9 h-9 rounded-xl"
          style={{ background: "var(--color-sidebar-primary)", color: "var(--color-sidebar-primary-foreground)" }}
        >
          <Sparkles size={18} strokeWidth={1.5} />
        </div>
        <div>
          <p className="text-base font-semibold tracking-wide" style={{ fontFamily: "var(--font-display)", color: "var(--color-sidebar-foreground)" }}>
            Nova
          </p>
          <p className="text-xs" style={{ color: "oklch(0.65 0.02 60)" }}>AI Receptionist</p>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-5 space-y-1 overflow-y-auto">
        {navItems.map((item) => {
          const isActive = location === item.href || (item.href !== "/dashboard" && location.startsWith(item.href));
          return (
            <Link key={item.href} href={item.href}>
              <div
                className={cn(
                  "flex items-center gap-3 px-3 py-2.5 rounded-lg cursor-pointer transition-all duration-150 group",
                  isActive
                    ? "text-sm font-medium"
                    : "text-sm"
                )}
                style={{
                  background: isActive ? "var(--color-sidebar-accent)" : "transparent",
                  color: isActive ? "var(--color-sidebar-accent-foreground)" : "oklch(0.72 0.02 60)",
                }}
                onMouseEnter={(e) => {
                  if (!isActive) {
                    (e.currentTarget as HTMLDivElement).style.background = "oklch(0.25 0.015 50)";
                    (e.currentTarget as HTMLDivElement).style.color = "var(--color-sidebar-foreground)";
                  }
                }}
                onMouseLeave={(e) => {
                  if (!isActive) {
                    (e.currentTarget as HTMLDivElement).style.background = "transparent";
                    (e.currentTarget as HTMLDivElement).style.color = "oklch(0.72 0.02 60)";
                  }
                }}
              >
                <item.icon size={17} strokeWidth={isActive ? 2 : 1.5} />
                <span>{item.label}</span>
                {isActive && (
                  <ChevronRight size={14} className="ml-auto opacity-60" />
                )}
              </div>
            </Link>
          );
        })}
      </nav>

      {/* User Footer */}
      <div className="px-3 pb-5 border-t pt-4" style={{ borderColor: "var(--color-sidebar-border)" }}>
        <div className="flex items-center gap-3 px-3 py-2.5 rounded-lg">
          <div
            className="flex items-center justify-center w-8 h-8 rounded-full text-xs font-semibold flex-shrink-0"
            style={{ background: "var(--color-sidebar-primary)", color: "var(--color-sidebar-primary-foreground)" }}
          >
            {user?.name?.charAt(0)?.toUpperCase() ?? "U"}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-medium truncate" style={{ color: "var(--color-sidebar-foreground)" }}>
              {user?.name ?? "User"}
            </p>
            <p className="text-xs truncate" style={{ color: "oklch(0.55 0.02 60)" }}>
              {user?.email ?? ""}
            </p>
          </div>
          <button
            onClick={() => logout.mutate()}
            className="p-1.5 rounded-md transition-colors"
            style={{ color: "oklch(0.55 0.02 60)" }}
            onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.color = "var(--color-sidebar-foreground)"; }}
            onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.color = "oklch(0.55 0.02 60)"; }}
            title="Sign out"
          >
            <LogOut size={15} strokeWidth={1.5} />
          </button>
        </div>
      </div>
    </aside>
  );
}
