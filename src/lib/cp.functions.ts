import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { z } from "zod";
import { cf, analyzeSubmissions, type CFProblem } from "./codeforces";

// ---- Codeforces data fetch (with simple in-memory cache per worker) ----

type CacheEntry<T> = { at: number; data: T };
const cache = new Map<string, CacheEntry<unknown>>();
const TTL_MS = 5 * 60 * 1000;

async function cached<T>(key: string, fetcher: () => Promise<T>): Promise<T> {
  const hit = cache.get(key) as CacheEntry<T> | undefined;
  if (hit && Date.now() - hit.at < TTL_MS) return hit.data;
  const data = await fetcher();
  cache.set(key, { at: Date.now(), data });
  return data;
}

export const getCFProfile = createServerFn({ method: "GET" })
  .inputValidator((d: unknown) => z.object({ handle: z.string().min(1).max(64) }).parse(d))
  .handler(async ({ data }) => {
    const handle = data.handle.trim();
    const [user, ratingHistory, submissions] = await Promise.all([
      cached(`u:${handle}`, () => cf.userInfo(handle)),
      cached(`r:${handle}`, () => cf.userRating(handle)),
      cached(`s:${handle}`, () => cf.userStatus(handle, 3000)),
    ]);
    const analysis = analyzeSubmissions(submissions, user.rating ?? 0);
    return { user, ratingHistory, analysis };
  });

export const getContests = createServerFn({ method: "GET" }).handler(async () => {
  const all = await cached("contests", () => cf.contestList());
  const upcoming = all.filter((c) => c.phase === "BEFORE").sort((a, b) => (a.startTimeSeconds ?? 0) - (b.startTimeSeconds ?? 0));
  const recent = all.filter((c) => c.phase === "FINISHED").slice(0, 10);
  return { upcoming: upcoming.slice(0, 25), recent };
});

// ---- Daily sheet generator ----

export const generateSheet = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) =>
    z.object({
      handle: z.string().min(1),
      size: z.union([z.literal(5), z.literal(10), z.literal(15)]),
    }).parse(d),
  )
  .handler(async ({ data }) => {
    const [user, submissions, ps] = await Promise.all([
      cached(`u:${data.handle}`, () => cf.userInfo(data.handle)),
      cached(`s:${data.handle}`, () => cf.userStatus(data.handle, 3000)),
      cached(`pset`, () => cf.problemset()),
    ]);
    const analysis = analyzeSubmissions(submissions, user.rating ?? 0);
    const userRating = user.rating || 1200;

    // Difficulty buckets relative to user rating
    const buckets = (() => {
      if (data.size === 5) return [-200, -100, 0, 100, 200];
      if (data.size === 10) return [-300, -200, -200, -100, -100, 0, 0, 100, 200, 300];
      return [-400, -300, -300, -200, -200, -100, -100, 0, 0, 100, 100, 200, 200, 300, 400];
    })();

    // Weakest topics first
    const weakTags = analysis.topics.slice().sort((a, b) => a.score - b.score).slice(0, 6).map((t) => t.tag);
    const weakSet = new Set(weakTags);

    const isSolved = (p: CFProblem) => analysis.solvedSet.has(`${p.contestId ?? "x"}-${p.index}`);

    // Group problems by rating
    const byRating = new Map<number, CFProblem[]>();
    for (const p of ps.problems) {
      if (!p.rating || !p.contestId) continue;
      if (isSolved(p)) continue;
      const arr = byRating.get(p.rating) ?? [];
      arr.push(p);
      byRating.set(p.rating, arr);
    }
    // Shuffle deterministically by handle+day
    const seed = (data.handle + new Date().toISOString().slice(0, 10)).split("").reduce((a, c) => a + c.charCodeAt(0), 0);
    const rng = mulberry32(seed);
    for (const arr of byRating.values()) arr.sort(() => rng() - 0.5);

    const picked = new Set<string>();
    const sheet: { problem: CFProblem; weak: boolean; difficulty: "easy" | "medium" | "hard" }[] = [];
    for (const offset of buckets) {
      const target = Math.round((userRating + offset) / 100) * 100;
      const candidates = byRating.get(target) ?? [];
      // prefer weak-tag problems
      const weak = candidates.find(
        (p) => p.tags.some((t) => weakSet.has(t)) && !picked.has(`${p.contestId}-${p.index}`),
      );
      const chosen =
        weak ??
        candidates.find((p) => !picked.has(`${p.contestId}-${p.index}`)) ??
        // fallback +/-100
        (byRating.get(target + 100) ?? []).find((p) => !picked.has(`${p.contestId}-${p.index}`));
      if (chosen) {
        picked.add(`${chosen.contestId}-${chosen.index}`);
        const isWeak = chosen.tags.some((t) => weakSet.has(t));
        const diff: "easy" | "medium" | "hard" = offset <= -100 ? "easy" : offset <= 100 ? "medium" : "hard";
        sheet.push({ problem: chosen, weak: isWeak, difficulty: diff });
      }
    }
    return { sheet, weakTags };
  });

