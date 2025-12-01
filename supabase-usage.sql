-- ============================================================================
-- USAGE TRACKING pro AdCreative Studio
-- Spustit v Supabase SQL Editor PO supabase-setup.sql a supabase-admin.sql
-- ============================================================================

-- 1. Tabulka pro sledování využití
create table if not exists public.usage_tracking (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id) on delete cascade not null,
  action_type text not null, -- 'ai_image', 'ai_copy', 'ai_resize', 'export'
  created_at timestamp with time zone default now()
);

-- 2. Index pro rychlé dotazy
create index if not exists usage_tracking_user_date 
on public.usage_tracking(user_id, created_at desc);

create index if not exists usage_tracking_action 
on public.usage_tracking(action_type);

-- 3. RLS politiky
alter table public.usage_tracking enable row level security;

create policy "Users can view own usage"
  on public.usage_tracking for select
  using (auth.uid() = user_id);

create policy "Users can insert own usage"
  on public.usage_tracking for insert
  with check (auth.uid() = user_id);

-- 4. Limity podle plánu (reference tabulka)
create table if not exists public.plan_limits (
  plan text primary key,
  ai_image_daily integer not null,
  ai_copy_daily integer not null,
  ai_resize_daily integer not null,
  export_monthly integer not null,
  storage_bytes bigint not null
);

-- Vložit limity
insert into public.plan_limits (plan, ai_image_daily, ai_copy_daily, ai_resize_daily, export_monthly, storage_bytes)
values 
  ('free', 10, 20, 10, 50, 104857600),        -- 100 MB
  ('pro', 1000, 1000, 1000, 10000, 1073741824), -- 1 GB
  ('enterprise', -1, -1, -1, -1, 10737418240)   -- 10 GB, -1 = neomezeno
on conflict (plan) do update set
  ai_image_daily = excluded.ai_image_daily,
  ai_copy_daily = excluded.ai_copy_daily,
  ai_resize_daily = excluded.ai_resize_daily,
  export_monthly = excluded.export_monthly,
  storage_bytes = excluded.storage_bytes;

-- 5. Funkce pro získání zbývajících limitů
create or replace function get_usage_stats(p_user_id uuid)
returns json
language plpgsql
security definer
as $$
declare
  result json;
  user_plan text;
  limits record;
  today_start timestamp with time zone;
  month_start timestamp with time zone;
begin
  today_start := date_trunc('day', now());
  month_start := date_trunc('month', now());
  
  -- Získat plán uživatele
  select plan into user_plan from public.user_profiles where id = p_user_id;
  user_plan := coalesce(user_plan, 'free');
  
  -- Získat limity
  select * into limits from public.plan_limits where plan = user_plan;
  
  select json_build_object(
    'plan', user_plan,
    'limits', json_build_object(
      'ai_image_daily', limits.ai_image_daily,
      'ai_copy_daily', limits.ai_copy_daily,
      'ai_resize_daily', limits.ai_resize_daily,
      'export_monthly', limits.export_monthly
    ),
    'used', json_build_object(
      'ai_image_today', (
        select count(*) from public.usage_tracking 
        where user_id = p_user_id and action_type = 'ai_image' and created_at >= today_start
      ),
      'ai_copy_today', (
        select count(*) from public.usage_tracking 
        where user_id = p_user_id and action_type = 'ai_copy' and created_at >= today_start
      ),
      'ai_resize_today', (
        select count(*) from public.usage_tracking 
        where user_id = p_user_id and action_type = 'ai_resize' and created_at >= today_start
      ),
      'export_month', (
        select count(*) from public.usage_tracking 
        where user_id = p_user_id and action_type = 'export' and created_at >= month_start
      )
    ),
    'remaining', json_build_object(
      'ai_image', case when limits.ai_image_daily = -1 then -1 else greatest(0, limits.ai_image_daily - (
        select count(*) from public.usage_tracking 
        where user_id = p_user_id and action_type = 'ai_image' and created_at >= today_start
      )) end,
      'ai_copy', case when limits.ai_copy_daily = -1 then -1 else greatest(0, limits.ai_copy_daily - (
        select count(*) from public.usage_tracking 
        where user_id = p_user_id and action_type = 'ai_copy' and created_at >= today_start
      )) end,
      'ai_resize', case when limits.ai_resize_daily = -1 then -1 else greatest(0, limits.ai_resize_daily - (
        select count(*) from public.usage_tracking 
        where user_id = p_user_id and action_type = 'ai_resize' and created_at >= today_start
      )) end,
      'export', case when limits.export_monthly = -1 then -1 else greatest(0, limits.export_monthly - (
        select count(*) from public.usage_tracking 
        where user_id = p_user_id and action_type = 'export' and created_at >= month_start
      )) end
    )
  ) into result;
  
  return result;
end;
$$;

-- 6. Funkce pro tracking akce
create or replace function track_usage(p_action_type text)
returns json
language plpgsql
security definer
as $$
declare
  user_plan text;
  limits record;
  current_count integer;
  limit_value integer;
  today_start timestamp with time zone;
  month_start timestamp with time zone;
begin
  today_start := date_trunc('day', now());
  month_start := date_trunc('month', now());
  
  -- Získat plán uživatele
  select plan into user_plan from public.user_profiles where id = auth.uid();
  user_plan := coalesce(user_plan, 'free');
  
  -- Získat limity
  select * into limits from public.plan_limits where plan = user_plan;
  
  -- Zjistit aktuální počet a limit
  if p_action_type = 'ai_image' then
    select count(*) into current_count from public.usage_tracking 
    where user_id = auth.uid() and action_type = p_action_type and created_at >= today_start;
    limit_value := limits.ai_image_daily;
  elsif p_action_type = 'ai_copy' then
    select count(*) into current_count from public.usage_tracking 
    where user_id = auth.uid() and action_type = p_action_type and created_at >= today_start;
    limit_value := limits.ai_copy_daily;
  elsif p_action_type = 'ai_resize' then
    select count(*) into current_count from public.usage_tracking 
    where user_id = auth.uid() and action_type = p_action_type and created_at >= today_start;
    limit_value := limits.ai_resize_daily;
  elsif p_action_type = 'export' then
    select count(*) into current_count from public.usage_tracking 
    where user_id = auth.uid() and action_type = p_action_type and created_at >= month_start;
    limit_value := limits.export_monthly;
  else
    return json_build_object('success', false, 'error', 'Unknown action type');
  end if;
  
  -- Zkontrolovat limit (-1 = neomezeno)
  if limit_value != -1 and current_count >= limit_value then
    return json_build_object(
      'success', false, 
      'error', 'Limit reached',
      'limit', limit_value,
      'used', current_count,
      'plan', user_plan
    );
  end if;
  
  -- Zaznamenat použití
  insert into public.usage_tracking (user_id, action_type) values (auth.uid(), p_action_type);
  
  return json_build_object(
    'success', true,
    'remaining', case when limit_value = -1 then -1 else limit_value - current_count - 1 end,
    'plan', user_plan
  );
end;
$$;

-- ============================================================================
-- HOTOVO! Limity:
-- Free:  10 AI obrázků/den, 20 AI textů/den, 50 exportů/měsíc
-- Pro:   1000 všeho denně, 10000 exportů/měsíc  
-- Enterprise: Neomezeno
-- ============================================================================
