import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { z } from "zod";

const SettingsSchema = z.object({
  language: z.enum(["auto", "en", "bn"]).optional(),
  notif_practice: z.boolean().optional(),
  notif_contest_reg: z.boolean().optional(),
  notif_contest_start: z.boolean().optional(),
  notif_weekly: z.boolean().optional(),
  notif_achievement: z.boolean().optional(),
  sound_enabled: z.boolean().optional(),
  timezone: z.string().max(64).nullable().optional(),
});

export const getMySettings = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data } = await context.supabase
      .from("user_settings")
      .select("*")
      .eq("user_id", context.userId)
      .maybeSingle();
    if (data) return data;
    // Default row
    const insert = { user_id: context.userId };
    const { data: created } = await context.supabase
      .from("user_settings")
      .insert(insert)
      .select("*")
      .single();
    return created!;
  });

export const updateMySettings = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => SettingsSchema.parse(d))
  .handler(async ({ context, data }) => {
    const { error } = await context.supabase
      .from("user_settings")
      .upsert({ user_id: context.userId, ...data }, { onConflict: "user_id" });
    if (error) throw error;
    return { ok: true };
  });