function mulberry32(a: number) {
  return function () {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// ---- AI Coach (Gemini via Lovable AI Gateway) ----

export const aiCoachAnalysis = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) => z.object({ handle: z.string().min(1) }).parse(d))
  .handler(async ({ data }) => {
    const apiKey = process.env.LOVABLE_API_KEY;
    if (!apiKey) throw new Error("AI gateway not configured");

    const [user, submissions, ratingHistory] = await Promise.all([
      cached(`u:${data.handle}`, () => cf.userInfo(data.handle)),
      cached(`s:${data.handle}`, () => cf.userStatus(data.handle, 3000)),
      cached(`r:${data.handle}`, () => cf.userRating(data.handle)),
    ]);
    const a = analyzeSubmissions(submissions, user.rating ?? 0);
    const weak = a.topics.slice().sort((x, y) => x.score - y.score).slice(0, 5);
    const strong = a.topics.slice(0, 5);

    const summary = {
      handle: user.handle,
      rating: user.rating,
      maxRating: user.maxRating,
      rank: user.rank,
      totalSolved: a.totalSolved,
      contests: ratingHistory.length,
      lastContestDelta: ratingHistory.length
        ? ratingHistory[ratingHistory.length - 1].newRating - ratingHistory[ratingHistory.length - 1].oldRating
        : 0,
      strongTopics: strong.map((t) => ({ tag: t.tag, solved: t.solved, score: t.score })),
      weakTopics: weak.map((t) => ({ tag: t.tag, solved: t.solved, score: t.score })),
      ratingDistribution: a.ratingDistribution,
    };

    const { createLovableAiGatewayProvider } = await import("./ai-gateway.server");
    const { generateText } = await import("ai");
    const gateway = createLovableAiGatewayProvider(apiKey);
    const model = gateway("google/gemini-3-flash-preview");

    const prompt = `You are an elite Competitive Programming coach for Codeforces.
Analyze this user's profile JSON and produce a concise, actionable coaching report in markdown.

User profile:
${JSON.stringify(summary, null, 2)}

Sections (use ## headings, be brief and specific, no fluff):
1. **Overall Assessment** — 2-3 sentences on current level.
2. **Strengths** — 3 bullet points referring to specific tags.
3. **Weaknesses** — 3 bullet points with concrete improvement actions.
4. **Recommended Focus This Week** — 3 bullets: topic + suggested rating range.
5. **Path to Next Rank** — short paragraph with a target rating and milestones.

Tone: direct, motivating, like a senior CP grandmaster mentoring a student. Max 350 words.`;

    const result = await generateText({ model, prompt });
    return { report: result.text, summary };
  });

// ---- Roadmap generator ----

