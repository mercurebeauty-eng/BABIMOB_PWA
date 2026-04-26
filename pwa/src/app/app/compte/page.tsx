import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import SignOutButton from './SignOutButton';
import ProfileEditor from './ProfileEditor';
import PreferencesEditor from './PreferencesEditor';
import PersonalHeatmap from '@/components/PersonalHeatmap';
import BeigeMapBackground from '@/components/BeigeMapBackground';
import ProfileSocialTabs from '@/components/ProfileSocialTabs';
import ExplorerGoals from './ExplorerGoals';

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
    .select('id, created_at, place_name, commune, place_id, lat, lon, notes')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })
    .limit(300);

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
  
  const total = checkinCount ?? 0;
  const totalPoints = profile?.total_points ?? 0;
  
  // STATS CALCULATIONS
  const levelScore = (total * 2) + Math.floor(totalPoints / 5);
  const level = levelScore >= 1000 ? 4 : levelScore >= 400 ? 3 : levelScore >= 100 ? 2 : 1;
  const levelNames = ['Novice', 'Explorateur Émergent', 'Guide Urbain', 'Maître d\'Abidjan'];
  const badgeName = levelNames[level - 1];
  
  const nextMilestone = level === 1 ? 100 : level === 2 ? 400 : level === 3 ? 1000 : 5000;
  const progress = Math.min((levelScore / nextMilestone) * 100, 100);

  // REACH metric (logical mock based on activity)
  const reachVal = (total * 125) + (totalPoints * 4);
  const reachStr = reachVal >= 1000 ? `${(reachVal / 1000).toFixed(1)}k` : reachVal.toString();

  const displayName = profile?.display_name ?? (user.email?.split('@')[0] ?? 'Explorateur');
  const avatarEmoji = profile?.avatar_emoji ?? '🧭';

  const { data: favorites } = await supabase
    .from('user_favorites')
    .select('id, label, stop_id, route_id, kind')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })
    .limit(5);

  return (
    <div className="flex-1 flex flex-col overflow-y-auto relative bg-beige-50 text-beige-text font-sans">
      <BeigeMapBackground />
      
      {/* Top nav */}
      <div className="sticky top-0 z-30 bg-beige-50/80 backdrop-blur-xl border-b border-beige-200/50 px-4 py-3 flex items-center gap-3">
        <Link href="/app" className="p-2 -ml-2 rounded-full hover:bg-beige-100 transition-colors" aria-label="Retour à la carte">
          <svg className="w-5 h-5 text-beige-muted" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <path d="m15 18-6-6 6-6" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </Link>
        <span className="text-[10px] font-black uppercase tracking-[0.2em] text-beige-muted flex-1 text-center pr-8">ABIDJAN LIVE</span>
        <SignOutButton />
      </div>

      <div className="max-w-xl mx-auto w-full px-5 py-8 space-y-6 relative z-10">
        
        {/* PROFILE HEADER - Compact & Premium */}
        <div className="flex flex-col items-center">
           <div className="relative mb-4">
              <div className="w-28 h-28 rounded-full bg-white border-4 border-white shadow-2xl flex items-center justify-center text-5xl ring-4 ring-abidjan-green/20 relative z-10">
                {avatarEmoji}
              </div>
              <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 z-20 bg-abidjan-orange text-white px-4 py-1 rounded-full text-[10px] font-black uppercase tracking-widest shadow-lg border-2 border-white">
                Level {level}
              </div>
           </div>
           
           <h1 className="text-2xl font-black text-beige-text text-center">{displayName}</h1>
           <p className="text-beige-muted text-xs font-bold mt-1 uppercase tracking-widest">
              @{displayName.toLowerCase().replace(/\s/g, '_')} • {badgeName}
           </p>
        </div>

        {/* STATS STRIP */}
        <div className="grid grid-cols-2 gap-4">
           <div className="bg-white rounded-3xl border-2 border-beige-200 p-6 flex flex-col items-center shadow-lg shadow-black/5 relative group">
              <div className="text-xl mb-1 mt-1">🏆</div>
              <div className="text-2xl font-black text-beige-text">{badges?.length || 0}</div>
              <div className="text-[10px] uppercase font-black tracking-widest text-beige-muted">Badges</div>
              {(badges?.length ?? 0) === 0 && (
                <div className="absolute inset-x-3 bottom-2 text-[8px] text-beige-muted text-center font-bold uppercase tracking-wide opacity-70">
                  Check-in pour débloquer
                </div>
              )}
           </div>
           <div className="bg-white rounded-3xl border-2 border-beige-200 p-6 flex flex-col items-center shadow-lg shadow-black/5 relative group">
              <div className="text-xl mb-1 mt-1">📡</div>
              <div className="text-2xl font-black text-beige-text">{reachStr}</div>
              <div className="text-[10px] uppercase font-black tracking-widest text-beige-muted">Reach</div>
              <div className="absolute inset-x-3 bottom-2 text-[8px] text-beige-muted text-center font-bold uppercase tracking-wide opacity-70">
                Vues estimées
              </div>
           </div>
        </div>

        {/* ROAD TO VERIFIED EXPLORER */}
        {!profile?.is_verified_explorer && (
          <div className="bg-abidjan-orange/5 border-2 border-dashed border-abidjan-orange/30 rounded-[2.5rem] p-8 relative overflow-hidden group">
             <div className="absolute top-0 right-0 p-6 opacity-10 group-hover:scale-125 transition-transform">
                <span className="text-6xl">✓</span>
             </div>
             
             <div className="flex flex-col gap-6 relative z-10">
                <div>
                   <h3 className="text-sm font-black uppercase tracking-widest text-abidjan-orange mb-1">Objectif : Explorateur Vérifié</h3>
                   <p className="text-[11px] font-bold text-beige-muted leading-relaxed uppercase tracking-widest">Gagne l&apos;accès au Live Feed complet et aux avantages Elite.</p>
                </div>

                <ExplorerGoals
                   goals={[
                     { label: "20 Check-ins", current: total, target: 20, emoji: "📍" },
                     { label: "5 lieux de 5 Communes", current: Object.keys(communeFreq).length, target: 5, emoji: "🗺️" },
                     { label: "500 Points accumulés", current: totalPoints, target: 500, emoji: "⭐" },
                   ]}
                   remainingPoints={Math.max(500 - totalPoints, 0)}
                />
             </div>
          </div>
        )}

        {/* PERSONAL HEATMAP SECTION */}
        <div className="bg-white rounded-[2.5rem] border-2 border-beige-200 overflow-hidden shadow-xl shadow-black/5">
           <div className="p-6 border-b border-beige-100 flex items-center justify-between">
              <div className="flex items-center gap-3">
                 <div className="w-8 h-8 rounded-lg bg-abidjan-green/10 text-abidjan-green flex items-center justify-center text-lg">🌍</div>
                 <span className="text-[10px] font-black uppercase tracking-widest text-beige-text">Ma Carte Personnelle</span>
              </div>
              <div className="flex items-center gap-2">
                 <div className="w-2 h-2 rounded-full bg-abidjan-green animate-pulse" />
                 <span className="text-[9px] font-black uppercase text-abidjan-green tracking-widest">Live Area</span>
              </div>
           </div>
           <div className="h-48 bg-beige-50">
              <PersonalHeatmap data={checkinsDetail?.filter(c => c.lat && c.lon).map(c => ({ lat: c.lat!, lon: c.lon! })) ?? []} />
           </div>
           <div className="p-5 text-center bg-beige-50/50">
              <p className="text-[11px] text-beige-muted font-bold italic">
                 Le plus actif à <span className="font-black text-beige-text">{topCommunes[0] || 'Abidjan'}</span> cette semaine
              </p>
           </div>
        </div>

        {/* VISITS & SOCIAL TABS */}
        <ProfileSocialTabs
          userId={user.id}
          initialVisits={(checkinsDetail as any[]) || []}
          initialFollowing={(following as any[]) || []}
          heatmapData={checkinsDetail?.filter(c => c.lat && c.lon).map(c => ({ lat: c.lat!, lon: c.lon! })) ?? []}
          currentTier={profile?.sub_tier || 'free'}
        />

        {/* ADMIN CONSOLE — visible only for admins */}
        {profile?.is_admin && (
          <div className="bg-white rounded-[2.5rem] border-2 border-red-100 p-8 shadow-xl shadow-black/5 group hover:border-red-300 transition-all">
            <Link href="/app/admin/places" className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-2xl bg-red-50 text-red-500 flex items-center justify-center text-2xl shadow-inner group-hover:scale-110 transition-transform">
                  ⚙️
                </div>
                <div>
                  <div className="text-sm font-black uppercase tracking-widest text-beige-text">Console Admin</div>
                  <div className="text-[10px] font-bold text-red-400 uppercase tracking-widest mt-1">Établissements & Analytics</div>
                </div>
              </div>
              <div className="w-10 h-10 rounded-full bg-beige-50 flex items-center justify-center text-beige-muted group-hover:bg-red-500 group-hover:text-white transition-all">
                <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><path d="m9 18 6-6-6-6" strokeLinecap="round" strokeLinejoin="round" /></svg>
              </div>
            </Link>
          </div>
        )}

        {/* MESSAGING - NEW ENTRY POINT */}
        <div className="bg-white rounded-[2.5rem] border-2 border-beige-200 p-8 shadow-xl shadow-black/5 group hover:border-abidjan-blue/30 transition-all">
           <Link href="/app/chat" className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                 <div className="w-14 h-14 rounded-2xl bg-abidjan-blue/10 text-abidjan-blue flex items-center justify-center text-2xl shadow-inner group-hover:scale-110 transition-transform">
                    ✉️
                 </div>
                 <div>
                    <div className="text-sm font-black uppercase tracking-widest text-beige-text">Ma Messagerie</div>
                    <div className="text-[10px] font-bold text-beige-muted uppercase tracking-widest mt-1">Discussions & Broadcasts</div>
                 </div>
              </div>
              <div className="w-10 h-10 rounded-full bg-beige-50 flex items-center justify-center text-beige-muted group-hover:bg-abidjan-blue group-hover:text-white transition-all">
                 <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                    <path d="m9 18 6-6-6-6" strokeLinecap="round" strokeLinejoin="round" />
                 </svg>
              </div>
           </Link>
        </div>

        {/* FAVORITES PREVIEW */}
        <div className="bg-white rounded-[2.5rem] border-2 border-beige-200 p-6 shadow-xl shadow-black/5">
           <div className="flex items-center justify-between mb-4 px-2">
             <div className="flex items-center gap-3">
               <span className="text-lg">⭐</span>
               <span className="text-[10px] font-black uppercase tracking-widest text-beige-text">Mes Favoris</span>
             </div>
             <Link href="/app/compte/favoris" className="text-[9px] font-black uppercase tracking-widest text-abidjan-blue hover:underline">Voir tout</Link>
           </div>

           <div className="space-y-2">
              {favorites?.map(f => (
                 <Link
                   key={f.id}
                   href={
                     f.kind === 'stop' && f.stop_id ? `/app/arret/${encodeURIComponent(f.stop_id)}`
                     : f.kind === 'place' && f.stop_id ? `/app/place/${encodeURIComponent(f.stop_id)}`
                     : f.kind === 'route' && f.route_id ? `/app/ligne/${encodeURIComponent(f.route_id)}`
                     : '/app'
                   }
                   className="flex items-center justify-between p-4 bg-beige-50 rounded-2xl border border-beige-100 hover:border-abidjan-orange/30 transition-all"
                 >
                    <span className="text-[11px] font-black text-beige-text">{f.label}</span>
                    <span className="text-[8px] font-black uppercase text-beige-muted border border-beige-200 px-2 py-0.5 rounded-full">
                      {f.kind === 'stop' ? 'Arrêt' : f.kind === 'place' ? 'Lieu' : 'Ligne'}
                    </span>
                 </Link>
              ))}
              {(!favorites || favorites.length === 0) && (
                 <div className="py-8 text-center text-[10px] font-bold text-beige-muted uppercase tracking-widest border-2 border-dashed border-beige-100 rounded-3xl">
                    Aucun favori enregistré
                 </div>
              )}
           </div>
        </div>

        {/* PROFILE & PREFERENCES - Bottom Grid */}
        <div className="grid md:grid-cols-2 gap-6 pb-20">
           <div className="bg-white rounded-[2.5rem] border-2 border-beige-200 p-8 shadow-xl shadow-black/5">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-xl bg-abidjan-orange/10 text-abidjan-orange flex items-center justify-center text-xl">✏️</div>
                <div className="text-[10px] uppercase tracking-widest text-beige-text font-black">Mon profil</div>
              </div>
              <ProfileEditor
                userId={user.id}
                initialName={displayName}
                initialEmoji={avatarEmoji}
                initialPhone={profile?.phone_number || ''}
                initialConsent={profile?.phone_marketing_consent}
                initialVisibility={profile?.is_public_visits}
                initialCommune={profile?.origin_commune || ''}
              />
           </div>

           <div className="bg-white rounded-[2.5rem] border-2 border-beige-200 p-8 shadow-xl shadow-black/5">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-xl bg-abidjan-green/10 text-abidjan-green flex items-center justify-center text-xl">⚙️</div>
                <div className="text-[10px] uppercase tracking-widest text-beige-text font-black">Préférences</div>
              </div>
              <PreferencesEditor 
                userId={user.id} 
                initialPreferences={profile?.preferred_transit_modes || []} 
              />
           </div>
        </div>

      </div>
    </div>
  );
}

