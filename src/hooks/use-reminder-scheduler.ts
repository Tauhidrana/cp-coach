import { useEffect, useRef } from "react";
import { useServerFn } from "@tanstack/react-start";
import { useAuth } from "@/lib/use-auth";
import { useSettings } from "./use-settings";
import { createNotification, isSheetCompletedToday } from "@/lib/notifications.functions";
import { getContests, listBookmarks } from "@/lib/cp.functions";

const DAY = 24 * 3600 * 1000;
const MIN = 60 * 1000;

/**
 * Client-side reminder engine. While the app is open, schedules and fires:
 *  - Daily practice reminders at 18:00 and 21:00 local (if sheet not done)
 *  - Contest registration reminders 24h / 2h before start (non-bookmarked)
 *  - Contest start reminders 30m / 5m before start (bookmarked)
 *
 * Fires Web Notification API when permitted, and always persists into the
 * `notifications` table so the bell stays in sync across devices.
 */
export function useReminderScheduler() {
  const { user, isGuest } = useAuth();
  const { settings } = useSettings();
  const createFn = useServerFn(createNotification);
  const sheetDoneFn = useServerFn(isSheetCompletedToday);
  const contestsFn = useServerFn(getContests);
  const bookmarksFn = useServerFn(listBookmarks);
  const firedRef = useRef<Set<string>>(new Set());

  useEffect(() => {
    if (!user || isGuest) return;
    let stopped = false;

    const fire = async (key: string, type: "practice" | "contest", title: string, body: string) => {
      if (firedRef.current.has(key)) return;
      firedRef.current.add(key);
      try {
        await createFn({ data: { type, title, body, dedupeKey: key } });
      } catch {
        /* ignore */
      }
      if (settings?.sound_enabled !== false) {
        try {
          const ctx = new (
            window.AudioContext ||
            (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext
          )();
          const o = ctx.createOscillator();
          const g = ctx.createGain();
          o.connect(g);
          g.connect(ctx.destination);
          o.frequency.value = 880;
          g.gain.value = 0.04;
          o.start();
          setTimeout(() => {
            o.stop();
            ctx.close();
          }, 180);
        } catch {
          /* ignore */
        }
      }
      if (typeof Notification !== "undefined" && Notification.permission === "granted") {
        try {
          new Notification(title, { body, icon: "/favicon.ico" });
        } catch {
          /* ignore */
        }
      }
    };

    const tick = async () => {
      if (stopped) return;
      const now = new Date();

      // ---- Practice reminders ----
      if (settings?.notif_practice !== false) {
        try {
          const { completed } = await sheetDoneFn();
          if (!completed) {
            const today = now.toISOString().slice(0, 10);
            const hour = now.getHours();
            const min = now.getMinutes();
            if (hour === 18 && min < 15) {
              fire(
                `practice:${today}:18`,
                "practice",
                "Today's practice is waiting",
                "You haven't completed today's Daily Sheet yet. Keep your streak alive.",
              );
            }
            if (hour === 21 && min < 15) {
              fire(
                `practice:${today}:21`,
                "practice",
                "A few minutes can change everything",
                "Only a few minutes of practice can make a big difference. Complete today's sheet now.",
              );
            }
          }
        } catch {
          /* ignore */
        }
      }

      // ---- Contest reminders ----
      try {
        const [{ upcoming }, bookmarks] = await Promise.all([
          contestsFn(),
          bookmarksFn().catch(() => [] as number[]),
        ]);
        const bset = new Set(bookmarks);
        for (const c of upcoming) {
          const start = (c.startTimeSeconds ?? 0) * 1000;
          if (!start) continue;
          const delta = start - now.getTime();
          const isBookmarked = bset.has(c.id);
          const window15 = 15 * MIN;

          if (!isBookmarked && settings?.notif_contest_reg !== false) {
            if (Math.abs(delta - DAY) < window15) {
              fire(
                `reg24:${c.id}`,
                "contest",
                `${c.name} starts tomorrow`,
                "Register now and don't miss the contest.",
              );
            }
            if (Math.abs(delta - 2 * 3600 * 1000) < window15) {
              fire(
                `reg2:${c.id}`,
                "contest",
                `${c.name} starts in 2 hours`,
                "Register now — last call before the contest.",
              );
            }
          }
          if (isBookmarked && settings?.notif_contest_start !== false) {
            if (Math.abs(delta - 30 * MIN) < 7 * MIN) {
              fire(
                `start30:${c.id}`,
                "contest",
                `${c.name} starts in 30 minutes`,
                "Prepare your environment and join on time.",
              );
            }
            if (Math.abs(delta - 5 * MIN) < 3 * MIN) {
              fire(
                `start5:${c.id}`,
                "contest",
                `${c.name} starts in 5 minutes`,
                "Open the contest tab — it's almost time.",
              );
            }
          }
        }
      } catch {
        /* ignore */
      }
    };

    tick();
    const id = setInterval(tick, 5 * MIN);
    return () => {
      stopped = true;
      clearInterval(id);
    };
  }, [user, isGuest, settings, createFn, sheetDoneFn, contestsFn, bookmarksFn]);
}
