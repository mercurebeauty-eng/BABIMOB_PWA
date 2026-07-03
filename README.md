# BABIMOB

BABIMOB est une plateforme de mobilité pour Abidjan : recherche d'arrêts (gbaka, woro-woro, SOTRA), consultation des lignes, carte interactive, et calcul d'itinéraire multimodal.

> **Stack** : Next.js 14 (App Router) · TypeScript · Tailwind CSS · Supabase (Postgres + PostGIS + Auth) · Leaflet · OpenTripPlanner · Express

## Structure du dépôt

```
.
├── pwa/       Progressive Web App (Next.js) — interface principale
├── otp/       Moteur d'itinéraire multimodal (OpenTripPlanner, Dockerisé)
├── webhook/   Service de paiement mobile money (CinetPay)
└── import_gtfs.js   Script d'ingestion des données GTFS vers Supabase
```

Chaque sous-dossier a son propre `README.md` avec les instructions de setup et de déploiement spécifiques.

## Prérequis

- Node.js ≥ 18.17
- Un projet [Supabase](https://supabase.com) (Postgres + PostGIS)
- Docker (pour OTP en local)

## Démarrage rapide

```bash
git clone <ce-dépôt>
cd BABIMOB_PWA/pwa
npm install
cp .env.example .env.local   # renseigner vos propres identifiants Supabase
npm run dev
```

L'application est ensuite disponible sur [http://localhost:3000](http://localhost:3000).

Voir [`pwa/README.md`](pwa/README.md) pour la configuration complète (auth, déploiement Vercel, structure du projet).

## Données GTFS

Les données GTFS (arrêts, lignes, horaires) ne sont pas versionnées dans ce dépôt — elles sont volumineuses et régulièrement mises à jour. Le schéma de base de données et la logique métier (RLS, fonctions RPC, tarification) sont gérés en dehors du dépôt public.

Pour contribuer sur la partie données, contactez l'équipe du projet.

## Sécurité

Si vous découvrez une faille de sécurité, merci de ne **pas** ouvrir d'issue publique. Contactez directement les mainteneurs.

Aucun secret, clé d'API ou identifiant ne doit jamais être committé — utilisez les fichiers `.env.example` fournis comme modèles et gardez vos `.env`/`.env.local` locaux (déjà exclus via `.gitignore`).

## Licence

Tous droits réservés — usage et redistribution non autorisés sans accord préalable.
