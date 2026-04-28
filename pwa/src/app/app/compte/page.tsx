import { createClient } from '@/lib/supabase/server';
export const dynamic = 'force-dynamic';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import SignOutButton from './SignOutButton';
import ProfileEditor from './ProfileEditor';
import PreferencesEditor from './PreferencesEditor';
import PersonalHeatmap from '@/components/PersonalHeatmap';
import BeigeMapBackground from '@/components/BeigeMapBackground';
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

  const total = checkinCount ?? 0;
  const totalPoints = profile?.total_points ?? 0;
  const levelScore = (total * 2) + Math.floor(totalPoints / 5);
  const level = levelScore >= 1000 ? 4 : levelScore >= 400 ? 3 : levelScore >= 100 ? 2 : 1;
  const displayName = profile?.display_name ?? (user.email?.split('@')[0] ?? 'Explorateur');
  const avatarEmoji = profile?.avatar_emoji || '👤';
  const prefs = profile?.preferred_transit_modes || ['Gbaka', 'Woro-woro', 'Taxi', 'Saloni'];

  return (
    <div style={{ minHeight: '100dvh', background: 'var(--cream)', color: 'var(--ink)', display: 'flex', flexDirection: 'column' }}>

      {/* Header — wax pattern */}
      <div style={{ position: 'relative', paddingTop: 56, paddingBottom: 24, background: 'linear-gradient(180deg, var(--ink) 0%, var(--ink-2) 100%)', color: 'var(--cream)', overflow: 'hidden' }}>
        <div className="wax-bg" style={{ position: 'absolute', inset: 0, color: 'var(--orange)', opacity: 0.18 }} />
        <div style={{ position: 'relative', zIndex: 2, padding: '0 16px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16 }}>
            <Link href="/app" style={{ width: 40, height: 40, borderRadius: 12, border: 'none', background: 'rgba(255,255,255,0.1)', color: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Ic.Back s={20} />
            </Link>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
            <div style={{ width: 80, height: 80, borderRadius: '50%', background: 'var(--orange)', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '3px solid #fff', boxShadow: '0 8px 24px rgba(242,108,26,0.4)', position: 'relative', fontSize: 32 }}>
              {avatarEmoji}
            </div>
            <div style={{ flex: 1 }}>
              <div className="font-display" style={{ fontSize: 26, lineHeight: 1 }}>{displayName}</div>
              <div style={{ marginTop: 6 }}>
                <Pill color="var(--orange)" size="sm">LEVEL {level + 10} · LEGEND</Pill>
              </div>
            </div>
          </div>
          {/* Stats */}
          <div style={{ display: 'flex', gap: 8, marginTop: 18 }}>
            {[
              { v: total.toString(), l: 'Trajets' },
              { v: (badges?.length ?? 0).toString(), l: 'Badges' },
              { v: totalPoints.toLocaleString(), l: 'Points' },
            ].map((s, i) => (
              <div key={i} style={{ flex: 1, padding: '10px 8px', borderRadius: 12, background: 'rgba(255,255,255,0.08)', textAlign: 'center', border: '1px solid rgba(255,255,255,0.1)' }}>
                <div className="font-display" style={{ fontSize: 18, color: '#fff' }}>{s.v}</div>
                <div style={{ fontSize: 9, color: 'rgba(247,241,230,0.6)', textTransform: 'uppercase', letterSpacing: 0.5, marginTop: 2 }}>{s.l}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
      <WaxStrip color="var(--orange)" height={6} />

      <div className="no-scrollbar" style={{ flex: 1, overflowY: 'auto', padding: '20px 16px 100px' }}>
        <div style={{ borderRadius: 24, overflow: 'hidden', background: 'var(--cream-2)', border: '1px solid var(--line)', marginBottom: 20, position: 'relative', boxShadow: '0 8px 24px rgba(0,0,0,0.05)' }}>
          <div className="wax-bg" style={{ position: 'absolute', inset: 0, opacity: 0.05 }} />
          <div style={{ padding: '16px 20px', position: 'relative' }}>
            <div style={{ fontSize: 11, fontWeight: 900, color: 'var(--muted)', letterSpacing: 1 }}>TON TERRITOIRE</div>
          </div>
          <div style={{ height: 160, background: 'var(--cream)', position: 'relative' }}>
             <PersonalHeatmap data={checkinsDetail?.filter(c => c.lat && c.lon).map(c => ({ lat: c.lat!, lon: c.lon! })) ?? []} />
          </div>
          <div style={{ padding: '12px 20px', fontSize: 13, fontWeight: 700, color: 'var(--ink-2)', borderTop: '1px solid var(--line)' }}>
            Tu occupes 14% de {profile?.origin_commune || 'Cocody'}
          </div>
        </div>

        {/* Badges */}
        <h3 className="font-display" style={{ fontSize: 18, margin: '0 0 16px' }}>Badges</h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 8, marginBottom: 24 }}>
          {Object.entries(BADGE_META).map(([key, meta], i) => {
             const earned = (badges ?? []).some(b => b.badge_key === key);
             return (
              <div key={i} className="press" style={{
                padding: '12px 8px', borderRadius: 16, textAlign: 'center',
                background: earned ? 'var(--cream-2)' : 'transparent',
                border: earned ? `1.5px solid ${meta.color}` : '1.5px dashed var(--line)',
                opacity: earned ? 1 : 0.4,
                position: 'relative'
              }}>
                <div style={{ width: 44, height: 44, margin: '0 auto 6px', borderRadius: 12, background: earned ? `color-mix(in oklab, ${meta.color} 15%, transparent)` : 'var(--line)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: meta.color }}>
                  {meta.emoji}
                </div>
                <div style={{ fontSize: 9, fontWeight: 800, color: 'var(--ink)', textTransform: 'uppercase', letterSpacing: 0.4 }}>{meta.label.split(' ')[0]}</div>
              </div>
            );
          })}
        </div>

        {/* Activity */}
        <h3 className="font-display" style={{ fontSize: 18, margin: '0 0 12px' }}>Activité</h3>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {checkinsDetail?.slice(0, 5).map((a, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: 12, borderRadius: 14, background: 'var(--cream-2)', border: '1px solid var(--line)', position: 'relative' }}>
              <div className="wax-bg" style={{ position: 'absolute', inset: 0, opacity: 0.03, borderRadius: 14 }} />
              <div style={{ width: 36, height: 36, borderRadius: 10, background: 'color-mix(in oklab, var(--orange) 15%, transparent)', color: 'var(--orange)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                📍
              </div>
              <div style={{ flex: 1, zIndex: 1 }}>
                <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--ink)' }}>{a.place_name}</div>
                <div style={{ fontSize: 11, color: 'var(--muted)' }}>{a.commune}</div>
              </div>
            </div>
          ))}
        </div>
        
        <div className="grid md:grid-cols-2 gap-6 mt-8">
           <ProfileEditor
                userId={user.id}
                initialName={displayName}
                initialEmoji={avatarEmoji}
                initialPhone={profile?.phone_number || ''}
                initialConsent={profile?.phone_marketing_consent}
                initialVisibility={profile?.is_public_visits}
                initialCommune={profile?.origin_commune || ''}
              />
           
           <div className="bg-white rounded-[2.5rem] border-2 border-beige-200 p-8 shadow-xl shadow-black/5">
              <div className="flex items-center gap-3 mb-6">
                 <div className="w-10 h-10 rounded-xl bg-beige-100 text-beige-muted flex items-center justify-center text-xl">⚙️</div>
                 <div className="text-[10px] uppercase tracking-widest text-beige-text font-black">Paramètres</div>
              </div>
              <PreferencesEditor userId={user.id} initialPreferences={prefs} />
              
              <div className="mt-8 pt-8 border-t-2 border-dashed border-beige-100 flex justify-center">
                 <SignOutButton />
              </div>
           </div>
        </div>
      </div>
    </div>
  );
}
