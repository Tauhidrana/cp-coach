// CP Coach Score — proprietary 0-100 score across all connected platforms.
// Weights: CF 35%, LC 25%, AC 20%, manual platforms together 20%.
// Consistency bonus from contest cadence.

import type { PlatformId } from "./platforms/registry";

export interface PlatformRow {
  platform: string;
  rating: number | null;
  max_rating: number | null;
  problems_solved: number;
  contest_count: number;
}

const WEIGHTS: Record<string, number> = {
  codeforces: 0.35,
  leetcode: 0.25,
  atcoder: 0.20,
  codechef: 0.05,
  hackerrank: 0.05,
  gfg: 0.05,
  "coding-ninjas": 0.05,
};

// Map rating → 0..1
function normalizeRating(p: string, rating: number | null): number {
  if (!rating || rating <= 0) return 0;
  switch (p) {
    case "codeforces": return clamp(rating / 3000);
    case "leetcode":   return clamp((rating - 1300) / (2700 - 1300));
    case "atcoder":    return clamp(rating / 2800);
    case "codechef":   return clamp(rating / 2500); // CodeChef stars: 2500 = 7★
    default:           return clamp(rating / 2500);
  }
}

function clamp(x: number) { return Math.max(0, Math.min(1, x)); }

export interface CPFlowScore {
  score: number;       // 0..100
  tier: "Beginner" | "Intermediate" | "Advanced" | "Expert";
  breakdown: { platform: string; weight: number; contribution: number }[];
  totalSolved: number;
  totalContests: number;
}

export function computeCPFlowScore(rows: PlatformRow[]): CPFlowScore {
  let raw = 0;
  let totalWeight = 0;
  const breakdown: { platform: string; weight: number; contribution: number }[] = [];

  for (const r of rows) {
    const w = WEIGHTS[r.platform] ?? 0.05;
    const n = normalizeRating(r.platform, r.rating);
    const c = n * w;
    raw += c;
    totalWeight += w;
    breakdown.push({ platform: r.platform, weight: w, contribution: c });
  }

  // Rebase against actually connected platforms so a single CF expert isn't punished
  const base = totalWeight > 0 ? raw / totalWeight : 0;

  // Volume + consistency bonus (up to +0.15)
  const totalSolved = rows.reduce((a, r) => a + (r.problems_solved || 0), 0);
  const totalContests = rows.reduce((a, r) => a + (r.contest_count || 0), 0);
  const volumeBonus = clamp(totalSolved / 1500) * 0.10;
  const contestBonus = clamp(totalContests / 60) * 0.05;

  const score = Math.round(Math.min(1, base + volumeBonus + contestBonus) * 100);

  let tier: CPFlowScore["tier"];
  if (score >= 80) tier = "Expert";
  else if (score >= 55) tier = "Advanced";
  else if (score >= 30) tier = "Intermediate";
  else tier = "Beginner";

  return { score, tier, breakdown, totalSolved, totalContests };
}

export function tierGradient(tier: CPFlowScore["tier"]) {
  switch (tier) {
    case "Expert":       return "from-fuchsia-400 via-purple-400 to-blue-400";
    case "Advanced":     return "from-purple-400 to-blue-400";
    case "Intermediate": return "from-blue-400 to-cyan-400";
    default:             return "from-cyan-400 to-emerald-400";
  }
}

export type { PlatformId };
