import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { ExternalLink, Trophy, TrendingUp, Users, Award, Activity, Save } from "lucide-react";
import { getCFProfile, getMyProfile, saveMyProfile } from "@/lib/cp.functions";
import { GlassCard } from "@/components/glass-card";
import { CardSkeleton } from "@/components/skeletons";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { useAuth } from "@/lib/use-auth";

export const Route = createFileRoute("/_authenticated/dashboard")({
  head: () => ({
    meta: [
      { title: "Dashboard — CP Flow" },
      { name: "description", content: "Your Codeforces profile, rating, and quick stats." },
    ],
  }),
  component: Dashboard,
});

function rankColor(rank?: string) {
  if (!rank) return "text-muted-foreground";
  const r = rank.toLowerCase();
  if (r.includes("legendary")) return "text-red-500";
  if (r.includes("international grandmaster")) return "text-red-400";
  if (r.includes("grandmaster")) return "text-red-400";
  if (r.includes("international master")) return "text-amber-400";
  if (r.includes("master")) return "text-amber-400";
  if (r.includes("candidate master")) return "text-fuchsia-400";
  if (r.includes("expert")) return "text-blue-400";
  if (r.includes("specialist")) return "text-cyan-400";
  if (r.includes("pupil")) return "text-green-400";
  if (r.includes("newbie")) return "text-zinc-400";
  return "text-muted-foreground";
}

