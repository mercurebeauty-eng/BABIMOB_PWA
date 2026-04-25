-- ════════════════════════════════════════════════════════════════════════
--  BABIMOB_PWA — Migration v5.0.0 — Social Check-in & Places Directory
--
--  À exécuter APRÈS migration_babimob_v4.sql dans l'éditeur SQL Supabase.
--  Ajoute : profiles, places, place_offers, checkins (v2)
-- ════════════════════════════════════════════════════════════════════════

-- ────────────────────────────────────────────────────────────────────────
-- 1. PROFILES
--    Profil public lié à auth.users (display_name + avatar_emoji)
--    Créé automatiquement au premier check-in si absent.
-- ────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS profiles (
  id           UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name TEXT NOT NULL DEFAULT 'Explorateur',
  avatar_emoji TEXT NOT NULL DEFAULT '🧭',
  created_at   TIMESTAMPTZ DEFAULT NOW(),
  updated_at   TIMESTAMPTZ DEFAULT NOW()
);

CREATE TRIGGER trg_profiles_touch
  BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION touch_updated_at();

-- ────────────────────────────────────────────────────────────────────────
-- 2. PLACES
--    Annuaire des lieux : partenaires sponsorisés + établissements vérifiés
--    complété par l'API Overpass (OSM) côté client pour les lieux non inscrits.
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

CREATE INDEX idx_places_commune   ON places (commune);
CREATE INDEX idx_places_category  ON places (category);
CREATE INDEX idx_places_sponsored ON places (is_sponsored, sponsor_tier);
CREATE INDEX idx_places_name_trgm ON places USING gin (name gin_trgm_ops);

CREATE TRIGGER trg_places_touch
  BEFORE UPDATE ON places
  FOR EACH ROW EXECUTE FUNCTION touch_updated_at();

-- ────────────────────────────────────────────────────────────────────────
-- 3. PLACE_OFFERS
--    Offres liées aux lieux (campagnes, menus du jour, promotions).
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

CREATE INDEX idx_offers_place  ON place_offers (place_id);
CREATE INDEX idx_offers_active ON place_offers (is_active, valid_until);

-- ────────────────────────────────────────────────────────────────────────
-- 4. CHECKINS v2
--    Lié aux lieux (place_id) et non plus aux arrêts GTFS.
--    Contrainte UNIQUE (user_id, place_id) → 1 seule visite par lieu par user.
--    lat/lon stockés pour alimenter la heatmap sans join supplémentaire.
--
--    ⚠ Si une table checkins existe déjà avec l'ancien schéma (stop_id),
--      exécuter d'abord : DROP TABLE IF EXISTS checkins;
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

CREATE INDEX idx_checkins_user   ON checkins (user_id, created_at DESC);
CREATE INDEX idx_checkins_place  ON checkins (place_id);
CREATE INDEX idx_checkins_public ON checkins (is_public, created_at DESC);
CREATE INDEX idx_checkins_recent ON checkins (created_at DESC);

-- ────────────────────────────────────────────────────────────────────────
-- 5. RLS — Row-Level Security
-- ────────────────────────────────────────────────────────────────────────

-- Profiles : chaque user ne voit et ne modifie que le sien
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "profiles_self_select" ON profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "profiles_self_insert" ON profiles FOR INSERT WITH CHECK (auth.uid() = id);
CREATE POLICY "profiles_self_update" ON profiles FOR UPDATE USING (auth.uid() = id);

-- Places : lecture publique / écriture service_role uniquement (back-office)
ALTER TABLE places ENABLE ROW LEVEL SECURITY;
CREATE POLICY "places_public_read" ON places FOR SELECT USING (TRUE);

-- Place Offers : lecture publique, uniquement si actif et non expiré
ALTER TABLE place_offers ENABLE ROW LEVEL SECURITY;
CREATE POLICY "offers_public_read" ON place_offers
  FOR SELECT USING (is_active AND (valid_until IS NULL OR valid_until > NOW()));

-- Checkins : check-ins publics lisibles par tous / CRUD sur les siens
ALTER TABLE checkins ENABLE ROW LEVEL SECURITY;
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
-- 6. REALTIME — Activer les événements INSERT sur checkins pour le feed live
-- ────────────────────────────────────────────────────────────────────────
ALTER PUBLICATION supabase_realtime ADD TABLE checkins;

-- ────────────────────────────────────────────────────────────────────────
-- 7. NOTE SUR user_favorites
--    Dans migration_v4, user_favorites.user_id référence users(id) (bot Telegram).
--    La PWA utilise auth.uid() → le RLS est suffisant pour l'isolation,
--    mais la FK ne peut pas pointer vers auth.users en même temps.
--    Solution recommandée pour plus tard : recréer la table avec
--    REFERENCES auth.users(id) ou supprimer la FK et garder le RLS seul.
-- ────────────────────────────────────────────────────────────────────────

-- ════════════════════════════════════════════════════════════════════════
--  Fin de la migration v5.
--  Vérification rapide après exécution :
--    SELECT table_name FROM information_schema.tables
--    WHERE table_schema = 'public'
--    AND table_name IN ('profiles','places','place_offers','checkins');
-- ════════════════════════════════════════════════════════════════════════
