// Codeforces API helpers. Public API, no auth needed.
// https://codeforces.com/apiHelp

export interface CFUser {
  handle: string;
  firstName?: string;
  lastName?: string;
  country?: string;
  city?: string;
  organization?: string;
  contribution: number;
  rank: string;
  rating: number;
  maxRank: string;
  maxRating: number;
  avatar: string;
  titlePhoto: string;
  friendOfCount: number;
  lastOnlineTimeSeconds: number;
  registrationTimeSeconds: number;
}

export interface CFRatingChange {
  contestId: number;
  contestName: string;
  handle: string;
  rank: number;
  ratingUpdateTimeSeconds: number;
  oldRating: number;
  newRating: number;
}

export interface CFProblem {
  contestId?: number;
  index: string;
  name: string;
  rating?: number;
  tags: string[];
}

export interface CFSubmission {
  id: number;
  contestId?: number;
  creationTimeSeconds: number;
  problem: CFProblem;
  verdict?: string;
  programmingLanguage: string;
}

export interface CFContest {
  id: number;
  name: string;
  type: string;
  phase: string;
  durationSeconds: number;
  startTimeSeconds?: number;
}

const BASE = "https://codeforces.com/api";

async function cfGet<T>(path: string): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    headers: { "User-Agent": "CPFlow/1.0" },
  });
  if (!res.ok) throw new Error(`Codeforces API error: ${res.status}`);
  const json = (await res.json()) as { status: string; comment?: string; result: T };
  if (json.status !== "OK") throw new Error(json.comment || "Codeforces API error");
  return json.result;
}

export const cf = {
  userInfo: (handle: string) =>
    cfGet<CFUser[]>(`/user.info?handles=${encodeURIComponent(handle)}`).then((r) => r[0]),
  userRating: (handle: string) =>
    cfGet<CFRatingChange[]>(`/user.rating?handle=${encodeURIComponent(handle)}`),
  userStatus: (handle: string, count = 2000) =>
    cfGet<CFSubmission[]>(`/user.status?handle=${encodeURIComponent(handle)}&from=1&count=${count}`),
  problemset: () =>
    cfGet<{ problems: CFProblem[]; problemStatistics: { contestId: number; index: string; solvedCount: number }[] }>(
      `/problemset.problems`,
    ),
  contestList: () => cfGet<CFContest[]>(`/contest.list?gym=false`),
};

// ---------- Analysis helpers ----------

const TOPIC_TAGS = [
  "dp",
  "greedy",
  "graphs",
  "trees",
  "binary search",
  "two pointers",
  "number theory",
  "math",
  "strings",
  "implementation",
  "constructive algorithms",
  "bitmasks",
  "data structures",
  "dfs and similar",
  "sortings",
  "combinatorics",
  "geometry",
  "hashing",
  "shortest paths",
  "dsu",
];

export interface TopicStat {
  tag: string;
  solved: number;
  attempted: number;
  accuracy: number;
  avgRating: number;
  score: number; // 0-100 strength
}

export function analyzeSubmissions(subs: CFSubmission[], userRating: number) {
  const solved = new Set<string>();
  const solvedByTag = new Map<string, { solved: Set<string>; attempted: Set<string>; ratings: number[] }>();
  for (const tag of TOPIC_TAGS) {
    solvedByTag.set(tag, { solved: new Set(), attempted: new Set(), ratings: [] });
  }

  const submissionsByDay = new Map<string, number>();
  const submissionsByMonth = new Map<string, number>();

  for (const s of subs) {
    const pid = `${s.problem.contestId ?? "x"}-${s.problem.index}`;
    const day = new Date(s.creationTimeSeconds * 1000).toISOString().slice(0, 10);
    submissionsByDay.set(day, (submissionsByDay.get(day) ?? 0) + 1);
    const month = day.slice(0, 7);
    submissionsByMonth.set(month, (submissionsByMonth.get(month) ?? 0) + 1);

    for (const t of s.problem.tags) {
      if (!solvedByTag.has(t)) continue;
      const entry = solvedByTag.get(t)!;
      entry.attempted.add(pid);
      if (s.verdict === "OK") {
        entry.solved.add(pid);
        if (s.problem.rating) entry.ratings.push(s.problem.rating);
      }
    }
    if (s.verdict === "OK") solved.add(pid);
  }

  const topics: TopicStat[] = [];
  for (const [tag, e] of solvedByTag) {
    const solvedN = e.solved.size;
    const attempted = e.attempted.size;
    const avgRating = e.ratings.length ? e.ratings.reduce((a, b) => a + b, 0) / e.ratings.length : 0;
    const accuracy = attempted ? solvedN / attempted : 0;
    // strength score: volume + avg rating vs user rating
    const volumeScore = Math.min(1, solvedN / 30); // 30+ solved = max volume
    const ratingScore = userRating > 0 ? Math.min(1.2, avgRating / Math.max(800, userRating)) : 0.5;
    const score = Math.round((volumeScore * 0.55 + accuracy * 0.2 + ratingScore * 0.25) * 100);
    topics.push({ tag, solved: solvedN, attempted, accuracy, avgRating, score });
  }
  topics.sort((a, b) => b.score - a.score);

  const ratingDistribution = new Map<number, number>();
  for (const s of subs) {
    if (s.verdict === "OK" && s.problem.rating) {
      const b = Math.floor(s.problem.rating / 100) * 100;
      ratingDistribution.set(b, (ratingDistribution.get(b) ?? 0) + 1);
    }
  }

  return {
    totalSolved: solved.size,
    solvedSet: solved,
    topics,
    submissionsByDay: Array.from(submissionsByDay.entries()).sort(),
    submissionsByMonth: Array.from(submissionsByMonth.entries()).sort(),
    ratingDistribution: Array.from(ratingDistribution.entries()).sort((a, b) => a[0] - b[0]),
  };
}
