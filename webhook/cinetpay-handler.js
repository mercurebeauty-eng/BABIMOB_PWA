// ════════════════════════════════════════════════════════════════════════
//  BABIMOB_PWA — Handler CinetPay
//
//  Deux fonctions publiques :
//    - initierPaiement(...) : appelé par le bot/PWA pour démarrer un paiement
//    - gererWebhook(body)   : appelé par CinetPay pour notifier le résultat
//
//  Source de vérité : on RE-VÉRIFIE toujours le statut via /v2/payment/check
//  après réception du webhook (on ne fait pas confiance au body brut).
// ════════════════════════════════════════════════════════════════════════

const crypto = require('node:crypto');
const { createClient } = require('@supabase/supabase-js');

const CINETPAY_API = 'https://api-checkout.cinetpay.com/v2/payment';

function supa() {
  return createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY,
    { auth: { persistSession: false } }
  );
}

function generateTxnId() {
  return `BBMB_${Date.now()}_${crypto.randomBytes(4).toString('hex').toUpperCase()}`;
}

// ────────────────────────────────────────────────────────────────────────
//  1) INITIER UN PAIEMENT
// ────────────────────────────────────────────────────────────────────────
async function initierPaiement({
  userId,            // UUID du user BABIMOB (users.id)
  planKey,           // 'pack_30' | 'pack_150' | 'premium_500'
  phone,             // ex : '0701020304' (sans indicatif)
  customerName = 'Utilisateur BABIMOB',
  customerEmail = 'no-reply@babimob.ci',
  channels = 'ALL'   // 'ALL' | 'MOBILE_MONEY' | 'WALLET' | 'CREDIT_CARD'
}) {
  if (!userId)  throw new Error('userId requis');
  if (!planKey) throw new Error('planKey requis');

  const supabase = supa();

  // 1. Récupérer le plan
  const { data: plan, error: planErr } = await supabase
    .from('payment_plans')
    .select('*')
    .eq('key', planKey)
    .eq('is_active', true)
    .maybeSingle();
  if (planErr) throw planErr;
  if (!plan)   throw new Error(`Plan introuvable ou inactif : ${planKey}`);

  // 2. Générer une transaction unique côté BABIMOB
  const txnId = generateTxnId();

  // 3. Préparer le payload CinetPay
  const payload = {
    apikey: process.env.CINETPAY_API_KEY,
    site_id: process.env.CINETPAY_SITE_ID,
    transaction_id: txnId,
    amount: plan.amount,
    currency: 'XOF',
    description: plan.label,
    customer_name: customerName,
    customer_surname: '.',
    customer_email: customerEmail,
    customer_phone_number: phone || '',
    customer_address: 'Abidjan',
    customer_city: 'Abidjan',
    customer_country: 'CI',
    customer_state: 'CI',
    customer_zip_code: '00225',
    notify_url: process.env.CINETPAY_NOTIFY_URL,
    return_url: process.env.CINETPAY_RETURN_URL,
    channels: channels,
    metadata: JSON.stringify({ user_id: userId, plan_key: planKey })
  };

  // 4. Appel CinetPay
  const resp = await fetch(CINETPAY_API, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });
  const result = await resp.json();

  if (result.code !== '201' || !result.data?.payment_url) {
    throw new Error(`CinetPay init échoué : ${result.message || JSON.stringify(result)}`);
  }

  // 5. Persister la transaction en base (status=pending)
  const { error: dbErr } = await supabase.from('payments').insert({
    user_id: userId,
    transaction_id: txnId,
    plan_key: planKey,
    amount: plan.amount,
    currency: 'XOF',
    description: plan.label,
    status: 'pending',
    phone_number: phone,
    customer_name: customerName,
    customer_email: customerEmail,
    payment_url: result.data.payment_url,
    notify_url: process.env.CINETPAY_NOTIFY_URL,
    return_url: process.env.CINETPAY_RETURN_URL,
    raw_init_response: result
  });
  if (dbErr) throw dbErr;

  return {
    transaction_id: txnId,
    payment_url: result.data.payment_url,
    payment_token: result.data.payment_token,
    amount: plan.amount,
    label: plan.label
  };
}

// ────────────────────────────────────────────────────────────────────────
//  2) VÉRIFIER LE STATUT CÔTÉ CINETPAY (source de vérité)
// ────────────────────────────────────────────────────────────────────────
async function checkStatus(transactionId) {
  const resp = await fetch('https://api-checkout.cinetpay.com/v2/payment/check', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      apikey: process.env.CINETPAY_API_KEY,
      site_id: process.env.CINETPAY_SITE_ID,
      transaction_id: transactionId
    })
  });
  return resp.json();
}

// ────────────────────────────────────────────────────────────────────────
//  3) WEBHOOK : reçu depuis CinetPay
// ────────────────────────────────────────────────────────────────────────
async function gererWebhook(body) {
  const txnId = body.cpm_trans_id || body.transaction_id;
  if (!txnId) return { ok: false, reason: 'missing transaction_id' };

  const supabase = supa();

  // 1. Retrouver la transaction locale
  const { data: payment, error: fetchErr } = await supabase
    .from('payments')
    .select('*')
    .eq('transaction_id', txnId)
    .maybeSingle();
  if (fetchErr) throw fetchErr;
  if (!payment) return { ok: false, reason: 'unknown transaction', txn: txnId };

  // 2. Re-vérifier auprès de CinetPay (source de vérité)
  const verify = await checkStatus(txnId);
  const data = verify.data || {};
  const apiStatus = (data.status || '').toUpperCase();

  const newStatus =
    apiStatus === 'ACCEPTED' ? 'success' :
    apiStatus === 'REFUSED'  ? 'failed'  :
    apiStatus === 'CANCELED' ? 'cancelled' :
    'pending';

  // 3. Si déjà traité en success → idempotence : on sort sans re-appliquer
  if (payment.status === 'success' && newStatus === 'success') {
    return { ok: true, status: 'success', idempotent: true };
  }

  // 4. Mettre à jour la ligne payments
  const updates = {
    status: newStatus,
    payment_method: data.payment_method || null,
    operator_txn_id: data.operator_id || null,
    signature_verified: true,
    raw_webhook: body,
    raw_verify_response: verify
  };
  if (newStatus === 'success') {
    updates.completed_at = new Date().toISOString();
  }

  const { error: updErr } = await supabase
    .from('payments')
    .update(updates)
    .eq('transaction_id', txnId);
  if (updErr) throw updErr;

  // 5. Si succès et pas encore crédité → appliquer le plan au quota
  if (newStatus === 'success' && payment.status !== 'success') {
    const { error: rpcErr } = await supabase.rpc('appliquer_plan_paye', {
      p_user_id:  payment.user_id,
      p_plan_key: payment.plan_key
    });
    if (rpcErr) {
      console.error('⚠ appliquer_plan_paye a échoué :', rpcErr.message);
      return { ok: false, reason: 'plan apply failed', error: rpcErr.message };
    }
    return { ok: true, status: 'success', applied: true, plan: payment.plan_key, user_id: payment.user_id };
  }

  return { ok: true, status: newStatus };
}

module.exports = { initierPaiement, gererWebhook, checkStatus };
