-- Comments table
create table if not exists public.comments (
  id uuid primary key default gen_random_uuid(),
  question_id uuid not null references public.questions(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  content text not null check (char_length(content) between 1 and 500),
  created_at timestamptz not null default now()
);

create index idx_comments_question_id on public.comments(question_id, created_at);

-- RLS
alter table public.comments enable row level security;

-- Anyone can read comments
create policy "Comments are viewable by everyone"
  on public.comments for select
  using (true);

-- Authenticated users can insert their own comments
create policy "Users can insert their own comments"
  on public.comments for insert
  with check (auth.uid() = user_id);

-- Users can delete their own comments
create policy "Users can delete their own comments"
  on public.comments for delete
  using (auth.uid() = user_id);
