import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Loader2, Plus, RefreshCw, Trash2, Pencil, ExternalLink } from "lucide-react";
import {
  listMyPlatforms,
  connectPlatform,
  syncPlatform,
  upsertManualPlatform,
  disconnectPlatform,
} from "@/lib/platforms.functions";
import { PLATFORM_LIST, type PlatformMeta } from "@/lib/platforms/registry";
import { PlatformLogo } from "@/components/platform-logo";
import { GlassCard } from "@/components/glass-card";
import { CardSkeleton } from "@/components/skeletons";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/platforms")({
  head: () => ({
    meta: [
      { title: "Platforms — CP Coach" },
      {
        name: "description",
        content: "Connect Codeforces, LeetCode, AtCoder and more to your CP Coach profile.",
      },
    ],
  }),
  component: PlatformsPage,
});

function PlatformsPage() {
  const qc = useQueryClient();
  const listFn = useServerFn(listMyPlatforms);
  const { data: rows, isLoading } = useQuery({ queryKey: ["platforms"], queryFn: () => listFn() });
  const connected = new Map((rows ?? []).map((r) => [r.platform, r] as const));

  const [open, setOpen] = useState<PlatformMeta | null>(null);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl md:text-4xl font-display font-semibold tracking-tight">
          Connected <span className="text-gradient-brand">Platforms</span>
        </h1>
        <p className="text-muted-foreground mt-2">
          Connect your competitive programming accounts. CP Coach merges everything into one unified
          profile and score.
        </p>
      </div>

      {isLoading ? (
        <div className="grid md:grid-cols-2 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <CardSkeleton key={i} />
          ))}
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {PLATFORM_LIST.map((p, i) => {
            const row = connected.get(p.id);
            return (
              <motion.div
                key={p.id}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.04 }}
              >
                <PlatformCard
                  p={p}
                  row={row}
                  onEdit={() => setOpen(p)}
                  onChanged={() => qc.invalidateQueries({ queryKey: ["platforms"] })}
                />
              </motion.div>
            );
          })}
        </div>
      )}

      <ConnectDialog
        platform={open}
        existing={open ? connected.get(open.id) : undefined}
        onClose={() => setOpen(null)}
        onSaved={() => qc.invalidateQueries({ queryKey: ["platforms"] })}
      />
    </div>
  );
}

