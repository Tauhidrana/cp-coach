import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { motion } from "framer-motion";
import { ArrowRight, Plug, Sparkles, TrendingUp, Award, Activity } from "lucide-react";
import { listMyPlatforms } from "@/lib/platforms.functions";
import { PLATFORMS, type PlatformId } from "@/lib/platforms/registry";
import { computeCPFlowScore, tierGradient } from "@/lib/score";
import { PlatformLogo } from "@/components/platform-logo";
import { GlassCard } from "@/components/glass-card";
import { CardSkeleton } from "@/components/skeletons";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/lib/use-auth";

export const Route = createFileRoute("/_authenticated/dashboard")({
  head: () => ({
    meta: [
      { title: "Dashboard — CP Flow" },
      { name: "description", content: "Your unified competitive programming dashboard across every platform." },
    ],
  }),
  component: Dashboard,
});

function Dashboard() {
  const { user, isGuest } = useAuth();
  const listFn = useServerFn(listMyPlatforms);
  const { data: rows, isLoading } = useQuery({ queryKey: ["platforms"], queryFn: () => listFn() });

  const display =
    (user?.user_metadata?.full_name as string | undefined) ||
    (user?.user_metadata?.name as string | undefined) ||
    user?.email?.split("@")[0] ||
    (isGuest ? "Guest" : "Coder");

  const platforms = rows ?? [];
  const score = computeCPFlowScore(platforms);

  return (
    <div className="space-y-8">
      <div>
        <motion.h1 initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="text-3xl md:text-4xl font-display font-semibold tracking-tight">
          Welcome back, <span className="text-gradient-brand">{display}</span>
        </motion.h1>
        <p className="text-muted-foreground mt-2">Your unified competitive programming command center.</p>
      </div>

      {isLoading ? (
        <div className="grid lg:grid-cols-3 gap-4">
          <CardSkeleton className="lg:col-span-2" />
          <CardSkeleton />
        </div>
      ) : platforms.length === 0 ? (
        <EmptyState />
      ) : (
        <>
          {/* Hero: CP Flow Score + totals */}
          <div className="grid lg:grid-cols-3 gap-4">
            <ScoreCard score={score} className="lg:col-span-2" />
            <div className="grid grid-cols-2 lg:grid-cols-1 gap-4">
              <Kpi icon={TrendingUp} label="Total solved" value={score.totalSolved.toLocaleString()} />
              <Kpi icon={Award} label="Contests" value={score.totalContests} />
            </div>
          </div>

          {/* Connected platforms grid */}
          <section>
            <div className="flex items-end justify-between mb-3">
              <h2 className="text-xl font-display font-semibold">Connected platforms</h2>
              <Link to="/platforms" className="text-xs text-primary hover:underline inline-flex items-center gap-1">
                Manage <ArrowRight className="size-3" />
              </Link>
            </div>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {platforms.map((row, i) => {
                const meta = PLATFORMS[row.platform as PlatformId];
                if (!meta) return null;
                return (
                  <motion.div key={row.platform} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 * i }}>
                    <PlatformStatCard meta={meta} row={row} />
                  </motion.div>
                );
              })}
              <Link to="/platforms" className="glass rounded-2xl p-5 border-dashed border-2 border-border/40 flex items-center justify-center text-sm text-muted-foreground hover:text-foreground hover:border-primary/40 transition min-h-[180px]">
                <span className="inline-flex items-center gap-2"><Plug className="size-4" /> Connect another platform</span>
              </Link>
            </div>
          </section>

          {/* Quick links */}
          <section className="grid md:grid-cols-3 gap-4">
            <QuickLink to="/sheet" title="Today's Sheet" desc="Personalized problems for your level." icon={Sparkles} />
            <QuickLink to="/analytics" title="Analytics" desc="Deep dive into your performance." icon={Activity} />
            <QuickLink to="/coach" title="AI Coach" desc="Get cross-platform feedback." icon={Sparkles} />
          </section>
        </>
      )}
    </div>
  );
}

function ScoreCard({ score, className }: { score: ReturnType<typeof computeCPFlowScore>; className?: string }) {
  const grad = tierGradient(score.tier);
  return (
    <GlassCard className={`relative overflow-hidden ${className}`}>
      <div className={`absolute -top-24 -right-24 size-72 rounded-full bg-gradient-to-br ${grad} opacity-25 blur-3xl pointer-events-none`} />
      <div className="relative flex items-center justify-between gap-6 flex-wrap">
        <div>
          <div className="text-xs uppercase tracking-[0.2em] text-muted-foreground">CP Flow Score</div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className={`text-6xl md:text-7xl font-display font-bold bg-gradient-to-br ${grad} bg-clip-text text-transparent tabular-nums`}>
              {score.score}
            </span>
            <span className="text-xl text-muted-foreground">/ 100</span>
          </div>
          <div className="mt-2 inline-flex items-center gap-2">
            <span className="size-2 rounded-full bg-gradient-brand" />
            <span className="text-sm font-medium">{score.tier}</span>
          </div>
        </div>
        <div className="flex-1 min-w-[240px]">
          <ScoreBreakdown score={score} />
        </div>
      </div>
    </GlassCard>
  );
}

