import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import SignOutButton from './SignOutButton';
import ProfileEditor from './ProfileEditor';
import BeigeMapBackground from '@/components/BeigeMapBackground';
import ProfileSocialTabs from '@/components/ProfileSocialTabs';

export default async function ComptePage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/app/auth/signin');

  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .maybeSingle();

  const { data: badges } = await supabase
    .from('user_badges')
    .select('badge_key, awarded_at')
    .eq('user_id', user.id);

  const { data: following } = await supabase
    .from('follows')
    .select('id, profiles:following_id(id, display_name, avatar_emoji, is_verified_explorer)')
    .eq('follower_id', user.id);

  const { count: checkinCount } = await supabase
    .from('checkins')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', user.id);

  const { data: checkinsDetail } = await supabase
    .from('checkins')
    .select('commune, place_name, lat, lon')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })
    .limit(300);

  const heatmapData = checkinsDetail
    ?.filter(c => c.lat != null && c.lon != null)
    .map(c => ({ lat: c.lat, lon: c.lon })) ?? [];

  const communeFreq: Record<string, number> = {};
  const categoryFreq: Record<string, number> = {
    gastronome: 0,
    shopping: 0,
    culture: 0,
    transport: 0,
  };

  checkinsDetail?.forEach((r) => {
    if (r.commune) communeFreq[r.commune] = (communeFreq[r.commune] ?? 0) + 1;

    const name = (r.place_name || '').toLowerCase();
    if (name.match(/maquis|resto|restaurant|bar|café/)) categoryFreq.gastronome++;
    if (name.match(/marché|mall|magasin|boutique|supermarché|shopping/)) categoryFreq.shopping++;
    if (name.match(/musée|cinéma|théâtre|école|université|faculté/)) categoryFreq.culture++;
    if (name.match(/gare|arrêt|station|gbaka|woro/)) categoryFreq.transport++;
  });

  const topCommunes = Object.entries(communeFreq)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3)
    .map(([c]) => c);
  
  const topCategory = Object.entries(categoryFreq)
    .sort((a, b) => b[1] - a[1])[0][0];

  const { data: favorites } = await supabase
    .from('user_favorites')
    .select('id, label, stop_id, route_id, kind')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })
    .limit(20);

  const total = checkinCount ?? 0;
  const totalPoints = profile?.total_points ?? 0;
  const communeCount = topCommunes.length;
  
  // Level based on a mix of points and visits
  const levelScore = (total * 2) + Math.floor(totalPoints / 5);
  const level = levelScore >= 1000 ? 4 : levelScore >= 400 ? 3 : levelScore >= 100 ? 2 : 1;
  const levelNames = ['Novice', 'Explorateur Émergent', 'Guide Urbain', 'Maître d\'Abidjan'];
  const badge = levelNames[level - 1];
  
  const nextMilestone = level === 1 ? 100 : level === 2 ? 400 : level === 3 ? 1000 : 5000;
  const progress = Math.min((levelScore / nextMilestone) * 100, 100);

  // Advanced User Archetype (Class)
  let userClass = 'Observateur';
  if (total >= 5) {
    if (communeCount <= 1 && total >= 20) {
      userClass = 'Casanier';
    } else if (categoryFreq.gastronome > 0 && topCategory === 'gastronome') {
      userClass = 'Epicurien / Gastronome';
    } else if (categoryFreq.shopping > 0 && topCategory === 'shopping') {
      userClass = 'Shopping Addict';
    } else if (categoryFreq.culture > 0 && topCategory === 'culture') {
      userClass = 'Culturel / Étudiant';
    } else if (communeCount >= 5) {
      userClass = 'Vagabond Urbain';
    } else if (categoryFreq.transport > 2) {
      userClass = 'Gbaka Lover';
    } else {
      userClass = 'Explorateur';
    }
  }

  const displayName = profile?.display_name ?? (user.email?.split('@')[0] ?? 'Explorateur');
  const avatarEmoji = profile?.avatar_emoji ?? '🧭';

  return (
    <div className="flex-1 flex flex-col overflow-y-auto relative bg-beige-50 text-beige-text font-sans">
      <BeigeMapBackground />
      
      <div className="sticky top-0 z-20 bg-beige-50/80 backdrop-blur-xl border-b border-beige-200/50 px-4 py-3 flex items-center gap-3">
        <Link href="/app" className="p-2 -ml-2 rounded-full hover:bg-beige-100 transition-colors" aria-label="Retour à la carte">
          <svg className="w-5 h-5 text-beige-muted" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <path d="m15 18-6-6 6-6" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </Link>
        <span className="text-sm font-bold uppercase tracking-widest text-beige-muted flex-1">Mon profil</span>
        <SignOutButton />
      </div>

      <div className="max-w-3xl mx-auto w-full px-5 py-8 grid gap-6 md:grid-cols-2 relative z-10">
        
        {/* PROFILE HEADER - Gamified */}
        <div className="md:col-span-2 group relative rounded-[2.5rem] overflow-hidden bg-white border-2 border-beige-200 p-8 flex flex-col sm:flex-row items-center gap-8 shadow-xl shadow-black/5 transition-all duration-500 hover:border-abidjan-orange/30">
          <div className="relative z-10 w-24 h-24 rounded-3xl bg-beige-50 border-2 border-beige-200 flex items-center justify-center flex-shrink-0 shadow-xl shadow-black/5 ring-4 ring-beige-50">
            <span className="text-5xl select-none">{avatarEmoji}</span>
            <div className="absolute -bottom-2 -right-2 w-10 h-10 bg-abidjan-orange rounded-xl shadow-lg border-2 border-white flex items-center justify-center text-base font-black text-white">
              {level}
            </div>
          </div>
          <div className="relative z-10 flex-1 text-center sm:text-left">
            <div className="flex items-center justify-center sm:justify-start gap-2 mb-1">
               <div className="text-2xl font-black text-beige-text truncate max-w-xs sm:max-w-none">{displayName}</div>
               {profile?.is_verified_explorer && (
                  <span className="w-5 h-5 bg-abidjan-blue text-white rounded-full flex items-center justify-center text-[10px] shadow-sm shadow-abidjan-blue/30" title="Explorateur Vérifié">✓</span>
               )}
            </div>
            <div className="text-sm text-beige-muted font-medium mb-3 truncate">{user.email}</div>
            <div className="flex items-center justify-center sm:justify-start gap-2 flex-wrap mb-4">
              <span className="text-[10px] font-black text-beige-muted bg-beige-50 px-3 py-1.5 rounded-full border border-beige-100 uppercase tracking-widest">Niveau {level} · {badge}</span>
              <span className="text-[10px] font-black text-white bg-abidjan-blue px-3 py-1.5 rounded-full border border-abidjan-blue shadow-sm uppercase tracking-widest">Archetype: {userClass}</span>
            </div>
            
            {/* Progress Bar */}
            <div className="max-w-sm">
               <div className="flex justify-between items-end mb-2">
                  <div className="text-[10px] font-black uppercase tracking-widest text-beige-muted">
                    Score: <span className="text-abidjan-orange">{totalPoints} b-pts</span>
                  </div>
                  <div className="text-[9px] font-black uppercase text-beige-muted">
                    {levelScore} / {nextMilestone} xp
                  </div>
               </div>
               <div className="h-3 bg-beige-50 rounded-full border border-beige-100 overflow-hidden">
                  <div 
                    className="h-full bg-abidjan-orange rounded-full transition-all duration-1000"
                    style={{ width: `${progress}%` }}
                  />
               </div>
            </div>
          </div>
        </div>

        {/* BADGES GALLERY */}
        <div className="md:col-span-2 bg-white rounded-[2.5rem] border-2 border-beige-200 p-8 shadow-xl shadow-black/5">
           <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-xl bg-purple-500/10 text-purple-500 flex items-center justify-center text-xl">🏆</div>
              <h3 className="text-sm font-black uppercase tracking-widest text-beige-text">Ma Galerie de Badges</h3>
           </div>
           
           <div className="flex flex-wrap gap-4">
              {[
                { key: 'conqueror', label: 'Conquérant', emoji: '🗺️', desc: '5 lieux visités dans 5 communes différentes' },
                { key: 'night_owl', label: 'Oiseau de Nuit', emoji: '🦉', desc: 'Sortie après 22h' },
                { key: 'early_bird', label: 'Lève-tôt', emoji: '🥐', desc: 'Actif aux aurores' },
                { key: 'guide', label: 'Guide Local', emoji: '💬', desc: 'Donne des avis utiles' }
              ].map((b) => {
                const unlocked = badges?.some(ub => ub.badge_key === b.key);
                return (
                  <div key={b.key} className={`flex-1 min-w-[140px] p-4 rounded-3xl border-2 transition-all ${unlocked ? 'bg-purple-50 border-purple-200 ring-2 ring-purple-100 shadow-md' : 'bg-beige-50/50 border-beige-100 grayscale opacity-40'}`}>
                    <div className="text-3xl mb-2">{b.emoji}</div>
                    <div className="text-[10px] font-black uppercase tracking-tight text-beige-text">{b.label}</div>
                    <div className="text-[9px] font-bold text-beige-muted mt-1 leading-tight">{b.desc}</div>
                    {unlocked && <div className="text-[8px] font-black text-purple-500 uppercase mt-2">DÉBLOQUÉ ✅</div>}
                  </div>
                );
              })}
           </div>
        </div>

        {/* SOCIAL TABS - Span 2 */}
        <ProfileSocialTabs 
          userId={user.id} 
          initialVisits={(checkinsDetail as any[]) || []}
          initialFollowing={(following as any[]) || []}
          heatmapData={(heatmapData as any[]) || []}
          currentTier={profile?.sub_tier || 'free'}
        />

        {/* EXPLORATIONS - Span 2 */}
        <div className="md:col-span-2 group relative rounded-[2.5rem] overflow-hidden bg-white border-2 border-beige-200 p-8 shadow-xl shadow-black/5 transition-all duration-500 hover:border-abidjan-blue/30">
          <div className="relative z-10">
            <div className="flex items-center justify-between mb-8">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-abidjan-blue/10 text-abidjan-blue flex items-center justify-center text-xl">
                  📍
                </div>
                <div className="text-sm uppercase tracking-widest text-beige-text font-black">Statistiques de voyage</div>
              </div>
            </div>
            
            <div className="grid grid-cols-3 gap-4 mb-8">
              <div className="text-center p-5 rounded-3xl bg-beige-50 border border-beige-100">
                <div className="text-4xl font-black text-beige-text">{total}</div>
                <div className="text-[10px] uppercase tracking-widest text-beige-muted mt-2 font-bold">visites</div>
              </div>
              <div className="text-center p-5 rounded-3xl bg-beige-50 border border-beige-100">
                <div className="text-4xl font-black text-beige-text">{topCommunes.length}</div>
                <div className="text-[10px] uppercase tracking-widest text-beige-muted mt-2 font-bold">communes</div>
              </div>
              <div className="text-center p-5 rounded-3xl bg-beige-50 border border-beige-100">
                <div className="text-4xl font-black text-beige-text">#{level}</div>
                <div className="text-[10px] uppercase tracking-widest text-beige-muted mt-2 font-bold">rang</div>
              </div>
            </div>

            {topCommunes.length > 0 && (
              <div className="pt-6 border-t border-beige-100">
                <div className="text-[10px] uppercase tracking-widest text-beige-muted font-bold mb-4">Communes fréquentées</div>
                <div className="flex gap-2 flex-wrap">
                  {topCommunes.map((c) => (
                    <span key={c} className="text-xs font-bold bg-white border border-beige-200 text-beige-text px-4 py-2 rounded-full shadow-sm">{c}</span>
                  ))}
                </div>
              </div>
            )}
            
            {total === 0 && (
              <p className="text-sm text-beige-muted font-medium text-center mt-2 py-6 bg-beige-50 rounded-3xl border border-beige-100 border-dashed">
                Visite un lieu sur la carte pour commencer à explorer ! 🗺️
              </p>
            )}
          </div>
        </div>

        {/* FAVORITES - Span 1 */}
        <div className="md:col-span-1 group relative rounded-[2.5rem] overflow-hidden bg-white border-2 border-beige-200 p-8 shadow-xl shadow-black/5 transition-all duration-500 hover:border-red-500/30 flex flex-col h-full">
          <div className="relative z-10 flex flex-col h-full">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-red-500/10 text-red-500 flex items-center justify-center text-xl">❤️</div>
                <div className="text-sm uppercase tracking-widest text-beige-text font-black">Favoris</div>
              </div>
              <span className="text-xs font-black bg-beige-50 px-3 py-1 rounded-lg text-beige-muted border border-beige-100">{favorites?.length ?? 0}</span>
            </div>

            {!favorites || favorites.length === 0 ? (
              <div className="flex-1 flex flex-col items-center justify-center text-center py-6 bg-beige-50 rounded-3xl border border-beige-100 border-dashed">
                <p className="text-xs text-beige-muted font-bold leading-relaxed px-4">
                  Appuie sur le cœur sur un arrêt pour le sauvegarder ici.
                </p>
              </div>
            ) : (
              <ul className="space-y-3 flex-1">
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
                      className="flex items-center gap-4 bg-beige-50 hover:bg-white border border-beige-100 hover:border-red-500/30 rounded-2xl px-4 py-3.5 transition-all shadow-sm"
                    >
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-black text-beige-text truncate">{fav.label}</div>
                        <div className="text-[10px] text-beige-muted font-bold uppercase tracking-widest mt-1">{fav.kind === 'stop' ? 'Arrêt' : 'Ligne'}</div>
                      </div>
                      <svg className="w-4 h-4 text-beige-200" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><path d="m9 18 6-6-6-6" strokeLinecap="round" strokeLinejoin="round"/></svg>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>

        <div className="md:col-span-1 group relative rounded-[2.5rem] overflow-hidden bg-white border-2 border-beige-200 p-8 shadow-xl shadow-black/5 flex flex-col">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-xl bg-abidjan-orange/10 text-abidjan-orange flex items-center justify-center text-xl">✏️</div>
            <div className="text-sm uppercase tracking-widest text-beige-text font-black">Mon profil</div>
          </div>
          <ProfileEditor
            userId={user.id}
            initialName={displayName}
            initialEmoji={avatarEmoji}
            initialPhone={profile?.phone_number || ''}
            initialConsent={profile?.phone_marketing_consent}
            initialVisibility={profile?.is_public_visits}
          />
        </div>

        {/* PREFERENCES - Span 1 */}
        <div className="md:col-span-1 group relative rounded-[2.5rem] overflow-hidden bg-white border-2 border-beige-200 p-8 shadow-xl shadow-black/5 transition-all duration-500 hover:border-abidjan-green/30 flex flex-col h-full">
          <div className="relative z-10 flex flex-col h-full">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-xl bg-abidjan-green/10 text-abidjan-green flex items-center justify-center text-xl">⚙️</div>
              <div className="text-sm uppercase tracking-widest text-beige-text font-black">Préférences</div>
            </div>

            <div className="flex flex-wrap gap-2 flex-1">
              {['🚐 Gbaka', '🚖 Woro-woro', '🚕 Taxi', '🛺 Saloni'].map((t) => (
                <button key={t} className="text-xs font-black bg-beige-50 border-2 border-beige-100 hover:border-abidjan-orange hover:bg-abidjan-orange/10 hover:text-abidjan-orange text-beige-muted px-4 py-2.5 rounded-2xl transition-all shadow-sm">
                  {t}
                </button>
              ))}
            </div>
            <div className="mt-6 p-4 bg-beige-50 rounded-2xl border border-beige-100 border-dashed">
               <p className="text-[10px] text-beige-muted font-bold uppercase tracking-widest leading-relaxed">Le mode personnalisation sera bientôt actif pour tes calculs d&apos;itinéraires.</p>
            </div>
          </div>
        </div>


        {/* ADMIN SECTION - Only if Admin */}
        <div className="md:col-span-2 group relative rounded-[2.5rem] overflow-hidden bg-abidjan-orange/5 border-2 border-abidjan-orange/20 p-8 shadow-xl shadow-black/5 transition-all duration-500 hover:border-abidjan-orange/40">
           <div className="flex flex-col sm:flex-row items-center justify-between gap-6 relative z-10">
              <div className="flex items-center gap-5">
                 <div className="w-14 h-14 rounded-2xl bg-white text-abidjan-orange flex items-center justify-center text-2xl border-2 border-abidjan-orange/20 shadow-md">
                    👑
                 </div>
                 <div className="text-center sm:text-left">
                    <div className="text-lg font-black text-beige-text">Console Administration</div>
                    <div className="text-sm text-beige-muted font-medium mt-1">Gérer les établissements et partenaires Babimob.</div>
                 </div>
              </div>
              <Link 
                href="/app/admin/places"
                className="bg-abidjan-orange text-white px-8 py-4 rounded-2xl text-xs font-black uppercase tracking-widest shadow-lg shadow-abidjan-orange/20 active:scale-95 transition-all"
              >
                Accéder →
              </Link>
           </div>
        </div>
      </div>
    </div>
  );
}