function PlatformCard({
  p,
  row,
  onEdit,
  onChanged,
}: {
  p: PlatformMeta;
  row?: {
    platform: string;
    username: string;
    rating: number | null;
    max_rating: number | null;
    rank_label: string | null;
    problems_solved: number;
    contest_count: number;
    is_manual: boolean;
    last_synced_at: string | null;
  };
  onEdit: () => void;
  onChanged: () => void;
}) {
  const qc = useQueryClient();
  const syncFn = useServerFn(syncPlatform);
  const disconnectFn = useServerFn(disconnectPlatform);
  const sync = useMutation({
    mutationFn: () => syncFn({ data: { platform: p.id } }),
    onSuccess: () => {
      toast.success(`${p.name} synced`);
      onChanged();
    },
    onError: (e: Error) => toast.error(e.message),
  });
  const disc = useMutation({
    mutationFn: () => disconnectFn({ data: { platform: p.id } }),
    onSuccess: () => {
      toast.success(`${p.name} disconnected`);
      onChanged();
      qc.invalidateQueries({ queryKey: ["cf"] });
    },
  });

  const connected = !!row;
  return (
    <div className="glass rounded-2xl p-5 relative overflow-hidden group">
      <div
        className="absolute -top-12 -right-12 size-32 rounded-full opacity-20 blur-2xl group-hover:opacity-30 transition"
        style={{ background: p.color }}
      />
      <div className="relative flex items-start gap-4">
        <PlatformLogo p={p} size={48} />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <h3 className="font-display text-lg font-semibold">{p.name}</h3>
            {connected && (
              <span className="inline-flex items-center gap-1 text-[10px] uppercase tracking-wider text-success">
                <span className="size-1.5 rounded-full bg-success animate-pulse" /> live
              </span>
            )}
          </div>
          <div className="text-xs text-muted-foreground mt-0.5">
            {connected ? (
              <a
                href={p.url(row.username)}
                target="_blank"
                rel="noreferrer"
                className="hover:text-foreground inline-flex items-center gap-1"
              >
                @{row.username} <ExternalLink className="size-3" />
              </a>
            ) : p.apiSupported ? (
              "Live API sync"
            ) : (
              "Manual entry"
            )}
          </div>
        </div>
      </div>

      {connected ? (
        <>
          <div className="mt-5 grid grid-cols-3 gap-2 text-center">
            <Stat label="Rating" value={row.rating ?? "—"} />
            <Stat label="Max" value={row.max_rating ?? "—"} />
            <Stat label="Solved" value={row.problems_solved} />
          </div>
          <div className="mt-3 flex items-center justify-between text-[11px] text-muted-foreground">
            {row.rank_label ? <span className="capitalize">{row.rank_label}</span> : <span />}
            <span>
              {row.last_synced_at ? `Synced ${timeAgo(row.last_synced_at)}` : "Not synced yet"}
            </span>
          </div>
          <div className="mt-4 flex gap-2">
            {p.apiSupported && !row.is_manual ? (
              <Button
                size="sm"
                variant="outline"
                className="flex-1 border-border/60 bg-white/[0.02]"
                onClick={() => sync.mutate()}
                disabled={sync.isPending}
              >
                {sync.isPending ? (
                  <Loader2 className="size-3.5 mr-1.5 animate-spin" />
                ) : (
                  <RefreshCw className="size-3.5 mr-1.5" />
                )}
                Sync
              </Button>
            ) : (
              <Button
                size="sm"
                variant="outline"
                className="flex-1 border-border/60 bg-white/[0.02]"
                onClick={onEdit}
              >
                <Pencil className="size-3.5 mr-1.5" /> Edit
              </Button>
            )}
            <Button
              size="sm"
              variant="ghost"
              className="text-muted-foreground hover:text-destructive"
              onClick={() => disc.mutate()}
              disabled={disc.isPending}
              aria-label="Disconnect"
            >
              <Trash2 className="size-3.5" />
            </Button>
          </div>
        </>
      ) : (
        <Button
          onClick={onEdit}
          className="mt-5 w-full bg-gradient-brand text-white border-0 shadow-glow"
        >
          <Plus className="size-4 mr-1.5" /> Connect
        </Button>
      )}
    </div>
  );
}

function timeAgo(iso: string): string {
  const diffSec = Math.max(0, Math.floor((Date.now() - new Date(iso).getTime()) / 1000));
  if (diffSec < 60) return "just now";
  const mins = Math.floor(diffSec / 60);
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  return `${days}d ago`;
}

function Stat({ label, value }: { label: string; value: number | string }) {
  return (
    <div className="rounded-lg bg-white/[0.03] border border-white/[0.05] py-2">
      <div className="text-base font-display font-semibold tabular-nums">{value}</div>
      <div className="text-[10px] uppercase tracking-wider text-muted-foreground mt-0.5">
        {label}
      </div>
    </div>
  );
}

