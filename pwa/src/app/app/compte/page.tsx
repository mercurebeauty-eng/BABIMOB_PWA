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
import PersonalHeatmap from './PersonalHeatmap';
import { Ic } from '@/components/ui/Ic';
import { Pill } from '@/components/ui/Pill';
import { WaxStrip } from '@/components/ui/WaxStrip';

const BADGE_META: Record<string, { label: string; emoji: string; color: string }> = {
  first_checkin:   { label: 'Premier pas',      emoji: '📍', color: 'var(--orange)' },
  explorer_5:      { label: 'Explorateur',       emoji: '🗺️', color: 'var(--green)' },
  pioneer_10:      { label: 'Pionnier',          emoji: '🚀', color: 'var(--blue)' },
  gbaka_master:    { label: 'Gbaka Master',      emoji: '🚐', color: 'var(--orange)' },
  commune_3:       { label: '3 Communes',        emoji: '🏙️', color: 'var(--gold)' },
  commune_5:       { label: '5 Communes',        emoji: '🌍', color: 'var(--green)' },
  points_500:      { label: '500 Points',        emoji: '⭐', color: 'var(--gold)' },
  verified:        { label: 'Vérifié',           emoji: '✅', color: 'var(--green)' },
};
const ALL_BADGE_KEYS = Object.keys(BADGE_META);

