import { createFileRoute, Link } from "@tanstack/react-router";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Loader2, Map, Sparkles, Target, Check } from "lucide-react";
import { generateRoadmap, getMyProfile, saveMyProfile, getCFProfile } from "@/lib/cp.functions";
import { GlassCard } from "@/components/glass-card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export const Route = createFileRoute("/_authenticated/roadmap")({
  head: () => ({
    meta: [
      { title: "Roadmap — CP Coach" },
      {
        name: "description",
        content: "AI-generated learning roadmap from your current to your target rating.",
      },
      { property: "og:title", content: "Your Personal CP Roadmap" },
      {
        property: "og:description",
        content: "A milestone-by-milestone AI plan from your current rating to your target.",
      },
    ],
  }),
  component: RoadmapPage,
});

function RoadmapPage() {
  const profileFn = useServerFn(getMyProfile);
  const saveFn = useServerFn(saveMyProfile);
  const cfFn = useServerFn(getCFProfile);
  const genFn = useServerFn(generateRoadmap);

  const { data: profile } = useQuery({ queryKey: ["profile"], queryFn: () => profileFn() });
  const handle = profile?.codeforces_handle ?? "";
  const { data: cf } = useQuery({
    queryKey: ["cf", handle],
    queryFn: () => cfFn({ data: { handle } }),
    enabled: !!handle,
  });

  const [target, setTarget] = useState<number>(1600);
  useEffect(() => {
    if (profile?.target_rating) setTarget(profile.target_rating);
    else if (cf?.user.rating) setTarget(Math.max(1200, cf.user.rating + 400));
  }, [profile?.target_rating, cf?.user.rating]);

  const mut = useMutation({
    mutationFn: async () => {
      await saveFn({ data: { target_rating: target } });
      return genFn({ data: { handle, targetRating: target } });
    },
  });

  if (!handle) {
    return (
      <GlassCard>
        <p className="text-sm text-muted-foreground">Connect your Codeforces handle first.</p>
        <Link to="/dashboard">
          <Button className="mt-4 bg-gradient-brand text-white border-0">Go to dashboard</Button>
        </Link>
      </GlassCard>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-display font-semibold flex items-center gap-3">
          Personal Roadmap
          <span className="inline-flex items-center gap-1 text-xs font-normal px-2 py-1 rounded-full bg-primary/15 text-primary ring-1 ring-primary/30">
            <Sparkles className="size-3" /> AI-built
          </span>
        </h1>
        <p className="text-muted-foreground mt-1">
          A milestone-based path from where you are to where you want to be.
        </p>
      </div>

      <GlassCard>
        <div className="grid md:grid-cols-[1fr_auto_auto] gap-4 items-end">
          <div>
            <label className="text-xs uppercase tracking-wider text-muted-foreground">
              Current rating
            </label>
            <div className="mt-1 text-2xl font-display font-semibold">{cf?.user.rating ?? "—"}</div>
          </div>
          <div>
            <label className="text-xs uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
              <Target className="size-3" /> Target rating
            </label>
            <Input
              type="number"
              min={800}
              max={3500}
              step={100}
              value={target}
              onChange={(e) => setTarget(Number(e.target.value))}
              className="mt-1 w-32 bg-white/[0.03] border-border/60"
            />
          </div>
          <Button
            onClick={() => mut.mutate()}
            disabled={mut.isPending || target <= (cf?.user.rating ?? 0)}
            className="bg-gradient-brand text-white border-0 shadow-glow"
          >
            {mut.isPending ? (
              <Loader2 className="size-4 mr-2 animate-spin" />
            ) : (
              <Map className="size-4 mr-2" />
            )}
            Generate roadmap
          </Button>
        </div>
      </GlassCard>

      {mut.isPending && (
        <div className="grid md:grid-cols-2 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="glass rounded-2xl p-6 space-y-3">
              <div className="skeleton h-4 w-1/3" />
              <div className="skeleton h-6 w-2/3" />
              <div className="skeleton h-3 w-full" />
              <div className="skeleton h-3 w-5/6" />
            </div>
          ))}
        </div>
      )}

      {mut.data && mut.data.milestones.length > 0 && (
        <div className="relative pl-6">
          <div className="absolute left-2 top-2 bottom-2 w-px bg-gradient-to-b from-primary via-accent to-transparent" />
          <div className="space-y-4">
            {mut.data.milestones.map((m, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.08 }}
                className="relative"
              >
                <div className="absolute -left-[14px] top-5 size-3 rounded-full bg-gradient-brand shadow-glow ring-4 ring-background" />
                <div className="glass rounded-2xl p-6">
                  <div className="flex items-start justify-between flex-wrap gap-3">
                    <div>
                      <div className="text-xs text-muted-foreground uppercase tracking-wider">
                        Milestone {i + 1} · {m.weeks} weeks
                      </div>
                      <h3 className="mt-1 font-display text-xl font-semibold">{m.title}</h3>
                    </div>
                    <div className="text-right">
                      <div className="text-xs text-muted-foreground">target</div>
                      <div className="text-2xl font-display font-semibold text-gradient-brand">
                        {m.ratingTarget}
                      </div>
                    </div>
                  </div>
                  <div className="mt-4 flex flex-wrap gap-1.5">
                    {m.topics.map((t) => (
                      <span
                        key={t}
                        className="text-[10px] rounded-md px-2 py-1 bg-primary/10 text-primary ring-1 ring-primary/20"
                      >
                        {t}
                      </span>
                    ))}
                  </div>
                  <ul className="mt-4 space-y-2">
                    {m.goals.map((g, k) => (
                      <li key={k} className="flex items-start gap-2 text-sm text-muted-foreground">
                        <Check className="size-4 text-success mt-0.5 shrink-0" />
                        <span>{g}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
