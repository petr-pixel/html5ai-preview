-- ============================================================================
-- ADCREATIVE STUDIO - KOMPLETNÍ SUPABASE SETUP
-- Spustit v Supabase SQL Editor (celý script najednou)
-- ============================================================================

-- 1. Smazat existující policies (pokud existují) aby se předešlo konfliktům
DROP POLICY IF EXISTS "Users can view own profile" ON public.user_profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.user_profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON public.user_profiles;
DROP POLICY IF EXISTS "Admins can view all profiles" ON public.user_profiles;
DROP POLICY IF EXISTS "Admins can update all profiles" ON public.user_profiles;
DROP POLICY IF EXISTS "Users can view own creatives" ON public.creatives;
DROP POLICY IF EXISTS "Users can insert own creatives" ON public.creatives;
DROP POLICY IF EXISTS "Users can update own creatives" ON public.creatives;
DROP POLICY IF EXISTS "Users can delete own creatives" ON public.creatives;
DROP POLICY IF EXISTS "Admins can view all creatives" ON public.creatives;
DROP POLICY IF EXISTS "Users can manage own data" ON public.user_data;
DROP POLICY IF EXISTS "Users can insert own data" ON public.user_data;
DROP POLICY IF EXISTS "Users can update own data" ON public.user_data;
DROP POLICY IF EXISTS "Users can delete own data" ON public.user_data;

-- 2. Smazat existující triggery
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP TRIGGER IF EXISTS on_creative_change ON public.creatives;

-- 3. Smazat existující funkce
DROP FUNCTION IF EXISTS public.handle_new_user();
DROP FUNCTION IF EXISTS public.update_user_storage();
DROP FUNCTION IF EXISTS public.get_admin_stats();

-- ============================================================================
-- TABULKA: user_profiles
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.user_profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  name TEXT,
  avatar_url TEXT,
  plan TEXT DEFAULT 'free' CHECK (plan IN ('free', 'pro', 'enterprise')),
  storage_used BIGINT DEFAULT 0,
  storage_limit BIGINT DEFAULT 52428800, -- 50 MB (free plan)
  is_admin BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Přidat is_admin sloupec pokud neexistuje (pro existující tabulky)
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' AND table_name = 'user_profiles' AND column_name = 'is_admin') 
  THEN
    ALTER TABLE public.user_profiles ADD COLUMN is_admin BOOLEAN DEFAULT false;
  END IF;
END $$;

-- Index pro rychlé vyhledávání
CREATE INDEX IF NOT EXISTS idx_user_profiles_email ON public.user_profiles(email);

-- ============================================================================
-- TABULKA: creatives
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.creatives (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  format_key TEXT NOT NULL,
  platform TEXT,
  category TEXT,
  image_url TEXT,
  thumbnail_url TEXT,
  file_size BIGINT DEFAULT 0,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexy
CREATE INDEX IF NOT EXISTS idx_creatives_user_id ON public.creatives(user_id);
CREATE INDEX IF NOT EXISTS idx_creatives_created_at ON public.creatives(created_at DESC);

-- ============================================================================
-- TABULKA: user_data (pro brand kits, settings, atd.)
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.user_data (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  key TEXT NOT NULL,
  data JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, key)
);

-- Index
CREATE INDEX IF NOT EXISTS idx_user_data_user_key ON public.user_data(user_id, key);

-- ============================================================================
-- FUNKCE: Automatické vytvoření profilu při registraci
-- ============================================================================

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.user_profiles (id, email, name)
  VALUES (
    NEW.id, 
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'name', split_part(NEW.email, '@', 1))
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger pro nové uživatele
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ============================================================================
-- FUNKCE: Aktualizace storage při změně kreativ
-- ============================================================================

CREATE OR REPLACE FUNCTION public.update_user_storage()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE public.user_profiles
    SET storage_used = storage_used + COALESCE(NEW.file_size, 0)
    WHERE id = NEW.user_id;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE public.user_profiles
    SET storage_used = GREATEST(0, storage_used - COALESCE(OLD.file_size, 0))
    WHERE id = OLD.user_id;
    RETURN OLD;
  ELSIF TG_OP = 'UPDATE' THEN
    UPDATE public.user_profiles
    SET storage_used = storage_used - COALESCE(OLD.file_size, 0) + COALESCE(NEW.file_size, 0)
    WHERE id = NEW.user_id;
    RETURN NEW;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger pro storage tracking
CREATE TRIGGER on_creative_change
  AFTER INSERT OR DELETE OR UPDATE OF file_size ON public.creatives
  FOR EACH ROW EXECUTE FUNCTION public.update_user_storage();

-- ============================================================================
-- FUNKCE: Admin statistiky
-- ============================================================================

CREATE OR REPLACE FUNCTION public.get_admin_stats()
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  result JSON;
  is_user_admin BOOLEAN;
