import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import SignOutButton from './SignOutButton';
import ProfileEditor from './ProfileEditor';
import PreferencesEditor from './PreferencesEditor';
import PersonalHeatmap from '@/components/PersonalHeatmap';
import ProfileSocialTabs from '@/components/ProfileSocialTabs';
import ExplorerGoals from './ExplorerGoals';

export default async function ComptePage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/app/auth/signin');

  const { data: profile } = await supabase.from('profiles').select('*').eq('id', user.id).maybeSingle();
  const { data: badges } = await supabase.from('user_badges').select('badge_key, awarded_at').eq('user_id', user.id);
  const { data: following } = await supabase.from('follows').select('id, profiles:following_id(id, display_name, avatar_emoji, is_verified_explorer)').eq('follower_id', user.id);
  const { count: checkinCount } = await supabase.from('checkins').select('*', { count: 'exact', head: true }).eq('user_id', user.id);

  const { data: checkinsDetail } = await supabase.from('checkins').select('id, created_at, place_name, commune, place_id, lat, lon, notes').eq('user_id', user.id).order('created_at', { ascending: false }).limit(300);

  const communeFreq: Record<string, number> = {};
  checkinsDetail?.forEach((r) => { if (r.commune) communeFreq[r.commune] = (communeFreq[r.commune] ?? 0) + 1; });
  const topCommunes = Object.entries(communeFreq).sort((a, b) => b[1] - a[1]).slice(0, 3).map(([c]) => c);
  
  const total = checkinCount ?? 0;
  const totalPoints = profile?.total_points ?? 0;
  const levelScore = (total * 2) + Math.floor(totalPoints / 5);
  const level = levelScore >= 1000 ? 4 : levelScore >= 400 ? 3 : levelScore >= 100 ? 2 : 1;
  const levelNames = ['Novice', 'Explorateur Émergent', 'Guide Urbain', 'Maître d\'Abidjan'];
  const badgeName = levelNames[level - 1];
  const nextMilestone = level === 1 ? 100 : level === 2 ? 400 : level === 3 ? 1000 : 5000;
  const progress = Math.min((levelScore / nextMilestone) * 100, 100);

  const { data: reachData } = await supabase.rpc('get_reach', { p_user_id: user.id, p_days: 30 });
  const reachVal: number = reachData ?? 0;
  const reachStr = reachVal >= 1000 ? `${(reachVal / 1000).toFixed(1)}k` : reachVal.toString();

  const displayName = profile?.display_name ?? (user.email?.split('@')[0] ?? 'Explorateur');
  const avatarEmoji = profile?.avatar_emoji ?? '🧭';

  const { data: favorites } = await supabase.from('user_favorites').select('id, label, stop_id, route_id, kind').eq('user_id', user.id).order('created_at', { ascending: false }).limit(5);

  return (
    <div className="flex-1 flex flex-col overflow-y-auto relative bg-bm-obsidian text-white font-sans">
      
      {/* Dynamic Header Background */}
      <div className="absolute top-0 inset-x-0 h-80 bg-gradient-to-b from-bm-orange/20 to-transparent pointer-events-none" />

      {/* Top Nav (Glass) */}
      <div className="sticky top-0 z-[100] bg-bm-obsidian/60 backdrop-blur-3xl border-b border-white/5 px-6 py-4 flex items-center justify-between">
        <Link href="/app" className="bm-fab w-10 h-10 border-white/10" aria-label="Retour">
          <svg className="w-5 h-5 flex-shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><path d="m15 18-6-6 6-6" strokeLinecap="round" strokeLinejoin="round" /></svg>
        </Link>
        <span className="text-[11px] font-black uppercase tracking-[0.3em] text-white/40 italic">Profil Premium</span>
        <SignOutButton />
      </div>

      <div className="max-w-2xl mx-auto w-full px-6 py-10 space-y-12 relative z-10">
        
        {/* HEADER SECTION */}
        <section className="flex flex-col items-center">
           <div className="relative mb-6 group">
              <div className="w-32 h-32 rounded-full bg-gradient-to-tr from-bm-orange to-bm-blue p-1 shadow-2xl relative z-10 animate-phone-float">
                 <div className="w-full h-full rounded-full bg-bm-obsidian flex items-center justify-center text-6xl">
                   {avatarEmoji}
                 </div>
              </div>
              <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 z-20 bg-bm-orange text-white px-5 py-1.5 rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] shadow-[0_10px_30px_rgba(255,107,0,0.5)] border-2 border-bm-obsidian">
                Level {level}
              </div>
              {/* Pulse effect */}
              <div className="absolute inset-x-0 inset-y-0 rounded-full bg-bm-orange animate-ping opacity-10"></div>
           </div>
           
           <h1 className="text-4xl font-black italic uppercase tracking-tighter text-white mb-2">{displayName}</h1>
           <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/5 border border-white/10 text-[10px] font-black uppercase tracking-widest text-white/60 italic">
              {badgeName}
           </div>
        </section>

        {/* PROGRESS BAR */}
        <section className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-[2.5rem] p-8 shadow-2xl">
           <div className="flex justify-between items-end mb-4">
              <div className="text-[10px] font-black uppercase tracking-widest text-white/40 italic">Progression XP</div>
              <div className="text-xl font-black italic">{levelScore} <span className="text-xs text-white/40">/ {nextMilestone} PT</span></div>
           </div>
           <div className="w-full h-4 bg-white/5 rounded-full overflow-hidden p-1 border border-white/5">
              <div 
                 className="h-full bg-gradient-to-r from-bm-orange via-bm-orange to-white rounded-full transition-all duration-1000 shadow-[0_0_15px_rgba(255,107,0,0.4)]"
                 style={{ width: `${progress}%` }}
              />
           </div>
        </section>

        {/* MAIN STATS GRID */}
        <section className="grid grid-cols-2 gap-6">
           {[
             { label: 'Visites', val: total, color: 'text-bm-orange', icon: '📍', sub: 'Total check-ins' },
             { label: 'Radiance', val: reachStr, color: 'text-bm-green', icon: '📡', sub: 'Influence 30j' },
             { label: 'Badges', val: badges?.length || 0, color: 'text-purple-400', icon: '🏅', sub: 'Succès urbains' },
             { label: 'Communes', val: Object.keys(communeFreq).length, color: 'text-blue-400', icon: '🗺️', sub: 'Territoires' },
           ].map((stat, i) => (
              <div key={i} className="bg-white/5 border border-white/10 rounded-[3rem] p-8 flex flex-col items-center text-center shadow-xl hover:border-white/20 transition-all">
                 <div className="text-3xl mb-4">{stat.icon}</div>
                 <div className={`text-4xl font-black italic tracking-tighter ${stat.color} mb-1`}>{stat.val}</div>
                 <div className="text-[10px] font-black uppercase tracking-widest text-white italic mb-1">{stat.label}</div>
                 <div className="text-[8px] font-bold text-white/30 uppercase tracking-widest leading-tight">{stat.sub}</div>
              </div>
           ))}
        </section>

        {/* ROAD TO VERIFIED EXPLORER */}
        {!profile?.is_verified_explorer && (
          <section className="bg-gradient-to-br from-bm-orange to-bm-orange/20 rounded-[3rem] p-1 shadow-2xl">
             <div className="bg-bm-obsidian rounded-[2.9rem] p-8 relative overflow-hidden group">
                <div className="absolute top-0 right-0 p-10 opacity-5 group-hover:scale-150 transition-transform">
                   <span className="text-9xl font-black italic">ELITE</span>
                </div>
                <div className="relative z-10 space-y-8">
                   <div>
                      <h3 className="text-xl font-black italic uppercase italic text-bm-orange mb-2">Devenir Explorateur Vérifié</h3>
                      <p className="text-xs font-medium text-white/40 leading-relaxed max-w-sm uppercase tracking-wider">Débloque le Live Feed temps-réel et les avantages Premium à Abidjan.</p>
                   </div>
                   <ExplorerGoals
                      goals={[
                        { label: "20 Check-ins", current: total, target: 20, emoji: "📍" },
                        { label: "5 Communes", current: Object.keys(communeFreq).length, target: 5, emoji: "🗺️" },
                        { label: "500 Points", current: totalPoints, target: 500, emoji: "⭐" },
                      ]}
                      remainingPoints={Math.max(500 - totalPoints, 0)}
                   />
                </div>
             </div>
          </section>
        )}

        {/* PERSONAL HEATMAP */}
        <section className="bg-white/5 border border-white/10 rounded-[3rem] overflow-hidden shadow-2xl">
           <div className="p-8 flex items-center justify-between border-b border-white/5">
              <div className="flex items-center gap-4">
                 <div className="w-10 h-10 rounded-2xl bg-bm-green/20 text-bm-green flex items-center justify-center text-2xl shadow-inner">🌍</div>
                 <div>
                    <h3 className="text-[11px] font-black uppercase tracking-widest italic">Territoire Explorer</h3>
                    <div className="text-[9px] font-bold text-white/30 uppercase tracking-[0.2em] mt-1 italic">Dernières 24h</div>
                 </div>
              </div>
              <div className="px-4 py-1.5 rounded-full bg-bm-green/10 border border-bm-green/30 text-[9px] font-black uppercase text-bm-green tracking-widest animate-pulse">Live Tracking</div>
           </div>
           <div className="h-64 bg-bm-black flex items-center justify-center relative">
              <PersonalHeatmap data={checkinsDetail?.filter(c => c.lat && c.lon).map(c => ({ lat: c.lat!, lon: c.lon! })) ?? []} />
           </div>
           <div className="p-6 bg-white/5 text-center">
              <p className="text-xs font-medium text-white/40 italic">
                 Tu as été le plus actif à <span className="font-black text-bm-orange uppercase tracking-wider">{topCommunes[0] || 'Abidjan'}</span> récemment.
              </p>
           </div>
        </section>

        {/* SOCIAL TABS (Feed & Following) */}
        <section>
           <ProfileSocialTabs
             userId={user.id}
             initialVisits={(checkinsDetail as any[]) || []}
             initialFollowing={(following as any[]) || []}
             heatmapData={checkinsDetail?.filter(c => c.lat && c.lon).map(c => ({ lat: c.lat!, lon: c.lon! })) ?? []}
             currentTier={profile?.sub_tier || 'free'}
           />
        </section>

        {/* MESSAGING & FAVS */}
        <section className="grid md:grid-cols-2 gap-6 pb-32">
           <Link href="/app/chat" className="group p-8 rounded-[3rem] bg-white/5 border border-white/10 hover:border-bm-orange/30 transition-all flex flex-col justify-between h-52 shadow-xl">
              <div className="w-14 h-14 rounded-2xl bg-bm-orange/20 flex items-center justify-center text-3xl group-hover:scale-110 transition-transform shadow-inner">✉️</div>
              <div>
                 <div className="text-xl font-black italic uppercase tracking-tighter">Messages</div>
                 <div className="text-[10px] font-black uppercase text-white/30 tracking-widest">Broadcasts reçus</div>
              </div>
           </Link>

           <div className="p-8 rounded-[3rem] bg-white/5 border border-white/10 flex flex-col h-52 shadow-xl">
              <div className="flex justify-between items-center mb-6">
                 <div className="text-[11px] font-black uppercase tracking-widest text-bm-orange italic">Favoris</div>
                 <Link href="/app/compte/favoris" className="text-[9px] font-black uppercase tracking-widest text-white/40 hover:text-white">Tout voir</Link>
              </div>
              <div className="space-y-3 overflow-y-auto pr-2">
                 {favorites?.slice(0, 3).map(f => (
                    <Link key={f.id} href="/app" className="flex items-center justify-between p-3 rounded-2xl bg-white/5 border border-white/5 hover:border-bm-orange/40 transition-colors">
                       <span className="text-[10px] font-black truncate max-w-[120px]">{f.label}</span>
                       <span className="text-[8px] font-bold text-white/20 uppercase tracking-[0.2em]">{f.kind}</span>
                    </Link>
                 ))}
                 {(!favorites || favorites.length === 0) && <div className="text-center py-6 text-[10px] font-black uppercase text-white/10">Vide</div>}
              </div>
           </div>
        </section>

        {/* EDITORS - Bottom Group */}
        <section className="grid lg:grid-cols-2 gap-6 pb-20">
           <div className="bg-bm-obsidian/40 backdrop-blur-3xl border border-white/10 p-8 rounded-[3rem] shadow-2xl">
              <h3 className="text-sm font-black uppercase tracking-widest mb-8 border-b border-white/5 pb-4 italic">🔧 Modifier le profil</h3>
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
           <div className="bg-bm-obsidian/40 backdrop-blur-3xl border border-white/10 p-8 rounded-[3rem] shadow-2xl">
              <h3 className="text-sm font-black uppercase tracking-widest mb-8 border-b border-white/5 pb-4 italic">⚙️ Préférences</h3>
              <PreferencesEditor userId={user.id} initialPreferences={profile?.preferred_transit_modes || []} />
           </div>
        </section>

      </div>
    </div>
  );
}
