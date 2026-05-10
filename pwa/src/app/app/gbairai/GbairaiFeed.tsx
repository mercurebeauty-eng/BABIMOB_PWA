'use client';

import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { createClient } from '@/lib/supabase/client';
import { Ic } from '@/components/ui/Ic';
import { Pill } from '@/components/ui/Pill';
import { pickWax } from '@/lib/waxPattern';
import type { GbairaiPost } from './types';
import EmptyState from './EmptyState';

const AVATAR_COLORS = ['#FF6B00', '#0EA85B', '#1E5BFF', '#E8B23C', '#FF3B30', '#C4582E'];

function timeAgo(iso: string): string {
  const mins = Math.round((Date.now() - new Date(iso).getTime()) / 60000);
  if (mins < 1) return "à l'instant";
  if (mins < 60) return `${mins}min`;
  if (mins < 1440) return `${Math.floor(mins / 60)}h`;
  return `${Math.floor(mins / 1440)}j`;
}

type Props = {
  initialPosts: GbairaiPost[];
  myLikes: string[];
  userId: string | null;
};

export default function GbairaiFeed({ initialPosts, myLikes: initialMyLikes, userId }: Props) {
  const [posts, setPosts] = useState<GbairaiPost[]>(initialPosts);
  const [liked, setLiked] = useState<Set<string>>(new Set(initialMyLikes));
  const supabase = createClient();

  useEffect(() => {
    setPosts(initialPosts);
  }, [initialPosts]);

  async function toggleLike(postId: string) {
    if (!userId) return;
    const isLiked = liked.has(postId);
    
    // Optimistic update
    setLiked(prev => {
      const next = new Set(prev);
      isLiked ? next.delete(postId) : next.add(postId);
      return next;
    });

    setPosts(prev => prev.map(p => 
      p.id === postId 
        ? { ...p, likes_count: p.likes_count + (isLiked ? -1 : 1) } 
        : p
    ));

    if (isLiked) {
      await supabase.from('gbairai_likes').delete().eq('post_id', postId).eq('user_id', userId);
    } else {
      await supabase.from('gbairai_likes').insert({ post_id: postId, user_id: userId });
    }
  }

  if (posts.length === 0) {
    return (
      <EmptyState 
        emoji="🗣️"
        title="Gbairai est calme..." 
        description="Sois le premier à dire c'est comment !" 
      />
    );
  }

  return (
    <div style={{ padding: '0 16px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
      <AnimatePresence mode="popLayout">
        {posts.map((p, idx) => (
          <motion.div
            key={p.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.3, delay: idx * 0.05 }}
          >
            <PostCard post={p} idx={idx} isLiked={liked.has(p.id)} onLike={() => toggleLike(p.id)} />
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}

function PostCard({ post: p, idx, isLiked, onLike }: { post: GbairaiPost; idx: number; isLiked: boolean; onLike: () => void }) {
  const ac = AVATAR_COLORS[idx % AVATAR_COLORS.length];
  const wax = pickWax(`post-${p.id}`, { rotate: true });

  // TARIF CARD
  if (p.post_type === 'tarif') {
    const meta = p.metadata ?? {};
    return (
      <div style={{ borderRadius: 16, padding: 14, background: 'var(--ink)', color: 'var(--cream)', position: 'relative', overflow: 'hidden', minHeight: 180 }}>
        <div className={wax} style={{ position: 'absolute', inset: 0, color: 'var(--green)', opacity: 0.14 }} />
        <div style={{ position: 'relative' }}>
          <Pill color="var(--green)">TARIF CONFIRMÉ</Pill>
          <div className="font-display" style={{ fontSize: 16, marginTop: 8, color: '#fff', lineHeight: 1.05 }}>
            {meta.from ?? '?'} → {meta.to ?? '?'}
          </div>
          <div className="font-display" style={{ fontSize: 28, color: 'var(--gold)', marginTop: 6 }}>{meta.prix ?? '?'}F</div>
          <div style={{ fontSize: 10, color: 'rgba(247,241,230,0.6)', marginTop: 4 }}>{meta.confirmations ?? p.likes_count} confirment</div>
          <CardFooter p={p} ac={ac} isLiked={isLiked} onLike={onLike} light />
        </div>
      </div>
    );
  }

  // ALERTE CARD
  if (p.post_type === 'alerte') {
    return (
      <div style={{ borderRadius: 20, overflow: 'hidden', background: 'var(--cream-2)', border: '1px solid var(--line)', position: 'relative' }}>
        <div style={{ height: 100, background: 'linear-gradient(135deg, #1E5BFF 0%, #1540B3 100%)', position: 'relative', overflow: 'hidden' }}>
          <div className={wax} style={{ position: 'absolute', inset: 0, color: '#fff', opacity: 0.18 }} />
          <div style={{ position: 'absolute', top: 12, left: 12, fontSize: 10, fontWeight: 900, color: '#fff', background: '#FF3B30', padding: '4px 10px', borderRadius: 8, letterSpacing: 0.5 }}>ALERTE TRAFIC</div>
          {/* Mock path line */}
          <div style={{ position: 'absolute', bottom: 20, left: 0, right: 0, height: 4, background: '#FF3B30', boxShadow: '0 0 12px rgba(255,59,48,0.6)', transform: 'rotate(-2deg)' }} />
        </div>
        <div style={{ padding: 16 }}>
          <div className="font-display" style={{ fontSize: 16, fontWeight: 900, color: 'var(--ink)', lineHeight: 1.2 }}>{p.content}</div>
          <CardFooter p={p} ac={ac} isLiked={isLiked} onLike={onLike} />
        </div>
      </div>
    );
  }

  // EVENEMENT CARD
  if (p.post_type === 'evenement') {
    const meta = p.metadata ?? {};
    return (
      <div style={{ borderRadius: 20, padding: 20, background: 'linear-gradient(135deg, #1A2D6B 0%, #2B4FB7 100%)', color: '#fff', position: 'relative', overflow: 'hidden', minHeight: 180 }}>
        <div className={wax} style={{ position: 'absolute', inset: 0, color: 'var(--gold)', opacity: 0.18 }} />
        <div style={{ position: 'relative' }}>
          <div style={{ display: 'flex', gap: 6, marginBottom: 12 }}>
            <span style={{ fontSize: 9, fontWeight: 900, background: 'rgba(255,255,255,0.15)', padding: '4px 10px', borderRadius: 8 }}>{meta.date || 'CE SEMAINE'}</span>
            <span style={{ fontSize: 9, fontWeight: 900, background: 'rgba(255,255,255,0.15)', padding: '4px 10px', borderRadius: 8 }}>{meta.heure || '22H'}</span>
          </div>
          <h3 className="font-display" style={{ fontSize: 20, margin: '0 0 4px', lineHeight: 1.1 }}>{p.content}</h3>
          <div style={{ fontSize: 12, opacity: 0.8, fontWeight: 700 }}>{p.place_name || p.commune} · {meta.prix || '5 000F'}</div>
          {p.likes_count > 0 && (
            <div style={{ marginTop: 16, fontSize: 11, fontWeight: 800, display: 'flex', alignItems: 'center', gap: 6 }}>
              <Ic.Users s={14} /> {p.likes_count} Babi{p.likes_count > 1 ? 's' : ''} intéressé{p.likes_count > 1 ? 's' : ''}
            </div>
          )}
          <CardFooter p={p} ac={ac} isLiked={isLiked} onLike={onLike} light />
        </div>
      </div>
    );
  }

  // BOUFFE CARD
  if (p.post_type === 'bouffe') {
    return (
      <div style={{ borderRadius: 20, overflow: 'hidden', background: 'var(--cream-2)', border: '1px solid var(--line)' }}>
        <div style={{ height: 160, background: `linear-gradient(180deg, transparent 0%, rgba(0,0,0,0.4) 100%), linear-gradient(135deg, #E8B23C, #F26C1A)`, position: 'relative', overflow: 'hidden' }}>
          <div className={wax} style={{ position: 'absolute', inset: 0, color: '#fff', opacity: 0.14 }} />
        </div>
        <div style={{ padding: 16 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8 }}>
            <span style={{ fontSize: 9, fontWeight: 900, color: '#fff', background: 'var(--gold)', padding: '4px 10px', borderRadius: 8 }}>BOUFFE</span>
            <span style={{ fontSize: 9, fontWeight: 900, color: '#F26C1A', background: 'rgba(242,108,26,0.1)', padding: '4px 10px', borderRadius: 8 }}>🔥 HOT</span>
          </div>
          <div className="font-display" style={{ fontSize: 18, fontWeight: 900, color: 'var(--ink)', lineHeight: 1.2 }}>{p.content}</div>
          <CardFooter p={p} ac={ac} isLiked={isLiked} onLike={onLike} />
        </div>
      </div>
    );
  }

  // DEFAULT — VIBE / BON_PLAN
  return (
    <div style={{ borderRadius: 16, padding: 14, background: 'var(--cream-2)', border: '1px solid var(--line)', position: 'relative', overflow: 'hidden' }}>
      {p.post_type === 'bon_plan' && <Pill color="var(--green)">BON PLAN</Pill>}
      <div style={{ fontSize: 12, fontWeight: 800, color: 'var(--ink)', lineHeight: 1.3, marginTop: p.post_type === 'bon_plan' ? 8 : 0 }}>{p.content}</div>
      {p.commune && <div style={{ fontSize: 10, color: 'var(--muted)', marginTop: 4 }}>📍 {p.commune}{p.place_name ? ` · ${p.place_name}` : ''}</div>}
      {p.hashtags.length > 0 && (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, marginTop: 6 }}>
          {p.hashtags.map((t, i) => (
            <span key={i} style={{ fontSize: 10, fontWeight: 800, color: 'var(--orange)' }}>#{t}</span>
          ))}
        </div>
      )}
      <CardFooter p={p} ac={ac} isLiked={isLiked} onLike={onLike} />
    </div>
  );
}

function CardFooter({ p, ac, isLiked, onLike, light = false }: { p: GbairaiPost; ac: string; isLiked: boolean; onLike: () => void; light?: boolean }) {
  const mutedC = light ? 'rgba(247,241,230,0.6)' : 'var(--muted)';
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 10 }}>
      <div style={{ width: 18, height: 18, borderRadius: '50%', background: ac, color: '#fff', fontSize: 9, fontWeight: 800, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        {p.avatar_emoji || p.display_name?.[0] || '?'}
      </div>
      <span style={{ fontSize: 10, color: mutedC, fontWeight: 600, flex: 1, minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
        {p.display_name} · {timeAgo(p.created_at)}
      </span>
      <button onClick={onLike} className="press" style={{ display: 'flex', alignItems: 'center', gap: 3, fontSize: 10, color: isLiked ? 'var(--orange)' : mutedC, fontWeight: 800, background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}>
        <Ic.Heart s={12} fill={isLiked} /> {p.likes_count > 0 ? p.likes_count : ''}
      </button>
    </div>
  );
}
