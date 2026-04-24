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

      <div className="max-w-3xl mx-auto w-full px-4 py-6 grid gap-4 md:gap-5 grid-cols-1 md:grid-cols-2 relative z-10">
        
        {/* PROFILE HEADER - Span 2 */}
        <div className="md:col-span-2 group relative rounded-3xl overflow-hidden glass-card p-6 flex items-center gap-5 border-white/5 hover:border-white/15 transition-all duration-500">
          <div className="absolute inset-0 bg-gradient-to-r from-bm-amber/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
          <div className="relative z-10 w-16 h-16 rounded-2xl bg-bm-gradient flex items-center justify-center flex-shrink-0 shadow-[0_0_20px_rgba(245,166,35,0.3)]">
            <span className="text-black text-2xl font-black select-none">{initiale}</span>
          </div>
          <div className="relative z-10 flex-1 min-w-0">
            <div className="text-lg font-bold text-white truncate">{user.email}</div>
            <div className="flex items-center gap-2 mt-1.5 flex-wrap">
              <span className="text-xs font-medium text-gray-400 bg-white/5 px-2.5 py-1 rounded-full border border-white/10">Membre BABIMOB</span>
              {badge && (
                <span className="inline-flex items-center gap-1.5 text-xs font-bold text-bm-amber bg-bm-amber/10 px-3 py-1 rounded-full border border-bm-amber/20 shadow-[0_0_10px_rgba(245,166,35,0.2)]">
                  🏅 {badge}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* EXPLORATIONS - Span 2 */}
        <div className="md:col-span-2 group relative rounded-3xl overflow-hidden glass-card p-6 border-white/5 hover:border-white/15 transition-all duration-500">
          <div className="absolute inset-0 bg-gradient-to-br from-bm-telegram/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
          <div className="relative z-10">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-bm-telegram/20 text-bm-telegram flex items-center justify-center">
                  <svg viewBox="0 0 24 24" className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 22s-8-4.5-8-11.5a8 8 0 1 1 16 0C20 17.5 12 22 12 22Z" /><circle cx="12" cy="10" r="3" /></svg>
                </div>
                <div className="text-sm uppercase tracking-wider text-white font-bold">Mes explorations</div>
              </div>
              <Link href="/app/ccomment" className="text-xs font-semibold text-bm-amber hover:text-bm-amber/80 transition flex items-center gap-1">Voir tout <span>→</span></Link>
            </div>
            
            <div className="grid grid-cols-3 gap-3 mb-5">
              <div className="text-center p-3 rounded-2xl bg-white/[0.02] border border-white/5">
                <div className="text-3xl font-black text-white">{total}</div>
                <div className="text-[10px] uppercase tracking-wide text-gray-500 mt-1 font-semibold">check-ins</div>
              </div>
              <div className="text-center p-3 rounded-2xl bg-white/[0.02] border border-white/5">
                <div className="text-3xl font-black text-white">{topCommunes.length}</div>
                <div className="text-[10px] uppercase tracking-wide text-gray-500 mt-1 font-semibold">communes</div>
              </div>
              <div className="text-center p-3 rounded-2xl bg-white/[0.02] border border-white/5">
                <div className="text-3xl font-black text-white">{badge ? '🏅' : '—'}</div>
                <div className="text-[10px] uppercase tracking-wide text-gray-500 mt-1 font-semibold">badge</div>
              </div>
            </div>

            {topCommunes.length > 0 && (
              <div className="pt-4 border-t border-white/10">
                <div className="text-[10px] uppercase tracking-wider text-gray-500 font-semibold mb-3">Communes fréquentées</div>
                <div className="flex gap-2 flex-wrap">
                  {topCommunes.map((c) => (
                    <span key={c} className="text-xs font-medium bg-white/10 border border-white/20 text-white px-3 py-1.5 rounded-full shadow-[inset_0_1px_0_rgba(255,255,255,0.1)]">{c}</span>
                  ))}
                </div>
              </div>
            )}
            
            {total === 0 && (
              <p className="text-sm text-gray-400 text-center mt-2 py-4 bg-white/5 rounded-2xl border border-white/5">
                Fais ton premier check-in sur un arrêt pour commencer à explorer ! 📍
              </p>
            )}
          </div>
        </div>

        {/* FAVORITES - Span 1 */}
        <div className="md:col-span-1 group relative rounded-3xl overflow-hidden glass-card p-6 border-white/5 hover:border-white/15 transition-all duration-500 flex flex-col h-full">
          <div className="absolute inset-0 bg-gradient-to-bl from-red-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
          <div className="relative z-10 flex flex-col h-full">
            <div className="flex items-center justify-between mb-5">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-red-500/20 text-red-500 flex items-center justify-center">
                  <svg viewBox="0 0 24 24" className="w-4 h-4" fill="currentColor"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>
                </div>
                <div className="text-sm uppercase tracking-wider text-white font-bold">Favoris</div>
              </div>
              <span className="text-xs font-bold bg-white/10 px-2 py-1 rounded-lg text-white">{favorites?.length ?? 0}</span>
            </div>

            {!favorites || favorites.length === 0 ? (
              <div className="flex-1 flex flex-col items-center justify-center text-center py-4">
                <p className="text-xs text-gray-400 leading-relaxed">
                  Appuie sur le cœur sur un arrêt pour le sauvegarder ici.
                </p>
              </div>
            ) : (
              <ul className="space-y-2 flex-1">
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
                      className="flex items-center gap-3 bg-white/[0.02] hover:bg-white/[0.08] border border-white/5 rounded-xl px-3 py-2.5 transition-colors"
                    >
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-semibold text-white truncate">{fav.label}</div>
                        <div className="text-[10px] text-gray-400 uppercase tracking-wide mt-0.5">{fav.kind === 'stop' ? 'Arrêt' : 'Ligne'}</div>
                      </div>
                      <svg className="w-4 h-4 text-gray-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="m9 18 6-6-6-6" strokeLinecap="round" strokeLinejoin="round"/></svg>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>

        {/* PREFERENCES - Span 1 */}
        <div className="md:col-span-1 group relative rounded-3xl overflow-hidden glass-card p-6 border-white/5 hover:border-white/15 transition-all duration-500 flex flex-col h-full">
          <div className="absolute inset-0 bg-gradient-to-br from-bm-green/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
          <div className="relative z-10 flex flex-col h-full">
            <div className="flex items-center gap-2 mb-5">
              <div className="w-8 h-8 rounded-xl bg-bm-green/20 text-bm-green flex items-center justify-center">
                <svg viewBox="0 0 24 24" className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>
              </div>
              <div className="text-sm uppercase tracking-wider text-white font-bold">Préférences</div>
            </div>

            <div className="flex flex-wrap gap-2 flex-1">
              {['🚐 Gbaka', '🚖 Woro-woro', '🚕 Taxi', '🛺 Saloni'].map((t) => (
                <button key={t} className="text-xs font-medium bg-white/5 border border-white/10 hover:border-bm-amber/50 hover:bg-bm-amber/10 hover:text-bm-amber hover:shadow-[0_0_10px_rgba(245,166,35,0.2)] text-gray-300 px-3.5 py-2 rounded-xl transition-all">
                  {t}
                </button>
              ))}
            </div>
            <p className="text-[10px] text-gray-500 mt-4 bg-white/5 p-2.5 rounded-xl border border-white/5">Mode personnalisation bientôt actif.</p>
          </div>
        </div>

        {/* PRIVACY - Span 2 */}
        <div className="md:col-span-2 group relative rounded-3xl overflow-hidden glass-card p-6 border-white/5 hover:border-white/15 transition-all duration-500">
          <div className="flex items-center justify-between relative z-10">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-xl bg-white/10 text-white flex items-center justify-center">
                <svg viewBox="0 0 24 24" className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2"><path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z"/><circle cx="12" cy="12" r="3"/></svg>
              </div>
              <div>
                <div className="text-sm font-bold text-white">Profil Public</div>
                <div className="text-xs text-gray-400 mt-0.5">Tes check-ins sont visibles par la communauté</div>
              </div>
            </div>
            <div className="w-12 h-7 bg-bm-amber rounded-full flex items-center px-1 cursor-pointer shadow-[0_0_15px_rgba(245,166,35,0.3)] hover:scale-105 transition-transform">
              <div className="w-5 h-5 bg-black rounded-full shadow translate-x-5 transition-transform" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
