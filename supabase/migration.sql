-- Migration: Free-entry sponsor-funded tournament
-- Run this against Supabase SQL editor

-- 1. Add display_name to profiles
alter table public.profiles add column if not exists display_name text;

-- 2. Update handle_new_user trigger to also set display_name
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, email, name, display_name, avatar_url, is_wlu_verified)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'full_name', split_part(new.email, '@', 1)),
    coalesce(new.raw_user_meta_data->>'full_name', split_part(new.email, '@', 1)),
    new.raw_user_meta_data->>'avatar_url',
    new.email like '%@mail.wlu.edu'
  );
  return new;
end;
$$ language plpgsql security definer;

-- 3. Add prize pool columns to seasons
alter table public.seasons add column if not exists prize_1st_cents integer not null default 60000;
alter table public.seasons add column if not exists prize_2nd_cents integer not null default 25000;
alter table public.seasons add column if not exists prize_3rd_cents integer not null default 15000;
alter table public.seasons add column if not exists prize_bonus_cents integer not null default 5000;
alter table public.seasons add column if not exists min_participation_pct integer not null default 70;
alter table public.seasons alter column entry_fee_cents set default 0;

-- 4. Update season_entries status constraint to include JOINED
alter table public.season_entries drop constraint if exists season_entries_status_check;
alter table public.season_entries add constraint season_entries_status_check
  check (status in ('PENDING', 'PAID', 'JOINED'));
alter table public.season_entries alter column status set default 'JOINED';

-- 5. Create prize_claims table
create table if not exists public.prize_claims (
  id uuid primary key default gen_random_uuid(),
  season_id uuid references public.seasons(id) not null,
  user_id uuid references public.profiles(id) not null,
  prize_type text not null check (prize_type in ('1ST', '2ND', '3RD', 'BONUS')),
  amount_cents integer not null default 0,
  verified boolean not null default false,
  claimed_at timestamptz,
  created_at timestamptz not null default now(),
  unique(season_id, user_id, prize_type)
);

alter table public.prize_claims enable row level security;
create policy "Users can view own claims" on public.prize_claims for select using (auth.uid() = user_id);
create policy "Admins can manage claims" on public.prize_claims for all using (
  exists (select 1 from public.profiles where id = auth.uid() and role = 'ADMIN')
);

-- 6. Update seed data for existing season
update public.seasons
set entry_fee_cents = 0,
    prize_1st_cents = 60000,
    prize_2nd_cents = 25000,
    prize_3rd_cents = 15000,
    prize_bonus_cents = 5000,
    min_participation_pct = 70
where id = 'a0000000-0000-0000-0000-000000000001';
