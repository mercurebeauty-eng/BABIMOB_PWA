-- ════════════════════════════════════════════════════════════════════════
--  BABIMOB — Audit + Fix complet
--  Exécuter dans l'éditeur SQL Supabase (une seule fois, idempotent)
-- ════════════════════════════════════════════════════════════════════════

-- ────────────────────────────────────────────────────────────────────────
-- SECTION 1 : COLONNES profiles (migration v6)
-- ────────────────────────────────────────────────────────────────────────
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS sub_tier             TEXT    DEFAULT 'free'  CHECK (sub_tier IN ('free','messenger','social','pro','elite'));
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS is_admin             BOOLEAN DEFAULT FALSE;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS is_verified_explorer BOOLEAN DEFAULT FALSE;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS total_points         INTEGER DEFAULT 0;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS broadcast_lat        DOUBLE PRECISION;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS broadcast_lon        DOUBLE PRECISION;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS broadcast_text       TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS last_broadcast_at    TIMESTAMPTZ;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS phone_number         TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS phone_marketing_consent BOOLEAN DEFAULT FALSE;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS is_public_visits     BOOLEAN DEFAULT FALSE;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS origin_commune       TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS preferred_transit_modes TEXT[] DEFAULT '{}';
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS whatsapp_number      TEXT;

-- ────────────────────────────────────────────────────────────────────────
-- SECTION 2 : TABLE user_badges
-- ────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS user_badges (
  id         UUID        PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id    UUID        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  badge_key  TEXT        NOT NULL,
  awarded_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (user_id, badge_key)
);
CREATE INDEX IF NOT EXISTS idx_badges_user ON user_badges (user_id);
ALTER TABLE user_badges ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "badges_select_all"  ON user_badges;
DROP POLICY IF EXISTS "badges_admin_write" ON user_badges;
DROP POLICY IF EXISTS "badges_self_select" ON user_badges;
CREATE POLICY "badges_self_select" ON user_badges FOR SELECT USING (auth.uid() = user_id);

-- ────────────────────────────────────────────────────────────────────────
-- SECTION 3 : TABLE reach_events (migration v7)
-- ────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS reach_events (
  id             UUID    PRIMARY KEY DEFAULT uuid_generate_v4(),
  target_user_id UUID    NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  source         TEXT    NOT NULL CHECK (source IN ('ticker', 'map', 'feed', 'broadcast')),
  day            DATE    NOT NULL DEFAULT CURRENT_DATE,
  count          INTEGER NOT NULL DEFAULT 1,
  UNIQUE (target_user_id, source, day)
);
CREATE INDEX IF NOT EXISTS idx_reach_target ON reach_events (target_user_id, day DESC);
ALTER TABLE reach_events ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "reach_self_select" ON reach_events;
CREATE POLICY "reach_self_select" ON reach_events FOR SELECT USING (auth.uid() = target_user_id);

-- ────────────────────────────────────────────────────────────────────────
-- SECTION 4 : FONCTIONS reach
-- ────────────────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION record_reach(p_user_id UUID, p_source TEXT)
RETURNS void LANGUAGE sql SECURITY DEFINER AS $$
  INSERT INTO reach_events (target_user_id, source, day, count)
  VALUES (p_user_id, p_source, CURRENT_DATE, 1)
  ON CONFLICT (target_user_id, source, day)
  DO UPDATE SET count = reach_events.count + 1;
$$;

CREATE OR REPLACE FUNCTION get_reach(p_user_id UUID, p_days INTEGER DEFAULT 30)
RETURNS INTEGER LANGUAGE sql SECURITY DEFINER AS $$
  SELECT COALESCE(SUM(count), 0)::INTEGER
  FROM reach_events
  WHERE target_user_id = p_user_id
    AND day >= CURRENT_DATE - p_days;
$$;

-- ────────────────────────────────────────────────────────────────────────
-- SECTION 5 : POLITIQUES RLS profiles
-- ────────────────────────────────────────────────────────────────────────
DROP POLICY IF EXISTS "profiles_admin_select"  ON profiles;
DROP POLICY IF EXISTS "profiles_public_select" ON profiles;

CREATE POLICY "profiles_admin_select" ON profiles FOR SELECT
  USING (
    auth.uid() = id
    OR EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.is_admin = TRUE)
  );

CREATE POLICY "profiles_public_select" ON profiles FOR SELECT
  USING (is_public_visits = TRUE OR auth.uid() = id);

-- ────────────────────────────────────────────────────────────────────────
-- SECTION 6 : BOOST ADMIN mercurebeauty@gmail.com
-- ────────────────────────────────────────────────────────────────────────
UPDATE profiles SET
  sub_tier             = 'elite',
  is_admin             = TRUE,
  is_verified_explorer = TRUE,
  total_points         = 9999,
  is_public_visits     = TRUE,
  display_name         = COALESCE(NULLIF(display_name, 'Explorateur'), 'Admin Babimob'),
  avatar_emoji         = '👑'
WHERE id = (SELECT id FROM auth.users WHERE email = 'mercurebeauty@gmail.com' LIMIT 1);

-- ────────────────────────────────────────────────────────────────────────
-- SECTION 7 : BADGES ADMIN
-- ────────────────────────────────────────────────────────────────────────
INSERT INTO user_badges (user_id, badge_key, awarded_at)
SELECT u.id, b.badge_key, NOW()
FROM auth.users u
CROSS JOIN (VALUES
  ('early_adopter'), ('explorer_verified'), ('checkin_master'),
  ('social_butterfly'), ('transport_guru'), ('commune_collector'), ('admin_elite')
) AS b(badge_key)
WHERE u.email = 'mercurebeauty@gmail.com'
ON CONFLICT (user_id, badge_key) DO NOTHING;

-- ════════════════════════════════════════════════════════════════════════
-- VÉRIFICATION FINALE — copie-colle ce SELECT séparément pour contrôler
-- ════════════════════════════════════════════════════════════════════════
SELECT
  p.id,
  u.email,
  p.display_name,
  p.avatar_emoji,
  p.sub_tier,
  p.is_admin,
  p.is_verified_explorer,
  p.total_points,
  p.is_public_visits,
  COUNT(b.badge_key) AS badge_count
FROM profiles p
JOIN auth.users u ON u.id = p.id
LEFT JOIN user_badges b ON b.user_id = p.id
WHERE u.email = 'mercurebeauty@gmail.com'
GROUP BY p.id, u.email, p.display_name, p.avatar_emoji,
         p.sub_tier, p.is_admin, p.is_verified_explorer,
         p.total_points, p.is_public_visits;
