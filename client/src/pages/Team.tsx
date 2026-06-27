import { useState } from "react";
import { NovaLayout } from "@/components/NovaLayout";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { toast } from "sonner";
import { Users, Plus, Mail, ShieldCheck, UserX, ChevronDown } from "lucide-react";
import { useAuth } from "@/_core/hooks/useAuth";

const roleStyles = {
  admin: { bg: "oklch(0.93 0.05 75)", text: "oklch(0.42 0.08 70)" },
  staff: { bg: "oklch(0.93 0.02 60)", text: "oklch(0.45 0.04 60)" },
};

const statusStyles = {
  active: { bg: "oklch(0.93 0.06 155)", text: "oklch(0.38 0.10 155)" },
  invited: { bg: "oklch(0.93 0.05 240)", text: "oklch(0.38 0.10 240)" },
  revoked: { bg: "oklch(0.93 0.02 60)", text: "oklch(0.45 0.04 60)" },
};

export default function Team() {
  const { user } = useAuth();
  const isAdmin = user?.role === "admin";
  const [inviteOpen, setInviteOpen] = useState(false);
  const [inviteForm, setInviteForm] = useState({ email: "", name: "", role: "staff" as "admin" | "staff" });
  const utils = trpc.useUtils();

  const { data: members = [], isLoading } = trpc.team.list.useQuery();

  const invite = trpc.team.invite.useMutation({
    onSuccess: () => {
      toast.success(`Invitation sent to ${inviteForm.email}`);
      utils.team.list.invalidate();
      setInviteOpen(false);
      setInviteForm({ email: "", name: "", role: "staff" });
    },
    onError: () => toast.error("Failed to send invitation."),
  });

  const updateRole = trpc.team.updateRole.useMutation({
    onSuccess: () => { toast.success("Role updated."); utils.team.list.invalidate(); },
    onError: () => toast.error("Failed to update role."),
  });

  const revoke = trpc.team.revoke.useMutation({
    onSuccess: () => { toast.success("Access revoked."); utils.team.list.invalidate(); },
    onError: () => toast.error("Failed to revoke access."),
  });

  return (
    <NovaLayout
      title="Team"
      subtitle="Manage who has access to your Nova dashboard"
      actions={
        isAdmin && (
          <Button
            onClick={() => setInviteOpen(true)}
            className="flex items-center gap-2 text-sm"
            style={{ background: "var(--color-primary)", color: "var(--color-primary-foreground)" }}
          >
            <Plus size={15} />
            Invite Member
          </Button>
        )
      }
    >
      <div className="nova-card overflow-hidden">
        {/* Header */}
        <div
          className="grid items-center px-5 py-3 border-b text-xs uppercase tracking-widest"
          style={{
            gridTemplateColumns: "2fr 1.5fr 1fr 1fr 120px",
            borderColor: "var(--color-border)",
            color: "var(--color-muted-foreground)",
            background: "var(--color-muted)",
          }}
        >
          <span>Member</span>
          <span>Email</span>
          <span>Role</span>
          <span>Status</span>
          {isAdmin && <span>Actions</span>}
        </div>

        {isLoading ? (
          Array.from({ length: 4 }).map((_, i) => (
            <div
              key={i}
              className="grid items-center px-5 py-4 border-b animate-pulse"
              style={{ gridTemplateColumns: "2fr 1.5fr 1fr 1fr 120px", borderColor: "var(--color-border)" }}
            >
              {Array.from({ length: 4 }).map((_, j) => (
                <div key={j} className="h-4 rounded" style={{ background: "var(--color-muted)", width: "60%" }} />
              ))}
              <div />
            </div>
          ))
        ) : members.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 gap-3">
            <Users size={32} strokeWidth={1} style={{ color: "var(--color-muted-foreground)" }} />
            <p className="text-sm" style={{ color: "var(--color-muted-foreground)" }}>No team members yet. Invite your first member.</p>
          </div>
        ) : (
          members.map((member) => {
            const roleStyle = roleStyles[member.role as keyof typeof roleStyles] ?? roleStyles.staff;
            const statusStyle = statusStyles[member.status as keyof typeof statusStyles] ?? statusStyles.active;
            return (
              <div
                key={member.id}
                className="grid items-center px-5 py-4 border-b transition-colors duration-150 animate-fade-in"
                style={{ gridTemplateColumns: "2fr 1.5fr 1fr 1fr 120px", borderColor: "var(--color-border)" }}
                onMouseEnter={(e) => { (e.currentTarget as HTMLDivElement).style.background = "var(--color-muted)"; }}
                onMouseLeave={(e) => { (e.currentTarget as HTMLDivElement).style.background = "transparent"; }}
              >
                <div className="flex items-center gap-3">
                  <div
                    className="flex items-center justify-center w-8 h-8 rounded-full text-xs font-semibold flex-shrink-0"
                    style={{ background: "var(--color-accent)", color: "var(--color-accent-foreground)" }}
                  >
                    {(member.name ?? member.email).charAt(0).toUpperCase()}
                  </div>
                  <span className="text-sm font-medium" style={{ color: "var(--color-foreground)" }}>
                    {member.name ?? "—"}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <Mail size={13} style={{ color: "var(--color-muted-foreground)", flexShrink: 0 }} />
                  <span className="text-sm truncate" style={{ color: "var(--color-muted-foreground)" }}>{member.email}</span>
                </div>
                <span
                  className="inline-flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-full font-medium w-fit"
                  style={{ background: roleStyle.bg, color: roleStyle.text }}
                >
                  {member.role === "admin" && <ShieldCheck size={11} />}
                  {member.role}
                </span>
                <span
                  className="inline-block text-xs px-2.5 py-1 rounded-full font-medium w-fit"
                  style={{ background: statusStyle.bg, color: statusStyle.text }}
                >
                  {member.status}
                </span>
                {isAdmin && (
                  <div className="flex items-center gap-2">
                    <select
                      value={member.role}
                      onChange={(e) => updateRole.mutate({ memberId: member.id, role: e.target.value as "admin" | "staff" })}
                      className="text-xs px-2 py-1 rounded-lg border"
                      style={{ background: "var(--color-muted)", border: "1px solid var(--color-border)", color: "var(--color-foreground)" }}
                    >
                      <option value="staff">Staff</option>
                      <option value="admin">Admin</option>
                    </select>
                    {member.status !== "revoked" && (
                      <button
                        onClick={() => revoke.mutate({ memberId: member.id })}
                        className="p-1.5 rounded-lg transition-colors"
                        style={{ color: "oklch(0.58 0.18 25)" }}
                        title="Revoke access"
                      >
                        <UserX size={14} />
                      </button>
                    )}
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* Invite Dialog */}
      <Dialog open={inviteOpen} onOpenChange={setInviteOpen}>
        <DialogContent style={{ background: "var(--color-card)", border: "1px solid var(--color-border)" }}>
          <DialogHeader>
            <DialogTitle style={{ fontFamily: "var(--font-display)", fontWeight: 400 }}>Invite Team Member</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div>
              <label className="text-xs uppercase tracking-widest mb-1.5 block" style={{ color: "var(--color-muted-foreground)" }}>Name</label>
              <input
                value={inviteForm.name}
                onChange={(e) => setInviteForm({ ...inviteForm, name: e.target.value })}
                placeholder="Jane Smith"
                className="w-full px-3 py-2 rounded-lg text-sm border"
                style={{ background: "var(--color-muted)", border: "1px solid var(--color-border)", color: "var(--color-foreground)" }}
              />
            </div>
            <div>
              <label className="text-xs uppercase tracking-widest mb-1.5 block" style={{ color: "var(--color-muted-foreground)" }}>Email</label>
              <input
                type="email"
                value={inviteForm.email}
                onChange={(e) => setInviteForm({ ...inviteForm, email: e.target.value })}
                placeholder="jane@serenityaesthetics.com"
                className="w-full px-3 py-2 rounded-lg text-sm border"
                style={{ background: "var(--color-muted)", border: "1px solid var(--color-border)", color: "var(--color-foreground)" }}
              />
            </div>
            <div>
              <label className="text-xs uppercase tracking-widest mb-1.5 block" style={{ color: "var(--color-muted-foreground)" }}>Role</label>
              <select
                value={inviteForm.role}
                onChange={(e) => setInviteForm({ ...inviteForm, role: e.target.value as "admin" | "staff" })}
                className="w-full px-3 py-2 rounded-lg text-sm border"
                style={{ background: "var(--color-muted)", border: "1px solid var(--color-border)", color: "var(--color-foreground)" }}
              >
                <option value="staff">Staff</option>
                <option value="admin">Admin</option>
              </select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setInviteOpen(false)}>Cancel</Button>
            <Button
              onClick={() => invite.mutate(inviteForm)}
              disabled={invite.isPending || !inviteForm.email}
              style={{ background: "var(--color-primary)", color: "var(--color-primary-foreground)" }}
            >
              {invite.isPending ? "Sending..." : "Send Invitation"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </NovaLayout>
  );
}
