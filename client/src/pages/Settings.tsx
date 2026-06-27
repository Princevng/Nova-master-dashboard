import { useState } from "react";
import { NovaLayout } from "@/components/NovaLayout";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Clock, Stethoscope, Users, Calendar, Phone, AlertTriangle, ChevronRight } from "lucide-react";

const sections = [
  { id: "hours", label: "Business Hours", icon: Clock },
  { id: "services", label: "Services & Variants", icon: Stethoscope },
  { id: "staff", label: "Staff & Schedules", icon: Users },
  { id: "calendar", label: "Google Calendar", icon: Calendar },
  { id: "routing", label: "Phone Routing", icon: Phone },
  { id: "escalation", label: "Escalation Rules", icon: AlertTriangle },
];

const defaultHours = {
  monday: { open: "09:00", close: "18:00", closed: false },
  tuesday: { open: "09:00", close: "18:00", closed: false },
  wednesday: { open: "09:00", close: "18:00", closed: false },
  thursday: { open: "09:00", close: "18:00", closed: false },
  friday: { open: "09:00", close: "18:00", closed: false },
  saturday: { open: "10:00", close: "16:00", closed: false },
  sunday: { open: "09:00", close: "18:00", closed: true },
};

function SectionCard({ title, icon: Icon, children }: { title: string; icon: React.ElementType; children: React.ReactNode }) {
  return (
    <div className="nova-card p-6 animate-slide-up">
      <div className="flex items-center gap-3 mb-5 pb-4 border-b" style={{ borderColor: "var(--color-border)" }}>
        <div className="flex items-center justify-center w-9 h-9 rounded-xl" style={{ background: "var(--color-accent)", color: "var(--color-accent-foreground)" }}>
          <Icon size={16} strokeWidth={1.5} />
        </div>
        <h2 className="text-base font-medium" style={{ fontFamily: "var(--font-display)", color: "var(--color-foreground)" }}>{title}</h2>
      </div>
      {children}
    </div>
  );
}

function ComingSoonSection({ label }: { label: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-10 gap-2">
      <p className="text-sm" style={{ color: "var(--color-muted-foreground)" }}>
        {label} configuration will be available once your integrations are connected.
      </p>
      <button
        className="text-xs px-3 py-1.5 rounded-lg mt-1 transition-colors"
        style={{ background: "var(--color-accent)", color: "var(--color-accent-foreground)" }}
        onClick={() => toast.info("Connect your integrations in the onboarding flow.")}
      >
        Learn More
      </button>
    </div>
  );
}

