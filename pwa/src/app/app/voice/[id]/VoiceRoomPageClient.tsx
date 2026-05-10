'use client';
import { useRouter } from 'next/navigation';
import { useVoiceRoom } from '@/hooks/useVoiceRoom';
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
  } = useVoiceRoom(roomId, userId);

  if (loading || !room) {
    return (
      <div style={{ minHeight: '100dvh', background: 'linear-gradient(160deg, #0D0D1A, #1A0A2E)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff' }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: 48, marginBottom: 16, animation: 'pulse 1.5s infinite' }}>🎙️</div>
          <div style={{ fontSize: 14, color: 'rgba(255,255,255,0.5)' }}>Connexion au salon…</div>
        </div>
        <style>{`@keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.4} }`}</style>
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
