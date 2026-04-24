import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import SignOutButton from './SignOutButton';

export default async function ComptePage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/app/auth/signin');

  const { count: checkinCount } = await supabase
    .from('checkins')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', user.id);

  const { data: communesData } = await supabase
    .from('checkins')
    .select('commune')
    .eq('user_id', user.id)
    .not('commune', 'is', null)
    .limit(50);

  const communeFreq: Record<string, number> = {};
  communesData?.forEach((r: { commune: string | null }) => {
    if (r.commune) communeFreq[r.commune] = (communeFreq[r.commune] ?? 0) + 1;
  });
  const topCommunes = Object.entries(communeFreq)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3)
    .map(([c]) => c);

  const total = checkinCount ?? 0;
  const badge = total >= 50 ? 'Légende' : total >= 20 ? 'Explorateur Pro' : total >= 5 ? 'Explorateur' : null;
  const initiale = (user.email?.[0] ?? 'U').toUpperCase();

  return (
    <div className="flex-1 flex flex-col overflow-y-auto bg-gray-50">
      <div className="sticky top-0 z-10 bg-white/95 backdrop-blur-xl border-b border-gray-100 px-4 py-3 flex items-center gap-3">
        <Link href="/app" className="p-1.5 -ml-1 rounded-xl hover:bg-gray-100 transition" aria-label="Retour à la carte">
          <svg className="w-5 h-5 text-gray-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="m15 18-6-6 6-6" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </Link>
        <span className="text-sm font-medium text-gray-600 flex-1">Mon profil</span>
        <SignOutButton />
      </div>

      <div className="max-w-2xl mx-auto w-full px-4 py-6 space-y-4">
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-bm-gradient flex items-center justify-center flex-shrink-0">
            <span className="text-black text-xl font-bold select-none">{initiale}</span>
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-sm font-semibold text-gray-900 truncate">{user.email}</div>
            <div className="flex items-center gap-2 mt-1 flex-wrap">
              <span className="text-xs text-gray-400">Membre BABIMOB</span>
              {badge && (
                <span className="inline-flex items-center gap-1 text-xs font-semibold text-bm-amber bg-bm-amber/10 px-2 py-0.5 rounded-full">
                  🏅 {badge}
                </span>
              )}
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
          <div className="flex items-center justify-between mb-4">
            <div className="text-xs uppercase tracking-wide text-gray-400 font-semibold">Mes explorations</div>
            <Link href="/app/ccomment" className="text-xs font-semibold text-bm-amber">Voir tout →</Link>
          </div>
          <div className="grid grid-cols-3 gap-3">
            <div className="text-center">
              <div className="text-2xl font-bold text-gray-900">{total}</div>
              <div className="text-xs text-gray-400 mt-0.5">check-ins</div>
            </div>
            <div className="text-center border-x border-gray-100">
              <div className="text-2xl font-bold text-gray-900">{topCommunes.length}</div>
              <div className="text-xs text-gray-400 mt-0.5">communes</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-gray-900">{badge ? '🏅' : '—'}</div>
              <div className="text-xs text-gray-400 mt-0.5">badge</div>
            </div>
          </div>
          {topCommunes.length > 0 && (
            <div className="mt-4 pt-4 border-t border-gray-50">
              <div className="text-xs text-gray-400 mb-2">Communes fréquentées</div>
              <div className="flex gap-2 flex-wrap">
                {topCommunes.map((c) => (
                  <span key={c} className="text-xs bg-gray-100 text-gray-700 px-2.5 py-1 rounded-full">{c}</span>
                ))}
              </div>
            </div>
          )}
          {total === 0 && (
            <p className="text-xs text-gray-400 text-center mt-3">
              Fais ton premier check-in sur un arrêt pour commencer à explorer ! 📍
            </p>
          )}
        </div>

        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
          <div className="text-xs uppercase tracking-wide text-gray-400 font-semibold mb-3">Préférences de transport</div>
          <div className="flex flex-wrap gap-2">
            {['🚐 Gbaka', '🚖 Woro-woro', '🚕 Taxi intercommunal', '🛺 Saloni'].map((t) => (
              <button key={t} className="text-xs bg-gray-100 hover:bg-bm-amber/10 hover:text-bm-amber text-gray-600 px-3 py-1.5 rounded-full transition-colors">
                {t}
              </button>
            ))}
          </div>
          <p className="text-xs text-gray-400 mt-3">Personnalise les suggestions de trajet (bientôt actif).</p>
        </div>

        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
          <div className="text-xs uppercase tracking-wide text-gray-400 font-semibold mb-3">Confidentialité</div>
          <div className="flex items-center justify-between">
            <div>
              <div className="text-sm font-medium text-gray-800">Visites publiques</div>
              <div className="text-xs text-gray-400 mt-0.5">Les autres peuvent voir tes check-ins récents</div>
            </div>
            <div className="w-11 h-6 bg-bm-amber rounded-full flex items-center px-0.5 cursor-pointer">
              <div className="w-5 h-5 bg-white rounded-full shadow translate-x-5 transition-transform" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
