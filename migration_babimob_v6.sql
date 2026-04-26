-- ════════════════════════════════════════════════════════════════════════
--  BABIMOB_PWA — Migration v6 — Colonnes profil, admin boost, user_badges
--
--  Idempotente : peut être relancée sans erreur.
--  À exécuter dans l'éditeur SQL Supabase APRÈS v5 et v5b.
-- ════════════════════════════════════════════════════════════════════════

-- ────────────────────────────────────────────────────────────────────────
-- 1. COLONNES MANQUANTES SUR profiles
-- ────────────────────────────────────────────────────────────────────────
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS sub_tier             TEXT DEFAULT 'free'  CHECK (sub_tier IN ('free','messenger','social','pro','elite'));
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
-- 2. TABLE user_badges
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
DROP POLICY IF EXISTS "badges_select_all" ON user_badges;
DROP POLICY IF EXISTS "badges_admin_write" ON user_badges;
CREATE POLICY "badges_select_all"  ON user_badges FOR SELECT USING (true);
CREATE POLICY "badges_self_select" ON user_badges FOR SELECT USING (auth.uid() = user_id);

-- ────────────────────────────────────────────────────────────────────────
-- 3. POLITIQUE RLS ADMIN — les admins voient tous les profils
-- ────────────────────────────────────────────────────────────────────────
DROP POLICY IF EXISTS "profiles_admin_select" ON profiles;
CREATE POLICY "profiles_admin_select" ON profiles
  FOR SELECT
  USING (
    auth.uid() = id
    OR EXISTS (
      SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.is_admin = TRUE
    )
  );

-- ────────────────────────────────────────────────────────────────────────
-- 4. POLITIQUE RLS — lectures publiques pour la carte Snap
--    (profils dont is_public_visits = true)
-- ────────────────────────────────────────────────────────────────────────
DROP POLICY IF EXISTS "profiles_public_select" ON profiles;
CREATE POLICY "profiles_public_select" ON profiles
  FOR SELECT
  USING (is_public_visits = TRUE OR auth.uid() = id);

-- ────────────────────────────────────────────────────────────────────────
-- 5. BOOST ADMIN — mercurebeauty@gmail.com → full access
-- ────────────────────────────────────────────────────────────────────────
UPDATE profiles SET
  sub_tier             = 'pro',
  is_admin             = TRUE,
  is_verified_explorer = TRUE,
  total_points         = 9999,
  is_public_visits     = TRUE,
  display_name         = COALESCE(NULLIF(display_name, 'Explorateur'), 'Admin Babimob'),
  avatar_emoji         = '👑'
WHERE id = (
  SELECT id FROM auth.users WHERE email = 'mercurebeauty@gmail.com'
  LIMIT 1
);

-- ────────────────────────────────────────────────────────────────────────
-- 6. BADGES ADMIN
-- ────────────────────────────────────────────────────────────────────────
INSERT INTO user_badges (user_id, badge_key, awarded_at)
SELECT
  u.id,
  b.badge_key,
  NOW()
FROM auth.users u
CROSS JOIN (VALUES
  ('early_adopter'),
  ('explorer_verified'),
  ('checkin_master'),
  ('social_butterfly'),
  ('transport_guru'),
  ('commune_collector'),
  ('admin_elite')
) AS b(badge_key)
WHERE u.email = 'mercurebeauty@gmail.com'
ON CONFLICT (user_id, badge_key) DO NOTHING;

-- ════════════════════════════════════════════════════════════════════════
--  Vérification après exécution :
--    SELECT sub_tier, is_admin, is_verified_explorer, total_points
--    FROM profiles
--    WHERE id = (SELECT id FROM auth.users WHERE email = 'mercurebeauty@gmail.com');
-- ════════════════════════════════════════════════════════════════════════
