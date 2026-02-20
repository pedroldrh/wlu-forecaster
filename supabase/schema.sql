-- Profiles table (linked to auth.users)
create table public.profiles (
  id uuid references auth.users on delete cascade primary key,
  email text unique not null,
  name text,
  avatar_url text,
  role text not null default 'USER' check (role in ('USER', 'ADMIN')),
  is_wlu_verified boolean not null default false,
  created_at timestamptz not null default now()
);

-- Auto-create profile on signup
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, email, name, avatar_url, is_wlu_verified)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'full_name', split_part(new.email, '@', 1)),
    new.raw_user_meta_data->>'avatar_url',
    new.email like '%@mail.wlu.edu'
  );
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Seasons
create table public.seasons (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  start_date timestamptz not null,
  end_date timestamptz not null,
  entry_fee_cents integer not null,
  status text not null default 'DRAFT' check (status in ('DRAFT', 'LIVE', 'ENDED', 'PAYOUTS_SENT')),
  created_at timestamptz not null default now()
);

-- Season entries (payments)
create table public.season_entries (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.profiles(id) not null,
  season_id uuid references public.seasons(id) not null,
  status text not null default 'PENDING' check (status in ('PENDING', 'PAID')),
  stripe_session_id text,
  stripe_customer_id text,
  stripe_payment_intent text,
  paid_at timestamptz,
  created_at timestamptz not null default now(),
  unique(user_id, season_id)
);

-- Questions
create table public.questions (
  id uuid primary key default gen_random_uuid(),
  season_id uuid references public.seasons(id) not null,
  title text not null,
  description text not null,
  category text not null default 'OTHER' check (category in ('SPORTS', 'CAMPUS', 'ACADEMICS', 'GREEK', 'OTHER')),
  close_time timestamptz not null,
  resolve_time timestamptz not null,
  status text not null default 'OPEN' check (status in ('OPEN', 'CLOSED', 'RESOLVED')),
  resolved_outcome boolean,
  resolved_at timestamptz,
  created_at timestamptz not null default now()
);

-- Forecasts
create table public.forecasts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.profiles(id) not null,
  question_id uuid references public.questions(id) not null,
  probability double precision not null check (probability >= 0 and probability <= 1),
  submitted_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(user_id, question_id)
);

-- RLS policies
alter table public.profiles enable row level security;
alter table public.seasons enable row level security;
alter table public.season_entries enable row level security;
alter table public.questions enable row level security;
alter table public.forecasts enable row level security;

-- Profiles: anyone can read, users can update their own
create policy "Profiles are viewable by everyone" on public.profiles for select using (true);
create policy "Users can update own profile" on public.profiles for update using (auth.uid() = id);

-- Seasons: anyone can read
create policy "Seasons are viewable by everyone" on public.seasons for select using (true);
create policy "Admins can manage seasons" on public.seasons for all using (
  exists (select 1 from public.profiles where id = auth.uid() and role = 'ADMIN')
);

-- Season entries: users can read their own, admins can read all
create policy "Users can view own entries" on public.season_entries for select using (auth.uid() = user_id);
create policy "Admins can view all entries" on public.season_entries for select using (
  exists (select 1 from public.profiles where id = auth.uid() and role = 'ADMIN')
);
create policy "Users can insert own entries" on public.season_entries for insert with check (auth.uid() = user_id);
create policy "Service role can update entries" on public.season_entries for update using (true);

-- Questions: anyone can read
create policy "Questions are viewable by everyone" on public.questions for select using (true);
create policy "Admins can manage questions" on public.questions for all using (
  exists (select 1 from public.profiles where id = auth.uid() and role = 'ADMIN')
);

-- Forecasts: users can manage their own, admins can read all
create policy "Users can view own forecasts" on public.forecasts for select using (auth.uid() = user_id);
create policy "Users can insert own forecasts" on public.forecasts for insert with check (auth.uid() = user_id);
create policy "Users can update own forecasts" on public.forecasts for update using (auth.uid() = user_id);
create policy "Admins can view all forecasts" on public.forecasts for select using (
  exists (select 1 from public.profiles where id = auth.uid() and role = 'ADMIN')
);

-- Seed data
insert into public.seasons (id, name, start_date, end_date, entry_fee_cents, status)
values (
  'a0000000-0000-0000-0000-000000000001',
  'Spring 2026',
  '2026-04-01T00:00:00Z',
  '2026-06-15T23:59:59Z',
  2500,
  'LIVE'
);

insert into public.questions (season_id, title, description, category, close_time, resolve_time) values
('a0000000-0000-0000-0000-000000000001', 'Will W&L baseball win 20+ games this season?', 'Resolves YES if the W&L Generals baseball team finishes the 2026 spring season with 20 or more wins (regular season only).', 'SPORTS', '2026-05-01T23:59:59Z', '2026-06-01T23:59:59Z'),
('a0000000-0000-0000-0000-000000000001', 'Will Mock Convention correctly predict the nominee?', 'Resolves YES if the W&L Mock Convention correctly predicts the out-party presidential nominee for 2028.', 'CAMPUS', '2026-04-20T23:59:59Z', '2026-05-15T23:59:59Z'),
('a0000000-0000-0000-0000-000000000001', 'Will more than 30% of students make Dean''s List?', 'Resolves YES if more than 30% of the undergraduate student body makes the Dean''s List for Spring 2026 term.', 'ACADEMICS', '2026-05-15T23:59:59Z', '2026-06-10T23:59:59Z'),
('a0000000-0000-0000-0000-000000000001', 'Will Spring formal weekend be rain-free?', 'Resolves YES if there is zero measurable precipitation (>0.01 inches) in Lexington, VA during the designated Greek formal weekend (both days).', 'GREEK', '2026-04-15T23:59:59Z', '2026-04-20T23:59:59Z'),
('a0000000-0000-0000-0000-000000000001', 'Will the new dining hall open before fall 2026?', 'Resolves YES if the renovated dining facility is open and serving students before September 1, 2026.', 'CAMPUS', '2026-06-01T23:59:59Z', '2026-09-01T23:59:59Z');
