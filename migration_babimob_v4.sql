-- ════════════════════════════════════════════════════════════════════════
--  BABIMOB_PWA — Migration Supabase v4.0.0
--  Architecture : GTFS (mirror) + Business + Payments CinetPay + PostGIS
--  À exécuter UNE SEULE FOIS dans l'éditeur SQL du projet Supabase vide.
-- ════════════════════════════════════════════════════════════════════════

-- ────────────────────────────────────────────────────────────────────────
-- 0) Extensions
-- ────────────────────────────────────────────────────────────────────────
CREATE EXTENSION IF NOT EXISTS postgis;
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS pg_trgm;  -- recherche fuzzy sur noms d'arrêts

-- ════════════════════════════════════════════════════════════════════════
--  COUCHE 1 : GTFS (mirror fidèle, réingérable)
-- ════════════════════════════════════════════════════════════════════════

-- Tracking des feeds GTFS importés (permet de tourner plusieurs versions)
CREATE TABLE gtfs_feeds (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  version       TEXT NOT NULL,
  publisher     TEXT,
  start_date    DATE,
  end_date      DATE,
  checksum      TEXT,
  imported_at   TIMESTAMPTZ DEFAULT NOW(),
  is_active     BOOLEAN DEFAULT FALSE
);
CREATE UNIQUE INDEX idx_gtfs_feeds_active ON gtfs_feeds (is_active) WHERE is_active;

-- Agences (gbaka + woro-woro par commune). agency_id = nom (source GTFS).
CREATE TABLE gtfs_agencies (
  agency_id       TEXT PRIMARY KEY,
  agency_name     TEXT NOT NULL,
  agency_lang     TEXT,
  agency_timezone TEXT DEFAULT 'Africa/Abidjan',
  agency_url      TEXT,
  agency_phone    TEXT,
  agency_email    TEXT
);

-- Lignes (490 routes dans le feed)
CREATE TABLE gtfs_routes (
  route_id         TEXT PRIMARY KEY,
  agency_id        TEXT REFERENCES gtfs_agencies(agency_id) ON DELETE SET NULL,
  route_short_name TEXT,
  route_long_name  TEXT,
  route_desc       TEXT,
  route_type       INTEGER,                -- 3 = bus (tous les gbaka/woro)
  route_color      TEXT,
  route_text_color TEXT
);
CREATE INDEX idx_routes_agency ON gtfs_routes (agency_id);
CREATE INDEX idx_routes_name_trgm ON gtfs_routes USING gin (route_long_name gin_trgm_ops);

-- Arrêts (4834 stops, géolocalisés)
CREATE TABLE gtfs_stops (
  stop_id        TEXT PRIMARY KEY,
  stop_name      TEXT NOT NULL,
  stop_desc      TEXT,
  stop_lat       DOUBLE PRECISION NOT NULL,
  stop_lon       DOUBLE PRECISION NOT NULL,
  geom           geography(Point, 4326)
                 GENERATED ALWAYS AS (ST_SetSRID(ST_MakePoint(stop_lon, stop_lat), 4326)::geography) STORED,
  location_type  INTEGER DEFAULT 0,
  parent_station TEXT,
  commune        TEXT,   -- rempli par une passe après import via detecter_commune()
  stop_code      TEXT,
  stop_url       TEXT
);
CREATE INDEX idx_stops_geom ON gtfs_stops USING GIST (geom);
CREATE INDEX idx_stops_name_trgm ON gtfs_stops USING gin (stop_name gin_trgm_ops);
CREATE INDEX idx_stops_commune ON gtfs_stops (commune);

-- Services (calendrier : ex. Mo-Su = tous les jours)
CREATE TABLE gtfs_calendar (
  service_id TEXT PRIMARY KEY,
  monday     BOOLEAN DEFAULT TRUE,
  tuesday    BOOLEAN DEFAULT TRUE,
  wednesday  BOOLEAN DEFAULT TRUE,
  thursday   BOOLEAN DEFAULT TRUE,
  friday     BOOLEAN DEFAULT TRUE,
  saturday   BOOLEAN DEFAULT TRUE,
  sunday     BOOLEAN DEFAULT TRUE,
  start_date DATE,
  end_date   DATE
);

