import { createFileRoute, Link } from "@tanstack/react-router";
import { motion } from "framer-motion";
import {
  ArrowRight,
  BarChart3,
  Bot,
  Calendar,
  Target,
  Sparkles,
  Zap,
  Trophy,
  CheckCircle2,
} from "lucide-react";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "CP Flow — Practice Smarter. Climb Faster." },
      {
        name: "description",
        content:
          "AI-powered Codeforces companion: personalized daily sheets, weak-topic detection, contest tracker, and an AI coach to push your rating higher.",
      },
      { property: "og:title", content: "CP Flow — Practice Smarter. Climb Faster." },
      { property: "og:description", content: "AI-powered Codeforces training companion." },
    ],
  }),
  component: Landing,
});

const features = [
  { icon: BarChart3, title: "Deep CF Analytics", desc: "Rating progress, topic strength, submission heatmap." },
  { icon: Target, title: "Weak-Topic Detection", desc: "Find the cracks in your prep, automatically." },
  { icon: Calendar, title: "Daily Smart Sheets", desc: "Problems tuned to your rating and weak tags." },
  { icon: Bot, title: "AI Coach", desc: "Gemini-powered feedback on what to study next." },
  { icon: Trophy, title: "Contest Tracker", desc: "Upcoming rounds with countdowns and bookmarks." },
  { icon: Sparkles, title: "Personal Roadmap", desc: "AI-built path from your rating to your target." },
];

