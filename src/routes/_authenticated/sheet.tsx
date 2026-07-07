import { createFileRoute, Link } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useEffect, useMemo, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ExternalLink,
  Sparkles,
  RefreshCw,
  Check,
  CheckCircle2,
  Clock,
  Target,
  TrendingUp,
  Brain,
  Calendar,
  ChevronDown,
  Trophy,
} from "lucide-react";
import {
  generateSmartSheet,
  markProblemSolved,
  listSolvedSheetProblems,
} from "@/lib/sheet.functions";
import { isSheetCompletedToday, markSheetCompletedToday } from "@/lib/notifications.functions";
import { GlassCard } from "@/components/glass-card";
import { Button } from "@/components/ui/button";
import { CardSkeleton } from "@/components/skeletons";
import { PLATFORMS } from "@/lib/platforms/registry";
import { PlatformLogo } from "@/components/platform-logo";
import { useSettings, resolveLanguage } from "@/hooks/use-settings";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_authenticated/sheet")({
  head: () => ({
    meta: [
      { title: "Daily Sheet — CP Coach" },
      {
        name: "description",
        content: "Your AI-personalized multi-platform problem sheet for today.",
      },
    ],
  }),
  component: SheetPage,
});

type Item = Awaited<ReturnType<typeof generateSmartSheet>>["items"][number];
type Sheet = Awaited<ReturnType<typeof generateSmartSheet>>;