function Dashboard() {
  const { user, isGuest } = useAuth();
  const qc = useQueryClient();
  const profileFn = useServerFn(getMyProfile);
  const saveFn = useServerFn(saveMyProfile);
  const cfFn = useServerFn(getCFProfile);

  const { data: profile, isLoading: profileLoading } = useQuery({
    queryKey: ["profile"],
    queryFn: () => profileFn(),
  });

  const handle = profile?.codeforces_handle ?? "";
  const [draftHandle, setDraftHandle] = useState("");

  useEffect(() => {
    if (profile?.codeforces_handle) setDraftHandle(profile.codeforces_handle);
  }, [profile?.codeforces_handle]);

  const { data: cf, isLoading: cfLoading, isError } = useQuery({
    queryKey: ["cf", handle],
    queryFn: () => cfFn({ data: { handle } }),
    enabled: !!handle,
    retry: 1,
  });

  const save = useMutation({
    mutationFn: (h: string) => saveFn({ data: { codeforces_handle: h } }),
    onSuccess: () => {
      toast.success("Handle saved");
      qc.invalidateQueries({ queryKey: ["profile"] });
    },
    onError: () => toast.error("Could not save handle"),
  });

  const display =
    profile?.display_name ||
    (user?.user_metadata?.full_name as string | undefined) ||
    (isGuest ? "Guest" : user?.email?.split("@")[0]);

  return (
    <div className="space-y-8">
      <div>
        <motion.h1
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-3xl md:text-4xl font-display font-semibold tracking-tight"
        >
          Welcome back, <span className="text-gradient-brand">{display}</span>
        </motion.h1>
        <p className="text-muted-foreground mt-2">Your competitive programming command center.</p>
      </div>

      {profileLoading ? (
        <CardSkeleton />
      ) : !handle ? (
        <GlassCard>
          <h2 className="font-display text-xl font-semibold">Connect your Codeforces handle</h2>
          <p className="text-sm text-muted-foreground mt-1">Enter your Codeforces username to unlock everything.</p>
          <form
            className="mt-5 flex gap-3"
            onSubmit={(e) => {
              e.preventDefault();
              if (draftHandle.trim()) save.mutate(draftHandle.trim());
            }}
          >
            <Input
              autoFocus
              placeholder="e.g. tourist"
              value={draftHandle}
              onChange={(e) => setDraftHandle(e.target.value)}
              className="bg-white/[0.03] border-border/60"
            />
            <Button type="submit" disabled={save.isPending} className="bg-gradient-brand text-white border-0 shadow-glow">
              <Save className="size-4 mr-2" /> Save
            </Button>
          </form>
        </GlassCard>
      ) : (
        <>
          {cfLoading ? (
            <div className="grid lg:grid-cols-3 gap-4">
              <CardSkeleton className="lg:col-span-2" />
              <CardSkeleton />
            </div>
          ) : isError || !cf ? (
            <GlassCard>
              <p className="text-sm text-destructive">
                Couldn't fetch Codeforces data for <span className="font-mono">@{handle}</span>. Double-check the handle.
              </p>
              <form
                className="mt-4 flex gap-3"
                onSubmit={(e) => {
                  e.preventDefault();
                  if (draftHandle.trim()) save.mutate(draftHandle.trim());
                }}
              >
                <Input value={draftHandle} onChange={(e) => setDraftHandle(e.target.value)} className="bg-white/[0.03]" />
                <Button type="submit" disabled={save.isPending}>Update</Button>
              </form>
            </GlassCard>
          ) : (
            <>
              {/* Profile card */}
              <GlassCard className="overflow-hidden">
                <div className="grid lg:grid-cols-[auto_1fr_auto] gap-6 items-center">
                  <div className="relative">
                    <div className="absolute -inset-1 rounded-2xl bg-gradient-brand opacity-50 blur" />
                    <img
                      src={cf.user.titlePhoto || cf.user.avatar}
                      alt={cf.user.handle}
                      className="relative size-24 rounded-2xl object-cover ring-1 ring-border"
                    />
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-3 flex-wrap">
                      <h2 className="text-2xl font-display font-semibold">{cf.user.handle}</h2>
                      <a
                        href={`https://codeforces.com/profile/${cf.user.handle}`}
                        target="_blank" rel="noreferrer"
                        className="text-xs text-muted-foreground inline-flex items-center gap-1 hover:text-foreground"
                      >
                        codeforces.com <ExternalLink className="size-3" />
                      </a>
                    </div>
                    <div className={`mt-1 font-medium capitalize ${rankColor(cf.user.rank)}`}>{cf.user.rank}</div>
                    {(cf.user.firstName || cf.user.lastName) && (
                      <div className="text-sm text-muted-foreground mt-1">
                        {[cf.user.firstName, cf.user.lastName].filter(Boolean).join(" ")}
                        {cf.user.country ? ` · ${cf.user.country}` : ""}
                      </div>
                    )}
                  </div>
                  <div className="flex gap-2 flex-wrap">
                    <Badge variant="outline" className="bg-primary/10 border-primary/30 text-foreground">
                      Rating {cf.user.rating ?? 0}
                    </Badge>
                    <Badge variant="outline" className="bg-accent/10 border-accent/30 text-foreground">
                      Max {cf.user.maxRating ?? 0}
                    </Badge>
                  </div>
                </div>
              </GlassCard>

              {/* Stats grid */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <Stat icon={TrendingUp} label="Current rating" value={cf.user.rating ?? 0} hint={cf.user.rank} delay={0.05} />
                <Stat icon={Award} label="Max rating" value={cf.user.maxRating ?? 0} hint={cf.user.maxRank} delay={0.1} />
                <Stat icon={Trophy} label="Contests" value={cf.ratingHistory.length} hint="participated" delay={0.15} />
                <Stat icon={Activity} label="Solved" value={cf.analysis.totalSolved} hint="unique problems" delay={0.2} />
                <Stat icon={Users} label="Friends" value={cf.user.friendOfCount} hint="follow you" delay={0.25} />
                <Stat
                  icon={TrendingUp}
                  label="Contribution"
                  value={cf.user.contribution}
                  hint="community score"
                  delay={0.3}
                />
                <Stat
                  icon={Award}
                  label="Last delta"
                  value={
                    cf.ratingHistory.length
                      ? (() => {
                          const last = cf.ratingHistory[cf.ratingHistory.length - 1];
                          const d = last.newRating - last.oldRating;
                          return (d >= 0 ? "+" : "") + d;
                        })()
                      : "—"
                  }
                  hint={cf.ratingHistory.length ? cf.ratingHistory[cf.ratingHistory.length - 1].contestName : ""}
                  delay={0.35}
                />
                <Stat
                  icon={Activity}
                  label="Weak topics"
                  value={cf.analysis.topics.slice().sort((a, b) => a.score - b.score).slice(0, 1).map((t) => t.tag).join(", ") || "—"}
                  hint="focus area"
                  delay={0.4}
                />
              </div>
            </>
          )}
        </>
      )}
    </div>
  );
}

function Stat({
  icon: Icon, label, value, hint, delay = 0,
}: { icon: React.ComponentType<{ className?: string }>; label: string; value: number | string; hint?: string; delay?: number }) {
  return (
    <GlassCard hover delay={delay} className="!p-5">
      <div className="flex items-center justify-between">
        <span className="text-xs text-muted-foreground uppercase tracking-wider">{label}</span>
        <Icon className="size-4 text-primary" />
      </div>
      <div className="mt-2 text-2xl font-display font-semibold tabular-nums">{value}</div>
      {hint ? <div className="mt-1 text-xs text-muted-foreground truncate">{hint}</div> : null}
    </GlassCard>
  );
}