-- Trajets (980 trips : 1 aller + 1 retour ≈)
CREATE TABLE gtfs_trips (
  trip_id                TEXT PRIMARY KEY,
  route_id               TEXT REFERENCES gtfs_routes(route_id) ON DELETE CASCADE,
  service_id             TEXT REFERENCES gtfs_calendar(service_id) ON DELETE SET NULL,
  shape_id               TEXT,
  trip_headsign          TEXT,
  trip_short_name        TEXT,
  direction_id           INTEGER,
  wheelchair_accessible  INTEGER
);
CREATE INDEX idx_trips_route ON gtfs_trips (route_id);
CREATE INDEX idx_trips_shape ON gtfs_trips (shape_id);

-- Séquence des arrêts par trajet (15 683 stop_times)
CREATE TABLE gtfs_stop_times (
  trip_id        TEXT NOT NULL REFERENCES gtfs_trips(trip_id) ON DELETE CASCADE,
  stop_id        TEXT NOT NULL REFERENCES gtfs_stops(stop_id) ON DELETE CASCADE,
  stop_sequence  INTEGER NOT NULL,
  arrival_time   TEXT,   -- GTFS accepte 25:00:00, donc TEXT (pas TIME)
  departure_time TEXT,
  stop_headsign  TEXT,
  pickup_type    INTEGER,
  drop_off_type  INTEGER,
  timepoint      INTEGER,
  PRIMARY KEY (trip_id, stop_sequence)
);
CREATE INDEX idx_stoptimes_stop ON gtfs_stop_times (stop_id);
CREATE INDEX idx_stoptimes_trip ON gtfs_stop_times (trip_id);

-- Fréquences de passage (par tranche horaire)
CREATE TABLE gtfs_frequencies (
  trip_id      TEXT NOT NULL REFERENCES gtfs_trips(trip_id) ON DELETE CASCADE,
  start_time   TEXT NOT NULL,
  end_time     TEXT NOT NULL,
  headway_secs INTEGER NOT NULL,
  exact_times  INTEGER DEFAULT 0,
  PRIMARY KEY (trip_id, start_time)
);
CREATE INDEX idx_frequencies_trip ON gtfs_frequencies (trip_id);

-- Tracés géométriques (74 504 points)
CREATE TABLE gtfs_shapes (
  shape_id           TEXT NOT NULL,
  shape_pt_sequence  INTEGER NOT NULL,
  shape_pt_lat       DOUBLE PRECISION NOT NULL,
  shape_pt_lon       DOUBLE PRECISION NOT NULL,
  shape_dist_traveled DOUBLE PRECISION,
  geom               geography(Point, 4326)
                     GENERATED ALWAYS AS (ST_SetSRID(ST_MakePoint(shape_pt_lon, shape_pt_lat), 4326)::geography) STORED,
  PRIMARY KEY (shape_id, shape_pt_sequence)
);
CREATE INDEX idx_shapes_id ON gtfs_shapes (shape_id);

-- Vue matérialisée : LineString par shape_id (pour affichage carte rapide)
CREATE MATERIALIZED VIEW gtfs_shape_lines AS
SELECT
  shape_id,
  ST_MakeLine(geom::geometry ORDER BY shape_pt_sequence)::geography AS geom,
  ST_Length(ST_MakeLine(geom::geometry ORDER BY shape_pt_sequence)::geography) AS length_m
FROM gtfs_shapes
GROUP BY shape_id;
CREATE UNIQUE INDEX idx_shapelines_id ON gtfs_shape_lines (shape_id);
CREATE INDEX idx_shapelines_geom ON gtfs_shape_lines USING GIST (geom);

-- ════════════════════════════════════════════════════════════════════════
--  COUCHE 2 : Communes (polygones Abidjan pour reverse-geocoding)
-- ════════════════════════════════════════════════════════════════════════
CREATE TABLE communes (
  id       SERIAL PRIMARY KEY,
  name     TEXT UNIQUE NOT NULL,
  geom     geography(MultiPolygon, 4326) NOT NULL,
  centroid geography(Point, 4326)
);
CREATE INDEX idx_communes_geom ON communes USING GIST (geom);

