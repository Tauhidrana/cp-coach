import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { z } from "zod";

const PLATFORM_IDS = [
  "codeforces",
  "leetcode",
  "atcoder",
  "codechef",
  "hackerrank",
  "gfg",
  "coding-ninjas",
] as const;
const PlatformIdSchema = z.enum(PLATFORM_IDS);

const API_PLATFORMS: readonly string[] = [
  "codeforces",
  "leetcode",
  "atcoder",
  "codechef",
  "hackerrank",
];

async function retryWithBackoff<T>(fn: () => Promise<T>, attempts = 3): Promise<T> {
  let lastErr: unknown;
  for (let i = 0; i < attempts; i++) {
    try {
      return await fn();
    } catch (e) {
      lastErr = e;
      if (i < attempts - 1) {
        await new Promise((r) => setTimeout(r, [500, 1500, 3000][i] ?? 3000));
      }
    }
  }
  throw lastErr instanceof Error ? lastErr : new Error("Sync failed");
}

const ConnectInput = z.object({
  platform: PlatformIdSchema,
  username: z.string().min(1).max(64).trim(),
});

export const connectPlatform = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => ConnectInput.parse(d))
  .handler(async ({ context, data }) => {
    const { fetchPlatformStats } = await import("./platforms/adapters.server");
    const apiPlatforms = ["codeforces", "leetcode", "atcoder", "codechef", "hackerrank"] as const;
    const isApi = (apiPlatforms as readonly string[]).includes(data.platform);

    let stats: {
      rating: number | null;
      maxRating: number | null;
      rankLabel: string | null;
      problemsSolved: number;
      contestCount: number;
      raw?: Record<string, unknown>;
    } = {
      rating: null,
      maxRating: null,
      rankLabel: null,
      problemsSolved: 0,
      contestCount: 0,
    };

    if (isApi) {
      try {
        stats = await fetchPlatformStats(data.platform, data.username);
      } catch (e) {
        const msg = e instanceof Error ? e.message : "fetch failed";
        throw new Error(`Could not fetch ${data.platform} profile: ${msg}`);
      }
    }

    const { error } = await context.supabase.from("user_platforms").upsert(
      {
        user_id: context.userId,
        platform: data.platform,
        username: data.username,
        rating: stats.rating,
        max_rating: stats.maxRating,
        rank_label: stats.rankLabel,
        problems_solved: stats.problemsSolved,
        contest_count: stats.contestCount,
        raw_data: (stats.raw ?? null) as never,
        is_manual: !isApi,
        last_synced_at: isApi ? new Date().toISOString() : null,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "user_id,platform" },
    );
    if (error) throw error;
    return { ok: true };
  });

export const syncPlatform = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ platform: PlatformIdSchema }).parse(d))
  .handler(async ({ context, data }) => {
    const { data: row, error } = await context.supabase
      .from("user_platforms")
      .select("username, is_manual")
      .eq("user_id", context.userId)
      .eq("platform", data.platform)
      .maybeSingle();
    if (error) throw error;
    if (!row) throw new Error("Not connected");
    if (row.is_manual) throw new Error("Manual platform — update fields directly");

    const { fetchPlatformStats } = await import("./platforms/adapters.server");
    const stats = await retryWithBackoff(() => fetchPlatformStats(data.platform, row.username));
    const { error: updErr } = await context.supabase
      .from("user_platforms")
      .update({
        rating: stats.rating,
        max_rating: stats.maxRating,
        rank_label: stats.rankLabel,
        problems_solved: stats.problemsSolved,
        contest_count: stats.contestCount,
        raw_data: (stats.raw ?? null) as never,
        last_synced_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq("user_id", context.userId)
      .eq("platform", data.platform);
    if (updErr) throw updErr;
    return { ok: true };
  });

const ManualInput = z.object({
  platform: PlatformIdSchema,
  username: z.string().min(1).max(64).trim(),
  rating: z.number().int().min(0).max(5000).nullable(),
  max_rating: z.number().int().min(0).max(5000).nullable(),
  rank_label: z.string().max(64).nullable(),
  problems_solved: z.number().int().min(0).max(100000),
  contest_count: z.number().int().min(0).max(10000),
});

export const upsertManualPlatform = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => ManualInput.parse(d))
  .handler(async ({ context, data }) => {
    const { error } = await context.supabase.from("user_platforms").upsert(
      {
        user_id: context.userId,
        ...data,
        is_manual: true,
        last_synced_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
      { onConflict: "user_id,platform" },
    );
    if (error) throw error;
    return { ok: true };
  });

export const disconnectPlatform = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ platform: PlatformIdSchema }).parse(d))
  .handler(async ({ context, data }) => {
    const { error } = await context.supabase
      .from("user_platforms")
      .delete()
      .eq("user_id", context.userId)
      .eq("platform", data.platform);
    if (error) throw error;
    return { ok: true };
  });

export const listMyPlatforms = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data, error } = await context.supabase
      .from("user_platforms")
      .select(
        "platform, username, rating, max_rating, rank_label, problems_solved, contest_count, is_manual, last_synced_at, raw_data",
      )
      .eq("user_id", context.userId);
    if (error) throw error;
    return data ?? [];
  });
