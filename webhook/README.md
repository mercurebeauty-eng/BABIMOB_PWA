# BABIMOB_PWA — Webhook CinetPay

Service Express minimal qui gère les paiements mobile money via CinetPay et crédite automatiquement le quota de l'utilisateur en base Supabase.

## Architecture

```
    [Bot Telegram / PWA]
           │
           │ POST /cinetpay/init
           ▼
    ┌──────────────────┐
    │  webhook service │ ────── POST /v2/payment ─────▶ CinetPay
    │  (Railway)       │ ◀──── payment_url ─────────── CinetPay
    └──────────────────┘
           │
           │ (affiche payment_url au user, qui paie)
           ▼
    [User redirigé sur CinetPay → paie → redirigé sur /cinetpay/return]
           │
    CinetPay ──── POST /cinetpay/notify ────▶ webhook service
                                               │
                                               ▼
                                       appliquer_plan_paye(user_id, plan_key)
                                               │
                                               ▼
                                    user_quotas crédité automatiquement
```

## Routes exposées

| Méthode | Route | Rôle | Appelant |
|---|---|---|---|
| GET  | `/`                        | Health check | — |
| POST | `/cinetpay/init`           | Initier un paiement       | Bot / PWA |
| POST | `/cinetpay/notify`         | Notification de CinetPay  | CinetPay |
| GET  | `/cinetpay/return`         | Page affichée après paiement | User |
| GET  | `/cinetpay/check/:txnId`   | Vérifier manuellement (debug) | Admin |

## Installation locale (pour tester)

```bash
cd "C:\Users\USER\Documents\BABIMOB PROJET\BABIMOB_PWA\webhook"
npm install
cp .env.example .env
# Remplis le .env (voir section suivante)
npm start
```

## Variables d'environnement

### Côté Supabase
- `SUPABASE_URL` + `SUPABASE_SERVICE_ROLE_KEY` → mêmes que pour le script d'ingestion.

### Côté CinetPay
1. Crée un compte marchand sur https://cinetpay.com → mode **Test** (sandbox) d'abord.
2. Dashboard → **Intégrations** → **Paramètres du marchand** :
   - `CINETPAY_API_KEY` = clé API
   - `CINETPAY_SITE_ID` = ID du site (ex : 5878243)
3. Dans les mêmes réglages, **déclare les URLs** :
   - `CINETPAY_NOTIFY_URL` = `https://<ton-service>.up.railway.app/cinetpay/notify`
   - `CINETPAY_RETURN_URL` = `https://<ton-service>.up.railway.app/cinetpay/return`

⚠️ Tant que ces URLs ne sont pas déclarées dans le dashboard CinetPay, aucun webhook ne sera envoyé.

## Déploiement Railway

1. Sur https://railway.app → **New Project** → **Empty Project**.
2. **Add Service** → **GitHub Repo** (connecte ton repo `babimob`) OU **Empty Service** et tu pusheras après.
3. Dans **Settings** :
   - Root Directory : `webhook`
   - Start Command : (auto-détecté : `npm start`)
4. Dans **Variables** : colle les 6 variables du `.env`.
5. **Deploy** → Railway génère une URL publique (ex : `babimob-webhook-production.up.railway.app`).
6. Retourne sur CinetPay dashboard, mets cette URL dans `CINETPAY_NOTIFY_URL` / `CINETPAY_RETURN_URL` ET sur Railway aussi.

## Tester le flux en sandbox CinetPay

```bash
# 1) Récupère un user_id UUID existant (ou crée-en un via resolve_or_create_user)
# 2) Appelle /cinetpay/init
curl -X POST https://<ton-webhook>.up.railway.app/cinetpay/init \
  -H "Content-Type: application/json" \
  -d '{
    "user_id": "00000000-0000-0000-0000-000000000000",
    "plan_key": "pack_30",
    "phone": "0701020304"
  }'
```

Réponse attendue :
```json
{
  "transaction_id": "BBMB_1713...",
  "payment_url": "https://checkout.cinetpay.com/payment/...",
  "amount": 500,
  "label": "Pack 30 requêtes"
}
```

Ouvre `payment_url` dans un navigateur → simule un paiement en sandbox → après quelques secondes, regarde ta table `payments` Supabase : le `status` doit passer à `success` et le quota du user doit être crédité.

## Intégration côté bot v3.10

Dans ton `bot3.10.js`, remplace la logique `/payer` actuelle par un appel HTTP à ce service. Exemple minimal :

```js
// À placer dans bot3.10.js, à côté des autres handlers
async function initierPaiementBot(userId, planKey, phone) {
  const resp = await fetch(`${process.env.WEBHOOK_BASE_URL}/cinetpay/init`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ user_id: userId, plan_key: planKey, phone })
  });
  return resp.json();
}

// Dans le handler /payer :
const { payment_url, amount, label } = await initierPaiementBot(userUuid, 'premium_500', phoneUser);
await sendTelegram(chatId, `💳 *${label}* — *${amount} FCFA*\n\n👉 [Payer maintenant](${payment_url})`);
```

`userUuid` = résultat de `resolve_or_create_user('telegram', telegramUserId)` (RPC déjà en place).

## Sécurité

- Le webhook CinetPay ne fait pas confiance aveuglément au `body` reçu : il **re-vérifie** le statut via `/v2/payment/check` (source de vérité).
- `appliquer_plan_paye` est **idempotent** : si un même webhook arrive deux fois, le quota n'est crédité qu'une seule fois (détection via `payment.status === 'success'`).
- La `SUPABASE_SERVICE_ROLE_KEY` bypasse le RLS → ne jamais l'exposer côté navigateur.

## Observabilité

Logs utiles dans Railway :
- `[webhook] <txn_id> → { ok: true, status: 'success', applied: true }` = paiement encaissé, quota crédité.
- `[webhook] <txn_id> → { ok: false, reason: 'unknown transaction' }` = notification pour un txn_id qui n'existe pas chez nous (suspect ou test).

Requête SQL utile pour monitorer :
```sql
SELECT status, COUNT(*), SUM(amount) FROM payments
WHERE created_at > NOW() - INTERVAL '7 days'
GROUP BY status;
```
