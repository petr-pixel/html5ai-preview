-- ============================================================================
-- ADMIN SETUP pro AdCreative Studio
-- Spustit v Supabase SQL Editor
-- ============================================================================

-- 1. Přidat admin sloupec do user_profiles
alter table public.user_profiles 
add column if not exists is_admin boolean default false;

-- 2. Nastavit konkrétního uživatele jako admina (změň email!)
update public.user_profiles 
set is_admin = true 
where email = 'tvuj@email.cz';

-- 3. View pro admin statistiky - celkové využití projektu
create or replace view admin_stats as
select 
  -- Uživatelé
  (select count(*) from public.user_profiles) as total_users,
  (select count(*) from public.user_profiles where created_at > now() - interval '7 days') as new_users_7d,
  (select count(*) from public.user_profiles where created_at > now() - interval '30 days') as new_users_30d,
  
  -- Kreativy
  (select count(*) from public.creatives) as total_creatives,
  (select count(*) from public.creatives where created_at > now() - interval '7 days') as new_creatives_7d,
  (select coalesce(sum(file_size), 0) from public.creatives) as total_storage_bytes,
  
  -- Plány
  (select count(*) from public.user_profiles where plan = 'free') as free_users,
  (select count(*) from public.user_profiles where plan = 'pro') as pro_users,
  (select count(*) from public.user_profiles where plan = 'enterprise') as enterprise_users;

-- 4. View pro top uživatele podle využití
create or replace view admin_top_users as
select 
  up.id,
  up.email,
  up.name,
  up.plan,
  up.storage_used,
  up.storage_limit,
  round((up.storage_used::numeric / nullif(up.storage_limit, 0)::numeric) * 100, 1) as storage_percent,
  up.created_at,
  (select count(*) from public.creatives c where c.user_id = up.id) as creatives_count
from public.user_profiles up
order by up.storage_used desc
limit 50;

-- 5. View pro denní statistiky (posledních 30 dní)
create or replace view admin_daily_stats as
select 
  date_trunc('day', created_at)::date as day,
  count(*) as new_creatives,
  count(distinct user_id) as active_users
from public.creatives
where created_at > now() - interval '30 days'
group by date_trunc('day', created_at)
order by day desc;

-- 6. Funkce pro získání admin stats (volatelná z klienta)
create or replace function get_admin_stats()
returns json
language plpgsql
security definer
as $$
declare
  result json;
  is_user_admin boolean;
begin
  -- Ověř že volající je admin
  select is_admin into is_user_admin
  from public.user_profiles
  where id = auth.uid();
  
  if not coalesce(is_user_admin, false) then
    raise exception 'Unauthorized: Admin access required';
  end if;
  
  select json_build_object(
    'users', json_build_object(
      'total', (select count(*) from public.user_profiles),
      'new_7d', (select count(*) from public.user_profiles where created_at > now() - interval '7 days'),
      'new_30d', (select count(*) from public.user_profiles where created_at > now() - interval '30 days'),
      'by_plan', (
        select json_object_agg(plan, cnt)
        from (select plan, count(*) as cnt from public.user_profiles group by plan) t
      )
    ),
    'creatives', json_build_object(
      'total', (select count(*) from public.creatives),
      'new_7d', (select count(*) from public.creatives where created_at > now() - interval '7 days'),
      'new_30d', (select count(*) from public.creatives where created_at > now() - interval '30 days')
    ),
    'storage', json_build_object(
      'used_bytes', (select coalesce(sum(file_size), 0) from public.creatives),
      'used_mb', round((select coalesce(sum(file_size), 0) from public.creatives) / 1048576.0, 2),
      'limit_mb', 1024, -- 1 GB free tier
      'percent', round((select coalesce(sum(file_size), 0) from public.creatives) / 1073741824.0 * 100, 1)
    ),
    'top_users', (
      select json_agg(row_to_json(t))
      from (
        select 
          up.id,
          up.email,
          up.name,
          up.plan,
          round(up.storage_used / 1048576.0, 2) as storage_mb,
          (select count(*) from public.creatives c where c.user_id = up.id) as creatives
        from public.user_profiles up
        order by up.storage_used desc
        limit 10
      ) t
    )
  ) into result;
  
  return result;
end;
$$;

-- 7. RLS policy pro admin přístup
create policy "Admins can view all profiles"
  on public.user_profiles for select
  using (
    auth.uid() in (select id from public.user_profiles where is_admin = true)
  );

create policy "Admins can view all creatives"
  on public.creatives for select
  using (
    auth.uid() in (select id from public.user_profiles where is_admin = true)
  );

-- 8. Policy pro admin UPDATE uživatelů
create policy "Admins can update all profiles"
  on public.user_profiles for update
  using (
    auth.uid() in (select id from public.user_profiles where is_admin = true)
  );

-- 9. Trigger pro aktualizaci storage_used při přidání/smazání kreativy
create or replace function update_user_storage()
returns trigger as $$
begin
  if TG_OP = 'INSERT' then
    update public.user_profiles
    set storage_used = storage_used + NEW.file_size
    where id = NEW.user_id;
    return NEW;
  elsif TG_OP = 'DELETE' then
    update public.user_profiles
    set storage_used = storage_used - OLD.file_size
    where id = OLD.user_id;
    return OLD;
  end if;
  return null;
end;
$$ language plpgsql security definer;

drop trigger if exists on_creative_change on public.creatives;
create trigger on_creative_change
  after insert or delete on public.creatives
  for each row execute function update_user_storage();

-- ============================================================================
-- HOTOVO! Teď:
-- 1. Změň email v UPDATE příkazu na svůj
-- 2. Spusť celý script
-- 3. Admin dashboard bude dostupný na /admin (po implementaci)
-- ============================================================================