-- ════════════════════════════════════════════════════════════════════════
--  COUCHE 3 : Business (users, quotas, favoris, recherches, feedback)
-- ════════════════════════════════════════════════════════════════════════

-- Utilisateurs abstraits (indépendants du canal d'accès)
CREATE TABLE users (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  display_name  TEXT,
  avatar_url    TEXT,
  locale        TEXT DEFAULT 'fr',
  is_active     BOOLEAN DEFAULT TRUE,
  is_admin      BOOLEAN DEFAULT FALSE,
  created_at    TIMESTAMPTZ DEFAULT NOW(),
  updated_at    TIMESTAMPTZ DEFAULT NOW()
);

-- Identités externes (telegram / web / ios / android / email)
CREATE TABLE user_identities (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id     UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  provider    TEXT NOT NULL CHECK (provider IN ('telegram','web','ios','android','email')),
  external_id TEXT NOT NULL,
  metadata    JSONB DEFAULT '{}'::jsonb,
  created_at  TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (provider, external_id)
);
CREATE INDEX idx_identities_user ON user_identities (user_id);

-- Quotas (repris de v3.10, rebranché sur user_id UUID)
CREATE TABLE user_quotas (
  user_id                UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  requetes_gratuites     INTEGER DEFAULT 30,
  requetes_restantes     INTEGER DEFAULT 30,
  requetes_bonus         INTEGER DEFAULT 0,
  reset_gratuit_at       DATE DEFAULT DATE_TRUNC('month', NOW())::date,
  essai_premium_active   BOOLEAN DEFAULT TRUE,
  essai_premium_expire   DATE DEFAULT (CURRENT_DATE + INTERVAL '14 days'),
  premium_active         BOOLEAN DEFAULT FALSE,
  premium_since          TIMESTAMPTZ,
  updated_at             TIMESTAMPTZ DEFAULT NOW()
);

-- Favoris (domicile, travail, lignes sauvegardées)
CREATE TABLE user_favorites (
  id         UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id    UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  kind       TEXT NOT NULL CHECK (kind IN ('place','stop','route')),
  label      TEXT NOT NULL,             -- "Maison", "Travail", nom ligne
  stop_id    TEXT,                      -- FK souple (pas strict vers gtfs_stops)
  route_id   TEXT,
  lat        DOUBLE PRECISION,
  lon        DOUBLE PRECISION,
  geom       geography(Point, 4326)
             GENERATED ALWAYS AS (
               CASE WHEN lat IS NOT NULL AND lon IS NOT NULL
                    THEN ST_SetSRID(ST_MakePoint(lon, lat), 4326)::geography
                    ELSE NULL END
             ) STORED,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX idx_favs_user ON user_favorites (user_id);
CREATE INDEX idx_favs_geom ON user_favorites USING GIST (geom);

-- Recherches (analytics — qui cherche quoi, depuis où, quel résultat)
CREATE TABLE searches (
  id                UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id           UUID REFERENCES users(id) ON DELETE SET NULL,
  channel           TEXT CHECK (channel IN ('telegram','web','ios','android')),
  query_raw         TEXT,
  query_type        TEXT CHECK (query_type IN ('destination','itineraire','arrets_proches','ligne','commune','autre')),
  commune           TEXT,
  route_id          TEXT,
  origin_lat        DOUBLE PRECISION,
  origin_lon        DOUBLE PRECISION,
  destination_lat   DOUBLE PRECISION,
  destination_lon   DOUBLE PRECISION,
  result_count      INTEGER,
  response_time_ms  INTEGER,
  success           BOOLEAN,
  created_at        TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX idx_searches_user_time ON searches (user_id, created_at DESC);
CREATE INDEX idx_searches_commune ON searches (commune);
CREATE INDEX idx_searches_type ON searches (query_type);

-- Feedback (crowdsourcing : arrêt déplacé, ligne qui ne passe plus)
CREATE TABLE feedback (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id     UUID REFERENCES users(id) ON DELETE SET NULL,
  target_type TEXT CHECK (target_type IN ('stop','route','trip','general')),
  target_id   TEXT,
  issue       TEXT CHECK (issue IN ('not_running','wrong_location','name_error','missing','other')),
  message     TEXT,
  lat         DOUBLE PRECISION,
  lon         DOUBLE PRECISION,
  verified    BOOLEAN DEFAULT FALSE,
  verified_by UUID REFERENCES users(id),
  verified_at TIMESTAMPTZ,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX idx_feedback_target ON feedback (target_type, target_id);
CREATE INDEX idx_feedback_verified ON feedback (verified);

-- ════════════════════════════════════════════════════════════════════════
--  COUCHE 4 : Paiements (CinetPay)
-- ════════════════════════════════════════════════════════════════════════

-- Plans tarifaires (référentiel simple, modifiable sans code)
CREATE TABLE payment_plans (
  key               TEXT PRIMARY KEY,
  label             TEXT NOT NULL,
  amount            INTEGER NOT NULL,    -- en FCFA, entiers
  requetes          INTEGER DEFAULT 0,
  premium_months    INTEGER DEFAULT 0,   -- 0 si juste recharge, >0 si abonnement
  is_active         BOOLEAN DEFAULT TRUE,
  sort_order        INTEGER DEFAULT 0
);

INSERT INTO payment_plans (key, label, amount, requetes, premium_months, sort_order) VALUES
  ('pack_30',      'Pack 30 requêtes',          500,   30,  0, 1),
  ('pack_150',    'Pack 150 requêtes',         1000,  150,  0, 2),
  ('premium_500', 'Abonnement Premium (500 req + accès avancé)', 2500, 500, 1, 3);

-- Transactions CinetPay
CREATE TABLE payments (
  id                    UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id               UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  transaction_id        TEXT UNIQUE NOT NULL,              -- ID qu'on envoie à CinetPay
  cpm_trans_id          TEXT,                              -- ID renvoyé par CinetPay
  plan_key              TEXT REFERENCES payment_plans(key),
  amount                INTEGER NOT NULL,
  currency              CHAR(3) DEFAULT 'XOF',
  description           TEXT,
  status                TEXT NOT NULL DEFAULT 'pending'
                        CHECK (status IN ('pending','success','failed','cancelled','expired','refunded')),
  payment_method        TEXT,                              -- wave, orange_money, mtn_momo, moov_money, card
  operator_txn_id       TEXT,                              -- ID côté opérateur télécom
  phone_number          TEXT,
  customer_name         TEXT,
  customer_email        TEXT,
  payment_url           TEXT,                              -- URL retournée par CinetPay
  return_url            TEXT,
  notify_url            TEXT,
  signature_verified    BOOLEAN DEFAULT FALSE,
  raw_init_response     JSONB,                             -- réponse brute à l'init
  raw_webhook           JSONB,                             -- payload brut du webhook
  raw_verify_response   JSONB,                             -- réponse brute de /payment/check
  error_message         TEXT,
  created_at            TIMESTAMPTZ DEFAULT NOW(),
  completed_at          TIMESTAMPTZ,
  updated_at            TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX idx_payments_user ON payments (user_id, created_at DESC);
CREATE INDEX idx_payments_status ON payments (status);
CREATE INDEX idx_payments_txn ON payments (transaction_id);
CREATE INDEX idx_payments_cpm ON payments (cpm_trans_id);

-- Trigger : mise à jour automatique de updated_at
CREATE OR REPLACE FUNCTION touch_updated_at() RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at := NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_users_touch        BEFORE UPDATE ON users       FOR EACH ROW EXECUTE FUNCTION touch_updated_at();
CREATE TRIGGER trg_quotas_touch       BEFORE UPDATE ON user_quotas FOR EACH ROW EXECUTE FUNCTION touch_updated_at();
CREATE TRIGGER trg_payments_touch     BEFORE UPDATE ON payments    FOR EACH ROW EXECUTE FUNCTION touch_updated_at();

-- ════════════════════════════════════════════════════════════════════════
--  RPC : Logique métier
-- ════════════════════════════════════════════════════════════════════════

-- Détecter la commune d'un point (lat, lon) via point-in-polygon
CREATE OR REPLACE FUNCTION detecter_commune(p_lat DOUBLE PRECISION, p_lon DOUBLE PRECISION)
RETURNS TEXT LANGUAGE sql STABLE AS $$
  SELECT name
    FROM communes
   WHERE ST_Intersects(
           geom,
           ST_SetSRID(ST_MakePoint(p_lon, p_lat), 4326)::geography
         )
   LIMIT 1;
$$;

-- Arrêts proches d'un point (PostGIS, rapide grâce à l'index GIST)
CREATE OR REPLACE FUNCTION arrets_proches(
  p_lat      DOUBLE PRECISION,
  p_lon      DOUBLE PRECISION,
  p_radius_m INTEGER DEFAULT 500,
  p_limit    INTEGER DEFAULT 20
)
RETURNS TABLE (
  stop_id      TEXT,
  stop_name    TEXT,
  commune      TEXT,
  distance_m   DOUBLE PRECISION,
  stop_lat     DOUBLE PRECISION,
  stop_lon     DOUBLE PRECISION
) LANGUAGE sql STABLE AS $$
  SELECT
    s.stop_id,
    s.stop_name,
    s.commune,
    ST_Distance(s.geom, ST_SetSRID(ST_MakePoint(p_lon, p_lat), 4326)::geography) AS distance_m,
    s.stop_lat,
    s.stop_lon
  FROM gtfs_stops s
  WHERE ST_DWithin(
          s.geom,
          ST_SetSRID(ST_MakePoint(p_lon, p_lat), 4326)::geography,
          p_radius_m
        )
  ORDER BY distance_m
  LIMIT p_limit;
$$;

-- Lignes passant par un arrêt
CREATE OR REPLACE FUNCTION lignes_par_arret(p_stop_id TEXT)
RETURNS TABLE (
  route_id         TEXT,
  route_long_name  TEXT,
  agency_id        TEXT,
  direction_id     INTEGER,
  trip_headsign    TEXT
) LANGUAGE sql STABLE AS $$
  SELECT DISTINCT r.route_id, r.route_long_name, r.agency_id, t.direction_id, t.trip_headsign
    FROM gtfs_stop_times st
    JOIN gtfs_trips  t ON t.trip_id = st.trip_id
    JOIN gtfs_routes r ON r.route_id = t.route_id
   WHERE st.stop_id = p_stop_id
   ORDER BY r.route_long_name;
$$;

-- Lignes desservant une commune
CREATE OR REPLACE FUNCTION lignes_par_commune(p_commune TEXT)
RETURNS TABLE (
  route_id         TEXT,
  route_long_name  TEXT,
  agency_id        TEXT,
  nb_arrets        INTEGER
) LANGUAGE sql STABLE AS $$
  SELECT r.route_id, r.route_long_name, r.agency_id, COUNT(DISTINCT s.stop_id)::int AS nb_arrets
    FROM gtfs_stops s
    JOIN gtfs_stop_times st ON st.stop_id = s.stop_id
    JOIN gtfs_trips t       ON t.trip_id  = st.trip_id
    JOIN gtfs_routes r      ON r.route_id = t.route_id
   WHERE s.commune = p_commune
   GROUP BY r.route_id, r.route_long_name, r.agency_id
   ORDER BY nb_arrets DESC;
$$;

-- Fréquence d'une ligne à une heure donnée (ex : "à 8h30, ça passe toutes les ~X min")
CREATE OR REPLACE FUNCTION frequence_ligne_a_heure(
  p_route_id TEXT,
  p_heure    TEXT DEFAULT to_char(NOW() AT TIME ZONE 'Africa/Abidjan', 'HH24:MI:SS')
)
RETURNS TABLE (
  trip_id       TEXT,
  direction_id  INTEGER,
  headsign      TEXT,
  headway_min   NUMERIC
) LANGUAGE sql STABLE AS $$
  SELECT t.trip_id, t.direction_id, t.trip_headsign,
         ROUND(f.headway_secs / 60.0, 1) AS headway_min
    FROM gtfs_trips t
    JOIN gtfs_frequencies f ON f.trip_id = t.trip_id
   WHERE t.route_id = p_route_id
     AND p_heure >= f.start_time
     AND p_heure <  f.end_time
   ORDER BY t.direction_id;
$$;

-- Résolution / création d'un user à partir de (provider, external_id)
CREATE OR REPLACE FUNCTION resolve_or_create_user(
  p_provider    TEXT,
  p_external_id TEXT,
  p_metadata    JSONB DEFAULT '{}'::jsonb
)
RETURNS UUID LANGUAGE plpgsql AS $$
DECLARE
  v_user_id UUID;
BEGIN
  SELECT user_id INTO v_user_id
    FROM user_identities
   WHERE provider = p_provider AND external_id = p_external_id;

  IF v_user_id IS NULL THEN
    INSERT INTO users DEFAULT VALUES RETURNING id INTO v_user_id;
    INSERT INTO user_identities (user_id, provider, external_id, metadata)
    VALUES (v_user_id, p_provider, p_external_id, p_metadata);
    INSERT INTO user_quotas (user_id) VALUES (v_user_id);
  END IF;

  RETURN v_user_id;
END;
$$;

-- Consommer 1 requête (équivalent de v3.10, rebranché sur user_id UUID)
CREATE OR REPLACE FUNCTION consommer_requete(
  p_user_id      UUID,
  OUT autorise   BOOLEAN,
  OUT reset_effectue BOOLEAN
)
LANGUAGE plpgsql AS $$
DECLARE
  v_q             user_quotas%ROWTYPE;
  v_current_month DATE := DATE_TRUNC('month', NOW())::date;
BEGIN
  SELECT * INTO v_q FROM user_quotas WHERE user_id = p_user_id FOR UPDATE;

  IF NOT FOUND THEN
    INSERT INTO user_quotas (user_id) VALUES (p_user_id)
      RETURNING * INTO v_q;
    autorise := TRUE; reset_effectue := TRUE;
    UPDATE user_quotas SET requetes_restantes = v_q.requetes_restantes - 1 WHERE user_id = p_user_id;
    RETURN;
  END IF;

  reset_effectue := FALSE;
  IF v_q.reset_gratuit_at < v_current_month THEN
    UPDATE user_quotas
       SET requetes_gratuites = 30,
           requetes_restantes = 30,
           reset_gratuit_at   = v_current_month
     WHERE user_id = p_user_id;
    v_q.requetes_restantes := 30;
    reset_effectue := TRUE;
  END IF;

  IF v_q.requetes_restantes > 0 THEN
    UPDATE user_quotas SET requetes_restantes = requetes_restantes - 1 WHERE user_id = p_user_id;
    autorise := TRUE;
  ELSIF v_q.requetes_bonus > 0 THEN
    UPDATE user_quotas SET requetes_bonus = requetes_bonus - 1 WHERE user_id = p_user_id;
    autorise := TRUE;
  ELSE
    autorise := FALSE;
  END IF;
END;
$$;

-- Appliquer un plan payé (appelé depuis le webhook CinetPay quand status = success)
CREATE OR REPLACE FUNCTION appliquer_plan_paye(
  p_user_id  UUID,
  p_plan_key TEXT
)
RETURNS VOID LANGUAGE plpgsql AS $$
DECLARE
  v_plan payment_plans%ROWTYPE;
BEGIN
  SELECT * INTO v_plan FROM payment_plans WHERE key = p_plan_key AND is_active;
  IF NOT FOUND THEN RAISE EXCEPTION 'Plan inconnu ou inactif: %', p_plan_key; END IF;

  -- S'assurer qu'un quota existe
  INSERT INTO user_quotas (user_id) VALUES (p_user_id) ON CONFLICT DO NOTHING;

  UPDATE user_quotas
     SET requetes_bonus = requetes_bonus + v_plan.requetes,
         premium_active = CASE WHEN v_plan.premium_months > 0 THEN TRUE ELSE premium_active END,
         essai_premium_active = CASE WHEN v_plan.premium_months > 0 THEN FALSE ELSE essai_premium_active END,
         premium_since  = CASE WHEN v_plan.premium_months > 0 AND premium_since IS NULL THEN NOW() ELSE premium_since END
   WHERE user_id = p_user_id;
END;
$$;

-- ════════════════════════════════════════════════════════════════════════
--  RLS : Row-Level Security
-- ════════════════════════════════════════════════════════════════════════

-- Lecture publique sur les tables GTFS et communes (anon key → SELECT OK)
ALTER TABLE gtfs_agencies     ENABLE ROW LEVEL SECURITY;
ALTER TABLE gtfs_routes       ENABLE ROW LEVEL SECURITY;
ALTER TABLE gtfs_stops        ENABLE ROW LEVEL SECURITY;
ALTER TABLE gtfs_trips        ENABLE ROW LEVEL SECURITY;
ALTER TABLE gtfs_stop_times   ENABLE ROW LEVEL SECURITY;
ALTER TABLE gtfs_frequencies  ENABLE ROW LEVEL SECURITY;
ALTER TABLE gtfs_shapes       ENABLE ROW LEVEL SECURITY;
ALTER TABLE gtfs_calendar     ENABLE ROW LEVEL SECURITY;
ALTER TABLE gtfs_feeds        ENABLE ROW LEVEL SECURITY;
ALTER TABLE communes          ENABLE ROW LEVEL SECURITY;
ALTER TABLE payment_plans     ENABLE ROW LEVEL SECURITY;

CREATE POLICY "read_public_gtfs_agencies"    ON gtfs_agencies    FOR SELECT USING (TRUE);
CREATE POLICY "read_public_gtfs_routes"      ON gtfs_routes      FOR SELECT USING (TRUE);
CREATE POLICY "read_public_gtfs_stops"       ON gtfs_stops       FOR SELECT USING (TRUE);
CREATE POLICY "read_public_gtfs_trips"       ON gtfs_trips       FOR SELECT USING (TRUE);
CREATE POLICY "read_public_gtfs_stop_times"  ON gtfs_stop_times  FOR SELECT USING (TRUE);
CREATE POLICY "read_public_gtfs_frequencies" ON gtfs_frequencies FOR SELECT USING (TRUE);
CREATE POLICY "read_public_gtfs_shapes"      ON gtfs_shapes      FOR SELECT USING (TRUE);
CREATE POLICY "read_public_gtfs_calendar"    ON gtfs_calendar    FOR SELECT USING (TRUE);
CREATE POLICY "read_public_gtfs_feeds"       ON gtfs_feeds       FOR SELECT USING (TRUE);
CREATE POLICY "read_public_communes"         ON communes         FOR SELECT USING (TRUE);
CREATE POLICY "read_public_payment_plans"    ON payment_plans    FOR SELECT USING (TRUE);

-- Tables utilisateur : lecture/écriture uniquement sur soi-même
ALTER TABLE users            ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_identities  ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_quotas      ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_favorites   ENABLE ROW LEVEL SECURITY;
ALTER TABLE searches         ENABLE ROW LEVEL SECURITY;
ALTER TABLE feedback         ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments         ENABLE ROW LEVEL SECURITY;

-- NB : l'auth Supabase (auth.uid()) renverra le user_id UUID seulement pour la PWA.
-- Le bot Telegram appellera ces tables via la SERVICE_ROLE_KEY qui bypass RLS.

CREATE POLICY "self_read_users"           ON users           FOR SELECT USING (auth.uid() = id);
CREATE POLICY "self_update_users"         ON users           FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "self_read_identities"      ON user_identities FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "self_read_quotas"          ON user_quotas     FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "self_crud_favorites"       ON user_favorites  FOR ALL    USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE POLICY "self_read_searches"        ON searches        FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "anon_insert_searches"      ON searches        FOR INSERT WITH CHECK (TRUE);  -- analytics : tout le monde peut logger

CREATE POLICY "self_read_feedback"        ON feedback        FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "anon_insert_feedback"      ON feedback        FOR INSERT WITH CHECK (TRUE);

CREATE POLICY "self_read_payments"        ON payments        FOR SELECT USING (auth.uid() = user_id);

-- ════════════════════════════════════════════════════════════════════════
--  Fin de la migration. Après ingestion du GTFS :
--    REFRESH MATERIALIZED VIEW gtfs_shape_lines;
--    UPDATE gtfs_stops SET commune = detecter_commune(stop_lat, stop_lon);
-- ════════════════════════════════════════════════════════════════════════
