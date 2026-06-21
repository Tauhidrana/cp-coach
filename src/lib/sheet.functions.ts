// Smart adaptive multi-platform Daily Sheet generator.
// Returns a mentor-style problem set across Codeforces, CodeChef, and LeetCode
// with per-problem AI rationale in English + Bangla, plus a weekly plan and
// rating-goal projection.

import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { z } from "zod";
import { cf, analyzeSubmissions, type CFProblem } from "./codeforces";
import { codechefPool } from "./sheet/codechef-pool";
import { leetcodePool } from "./sheet/leetcode-pool";
import type { PoolProblem } from "./sheet/codechef-pool";

type Platform = "codeforces" | "codechef" | "leetcode";
type Difficulty = "easy" | "medium" | "hard";

interface SheetItem {
  id: string;
  platform: Platform;
  title: string;
  url: string;
  rating: number;
  difficulty: Difficulty;
  tags: string[];
  weak: boolean;
  estMinutes: number;
  reasonEn: string;
  reasonBn: string;
}

// ---- caching (per worker) ----
type CacheEntry<T> = { at: number; data: T };
const cache = new Map<string, CacheEntry<unknown>>();
async function cached<T>(key: string, ttlMs: number, fetcher: () => Promise<T>): Promise<T> {
  const hit = cache.get(key) as CacheEntry<T> | undefined;
  if (hit && Date.now() - hit.at < ttlMs) return hit.data;
  const data = await fetcher();
  cache.set(key, { at: Date.now(), data });
  return data;
}

// ---- tier mapping ----
function tierOf(rating: number): { name: string; mix: Record<Difficulty, number>; focus: string[] } {
  if (rating < 1000) return { name: "Beginner", mix: { easy: 0.6, medium: 0.3, hard: 0.1 }, focus: ["implementation", "math", "greedy"] };
  if (rating < 1200) return { name: "Pupil", mix: { easy: 0.5, medium: 0.4, hard: 0.1 }, focus: ["implementation", "greedy", "binary search", "math"] };
  if (rating < 1400) return { name: "Specialist", mix: { easy: 0.3, medium: 0.5, hard: 0.2 }, focus: ["greedy", "binary search", "constructive algorithms", "sortings", "graphs"] };
  if (rating < 1700) return { name: "Expert", mix: { easy: 0.2, medium: 0.5, hard: 0.3 }, focus: ["dp", "graphs", "trees", "two pointers", "bitmasks"] };
  return { name: "Candidate Master", mix: { easy: 0.1, medium: 0.4, hard: 0.5 }, focus: ["dp", "graphs", "data structures", "dsu", "math", "constructive algorithms"] };
}

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

function bucketDifficulty(problemRating: number, userRating: number): Difficulty {
  const delta = problemRating - userRating;
  if (delta <= -100) return "easy";
  if (delta <= 150) return "medium";
  return "hard";
}

function estimateMinutes(rating: number, difficulty: Difficulty): number {
  const base = difficulty === "easy" ? 15 : difficulty === "medium" ? 30 : 50;
  const bump = Math.max(0, Math.floor((rating - 1000) / 200) * 5);
  return base + bump;
}

// ---- platform distribution ----
function distribute(size: number, connected: Set<Platform>): Record<Platform, number> {
  const all: Platform[] = ["codeforces", "codechef", "leetcode"];
  const available = all.filter((p) => connected.has(p));
  if (available.length === 0) return { codeforces: 0, codechef: 0, leetcode: 0 };

  // Default ratios: CF 40%, CC 40%, LC 20%
  const weights: Record<Platform, number> = { codeforces: 0.4, codechef: 0.4, leetcode: 0.2 };
  const totalW = available.reduce((a, p) => a + weights[p], 0);
  const result: Record<Platform, number> = { codeforces: 0, codechef: 0, leetcode: 0 };
  let assigned = 0;
  for (let i = 0; i < available.length - 1; i++) {
    const p = available[i];
    const n = Math.round((weights[p] / totalW) * size);
    result[p] = n;
    assigned += n;
  }
  result[available[available.length - 1]] = Math.max(0, size - assigned);
  return result;
}

