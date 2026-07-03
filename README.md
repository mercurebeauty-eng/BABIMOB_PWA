# BABIMOB — Mobilité intelligente pour Abidjan

<div align="center">

![Status](https://img.shields.io/badge/Status-Production%20Ready-brightgreen?style=flat-square)
![License](https://img.shields.io/badge/License-Proprietary-red?style=flat-square)
![Node](https://img.shields.io/badge/Node-18%2B-009900?style=flat-square)
![TypeScript](https://img.shields.io/badge/TypeScript-5.0%2B-3178c6?style=flat-square)

**Plateforme de mobilité urbaine pour la Côte d'Ivoire** — Recherche d'arrêts, consultation des horaires, cartes interactives, et calcul d'itinéraire multimodal en temps réel.

[🌐 Site web](#) · [📖 Documentation](#) · [🐛 Issues](#) · [📧 Contact](#contact)

</div>

---

## 🎯 À propos

BABIMOB simplifie les trajets quotidiens à Abidjan en fournissant :

- 🚌 **Recherche rapide** d'arrêts gbaka, woro-woro, SOTRA
- 🗺️ **Carte interactive** avec localisation en temps réel
- ⏱️ **Horaires et fréquences** des lignes de transport
- 🛣️ **Itinéraires multimodaux** (marche + transport public)
- 💰 **Système de micropaiement** (mobile money)
- 🎮 **Gamification** (explorer, gagner des points, badges)

**Cible** : 5M+ d'habitants · Couverture : Grand Abidjan (13 communes)

---

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                   BABIMOB — Composants                      │
├─────────────────────────────────────────────────────────────┤
│                                                               │
│  ┌──────────────────┐    ┌──────────────────────────────┐   │
│  │   PWA (Next.js)  │    │  Backend (Node.js/Express)   │   │
│  │  - UI responsive │───→│  - API Auth                  │   │
│  │  - Offline mode  │    │  - Webhooks CinetPay         │   │
│  │  - Maps (Leaflet)│    │  - Quotas, Paiements         │   │
│  └──────────────────┘    └──────────────────────────────┘   │
│           ↓                            ↓                      │
│  ┌─────────────────────────────────────────────────────┐    │
│  │        Supabase (Postgres + PostGIS)                │    │
│  │  - Référentiel GTFS (arrêts, lignes, horaires)     │    │
│  │  - Profils utilisateurs & quotas                   │    │
│  │  - Paiements & historique                          │    │
│  │  - Row-Level Security (RLS)                        │    │
│  └─────────────────────────────────────────────────────┘    │
│           ↓                                                    │
│  ┌──────────────────────────────────────────────────────┐   │
│  │   OpenTripPlanner (Moteur d'itinéraire)             │   │
│  │   - Calculs multimodaux (GTFS + OSM)                │   │
│  │   - Réponses en ~50-200ms                           │   │
│  │   - GraphQL API                                     │   │
│  └──────────────────────────────────────────────────────┘   │
│                                                               │
└─────────────────────────────────────────────────────────────┘
```

### Stack technique

| Couche | Technologie |
|--------|-------------|
| **Frontend** | Next.js 14, TypeScript, Tailwind CSS, Leaflet |
| **Backend** | Node.js, Express, Supabase SDK |
| **Base de données** | PostgreSQL + PostGIS (Supabase) |
| **Auth** | Magic link (email) — Supabase |
| **Paiements** | CinetPay (mobile money) |
| **Itinéraires** | OpenTripPlanner 2 (Docker) |
| **Déploiement** | Vercel (PWA), Railway/Hetzner (backends) |

---

## 🚀 Démarrage rapide

### Prérequis

- **Node.js** ≥ 18.17 ([installer](https://nodejs.org))
- **Un projet Supabase** avec PostGIS activé ([créer](https://supabase.com))
- **Docker Desktop** (optionnel, pour OTP en local)
- **Git**

### Installation locale

```bash
# 1. Cloner le dépôt
git clone https://github.com/mercurebeauty-eng/BABIMOB_PWA.git
cd BABIMOB_PWA

# 2. Installer les dépendances PWA
cd pwa
npm install

# 3. Configurer les variables d'environnement
cp .env.example .env.local
# Remplir .env.local avec vos identifiants Supabase
# NEXT_PUBLIC_SUPABASE_URL=https://xxxxxxxxxxxx.supabase.co
# NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGc...

# 4. Lancer le serveur dev
npm run dev
```

L'application est maintenant disponible sur **[http://localhost:3000](http://localhost:3000)**.

### Configuration Supabase (premier setup)

1. Créer un projet Supabase (région recommandée : **eu-west-3 Paris**)
2. Activer l'extension **PostGIS** (Database → Extensions)
3. Récupérer l'URL et les clés (Settings → API)
4. Importer les données GTFS (voir [`pwa/README.md`](pwa/README.md))

---

## 📁 Structure du dépôt

```
BABIMOB_PWA/
├── pwa/                    # Progressive Web App (Next.js 14)
│   ├── src/app/           # Routes et pages
│   ├── src/components/    # Composants réutilisables
│   ├── src/lib/           # Utilitaires (Supabase, types, etc.)
│   ├── public/            # Assets statiques & PWA manifest
│   └── package.json
│
├── otp/                    # Moteur d'itinéraire (OpenTripPlanner)
│   ├── Dockerfile         # Image OTP v2.6.0
│   ├── docker-compose.yml # Orchestration locale
│   ├── fetch_data.sh      # Préparation des données GTFS
│   └── README.md          # Guide complet
│
├── webhook/               # Service de paiement (Express)
│   ├── server.js         # API HTTP
│   ├── cinetpay-handler.js  # Logique paiement
│   ├── package.json
│   └── README.md         # Documentation
│
├── import_gtfs.js         # Script d'ingestion GTFS vers Supabase
├── package.json           # Dépendances root (utilitaires)
└── README.md              # Ce fichier
```

**Chaque sous-dossier contient son propre `README.md` avec les instructions spécifiques de setup et de déploiement.**

---

## ⚙️ Configuration avancée

### Variables d'environnement

#### PWA (`pwa/.env.local`)

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://xxxxxxxxxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGc...

# URLs des backends
NEXT_PUBLIC_OTP_URL=https://babimob-otp.up.railway.app
NEXT_PUBLIC_WEBHOOK_URL=https://babimob-webhook.up.railway.app

# Site URL (pour Auth magic link)
NEXT_PUBLIC_SITE_URL=http://localhost:3000
```

#### Webhook (`webhook/.env`)

```env
SUPABASE_URL=https://xxxxxxxxxxxx.supabase.co
SUPABASE_SERVICE_ROLE_KEY=eyJhbGc...

CINETPAY_API_KEY=votre_clé_api
CINETPAY_SITE_ID=12345678
CINETPAY_NOTIFY_URL=https://babimob-webhook.up.railway.app/cinetpay/notify
CINETPAY_RETURN_URL=https://babimob-webhook.up.railway.app/cinetpay/return
```

### Déploiement en production

- **PWA** : [Vercel](https://vercel.com) (gratuit pour open source)
- **Webhook** : [Railway](https://railway.app) (~5-10$/mois)
- **OTP** : [Hetzner](https://hetzner.cloud) (~5$/mois) ou Railway
- **Base de données** : Supabase (plan Pro pour production, ~25$/mois)

Voir les READMEs spécifiques pour les déploiements détaillés.

---

## 🔒 Sécurité

### Secrets & Clés d'API

- ❌ **Ne jamais** committer `.env`, `.env.local`, ou des clés d'API
- ✅ Utilisez les fichiers `.env.example` fournis comme modèles
- ✅ Les variables d'environnement sont automatiquement ignorées (`.gitignore`)
- ✅ Utilisez `NEXT_PUBLIC_*` **uniquement** pour les valeurs côté navigateur (pas de secrets)

### Signaler une vulnérabilité

Si vous découvrez une faille de sécurité, **ne pas** ouvrir d'issue publique. Contactez directement :

📧 **[mercurebeauty@gmail.com](mailto:mercurebeauty@gmail.com)**

Merci pour votre responsabilité ! 🙏

---

## 📊 Données GTFS

Les données GTFS (arrêts, lignes, horaires, shapes) ne sont **pas** versionnées dans ce dépôt pour deux raisons :

1. **Taille** : ~50-100 MB de données brutes
2. **Mise à jour fréquente** : sources externes (data-transport.org)

Le schéma de base de données et la logique métier (RLS, tarification, quotas) sont gérés **en dehors du dépôt public** pour des raisons de confidentialité commerciale.

**Pour contribuer sur les données** : contactez l'équipe du projet.

---

## 🛠️ Développement local

### Commandes utiles

```bash
# PWA
cd pwa
npm run dev       # Serveur dev sur :3000
npm run build     # Build de production
npm run lint      # Vérifier le code (ESLint)

# OTP (en Docker)
cd otp
docker compose up              # Démarrer OTP sur :8080
docker compose down            # Arrêter

# Webhook
cd webhook
npm install
npm start         # Serveur sur :3000
```

### Déboguer

**Magic link ne fonctionne pas** → Vérifier que l'URL de callback est dans Supabase Auth → URL Configuration → Redirect URLs.

**Carte grise/vide** → Vérifier que `leaflet/dist/leaflet.css` est importé dans `globals.css`.

**OTP timeout** → Augmenter la RAM allouée au conteneur Docker (min. 1.5 GB).

Voir chaque README sous-dossier pour plus de détails.

---

## 🤝 Contribution

Ce projet est propriétaire et ne relève pas de l'open source. **Les contributions externes ne sont pas acceptées.**

Si vous avez des suggestions ou des rapports de bugs, veuillez contacter l'équipe directement.

---

## 📄 Licence

**Tous droits réservés.** Usage et redistribution non autorisés sans accord préalable écrit de Mercure Beauty Engineering.

```
© 2026 Mercure Beauty Engineering. All rights reserved.
```

---

## 📞 Contact & Support

| Domaine | Contact |
|---------|---------|
| **Questions techniques** | 📧 [mercurebeauty@gmail.com](mailto:mercurebeauty@gmail.com) |
| **Issues de sécurité** | 🔒 [mercurebeauty@gmail.com](mailto:mercurebeauty@gmail.com) |
| **Autres requêtes** | 🌐 [babimob.ci](https://babimob.ci) |

---

<div align="center">

**Construit avec ❤️ pour la mobilité urbaine en Afrique de l'Ouest**

![TypeScript](https://img.shields.io/badge/-TypeScript-3178c6?style=flat&logo=typescript&logoColor=white)
![Next.js](https://img.shields.io/badge/-Next.js-000000?style=flat&logo=next.js&logoColor=white)
![Supabase](https://img.shields.io/badge/-Supabase-3ECF8E?style=flat&logo=supabase&logoColor=white)
![Docker](https://img.shields.io/badge/-Docker-2496ED?style=flat&logo=docker&logoColor=white)

</div>
