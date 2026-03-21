-- Add image_url column to questions for AI-generated market images
ALTER TABLE public.questions ADD COLUMN IF NOT EXISTS image_url text;
