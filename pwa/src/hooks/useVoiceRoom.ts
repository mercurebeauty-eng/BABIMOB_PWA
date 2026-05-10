'use client';
import { useState, useEffect, useCallback } from 'react';
import { createClient } from '@/lib/supabase/client';
import type { VoiceRoom, VoiceParticipant, VoiceRoomComment, VoiceSpeakerRequest } from '@/app/app/gbairai/types';

export function useVoiceRoom(roomId: string, userId: string | null) {
  const supabase = createClient();
  const [room, setRoom] = useState<VoiceRoom | null>(null);
  const [participants, setParticipants] = useState<VoiceParticipant[]>([]);
  const [comments, setComments] = useState<VoiceRoomComment[]>([]);
  const [requests, setRequests] = useState<VoiceSpeakerRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [myUpvotedComments, setMyUpvotedComments] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (!roomId) return;
    setLoading(true);
    const fetchAll = async () => {
      const [roomRes, partRes, commRes, reqRes] = await Promise.all([
        supabase.from('voice_rooms').select('*').eq('id', roomId).single(),
        supabase.from('voice_room_participants').select('*').eq('room_id', roomId),
        supabase.from('voice_room_comments').select('*').eq('room_id', roomId).order('created_at', { ascending: true }),
        supabase.from('voice_speaker_requests').select('*').eq('room_id', roomId).eq('status', 'pending'),
      ]);
      if (roomRes.data) setRoom(roomRes.data as VoiceRoom);
      if (partRes.data) setParticipants(partRes.data as VoiceParticipant[]);
      if (commRes.data) setComments(commRes.data as VoiceRoomComment[]);
      if (reqRes.data) setRequests(reqRes.data as VoiceSpeakerRequest[]);
      setLoading(false);
    };
    fetchAll();

    const channel = supabase.channel(`voice-room-${roomId}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'voice_room_participants', filter: `room_id=eq.${roomId}` }, (p) => {
        if (p.eventType === 'INSERT') setParticipants(prev => [...prev, p.new as VoiceParticipant]);
        if (p.eventType === 'UPDATE') setParticipants(prev => prev.map(x => x.user_id === (p.new as VoiceParticipant).user_id ? p.new as VoiceParticipant : x));
        if (p.eventType === 'DELETE') setParticipants(prev => prev.filter(x => x.user_id !== (p.old as any).user_id));
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'voice_room_comments', filter: `room_id=eq.${roomId}` }, (p) => {
        if (p.eventType === 'INSERT') setComments(prev => [...prev, p.new as VoiceRoomComment]);
        if (p.eventType === 'UPDATE') setComments(prev => prev.map(x => x.id === (p.new as VoiceRoomComment).id ? p.new as VoiceRoomComment : x));
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'voice_speaker_requests', filter: `room_id=eq.${roomId}` }, (p) => {
        if (p.eventType === 'INSERT') setRequests(prev => [...prev, p.new as VoiceSpeakerRequest]);
        if (p.eventType === 'UPDATE') setRequests(prev => prev.filter(x => x.id !== (p.new as VoiceSpeakerRequest).id || (p.new as VoiceSpeakerRequest).status === 'pending'));
      })
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'voice_rooms', filter: `id=eq.${roomId}` }, (p) => setRoom(p.new as VoiceRoom))
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [roomId]);

  const joinRoom = useCallback(async () => {
    if (!userId) return;
    await supabase.from('voice_room_participants').upsert({ room_id: roomId, user_id: userId, role: 'listener', is_muted: true });
  }, [roomId, userId]);

  const leaveRoom = useCallback(async () => {
    if (!userId) return;
    await supabase.from('voice_room_participants').delete().eq('room_id', roomId).eq('user_id', userId);
  }, [roomId, userId]);

  const postComment = useCallback(async (content: string, displayName: string, avatarEmoji: string) => {
    if (!userId || !content.trim()) return;
    await supabase.from('voice_room_comments').insert({ room_id: roomId, user_id: userId, content: content.trim(), display_name: displayName, avatar_emoji: avatarEmoji });
  }, [roomId, userId]);

  const upvoteComment = useCallback(async (commentId: string, isHost = false) => {
    if (!userId || myUpvotedComments.has(commentId)) return;
    setMyUpvotedComments(prev => new Set([...prev, commentId]));
    await supabase.rpc('upvote_comment', { p_comment_id: commentId, p_is_host: isHost });
  }, [userId, myUpvotedComments]);

  const requestSpeak = useCallback(async () => {
    if (!userId) return false;
    const { error } = await supabase.from('voice_speaker_requests').insert({ room_id: roomId, user_id: userId });
    return !error;
  }, [roomId, userId]);

  const approveRequest = useCallback(async (requestId: string) => {
    await supabase.rpc('approve_speaker_request', { p_request_id: requestId });
  }, []);

  const inviteUser = useCallback(async (targetUserId: string) => {
    await supabase.rpc('invite_to_room', { p_room_id: roomId, p_user_id: targetUserId });
  }, [roomId]);

  const togglePrivacy = useCallback(async () => {
    await supabase.rpc('toggle_room_privacy', { p_room_id: roomId });
  }, [roomId]);

  const isHost = room?.creator_id === userId;
  const myRole = participants.find(p => p.user_id === userId)?.role ?? null;
  const myCommentUpvotes = comments.filter(c => c.user_id === userId).reduce((sum, c) => sum + c.upvotes, 0);
  const canRequestSpeak = myCommentUpvotes >= (room?.upvote_threshold ?? 15) && myRole === 'listener';

  return { room, participants, comments, requests, loading, myRole, isHost, canRequestSpeak, myUpvotedComments, joinRoom, leaveRoom, postComment, upvoteComment, requestSpeak, approveRequest, inviteUser, togglePrivacy };
}
