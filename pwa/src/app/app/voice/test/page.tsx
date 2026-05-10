'use client';

import React from 'react';
import VoiceRoomUI from '@/components/voice/VoiceRoomUI';
import { useRouter } from 'next/navigation';

export default function VoiceTestPage() {
  const router = useRouter();

  const mockParticipants = [
    { id: '1', name: 'Zokora', avatar_emoji: '🦁', is_speaking: true, is_muted: false, role: 'host' as const },
    { id: '2', name: 'Awa', avatar_emoji: '💃', is_speaking: false, is_muted: true, role: 'speaker' as const },
    { id: '3', name: 'Bakayoko', avatar_emoji: '⚽', is_speaking: true, is_muted: false, role: 'speaker' as const },
    { id: '4', name: 'Cissé', avatar_emoji: '👳', is_speaking: false, is_muted: false, role: 'speaker' as const },
    { id: '10', name: 'Moussa', avatar_emoji: '🤠', is_speaking: false, is_muted: false, role: 'listener' as const },
    { id: '11', name: 'Tidiane', avatar_emoji: '👔', is_speaking: false, is_muted: false, role: 'listener' as const },
    { id: '12', name: 'Fatou', avatar_emoji: '✨', is_speaking: false, is_muted: false, role: 'listener' as const },
    { id: '13', name: 'Gnon', avatar_emoji: '🐒', is_speaking: false, is_muted: false, role: 'listener' as const },
    { id: '14', name: 'Kouakou', avatar_emoji: '🚜', is_speaking: false, is_muted: false, role: 'listener' as const },
  ];

  return (
    <VoiceRoomUI 
      title="Débrief Match de hier au Plateau ⚽"
      participants={mockParticipants}
      onClose={() => router.back()}
    />
  );
}
