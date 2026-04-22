import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import SignOutButton from './SignOutButton';

export default async function ComptePage() {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/app/auth/signin');

  // Récupérer le quota si l'user existe dans la table user_quotas
  // Note : l'user peut exister dans auth.users sans être dans public.users.
  // On adresse ça plus tard avec un trigger post-auth.
  const { data: quota } = await supabase
    .from('user_quotas')
    .select('requetes_restantes, requetes_bonus, essai_premium_active, essai_premium_expire, premium_active')
    .eq('user_id', user.id)
    .maybeSingle();

  return (
    <div className="max-w-3xl mx-auto w-full px-4 py-8">
      <h1 className="text-2xl font-bold text-babimob-blue">Mon compte</h1>
      <p className="text-sm text-gray-500 mt-1">{user.email}</p>

      <section className="mt-6 bg-white rounded-xl shadow-md p-6 border border-gray-100">
        <h2 className="font-semibold mb-4">📊 Mon quota</h2>
        {quota ? (
          <dl className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <dt className="text-gray-500">Requêtes gratuites restantes</dt>
              <dd className="text-2xl font-bold text-babimob-blue">{quota.requetes_restantes}/30</dd>
            </div>
            <div>
              <dt className="text-gray-500">Requêtes bonus</dt>
              <dd className="text-2xl font-bold text-babimob-orange">{quota.requetes_bonus}</dd>
            </div>
            <div className="col-span-2 pt-2 border-t border-gray-100">
              <dt className="text-gray-500 text-xs uppercase tracking-wide">Statut</dt>
              <dd className="mt-1 font-medium">
                {quota.premium_active
                  ? <span className="text-emerald-600">💎 Premium actif</span>
                  : quota.essai_premium_active
                    ? <span className="text-amber-600">✨ Essai premium en cours{quota.essai_premium_expire && ` (jusqu'au ${quota.essai_premium_expire})`}</span>
                    : <span className="text-gray-500">Compte gratuit</span>}
              </dd>
            </div>
          </dl>
        ) : (
          <p className="text-sm text-gray-500">
            Aucun quota associé à ce compte. <span className="text-xs">(Un trigger post-auth va bientôt gérer ça automatiquement.)</span>
          </p>
        )}
      </section>

      <section className="mt-6 bg-white rounded-xl shadow-md p-6 border border-gray-100">
        <h2 className="font-semibold mb-2">💳 Recharger / passer Premium</h2>
        <p className="text-sm text-gray-500 mb-4">
          Paiement par mobile money (Wave, Orange Money, MTN, Moov) via CinetPay.
        </p>
        <button
          disabled
          className="bg-babimob-orange/40 text-white px-4 py-2 rounded-lg text-sm cursor-not-allowed"
        >
          (Activation CinetPay prochainement)
        </button>
      </section>

      <div className="mt-8">
        <SignOutButton />
      </div>
    </div>
  );
}
