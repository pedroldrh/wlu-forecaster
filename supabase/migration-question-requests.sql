-- Question requests table
create table if not exists public.question_requests (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  title text not null check (char_length(title) between 5 and 200),
  description text check (char_length(description) <= 500),
  category text not null default 'OTHER',
  status text not null default 'PENDING' check (status in ('PENDING', 'APPROVED', 'DENIED')),
  admin_note text,
  created_at timestamptz not null default now()
);

create index idx_question_requests_status on public.question_requests(status, created_at);

-- RLS
alter table public.question_requests enable row level security;

-- Anyone can read requests
create policy "Question requests are viewable by everyone"
  on public.question_requests for select
  using (true);

-- Authenticated users can insert their own requests
create policy "Users can insert their own requests"
  on public.question_requests for insert
  with check (auth.uid() = user_id);

-- Only service role can update (admin actions go through service role)
create policy "Service role can update requests"
  on public.question_requests for update
  using (true);