export const generateRoadmap = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) =>
    z.object({ handle: z.string().min(1), targetRating: z.number().min(800).max(3500) }).parse(d),
  )
  .handler(async ({ data }) => {
    const apiKey = process.env.LOVABLE_API_KEY;
    if (!apiKey) throw new Error("AI gateway not configured");

    const [user, submissions] = await Promise.all([
      cached(`u:${data.handle}`, () => cf.userInfo(data.handle)),
      cached(`s:${data.handle}`, () => cf.userStatus(data.handle, 3000)),
    ]);
    const a = analyzeSubmissions(submissions, user.rating ?? 0);

    const ctx = {
      currentRating: user.rating || 0,
      targetRating: data.targetRating,
      totalSolved: a.totalSolved,
      topics: a.topics.map((t) => ({ tag: t.tag, solved: t.solved, score: t.score })),
    };

    const { createLovableAiGatewayProvider } = await import("./ai-gateway.server");
    const { generateText } = await import("ai");
    const gateway = createLovableAiGatewayProvider(apiKey);
    const model = gateway("google/gemini-3-flash-preview");

    const prompt = `Create a focused Codeforces learning roadmap from rating ${ctx.currentRating} to ${ctx.targetRating} for handle @${user.handle}.

Context: ${JSON.stringify(ctx)}

Return STRICT JSON only, no markdown fences, with shape:
{
  "milestones": [
    {
      "title": "string (e.g. Master Binary Search)",
      "ratingTarget": number,
      "weeks": number,
      "topics": ["tag1","tag2"],
      "goals": ["bullet 1","bullet 2","bullet 3"]
    }
  ]
}
Produce 5-7 milestones, ordered by progression. Prioritize the user's weakest topics first.`;

    const result = await generateText({ model, prompt });
    let parsed: { milestones: { title: string; ratingTarget: number; weeks: number; topics: string[]; goals: string[] }[] };
    try {
      const cleaned = result.text.replace(/^```json\s*/i, "").replace(/```$/g, "").trim();
      parsed = JSON.parse(cleaned);
    } catch {
      parsed = { milestones: [] };
    }
    return parsed;
  });

// ---- Profile (Lovable Cloud) ----

export const getMyProfile = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const [{ data: profile, error: pErr }, { data: cfRow }] = await Promise.all([
      context.supabase
        .from("profiles")
        .select("codeforces_handle, display_name, target_rating")
        .eq("id", context.userId)
        .maybeSingle(),
      context.supabase
        .from("user_platforms")
        .select("username")
        .eq("user_id", context.userId)
        .eq("platform", "codeforces")
        .maybeSingle(),
    ]);
    if (pErr) throw pErr;
    // Prefer the platform connection; fall back to legacy profile field.
    const handle = cfRow?.username ?? profile?.codeforces_handle ?? null;
    return {
      codeforces_handle: handle,
      display_name: profile?.display_name ?? null,
      target_rating: profile?.target_rating ?? null,
    };
  });

export const saveMyProfile = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) =>
    z.object({
      codeforces_handle: z.string().min(1).max(48).nullable().optional(),
      display_name: z.string().max(80).nullable().optional(),
      target_rating: z.number().int().min(800).max(3500).nullable().optional(),
    }).parse(d),
  )
  .handler(async ({ context, data }) => {
    const { error } = await context.supabase
      .from("profiles")
      .upsert({ id: context.userId, ...data, updated_at: new Date().toISOString() });
    if (error) throw error;
    return { ok: true };
  });

export const toggleBookmark = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) =>
    z.object({
      contest_id: z.number().int(),
      contest_name: z.string(),
      start_time: z.string(),
      bookmark: z.boolean(),
    }).parse(d),
  )
  .handler(async ({ context, data }) => {
    if (data.bookmark) {
      await context.supabase.from("contest_bookmarks").upsert({
        user_id: context.userId,
        contest_id: data.contest_id,
        contest_name: data.contest_name,
        start_time: data.start_time,
      });
    } else {
      await context.supabase
        .from("contest_bookmarks")
        .delete()
        .eq("user_id", context.userId)
        .eq("contest_id", data.contest_id);
    }
    return { ok: true };
  });

export const listBookmarks = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data } = await context.supabase
      .from("contest_bookmarks")
      .select("contest_id")
      .eq("user_id", context.userId);
    return (data ?? []).map((d) => d.contest_id);
  });
