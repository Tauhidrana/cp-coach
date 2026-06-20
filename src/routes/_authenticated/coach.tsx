import { createFileRoute, Link } from "@tanstack/react-router";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import ReactMarkdown from "react-markdown";
import { motion } from "framer-motion";
import { Bot, Sparkles, Loader2 } from "lucide-react";
import { aiCoachAnalysis, getMyProfile } from "@/lib/cp.functions";
import { GlassCard } from "@/components/glass-card";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/_authenticated/coach")({
  head: () => ({
    meta: [
      { title: "AI Coach — CP Flow" },
      { name: "description", content: "Personalized AI coaching feedback for your Codeforces journey." },
    ],
  }),
  component: CoachPage,
});

function CoachPage() {
  const profileFn = useServerFn(getMyProfile);
  const coachFn = useServerFn(aiCoachAnalysis);
  const { data: profile } = useQuery({ queryKey: ["profile"], queryFn: () => profileFn() });
  const handle = profile?.codeforces_handle ?? "";

  const mut = useMutation({ mutationFn: () => coachFn({ data: { handle } }) });

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
      <div>
        <h1 className="text-3xl font-display font-semibold flex items-center gap-3">
          AI Coach
          <span className="inline-flex items-center gap-1 text-xs font-normal px-2 py-1 rounded-full bg-primary/15 text-primary ring-1 ring-primary/30">
            <Sparkles className="size-3" /> Gemini-powered
          </span>
        </h1>
        <p className="text-muted-foreground mt-1">A grandmaster-tier perspective on your progress.</p>
      </div>

      <GlassCard className="relative overflow-hidden">
        <div className="absolute -top-12 -right-12 size-48 rounded-full bg-primary/15 blur-3xl pointer-events-none" />
        <div className="flex items-center gap-4">
          <div className="size-12 rounded-xl bg-gradient-brand grid place-items-center shadow-glow">
            <Bot className="size-6 text-white" />
          </div>
          <div className="flex-1">
            <h3 className="font-display text-lg font-semibold">Run a coaching session</h3>
            <p className="text-sm text-muted-foreground">We'll analyze your topics, contests, and rating velocity, then return an actionable plan.</p>
          </div>
          <Button
            onClick={() => mut.mutate()}
            disabled={mut.isPending}
            className="bg-gradient-brand text-white border-0 shadow-glow shrink-0"
          >
            {mut.isPending ? <Loader2 className="size-4 mr-2 animate-spin" /> : <Sparkles className="size-4 mr-2" />}
            Analyze me
          </Button>
        </div>
      </GlassCard>

      {mut.isPending && (
        <GlassCard>
          <div className="flex items-center gap-3 text-sm text-muted-foreground">
            <Loader2 className="size-4 animate-spin text-primary" />
            Crunching your submissions and asking Gemini for the play…
          </div>
          <div className="mt-4 space-y-2.5">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className={`skeleton h-3 ${i % 3 === 0 ? "w-2/3" : i % 3 === 1 ? "w-5/6" : "w-3/4"}`} />
            ))}
          </div>
        </GlassCard>
      )}

      {mut.data && (
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
          <GlassCard>
            <article className="prose prose-invert prose-headings:font-display prose-headings:tracking-tight prose-h2:text-xl prose-h2:mt-6 prose-h2:mb-2 prose-strong:text-foreground prose-li:my-0.5 prose-p:text-muted-foreground prose-a:text-primary max-w-none">
              <ReactMarkdown>{mut.data.report}</ReactMarkdown>
            </article>
          </GlassCard>
        </motion.div>
      )}

      {mut.error && (
        <GlassCard>
          <p className="text-sm text-destructive">AI coach is unavailable right now. Try again in a moment.</p>
        </GlassCard>
      )}
    </div>
  );
}
