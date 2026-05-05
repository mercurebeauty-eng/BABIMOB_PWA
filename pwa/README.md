# BABIMOB — PWA (Babimob l'application)

Progressive Web App pour la mobilité à Abidjan : recherche d'arrêts gbaka / woro-woro, consultation des lignes, carte interactive, et (bientôt) calculateur d'itinéraire multimodal.

> Stack : **Next.js 14 (App Router)** · **TypeScript** · **Tailwind CSS** · **Supabase** (Postgres + PostGIS + Auth magic link) · **Leaflet** · **Vercel**

---

## 1. Prérequis

- **Node.js ≥ 18.17** → [nodejs.org](https://nodejs.org)
- Un projet **Supabase** déjà configuré (`BABIMOB_PWA`) avec les migrations v4 appliquées et le GTFS importé
- Un compte **Vercel** (gratuit) pour le déploiement
- Un compte **GitHub** (déjà fait ✅)

---

## 2. Installation locale

```bash
cd pwa
npm install
```

### Variables d'environnement

Copie `.env.example` vers `.env.local` :

```bash
cp .env.example .env.local
```

Puis remplis :

```env
NEXT_PUBLIC_SUPABASE_URL=https://xxxxxxxxxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGc...
NEXT_PUBLIC_SITE_URL=http://localhost:3000
```

> Tu trouves l'URL et l'anon key dans **Supabase → Settings → API**.
> Pour la prod, `NEXT_PUBLIC_SITE_URL` devient `https://babimob.app` (ou ton domaine).

### Lancement en dev

```bash
npm run dev
```

Ouvre [http://localhost:3000](http://localhost:3000).

---

## 3. Configuration Supabase Auth (magic link)

Dans **Supabase → Authentication → URL Configuration** :

1. **Site URL** : `http://localhost:3000` (dev) puis `https://babimob.app` (prod)
2. **Redirect URLs** (allowlist) — ajoute les deux :
   - `http://localhost:3000/app/auth/callback`
   - `https://babimob.app/app/auth/callback`

Dans **Authentication → Providers → Email** :
- Active "Enable Email provider"
- Active "Confirm email" → **OFF** (magic link n'en a pas besoin)
- Active "Enable Magic Link" → **ON**

> Par défaut Supabase envoie les mails via leur SMTP partagé (3 mails/heure max).
> Pour la prod, configure un SMTP custom (Resend, Sendgrid, Brevo) dans **Authentication → Email Templates → SMTP Settings**.

---

## 4. Icônes PWA

Tu dois générer deux icônes depuis le logo bleu/orange :

- `public/icon-192.png` (192×192)
- `public/icon-512.png` (512×512)

Option simple : [realfavicongenerator.net](https://realfavicongenerator.net) → upload ton logo → télécharge le pack → garde juste les deux PNG ci-dessus.

Option CLI (si tu as ImageMagick) :

```bash
magick logo.png -resize 192x192 public/icon-192.png
magick logo.png -resize 512x512 public/icon-512.png
```

---

## 5. Déploiement Vercel

1. Va sur [vercel.com/new](https://vercel.com/new)
2. **Import** ton repo GitHub `BABIMOB_PWA`
3. **Root Directory** → sélectionne `pwa/`
4. **Framework Preset** : Next.js (auto-détecté)
5. **Environment Variables** : recopie `.env.local` (sans `NEXT_PUBLIC_SITE_URL` local)
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `NEXT_PUBLIC_SITE_URL=https://<ton-projet>.vercel.app`
6. **Deploy**

Après le premier déploiement, retourne dans Supabase → Auth → Redirect URLs et ajoute l'URL Vercel + le domaine custom si tu en branches un.

---

## 6. Structure du projet

```
pwa/
├── public/
│   ├── manifest.json          # PWA manifest
│   ├── icon-192.png           # à générer
│   └── icon-512.png           # à générer
├── src/
│   ├── app/
│   │   ├── layout.tsx         # Root layout + Header
│   │   ├── page.tsx           # Accueil (carte + recherche)
│   │   ├── globals.css        # Tailwind + Leaflet CSS
│   │   ├── arret/[stop_id]/   # Page détail d'un arrêt
│   │   ├── auth/
│   │   │   ├── signin/        # Form magic link
│   │   │   └── callback/      # Route exchange code → session
│   │   ├── compte/            # Dashboard user (quota, statut)
│   │   └── itineraire/        # Placeholder OTP
│   ├── components/
│   │   ├── Header.tsx
│   │   ├── Map.tsx            # Leaflet (client only)
│   │   └── StopSearch.tsx     # Autocomplete arrêts
│   └── lib/
│       ├── supabase/
│       │   ├── client.ts      # Browser client
│       │   ├── server.ts      # Server client (cookies)
│       │   └── middleware.ts  # Refresh session
│       └── types.ts
├── middleware.ts              # Racine, refresh auth cookies
├── next.config.js
├── tailwind.config.ts         # Palette babimob-blue / orange
├── tsconfig.json
└── package.json
```

---

## 7. Routes disponibles

| Route | Description |
|---|---|
| `/` | Landing marketing (dark) — choix Telegram vs web app |
| `/app` | Accueil carte : recherche d'arrêt + carte Leaflet |
| `/app/arret/[stop_id]` | Détail d'un arrêt + lignes qui le desservent |
| `/app/auth/signin` | Formulaire magic link |
| `/app/auth/callback` | Callback Supabase (ne pas visiter directement) |
| `/app/compte` | Dashboard : quota, statut premium/essai, déconnexion |
| `/app/itineraire` | Placeholder → futur calculateur OTP |

---

## 8. Roadmap PWA

### Phase 1 — MVP (cette livraison) ✅
- [x] Scaffolding Next.js + Tailwind + Supabase SSR
- [x] Auth magic link (email)
- [x] Carte Leaflet + recherche d'arrêts
- [x] Page détail arrêt avec lignes
- [x] Dashboard compte (quota)
- [x] Manifest PWA

### Phase 2 — Enrichissement
- [ ] Page `/ligne/[route_id]` avec tracé du shape sur la carte
- [ ] Géolocalisation "arrêts proches de moi" (RPC `arrets_proches`)
- [ ] Favoris (RPC + table `user_favorites`)
- [ ] Service worker (offline caching des tuiles carte + dernières recherches)
- [ ] Icons PWA + screenshots installable

### Phase 3 — Paiement
- [ ] Bouton "Recharger" dans `/compte` → appelle le webhook CinetPay (déjà scaffolé dans `/webhook`)
- [ ] Déploiement du webhook sur Railway
- [ ] Plans payment_plans avec tarifs réels

### Phase 4 — Itinéraire
- [ ] Hébergement OTP (déjà scaffolé dans `/otp`) sur Hetzner ou Railway
- [ ] Page `/itineraire` branchée sur l'API GraphQL d'OTP
- [ ] Tracé du trajet sur la carte + étapes

---

## 9. Commandes utiles

```bash
npm run dev       # dev server sur :3000
npm run build     # build de prod
npm run start     # run la prod buildée
npm run lint      # ESLint
```

---

## 10. Debug courant

**"Failed to fetch"** sur Supabase → vérifie `NEXT_PUBLIC_SUPABASE_URL` et `ANON_KEY` dans `.env.local`.

**Magic link ne redirige pas** → vérifie que l'URL de callback est bien dans **Redirect URLs** de Supabase.

**Carte grise / tuiles cassées** → vérifie que `leaflet/dist/leaflet.css` est bien importé dans `globals.css`.

**`Module not found: leaflet`** en SSR → confirme que `Map.tsx` est importé via `dynamic(() => import('...'), { ssr: false })`.

---

Made with 💙🧡 for Abidjan.
