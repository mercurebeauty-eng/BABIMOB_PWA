// ════════════════════════════════════════════════════════════════════════
//  BABIMOB_PWA — Serveur Webhook CinetPay (Express)
//  À déployer sur Railway. URL publique → CINETPAY_NOTIFY_URL.
// ════════════════════════════════════════════════════════════════════════

const express = require('express');
const { initierPaiement, gererWebhook, checkStatus } = require('./cinetpay-handler');
require('dotenv').config();

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Log léger des requêtes
app.use((req, _res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.path}`);
  next();
});

// ─── Health check ───────────────────────────────────────────────────────
app.get('/', (_req, res) =>
  res.json({ service: 'babimob-webhook', version: '1.0.0', status: 'ok' })
);

// ─── Initier un paiement ────────────────────────────────────────────────
//  Appelé par le bot Telegram ou la PWA.
//  Body : { user_id, plan_key, phone?, customer_name?, customer_email? }
//  Réponse : { transaction_id, payment_url, amount, label }
app.post('/cinetpay/init', async (req, res) => {
  try {
    const { user_id, plan_key, phone, customer_name, customer_email, channels } = req.body;
    if (!user_id || !plan_key) {
      return res.status(400).json({ error: 'user_id et plan_key requis' });
    }
    const result = await initierPaiement({
      userId: user_id,
      planKey: plan_key,
      phone,
      customerName: customer_name,
      customerEmail: customer_email,
      channels
    });
    res.json(result);
  } catch (e) {
    console.error('/init ✗', e.message);
    res.status(500).json({ error: e.message });
  }
});

// ─── Webhook CinetPay ───────────────────────────────────────────────────
//  Appelé par les serveurs CinetPay après paiement.
//  CinetPay attend un 200 OK quoi qu'il arrive (sinon il retente).
app.post('/cinetpay/notify', async (req, res) => {
  try {
    const result = await gererWebhook(req.body);
    console.log(`[webhook] ${req.body.cpm_trans_id || '?'} →`, result);
    res.status(200).send('OK');
  } catch (e) {
    console.error('/notify ✗', e.message);
    res.status(200).send('OK');  // Important : toujours renvoyer 200 à CinetPay
  }
});

// ─── URL de retour après paiement ───────────────────────────────────────
//  Page simple affichée au user après avoir payé.
//  (La PWA finale aura sa propre page React.)
app.get('/cinetpay/return', async (req, res) => {
  const txnId = req.query.transaction_id || '';
  res.setHeader('Content-Type', 'text/html; charset=utf-8');
  res.send(`<!DOCTYPE html><html lang="fr"><head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <title>BABIMOB — Paiement</title>
  <style>
    body { font-family: system-ui, sans-serif; max-width: 500px; margin: 0 auto; padding: 2rem; text-align: center; background:#f7f8fa; color:#1a1a1a; }
    .card { background:#fff; padding: 2rem; border-radius:12px; box-shadow:0 2px 8px rgba(0,0,0,.06); }
    h1 { color:#1779c2; margin-top:0; }
    code { background:#eef2f7; padding:2px 6px; border-radius:4px; font-size:.85em; }
    p { line-height:1.6; }
  </style>
  </head><body>
    <div class="card">
      <h1>✅ Merci !</h1>
      <p>Ton paiement a été transmis à CinetPay.</p>
      <p>La confirmation peut prendre <strong>quelques secondes à quelques minutes</strong>.</p>
      <p>Tu peux fermer cette page et retourner dans BABIMOB : ton quota sera mis à jour automatiquement dès validation.</p>
      <p><small>Transaction : <code>${txnId.replace(/[<>]/g,'') || 'inconnue'}</code></small></p>
    </div>
  </body></html>`);
});

// ─── Vérifier manuellement un paiement (debug) ──────────────────────────
app.get('/cinetpay/check/:txnId', async (req, res) => {
  try {
    const result = await checkStatus(req.params.txnId);
    res.json(result);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// ─── 404 ────────────────────────────────────────────────────────────────
app.use((req, res) => res.status(404).json({ error: 'not found', path: req.path }));

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🚀 Webhook CinetPay à l'écoute sur le port ${PORT}`);
  console.log(`   Routes : / | /cinetpay/init | /cinetpay/notify | /cinetpay/return | /cinetpay/check/:txnId`);
});