function Landing() {
  return (
    <div className="min-h-screen relative overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0 grid-bg pointer-events-none" />
      <div className="absolute inset-0 bg-mesh pointer-events-none opacity-60" />

      {/* Nav */}
      <header className="relative z-10">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2">
            <div className="size-8 rounded-lg bg-gradient-brand grid place-items-center shadow-glow">
              <Zap className="size-4 text-white" />
            </div>
            <span className="font-display text-lg font-semibold tracking-tight">CP Flow</span>
          </Link>
          <nav className="hidden md:flex items-center gap-8 text-sm text-muted-foreground">
            <a href="#features" className="hover:text-foreground transition">Features</a>
            <a href="#how" className="hover:text-foreground transition">How it works</a>
            <a href="#why" className="hover:text-foreground transition">Why CP Flow</a>
          </nav>
          <Link to="/auth">
            <Button className="bg-gradient-brand hover:opacity-90 text-white border-0 shadow-glow">
              Get Started
            </Button>
          </Link>
        </div>
      </header>

      {/* Hero */}
      <section className="relative z-10 max-w-7xl mx-auto px-6 pt-20 pb-32 text-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <div className="inline-flex items-center gap-2 rounded-full glass px-3 py-1 text-xs text-muted-foreground mb-6">
            <span className="size-1.5 rounded-full bg-primary animate-pulse" />
            AI-powered Codeforces companion
          </div>
          <h1 className="text-5xl md:text-7xl font-display font-bold leading-[1.05] tracking-tight">
            Practice Smarter.<br />
            <span className="text-gradient-brand">Climb Faster.</span>
          </h1>
          <p className="mt-6 max-w-2xl mx-auto text-lg text-muted-foreground">
            CP Flow analyses your Codeforces history, surfaces your weakest topics, and ships
            a personalized daily sheet — so every solve moves your rating up.
          </p>
          <div className="mt-10 flex flex-wrap justify-center gap-3">
            <Link to="/auth">
              <Button size="lg" className="bg-gradient-brand text-white border-0 shadow-glow hover:opacity-90 h-12 px-7">
                Start free <ArrowRight className="ml-2 size-4" />
              </Button>
            </Link>
            <a href="#features">
              <Button size="lg" variant="outline" className="h-12 px-7 border-border/60 bg-white/[0.02]">
                See features
              </Button>
            </a>
          </div>
          <div className="mt-6 text-xs text-muted-foreground">No card required • Google or guest sign-in</div>
        </motion.div>

        {/* Hero mock card */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.2 }}
          className="mt-16 max-w-5xl mx-auto"
        >
          <div className="glass-strong rounded-3xl p-2 shadow-glow ring-1 ring-primary/20">
            <div className="rounded-2xl bg-card/80 p-6 md:p-10 text-left">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <div className="text-xs text-muted-foreground">Today's smart sheet</div>
                  <div className="text-2xl font-display font-semibold">5 problems · weak-tag biased</div>
                </div>
                <div className="hidden md:flex items-center gap-2 text-xs text-muted-foreground">
                  <span className="px-2 py-1 rounded-md bg-success/10 text-success">+45 this week</span>
                </div>
              </div>
              <div className="grid sm:grid-cols-2 lg:grid-cols-5 gap-3">
                {[
                  { name: "Robot Bicentennial", tag: "dp", r: 1300, d: "easy" },
                  { name: "Almost Sorted", tag: "two pointers", r: 1400, d: "easy" },
                  { name: "Tree Queries", tag: "trees", r: 1500, d: "medium" },
                  { name: "XOR Constructions", tag: "bitmasks", r: 1600, d: "medium" },
                  { name: "Prime Pursuit", tag: "number theory", r: 1800, d: "hard" },
                ].map((p, i) => (
                  <motion.div
                    key={p.name}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.4 + i * 0.05 }}
                    className="rounded-xl border border-border/60 bg-card/40 p-4"
                  >
                    <div className="flex items-center justify-between text-[10px] text-muted-foreground uppercase tracking-wider">
                      <span>{p.d}</span>
                      <span>{p.r}</span>
                    </div>
                    <div className="mt-2 text-sm font-medium leading-tight">{p.name}</div>
                    <div className="mt-3 inline-flex items-center text-xs text-primary">
                      <span className="size-1.5 rounded-full bg-primary mr-1.5" />{p.tag}
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>
          </div>
        </motion.div>
      </section>

      {/* Features */}
      <section id="features" className="relative z-10 max-w-7xl mx-auto px-6 py-24">
        <div className="text-center max-w-2xl mx-auto mb-14">
          <div className="text-sm text-primary font-medium mb-3">Built for serious climbers</div>
          <h2 className="text-4xl md:text-5xl font-display font-semibold tracking-tight">
            Everything you need to <span className="text-gradient-brand">level up</span>
          </h2>
        </div>
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {features.map((f, i) => {
            const Icon = f.icon;
            return (
              <motion.div
                key={f.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-50px" }}
                transition={{ delay: i * 0.05 }}
                className="glass rounded-2xl p-6 hover:bg-white/[0.03] hover:border-white/10 transition-all"
              >
                <div className="size-10 rounded-xl bg-primary/10 ring-1 ring-primary/20 grid place-items-center mb-4">
                  <Icon className="size-5 text-primary" />
                </div>
                <h3 className="font-display font-semibold text-lg">{f.title}</h3>
                <p className="mt-2 text-sm text-muted-foreground leading-relaxed">{f.desc}</p>
              </motion.div>
            );
          })}
        </div>
      </section>

      {/* How */}
      <section id="how" className="relative z-10 max-w-5xl mx-auto px-6 py-24">
        <div className="text-center mb-14">
          <div className="text-sm text-primary font-medium mb-3">Three steps</div>
          <h2 className="text-4xl md:text-5xl font-display font-semibold tracking-tight">From signup to first solve in 60s</h2>
        </div>
        <div className="grid md:grid-cols-3 gap-4">
          {[
            { n: "01", t: "Connect handle", d: "Drop your Codeforces handle. We pull your full submission history." },
            { n: "02", t: "Get your analysis", d: "Strong & weak tags surface instantly with deep charts." },
            { n: "03", t: "Solve today's sheet", d: "AI picks problems for your rating and gaps — no doom-scrolling." },
          ].map((s, i) => (
            <motion.div
              key={s.n}
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.08 }}
              className="glass rounded-2xl p-6"
            >
              <div className="text-3xl font-display text-gradient-brand font-bold">{s.n}</div>
              <div className="mt-3 font-semibold">{s.t}</div>
              <p className="mt-2 text-sm text-muted-foreground">{s.d}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Why */}
      <section id="why" className="relative z-10 max-w-5xl mx-auto px-6 py-24">
        <div className="glass-strong rounded-3xl p-10 md:p-14 ring-1 ring-primary/10">
          <div className="grid md:grid-cols-2 gap-10 items-center">
            <div>
              <h2 className="text-3xl md:text-4xl font-display font-semibold tracking-tight">
                Stop solving <span className="line-through text-muted-foreground">random</span> problems.<br />
                Start solving <span className="text-gradient-brand">the right ones.</span>
              </h2>
              <p className="mt-4 text-muted-foreground">
                The average competitive programmer plateaus because they repeat what they're already
                good at. CP Flow forces deliberate practice on your weakest tags.
              </p>
            </div>
            <ul className="space-y-3">
              {[
                "Personalized daily sheets",
                "Weak-tag prioritization",
                "Gemini-powered AI coach",
                "Rating-targeted roadmaps",
                "Contest countdown & bookmarks",
                "Submission heatmap & analytics",
              ].map((x) => (
                <li key={x} className="flex items-center gap-3 text-sm">
                  <CheckCircle2 className="size-4 text-success shrink-0" />
                  <span>{x}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="relative z-10 max-w-3xl mx-auto px-6 py-24 text-center">
        <h2 className="text-4xl md:text-5xl font-display font-semibold tracking-tight">
          Your next rating <span className="text-gradient-brand">starts now</span>.
        </h2>
        <p className="mt-4 text-muted-foreground">Join CP Flow and turn practice into a system.</p>
        <Link to="/auth" className="inline-block mt-8">
          <Button size="lg" className="bg-gradient-brand text-white border-0 shadow-glow hover:opacity-90 h-12 px-8">
            Start practicing <ArrowRight className="ml-2 size-4" />
          </Button>
        </Link>
      </section>

      <footer className="relative z-10 border-t border-border/40 py-8 text-center text-xs text-muted-foreground">
        Built for the Codeforces community · CP Flow © {new Date().getFullYear()}
      </footer>
    </div>
  );
}
