import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import {
  Area, AreaChart, Bar, BarChart, CartesianGrid, Cell, Legend, Pie, PieChart, ResponsiveContainer,
  Tooltip, XAxis, YAxis,
} from "recharts";
import { getCFProfile, getMyProfile } from "@/lib/cp.functions";
import { GlassCard } from "@/components/glass-card";
import { ChartSkeleton, CardSkeleton } from "@/components/skeletons";
import { Link } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/_authenticated/analytics")({
  head: () => ({
    meta: [
      { title: "Analytics — CP Coach" },
      { name: "description", content: "Deep dive into your Codeforces rating, topics and activity." },
    ],
  }),
  component: AnalyticsPage,
});

const CHART_COLORS = ["#a78bfa", "#60a5fa", "#22d3ee", "#34d399", "#fbbf24", "#f472b6", "#fb7185", "#a3e635"];

function AnalyticsPage() {
  const profileFn = useServerFn(getMyProfile);
  const cfFn = useServerFn(getCFProfile);

  const { data: profile } = useQuery({ queryKey: ["profile"], queryFn: () => profileFn() });
  const handle = profile?.codeforces_handle ?? "";
  const { data: cf, isLoading } = useQuery({
    queryKey: ["cf", handle], queryFn: () => cfFn({ data: { handle } }), enabled: !!handle,
  });

  if (!handle) {
    return (
      <GlassCard>
        <p className="text-sm text-muted-foreground">Connect your Codeforces handle on the Dashboard to see analytics.</p>
        <Link to="/dashboard"><Button className="mt-4 bg-gradient-brand text-white border-0">Go to dashboard</Button></Link>
      </GlassCard>
    );
  }

  if (isLoading || !cf) {
    return (
      <div className="space-y-4">
        <div className="grid lg:grid-cols-2 gap-4">
          <ChartSkeleton /><ChartSkeleton />
        </div>
        <div className="grid lg:grid-cols-2 gap-4">
          <ChartSkeleton /><ChartSkeleton />
        </div>
      </div>
    );
  }

  const ratingSeries = cf.ratingHistory.map((r) => ({
    name: new Date(r.ratingUpdateTimeSeconds * 1000).toLocaleDateString("en", { month: "short", day: "numeric" }),
    rating: r.newRating,
  }));

  const ratingHistogram = cf.analysis.ratingDistribution.map(([rating, count]) => ({ rating, count }));
  const topTopics = cf.analysis.topics.filter((t) => t.solved > 0).slice(0, 8).map((t) => ({ name: t.tag, value: t.solved }));
  const strong = cf.analysis.topics.slice(0, 6);
  const weak = cf.analysis.topics.slice().sort((a, b) => a.score - b.score).slice(0, 6);
  const monthly = cf.analysis.submissionsByMonth.slice(-12).map(([m, c]) => ({ name: m, count: c }));

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-3xl font-display font-semibold">Analytics</h1>
        <p className="text-muted-foreground mt-1">Performance breakdown for <span className="font-mono">@{handle}</span></p>
      </header>

      <div className="grid lg:grid-cols-2 gap-4">
        <GlassCard>
          <ChartTitle>Rating Progress</ChartTitle>
          <div className="h-64 mt-2">
            <ResponsiveContainer>
              <AreaChart data={ratingSeries} margin={{ left: -20, right: 8 }}>
                <defs>
                  <linearGradient id="ratingGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#a78bfa" stopOpacity={0.6} />
                    <stop offset="100%" stopColor="#a78bfa" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid stroke="rgba(255,255,255,0.05)" />
                <XAxis dataKey="name" stroke="rgba(255,255,255,0.4)" tick={{ fontSize: 11 }} interval="preserveStartEnd" />
                <YAxis stroke="rgba(255,255,255,0.4)" tick={{ fontSize: 11 }} />
                <Tooltip contentStyle={{ background: "rgba(20,20,30,0.95)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 12 }} />
                <Area type="monotone" dataKey="rating" stroke="#a78bfa" strokeWidth={2} fill="url(#ratingGrad)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </GlassCard>

        <GlassCard>
          <ChartTitle>Solved by difficulty</ChartTitle>
          <div className="h-64 mt-2">
            <ResponsiveContainer>
              <BarChart data={ratingHistogram} margin={{ left: -20, right: 8 }}>
                <CartesianGrid stroke="rgba(255,255,255,0.05)" />
                <XAxis dataKey="rating" stroke="rgba(255,255,255,0.4)" tick={{ fontSize: 11 }} />
                <YAxis stroke="rgba(255,255,255,0.4)" tick={{ fontSize: 11 }} />
                <Tooltip contentStyle={{ background: "rgba(20,20,30,0.95)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 12 }} />
                <Bar dataKey="count" radius={[6, 6, 0, 0]}>
                  {ratingHistogram.map((_, i) => (<Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </GlassCard>
      </div>

      <div className="grid lg:grid-cols-2 gap-4">
        <GlassCard>
          <ChartTitle>Topic distribution</ChartTitle>
          <div className="h-72 mt-2">
            <ResponsiveContainer>
              <PieChart>
                <Pie data={topTopics} dataKey="value" nameKey="name" innerRadius={50} outerRadius={90} paddingAngle={2}>
                  {topTopics.map((_, i) => (<Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} stroke="rgba(0,0,0,0.4)" />))}
                </Pie>
                <Tooltip contentStyle={{ background: "rgba(20,20,30,0.95)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 12 }} />
                <Legend wrapperStyle={{ fontSize: 11 }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </GlassCard>

        <GlassCard>
          <ChartTitle>Monthly activity</ChartTitle>
          <div className="h-72 mt-2">
            <ResponsiveContainer>
              <BarChart data={monthly} margin={{ left: -20, right: 8 }}>
                <CartesianGrid stroke="rgba(255,255,255,0.05)" />
                <XAxis dataKey="name" stroke="rgba(255,255,255,0.4)" tick={{ fontSize: 10 }} />
                <YAxis stroke="rgba(255,255,255,0.4)" tick={{ fontSize: 11 }} />
                <Tooltip contentStyle={{ background: "rgba(20,20,30,0.95)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 12 }} />
                <Bar dataKey="count" fill="#60a5fa" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </GlassCard>
      </div>

      <div className="grid lg:grid-cols-2 gap-4">
        <TopicList title="Strong topics" topics={strong} positive />
        <TopicList title="Weak topics" topics={weak} />
      </div>

      <GlassCard>
        <ChartTitle>Submission heatmap (last 365 days)</ChartTitle>
        <Heatmap data={cf.analysis.submissionsByDay} />
      </GlassCard>
    </div>
  );
}

function ChartTitle({ children }: { children: React.ReactNode }) {
  return <div className="text-sm font-medium text-muted-foreground">{children}</div>;
}

function TopicList({ title, topics, positive = false }: { title: string; topics: { tag: string; solved: number; score: number; avgRating: number }[]; positive?: boolean }) {
  return (
    <GlassCard>
      <ChartTitle>{title}</ChartTitle>
      <ul className="mt-3 space-y-2.5">
        {topics.map((t) => (
          <li key={t.tag} className="flex items-center gap-3">
            <span className="text-sm capitalize flex-1 truncate">{t.tag}</span>
            <div className="flex-[2] h-2 rounded-full bg-white/[0.05] overflow-hidden">
              <div
                className="h-full rounded-full"
                style={{
                  width: `${t.score}%`,
                  background: positive
                    ? "linear-gradient(90deg, #34d399, #22d3ee)"
                    : "linear-gradient(90deg, #fb7185, #fbbf24)",
                }}
              />
            </div>
            <span className="text-xs tabular-nums text-muted-foreground w-16 text-right">{t.solved} · {t.score}%</span>
          </li>
        ))}
      </ul>
    </GlassCard>
  );
}

function Heatmap({ data }: { data: [string, number][] }) {
  const map = new Map(data);
  const today = new Date();
  const start = new Date(today);
  start.setDate(start.getDate() - 364);
  // Align to Sunday
  start.setDate(start.getDate() - start.getDay());
  const days: { date: string; count: number }[] = [];
  for (let i = 0; i < 371; i++) {
    const d = new Date(start);
    d.setDate(d.getDate() + i);
    const key = d.toISOString().slice(0, 10);
    days.push({ date: key, count: map.get(key) ?? 0 });
  }
  const max = Math.max(1, ...days.map((d) => d.count));
  const color = (c: number) => {
    if (c === 0) return "rgba(255,255,255,0.04)";
    const t = c / max;
    if (t < 0.25) return "rgba(167,139,250,0.25)";
    if (t < 0.5) return "rgba(167,139,250,0.45)";
    if (t < 0.75) return "rgba(167,139,250,0.7)";
    return "rgba(167,139,250,1)";
  };
  const weeks: { date: string; count: number }[][] = [];
  for (let w = 0; w < 53; w++) weeks.push(days.slice(w * 7, w * 7 + 7));
  return (
    <div className="mt-3 overflow-x-auto pb-2">
      <div className="flex gap-[3px]">
        {weeks.map((w, wi) => (
          <div key={wi} className="flex flex-col gap-[3px]">
            {w.map((d) => (
              <div
                key={d.date}
                className="size-3 rounded-[3px]"
                style={{ background: color(d.count) }}
                title={`${d.date}: ${d.count} submissions`}
              />
            ))}
          </div>
        ))}
      </div>
      <div className="mt-3 flex items-center gap-2 text-xs text-muted-foreground">
        <span>Less</span>
        {[0, 0.25, 0.5, 0.75, 1].map((t) => (
          <div key={t} className="size-3 rounded-[3px]" style={{ background: color(t * max) }} />
        ))}
        <span>More</span>
      </div>
    </div>
  );
}