export default async function ComptePage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/app/auth/signin');

  const { data: profile } = await supabase
    .from('profiles').select('*').eq('id', user.id).maybeSingle();

  const { data: badges } = await supabase
    .from('user_badges').select('badge_key, awarded_at').eq('user_id', user.id);

  const { count: checkinCount } = await supabase
    .from('checkins').select('*', { count: 'exact', head: true }).eq('user_id', user.id);

  const { data: checkinsDetail } = await supabase
    .from('checkins')
    .select('id, created_at, place_name, commune, place_id, lat, lon, notes')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })
    .limit(300);
    .from('checkins').select('commune, place_name, lat, lon, created_at')
    .eq('user_id', user.id).order('created_at', { ascending: false }).limit(300);

  const communeFreq: Record<string, number> = {};
  checkinsDetail?.forEach((r) => {
    if (r.commune) communeFreq[r.commune] = (communeFreq[r.commune] ?? 0) + 1;
  });

  const { data: recentCheckins } = await supabase
    .from('checkins').select('id, place_name, commune, created_at, points_earned')
    .eq('user_id', user.id).order('created_at', { ascending: false }).limit(5);

  const prefs = profile?.preferred_transit_modes || ['Gbaka', 'Woro-woro', 'Taxi', 'Saloni'];

  const { data: favorites } = await supabase
    .from('user_favorites').select('id, label, stop_id, route_id, kind')
    .eq('user_id', user.id).order('created_at', { ascending: false }).limit(5);

  const total = checkinCount ?? 0;
  const totalPoints = profile?.total_points ?? 0;
  const levelScore = (total * 2) + Math.floor(totalPoints / 5);
  const level = levelScore >= 1000 ? 4 : levelScore >= 400 ? 3 : levelScore >= 100 ? 2 : 1;
  const levelNames = ['Novice', 'Explorateur', 'Guide Urbain', 'Maître d\'Abidjan'];
  const badgeName = levelNames[level - 1];
  const nextMilestone = level === 1 ? 100 : level === 2 ? 400 : level === 3 ? 1000 : 5000;
  const progress = Math.min((levelScore / nextMilestone) * 100, 100);

  // REACH metric — real impressions from reach_events (ticker + map + feed + broadcast)
  const { data: reachData } = await supabase.rpc('get_reach', { p_user_id: user.id, p_days: 30 });
  const reachVal: number = reachData ?? 0;
  const reachVal = (total * 125) + (totalPoints * 4);
  const reachStr = reachVal >= 1000 ? `${(reachVal / 1000).toFixed(1)}k` : reachVal.toString();

  const displayName = profile?.display_name ?? (user.email?.split('@')[0] ?? 'Explorateur');
  const initials = displayName.split(' ').map((w: string) => w[0]).join('').slice(0, 2).toUpperCase();
  const earnedKeys = new Set((badges ?? []).map(b => b.badge_key));

  function timeAgo(iso: string) {
    const mins = Math.round((Date.now() - new Date(iso).getTime()) / 60000);
    if (mins < 60) return `il y a ${mins} min`;
    if (mins < 1440) return `il y a ${Math.floor(mins / 60)} h`;
    return `il y a ${Math.floor(mins / 1440)} j`;
  }

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
        <span className="text-[10px] font-black uppercase tracking-[0.2em] text-beige-muted flex-1 text-center pr-8">MES PLANS TRIP</span>
        <SignOutButton />
      </div>
    <div style={{ minHeight: '100dvh', background: 'var(--cream)', color: 'var(--ink)', display: 'flex', flexDirection: 'column' }}>

      {/* HERO */}
      <div style={{ background: 'var(--ink)', color: 'var(--cream)', position: 'relative', overflow: 'hidden', paddingTop: 'max(56px, env(safe-area-inset-top, 0px) + 16px)', paddingBottom: 28, paddingLeft: 20, paddingRight: 20 }}>
        <div className="wax-bg" style={{ position: 'absolute', inset: 0, color: 'var(--orange)', opacity: 0.12, pointerEvents: 'none' }} />
        <div style={{ position: 'relative', zIndex: 2 }}>
          {/* Nav */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
            <Link href="/app" style={{ width: 40, height: 40, borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--cream)', background: 'rgba(255,255,255,0.1)', textDecoration: 'none' }}>
              <Ic.Back s={20} />
            </Link>
            <SignOutButton />
          </div>

          {/* Avatar */}
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center' }}>
            <div style={{ position: 'relative', marginBottom: 12 }}>
              <div style={{ width: 76, height: 76, borderRadius: 22, background: 'var(--orange)', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 8px 24px rgba(242,108,26,0.45)', fontSize: profile?.avatar_emoji ? 38 : 28, fontWeight: 800, color: '#fff', border: '3px solid rgba(255,255,255,0.1)' }}>
                {profile?.avatar_emoji ?? initials}
              </div>
              <div style={{ position: 'absolute', bottom: -8, left: '50%', transform: 'translateX(-50%)', background: 'var(--gold)', color: 'var(--ink)', padding: '2px 10px', borderRadius: 999, fontSize: 10, fontWeight: 900, textTransform: 'uppercase', letterSpacing: 0.5, whiteSpace: 'nowrap', border: '2px solid var(--ink)' }}>
                NIV.{level}
              </div>
            </div>
            <h1 className="font-display" style={{ fontSize: 26, color: '#fff', marginTop: 16, marginBottom: 4 }}>{displayName}</h1>
            <p style={{ fontSize: 12, color: 'rgba(247,241,230,0.55)', fontWeight: 600, letterSpacing: 0.4, textTransform: 'uppercase', marginBottom: 18 }}>
              @{displayName.toLowerCase().replace(/\s/g, '_')} · {badgeName}
            </p>

            {/* Stats row */}
            <div style={{ display: 'flex', gap: 10, width: '100%', maxWidth: 360, justifyContent: 'center' }}>
              {[
                { v: total.toString(), l: 'Check-ins' },
                { v: Object.keys(communeFreq).length.toString(), l: 'Communes' },
                { v: (badges?.length ?? 0).toString(), l: 'Badges' },
                { v: totalPoints.toLocaleString(), l: 'Points' },
              ].map(s => (
                <div key={s.l} style={{ flex: 1, padding: '10px 4px', borderRadius: 12, background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.10)', textAlign: 'center' }}>
                  <div className="font-display" style={{ fontSize: 18, color: '#fff', lineHeight: 1 }}>{s.v}</div>
                  <div style={{ fontSize: 9, fontWeight: 700, color: 'rgba(255,255,255,0.45)', textTransform: 'uppercase', letterSpacing: 0.4, marginTop: 3 }}>{s.l}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

        {/* STATS STRIP */}
        <div className="grid grid-cols-2 gap-4">
           <div className="bg-white rounded-[2.5rem] border-2 border-beige-200 p-6 flex flex-col items-center shadow-xl shadow-black/5 relative group">
              <div className="text-xl mb-1 mt-1">🏆</div>
              <div className="text-2xl font-black text-beige-text">{badges?.length || 0}</div>
              <div className="text-[10px] uppercase font-bold tracking-widest text-beige-muted">Badges</div>
              {(badges?.length ?? 0) === 0 && (
                <div className="absolute inset-x-3 bottom-2 text-[8px] text-beige-muted text-center font-medium uppercase tracking-wide opacity-70">
                  Check-in pour débloquer
                </div>
              )}
           </div>
           <div className="bg-white rounded-[2.5rem] border-2 border-beige-200 p-6 flex flex-col items-center shadow-xl shadow-black/5 relative group">
              <div className="text-xl mb-1 mt-1">📡</div>
              <div className="text-2xl font-black text-beige-text">{reachStr}</div>
              <div className="text-[10px] uppercase font-bold tracking-widest text-beige-muted">Reach</div>
              <div className="absolute inset-x-3 bottom-2 text-[8px] text-beige-muted text-center font-medium uppercase tracking-wide opacity-70">
                Vues réelles · 30j
              </div>
           </div>
        </div>
      <WaxStrip color="var(--orange)" height={6} />

      {/* CONTENT */}
      <div className="no-scrollbar" style={{ flex: 1, overflowY: 'auto', padding: '20px 16px 100px', display: 'flex', flexDirection: 'column', gap: 16 }}>

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
                 <span className="text-[9px] font-semibold uppercase text-abidjan-green tracking-widest">Live Area</span>
              </div>
           </div>
           <div className="h-48 bg-beige-50">
              <PersonalHeatmap data={checkinsDetail?.filter(c => c.lat && c.lon).map(c => ({ lat: c.lat!, lon: c.lon! })) ?? []} />
           </div>
           <div className="p-5 text-center bg-beige-50/50">
              <p className="text-[11px] text-beige-muted font-medium italic">
                 Le plus actif à <span className="font-bold text-beige-text">{topCommunes[0] || 'Abidjan'}</span> cette semaine
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
        {/* Progress to verified */}
        {!profile?.is_verified_explorer && (
          <div style={{ padding: 18, borderRadius: 18, background: 'var(--cream-2)', border: '1.5px dashed var(--orange)', position: 'relative', overflow: 'hidden' }}>
            <div style={{ fontSize: 11, fontWeight: 800, color: 'var(--orange)', letterSpacing: 0.6, textTransform: 'uppercase', marginBottom: 12 }}>Objectif : Explorateur Vérifié</div>
            {[
              { label: '20 Check-ins', current: total, target: 20 },
              { label: '5 Communes', current: Object.keys(communeFreq).length, target: 5 },
              { label: '500 Points', current: totalPoints, target: 500 },
            ].map((g, i) => {
              const pct = Math.min((g.current / g.target) * 100, 100);
              const done = pct >= 100;
              return (
                <div key={i} style={{ marginBottom: i < 2 ? 10 : 0 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 5, fontSize: 12 }}>
                    <span style={{ fontWeight: 700, color: done ? 'var(--green)' : 'var(--ink)' }}>{g.label} {done ? '✓' : ''}</span>
                    <span style={{ color: 'var(--muted)', fontWeight: 600 }}>{g.current}/{g.target}</span>
                  </div>
                  <div style={{ height: 5, borderRadius: 3, background: 'var(--line)', overflow: 'hidden' }}>
                    <div style={{ height: '100%', width: `${pct}%`, background: done ? 'var(--green)' : 'var(--orange)', borderRadius: 3, transition: 'width 0.8s ease' }} />
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Territoire */}
        <div style={{ borderRadius: 18, background: 'var(--cream-2)', border: '1px solid var(--line)', overflow: 'hidden' }}>
          <div style={{ padding: '14px 16px', borderBottom: '1px solid var(--line)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div>
              <Pill color="var(--green)">TERRITOIRE</Pill>
            </div>
            <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--muted)' }}>{Object.keys(communeFreq).length} communes</span>
          </div>
          <div style={{ height: 180, position: 'relative' }}>
            <PersonalHeatmap checkins={checkinsDetail ?? []} />
          </div>
          {Object.keys(communeFreq).length > 0 && (
            <div style={{ padding: '10px 16px 14px' }}>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                {Object.entries(communeFreq).sort((a, b) => b[1] - a[1]).slice(0, 5).map(([commune, count]) => (
                  <div key={commune} style={{ padding: '4px 10px', borderRadius: 999, background: 'color-mix(in oklab, var(--orange) 10%, transparent)', fontSize: 12, fontWeight: 700, color: 'var(--ink)' }}>
                    {commune} <span style={{ color: 'var(--muted)', fontWeight: 500 }}>({count})</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Badges */}
        <div style={{ borderRadius: 18, background: 'var(--cream-2)', border: '1px solid var(--line)' }}>
          <div style={{ padding: '14px 16px', borderBottom: '1px solid var(--line)' }}>
            <Pill color="var(--gold)">BADGES</Pill>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10, padding: 14 }}>
            {ALL_BADGE_KEYS.map(key => {
              const meta = BADGE_META[key];
              const earned = earnedKeys.has(key);
              return (
                <div key={key} style={{ padding: 12, borderRadius: 14, background: earned ? 'var(--cream)' : 'transparent', border: earned ? `1.5px solid color-mix(in oklab, ${meta.color} 30%, transparent)` : '1.5px dashed var(--line)', textAlign: 'center', opacity: earned ? 1 : 0.45 }}>
                  <div style={{ fontSize: 26, marginBottom: 6 }}>{meta.emoji}</div>
                  <div style={{ fontSize: 10, fontWeight: 800, color: earned ? meta.color : 'var(--muted)', textTransform: 'uppercase', letterSpacing: 0.4 }}>{meta.label}</div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Recent activity */}
        {recentCheckins && recentCheckins.length > 0 && (
          <div style={{ borderRadius: 18, background: 'var(--cream-2)', border: '1px solid var(--line)' }}>
            <div style={{ padding: '14px 16px', borderBottom: '1px solid var(--line)' }}>
              <Pill color="var(--blue)">ACTIVITÉ RÉCENTE</Pill>
            </div>
            <div style={{ padding: '8px 0' }}>
              {recentCheckins.map((c, i) => (
                <div key={c.id} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 16px', borderBottom: i < recentCheckins.length - 1 ? '1px solid var(--line)' : 'none' }}>
                  <div style={{ width: 36, height: 36, borderRadius: 10, background: 'color-mix(in oklab, var(--orange) 12%, transparent)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--orange)', flexShrink: 0 }}>
                    <Ic.Pin s={18} />
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--ink)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{c.place_name}</div>
                    {c.commune && <div style={{ fontSize: 11, color: 'var(--muted)', marginTop: 1 }}>{c.commune}</div>}
                  </div>
                  <div style={{ textAlign: 'right', flexShrink: 0 }}>
                    {c.points_earned > 0 && <div style={{ fontSize: 12, fontWeight: 800, color: 'var(--gold)' }}>+{c.points_earned}pts</div>}
                    <div style={{ fontSize: 10, color: 'var(--muted)', fontWeight: 600 }}>{timeAgo(c.created_at)}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Profile editor */}
        <div style={{ borderRadius: 18, background: 'var(--cream-2)', border: '1px solid var(--line)', overflow: 'hidden' }}>
          <div style={{ padding: '14px 16px', borderBottom: '1px solid var(--line)' }}>
            <Pill color="var(--muted)">PARAMÈTRES</Pill>
          </div>
          <div style={{ padding: 16, display: 'flex', flexDirection: 'column', gap: 12 }}>
            <ProfileEditor
              userId={user.id}
              initialName={displayName}
              initialEmoji={profile?.avatar_emoji ?? '🧭'}
              initialPhone={profile?.phone ?? undefined}
              initialConsent={profile?.data_consent ?? false}
              initialVisibility={profile?.is_public_visits ?? true}
            />
            <PreferencesEditor
              userId={user.id}
              initialPreferences={prefs}
            />
          </div>
        </div>

        {/* Sign out */}
        <div style={{ display: 'flex', justifyContent: 'center', paddingTop: 8 }}>
          <SignOutButton />
        </div>
      </div>
    </div>
  );
}
