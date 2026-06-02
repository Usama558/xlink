-- Run this in Supabase SQL Editor

create table if not exists profiles (
  id uuid references auth.users primary key,
  full_name text,
  username text,
  avatar_url text,
  plan text default 'free',
  x_connected boolean default false,
  linkedin_connected boolean default false,
  niche text,
  created_at timestamptz default now()
);

create table if not exists scheduled_posts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references profiles(id) on delete cascade,
  platform text not null,
  content text not null,
  scheduled_at timestamptz not null,
  status text default 'scheduled',
  created_at timestamptz default now()
);

create table if not exists saved_posts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references profiles(id) on delete cascade,
  platform text not null,
  content text not null,
  format_type text,
  created_at timestamptz default now()
);

create table if not exists analytics_snapshots (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references profiles(id) on delete cascade,
  platform text not null,
  impressions int default 0,
  followers_gained int default 0,
  engagement_rate numeric default 0,
  posts_published int default 0,
  snapshot_date date default current_date
);

-- Enable Row Level Security
alter table profiles enable row level security;
alter table scheduled_posts enable row level security;
alter table saved_posts enable row level security;
alter table analytics_snapshots enable row level security;

-- RLS Policies
create policy "Users can view own profile" on profiles for select using (auth.uid() = id);
create policy "Users can update own profile" on profiles for update using (auth.uid() = id);
create policy "Users can insert own profile" on profiles for insert with check (auth.uid() = id);

create policy "Users can view own posts" on scheduled_posts for select using (auth.uid() = user_id);
create policy "Users can insert own posts" on scheduled_posts for insert with check (auth.uid() = user_id);
create policy "Users can update own posts" on scheduled_posts for update using (auth.uid() = user_id);
create policy "Users can delete own posts" on scheduled_posts for delete using (auth.uid() = user_id);

create policy "Users can view own saved posts" on saved_posts for select using (auth.uid() = user_id);
create policy "Users can insert own saved posts" on saved_posts for insert with check (auth.uid() = user_id);
create policy "Users can delete own saved posts" on saved_posts for delete using (auth.uid() = user_id);

create policy "Users can view own analytics" on analytics_snapshots for select using (auth.uid() = user_id);
create policy "Users can insert own analytics" on analytics_snapshots for insert with check (auth.uid() = user_id);

-- Auto-create profile on signup
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, full_name, plan)
  values (new.id, new.raw_user_meta_data->>'full_name', 'free')
  on conflict (id) do nothing;
  return new;
end;
$$ language plpgsql security definer;

create or replace trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();