function SheetPage() {
  const genFn = useServerFn(generateSmartSheet);
  const doneFn = useServerFn(isSheetCompletedToday);
  const markFn = useServerFn(markSheetCompletedToday);
  const solvedFn = useServerFn(listSolvedSheetProblems);
  const markProbFn = useServerFn(markProblemSolved);
  const qc = useQueryClient();
  const { settings } = useSettings();
  const [size, setSize] = useState<5 | 10 | 15>(5);
  const [lang, setLang] = useState<"en" | "bn">(() =>
    resolveLanguage(settings?.language as "auto" | "en" | "bn" | undefined),
  );
  const [sheet, setSheet] = useState<Sheet | null>(null);

  const { data: doneToday } = useQuery({ queryKey: ["sheet-done-today"], queryFn: () => doneFn() });
  const { data: solvedList } = useQuery({ queryKey: ["solved-sheet"], queryFn: () => solvedFn() });
  const solvedSet = useMemo(() => {
    const s = new Set<string>();
    for (const r of solvedList ?? []) s.add(`${r.platform}:${r.problem_key}`);
    return s;
  }, [solvedList]);

  const mut = useMutation({
    mutationFn: (s: 5 | 10 | 15) => genFn({ data: { size: s, language: lang } }),
    onSuccess: (data) => setSheet(data),
    onError: (e: Error) => toast.error(e.message),
  });

  const completeMut = useMutation({
    mutationFn: () => markFn(),
    onSuccess: () => {
      toast.success("Sheet marked complete.");
      qc.invalidateQueries({ queryKey: ["sheet-done-today"] });
    },
  });

  const solveMut = useMutation({
    mutationFn: (v: {
      platform: "codeforces" | "codechef" | "leetcode";
      key: string;
      solved: boolean;
    }) => markProbFn({ data: { platform: v.platform, problem_key: v.key, solved: v.solved } }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["solved-sheet"] }),
  });

  const grouped = useMemo(() => {
    if (!sheet) return null;
    const g: Record<string, Item[]> = { codeforces: [], codechef: [], leetcode: [] };
    for (const it of sheet.items) g[it.platform].push(it);
    return g;
  }, [sheet]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:flex-wrap sm:items-end sm:justify-between gap-4">
        <div className="min-w-0">
          <h1 className="text-2xl sm:text-3xl font-display font-semibold">Daily Sheet</h1>
          <p className="text-muted-foreground mt-1 text-sm sm:text-base">
            AI-curated practice across your platforms · {new Date().toLocaleDateString("en", { weekday: "long", month: "long", day: "numeric" })}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1 glass rounded-xl p-1">
            {(["en", "bn"] as const).map((l) => (
              <button
                key={l}
                onClick={() => setLang(l)}
                className={cn(
                  "px-3 py-1.5 text-xs font-medium rounded-lg transition",
                  lang === l
                    ? "bg-gradient-brand text-white"
                    : "text-muted-foreground hover:text-foreground",
                )}
              >
                {l === "en" ? "EN" : "বাংলা"}
              </button>
            ))}
          </div>
          <div className="flex items-center gap-1 glass rounded-xl p-1">
            {([5, 10, 15] as const).map((n) => (
              <button
                key={n}
                onClick={() => setSize(n)}
                className={cn(
                  "px-3 py-1.5 text-sm rounded-lg transition",
                  size === n
                    ? "bg-gradient-brand text-white shadow-glow"
                    : "text-muted-foreground hover:text-foreground",
                )}
              >
                {n}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="flex flex-wrap gap-3 items-center">
        <Button
          onClick={() => mut.mutate(size)}
          disabled={mut.isPending}
          className="bg-gradient-brand text-white border-0 shadow-glow"
        >
          {mut.isPending ? (
            <RefreshCw className="size-4 mr-2 animate-spin" />
          ) : (
            <Sparkles className="size-4 mr-2" />
          )}
          {sheet ? "Regenerate" : "Generate sheet"}
        </Button>
        <Button
          variant="outline"
          onClick={() => completeMut.mutate()}
          disabled={completeMut.isPending || doneToday?.completed}
          className="border-border/60"
        >
          {doneToday?.completed ? (
            <>
              <CheckCircle2 className="size-4 mr-2 text-success" /> Completed today
            </>
          ) : (
            <>
              <Check className="size-4 mr-2" /> Mark complete
            </>
          )}
        </Button>
      </div>

      {/* Loading */}
      {mut.isPending && !sheet ? (
        <>
          <CardSkeleton />
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {Array.from({ length: size }).map((_, i) => (
              <CardSkeleton key={i} />
            ))}
          </div>
        </>
      ) : null}

      {/* Sheet content */}
      {sheet && grouped ? (
        <>
          <TodaysGoal sheet={sheet} />
          {sheet.ratingGoal ? <RatingGoalCard goal={sheet.ratingGoal} /> : null}
          <WeeklyPlanStrip plan={sheet.weeklyPlan} />

          {(["codeforces", "codechef", "leetcode"] as const).map((plat) => {
            const list = grouped[plat];
            if (!list || list.length === 0) return null;
            const meta = PLATFORMS[plat];
            return (
              <section key={plat} className="space-y-3">
                <div className="flex items-center gap-3">
                  <PlatformLogo p={meta} size={32} />
                  <div>
                    <h2 className="font-display text-xl font-semibold">{meta.name}</h2>
                    <p className="text-xs text-muted-foreground">
                      {list.length} problem{list.length > 1 ? "s" : ""}
                    </p>
                  </div>
                </div>
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {list.map((it, i) => (
                    <ProblemCard
                      key={it.id}
                      item={it}
                      index={i}
                      lang={lang}
                      solved={solvedSet.has(`${it.platform}:${problemKey(it)}`)}
                      onToggleSolved={(s) =>
                        solveMut.mutate({ platform: it.platform, key: problemKey(it), solved: s })
                      }
                    />
                  ))}
                </div>
              </section>
            );
          })}
        </>
      ) : !mut.isPending ? (
        <GlassCard>
          <h3 className="font-display text-lg font-semibold">Ready when you are</h3>
          <p className="text-sm text-muted-foreground mt-1">
            Hit <span className="text-primary">Generate sheet</span> — we'll pick problems across
            Codeforces, CodeChef, and LeetCode based on your rating, weak topics, and yesterday's
            progress.
          </p>
          {!doneToday ? null : null}
          <Link to="/platforms">
            <Button variant="outline" className="mt-4 border-border/60">
              Manage platforms
            </Button>
          </Link>
        </GlassCard>
      ) : null}
    </div>
  );
}

function problemKey(it: Item): string {
  // strip "cf:" / "cc:" / "lc:" prefix from sheet id
  return it.id.includes(":") ? it.id.split(":").slice(1).join(":") : it.id;
}

// ---- Today's Goal hero ----
function TodaysGoal({ sheet }: { sheet: Sheet }) {
  const hours = Math.floor(sheet.estimatedMinutes / 60);
  const mins = sheet.estimatedMinutes % 60;
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="glass rounded-2xl p-6 relative overflow-hidden"
    >
      <div className="absolute -top-20 -right-20 size-64 bg-gradient-brand opacity-10 blur-3xl rounded-full" />
      <div className="relative">
        <div className="flex items-center gap-2 text-xs uppercase tracking-wider text-muted-foreground">
          <Target className="size-3.5" /> Today's Goal
        </div>
        <div className="mt-2 flex flex-wrap items-baseline gap-3">
          <h2 className="text-2xl font-display font-semibold">{sheet.tier} tier</h2>
          <span className="text-sm text-muted-foreground">· rating ≈ {sheet.effectiveRating}</span>
          {sheet.adaptiveShift !== 0 ? (
            <span
              className={cn(
                "text-xs px-2 py-0.5 rounded-full font-medium",
                sheet.adaptiveShift > 0
                  ? "bg-success/15 text-success"
                  : "bg-warning/15 text-warning",
              )}
            >
              <TrendingUp className="size-3 inline mr-1" />
              difficulty {sheet.adaptiveShift > 0 ? "+" : ""}
              {sheet.adaptiveShift}
            </span>
          ) : null}
        </div>

        <div className="grid sm:grid-cols-3 gap-4 mt-5">
          <Stat
            icon={<Clock className="size-4" />}
            label="Estimated time"
            value={`${hours ? `${hours}h ` : ""}${mins}m`}
          />
          <Stat
            icon={<Brain className="size-4" />}
            label="Focus topics"
            value={sheet.focusTopics.slice(0, 3).join(", ") || "Balanced"}
          />
          <Stat
            icon={<Sparkles className="size-4" />}
            label="Difficulty mix"
            value={`${sheet.distribution.easy}E · ${sheet.distribution.medium}M · ${sheet.distribution.hard}H`}
          />
        </div>

        <div className="mt-4 flex flex-wrap gap-2">
          {(
            Object.entries(sheet.platformBreakdown) as Array<
              [keyof typeof sheet.platformBreakdown, number]
            >
          ).map(([p, n]) =>
            n > 0 ? (
              <span
                key={p}
                className="text-xs px-2.5 py-1 rounded-lg glass border-border/40 flex items-center gap-1.5"
              >
                <span className="size-2 rounded-full" style={{ background: PLATFORMS[p].color }} />
                {PLATFORMS[p].name} × {n}
              </span>
            ) : null,
          )}
        </div>
      </div>
    </motion.div>
  );
}

function Stat({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div>
      <div className="flex items-center gap-1.5 text-[11px] uppercase tracking-wider text-muted-foreground">
        {icon}
        {label}
      </div>
      <div className="mt-1 font-medium text-foreground">{value}</div>
    </div>
  );
}

// ---- Rating goal ----
function RatingGoalCard({ goal }: { goal: NonNullable<Sheet["ratingGoal"]> }) {
  const pct = Math.min(100, Math.round((goal.current / goal.target) * 100));
  return (
    <div className="glass rounded-2xl p-5">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-xs uppercase tracking-wider text-muted-foreground">
          <Trophy className="size-3.5" /> Rating Goal
        </div>
        <span className="text-xs text-muted-foreground">
          ~{goal.problemsRemaining} problems · {goal.etaWeeks}w
        </span>
      </div>
      <div className="mt-2 flex items-baseline gap-2">
        <span className="text-2xl font-display font-semibold">{goal.current}</span>
        <span className="text-muted-foreground">→</span>
        <span className="text-2xl font-display font-semibold text-gradient-brand">
          {goal.target}
        </span>
      </div>
      <div className="mt-3 h-2 rounded-full bg-white/[0.05] overflow-hidden">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${pct}%` }}
          transition={{ duration: 0.8 }}
          className="h-full bg-gradient-brand"
        />
      </div>
    </div>
  );
}

// ---- Weekly plan strip ----
function WeeklyPlanStrip({ plan }: { plan: Sheet["weeklyPlan"] }) {
  const todayIdx = (new Date().getDay() + 6) % 7; // Mon=0
  return (
    <div className="glass rounded-2xl p-4">
      <div className="flex items-center gap-2 text-xs uppercase tracking-wider text-muted-foreground mb-3">
        <Calendar className="size-3.5" /> Weekly Plan
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2">
        {plan.map((d, i) => (
          <div
            key={d.day}
            className={cn(
              "rounded-xl p-3 border transition",
              i === todayIdx
                ? "bg-gradient-brand/10 border-primary/40 shadow-glow"
                : "bg-white/[0.02] border-border/40",
            )}
          >
            <div
              className={cn(
                "text-[10px] uppercase tracking-wider font-semibold",
                i === todayIdx ? "text-primary" : "text-muted-foreground",
              )}
            >
              {d.day}
            </div>
            <div className="text-xs font-medium mt-1 leading-tight">{d.focus}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ---- Problem card ----
function ProblemCard({
  item,
  index,
  lang,
  solved,
  onToggleSolved,
}: {
  item: Item;
  index: number;
  lang: "en" | "bn";
  solved: boolean;
  onToggleSolved: (s: boolean) => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const diffColor =
    item.difficulty === "easy"
      ? "text-success"
      : item.difficulty === "medium"
        ? "text-warning"
        : "text-destructive";

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.04 }}
      className={cn(
        "glass rounded-2xl p-5 transition-all hover:bg-white/[0.04] hover:border-white/10 hover:-translate-y-0.5",
        solved && "opacity-60",
      )}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-2 text-[10px] uppercase tracking-wider">
          <span className={diffColor}>{item.difficulty}</span>
          <span className="text-muted-foreground">·</span>
          <span className="font-mono text-muted-foreground">{item.rating}</span>
          <span className="text-muted-foreground">·</span>
          <span className="text-muted-foreground inline-flex items-center gap-1">
            <Clock className="size-3" />
            {item.estMinutes}m
          </span>
        </div>
        <button
          onClick={() => onToggleSolved(!solved)}
          className={cn(
            "size-6 rounded-md border grid place-items-center transition",
            solved
              ? "bg-success/20 border-success/40 text-success"
              : "bg-white/[0.02] border-border/60 text-muted-foreground hover:text-foreground",
          )}
          aria-label={solved ? "Mark unsolved" : "Mark solved"}
        >
          <Check className="size-3.5" />
        </button>
      </div>

      <a
        href={item.url}
        target="_blank"
        rel="noreferrer"
        className="block mt-2 font-medium leading-tight hover:text-gradient-brand transition"
      >
        {item.title}
      </a>

      <div className="mt-3 flex flex-wrap gap-1.5">
        {item.tags.slice(0, 3).map((t) => (
          <span
            key={t}
            className={cn(
              "text-[10px] rounded-md px-1.5 py-0.5",
              item.weak
                ? "bg-primary/15 text-primary ring-1 ring-primary/30"
                : "bg-white/[0.04] text-muted-foreground",
            )}
          >
            {t}
          </span>
        ))}
      </div>

      <button
        onClick={() => setExpanded((v) => !v)}
        className="mt-3 inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition"
      >
        <Brain className="size-3" /> Why this problem
        <ChevronDown className={cn("size-3 transition-transform", expanded && "rotate-180")} />
      </button>
      <AnimatePresence initial={false}>
        {expanded ? (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden"
          >
            <p className="mt-2 text-xs leading-relaxed text-muted-foreground">
              {lang === "bn" ? item.reasonBn : item.reasonEn}
            </p>
          </motion.div>
        ) : null}
      </AnimatePresence>

      <a
        href={item.url}
        target="_blank"
        rel="noreferrer"
        className="mt-3 inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground"
      >
        Open <ExternalLink className="size-3" />
      </a>
    </motion.div>
  );
}
