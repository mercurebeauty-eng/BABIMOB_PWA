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