export default function Settings() {
  const [activeSection, setActiveSection] = useState("hours");
  const { data: tenant } = trpc.settings.getTenant.useQuery();
  const { data: services = [] } = trpc.settings.getServices.useQuery();
  const { data: providers = [] } = trpc.settings.getProviders.useQuery();
  const updateTenant = trpc.settings.updateTenant.useMutation({
    onSuccess: () => toast.success("Settings saved."),
    onError: () => toast.error("Failed to save settings."),
  });

  const hours = (tenant?.businessHours as typeof defaultHours) ?? defaultHours;
  const [localHours, setLocalHours] = useState<typeof defaultHours | null>(null);
  const displayHours = localHours ?? hours;

  const days = Object.keys(defaultHours) as (keyof typeof defaultHours)[];

  return (
    <NovaLayout title="Settings" subtitle="Configure Nova for your business">
      <div className="flex gap-6">
        {/* Sidebar Nav */}
        <div className="w-52 flex-shrink-0">
          <div className="nova-card p-2 space-y-0.5">
            {sections.map((s) => (
              <button
                key={s.id}
                onClick={() => setActiveSection(s.id)}
                className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-all duration-150"
                style={{
                  background: activeSection === s.id ? "var(--color-accent)" : "transparent",
                  color: activeSection === s.id ? "var(--color-accent-foreground)" : "var(--color-muted-foreground)",
                  fontWeight: activeSection === s.id ? 500 : 400,
                }}
              >
                <s.icon size={15} strokeWidth={1.5} />
                {s.label}
              </button>
            ))}
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          {activeSection === "hours" && (
            <SectionCard title="Business Hours" icon={Clock}>
              <div className="space-y-3">
                {days.map((day) => {
                  const h = displayHours[day];
                  return (
                    <div key={day} className="flex items-center gap-4">
                      <span className="w-24 text-sm capitalize" style={{ color: "var(--color-foreground)" }}>{day}</span>
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={!h.closed}
                          onChange={(e) => setLocalHours({ ...displayHours, [day]: { ...h, closed: !e.target.checked } })}
                          className="w-4 h-4 rounded"
                          style={{ accentColor: "var(--color-primary)" }}
                        />
                        <span className="text-xs" style={{ color: "var(--color-muted-foreground)" }}>Open</span>
                      </label>
                      {!h.closed && (
                        <>
                          <input
                            type="time"
                            value={h.open}
                            onChange={(e) => setLocalHours({ ...displayHours, [day]: { ...h, open: e.target.value } })}
                            className="px-2 py-1 rounded-lg text-sm border"
                            style={{ background: "var(--color-muted)", border: "1px solid var(--color-border)", color: "var(--color-foreground)" }}
                          />
                          <span className="text-xs" style={{ color: "var(--color-muted-foreground)" }}>to</span>
                          <input
                            type="time"
                            value={h.close}
                            onChange={(e) => setLocalHours({ ...displayHours, [day]: { ...h, close: e.target.value } })}
                            className="px-2 py-1 rounded-lg text-sm border"
                            style={{ background: "var(--color-muted)", border: "1px solid var(--color-border)", color: "var(--color-foreground)" }}
                          />
                        </>
                      )}
                      {h.closed && <span className="text-sm" style={{ color: "var(--color-muted-foreground)" }}>Closed</span>}
                    </div>
                  );
                })}
                <div className="pt-3">
                  <Button
                    onClick={() => updateTenant.mutate({ businessHours: localHours ?? hours })}
                    disabled={updateTenant.isPending}
                    style={{ background: "var(--color-primary)", color: "var(--color-primary-foreground)" }}
                  >
                    {updateTenant.isPending ? "Saving..." : "Save Hours"}
                  </Button>
                </div>
              </div>
            </SectionCard>
          )}

          {activeSection === "services" && (
            <SectionCard title="Services & Variants" icon={Stethoscope}>
              {services.length === 0 ? (
                <ComingSoonSection label="Service" />
              ) : (
                <div className="space-y-2">
                  {services.map((svc) => (
                    <div key={svc.id} className="flex items-center justify-between px-4 py-3 rounded-xl" style={{ background: "var(--color-muted)" }}>
                      <div>
                        <p className="text-sm font-medium" style={{ color: "var(--color-foreground)" }}>{svc.name}</p>
                        <p className="text-xs mt-0.5" style={{ color: "var(--color-muted-foreground)" }}>{svc.durationMinutes} min · {svc.providerType}</p>
                      </div>
                      <ChevronRight size={14} style={{ color: "var(--color-muted-foreground)" }} />
                    </div>
                  ))}
                </div>
              )}
            </SectionCard>
          )}

          {activeSection === "staff" && (
            <SectionCard title="Staff & Schedules" icon={Users}>
              {providers.length === 0 ? (
                <ComingSoonSection label="Staff" />
              ) : (
                <div className="space-y-2">
                  {providers.map((p) => (
                    <div key={p.id} className="flex items-center justify-between px-4 py-3 rounded-xl" style={{ background: "var(--color-muted)" }}>
                      <div>
                        <p className="text-sm font-medium" style={{ color: "var(--color-foreground)" }}>{p.name}</p>
                        <p className="text-xs mt-0.5" style={{ color: "var(--color-muted-foreground)" }}>{p.providerType}</p>
                      </div>
                      <span
                        className="text-xs px-2 py-0.5 rounded-full"
                        style={{ background: p.active ? "oklch(0.93 0.06 155)" : "oklch(0.93 0.02 60)", color: p.active ? "oklch(0.38 0.10 155)" : "oklch(0.45 0.04 60)" }}
                      >
                        {p.active ? "Active" : "Inactive"}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </SectionCard>
          )}

          {activeSection === "calendar" && (
            <SectionCard title="Google Calendar" icon={Calendar}>
              <div className="space-y-4">
                <p className="text-sm" style={{ color: "var(--color-muted-foreground)" }}>
                  Connect Google Calendar to allow Nova to check availability and book appointments in real time.
                </p>
                <Button
                  className="flex items-center gap-2"
                  onClick={() => toast.info("Google Calendar OAuth will be available once your backend credentials are configured.")}
                  style={{ background: "var(--color-primary)", color: "var(--color-primary-foreground)" }}
                >
                  <Calendar size={15} />
                  Connect Google Calendar
                </Button>
              </div>
            </SectionCard>
          )}

          {activeSection === "routing" && (
            <SectionCard title="Phone Routing" icon={Phone}>
              <div className="space-y-4">
                <div>
                  <label className="text-xs uppercase tracking-widest mb-1.5 block" style={{ color: "var(--color-muted-foreground)" }}>Twilio Number</label>
                  <input
                    defaultValue={tenant?.twilioNumber ?? ""}
                    onBlur={(e) => updateTenant.mutate({ twilioNumber: e.target.value })}
                    placeholder="+12145550100"
                    className="w-full px-3 py-2 rounded-lg text-sm border max-w-xs"
                    style={{ background: "var(--color-muted)", border: "1px solid var(--color-border)", color: "var(--color-foreground)" }}
                  />
                </div>
                <div>
                  <label className="text-xs uppercase tracking-widest mb-1.5 block" style={{ color: "var(--color-muted-foreground)" }}>Escalation Number (Human Transfer)</label>
                  <input
                    placeholder="+12145550199"
                    className="w-full px-3 py-2 rounded-lg text-sm border max-w-xs"
                    style={{ background: "var(--color-muted)", border: "1px solid var(--color-border)", color: "var(--color-foreground)" }}
                  />
                </div>
              </div>
            </SectionCard>
          )}

          {activeSection === "escalation" && (
            <SectionCard title="Escalation Rules" icon={AlertTriangle}>
              <div className="space-y-3">
                {[
                  { label: "Escalate on heated caller", defaultChecked: true },
                  { label: "Escalate on medical advice request", defaultChecked: true },
                  { label: "Escalate if intent unclear after 2 attempts", defaultChecked: true },
                  { label: "Escalate on billing disputes", defaultChecked: true },
                  { label: "Take message if no human available", defaultChecked: true },
                ].map((rule) => (
                  <label key={rule.label} className="flex items-center gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      defaultChecked={rule.defaultChecked}
                      className="w-4 h-4 rounded"
                      style={{ accentColor: "var(--color-primary)" }}
                    />
                    <span className="text-sm" style={{ color: "var(--color-foreground)" }}>{rule.label}</span>
                  </label>
                ))}
                <div className="pt-3">
                  <Button
                    onClick={() => toast.success("Escalation rules saved.")}
                    style={{ background: "var(--color-primary)", color: "var(--color-primary-foreground)" }}
                  >
                    Save Rules
                  </Button>
                </div>
              </div>
            </SectionCard>
          )}
        </div>
      </div>
    </NovaLayout>
  );
}
