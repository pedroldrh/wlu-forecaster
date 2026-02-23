-- Migration: forecast_history table for consensus chart
-- Run this in Supabase SQL Editor

-- 1. Create the table
CREATE TABLE public.forecast_history (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  question_id uuid NOT NULL REFERENCES public.questions(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  probability double precision NOT NULL CHECK (probability >= 0 AND probability <= 1),
  recorded_at timestamptz NOT NULL DEFAULT now()
);

-- 2. Index for fast chart queries
CREATE INDEX idx_forecast_history_question_time
  ON public.forecast_history (question_id, recorded_at);

-- 3. RLS: everyone can read, no direct client inserts (trigger handles writes)
ALTER TABLE public.forecast_history ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read forecast history"
  ON public.forecast_history FOR SELECT
  USING (true);

-- 4. Trigger: auto-insert history row on forecast INSERT or UPDATE
CREATE OR REPLACE FUNCTION public.record_forecast_history()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.forecast_history (question_id, user_id, probability, recorded_at)
  VALUES (NEW.question_id, NEW.user_id, NEW.probability, now());
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER trg_forecast_history
  AFTER INSERT OR UPDATE ON public.forecasts
  FOR EACH ROW
  EXECUTE FUNCTION public.record_forecast_history();

-- 5. Backfill: seed history from existing forecasts
INSERT INTO public.forecast_history (question_id, user_id, probability, recorded_at)
SELECT question_id, user_id, probability, submitted_at
FROM public.forecasts;
