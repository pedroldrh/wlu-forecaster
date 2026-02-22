-- Add 4th and 5th place prize columns to seasons
ALTER TABLE public.seasons
  ADD COLUMN IF NOT EXISTS prize_4th_cents integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS prize_5th_cents integer NOT NULL DEFAULT 0;

-- Set defaults for existing live/draft seasons
UPDATE public.seasons
SET prize_4th_cents = 10000, prize_5th_cents = 7500
WHERE status IN ('LIVE', 'DRAFT');

-- Add 4TH and 5TH to prize_claims prize_type
ALTER TABLE public.prize_claims
  DROP CONSTRAINT IF EXISTS prize_claims_prize_type_check;

ALTER TABLE public.prize_claims
  ADD CONSTRAINT prize_claims_prize_type_check
  CHECK (prize_type IN ('1ST', '2ND', '3RD', '4TH', '5TH', 'BONUS'));
