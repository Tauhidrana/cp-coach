CREATE TABLE public.solved_problems (
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  platform text NOT NULL,
  problem_key text NOT NULL,
  solved_at timestamp with time zone NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, platform, problem_key)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.solved_problems TO authenticated;
GRANT ALL ON public.solved_problems TO service_role;
ALTER TABLE public.solved_problems ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own solved problems" ON public.solved_problems FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE INDEX solved_problems_user_idx ON public.solved_problems (user_id, platform);