import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Route, Switch, Redirect } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import { useAuth } from "./_core/hooks/useAuth";
import { Sparkles } from "lucide-react";

// Pages
import Login from "./pages/Login";
import Overview from "./pages/Overview";
import CallLogs from "./pages/CallLogs";
import Appointments from "./pages/Appointments";
import KnowledgeBase from "./pages/KnowledgeBase";
import Settings from "./pages/Settings";
import Team from "./pages/Team";
import NotFound from "./pages/NotFound";

function AuthGuard({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: "var(--color-background)" }}>
        <div className="flex flex-col items-center gap-4 animate-fade-in">
          <div
            className="flex items-center justify-center w-12 h-12 rounded-xl"
            style={{ background: "var(--color-sidebar)" }}
          >
            <Sparkles size={20} strokeWidth={1.5} style={{ color: "oklch(0.72 0.09 75)" }} />
          </div>
          <div className="flex gap-1.5">
            {[0, 1, 2].map((i) => (
              <span
                key={i}
                className="w-1.5 h-1.5 rounded-full"
                style={{
                  background: "var(--color-primary)",
                  animation: `pulse 1.2s ease-in-out ${i * 0.2}s infinite`,
                }}
              />
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Redirect to="/login" />;
  }

  return <>{children}</>;
}

function Router() {
  return (
    <Switch>
      <Route path="/login" component={Login} />
      <Route path="/">
        <Redirect to="/dashboard" />
      </Route>
      <Route path="/dashboard">
        <AuthGuard>
          <Overview />
        </AuthGuard>
      </Route>
      <Route path="/dashboard/calls">
        <AuthGuard>
          <CallLogs />
        </AuthGuard>
      </Route>
      <Route path="/dashboard/appointments">
        <AuthGuard>
          <Appointments />
        </AuthGuard>
      </Route>
      <Route path="/dashboard/knowledge">
        <AuthGuard>
          <KnowledgeBase />
        </AuthGuard>
      </Route>
      <Route path="/dashboard/settings">
        <AuthGuard>
          <Settings />
        </AuthGuard>
      </Route>
      <Route path="/dashboard/team">
        <AuthGuard>
          <Team />
        </AuthGuard>
      </Route>
      <Route path="/404" component={NotFound} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider defaultTheme="light">
        <TooltipProvider>
          <Toaster position="bottom-right" />
          <Router />
        </TooltipProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
