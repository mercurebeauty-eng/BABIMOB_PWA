'use client';

import React from 'react';
import VoiceRoomUI from '@/components/voice/VoiceRoomUI';
import { useRouter } from 'next/navigation';

export default function VoiceTestPage() {
  const router = useRouter();

  const mockRoom = {
    id: 'test', title: 'Débrief Match de hier au Plateau ⚽', emoji: '⚽',
    creator_id: '1', participants_count: 9, is_live: true, is_private: false,
    room_mode: 'classic' as const, upvote_threshold: 10, max_speak_secs: 120,
    topic: 'Sport', created_at: new Date().toISOString()
  };

  const mockParticipants = [
    { id: '1', user_id: 'u1', room_id: 'test', display_name: 'Zokora', avatar_emoji: '🦁', is_speaking: true, is_muted: false, role: 'host' as const, speak_time_secs: 45, joined_at: new Date().toISOString(), upvote_score: 50, invited_by: null },
    { id: '2', user_id: 'u2', room_id: 'test', display_name: 'Awa', avatar_emoji: '💃', is_speaking: false, is_muted: true, role: 'speaker' as const, speak_time_secs: 12, joined_at: new Date().toISOString(), upvote_score: 10, invited_by: 'u1' },
    { id: '3', user_id: 'u3', room_id: 'test', display_name: 'Bakayoko', avatar_emoji: '⚽', is_speaking: true, is_muted: false, role: 'speaker' as const, speak_time_secs: 89, joined_at: new Date().toISOString(), upvote_score: 25, invited_by: null },
    { id: '10', user_id: 'u10', room_id: 'test', display_name: 'Moussa', avatar_emoji: '🤠', is_speaking: false, is_muted: false, role: 'listener' as const, speak_time_secs: 0, joined_at: new Date().toISOString(), upvote_score: 0, invited_by: null },
  ];

  return (
    <VoiceRoomUI 
      room={mockRoom}
      participants={mockParticipants}
      comments={[]}
      requests={[]}
      userId="u1"
      isHost={true}
      myRole="host"
      canRequestSpeak={false}
      myUpvotedComments={[]}
      onUpvoteComment={async () => {}}
      onPostComment={async () => {}}
      onRequestSpeak={async () => {}}
      onApproveRequest={async () => {}}
      onTogglePrivacy={async () => {}}
      onLeave={() => router.back()}
    />
  );
}
