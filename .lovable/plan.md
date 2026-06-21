
# CP Coach — Feature Pass: Notifications, Bilingual Coach, Google Avatar, Settings

This is a sizable build. Below is the scope and the technical approach, broken into shippable parts. I'll implement in this order so each part is usable on its own.

## 1. Database (one migration)

New tables:
- `notifications` — `id`, `user_id`, `type` (`practice|contest|coach|weekly_report|achievement`), `title`, `body`, `data jsonb`, `read_at`, `created_at`. RLS: own-rows only, GRANTs for `authenticated` + `service_role`.
- `user_settings` — `user_id pk`, `language` (`auto|en|bn`), `notif_practice bool`, `notif_contest_reg bool`, `notif_contest_start bool`, `notif_weekly bool`, `notif_achievement bool`, `sound_enabled bool`, `push_subscription jsonb`. RLS own-rows.
- `daily_sheet_completions` — `user_id`, `date`, `completed_at` (used to suppress practice reminders).

## 2. Notification engine

- **In-app**: bell icon in `AppShell` top-right with unread badge, dropdown showing recent items, full page at `/notifications` with mark-read / mark-all / delete / filter by type. Realtime via `supabase.channel` on the `notifications` table.
- **Local scheduling (client-side)**: a `useReminderScheduler` hook that, on app load, schedules `setTimeout`s for 6 PM / 9 PM practice reminders, 24h/2h contest registration, 30m/5m contest start — driven by the user's local clock + their connected contests/bookmarks. It writes rows into `notifications` (so they show in the bell) and, when permission is granted, fires `Notification` Web API for browser push. Reminders auto-cancel if the daily sheet is marked complete or the user registers.
- **Server cron**: a `pg_cron` job hitting `/api/public/hooks/notifications-tick` every 15 min as a safety net for users not currently online — generates the same rows server-side using each user's connected platforms + saved timezone (stored on `user_settings`).
- **True web-push (VAPID)**: out of scope for this pass — `Notification` API + in-app bell covers the requirement. I'll note this limitation in the Settings page.

## 3. Bilingual AI Coach

- Add `language` to `user_settings` and a language selector dropdown on `/coach` (Auto / English / বাংলা).
- `aiCoachAnalysis` and `generateRoadmap` server fns accept `{ language }` and prepend a system instruction: "Respond entirely in Bangla (Bengali script)…" when `bn`. Auto = detect from browser `navigator.language`.
- Markdown renderer already handles Bangla.

## 4. Google profile integration

- Already captured by Supabase Auth in `user_metadata.avatar_url` + `full_name` on Google sign-in — no extra fetch needed; it refreshes on each login.
- Add a small `<UserAvatar>` component that renders `user_metadata.avatar_url` with a gradient-initials fallback (already partially present in `AppShell`).
- Use it in: sidebar footer, mobile top bar, `/notifications`, `/settings`, dashboard hero greeting.

## 5. Settings page (`/settings`)

Tabs/sections:
- **Profile** — Google avatar + name + email (read-only).
- **Language** — Auto / English / বাংলা.
- **Notifications** — five toggles + sound toggle + "Enable browser notifications" button (calls `Notification.requestPermission`).
- **Theme** — reuses existing ThemeToggle (Light / Dark / System).

Add `Settings` to sidebar nav + mobile bottom nav (replacing one of the lower-priority items on mobile to keep 7-column grid manageable, or expand to 8).

## 6. Files to add / edit

**New**
- `supabase/migrations/<ts>_notifications.sql`
- `src/lib/notifications.functions.ts` (list, mark read, delete, create)
- `src/lib/settings.functions.ts` (get/update)
- `src/hooks/use-settings.ts`, `src/hooks/use-notifications.ts`, `src/hooks/use-reminder-scheduler.ts`
- `src/components/notification-bell.tsx`, `src/components/user-avatar.tsx`
- `src/routes/_authenticated/notifications.tsx`
- `src/routes/_authenticated/settings.tsx`
- `src/routes/api/public/hooks/notifications-tick.ts`

**Edited**
- `src/components/app/AppShell.tsx` — add bell + UserAvatar + Settings nav item + mount scheduler.
- `src/routes/_authenticated/coach.tsx` — language selector + pass to server fn.
- `src/routes/_authenticated/roadmap.tsx` — same.
- `src/lib/cp.functions.ts` — accept `language` in `aiCoachAnalysis` + `generateRoadmap` and tweak system prompts.
- `src/routes/_authenticated/sheet.tsx` — on completion, record in `daily_sheet_completions` so reminders cancel.

## 7. Out of scope for this pass (will call out in the response)
- True server-pushed Web Push via VAPID/service worker (requires service-worker plumbing). Reminders use in-app + `Notification` API while the tab is open + server-generated entries in the bell otherwise.
- Email/SMS delivery.

Shall I proceed with the full build as scoped above?
