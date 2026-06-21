
-- notifications
CREATE TABLE public.notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  type text NOT NULL CHECK (type IN ('practice','contest','coach','weekly_report','achievement')),
  title text NOT NULL,
  body text,
  data jsonb,
  read_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX notifications_user_created_idx ON public.notifications(user_id, created_at DESC);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.notifications TO authenticated;
GRANT ALL ON public.notifications TO service_role;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own notifications all" ON public.notifications
  FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- user_settings
CREATE TABLE public.user_settings (
  user_id uuid PRIMARY KEY,
  language text NOT NULL DEFAULT 'auto' CHECK (language IN ('auto','en','bn')),
  notif_practice boolean NOT NULL DEFAULT true,
  notif_contest_reg boolean NOT NULL DEFAULT true,
  notif_contest_start boolean NOT NULL DEFAULT true,
  notif_weekly boolean NOT NULL DEFAULT true,
  notif_achievement boolean NOT NULL DEFAULT true,
  sound_enabled boolean NOT NULL DEFAULT true,
  timezone text,
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.user_settings TO authenticated;
GRANT ALL ON public.user_settings TO service_role;
ALTER TABLE public.user_settings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own settings all" ON public.user_settings
  FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE TRIGGER user_settings_touch BEFORE UPDATE ON public.user_settings
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

-- daily_sheet_completions
CREATE TABLE public.daily_sheet_completions (
  user_id uuid NOT NULL,
  date date NOT NULL,
  completed_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, date)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.daily_sheet_completions TO authenticated;
GRANT ALL ON public.daily_sheet_completions TO service_role;
ALTER TABLE public.daily_sheet_completions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own completions all" ON public.daily_sheet_completions
  FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
