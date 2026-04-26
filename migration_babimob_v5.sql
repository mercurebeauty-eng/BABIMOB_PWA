-- ════════════════════════════════════════════════════════════════════════
--  BABIMOB_PWA — Migration v5.0.0 — Social Check-in & Places Directory
--
--  À exécuter APRÈS migration_babimob_v4.sql dans l'éditeur SQL Supabase.
--  Entièrement idempotente : peut être relancée sans erreur si déjà appliquée.
-- ════════════════════════════════════════════════════════════════════════

-- ────────────────────────────────────────────────────────────────────────
-- 1. PROFILES
-- ────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS profiles (
  id           UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name TEXT NOT NULL DEFAULT 'Explorateur',
  avatar_emoji TEXT NOT NULL DEFAULT '🧭',
  created_at   TIMESTAMPTZ DEFAULT NOW(),
  updated_at   TIMESTAMPTZ DEFAULT NOW()
);

DROP TRIGGER IF EXISTS trg_profiles_touch ON profiles;
CREATE TRIGGER trg_profiles_touch
  BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION touch_updated_at();

-- ────────────────────────────────────────────────────────────────────────
-- 2. PLACES
-- ────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS places (
  id                  UUID        PRIMARY KEY DEFAULT uuid_generate_v4(),
  osm_id              TEXT        UNIQUE,
  name                TEXT        NOT NULL,
  lat                 DOUBLE PRECISION NOT NULL,
  lon                 DOUBLE PRECISION NOT NULL,
  category            TEXT        NOT NULL DEFAULT 'other'
                      CHECK (category IN ('food','shop','service','health','entertainment','other')),
  subcategory         TEXT,
  description         TEXT,
  address             TEXT,
  commune             TEXT,
  phone               TEXT,
  whatsapp            TEXT,
  instagram           TEXT,
  website             TEXT,
  logo_emoji          TEXT        DEFAULT '🏢',
  cover_color         TEXT        DEFAULT '#FF7A00',
  verified            BOOLEAN     DEFAULT FALSE,
  is_sponsored        BOOLEAN     DEFAULT FALSE,
  sponsor_tier        TEXT        CHECK (sponsor_tier IN ('pro','elite')),
  sponsor_expires_at  TIMESTAMPTZ,
  has_campaign        BOOLEAN     DEFAULT FALSE,
  campaign_label      TEXT,
  campaign_expires_at TIMESTAMPTZ,
  created_at          TIMESTAMPTZ DEFAULT NOW(),
  updated_at          TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_places_commune   ON places (commune);
CREATE INDEX IF NOT EXISTS idx_places_category  ON places (category);
CREATE INDEX IF NOT EXISTS idx_places_sponsored ON places (is_sponsored, sponsor_tier);
CREATE INDEX IF NOT EXISTS idx_places_name_trgm ON places USING gin (name gin_trgm_ops);

DROP TRIGGER IF EXISTS trg_places_touch ON places;
CREATE TRIGGER trg_places_touch
  BEFORE UPDATE ON places
  FOR EACH ROW EXECUTE FUNCTION touch_updated_at();

-- ────────────────────────────────────────────────────────────────────────
-- 3. PLACE_OFFERS
-- ────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS place_offers (
  id          UUID        PRIMARY KEY DEFAULT uuid_generate_v4(),
  place_id    UUID        NOT NULL REFERENCES places(id) ON DELETE CASCADE,
  title       TEXT        NOT NULL,
  description TEXT,
  image_url   TEXT,
  valid_from  TIMESTAMPTZ,
  valid_until TIMESTAMPTZ,
  is_active   BOOLEAN     DEFAULT TRUE,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_offers_place  ON place_offers (place_id);
CREATE INDEX IF NOT EXISTS idx_offers_active ON place_offers (is_active, valid_until);

-- ────────────────────────────────────────────────────────────────────────
-- 4. CHECKINS v2
--    UNIQUE (user_id, place_id) → 1 seule visite par lieu par user.
--    lat/lon stockés pour la heatmap sans join supplémentaire.
-- ────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS checkins (
  id           UUID        PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id      UUID        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  place_id     TEXT        NOT NULL,
  place_name   TEXT        NOT NULL,
  commune      TEXT,
  lat          DOUBLE PRECISION,
  lon          DOUBLE PRECISION,
  is_public    BOOLEAN     DEFAULT TRUE,
  display_name TEXT        NOT NULL DEFAULT 'Explorateur',
  avatar_emoji TEXT        NOT NULL DEFAULT '🧭',
  created_at   TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT checkins_unique_user_place UNIQUE (user_id, place_id)
);

CREATE INDEX IF NOT EXISTS idx_checkins_user   ON checkins (user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_checkins_place  ON checkins (place_id);
CREATE INDEX IF NOT EXISTS idx_checkins_public ON checkins (is_public, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_checkins_recent ON checkins (created_at DESC);

-- ────────────────────────────────────────────────────────────────────────
-- 5. RLS — Row-Level Security
-- ────────────────────────────────────────────────────────────────────────

-- profiles
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "profiles_self_select" ON profiles;
DROP POLICY IF EXISTS "profiles_self_insert" ON profiles;
DROP POLICY IF EXISTS "profiles_self_update" ON profiles;
CREATE POLICY "profiles_self_select" ON profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "profiles_self_insert" ON profiles FOR INSERT WITH CHECK (auth.uid() = id);
CREATE POLICY "profiles_self_update" ON profiles FOR UPDATE USING (auth.uid() = id);

-- places
ALTER TABLE places ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "places_public_read" ON places;
CREATE POLICY "places_public_read" ON places FOR SELECT USING (TRUE);

-- place_offers
ALTER TABLE place_offers ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "offers_public_read" ON place_offers;
CREATE POLICY "offers_public_read" ON place_offers
  FOR SELECT USING (is_active AND (valid_until IS NULL OR valid_until > NOW()));

-- checkins
ALTER TABLE checkins ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "checkins_public_read"  ON checkins;
DROP POLICY IF EXISTS "checkins_self_insert"  ON checkins;
DROP POLICY IF EXISTS "checkins_self_delete"  ON checkins;
CREATE POLICY "checkins_public_read"
  ON checkins FOR SELECT
  USING (is_public = TRUE OR auth.uid() = user_id);
CREATE POLICY "checkins_self_insert"
  ON checkins FOR INSERT
  WITH CHECK (auth.uid() = user_id);
CREATE POLICY "checkins_self_delete"
  ON checkins FOR DELETE
  USING (auth.uid() = user_id);

-- ────────────────────────────────────────────────────────────────────────
-- 6. REALTIME — Activer le feed live C'comment (ignore si déjà ajouté)
-- ────────────────────────────────────────────────────────────────────────
DO $$
BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE checkins;
EXCEPTION WHEN duplicate_object THEN
  NULL; -- déjà dans la publication, on ignore
END;
$$;

-- ════════════════════════════════════════════════════════════════════════
--  Vérification rapide après exécution :
--    SELECT table_name FROM information_schema.tables
--    WHERE table_schema = 'public'
--    AND table_name IN ('profiles','places','place_offers','checkins');
-- ════════════════════════════════════════════════════════════════════════
