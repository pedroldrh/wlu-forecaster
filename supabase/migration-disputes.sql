-- Resolution disputes table
CREATE TABLE IF NOT EXISTS public.resolution_disputes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  question_id uuid NOT NULL REFERENCES public.questions(id) ON DELETE CASCADE,
  message text NOT NULL,
  status text NOT NULL DEFAULT 'PENDING'
    CHECK (status IN ('PENDING', 'REVIEWED', 'DISMISSED')),
  admin_note text,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- RLS
ALTER TABLE public.resolution_disputes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can insert own disputes"
  ON public.resolution_disputes FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can read own disputes"
  ON public.resolution_disputes FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Admins can read all disputes"
  ON public.resolution_disputes FOR SELECT
  USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'ADMIN')
  );

CREATE POLICY "Admins can update disputes"
  ON public.resolution_disputes FOR UPDATE
  USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'ADMIN')
  );
