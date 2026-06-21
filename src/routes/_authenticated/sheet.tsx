import { createFileRoute, Link } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { motion } from "framer-motion";
import { ExternalLink, Sparkles, RefreshCw, Check, CheckCircle2 } from "lucide-react";
import { generateSheet, getMyProfile } from "@/lib/cp.functions";
import { isSheetCompletedToday, markSheetCompletedToday } from "@/lib/notifications.functions";
import { GlassCard } from "@/components/glass-card";
import { Button } from "@/components/ui/button";
import { CardSkeleton } from "@/components/skeletons";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/sheet")({
  head: () => ({
    meta: [
      { title: "Daily Sheet — CP Coach" },
      { name: "description", content: "Your AI-personalized Codeforces problem sheet for today." },
    ],
  }),
  component: SheetPage,
});

function SheetPage() {
  const profileFn = useServerFn(getMyProfile);
  const genFn = useServerFn(generateSheet);
  const { data: profile } = useQuery({ queryKey: ["profile"], queryFn: () => profileFn() });
  const handle = profile?.codeforces_handle ?? "";
  const [size, setSize] = useState<5 | 10 | 15>(5);

  const mut = useMutation({
    mutationFn: (s: 5 | 10 | 15) => genFn({ data: { handle, size: s } }),
  });

  if (!handle) {
    return (
      <GlassCard>
        <p className="text-sm text-muted-foreground">Connect your Codeforces handle first.</p>
        <Link to="/dashboard"><Button className="mt-4 bg-gradient-brand text-white border-0">Go to dashboard</Button></Link>
      </GlassCard>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-display font-semibold">Daily Sheet</h1>
          <p className="text-muted-foreground mt-1">Tailored for <span className="font-mono">@{handle}</span> · {new Date().toLocaleDateString("en", { weekday: "long", month: "long", day: "numeric" })}</p>
        </div>
        <div className="flex items-center gap-2 glass rounded-xl p-1">
          {([5, 10, 15] as const).map((n) => (
            <button
              key={n}
              onClick={() => setSize(n)}
              className={`px-4 py-2 text-sm rounded-lg transition ${size === n ? "bg-gradient-brand text-white shadow-glow" : "text-muted-foreground hover:text-foreground"}`}
            >
              {n} problems
            </button>
          ))}
        </div>
      </div>

      <div className="flex flex-wrap gap-3 items-center">
        <Button
          onClick={() => mut.mutate(size)}
          disabled={mut.isPending}
          className="bg-gradient-brand text-white border-0 shadow-glow"
        >
          {mut.isPending ? <RefreshCw className="size-4 mr-2 animate-spin" /> : <Sparkles className="size-4 mr-2" />}
          Generate sheet
        </Button>
        <Button
          variant="outline"
          onClick={() => completeMut.mutate()}
          disabled={completeMut.isPending || doneToday?.completed}
          className="border-border/60"
        >
          {doneToday?.completed ? (
            <><CheckCircle2 className="size-4 mr-2 text-success" /> Completed today</>
          ) : (
            <><Check className="size-4 mr-2" /> Mark complete</>
          )}
        </Button>
        {mut.data ? (
          <span className="text-xs text-muted-foreground self-center">
            Weak topics targeted: <span className="text-foreground">{mut.data.weakTags.join(", ")}</span>
          </span>
        ) : null}
      </div>

      {mut.isPending ? (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: size }).map((_, i) => <CardSkeleton key={i} />)}
        </div>
      ) : mut.data && mut.data.sheet.length ? (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {mut.data.sheet.map((item, i) => (
            <motion.a
              key={`${item.problem.contestId}-${item.problem.index}`}
              href={`https://codeforces.com/problemset/problem/${item.problem.contestId}/${item.problem.index}`}
              target="_blank" rel="noreferrer"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              className="glass rounded-2xl p-5 group hover:bg-white/[0.04] hover:border-white/10 hover:-translate-y-0.5 transition-all"
            >
              <div className="flex items-center justify-between text-[10px] uppercase tracking-wider text-muted-foreground">
                <span className={
                  item.difficulty === "easy" ? "text-success" :
                  item.difficulty === "medium" ? "text-warning" : "text-destructive"
                }>{item.difficulty}</span>
                <span className="font-mono">{item.problem.rating}</span>
              </div>
              <div className="mt-2 font-medium leading-tight group-hover:text-gradient-brand transition">
                {item.problem.contestId}{item.problem.index}. {item.problem.name}
              </div>
              <div className="mt-3 flex flex-wrap gap-1.5">
                {item.problem.tags.slice(0, 3).map((t) => (
                  <span key={t} className={`text-[10px] rounded-md px-1.5 py-0.5 ${
                    item.weak ? "bg-primary/15 text-primary ring-1 ring-primary/30" : "bg-white/[0.04] text-muted-foreground"
                  }`}>{t}</span>
                ))}
              </div>
              <div className="mt-4 inline-flex items-center gap-1 text-xs text-muted-foreground group-hover:text-foreground">
                Open on Codeforces <ExternalLink className="size-3" />
              </div>
            </motion.a>
          ))}
        </div>
      ) : mut.data ? (
        <GlassCard>
          <p className="text-sm text-muted-foreground">No matching problems found. Try a larger sheet size.</p>
        </GlassCard>
      ) : (
        <GlassCard>
          <h3 className="font-display text-lg font-semibold">Ready when you are</h3>
          <p className="text-sm text-muted-foreground mt-1">Hit <span className="text-primary">Generate sheet</span> to get today's curated problems tuned to your weak topics.</p>
        </GlassCard>
      )}
    </div>
  );
}
