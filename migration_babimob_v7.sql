-- ════════════════════════════════════════════════════════════════════════
--  BABIMOB_PWA — Migration v7 — Reach tracking réel
--
--  Idempotente : peut être relancée sans erreur.
--  À exécuter dans l'éditeur SQL Supabase APRÈS v6.
-- ════════════════════════════════════════════════════════════════════════

-- ────────────────────────────────────────────────────────────────────────
-- 1. TABLE reach_events
--    Une ligne par (user_cible, source, jour) — incrémentée à chaque vue.
--    Stockage compact : pas de ligne par viewer, juste un compteur daily.
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
CREATE POLICY "reach_self_select" ON reach_events
  FOR SELECT USING (auth.uid() = target_user_id);

-- ────────────────────────────────────────────────────────────────────────
-- 2. FONCTION record_reach(user_id, source)
--    Appelée depuis le client (fire-and-forget).
--    SECURITY DEFINER → bypass RLS pour l'insert/update.
-- ────────────────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION record_reach(p_user_id UUID, p_source TEXT)
RETURNS void LANGUAGE sql SECURITY DEFINER AS $$
  INSERT INTO reach_events (target_user_id, source, day, count)
  VALUES (p_user_id, p_source, CURRENT_DATE, 1)
  ON CONFLICT (target_user_id, source, day)
  DO UPDATE SET count = reach_events.count + 1;
$$;

-- ────────────────────────────────────────────────────────────────────────
-- 3. FONCTION get_reach(user_id, jours)
--    Retourne le total des impressions sur la période demandée (défaut 30j).
-- ────────────────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION get_reach(p_user_id UUID, p_days INTEGER DEFAULT 30)
RETURNS INTEGER LANGUAGE sql SECURITY DEFINER AS $$
  SELECT COALESCE(SUM(count), 0)::INTEGER
  FROM reach_events
  WHERE target_user_id = p_user_id
    AND day >= CURRENT_DATE - p_days;
$$;

-- ════════════════════════════════════════════════════════════════════════
--  Vérification :
--    SELECT * FROM reach_events WHERE target_user_id = '<uuid>';
--    SELECT get_reach('<uuid>', 30);
-- ════════════════════════════════════════════════════════════════════════
