import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import SignOutButton from './SignOutButton';
import ProfileEditor from './ProfileEditor';
import PreferencesEditor from './PreferencesEditor';
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

      <WaxStrip color="var(--orange)" height={6} />

      {/* CONTENT */}
      <div className="no-scrollbar" style={{ flex: 1, overflowY: 'auto', padding: '20px 16px 100px', display: 'flex', flexDirection: 'column', gap: 16 }}>

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
