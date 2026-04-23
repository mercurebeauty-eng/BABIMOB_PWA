import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import SignOutButton from './SignOutButton';

export default async function ComptePage() {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/app/auth/signin');

  const { data: quota } = await supabase
    .from('user_quotas')
    .select('requetes_restantes, requetes_bonus, essai_premium_active, essai_premium_expire, premium_active')
    .eq('user_id', user.id)
    .maybeSingle();

  return (
    <div className="flex-1 flex flex-col overflow-y-auto bg-gray-50">
      {/* Top nav */}
      <div className="sticky top-0 z-10 bg-white/95 backdrop-blur-xl border-b border-gray-100 px-4 py-3 flex items-center gap-3">
        <Link
          href="/app"
          className="p-1.5 -ml-1 rounded-xl hover:bg-gray-100 transition"
          aria-label="Retour à la carte"
        >
          <svg className="w-5 h-5 text-gray-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="m15 18-6-6 6-6" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </Link>
        <span className="text-sm font-medium text-gray-600 flex-1">Mon compte</span>
        <SignOutButton />
      </div>

      <div className="max-w-2xl mx-auto w-full px-4 py-6 space-y-4">
        {/* User info */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-bm-gradient flex items-center justify-center flex-shrink-0">
            <span className="text-black text-base font-bold select-none">
              {(user.email?.[0] ?? 'U').toUpperCase()}
            </span>
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-sm font-semibold text-gray-900 truncate">{user.email}</div>
            <div className="mt-1">
              {quota?.premium_active ? (
                <span className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 inline-block" />
                  Premium
                </span>
              ) : quota?.essai_premium_active ? (
                <span className="inline-flex items-center gap-1 text-xs font-semibold text-bm-amber bg-bm-amber/10 px-2 py-0.5 rounded-full">
                  <span className="w-1.5 h-1.5 rounded-full bg-bm-amber inline-block" />
                  Essai Premium
                </span>
              ) : (
                <span className="text-xs text-gray-400">Compte gratuit</span>
              )}
            </div>
          </div>
        </div>

        {/* Quota */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
          <div className="text-xs uppercase tracking-wide text-gray-400 font-semibold mb-4">
            Mon quota
          </div>
          {quota ? (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Requêtes gratuites restantes</span>
                <span className="text-2xl font-bold text-bm-amber">{quota.requetes_restantes}<span className="text-sm font-normal text-gray-400">/30</span></span>
              </div>
              <div className="w-full bg-gray-100 rounded-full h-1.5">
                <div
                  className="bg-bm-gradient h-1.5 rounded-full transition-all"
                  style={{ width: `${Math.min(100, (quota.requetes_restantes / 30) * 100)}%` }}
                />
              </div>
              {quota.requetes_bonus > 0 && (
                <div className="flex items-center justify-between pt-1 border-t border-gray-50">
                  <span className="text-sm text-gray-600">Requêtes bonus</span>
                  <span className="text-xl font-bold text-bm-coral">{quota.requetes_bonus}</span>
                </div>
              )}
              <div className="pt-1 border-t border-gray-50">
                <span className="text-xs text-gray-500">Statut : </span>
                {quota.premium_active ? (
                  <span className="text-xs font-semibold text-emerald-600">Premium actif</span>
                ) : quota.essai_premium_active ? (
                  <span className="text-xs font-semibold text-bm-amber">
                    Essai premium en cours{quota.essai_premium_expire && ` · expire le ${quota.essai_premium_expire}`}
                  </span>
                ) : (
                  <span className="text-xs text-gray-400">Compte gratuit</span>
                )}
              </div>
            </div>
          ) : (
            <p className="text-sm text-gray-500">
              Aucun quota associé à ce compte pour le moment.
            </p>
          )}
        </div>

        {/* Payment */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
          <div className="text-xs uppercase tracking-wide text-gray-400 font-semibold mb-1">
            Recharger / passer Premium
          </div>
          <p className="text-sm text-gray-500 mb-4 mt-1">
            Paiement par mobile money (Wave, Orange Money, MTN, Moov) via CinetPay.
          </p>
          <button
            disabled
            className="w-full py-3 rounded-2xl bg-gray-100 text-gray-400 text-sm font-medium cursor-not-allowed"
          >
            Activation CinetPay prochainement
          </button>
        </div>
      </div>
    </div>
  );
}
