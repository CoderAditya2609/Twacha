-- Run this entire file once in Supabase: SQL Editor > New query > Run.
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  age integer, gender text, height_cm numeric, weight_kg numeric,
  activity_level text, sleep_hours numeric, water_intake text, diet_type text, stress_level text,
  skin_type text, acne_level text, acne_type text, main_concerns text[] default '{}',
  allergies text, current_routine text, climate text, budget text, preference text,
  pregnancy_or_medication text default 'no', created_at timestamptz default now(), updated_at timestamptz default now()
);
create table if not exists public.messages (
  id bigint generated always as identity primary key, user_id uuid not null references auth.users(id) on delete cascade,
  role text not null check (role in ('user','assistant')), content text not null, created_at timestamptz default now()
);
create table if not exists public.clicks (
  id bigint generated always as identity primary key, user_id uuid references auth.users(id) on delete set null,
  product_id text not null, created_at timestamptz default now()
);
create index if not exists messages_user_created_idx on public.messages(user_id,created_at);
create index if not exists clicks_product_idx on public.clicks(product_id);
alter table public.profiles enable row level security;
alter table public.messages enable row level security;
alter table public.clicks enable row level security;
create policy "Users manage their own profile" on public.profiles for all using (auth.uid() = id) with check (auth.uid() = id);
create policy "Users read their own messages" on public.messages for select using (auth.uid() = user_id);
create policy "Users may create their own messages" on public.messages for insert with check (auth.uid() = user_id);
create policy "Users read their own clicks" on public.clicks for select using (auth.uid() = user_id);
create policy "Users may log their own clicks" on public.clicks for insert with check (auth.uid() = user_id);