// ---- pool helpers ----
function pickFromPool(
  pool: PoolProblem[],
  targetRating: number,
  weakTags: Set<string>,
  solved: Set<string>,
  used: Set<string>,
  rng: () => number,
  userRating: number,
): { p: PoolProblem; weak: boolean; diff: Difficulty } | null {
  const candidates = pool
    .filter((p) => !solved.has(p.code) && !used.has(p.code))
    .map((p) => ({ p, dist: Math.abs(p.rating - targetRating) }))
    .sort((a, b) => a.dist - b.dist);
  if (candidates.length === 0) return null;
  // Take closest 12, prefer weak-tagged, randomize within
  const top = candidates.slice(0, 12).sort(() => rng() - 0.5);
  const weakHit = top.find((c) => c.p.tags.some((t) => weakTags.has(t)));
  const chosen = weakHit ?? top[0];
  const isWeak = chosen.p.tags.some((t) => weakTags.has(t));
  return { p: chosen.p, weak: isWeak, diff: bucketDifficulty(chosen.p.rating, userRating) };
}

// ---- AI rationale ----
async function generateRationales(
  items: Omit<SheetItem, "reasonEn" | "reasonBn">[],
  ctx: { tier: string; weak: string[]; strong: string[] },
  apiKey: string,
): Promise<Map<string, { en: string; bn: string }>> {
  if (items.length === 0) return new Map();
  try {
    const { createLovableAiGatewayProvider } = await import("./ai-gateway.server");
    const { generateText } = await import("ai");
    const gateway = createLovableAiGatewayProvider(apiKey);
    const model = gateway("google/gemini-3-flash-preview");

    const list = items.map((it, i) => ({
      i,
      platform: it.platform,
      rating: it.rating,
      tags: it.tags,
      weak: it.weak,
    }));

    const prompt = `You are a competitive programming mentor. For each problem below, write a one-sentence rationale in English and Bangla explaining why this problem fits the student today.

Student tier: ${ctx.tier}
Weak topics: ${ctx.weak.join(", ") || "n/a"}
Strong topics: ${ctx.strong.join(", ") || "n/a"}

Problems (JSON):
${JSON.stringify(list)}

Respond with STRICT JSON ONLY (no markdown fences), shape:
[{"i":0,"en":"...","bn":"..."}]

Rules:
- One concise sentence each (max 18 words).
- English: natural, mentor tone, reference the specific tag/skill.
- Bangla: natural Bangla script (বাংলা), same meaning, keep tag names like "binary search" in English.
- If "weak":true, mention it targets a weakness; otherwise mention reinforcement, revision, or stretch.`;

    const result = await generateText({ model, prompt });
    const cleaned = result.text.replace(/^```json\s*/i, "").replace(/```\s*$/g, "").trim();
    const parsed = JSON.parse(cleaned) as Array<{ i: number; en: string; bn: string }>;
    const out = new Map<string, { en: string; bn: string }>();
    for (const r of parsed) {
      const item = items[r.i];
      if (item) out.set(item.id, { en: r.en, bn: r.bn });
    }
    return out;
  } catch {
    return new Map();
  }
}

// ---- weekly plan (spec) ----
function weeklyPlan(): Array<{ day: string; focus: string }> {
  return [
    { day: "Mon", focus: "Easy + Greedy" },
    { day: "Tue", focus: "Binary Search + Math" },
    { day: "Wed", focus: "Graphs" },
    { day: "Thu", focus: "DP" },
    { day: "Fri", focus: "Mixed Contest Practice" },
    { day: "Sat", focus: "Virtual Contest" },
    { day: "Sun", focus: "Revision + Upsolve" },
  ];
}

// ---- rating goal ----
function ratingGoal(current: number, target: number | null) {
  if (!target || target <= current) return null;
  const gap = target - current;
  const problemsRemaining = Math.ceil((gap / 100) * 40);
  const etaWeeks = Math.ceil(problemsRemaining / 15);
  return { current, target, problemsRemaining, etaWeeks };
}

