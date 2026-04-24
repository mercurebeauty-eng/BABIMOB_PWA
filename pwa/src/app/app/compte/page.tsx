import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import SignOutButton from './SignOutButton';
import GridMapBackground from '@/components/GridMapBackground';

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

  const { data: favorites } = await supabase
    .from('user_favorites')
    .select('id, label, stop_id, route_id, kind')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })
    .limit(20);

  const total = checkinCount ?? 0;
  const badge = total >= 50 ? 'Légende' : total >= 20 ? 'Explorateur Pro' : total >= 5 ? 'Explorateur' : null;
  const initiale = (user.email?.[0] ?? 'U').toUpperCase();

  return (
    <div className="flex-1 flex flex-col overflow-y-auto relative text-white">
      <GridMapBackground />
      
      <div className="sticky top-0 z-10 bg-[#0c111a]/80 backdrop-blur-xl border-b border-white/10 px-4 py-3 flex items-center gap-3">
        <Link href="/app" className="p-1.5 -ml-1 rounded-xl hover:bg-white/10 transition" aria-label="Retour à la carte">
          <svg className="w-5 h-5 text-gray-300" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="m15 18-6-6 6-6" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </Link>
        <span className="text-sm font-medium text-gray-200 flex-1">Mon profil</span>
        <SignOutButton />
      </div>

      <div className="max-w-2xl mx-auto w-full px-4 py-6 space-y-4 relative z-10">
        <div className="glass-card rounded-2xl p-5 flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-bm-gradient flex items-center justify-center flex-shrink-0">
            <span className="text-black text-xl font-bold select-none">{initiale}</span>
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-sm font-semibold text-white truncate">{user.email}</div>
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

        <div className="glass-card rounded-2xl p-5">
          <div className="flex items-center justify-between mb-4">
            <div className="text-xs uppercase tracking-wide text-gray-400 font-semibold">Mes explorations</div>
            <Link href="/app/ccomment" className="text-xs font-semibold text-bm-amber hover:text-bm-amber/80 transition">Voir tout →</Link>
          </div>
          <div className="grid grid-cols-3 gap-3">
            <div className="text-center">
              <div className="text-2xl font-bold text-white">{total}</div>
              <div className="text-xs text-gray-400 mt-0.5">check-ins</div>
            </div>
            <div className="text-center border-x border-white/10">
              <div className="text-2xl font-bold text-white">{topCommunes.length}</div>
              <div className="text-xs text-gray-400 mt-0.5">communes</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-white">{badge ? '🏅' : '—'}</div>
              <div className="text-xs text-gray-400 mt-0.5">badge</div>
            </div>
          </div>
          {topCommunes.length > 0 && (
            <div className="mt-4 pt-4 border-t border-white/10">
              <div className="text-xs text-gray-400 mb-2">Communes fréquentées</div>
              <div className="flex gap-2 flex-wrap">
                {topCommunes.map((c) => (
                  <span key={c} className="text-xs bg-white/5 border border-white/10 text-gray-200 px-2.5 py-1 rounded-full">{c}</span>
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

        <div className="glass-card rounded-2xl p-5">
          <div className="flex items-center justify-between mb-3">
            <div className="text-xs uppercase tracking-wide text-gray-400 font-semibold">Mes favoris</div>
            <span className="text-xs text-gray-400">{favorites?.length ?? 0}</span>
          </div>
          {!favorites || favorites.length === 0 ? (
            <div className="text-center py-3">
              <p className="text-xs text-gray-400">
                Appuie sur{' '}
                <svg className="inline w-3.5 h-3.5 text-gray-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                  <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>{' '}
                sur un arrêt pour le sauvegarder ici.
              </p>
            </div>
          ) : (
            <ul className="space-y-2">
              {favorites.map((fav) => (
                <li key={fav.id}>
                  <Link
                    href={
                      fav.kind === 'stop' && fav.stop_id
                        ? `/app/arret/${encodeURIComponent(fav.stop_id)}`
                        : fav.kind === 'route' && fav.route_id
                        ? `/app/ligne/${encodeURIComponent(fav.route_id)}`
                        : '/app'
                    }
                    className="flex items-center gap-3 hover:bg-white/5 rounded-xl px-2 py-2 -mx-2 transition-colors"
                  >
                    <div className="w-8 h-8 rounded-xl bg-red-500/10 border border-red-500/20 flex items-center justify-center flex-shrink-0">
                      <svg className="w-4 h-4 text-red-400" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
                      </svg>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium text-white truncate">{fav.label}</div>
                      <div className="text-xs text-gray-400">{fav.kind === 'stop' ? 'Arrêt' : 'Ligne'}</div>
                    </div>
                    <svg className="w-4 h-4 text-gray-500 flex-shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="m9 18 6-6-6-6" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="glass-card rounded-2xl p-5">
          <div className="text-xs uppercase tracking-wide text-gray-400 font-semibold mb-3">Préférences de transport</div>
          <div className="flex flex-wrap gap-2">
            {['🚐 Gbaka', '🚖 Woro-woro', '🚕 Taxi intercommunal', '🛺 Saloni'].map((t) => (
              <button key={t} className="text-xs bg-white/5 border border-white/10 hover:border-bm-amber/50 hover:bg-bm-amber/10 hover:text-bm-amber text-gray-300 px-3 py-1.5 rounded-full transition-colors">
                {t}
              </button>
            ))}
          </div>
          <p className="text-xs text-gray-400 mt-3">Personnalise les suggestions de trajet (bientôt actif).</p>
        </div>

        <div className="glass-card rounded-2xl p-5">
          <div className="text-xs uppercase tracking-wide text-gray-400 font-semibold mb-3">Confidentialité</div>
          <div className="flex items-center justify-between">
            <div>
              <div className="text-sm font-medium text-gray-200">Visites publiques</div>
              <div className="text-xs text-gray-400 mt-0.5">Les autres peuvent voir tes check-ins récents</div>
            </div>
            <div className="w-11 h-6 bg-bm-amber rounded-full flex items-center px-0.5 cursor-pointer shadow-[0_0_12px_rgba(245,166,35,0.4)]">
              <div className="w-5 h-5 bg-black rounded-full shadow translate-x-5 transition-transform" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
