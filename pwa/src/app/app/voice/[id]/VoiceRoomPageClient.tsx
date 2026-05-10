'use client';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useVoiceRoom as useVoiceRoomHook } from '@/hooks/useVoiceRoom';
import { useVoiceRoom as useVoiceRoomContext } from '@/context/VoiceRoomContext';
import VoiceRoomUI from '@/components/voice/VoiceRoomUI';

interface Props {
  roomId: string;
  userId: string;
  displayName: string;
  avatarEmoji: string;
}

export default function VoiceRoomPageClient({ roomId, userId, displayName, avatarEmoji }: Props) {
  const router = useRouter();
  const {
    room, participants, comments, requests,
    loading, myRole, isHost, canRequestSpeak, myUpvotedComments,
    joinRoom, leaveRoom, postComment, upvoteComment,
    requestSpeak, approveRequest, togglePrivacy,
  } = useVoiceRoomHook(roomId, userId);

  const { setActiveRoom, setJoined, isMiniPlayer, token } = useVoiceRoomContext();

  if (loading || !room) {
    return (
      <div style={{ minHeight: '100dvh', background: 'linear-gradient(160deg, #0D0D1A, #1A0A2E)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff' }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: 48, marginBottom: 16, animation: 'pulse 1.5s infinite' }}>🎙️</div>
          <div style={{ fontSize: 14, color: 'rgba(255,255,255,0.5)' }}>Chargement du salon…</div>
        </div>
        <style>{`@keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.4} }`}</style>
      </div>
    );
  }

  if (!token) {
    return (
      <div style={{ minHeight: '100dvh', background: 'linear-gradient(160deg, #0D0D1A, #1A0A2E)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff' }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: 48, marginBottom: 16, animation: 'pulse 1.5s infinite' }}>🎙️</div>
          <div style={{ fontSize: 14, color: 'rgba(255,255,255,0.5)' }}>Connexion vocale (LiveKit)…</div>
        </div>
        <style>{`@keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.4} }`}</style>
      </div>
    );
  }

  useEffect(() => {
    if (room) {
      setActiveRoom(room);
      setJoined(true);
    }
  }, [room, setActiveRoom, setJoined]);

  // If MiniPlayer is active, don't render the full UI to avoid duplicating the audio simulation
  if (isMiniPlayer) {
    return (
      <div style={{ minHeight: '100dvh', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff' }}>
        Lecture en arrière-plan...
      </div>
    );
  }

  return (
    <VoiceRoomUI
      room={room}
      participants={participants}
      comments={comments}
      requests={requests}
      userId={userId}
      isHost={isHost}
      myRole={myRole}
      canRequestSpeak={canRequestSpeak}
      myUpvotedComments={myUpvotedComments}
      onUpvoteComment={upvoteComment}
      onPostComment={(text) => postComment(text, displayName, avatarEmoji)}
      onRequestSpeak={requestSpeak}
      onApproveRequest={approveRequest}
      onTogglePrivacy={togglePrivacy}
      onLeave={() => { leaveRoom(); router.push('/app/gbairai'); }}
    />
  );
}
