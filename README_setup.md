# BABIMOB_PWA — Setup du projet Supabase v4

## Contenu du dossier

| Fichier | Rôle |
|---|---|
| `migration_babimob_v4.sql` | Schéma complet : GTFS + communes + users + payments + RLS + RPC |
| `seed_communes.sql` | Bounding boxes des 13 communes du Grand Abidjan (v1 approx.) |
| `import_gtfs.js` | Ingestion des 9 CSV GTFS dans Supabase |
| `.env.example` | Variables d'environnement à copier en `.env` |
| `package.json` | Dépendances Node (supabase-js, papaparse, dotenv) |

## Ordre d'exécution

### 1. Projet Supabase

1. Créer le projet `BABIMOB_PWA` (région recommandée : **eu-west-3 Paris** — latence minimale vers Abidjan).
2. Activer l'extension **PostGIS** : Dashboard → Database → Extensions → activer `postgis`.
3. Récupérer l'URL et la **service_role key** : Settings → API.

### 2. Exécuter la migration

Ouvrir SQL Editor → coller tout `migration_babimob_v4.sql` → Run.

Ce que ça crée :
- 9 tables `gtfs_*` (référentiel GTFS)
- Table `communes` (vide, à peupler)
- 7 tables business (`users`, `user_identities`, `user_quotas`, `user_favorites`, `searches`, `feedback`, `payments`)
- Table `payment_plans` avec 3 plans pré-seedés (500 / 1000 / 2500 FCFA)
- 6 fonctions RPC : `detecter_commune`, `arrets_proches`, `lignes_par_arret`, `lignes_par_commune`, `frequence_ligne_a_heure`, `resolve_or_create_user`, `consommer_requete`, `appliquer_plan_paye`
- Row-Level Security activé sur tout, policies adaptées

### 3. Seeder les communes

SQL Editor → coller `seed_communes.sql` → Run.

13 bounding boxes approximatifs. Suffisants pour démarrer. À remplacer plus tard par les polygones OSM officiels pour plus de précision (script de conversion GeoJSON → WKT à prévoir quand tu voudras affiner).

### 4. Configurer l'environnement Node

```bash
cd "C:\Users\USER\Documents\BABIMOB PROJET\BABIMOB_PWA"
npm install @supabase/supabase-js papaparse dotenv
```

Créer un fichier `.env` :

```
SUPABASE_URL=https://xxxxxxxxxxxx.supabase.co
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOi...
GTFS_DIR=C:\Users\USER\Documents\BABIMOB\abidjan_paratransit_gtfs_20230726
```

⚠️ **Ne jamais committer `.env`** — la service_role_key bypasse le RLS, c'est un pouvoir root sur ta base.

### 5. Lancer l'ingestion GTFS

```bash
node import_gtfs.js
```

Durée attendue : **~3 à 5 minutes** (le gros morceau = shapes.txt, 74k lignes).

Sortie attendue :
```
🏢 agency.txt       ✓ 22 agences (3 doublons ignorés)
📅 calendar.txt     ✓ 1 ligne
🚌 routes.txt       ✓ 490 lignes
📍 stops.txt        ✓ 4834 arrêts
🎫 trips.txt        ✓ 980 trajets
⏱️  stop_times.txt  ✓ 15683 entrées
🔁 frequencies.txt  ✓ 1076 fréquences
🗺️  shapes.txt      ✓ 74504 points
✅ Import terminé en 223.4s
```

### 6. Post-import — rafraîchir la vue matérialisée et détecter les communes

Si le script n'a pas pu les lancer (pas de RPC `exec_sql` par défaut), exécute ça dans SQL Editor :

```sql
REFRESH MATERIALIZED VIEW gtfs_shape_lines;
UPDATE gtfs_stops SET commune = detecter_commune(stop_lat, stop_lon);

-- Vérification
SELECT commune, COUNT(*) FROM gtfs_stops GROUP BY commune ORDER BY 2 DESC;
```

Tu devrais voir une distribution cohérente : Yopougon et Abobo en tête, Plateau plus bas.

## Tests de bout en bout

Une fois tout peuplé, ces requêtes doivent renvoyer des résultats cohérents :

```sql
-- 1) Arrêts à 500m de la Riviera 2 (lat=5.385, lon=-3.965)
SELECT * FROM arrets_proches(5.385, -3.965, 500);

-- 2) Lignes passant par un arrêt donné
SELECT * FROM lignes_par_arret('node/10218963489');

-- 3) Lignes desservant Cocody
SELECT * FROM lignes_par_commune('Cocody');

-- 4) Fréquence d'une ligne à 8h du matin
SELECT * FROM frequence_ligne_a_heure('10179006', '08:00:00');

-- 5) Créer un user Telegram (dry-run)
SELECT resolve_or_create_user('telegram', '123456789', '{"username":"test"}'::jsonb);
```

## Intégration CinetPay

La structure `payments` est prête. Flux prévu :

1. **Côté bot/PWA** : user choisit un plan → on crée une ligne `payments` (status=`pending`) + on appelle l'API CinetPay `/v2/payment` → on récupère `payment_url`.
2. **Redirect utilisateur** vers `payment_url` (hébergée par CinetPay).
3. **Webhook** CinetPay POST sur `notify_url` → on vérifie la signature → on met à jour `payments.status=success`, on stocke le `raw_webhook` → on appelle `appliquer_plan_paye(user_id, plan_key)` → le quota / premium est créé.

La fonction `appliquer_plan_paye` est déjà en place. Il restera à écrire le handler webhook côté serveur (prochain livrable quand tu voudras).

## Ce qu'il restera à faire (phase suivante)

- [ ] Hébergement OpenTripPlanner (Java, ~1-2 Go RAM) pour les itinéraires multimodaux
- [ ] Handler webhook CinetPay (Node/Express)
- [ ] Adaptation du bot v3.10 → parler à la nouvelle base via `resolve_or_create_user`
- [ ] PWA initiale (Next.js + Leaflet/MapLibre)
- [ ] Remplacement des bounding boxes communes par les polygones OSM officiels

## Dépannage

**`permission denied for schema public`** → tu utilises la mauvaise clé. Vérifie que c'est la `service_role_key`, pas `anon`.

**`extension "postgis" does not exist`** → active PostGIS dans Database → Extensions avant la migration.

**Script d'import lent** : normal pour shapes.txt. Si tu veux accélérer, monte `BATCH` de 500 à 1000 dans `import_gtfs.js` (au-delà, Supabase rate-limit).

**Import à recommencer depuis zéro** :
```sql
-- ⚠️ destructif, à utiliser uniquement en dev
TRUNCATE gtfs_shapes, gtfs_stop_times, gtfs_frequencies, gtfs_trips,
         gtfs_routes, gtfs_stops, gtfs_calendar, gtfs_agencies, gtfs_feeds CASCADE;
```
