
CREATE TABLE public.user_platforms (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  platform TEXT NOT NULL,
  username TEXT NOT NULL,
  rating INTEGER,
  max_rating INTEGER,
  rank_label TEXT,
  problems_solved INTEGER NOT NULL DEFAULT 0,
  contest_count INTEGER NOT NULL DEFAULT 0,
  is_manual BOOLEAN NOT NULL DEFAULT false,
  raw_data JSONB,
  last_synced_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, platform)
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.user_platforms TO authenticated;
GRANT ALL ON public.user_platforms TO service_role;

ALTER TABLE public.user_platforms ENABLE ROW LEVEL SECURITY;

CREATE POLICY "own platforms select" ON public.user_platforms
  FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "own platforms insert" ON public.user_platforms
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "own platforms update" ON public.user_platforms
  FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "own platforms delete" ON public.user_platforms
  FOR DELETE TO authenticated USING (auth.uid() = user_id);

CREATE INDEX user_platforms_user_idx ON public.user_platforms(user_id);

CREATE OR REPLACE FUNCTION public.touch_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql SET search_path = public AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END; $$;
REVOKE EXECUTE ON FUNCTION public.touch_updated_at() FROM PUBLIC, anon, authenticated;

CREATE TRIGGER user_platforms_touch_updated
BEFORE UPDATE ON public.user_platforms
FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();