// ---- main ----
export const generateSmartSheet = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) =>
    z.object({
      size: z.union([z.literal(5), z.literal(10), z.literal(15)]),
      language: z.enum(["en", "bn"]).optional(),
    }).parse(d),
  )
  .handler(async ({ context, data }) => {
    // 1. Load user platforms + completions
    const [{ data: platforms }, { data: completions }, { data: solvedRows }, { data: profile }] = await Promise.all([
      context.supabase
        .from("user_platforms")
        .select("platform, username, rating, max_rating")
        .eq("user_id", context.userId),
      context.supabase
        .from("daily_sheet_completions")
        .select("date")
        .eq("user_id", context.userId)
        .order("date", { ascending: false })
        .limit(7),
      context.supabase
        .from("solved_problems")
        .select("platform, problem_key")
        .eq("user_id", context.userId),
      context.supabase
        .from("profiles")
        .select("target_rating")
        .eq("id", context.userId)
        .maybeSingle(),
    ]);

    const platformMap = new Map<string, { username: string; rating: number | null; maxRating: number | null }>();
    for (const p of platforms ?? []) {
      platformMap.set(p.platform, { username: p.username, rating: p.rating, maxRating: p.max_rating });
    }
    const connected = new Set<Platform>();
    if (platformMap.has("codeforces")) connected.add("codeforces");
    if (platformMap.has("codechef")) connected.add("codechef");
    if (platformMap.has("leetcode")) connected.add("leetcode");

    if (connected.size === 0) {
      throw new Error("Connect at least one of Codeforces, CodeChef, or LeetCode to generate a sheet.");
    }

    // 2. Effective user rating (prefer CF, else normalize)
    const cfInfo = platformMap.get("codeforces");
    const ccInfo = platformMap.get("codechef");
    const lcInfo = platformMap.get("leetcode");
    const effectiveRating =
      cfInfo?.rating ??
      (ccInfo?.rating ? Math.max(800, ccInfo.rating - 200) : null) ??
      (lcInfo?.rating ? Math.max(800, Math.round(lcInfo.rating / 1.4)) : null) ??
      1000;

    const tier = tierOf(effectiveRating);

    // 3. Adaptive shift from last 3 days
    const today = new Date().toISOString().slice(0, 10);
    const recentDates = (completions ?? []).map((c) => c.date);
    const last3 = [0, 1, 2].map((i) => {
      const d = new Date();
      d.setDate(d.getDate() - i);
      return d.toISOString().slice(0, 10);
    });
    const completedRecent = last3.filter((d) => recentDates.includes(d)).length;
    const adaptiveShift = completedRecent >= 2 ? 50 : completedRecent === 0 && recentDates.length > 0 ? -50 : 0;
    const targetRating = effectiveRating + adaptiveShift;

    // 4. Topic analysis from CF submissions (if connected)
    let weakTags: string[] = [];
    let strongTags: string[] = [];
    const cfSolved = new Set<string>();
    if (cfInfo) {
      try {
        const subs = await cached(`s:${cfInfo.username}`, 5 * 60_000, () => cf.userStatus(cfInfo.username, 3000));
        for (const s of subs) {
          if (s.verdict === "OK") cfSolved.add(`${s.problem.contestId ?? "x"}-${s.problem.index}`);
        }
        const a = analyzeSubmissions(subs, cfInfo.rating ?? effectiveRating);
        const sorted = a.topics.slice().sort((x, y) => x.score - y.score);
        weakTags = sorted.slice(0, 5).map((t) => t.tag);
        strongTags = a.topics.slice(0, 5).map((t) => t.tag);
      } catch {
        // tolerate
      }
    }
    // Fallback: use tier focus as weak topics if no CF history
    if (weakTags.length === 0) weakTags = tier.focus.slice(0, 4);
    const weakSet = new Set(weakTags);

    // 5. Solved sets for non-CF
    const ccSolved = new Set<string>();
    const lcSolved = new Set<string>();
    for (const r of solvedRows ?? []) {
      if (r.platform === "codechef") ccSolved.add(r.problem_key);
      else if (r.platform === "leetcode") lcSolved.add(r.problem_key);
    }

    // 6. Distribution
    const dist = distribute(data.size, connected);

    // 7. Deterministic RNG keyed by userId+date+size
    const seedStr = `${context.userId}:${today}:${data.size}`;
    let seed = 0;
    for (const ch of seedStr) seed = ((seed << 5) - seed + ch.charCodeAt(0)) | 0;
    const rng = mulberry32(seed);

    const used = new Set<string>();
    const items: Omit<SheetItem, "reasonEn" | "reasonBn">[] = [];

    // ---- CF picks ----
    if (dist.codeforces > 0 && cfInfo) {
      try {
        const ps = await cached("cf:problemset", 30 * 60_000, () => cf.problemset());
        const pool = ps.problems.filter(
          (p): p is CFProblem & { contestId: number; rating: number } =>
            !!p.rating && !!p.contestId && !cfSolved.has(`${p.contestId}-${p.index}`),
        );
        const offsets = buildOffsets(dist.codeforces, tier.mix);
        for (const off of offsets) {
          const want = targetRating + off;
          const near = pool
            .map((p) => ({ p, dist: Math.abs(p.rating - want) }))
            .sort((a, b) => a.dist - b.dist)
            .slice(0, 20)
            .sort(() => rng() - 0.5);
          const weakPick = near.find((c) => c.p.tags.some((t) => weakSet.has(t)) && !used.has(`cf:${c.p.contestId}-${c.p.index}`));
          const fallback = near.find((c) => !used.has(`cf:${c.p.contestId}-${c.p.index}`));
          const chosen = weakPick ?? fallback;
          if (!chosen) continue;
          const id = `cf:${chosen.p.contestId}-${chosen.p.index}`;
          used.add(id);
          const isWeak = chosen.p.tags.some((t) => weakSet.has(t));
          const diff = bucketDifficulty(chosen.p.rating, effectiveRating);
          items.push({
            id,
            platform: "codeforces",
            title: `${chosen.p.contestId}${chosen.p.index}. ${chosen.p.name}`,
            url: `https://codeforces.com/problemset/problem/${chosen.p.contestId}/${chosen.p.index}`,
            rating: chosen.p.rating,
            difficulty: diff,
            tags: chosen.p.tags.slice(0, 4),
            weak: isWeak,
            estMinutes: estimateMinutes(chosen.p.rating, diff),
          });
        }
      } catch {
        // tolerate
      }
    }

    // ---- CC picks ----
    if (dist.codechef > 0) {
      const offsets = buildOffsets(dist.codechef, tier.mix);
      for (const off of offsets) {
        const pick = pickFromPool(codechefPool, targetRating + off, weakSet, ccSolved, new Set([...used].filter((u) => u.startsWith("cc:")).map((u) => u.slice(3))), rng, effectiveRating);
        if (!pick) continue;
        const id = `cc:${pick.p.code}`;
        used.add(id);
        items.push({
          id,
          platform: "codechef",
          title: pick.p.name,
          url: pick.p.url,
          rating: pick.p.rating,
          difficulty: pick.diff,
          tags: pick.p.tags.slice(0, 4),
          weak: pick.weak,
          estMinutes: estimateMinutes(pick.p.rating, pick.diff),
        });
      }
    }

    // ---- LC picks ----
    if (dist.leetcode > 0) {
      const offsets = buildOffsets(dist.leetcode, tier.mix);
      for (const off of offsets) {
        const pick = pickFromPool(leetcodePool, targetRating + off, weakSet, lcSolved, new Set([...used].filter((u) => u.startsWith("lc:")).map((u) => u.slice(3))), rng, effectiveRating);
        if (!pick) continue;
        const id = `lc:${pick.p.code}`;
        used.add(id);
        items.push({
          id,
          platform: "leetcode",
          title: pick.p.name,
          url: pick.p.url,
          rating: pick.p.rating,
          difficulty: pick.diff,
          tags: pick.p.tags.slice(0, 4),
          weak: pick.weak,
          estMinutes: estimateMinutes(pick.p.rating, pick.diff),
        });
      }
    }

    // 8. AI rationale
    const apiKey = process.env.LOVABLE_API_KEY;
    const rationales = apiKey
      ? await generateRationales(items, { tier: tier.name, weak: weakTags, strong: strongTags }, apiKey)
      : new Map<string, { en: string; bn: string }>();

    const fullItems: SheetItem[] = items.map((it) => {
      const r = rationales.get(it.id);
      const fallback = it.weak
        ? `Targets your weak topic: ${it.tags.find((t) => weakSet.has(t)) ?? it.tags[0]}.`
        : `Builds on your ${it.platform === "codeforces" ? "CF" : it.platform === "codechef" ? "CC" : "LC"} foundation at rating ${it.rating}.`;
      const fallbackBn = it.weak
        ? `আপনার দুর্বল টপিক ${it.tags.find((t) => weakSet.has(t)) ?? it.tags[0]} অনুশীলনের জন্য বাছাই করা হয়েছে।`
        : `আপনার ${it.platform} স্তরে রেটিং ${it.rating}-এর ভিত্তি মজবুত করবে।`;
      return {
        ...it,
        reasonEn: r?.en ?? fallback,
        reasonBn: r?.bn ?? fallbackBn,
      };
    });

    // 9. Output
    const distribution = { easy: 0, medium: 0, hard: 0 };
    for (const it of fullItems) distribution[it.difficulty]++;
    const platformBreakdown: Record<Platform, number> = { codeforces: 0, codechef: 0, leetcode: 0 };
    for (const it of fullItems) platformBreakdown[it.platform]++;

    return {
      date: today,
      tier: tier.name,
      effectiveRating,
      adaptiveShift,
      estimatedMinutes: fullItems.reduce((a, b) => a + b.estMinutes, 0),
      focusTopics: weakTags.slice(0, 5),
      strongTopics: strongTags.slice(0, 3),
      distribution,
      platformBreakdown,
      items: fullItems,
      weeklyPlan: weeklyPlan(),
      ratingGoal: ratingGoal(effectiveRating, profile?.target_rating ?? null),
      language: data.language ?? "en",
    };
  });

