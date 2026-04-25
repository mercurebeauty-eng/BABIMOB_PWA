-- ════════════════════════════════════════════════════════════════════════
--  BABIMOB_PWA — Migration v5b — user_favorites pour les utilisateurs PWA
--
--  Crée la table si elle n'existe pas (avec auth.users, pas l'ancienne
--  table users des bots Telegram). Si elle existe déjà avec une FK cassée,
--  supprime la contrainte. Entièrement idempotente.
-- ════════════════════════════════════════════════════════════════════════

-- 1. Créer la table si elle n'existe pas encore
CREATE TABLE IF NOT EXISTS user_favorites (
  id         UUID        PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id    UUID        NOT NULL,   -- pas de FK → géré par RLS (auth.uid())
  kind       TEXT        NOT NULL CHECK (kind IN ('place','stop','route')),
  label      TEXT        NOT NULL,
  stop_id    TEXT,
  route_id   TEXT,
  lat        DOUBLE PRECISION,
  lon        DOUBLE PRECISION,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_favs_user ON user_favorites (user_id);

-- 2. Si la table existait déjà avec l'ancienne FK vers users(id), la supprimer
DO $$
DECLARE
  v_conname text;
BEGIN
  SELECT conname INTO v_conname
  FROM pg_constraint
  WHERE conrelid = 'public.user_favorites'::regclass
    AND contype = 'f';

  IF v_conname IS NOT NULL THEN
    EXECUTE format('ALTER TABLE user_favorites DROP CONSTRAINT %I', v_conname);
    RAISE NOTICE 'Dropped FK constraint: %', v_conname;
  END IF;
END;
$$;

-- 3. RLS — chaque utilisateur accède uniquement à ses propres favoris
ALTER TABLE user_favorites ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "self_crud_favorites"    ON user_favorites;
DROP POLICY IF EXISTS "favorites_self_select"  ON user_favorites;
DROP POLICY IF EXISTS "favorites_self_insert"  ON user_favorites;
DROP POLICY IF EXISTS "favorites_self_delete"  ON user_favorites;

CREATE POLICY "favorites_self_select" ON user_favorites
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "favorites_self_insert" ON user_favorites
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "favorites_self_delete" ON user_favorites
  FOR DELETE USING (auth.uid() = user_id);

-- ════════════════════════════════════════════════════════════════════════
--  Vérification après exécution :
--    SELECT table_name FROM information_schema.tables
--    WHERE table_schema = 'public' AND table_name = 'user_favorites';
-- ════════════════════════════════════════════════════════════════════════
