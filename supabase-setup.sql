-- ============================================================================
-- ADCREATIVE STUDIO - SUPABASE SETUP
-- Spusť tento script v Supabase SQL Editor
-- ============================================================================

-- 1. USER PROFILES TABLE
create table if not exists public.user_profiles (
  id uuid references auth.users on delete cascade primary key,
  email text not null,
  name text,
  avatar_url text,
  plan text default 'free' check (plan in ('free', 'pro', 'enterprise')),
  storage_used bigint default 0,
  storage_limit bigint default 104857600, -- 100MB for free
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 2. USER DATA TABLE (pro brand kits, nastavení, atd.)
create table if not exists public.user_data (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references public.user_profiles(id) on delete cascade not null,
  key text not null,
  data jsonb not null default '{}'::jsonb,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null,
  unique(user_id, key)
);

-- 3. CREATIVES METADATA TABLE
create table if not exists public.creatives (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references public.user_profiles(id) on delete cascade not null,
  name text,
  platform text,
  category text,
  format_key text,
  width integer,
  height integer,
  file_url text,
  thumbnail_url text,
  file_size bigint default 0,
  metadata jsonb default '{}'::jsonb,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 4. ROW LEVEL SECURITY (RLS)
alter table public.user_profiles enable row level security;
alter table public.user_data enable row level security;
alter table public.creatives enable row level security;

-- Policies for user_profiles
create policy "Users can view own profile" 
  on public.user_profiles for select 
  using (auth.uid() = id);

create policy "Users can update own profile" 
  on public.user_profiles for update 
  using (auth.uid() = id);

create policy "Users can insert own profile" 
  on public.user_profiles for insert 
  with check (auth.uid() = id);

-- Policies for user_data
create policy "Users can view own data" 
  on public.user_data for select 
  using (auth.uid() = user_id);

create policy "Users can insert own data" 
  on public.user_data for insert 
  with check (auth.uid() = user_id);

create policy "Users can update own data" 
  on public.user_data for update 
  using (auth.uid() = user_id);

create policy "Users can delete own data" 
  on public.user_data for delete 
  using (auth.uid() = user_id);

-- Policies for creatives
create policy "Users can view own creatives" 
  on public.creatives for select 
  using (auth.uid() = user_id);

create policy "Users can insert own creatives" 
  on public.creatives for insert 
  with check (auth.uid() = user_id);

create policy "Users can update own creatives" 
  on public.creatives for update 
  using (auth.uid() = user_id);

create policy "Users can delete own creatives" 
  on public.creatives for delete 
  using (auth.uid() = user_id);

-- 5. FUNCTION: Auto-create profile on signup
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.user_profiles (id, email, name, avatar_url)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'name', new.raw_user_meta_data->>'full_name', split_part(new.email, '@', 1)),
    new.raw_user_meta_data->>'avatar_url'
  );
  return new;
end;
$$ language plpgsql security definer;

-- Trigger for auto-creating profile
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- 6. FUNCTION: Update storage used
create or replace function public.update_storage_used(p_user_id uuid)
returns void as $$
begin
  update public.user_profiles
  set storage_used = (
    select coalesce(sum(file_size), 0)
    from public.creatives
    where user_id = p_user_id
  ),
  updated_at = now()
  where id = p_user_id;
end;
$$ language plpgsql security definer;

-- 7. INDEXES
create index if not exists idx_user_data_user_id on public.user_data(user_id);
create index if not exists idx_user_data_key on public.user_data(key);
create index if not exists idx_creatives_user_id on public.creatives(user_id);
create index if not exists idx_creatives_created_at on public.creatives(created_at desc);

-- 8. STORAGE BUCKET (run this separately in Storage settings or via API)
-- insert into storage.buckets (id, name, public) values ('creatives', 'creatives', true);

-- ============================================================================
-- HOTOVO! Nyní:
-- 1. Jdi do Authentication -> Providers -> zapni Email a Google
-- 2. Jdi do Storage -> New Bucket -> "creatives" (public)
-- 3. Zkopíruj URL a anon key z Settings -> API
-- ============================================================================
