import { ReactNode } from "react";
import { NovaSidebar } from "./NovaSidebar";

interface NovaLayoutProps {
  children: ReactNode;
  title?: string;
  subtitle?: string;
  actions?: ReactNode;
}

export function NovaLayout({ children, title, subtitle, actions }: NovaLayoutProps) {
  return (
    <div className="flex min-h-screen" style={{ background: "var(--color-background)" }}>
      <NovaSidebar />

      {/* Main content — offset by sidebar width */}
      <main className="flex-1 ml-64 flex flex-col min-h-screen">
        {/* Page Header */}
        {title && (
          <header
            className="sticky top-0 z-30 flex items-center justify-between px-8 py-5 border-b"
            style={{
              background: "oklch(0.99 0.003 60 / 0.92)",
              backdropFilter: "blur(12px)",
              borderColor: "var(--color-border)",
            }}
          >
            <div>
              <h1
                className="text-2xl font-light"
                style={{ fontFamily: "var(--font-display)", color: "var(--color-foreground)" }}
              >
                {title}
              </h1>
              {subtitle && (
                <p className="text-sm mt-0.5" style={{ color: "var(--color-muted-foreground)" }}>
                  {subtitle}
                </p>
              )}
            </div>
            {actions && <div className="flex items-center gap-3">{actions}</div>}
          </header>
        )}

        {/* Page Body */}
        <div className="flex-1 px-8 py-7 animate-fade-in">
          {children}
        </div>
      </main>
    </div>
  );
}