function buildOffsets(count: number, mix: Record<Difficulty, number>): number[] {
  const easy = Math.round(count * mix.easy);
  const hard = Math.round(count * mix.hard);
  const medium = Math.max(0, count - easy - hard);
  const offsets: number[] = [];
  for (let i = 0; i < easy; i++) offsets.push(-200 + i * 50);
  for (let i = 0; i < medium; i++) offsets.push(0 + (i - Math.floor(medium / 2)) * 50);
  for (let i = 0; i < hard; i++) offsets.push(200 + i * 100);
  return offsets.slice(0, count);
}

// ---- mark a non-CF problem solved ----
export const markProblemSolved = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) =>
    z.object({
      platform: z.enum(["codechef", "leetcode", "codeforces"]),
      problem_key: z.string().min(1).max(128),
      solved: z.boolean(),
    }).parse(d),
  )
  .handler(async ({ context, data }) => {
    if (data.solved) {
      const { error } = await context.supabase.from("solved_problems").upsert({
        user_id: context.userId,
        platform: data.platform,
        problem_key: data.problem_key,
      });
      if (error) throw error;
    } else {
      const { error } = await context.supabase
        .from("solved_problems")
        .delete()
        .eq("user_id", context.userId)
        .eq("platform", data.platform)
        .eq("problem_key", data.problem_key);
      if (error) throw error;
    }
    return { ok: true };
  });

export const listSolvedSheetProblems = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data, error } = await context.supabase
      .from("solved_problems")
      .select("platform, problem_key");
    if (error) throw error;
    return data ?? [];
  });
