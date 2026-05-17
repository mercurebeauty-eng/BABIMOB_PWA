'use client';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useVoiceRoom as useVoiceRoomHook } from '@/hooks/useVoiceRoom';
import { useVoiceRoom as useVoiceRoomContext } from '@/context/VoiceRoomContext';
import VoiceRoomUI from '@/components/voice/VoiceRoomUI';
import { useProfileGating } from '@/hooks/useProfileGating';

interface Props {
  roomId: string;
  userId: string;
  displayName: string;
  avatarEmoji: string;
}

export default function VoiceRoomPageClient({ roomId, userId, displayName, avatarEmoji }: Props) {
  const router = useRouter();
  const { isComplete, loading: profileLoading } = useProfileGating();
  const {
    room, participants, comments, requests,
    loading, myRole, isHost, canRequestSpeak, myUpvotedComments,
    joinRoom, leaveRoom, postComment, upvoteComment,
    requestSpeak, approveRequest, togglePrivacy,
  } = useVoiceRoomHook(roomId, userId);

  const { setActiveRoom, setJoined, isMiniPlayer, error: roomError, agoraClient } = useVoiceRoomContext();

  useEffect(() => {
    if (room) {
      setActiveRoom(room);
      setJoined(true);
    }
  }, [room, setActiveRoom, setJoined]);

  if (profileLoading || loading || !room) {
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

  if (!isComplete) {
    return (
      <div style={{ minHeight: '100dvh', background: 'var(--cream)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: 24, color: 'var(--ink)' }}>
        <div style={{ fontSize: 48, marginBottom: 16 }}>🔒</div>
        <h3 className="font-display" style={{ fontSize: 24, marginBottom: 8 }}>Profil Incomplet</h3>
        <p style={{ textAlign: 'center', color: 'var(--muted)', marginBottom: 24, lineHeight: 1.5 }}>
          Pour rejoindre ce salon vocal, tu dois d'abord renseigner ton <b>Nom</b>, <b>Téléphone</b>, <b>Pseudo</b> et <b>Commune</b> dans ton profil.
        </p>
        <button onClick={() => router.push('/app/compte')} className="press font-display" style={{ width: '100%', padding: 16, borderRadius: 18, background: 'var(--orange)', color: '#fff', fontSize: 16, border: 'none', cursor: 'pointer' }}>
          COMPLÉTER MON PROFIL
        </button>
        <button onClick={() => router.push('/app/gbairai')} style={{ marginTop: 16, background: 'none', border: 'none', color: 'var(--muted)', fontSize: 14, fontWeight: 700, cursor: 'pointer' }}>
          Retour
        </button>
      </div>
    );
  }

  if (roomError) {
    return (
      <div style={{ minHeight: '100dvh', background: 'linear-gradient(160deg, #1A0A0A, #2E0B0B)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff' }}>
        <div style={{ textAlign: 'center', padding: 20 }}>
          <div style={{ fontSize: 48, marginBottom: 16 }}>⚠️</div>
          <div style={{ fontSize: 18, fontWeight: 'bold', marginBottom: 8 }}>Erreur de connexion</div>
          <div style={{ fontSize: 14, color: 'rgba(255,255,255,0.7)', maxWidth: 300 }}>{roomError}</div>
          <button 
            onClick={() => window.location.reload()}
            style={{ marginTop: 24, padding: '10px 20px', borderRadius: 20, border: 'none', background: '#fff', color: '#000', fontWeight: 'bold' }}
          >
            Réessayer
          </button>
        </div>
      </div>
    );
  }

  // Vérification de la connexion Agora
  if (!agoraClient) {
    return (
      <div style={{ minHeight: '100dvh', background: 'linear-gradient(160deg, #0D0D1A, #1A0A2E)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff' }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: 48, marginBottom: 16, animation: 'pulse 1.5s infinite' }}>🎙️</div>
          <div style={{ fontSize: 14, color: 'rgba(255,255,255,0.5)' }}>Initialisation du service vocal…</div>
        </div>
        <style>{`@keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.4} }`}</style>
      </div>
    );
  }

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
