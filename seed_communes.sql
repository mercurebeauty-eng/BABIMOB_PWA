-- ════════════════════════════════════════════════════════════════════════
--  BABIMOB_PWA — Seed des communes du Grand Abidjan
--  Version v1 : bounding boxes approximatifs (suffisants pour le bootstrap).
--  À remplacer ultérieurement par les polygones OSM officiels
--  (relation "admin_level=8" de OSM) pour plus de précision.
-- ════════════════════════════════════════════════════════════════════════

-- Helper : ST_MakeEnvelope(xmin, ymin, xmax, ymax, srid) crée un rectangle
-- (lon_min, lat_min, lon_max, lat_max, 4326) → converti en MultiPolygon geography.

DELETE FROM communes;

INSERT INTO communes (name, geom, centroid) VALUES
  -- 10 communes officielles d'Abidjan
  ('Abobo',
    ST_Multi(ST_MakeEnvelope(-4.05, 5.42, -3.98, 5.48, 4326))::geography,
    ST_SetSRID(ST_MakePoint(-4.015, 5.450), 4326)::geography),

  ('Adjamé',
    ST_Multi(ST_MakeEnvelope(-4.035, 5.358, -4.005, 5.402, 4326))::geography,
    ST_SetSRID(ST_MakePoint(-4.020, 5.380), 4326)::geography),

  ('Attécoubé',
    ST_Multi(ST_MakeEnvelope(-4.070, 5.310, -4.015, 5.360, 4326))::geography,
    ST_SetSRID(ST_MakePoint(-4.040, 5.335), 4326)::geography),

  ('Cocody',
    ST_Multi(ST_MakeEnvelope(-3.995, 5.340, -3.920, 5.420, 4326))::geography,
    ST_SetSRID(ST_MakePoint(-3.960, 5.380), 4326)::geography),

  ('Koumassi',
    ST_Multi(ST_MakeEnvelope(-3.975, 5.275, -3.920, 5.320, 4326))::geography,
    ST_SetSRID(ST_MakePoint(-3.945, 5.300), 4326)::geography),

  ('Marcory',
    ST_Multi(ST_MakeEnvelope(-4.005, 5.275, -3.960, 5.320, 4326))::geography,
    ST_SetSRID(ST_MakePoint(-3.985, 5.295), 4326)::geography),

  ('Plateau',
    ST_Multi(ST_MakeEnvelope(-4.025, 5.320, -3.995, 5.345, 4326))::geography,
    ST_SetSRID(ST_MakePoint(-4.010, 5.330), 4326)::geography),

  ('Port-Bouët',
    ST_Multi(ST_MakeEnvelope(-3.995, 5.220, -3.895, 5.275, 4326))::geography,
    ST_SetSRID(ST_MakePoint(-3.945, 5.250), 4326)::geography),

  ('Treichville',
    ST_Multi(ST_MakeEnvelope(-4.020, 5.275, -3.990, 5.310, 4326))::geography,
    ST_SetSRID(ST_MakePoint(-4.005, 5.290), 4326)::geography),

  ('Yopougon',
    ST_Multi(ST_MakeEnvelope(-4.135, 5.315, -4.050, 5.400, 4326))::geography,
    ST_SetSRID(ST_MakePoint(-4.090, 5.355), 4326)::geography),

  -- 3 communes périphériques du District autonome d'Abidjan
  ('Anyama',
    ST_Multi(ST_MakeEnvelope(-4.075, 5.485, -4.000, 5.555, 4326))::geography,
    ST_SetSRID(ST_MakePoint(-4.040, 5.520), 4326)::geography),

  ('Bingerville',
    ST_Multi(ST_MakeEnvelope(-3.920, 5.335, -3.850, 5.395, 4326))::geography,
    ST_SetSRID(ST_MakePoint(-3.885, 5.365), 4326)::geography),

  ('Songon',
    ST_Multi(ST_MakeEnvelope(-4.205, 5.345, -4.130, 5.450, 4326))::geography,
    ST_SetSRID(ST_MakePoint(-4.170, 5.395), 4326)::geography);

-- Après cet INSERT, on peut affecter la commune à chaque arrêt :
--   UPDATE gtfs_stops SET commune = detecter_commune(stop_lat, stop_lon);
--
-- Vérification rapide :
--   SELECT commune, COUNT(*) FROM gtfs_stops GROUP BY commune ORDER BY 2 DESC;
