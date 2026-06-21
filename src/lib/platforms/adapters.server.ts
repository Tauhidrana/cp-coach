// Server-side platform adapters. Each adapter fetches a normalized PlatformStats
// snapshot. Manual-only platforms throw if used.

import type { PlatformId, PlatformStats } from "./registry";

const UA = "Mozilla/5.0 CPCoach/1.0";

async function jget<T>(url: string): Promise<T> {
  const res = await fetch(url, { headers: { "User-Agent": UA } });
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
      "User-Agent": UA,
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
    headers: { "User-Agent": UA },
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

// ---------- CodeChef ----------
// CodeChef has no official public API. We scrape the public profile page.
// The adapter is intentionally tolerant: if a field can't be parsed we leave it null
// instead of failing the whole sync.
async function fetchCodeChef(username: string): Promise<PlatformStats> {
  const url = `https://www.codechef.com/users/${encodeURIComponent(username)}`;
  const res = await fetch(url, {
    headers: {
      "User-Agent": UA,
      Accept: "text/html,application/xhtml+xml",
      "Accept-Language": "en-US,en;q=0.9",
    },
  });
  if (res.status === 404) throw new Error("CodeChef user not found");
  if (!res.ok) throw new Error(`CodeChef ${res.status}`);
  const html = await res.text();

  // Validate we landed on a real profile (CodeChef returns 200 for unknown users sometimes)
  if (!/class=["'][^"']*user-details/.test(html) && !/rating-number/.test(html)) {
    throw new Error("CodeChef profile not accessible (private or invalid)");
  }

  const pick = (re: RegExp): string | null => {
    const m = html.match(re);
    return m ? m[1].trim() : null;
  };
  const toInt = (s: string | null) => {
    if (!s) return null;
    const n = parseInt(s.replace(/[^\d-]/g, ""), 10);
    return Number.isFinite(n) ? n : null;
  };

  // Current rating (visible in the big circle on the profile)
  const rating = toInt(pick(/<div[^>]*class="rating-number"[^>]*>\s*(\d+)/i));

  // Highest rating: "Highest Rating&nbsp;1234"
  const maxRating =
    toInt(pick(/Highest\s+Rating[^0-9]*?(\d{3,4})/i)) ?? rating;

  // Stars: "5★" inside .rating
  const star =
    pick(/<span[^>]*class="rating"[^>]*>\s*(\d)\s*★/i) ||
    pick(/(\d)\s*★/);
  const rankLabel = star ? `${star}★` : null;

  // Problems solved: page contains "Total Problems Solved: 123"
  const solved =
    toInt(pick(/Total\s+Problems\s+Solved\s*:?\s*<\/h3>\s*<h5[^>]*>\s*(\d+)/i)) ??
    toInt(pick(/Total\s+Problems\s+Solved\s*[:<][^0-9]*?(\d+)/i)) ??
    0;

  // Contests attended: count of all_rating[] entries embedded in JS
  let contestCount = 0;
  const arrMatch = html.match(/all_rating\s*=\s*(\[[\s\S]*?\])\s*;/);
  if (arrMatch) {
    try {
      // Replace trailing commas / single quotes minimally before JSON parse fails — try eval-safe parse
      const arr = JSON.parse(arrMatch[1].replace(/'/g, '"'));
      if (Array.isArray(arr)) contestCount = arr.length;
    } catch {
      // Fall back to counting "code" entries
      contestCount = (arrMatch[1].match(/"code"\s*:/g) || []).length;
    }
  }

  // Country & global rank (best-effort)
  const country = pick(/<span[^>]*class="user-country-name"[^>]*>\s*([^<]+)</i);
  const globalRank = toInt(pick(/Global\s+Rank[\s\S]*?<strong>\s*(\d+)/i));
  const countryRank = toInt(pick(/Country\s+Rank[\s\S]*?<strong>\s*(\d+)/i));

  return {
    rating,
    maxRating,
    rankLabel,
    problemsSolved: solved,
    contestCount,
    raw: { country, globalRank, countryRank, stars: star },
  };
}

// ---------- HackerRank ----------
// HackerRank exposes JSON via /rest/hackers/{user}/* endpoints used by their own site.
// No official API, but the endpoints are public and CORS-open. Adapter is tolerant —
// fields default to null/0 if the endpoint changes.
async function fetchHackerRank(username: string): Promise<PlatformStats> {
  const u = encodeURIComponent(username);
  const headers = {
    "User-Agent": UA,
    Accept: "application/json",
    Referer: `https://www.hackerrank.com/profile/${u}`,
  };

  const get = async <T,>(path: string): Promise<T | null> => {
    try {
      const res = await fetch(`https://www.hackerrank.com${path}`, { headers });
      if (!res.ok) return null;
      return (await res.json()) as T;
    } catch {
      return null;
    }
  };

  const profile = await get<{ model?: any; status?: boolean }>(`/rest/hackers/${u}/profile`);
  if (!profile?.model && profile?.status === false) throw new Error("HackerRank user not found");
  const model = profile?.model ?? {};

  const [scoresRes, badgesRes, submissionsRes, certsRes] = await Promise.all([
    get<{ models?: Array<{ track?: { name?: string }; practice?: { score?: number; solved?: number } }> }>(
      `/rest/hackers/${u}/scores_elo`,
    ),
    get<{ models?: Array<{ badge_name?: string; stars?: number; level?: number }> }>(
      `/rest/hackers/${u}/badges`,
    ),
    get<{ models?: any[]; total?: number }>(`/rest/hackers/${u}/recent_challenges?limit=10`),
    get<{ models?: any[] }>(`/rest/hackers/${u}/certificates`),
  ]);

  const tracks = scoresRes?.models ?? [];
  const totalScore = tracks.reduce((a, t) => a + (t.practice?.score ?? 0), 0);
  const problemsSolved = tracks.reduce((a, t) => a + (t.practice?.solved ?? 0), 0);

  const badges = badgesRes?.models ?? [];
  const totalStars = badges.reduce((a, b) => a + (b.stars ?? 0), 0);
  const topStars = badges.reduce((a, b) => Math.max(a, b.stars ?? 0), 0);

  const recent = submissionsRes?.models ?? [];
  const certificates = certsRes?.models ?? [];

  const rating = Math.round(totalScore) || null;
  const rankLabel = topStars > 0 ? `${topStars}★` : null;

  return {
    rating,
    maxRating: rating,
    rankLabel,
    problemsSolved,
    contestCount: 0,
    raw: {
      name: model.name ?? null,
      avatar: model.avatar ?? null,
      country: model.country ?? null,
      followers: model.followers_count ?? null,
      badges: badges.map((b) => ({ name: b.badge_name, stars: b.stars, level: b.level })),
      totalStars,
      certificates: certificates.length,
      recentActivity: recent.slice(0, 5).map((r: any) => ({
        challenge: r?.name ?? r?.challenge?.name ?? null,
        track: r?.track_name ?? null,
        at: r?.created_at ?? null,
      })),
      tracks: tracks.map((t) => ({
        name: t.track?.name,
        score: t.practice?.score,
        solved: t.practice?.solved,
      })),
    },
  };
}

export async function fetchPlatformStats(platform: PlatformId, username: string): Promise<PlatformStats> {
  switch (platform) {
    case "codeforces": return fetchCodeforces(username);
    case "leetcode":   return fetchLeetCode(username);
    case "atcoder":    return fetchAtCoder(username);
    case "codechef":   return fetchCodeChef(username);
    case "hackerrank": return fetchHackerRank(username);
    default:
      throw new Error(`Platform ${platform} requires manual entry`);
  }
}
