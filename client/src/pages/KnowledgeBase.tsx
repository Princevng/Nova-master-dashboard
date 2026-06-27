import { useState } from "react";
import { NovaLayout } from "@/components/NovaLayout";
import { trpc } from "@/lib/trpc";
import { BookOpen, Plus, Pencil, Trash2, CheckCircle, Clock, AlertCircle, Upload, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { toast } from "sonner";

type KBType = "faq" | "policy" | "medical" | "document" | "all";

const tabs: { label: string; value: KBType }[] = [
  { label: "All", value: "all" },
  { label: "FAQs", value: "faq" },
  { label: "Policies", value: "policy" },
  { label: "Medical", value: "medical" },
  { label: "Documents", value: "document" },
];

const typeStyles: Record<string, { bg: string; text: string }> = {
  faq: { bg: "oklch(0.93 0.03 75)", text: "oklch(0.45 0.06 70)" },
  policy: { bg: "oklch(0.93 0.05 240)", text: "oklch(0.38 0.10 240)" },
  medical: { bg: "oklch(0.93 0.04 280)", text: "oklch(0.42 0.10 280)" },
  document: { bg: "oklch(0.93 0.02 60)", text: "oklch(0.45 0.04 60)" },
};

const embeddingIcons = {
  pending: <Clock size={13} style={{ color: "oklch(0.62 0.08 75)" }} />,
  processing: <Clock size={13} style={{ color: "oklch(0.58 0.12 240)" }} />,
  complete: <CheckCircle size={13} style={{ color: "oklch(0.58 0.12 155)" }} />,
  failed: <AlertCircle size={13} style={{ color: "oklch(0.58 0.18 25)" }} />,
};

export default function KnowledgeBase() {
  const [activeTab, setActiveTab] = useState<KBType>("all");
  const [editEntry, setEditEntry] = useState<{ id?: number; type: "faq" | "policy" | "medical" | "document"; question: string; content: string } | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const utils = trpc.useUtils();

  const { data: entries = [], isLoading } = trpc.knowledge.list.useQuery({ type: activeTab });

  const upsert = trpc.knowledge.upsert.useMutation({
    onSuccess: () => {
      toast.success("Entry saved successfully.");
      utils.knowledge.list.invalidate();
      setIsDialogOpen(false);
      setEditEntry(null);
    },
    onError: () => toast.error("Failed to save entry."),
  });

  const del = trpc.knowledge.delete.useMutation({
    onSuccess: () => {
      toast.success("Entry deleted.");
      utils.knowledge.list.invalidate();
    },
    onError: () => toast.error("Failed to delete entry."),
  });

  function openNew() {
    setEditEntry({ type: "faq", question: "", content: "" });
    setIsDialogOpen(true);
  }

  function openEdit(entry: typeof entries[0]) {
    setEditEntry({
      id: entry.id,
      type: entry.type,
      question: entry.question ?? "",
      content: entry.content,
    });
    setIsDialogOpen(true);
  }

  function handleSave() {
    if (!editEntry) return;
    upsert.mutate({
      id: editEntry.id,
      type: editEntry.type,
      question: editEntry.question || undefined,
      content: editEntry.content,
    });
  }

  return (
    <NovaLayout
      title="Knowledge Base"
      subtitle="Manage what Nova knows about your business"
      actions={
        <Button
          onClick={openNew}
          className="flex items-center gap-2 text-sm"
          style={{ background: "var(--color-primary)", color: "var(--color-primary-foreground)" }}
        >
          <Plus size={15} />
          Add Entry
        </Button>
      }
    >
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

      {/* Document Upload Banner */}
      <div
        className="flex items-center gap-4 px-5 py-4 rounded-xl mb-6 border border-dashed cursor-pointer transition-colors duration-150"
        style={{ borderColor: "var(--color-border)", background: "var(--color-muted)" }}
        onClick={() => toast.info("Document upload will be available once your Supabase storage is connected.")}
      >
        <div className="flex items-center justify-center w-10 h-10 rounded-xl" style={{ background: "var(--color-accent)", color: "var(--color-accent-foreground)" }}>
          <Upload size={18} strokeWidth={1.5} />
        </div>
        <div>
          <p className="text-sm font-medium" style={{ color: "var(--color-foreground)" }}>Upload Documents for Vector Embeddings</p>
          <p className="text-xs mt-0.5" style={{ color: "var(--color-muted-foreground)" }}>
            Drop PDFs or click to upload — Nova will use them to answer client questions
          </p>
        </div>
      </div>

      {/* Entries */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="nova-card p-5 animate-pulse">
              <div className="h-3 w-16 rounded mb-3" style={{ background: "var(--color-muted)" }} />
              <div className="h-4 w-3/4 rounded mb-2" style={{ background: "var(--color-muted)" }} />
              <div className="h-3 w-full rounded" style={{ background: "var(--color-muted)" }} />
            </div>
          ))}
        </div>
      ) : entries.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 gap-3">
          <BookOpen size={32} strokeWidth={1} style={{ color: "var(--color-muted-foreground)" }} />
          <p className="text-sm" style={{ color: "var(--color-muted-foreground)" }}>No entries yet. Add your first FAQ or policy.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {entries.map((entry) => {
            const style = typeStyles[entry.type] ?? typeStyles.faq;
            const embeddingIcon = embeddingIcons[entry.embeddingStatus ?? "pending"];
            return (
              <div key={entry.id} className="nova-card p-5 flex flex-col gap-3 animate-slide-up group">
                <div className="flex items-center justify-between">
                  <span className="text-xs px-2.5 py-1 rounded-full font-medium" style={{ background: style.bg, color: style.text }}>
                    {entry.type.toUpperCase()}
                  </span>
                  <div className="flex items-center gap-2">
                    <div className="flex items-center gap-1 text-xs" style={{ color: "var(--color-muted-foreground)" }}>
                      {embeddingIcon}
                      <span>{entry.embeddingStatus ?? "pending"}</span>
                    </div>
                    <button
                      onClick={() => openEdit(entry)}
                      className="p-1.5 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity"
                      style={{ color: "var(--color-muted-foreground)" }}
                    >
                      <Pencil size={13} />
                    </button>
                    <button
                      onClick={() => del.mutate({ id: entry.id })}
                      className="p-1.5 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity"
                      style={{ color: "oklch(0.58 0.18 25)" }}
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                </div>
                {entry.question && (
                  <p className="text-sm font-medium" style={{ color: "var(--color-foreground)" }}>{entry.question}</p>
                )}
                <p className="text-sm leading-relaxed line-clamp-3" style={{ color: "var(--color-muted-foreground)" }}>
                  {entry.content}
                </p>
              </div>
            );
          })}
        </div>
      )}

      {/* Edit/Create Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={(v) => { setIsDialogOpen(v); if (!v) setEditEntry(null); }}>
        <DialogContent style={{ background: "var(--color-card)", border: "1px solid var(--color-border)" }}>
          <DialogHeader>
            <DialogTitle style={{ fontFamily: "var(--font-display)", fontWeight: 400 }}>
              {editEntry?.id ? "Edit Entry" : "New Knowledge Entry"}
            </DialogTitle>
          </DialogHeader>
          {editEntry && (
            <div className="space-y-4 py-2">
              <div>
                <label className="text-xs uppercase tracking-widest mb-1.5 block" style={{ color: "var(--color-muted-foreground)" }}>Type</label>
                <select
                  value={editEntry.type}
                  onChange={(e) => setEditEntry({ ...editEntry, type: e.target.value as typeof editEntry.type })}
                  className="w-full px-3 py-2 rounded-lg text-sm border"
                  style={{ background: "var(--color-muted)", border: "1px solid var(--color-border)", color: "var(--color-foreground)" }}
                >
                  <option value="faq">FAQ</option>
                  <option value="policy">Policy</option>
                  <option value="medical">Medical</option>
                  <option value="document">Document</option>
                </select>
              </div>
              <div>
                <label className="text-xs uppercase tracking-widest mb-1.5 block" style={{ color: "var(--color-muted-foreground)" }}>Question (optional)</label>
                <input
                  value={editEntry.question}
                  onChange={(e) => setEditEntry({ ...editEntry, question: e.target.value })}
                  placeholder="e.g. What is your cancellation policy?"
                  className="w-full px-3 py-2 rounded-lg text-sm border"
                  style={{ background: "var(--color-muted)", border: "1px solid var(--color-border)", color: "var(--color-foreground)" }}
                />
              </div>
              <div>
                <label className="text-xs uppercase tracking-widest mb-1.5 block" style={{ color: "var(--color-muted-foreground)" }}>Content</label>
                <textarea
                  value={editEntry.content}
                  onChange={(e) => setEditEntry({ ...editEntry, content: e.target.value })}
                  rows={5}
                  placeholder="Enter the full answer or content..."
                  className="w-full px-3 py-2 rounded-lg text-sm border resize-none"
                  style={{ background: "var(--color-muted)", border: "1px solid var(--color-border)", color: "var(--color-foreground)" }}
                />
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => { setIsDialogOpen(false); setEditEntry(null); }}>Cancel</Button>
            <Button
              onClick={handleSave}
              disabled={upsert.isPending || !editEntry?.content}
              style={{ background: "var(--color-primary)", color: "var(--color-primary-foreground)" }}
            >
              {upsert.isPending ? "Saving..." : "Save Entry"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </NovaLayout>
  );
}
