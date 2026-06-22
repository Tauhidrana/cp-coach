import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { z } from "zod";

const NotifType = z.enum(["practice", "contest", "coach", "weekly_report", "achievement"]);

export const listNotifications = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data, error } = await context.supabase
      .from("notifications")
      .select("*")
      .eq("user_id", context.userId)
      .order("created_at", { ascending: false })
      .limit(100);
    if (error) throw error;
    return data ?? [];
  });

export const createNotification = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) =>
    z
      .object({
        type: NotifType,
        title: z.string().min(1).max(160),
        body: z.string().max(600).optional(),
        data: z.record(z.string(), z.any()).optional(),
        dedupeKey: z.string().optional(),
      })
      .parse(d),
  )
  .handler(async ({ context, data }) => {
    // Dedupe: skip if a notification with same dedupeKey was created in last 12h
    if (data.dedupeKey) {
      const since = new Date(Date.now() - 12 * 3600 * 1000).toISOString();
      const { data: existing } = await context.supabase
        .from("notifications")
        .select("id")
        .eq("user_id", context.userId)
        .gte("created_at", since)
        .contains("data", { dedupeKey: data.dedupeKey })
        .limit(1);
      if (existing && existing.length > 0) return { ok: true, deduped: true };
    }
    const { error } = await context.supabase.from("notifications").insert({
      user_id: context.userId,
      type: data.type,
      title: data.title,
      body: data.body ?? null,
      data: { ...(data.data ?? {}), ...(data.dedupeKey ? { dedupeKey: data.dedupeKey } : {}) },
    });
    if (error) throw error;
    return { ok: true };
  });

export const markRead = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ id: z.string().uuid() }).parse(d))
  .handler(async ({ context, data }) => {
    await context.supabase
      .from("notifications")
      .update({ read_at: new Date().toISOString() })
      .eq("id", data.id)
      .eq("user_id", context.userId);
    return { ok: true };
  });

export const markAllRead = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await context.supabase
      .from("notifications")
      .update({ read_at: new Date().toISOString() })
      .is("read_at", null)
      .eq("user_id", context.userId);
    return { ok: true };
  });

export const deleteNotification = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ id: z.string().uuid() }).parse(d))
  .handler(async ({ context, data }) => {
    await context.supabase
      .from("notifications")
      .delete()
      .eq("id", data.id)
      .eq("user_id", context.userId);
    return { ok: true };
  });

export const markSheetCompletedToday = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const today = new Date().toISOString().slice(0, 10);
    await context.supabase
      .from("daily_sheet_completions")
      .upsert({ user_id: context.userId, date: today }, { onConflict: "user_id,date" });
    return { ok: true };
  });

export const isSheetCompletedToday = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const today = new Date().toISOString().slice(0, 10);
    const { data } = await context.supabase
      .from("daily_sheet_completions")
      .select("date")
      .eq("user_id", context.userId)
      .eq("date", today)
      .maybeSingle();
    return { completed: !!data };
  });
