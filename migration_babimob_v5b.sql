-- ════════════════════════════════════════════════════════════════════════
--  BABIMOB_PWA — Migration v5b — Fix user_favorites for PWA auth users
--
--  Problème : user_favorites.user_id avait une FK vers users(id) (bots
--  Telegram). Les utilisateurs PWA (auth.uid()) ne peuvent pas insérer.
--  Solution : supprimer la FK, conserver le RLS (auth.uid() = user_id).
--  Entièrement idempotente.
-- ════════════════════════════════════════════════════════════════════════

-- 1. Supprimer la FK vers users(id) si elle existe
DO $$
DECLARE
  v_conname text;
BEGIN
  SELECT conname INTO v_conname
  FROM pg_constraint
  WHERE conrelid = 'public.user_favorites'::regclass
    AND contype = 'f'
    AND conkey = ARRAY[
      (SELECT attnum FROM pg_attribute
       WHERE attrelid = 'public.user_favorites'::regclass
         AND attname = 'user_id')
    ]::smallint[];

  IF v_conname IS NOT NULL THEN
    EXECUTE format('ALTER TABLE user_favorites DROP CONSTRAINT %I', v_conname);
    RAISE NOTICE 'Dropped FK constraint: %', v_conname;
  ELSE
    RAISE NOTICE 'No FK constraint found on user_favorites.user_id — already clean.';
  END IF;
END;
$$;

-- 2. S'assurer que le RLS est activé et les politiques correctes
ALTER TABLE user_favorites ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "self_crud_favorites" ON user_favorites;
DROP POLICY IF EXISTS "favorites_self_select" ON user_favorites;
DROP POLICY IF EXISTS "favorites_self_insert" ON user_favorites;
DROP POLICY IF EXISTS "favorites_self_update" ON user_favorites;
DROP POLICY IF EXISTS "favorites_self_delete" ON user_favorites;

CREATE POLICY "favorites_self_select" ON user_favorites
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "favorites_self_insert" ON user_favorites
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "favorites_self_delete" ON user_favorites
  FOR DELETE USING (auth.uid() = user_id);

-- ════════════════════════════════════════════════════════════════════════
--  Vérification :
--    SELECT conname FROM pg_constraint
--    WHERE conrelid = 'user_favorites'::regclass AND contype = 'f';
--    -- doit retourner 0 ligne (plus de FK)
-- ════════════════════════════════════════════════════════════════════════
