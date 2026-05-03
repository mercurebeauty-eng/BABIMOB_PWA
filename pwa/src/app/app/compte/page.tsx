import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import SignOutButton from './SignOutButton';
import ProfileEditor from './ProfileEditor';
import PreferencesEditor from './PreferencesEditor';
import CompteClient from './CompteClient';

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
    .select('id, created_at, place_name, commune, lat, lon')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })
    .limit(300);

  const { data: topExplorers } = await supabase
    .from('profiles')
    .select('id, display_name, avatar_emoji, total_points')
    .order('total_points', { ascending: false })
    .limit(10);

  const startOfToday = new Date();
  startOfToday.setHours(0,0,0,0);
  const todayStr = startOfToday.toISOString();

  const [{ count: todayCheckins }, { count: todayPosts }, { count: todayTarifs }] = await Promise.all([
    supabase.from('checkins').select('*', { count: 'exact', head: true }).eq('user_id', user.id).gte('created_at', todayStr),
    supabase.from('gbairai_posts').select('*', { count: 'exact', head: true }).eq('user_id', user.id).gte('created_at', todayStr),
    supabase.from('tarif_confirmations').select('*', { count: 'exact', head: true }).eq('user_id', user.id).gte('created_at', todayStr)
  ]);

  const dailyMissions = [
    { id: 'm1', label: 'Explorateur', task: 'Faire un check-in', current: todayCheckins || 0, target: 1, xp: 20 },
    { id: 'm2', label: 'Bavard', task: 'Poster sur Gbairai', current: todayPosts || 0, target: 1, xp: 30 },
    { id: 'm3', label: 'Contributeur', task: 'Confirmer un tarif', current: todayTarifs || 0, target: 1, xp: 25 },
  ];

  const displayName = profile?.display_name ?? (user.email?.split('@')[0] ?? 'Explorateur');
  const avatarEmoji = profile?.avatar_emoji || '👤';
  const prefs = profile?.preferred_transit_modes || ['Gbaka', 'Woro-woro', 'Taxi', 'Saloni'];
  const commune = profile?.origin_commune || '';

  return (
    <CompteClient
      displayName={displayName}
      avatarEmoji={avatarEmoji}
      totalPoints={profile?.total_points ?? 0}
      checkinCount={checkinCount ?? 0}
      badges={badges ?? []}
      checkinsDetail={checkinsDetail ?? []}
      commune={commune}
      topExplorers={topExplorers ?? []}
      dailyMissions={dailyMissions}
    >
      <ProfileEditor
        userId={user.id}
        initialName={displayName}
        initialEmoji={avatarEmoji}
        initialPhone={profile?.phone_number || ''}
        initialConsent={profile?.phone_marketing_consent}
        initialVisibility={profile?.is_public_visits}
        initialCommune={commune}
      />
      <PreferencesEditor userId={user.id} initialPreferences={prefs} />
      <div style={{ marginTop: 24, display: 'flex', justifyContent: 'center' }}>
        <SignOutButton />
      </div>
    </CompteClient>
  );
}
