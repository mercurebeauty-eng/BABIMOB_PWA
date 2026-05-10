import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import VoiceRoomPageClient from './VoiceRoomPageClient';

export default async function VoiceRoomPage({ params }: { params: { id: string } }) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/auth');

  const { data: profile } = await supabase
    .from('profiles')
    .select('display_name, avatar_emoji')
    .eq('id', user.id)
    .single();

  return (
    <VoiceRoomPageClient
      roomId={params.id}
      userId={user.id}
      displayName={profile?.display_name ?? 'Explorateur'}
      avatarEmoji={profile?.avatar_emoji ?? '🧭'}
    />
  );
}
