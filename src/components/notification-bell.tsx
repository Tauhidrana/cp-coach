import { Link } from "@tanstack/react-router";
import { Bell, Check, Sparkles, Trophy, ListChecks, Award, FileText } from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useNotifications } from "@/hooks/use-notifications";
import { markAllRead, markRead } from "@/lib/notifications.functions";

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
  const d = Math.round(h / 24);
  return `${d}d ago`;
}

export function NotificationBell() {
  const { items, unread } = useNotifications();
  const qc = useQueryClient();
  const markAllFn = useServerFn(markAllRead);
  const markFn = useServerFn(markRead);

  const allMut = useMutation({
    mutationFn: () => markAllFn(),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["notifications"] }),
  });
  const oneMut = useMutation({
    mutationFn: (id: string) => markFn({ data: { id } }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["notifications"] }),
  });

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" aria-label="Notifications" className="relative">
          <Bell className="size-4" />
          <AnimatePresence>
            {unread > 0 && (
              <motion.span
                key="badge"
                initial={{ scale: 0 }} animate={{ scale: 1 }} exit={{ scale: 0 }}
                className="absolute -top-0.5 -right-0.5 min-w-[1.1rem] h-[1.1rem] px-1 rounded-full bg-primary text-[10px] font-semibold text-primary-foreground grid place-items-center ring-2 ring-background"
              >
                {unread > 9 ? "9+" : unread}
              </motion.span>
            )}
          </AnimatePresence>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-[22rem] glass-strong border-border/60 p-0">
        <div className="flex items-center justify-between px-3 py-2 border-b border-border/40">
          <div className="text-sm font-medium">Notifications</div>
          <button
            onClick={() => allMut.mutate()}
            disabled={unread === 0 || allMut.isPending}
            className="text-xs text-muted-foreground hover:text-foreground inline-flex items-center gap-1 disabled:opacity-50"
          >
            <Check className="size-3" /> Mark all read
          </button>
        </div>
        <div className="max-h-[26rem] overflow-y-auto">
          {items.length === 0 ? (
            <div className="px-4 py-10 text-center text-sm text-muted-foreground">
              You're all caught up.
            </div>
          ) : (
            items.slice(0, 10).map((n) => {
              const Icon = TypeIcon[n.type as keyof typeof TypeIcon] ?? Bell;
              return (
                <button
                  key={n.id}
                  onClick={() => !n.read_at && oneMut.mutate(n.id)}
                  className={`w-full text-left flex gap-3 px-3 py-2.5 border-b border-border/30 last:border-0 hover:bg-white/[0.03] transition ${
                    n.read_at ? "opacity-70" : ""
                  }`}
                >
                  <div className="mt-0.5 size-7 shrink-0 grid place-items-center rounded-lg bg-primary/10 ring-1 ring-primary/20 text-primary">
                    <Icon className="size-3.5" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="text-sm font-medium leading-tight flex items-center gap-2">
                      <span className="truncate">{n.title}</span>
                      {!n.read_at && <span className="size-1.5 rounded-full bg-primary shrink-0" />}
                    </div>
                    {n.body && <div className="text-xs text-muted-foreground line-clamp-2 mt-0.5">{n.body}</div>}
                    <div className="text-[10px] uppercase tracking-wider text-muted-foreground mt-1">{timeAgo(n.created_at)}</div>
                  </div>
                </button>
              );
            })
          )}
        </div>
        <Link
          to="/notifications"
          className="block text-center text-xs text-muted-foreground hover:text-foreground py-2 border-t border-border/40"
        >
          View all
        </Link>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
