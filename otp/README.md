# BABIMOB_PWA — OpenTripPlanner (OTP)

Moteur d'itinéraire multimodal (gbaka + woro-woro + marche) basé sur le GTFS Abidjan et l'OSM Côte d'Ivoire.

## Principe

OTP construit un **graph** à partir de 2 sources :
- `abidjan-gtfs.zip` : les 9 CSV zippés (lignes, arrêts, trajets, fréquences)
- `cote-d-ivoire-latest.osm.pbf` : réseau routier OSM pour la marche d'accès

Une fois le graph construit (fichier `graph.obj`, ~80-150 MB), OTP répond en ~50-200 ms à des requêtes d'itinéraire via une API GraphQL et REST.

## Dimensionnement

| Composant | RAM | Disque | Temps de build |
|---|---|---|---|
| OTP (Abidjan seul) | **~1,5 GB** | ~300 MB | ~3-5 min |
| OTP + région élargie | ~2,5 GB | ~600 MB | ~8 min |

## Prérequis

- **Docker Desktop** installé (Windows) ou Docker + Compose sur Linux/Mac
- **bash** (Git Bash sous Windows, déjà installé avec Git)
- **zip** disponible dans le PATH (Git Bash l'embarque)

## Build local (dev / test)

### 1. Préparer les données d'entrée

```bash
cd BABIMOB_PWA/otp
bash fetch_data.sh
```

Ce script :
- télécharge l'OSM Côte d'Ivoire depuis Geofabrik (~45 MB)
- zippe tes 9 CSV GTFS existants
- copie `build-config.json` et `router-config.json` dans `graphs/abidjan/`

### 2. Lancer OTP

```bash
docker compose up
```

Premier démarrage : OTP construit le graph (3-5 min, ligne `Build completed` dans les logs). Ensuite il sert sur http://localhost:8080.

### 3. Tester

Dans un navigateur : http://localhost:8080 → interface GraphiQL.

**Requête test** (Adjamé → Cocody Riviera 2) :

```graphql
{
  plan(
    from: { lat: 5.380, lon: -4.020 },
    to:   { lat: 5.385, lon: -3.965 },
    date: "2026-04-19",
    time: "08:00:00",
    transportModes: [{ mode: WALK }, { mode: BUS }]
  ) {
    itineraries {
      duration
      walkDistance
      legs {
        mode
        route { shortName longName }
        from { name }
        to   { name }
        startTime
        endTime
      }
    }
  }
}
```

Réponse attendue : 1 à 3 itinéraires avec durée, distance, correspondances.

## Déploiement Railway

### Option A — Railway avec Docker (recommandé)

1. Sur Railway → **New Project** → **Deploy from GitHub repo** → sélectionne `otp/` comme root.
2. **⚠ Mémoire** : Railway's free tier (512 MB) est **insuffisant**. Il te faut le plan **Hobby (5$/mois)** qui permet jusqu'à 8 GB RAM. Dans Settings → Resources → mets **2 GB** min.
3. **Variables** : aucune requise côté OTP.
4. **Build** : Railway détecte le Dockerfile automatiquement.
5. **Premier deploy** : ~8-12 min (téléchargement OTP jar + build du graph).
6. URL publique générée : `https://<ton-service>.up.railway.app`.

**Coût estimé Railway** : ~10-15 $/mois pour OTP en fonctionnement continu (2 GB RAM, trafic modeste).

### Option B — VPS Hetzner (moins cher)

Pour ~5 €/mois (CX22, 4 GB RAM), tu as une machine dédiée. Installation Docker + `docker compose up -d`. Reverse-proxy via Caddy pour HTTPS automatique.

```bash
# Sur le VPS, après installation Docker :
git clone <ton-repo> babimob && cd babimob/otp
bash fetch_data.sh
docker compose up -d
```

Puis un Caddyfile minimal :
```
otp.babimob.ci {
  reverse_proxy localhost:8080
}
```

## Intégration côté bot / PWA

Pour calculer un itinéraire, appelle OTP en GraphQL :

```js
// Helper à ajouter dans le bot (ou la PWA)
async function calculerItineraire(fromLatLon, toLatLon, dateHeure = new Date()) {
  const query = `{
    plan(
      from: { lat: ${fromLatLon.lat}, lon: ${fromLatLon.lon} },
      to:   { lat: ${toLatLon.lat},   lon: ${toLatLon.lon}   },
      date: "${dateHeure.toISOString().slice(0,10)}",
      time: "${dateHeure.toTimeString().slice(0,8)}",
      transportModes: [{ mode: WALK }, { mode: BUS }],
      numItineraries: 3
    ) {
      itineraries {
        duration
        walkDistance
        legs {
          mode
          route { shortName longName }
          from { name } to { name }
          startTime endTime
        }
      }
    }
  }`;

  const resp = await fetch(`${process.env.OTP_BASE_URL}/otp/routers/default/index/graphql`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ query })
  });
  const json = await resp.json();
  return json.data.plan.itineraries;
}
```

## Mise à jour des données

Quand un nouveau GTFS sort (ou que tu corriges des erreurs) :

```bash
# Refaire le zip GTFS, supprimer le graph, redémarrer
rm graphs/abidjan/graph.obj graphs/abidjan/abidjan-gtfs.zip
bash fetch_data.sh
docker compose restart
```

OTP rebuilde le graph au démarrage suivant.

## Dépannage

**`OutOfMemoryError: Java heap space`** → augmente `-Xmx` dans le Dockerfile (passe de 1500m à 2500m).

**`No transit data`** → ton zip GTFS est vide ou corrompu. Vérifie avec `unzip -l abidjan-gtfs.zip`.

**`Build took too long and was aborted`** (Railway) → passe sur VPS. Railway coupe les builds > 10 min.

**OTP répond en >1 s** → vérifie que le graph est bien persisté (`ls -la graphs/abidjan/graph.obj` doit exister). Sinon OTP rebuilde à chaque restart.

## Ressources

- Doc OTP : https://docs.opentripplanner.org/en/latest/
- Playground GraphQL : `/graphiql` sur ton instance
- OSM Geofabrik : https://download.geofabrik.de/africa/cote-d-ivoire.html
