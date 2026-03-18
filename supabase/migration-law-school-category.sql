-- Add LAW_SCHOOL to the questions category check constraint
ALTER TABLE public.questions DROP CONSTRAINT IF EXISTS questions_category_check;
ALTER TABLE public.questions ADD CONSTRAINT questions_category_check
  CHECK (category IN ('SPORTS', 'CAMPUS', 'ACADEMICS', 'GREEK', 'LAW_SCHOOL', 'OTHER'));
