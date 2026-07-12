import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useEffect, useState } from "react";
import { Bookmark, BookmarkCheck, Calendar, Clock, ExternalLink } from "lucide-react";
import { getContests, listBookmarks, toggleBookmark } from "@/lib/cp.functions";
import { GlassCard } from "@/components/glass-card";
import { CardSkeleton } from "@/components/skeletons";

export const Route = createFileRoute("/_authenticated/contests")({
  head: () => ({
    meta: [
      { title: "Contests — CP Coach" },
      { name: "description", content: "Upcoming Codeforces contests with countdowns." },
    ],
  }),
  component: ContestsPage,
});

function fmtDuration(s: number) {
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  return `${h}h${m ? ` ${m}m` : ""}`;
}

function useCountdown(target: number) {
  const [now, setNow] = useState(() => Math.floor(Date.now() / 1000));
  useEffect(() => {
    const id = setInterval(() => setNow(Math.floor(Date.now() / 1000)), 1000);
    return () => clearInterval(id);
  }, []);
  const diff = Math.max(0, target - now);
  const d = Math.floor(diff / 86400);
  const h = Math.floor((diff % 86400) / 3600);
  const m = Math.floor((diff % 3600) / 60);
  const sec = diff % 60;
  return { d, h, m, s: sec, done: diff === 0 };
}

function ContestsPage() {
  const qc = useQueryClient();
  const fn = useServerFn(getContests);
  const listFn = useServerFn(listBookmarks);
  const toggleFn = useServerFn(toggleBookmark);

  const { data, isLoading } = useQuery({ queryKey: ["contests"], queryFn: () => fn() });
  const { data: bookmarks } = useQuery({ queryKey: ["bookmarks"], queryFn: () => listFn() });
  const bookmarkSet = new Set(bookmarks ?? []);

  const mut = useMutation({
    mutationFn: (vars: {
      contest_id: number;
      contest_name: string;
      start_time: string;
      bookmark: boolean;
    }) => toggleFn({ data: vars }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["bookmarks"] }),
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-display font-semibold">Contest Tracker</h1>
        <p className="text-muted-foreground mt-1">
          All upcoming Codeforces rounds with live countdowns.
        </p>
      </div>

      <h2 className="text-lg font-display font-semibold">Upcoming Contests</h2>

      {isLoading ? (
        <div className="grid md:grid-cols-2 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <CardSkeleton key={i} />
          ))}
        </div>
      ) : (
        <div className="grid md:grid-cols-2 gap-4">
          {data?.upcoming.length === 0 && (
            <GlassCard>
              <p className="text-sm text-muted-foreground">No upcoming contests right now.</p>
            </GlassCard>
          )}
          {data?.upcoming.map((c) => (
            <ContestCard
              key={c.id}
              contest={c}
              bookmarked={bookmarkSet.has(c.id)}
              onToggle={(b) =>
                mut.mutate({
                  contest_id: c.id,
                  contest_name: c.name,
                  start_time: new Date((c.startTimeSeconds ?? 0) * 1000).toISOString(),
                  bookmark: b,
                })
              }
            />
          ))}
        </div>
      )}

      {data?.recent && data.recent.length > 0 && (
        <div>
          <h2 className="text-lg font-display font-semibold mt-8 mb-3">Recent</h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-3">
            {data.recent.map((c) => (
              <a
                key={c.id}
                href={`https://codeforces.com/contest/${c.id}`}
                target="_blank"
                rel="noreferrer"
                className="glass rounded-xl p-4 hover:bg-white/[0.04] transition"
              >
                <div className="text-xs text-muted-foreground">{c.type}</div>
                <div className="mt-1 text-sm font-medium leading-tight truncate">{c.name}</div>
                <div className="mt-2 text-xs text-muted-foreground inline-flex items-center gap-1">
                  Standings <ExternalLink className="size-3" />
                </div>
              </a>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function ContestCard({
  contest,
  bookmarked,
  onToggle,
}: {
  contest: {
    id: number;
    name: string;
    type: string;
    durationSeconds: number;
    startTimeSeconds?: number;
  };
  bookmarked: boolean;
  onToggle: (b: boolean) => void;
}) {
  const start = contest.startTimeSeconds ?? 0;
  const cd = useCountdown(start);
  return (
    <GlassCard hover>
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="text-[10px] uppercase tracking-wider text-primary font-medium">
            {contest.type}
          </div>
          <h3 className="mt-1 font-medium leading-tight">{contest.name}</h3>
          <div className="mt-3 text-xs text-muted-foreground flex flex-wrap gap-x-4 gap-y-1">
            <span className="inline-flex items-center gap-1">
              <Calendar className="size-3" />
              {new Date(start * 1000).toLocaleString()}
            </span>
            <span className="inline-flex items-center gap-1">
              <Clock className="size-3" />
              {fmtDuration(contest.durationSeconds)}
            </span>
          </div>
        </div>
        <button
          onClick={() => onToggle(!bookmarked)}
          className={`shrink-0 size-9 rounded-lg grid place-items-center ring-1 transition ${
            bookmarked
              ? "bg-primary/15 ring-primary/40 text-primary"
              : "bg-white/[0.03] ring-white/[0.08] text-muted-foreground hover:text-foreground"
          }`}
          aria-label={bookmarked ? "Remove bookmark" : "Bookmark"}
        >
          {bookmarked ? <BookmarkCheck className="size-4" /> : <Bookmark className="size-4" />}
        </button>
      </div>

      <div className="mt-4 grid grid-cols-4 gap-2">
        {[
          { v: cd.d, l: "days" },
          { v: cd.h, l: "hrs" },
          { v: cd.m, l: "min" },
          { v: cd.s, l: "sec" },
        ].map((x) => (
          <div
            key={x.l}
            className="rounded-lg bg-white/[0.03] border border-white/[0.06] py-2 text-center"
          >
            <div className="text-xl font-display font-semibold tabular-nums">
              {String(x.v).padStart(2, "0")}
            </div>
            <div className="text-[10px] uppercase text-muted-foreground tracking-wider">{x.l}</div>
          </div>
        ))}
      </div>

      <a
        href={`https://codeforces.com/contests/${contest.id}`}
        target="_blank"
        rel="noreferrer"
        className="mt-4 inline-flex items-center gap-1 text-xs text-primary hover:underline"
      >
        Register / view <ExternalLink className="size-3" />
      </a>
    </GlassCard>
  );
}
