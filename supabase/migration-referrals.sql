-- Add referral tracking to profiles
ALTER TABLE public.profiles ADD COLUMN referred_by uuid REFERENCES public.profiles(id);
