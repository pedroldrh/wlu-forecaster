-- Update handle_new_user trigger to extract Microsoft OAuth metadata
-- Run this in the Supabase SQL Editor

create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, email, name, display_name, avatar_url, is_wlu_verified)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'name', split_part(new.email, '@', 1)),
    coalesce(new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'name', split_part(new.email, '@', 1)),
    new.raw_user_meta_data->>'avatar_url',
    new.email like '%@mail.wlu.edu'
  );
  return new;
end;
$$ language plpgsql security definer;