function ScoreBreakdown({ score }: { score: ReturnType<typeof computeCPFlowScore> }) {
  const total = score.breakdown.reduce((a, b) => a + b.contribution, 0) || 1;
  return (
    <div className="space-y-2">
      <div className="text-xs text-muted-foreground mb-2">Contribution by platform</div>
      <div className="flex h-3 rounded-full overflow-hidden bg-white/[0.04] border border-white/[0.06]">
        {score.breakdown.map((b) => {
          const meta = PLATFORMS[b.platform as PlatformId];
          if (!meta || b.contribution <= 0) return null;
          return (
            <div
              key={b.platform}
              className="h-full"
              style={{ width: `${(b.contribution / total) * 100}%`, background: meta.color }}
              title={`${meta.name}: ${Math.round((b.contribution / total) * 100)}%`}
            />
          );
        })}
      </div>
      <div className="flex flex-wrap gap-x-3 gap-y-1 mt-2 text-[11px]">
        {score.breakdown
          .filter((b) => b.contribution > 0)
          .map((b) => {
            const meta = PLATFORMS[b.platform as PlatformId];
            if (!meta) return null;
            return (
              <span key={b.platform} className="inline-flex items-center gap-1.5 text-muted-foreground">
                <span className="size-2 rounded-sm" style={{ background: meta.color }} />
                {meta.name}
              </span>
            );
          })}
      </div>
    </div>
  );
}

function Kpi({ icon: Icon, label, value }: { icon: React.ComponentType<{ className?: string }>; label: string; value: number | string }) {
  return (
    <GlassCard className="!p-5">
      <div className="flex items-center justify-between">
        <span className="text-xs text-muted-foreground uppercase tracking-wider">{label}</span>
        <Icon className="size-4 text-primary" />
      </div>
      <div className="mt-2 text-2xl font-display font-semibold tabular-nums">{value}</div>
    </GlassCard>
  );
}

function PlatformStatCard({
  meta, row,
}: {
  meta: ReturnType<typeof PLATFORMS[PlatformId]>;
  row: { platform: string; username: string; rating: number | null; max_rating: number | null; rank_label: string | null; problems_solved: number; contest_count: number };
}) {
  return (
    <div className="glass rounded-2xl p-5 relative overflow-hidden hover:bg-white/[0.04] hover:-translate-y-0.5 transition group">
      <div className="absolute -top-12 -right-12 size-32 rounded-full opacity-20 blur-2xl" style={{ background: meta.color }} />
      <div className="relative flex items-start justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0">
          <PlatformLogo p={meta} size={42} />
          <div className="min-w-0">
            <div className="font-display font-semibold">{meta.name}</div>
            <div className="text-xs text-muted-foreground truncate">@{row.username}</div>
          </div>
        </div>
        {row.rank_label && (
          <span className="text-[10px] uppercase tracking-wider px-2 py-1 rounded-md bg-white/[0.04] border border-white/[0.06] text-muted-foreground shrink-0">
            {row.rank_label}
          </span>
        )}
      </div>
      <div className="mt-5 grid grid-cols-3 gap-2 text-center">
        <Mini label="Rating" value={row.rating ?? "—"} />
        <Mini label="Max" value={row.max_rating ?? "—"} />
        <Mini label="Solved" value={row.problems_solved.toLocaleString()} />
      </div>
    </div>
  );
}

function Mini({ label, value }: { label: string; value: number | string }) {
  return (
    <div className="rounded-lg bg-white/[0.03] border border-white/[0.05] py-2">
      <div className="text-base font-display font-semibold tabular-nums">{value}</div>
      <div className="text-[10px] uppercase tracking-wider text-muted-foreground mt-0.5">{label}</div>
    </div>
  );
}

function QuickLink({ to, title, desc, icon: Icon }: { to: string; title: string; desc: string; icon: React.ComponentType<{ className?: string }> }) {
  return (
    <Link to={to} className="glass rounded-2xl p-5 hover:bg-white/[0.04] hover:-translate-y-0.5 transition group">
      <div className="flex items-center gap-3">
        <div className="size-9 rounded-lg bg-primary/10 ring-1 ring-primary/20 grid place-items-center">
          <Icon className="size-4 text-primary" />
        </div>
        <div className="flex-1">
          <div className="font-display font-semibold">{title}</div>
          <div className="text-xs text-muted-foreground">{desc}</div>
        </div>
        <ArrowRight className="size-4 text-muted-foreground group-hover:text-foreground group-hover:translate-x-0.5 transition" />
      </div>
    </Link>
  );
}

function EmptyState() {
  return (
    <GlassCard className="text-center py-14">
      <div className="size-14 rounded-2xl bg-gradient-brand mx-auto grid place-items-center shadow-glow">
        <Plug className="size-6 text-white" />
      </div>
      <h2 className="mt-5 text-2xl font-display font-semibold">Connect your first platform</h2>
      <p className="text-muted-foreground mt-2 max-w-md mx-auto">
        Plug in Codeforces, LeetCode or AtCoder to unlock your unified CP Flow Score, daily sheet, and AI coaching.
      </p>
      <Link to="/platforms">
        <Button className="mt-6 bg-gradient-brand text-white border-0 shadow-glow h-11 px-6">
          <Plug className="size-4 mr-2" /> Connect a platform
        </Button>
      </Link>
    </GlassCard>
  );
}
