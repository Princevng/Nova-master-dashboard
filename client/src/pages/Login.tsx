import { getLoginUrl } from "@/const";
import { Sparkles } from "lucide-react";

export default function Login() {
  return (
    <div
      className="min-h-screen flex items-center justify-center"
      style={{ background: "var(--color-background)" }}
    >
      {/* Decorative background */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background: "radial-gradient(ellipse 60% 50% at 50% 0%, oklch(0.94 0.04 75 / 0.4) 0%, transparent 70%)",
        }}
      />

      <div className="relative flex flex-col items-center gap-8 w-full max-w-sm px-6 animate-slide-up">
        {/* Brand */}
        <div className="flex flex-col items-center gap-4">
          <div
            className="flex items-center justify-center w-16 h-16 rounded-2xl"
            style={{
              background: "var(--color-sidebar)",
              boxShadow: "0 8px 32px oklch(0.22 0.01 50 / 0.15)",
            }}
          >
            <Sparkles size={28} strokeWidth={1.5} style={{ color: "oklch(0.72 0.09 75)" }} />
          </div>
          <div className="text-center">
            <h1
              className="text-4xl font-light tracking-wide"
              style={{ fontFamily: "var(--font-display)", color: "var(--color-foreground)" }}
            >
              Nova
            </h1>
            <p className="text-sm mt-1" style={{ color: "var(--color-muted-foreground)" }}>
              AI Med Spa Receptionist
            </p>
          </div>
        </div>

        {/* Card */}
        <div
          className="w-full nova-card p-8 flex flex-col items-center gap-6"
        >
          <div className="text-center">
            <h2
              className="text-xl font-light"
              style={{ fontFamily: "var(--font-display)", color: "var(--color-foreground)" }}
            >
              Welcome back
            </h2>
            <p className="text-sm mt-1" style={{ color: "var(--color-muted-foreground)" }}>
              Sign in to access your dashboard
            </p>
          </div>

          <a
            href={getLoginUrl()}
            className="w-full flex items-center justify-center gap-3 px-6 py-3 rounded-xl text-sm font-medium transition-all duration-200"
            style={{
              background: "var(--color-sidebar)",
              color: "var(--color-sidebar-foreground)",
              boxShadow: "0 2px 8px oklch(0.22 0.01 50 / 0.15)",
            }}
            onMouseEnter={(e) => { (e.currentTarget as HTMLAnchorElement).style.opacity = "0.9"; }}
            onMouseLeave={(e) => { (e.currentTarget as HTMLAnchorElement).style.opacity = "1"; }}
          >
            <Sparkles size={16} strokeWidth={1.5} style={{ color: "oklch(0.72 0.09 75)" }} />
            Continue with Manus
          </a>

          <p className="text-xs text-center" style={{ color: "var(--color-muted-foreground)" }}>
            Secure access for authorized med spa operators only
          </p>
        </div>

        <p className="text-xs" style={{ color: "var(--color-muted-foreground)" }}>
          © {new Date().getFullYear()} Nova · Powered by Vaurelius AI
        </p>
      </div>
    </div>
  );
}
