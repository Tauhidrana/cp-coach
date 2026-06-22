import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Bell, Check, Trash2, Sparkles, Trophy, ListChecks, Award, FileText } from "lucide-react";
import { useNotifications } from "@/hooks/use-notifications";
import { deleteNotification, markAllRead, markRead } from "@/lib/notifications.functions";
import { Button } from "@/components/ui/button";
import { GlassCard } from "@/components/glass-card";

export const Route = createFileRoute("/_authenticated/notifications")({
  head: () => ({
    meta: [
      { title: "Notifications — CP Coach" },
      { name: "description", content: "All your CP Coach notifications, reminders, and updates." },
    ],
  }),
  component: NotificationsPage,
});

const FILTERS = [
  { id: "all", label: "All" },
  { id: "practice", label: "Practice" },
  { id: "contest", label: "Contest" },
  { id: "coach", label: "AI Coach" },
  { id: "weekly_report", label: "Reports" },
  { id: "achievement", label: "Achievements" },
] as const;

const TypeIcon = {
  practice: ListChecks,
  contest: Trophy,
  coach: Sparkles,
  weekly_report: FileText,
  achievement: Award,
} as const;

function timeAgo(iso: string) {
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.round(diff / 60000);
  if (m < 1) return "just now";
  if (m < 60) return `${m}m ago`;
  const h = Math.round(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.round(h / 24)}d ago`;
}

function NotificationsPage() {
  const { items, unread } = useNotifications();
  const [filter, setFilter] = useState<(typeof FILTERS)[number]["id"]>("all");
  const qc = useQueryClient();
  const allFn = useServerFn(markAllRead);
  const readFn = useServerFn(markRead);
  const delFn = useServerFn(deleteNotification);

  const invalidate = () => qc.invalidateQueries({ queryKey: ["notifications"] });
  const allMut = useMutation({ mutationFn: () => allFn(), onSuccess: invalidate });
  const readMut = useMutation({
    mutationFn: (id: string) => readFn({ data: { id } }),
    onSuccess: invalidate,
  });
  const delMut = useMutation({
    mutationFn: (id: string) => delFn({ data: { id } }),
    onSuccess: invalidate,
  });

  const filtered = filter === "all" ? items : items.filter((i) => i.type === filter);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-display font-semibold flex items-center gap-3">
            Notifications
            {unread > 0 && (
              <span className="text-xs font-normal px-2 py-1 rounded-full bg-primary/15 text-primary ring-1 ring-primary/30">
                {unread} unread
              </span>
            )}
          </h1>
          <p className="text-muted-foreground mt-1">Reminders, contest alerts, and AI updates.</p>
        </div>
        <Button
          variant="outline"
          onClick={() => allMut.mutate()}
          disabled={unread === 0 || allMut.isPending}
          className="border-border/60"
        >
          <Check className="size-4 mr-2" /> Mark all read
        </Button>
      </div>

      <div className="flex flex-wrap gap-2">
        {FILTERS.map((f) => (
          <button
            key={f.id}
            onClick={() => setFilter(f.id)}
            className={`px-3 py-1.5 text-xs rounded-full transition ring-1 ${
              filter === f.id
                ? "bg-gradient-brand text-white ring-transparent shadow-glow"
                : "ring-border/60 text-muted-foreground hover:text-foreground"
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <GlassCard>
          <div className="text-center py-12">
            <div className="size-14 mx-auto rounded-2xl bg-primary/10 grid place-items-center text-primary mb-3">
              <Bell className="size-6" />
            </div>
            <h3 className="font-display text-lg font-semibold">Nothing here yet</h3>
            <p className="text-sm text-muted-foreground mt-1">
              When something needs your attention, you'll see it here.
            </p>
          </div>
        </GlassCard>
      ) : (
        <div className="space-y-2">
          <AnimatePresence initial={false}>
            {filtered.map((n) => {
              const Icon = TypeIcon[n.type as keyof typeof TypeIcon] ?? Bell;
              return (
                <motion.div
                  key={n.id}
                  layout
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className={`glass rounded-2xl p-4 flex items-start gap-3 group ${n.read_at ? "opacity-70" : ""}`}
                >
                  <div className="size-9 shrink-0 grid place-items-center rounded-xl bg-primary/10 ring-1 ring-primary/20 text-primary">
                    <Icon className="size-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <h3 className="font-medium truncate">{n.title}</h3>
                      {!n.read_at && <span className="size-1.5 rounded-full bg-primary shrink-0" />}
                    </div>
                    {n.body && <p className="text-sm text-muted-foreground mt-0.5">{n.body}</p>}
                    <div className="text-[10px] uppercase tracking-wider text-muted-foreground mt-2">
                      {timeAgo(n.created_at)}
                    </div>
                  </div>
                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition">
                    {!n.read_at && (
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => readMut.mutate(n.id)}
                        aria-label="Mark read"
                      >
                        <Check className="size-4" />
                      </Button>
                    )}
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => delMut.mutate(n.id)}
                      aria-label="Delete"
                    >
                      <Trash2 className="size-4" />
                    </Button>
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>
      )}
    </div>
  );
}