function ConnectDialog({
  platform,
  existing,
  onClose,
  onSaved,
}: {
  platform: PlatformMeta | null;
  existing?: {
    username: string;
    rating: number | null;
    max_rating: number | null;
    rank_label: string | null;
    problems_solved: number;
    contest_count: number;
  };
  onClose: () => void;
  onSaved: () => void;
}) {
  const connectFn = useServerFn(connectPlatform);
  const manualFn = useServerFn(upsertManualPlatform);

  const [username, setUsername] = useState(existing?.username ?? "");
  const [rating, setRating] = useState<string>(existing?.rating?.toString() ?? "");
  const [maxRating, setMaxRating] = useState<string>(existing?.max_rating?.toString() ?? "");
  const [rankLabel, setRankLabel] = useState(existing?.rank_label ?? "");
  const [solved, setSolved] = useState<string>(existing?.problems_solved?.toString() ?? "0");
  const [contests, setContests] = useState<string>(existing?.contest_count?.toString() ?? "0");

  // reset when platform changes
  const key = platform?.id ?? "";
  useState(() => key);

  const mut = useMutation({
    mutationFn: async () => {
      if (!platform) return;
      if (platform.apiSupported) {
        await connectFn({ data: { platform: platform.id, username: username.trim() } });
      } else {
        await manualFn({
          data: {
            platform: platform.id,
            username: username.trim(),
            rating: rating ? parseInt(rating) : null,
            max_rating: maxRating ? parseInt(maxRating) : null,
            rank_label: rankLabel || null,
            problems_solved: parseInt(solved || "0"),
            contest_count: parseInt(contests || "0"),
          },
        });
      }
    },
    onSuccess: () => {
      toast.success(`${platform?.name} connected`);
      onSaved();
      onClose();
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <Dialog open={!!platform} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="bg-card/95 backdrop-blur-xl border-border/60 max-w-md">
        {platform && (
          <>
            <DialogHeader>
              <div className="flex items-center gap-3 mb-2">
                <PlatformLogo p={platform} size={40} />
                <div>
                  <DialogTitle className="font-display">
                    {existing ? "Edit" : "Connect"} {platform.name}
                  </DialogTitle>
                  <DialogDescription className="text-xs">
                    {platform.apiSupported
                      ? "We'll fetch your live profile data automatically."
                      : "This platform has no public API. Enter your stats manually — update anytime."}
                  </DialogDescription>
                </div>
              </div>
            </DialogHeader>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                mut.mutate();
              }}
              className="space-y-3"
            >
              <div>
                <Label>Username</Label>
                <Input
                  autoFocus
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder={platform.usernameHint}
                  className="bg-white/[0.03] border-border/60 mt-1.5"
                  required
                />
              </div>

              {!platform.apiSupported && (
                <AnimatePresence>
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="space-y-3"
                  >
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <Label>Rating</Label>
                        <Input
                          type="number"
                          value={rating}
                          onChange={(e) => setRating(e.target.value)}
                          className="bg-white/[0.03] border-border/60 mt-1.5"
                        />
                      </div>
                      <div>
                        <Label>Max rating</Label>
                        <Input
                          type="number"
                          value={maxRating}
                          onChange={(e) => setMaxRating(e.target.value)}
                          className="bg-white/[0.03] border-border/60 mt-1.5"
                        />
                      </div>
                    </div>
                    <div>
                      <Label>Rank (e.g. "5 Star", "Knight")</Label>
                      <Input
                        value={rankLabel}
                        onChange={(e) => setRankLabel(e.target.value)}
                        className="bg-white/[0.03] border-border/60 mt-1.5"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <Label>Problems solved</Label>
                        <Input
                          type="number"
                          value={solved}
                          onChange={(e) => setSolved(e.target.value)}
                          className="bg-white/[0.03] border-border/60 mt-1.5"
                        />
                      </div>
                      <div>
                        <Label>Contests</Label>
                        <Input
                          type="number"
                          value={contests}
                          onChange={(e) => setContests(e.target.value)}
                          className="bg-white/[0.03] border-border/60 mt-1.5"
                        />
                      </div>
                    </div>
                  </motion.div>
                </AnimatePresence>
              )}

              <Button
                type="submit"
                disabled={mut.isPending || !username.trim()}
                className="w-full bg-gradient-brand text-white border-0 shadow-glow"
              >
                {mut.isPending ? <Loader2 className="size-4 mr-2 animate-spin" /> : null}
                {existing ? "Save changes" : platform.apiSupported ? "Connect & sync" : "Save"}
              </Button>
            </form>

            {platform.id === "leetcode" && (
              <p className="text-[11px] text-muted-foreground mt-2">
                LeetCode uses an unofficial GraphQL endpoint. Make sure your profile is public.
              </p>
            )}
            {platform.id === "codechef" && (
              <p className="text-[11px] text-muted-foreground mt-2">
                CodeChef has no official API. We read your public profile page — make sure it's
                accessible.
              </p>
            )}
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