BEGIN
  -- Ověř že volající je admin
  SELECT is_admin INTO is_user_admin
  FROM public.user_profiles
  WHERE id = auth.uid();
  
  IF NOT COALESCE(is_user_admin, false) THEN
    RAISE EXCEPTION 'Unauthorized: Admin access required';
  END IF;
  
  SELECT json_build_object(
    'users', json_build_object(
      'total', (SELECT COUNT(*) FROM public.user_profiles),
      'new_7d', (SELECT COUNT(*) FROM public.user_profiles WHERE created_at > NOW() - INTERVAL '7 days'),
      'new_30d', (SELECT COUNT(*) FROM public.user_profiles WHERE created_at > NOW() - INTERVAL '30 days'),
      'by_plan', COALESCE(
        (SELECT json_object_agg(plan, cnt) FROM (SELECT plan, COUNT(*) as cnt FROM public.user_profiles GROUP BY plan) t),
        '{}'::json
      )
    ),
    'creatives', json_build_object(
      'total', (SELECT COUNT(*) FROM public.creatives),
      'new_7d', (SELECT COUNT(*) FROM public.creatives WHERE created_at > NOW() - INTERVAL '7 days'),
      'new_30d', (SELECT COUNT(*) FROM public.creatives WHERE created_at > NOW() - INTERVAL '30 days')
    ),
    'storage', json_build_object(
      'used_bytes', (SELECT COALESCE(SUM(file_size), 0) FROM public.creatives),
      'used_mb', ROUND((SELECT COALESCE(SUM(file_size), 0) FROM public.creatives) / 1048576.0, 2),
      'limit_mb', 1024,
      'percent', ROUND((SELECT COALESCE(SUM(file_size), 0) FROM public.creatives) / 1073741824.0 * 100, 1)
    ),
    'top_users', COALESCE(
      (SELECT json_agg(row_to_json(t)) FROM (
        SELECT 
          up.id,
          up.email,
          up.name,
          up.plan,
          ROUND(up.storage_used / 1048576.0, 2) as storage_mb,
          (SELECT COUNT(*) FROM public.creatives c WHERE c.user_id = up.id) as creatives
        FROM public.user_profiles up
        ORDER BY up.storage_used DESC
        LIMIT 10
      ) t),
      '[]'::json
    )
  ) INTO result;
  
  RETURN result;
END;
$$;

-- ============================================================================
-- RLS (Row Level Security)
-- ============================================================================

-- Zapnout RLS
ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.creatives ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_data ENABLE ROW LEVEL SECURITY;

-- USER PROFILES policies
CREATE POLICY "Users can view own profile"
  ON public.user_profiles FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON public.user_profiles FOR UPDATE
  USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile"
  ON public.user_profiles FOR INSERT
  WITH CHECK (auth.uid() = id);

-- Admin policies pro user_profiles
CREATE POLICY "Admins can view all profiles"
  ON public.user_profiles FOR SELECT
  USING (
    EXISTS (SELECT 1 FROM public.user_profiles WHERE id = auth.uid() AND is_admin = true)
  );

CREATE POLICY "Admins can update all profiles"
  ON public.user_profiles FOR UPDATE
  USING (
    EXISTS (SELECT 1 FROM public.user_profiles WHERE id = auth.uid() AND is_admin = true)
  );

-- CREATIVES policies
CREATE POLICY "Users can view own creatives"
  ON public.creatives FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own creatives"
  ON public.creatives FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own creatives"
  ON public.creatives FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own creatives"
  ON public.creatives FOR DELETE
  USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all creatives"
  ON public.creatives FOR SELECT
  USING (
    EXISTS (SELECT 1 FROM public.user_profiles WHERE id = auth.uid() AND is_admin = true)
  );

-- USER DATA policies
CREATE POLICY "Users can manage own data"
  ON public.user_data FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own data"
  ON public.user_data FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own data"
  ON public.user_data FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own data"
  ON public.user_data FOR DELETE
  USING (auth.uid() = user_id);

-- ============================================================================
-- VYTVOŘIT PROFIL PRO EXISTUJÍCÍHO UŽIVATELE (pokud chybí)
-- ============================================================================

INSERT INTO public.user_profiles (id, email, name, is_admin)
SELECT 
  id, 
  email, 
  COALESCE(raw_user_meta_data->>'name', split_part(email, '@', 1)),
  false
FROM auth.users
WHERE id NOT IN (SELECT id FROM public.user_profiles)
ON CONFLICT (id) DO NOTHING;

-- ============================================================================
-- NASTAVIT ADMINA (změň email na svůj!)
-- ============================================================================

UPDATE public.user_profiles 
SET is_admin = true 
WHERE email = 'svadlenpe@gmail.com';

-- ============================================================================
-- HOTOVO! Zkontroluj výsledek:
-- ============================================================================

SELECT 
  id, 
  email, 
  name, 
  plan, 
  is_admin, 
  storage_used, 
  storage_limit 
FROM public.user_profiles 
ORDER BY created_at DESC 
LIMIT 10;
