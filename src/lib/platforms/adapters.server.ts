// Server-side platform adapters. Each adapter fetches a normalized PlatformStats
// snapshot. Manual-only platforms throw if used.

import type { PlatformId, PlatformStats } from "./registry";

async function jget<T>(url: string): Promise<T> {
  const res = await fetch(url, { headers: { "User-Agent": "CPFlow/1.0" } });
  if (!res.ok) throw new Error(`Upstream ${res.status}`);
  return (await res.json()) as T;
}

// ---------- Codeforces ----------
async function fetchCodeforces(handle: string): Promise<PlatformStats> {
  const u = encodeURIComponent(handle);
  const userRes = await jget<{ status: string; result: any[]; comment?: string }>(
    `https://codeforces.com/api/user.info?handles=${u}`,
  );
  if (userRes.status !== "OK") throw new Error(userRes.comment || "Codeforces error");
  const user = userRes.result[0];

  const [statusRes, ratingRes] = await Promise.all([
    jget<{ status: string; result: any[] }>(
      `https://codeforces.com/api/user.status?handle=${u}&from=1&count=3000`,
    ),
    jget<{ status: string; result: any[] }>(`https://codeforces.com/api/user.rating?handle=${u}`),
  ]);
  const solved = new Set<string>();
  for (const s of statusRes.result) {
    if (s.verdict === "OK") solved.add(`${s.problem.contestId ?? "x"}-${s.problem.index}`);
  }
  return {
    rating: user.rating ?? null,
    maxRating: user.maxRating ?? null,
    rankLabel: user.rank ?? null,
    problemsSolved: solved.size,
    contestCount: ratingRes.result.length,
    raw: {
      avatar: user.titlePhoto || user.avatar,
      contribution: user.contribution,
      friendOfCount: user.friendOfCount,
      country: user.country,
    },
  };
}

// ---------- LeetCode ----------
async function fetchLeetCode(username: string): Promise<PlatformStats> {
  const query = `
    query userPublicProfile($username: String!) {
      matchedUser(username: $username) {
        username
        profile { ranking reputation realName countryName }
        submitStatsGlobal { acSubmissionNum { difficulty count } }
      }
      userContestRanking(username: $username) {
        attendedContestsCount
        rating
        globalRanking
        topPercentage
      }
    }`;
  const res = await fetch("https://leetcode.com/graphql", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "User-Agent": "Mozilla/5.0 CPFlow/1.0",
      Referer: `https://leetcode.com/${username}/`,
    },
    body: JSON.stringify({ query, variables: { username } }),
  });
  if (!res.ok) throw new Error(`LeetCode ${res.status}`);
  const json = (await res.json()) as any;
  const user = json?.data?.matchedUser;
  if (!user) throw new Error("LeetCode user not found");
  const contest = json?.data?.userContestRanking;
  const all = (user.submitStatsGlobal?.acSubmissionNum ?? []).find((x: any) => x.difficulty === "All");
  const solved = all?.count ?? 0;
  const rating = contest?.rating ? Math.round(contest.rating) : null;

  // Synthetic rank label from rating tier
  let rankLabel: string | null = null;
  if (rating != null) {
    if (rating >= 2400) rankLabel = "Guardian";
    else if (rating >= 1900) rankLabel = "Knight";
    else if (rating >= 1600) rankLabel = "Expert";
    else if (rating >= 1300) rankLabel = "Specialist";
    else rankLabel = "Pupil";
  }

  return {
    rating,
    maxRating: rating,
    rankLabel,
    problemsSolved: solved,
    contestCount: contest?.attendedContestsCount ?? 0,
    raw: {
      ranking: user.profile?.ranking,
      country: user.profile?.countryName,
      topPercentage: contest?.topPercentage,
      globalRanking: contest?.globalRanking,
    },
  };
}

// ---------- AtCoder ----------
async function fetchAtCoder(username: string): Promise<PlatformStats> {
  // Rating history (official AtCoder JSON)
  const historyRes = await fetch(`https://atcoder.jp/users/${encodeURIComponent(username)}/history/json`, {
    headers: { "User-Agent": "Mozilla/5.0 CPFlow/1.0" },
  });
  if (!historyRes.ok) throw new Error(`AtCoder ${historyRes.status}`);
  const history = (await historyRes.json()) as Array<{
    NewRating: number;
    IsRated: boolean;
    ContestName: string;
    EndTime: string;
  }>;

  let current = 0;
  let max = 0;
  let contests = 0;
  for (const h of history) {
    if (!h.IsRated) continue;
    contests++;
    current = h.NewRating;
    if (h.NewRating > max) max = h.NewRating;
  }

  // Solved problems via kenkoooo dataset
  let solved = 0;
  try {
    const acRes = await jget<Array<{ user_id: string; problem_count: number }>>(
      `https://kenkoooo.com/atcoder/atcoder-api/v3/user/ac_rank?user=${encodeURIComponent(username)}`,
    );
    solved = acRes[0]?.problem_count ?? 0;
  } catch {
    // tolerate failure
  }

  // Color rank
  let rankLabel: string | null = null;
  if (current > 0) {
    if (current >= 2800) rankLabel = "Red";
    else if (current >= 2400) rankLabel = "Orange";
    else if (current >= 2000) rankLabel = "Yellow";
    else if (current >= 1600) rankLabel = "Blue";
    else if (current >= 1200) rankLabel = "Cyan";
    else if (current >= 800) rankLabel = "Green";
    else if (current >= 400) rankLabel = "Brown";
    else rankLabel = "Gray";
  }

  return {
    rating: current || null,
    maxRating: max || null,
    rankLabel,
    problemsSolved: solved,
    contestCount: contests,
    raw: { history: history.length },
  };
}

export async function fetchPlatformStats(platform: PlatformId, username: string): Promise<PlatformStats> {
  switch (platform) {
    case "codeforces": return fetchCodeforces(username);
    case "leetcode":   return fetchLeetCode(username);
    case "atcoder":    return fetchAtCoder(username);
    default:
      throw new Error(`Platform ${platform} requires manual entry`);
  }
}
