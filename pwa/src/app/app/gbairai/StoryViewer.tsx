'use client';

import { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Ic } from '@/components/ui/Ic';
import { createClient } from '@/lib/supabase/client';

type Story = {
  id: string;
  user_id: string;
  display_name: string | null;
  avatar_emoji: string | null;
  media_url: string | null;
  media_type: 'image' | 'video' | 'text';
  content: string | null;
  created_at: string;
};

type Props = {
  stories: Story[];
  initialIndex: number;
  onClose: () => void;
  userId: string | null;
  reactionsByStory?: Record<string, Record<string, number>>;
  myReactions?: Record<string, string[]>;
};

const REACTIONS = ['👍', '😍', '😂', '😡', '🔥', '💯'];

type Float = { id: number; emoji: string; x: number };

export default function StoryViewer({
  stories,
  initialIndex,
  onClose,
  userId,
  reactionsByStory = {},
  myReactions = {},
}: Props) {
  const supabase = createClient();
  const [index, setIndex] = useState(initialIndex);
  const [progress, setProgress] = useState(0);
  const [paused, setPaused] = useState(false);

  // Local mutable copy of reaction counts so we can do optimistic updates.
  const [counts, setCounts] = useState<Record<string, Record<string, number>>>(() => {
    const clone: Record<string, Record<string, number>> = {};
    for (const [k, v] of Object.entries(reactionsByStory)) clone[k] = { ...v };
    return clone;
  });
  const [mine, setMine] = useState<Record<string, Set<string>>>(() => {
    const clone: Record<string, Set<string>> = {};
    for (const [k, v] of Object.entries(myReactions)) clone[k] = new Set(v);
    return clone;
  });

  const [floats, setFloats] = useState<Float[]>([]);

  const currentStory = stories[index];
  const currentCounts = currentStory ? counts[currentStory.id] ?? {} : {};
  const currentMine = currentStory ? mine[currentStory.id] ?? new Set<string>() : new Set<string>();
  const totalReactions = useMemo(
    () => Object.values(currentCounts).reduce((a, b) => a + b, 0),
    [currentCounts]
  );

  // Timer pour la story
  useEffect(() => {
    setProgress(0);
    if (paused) return;

    const duration = 5000;
    const interval = 50;
    const step = (interval / duration) * 100;

    const timer = setInterval(() => {
      setProgress(prev => {
        if (prev >= 100) {
          handleNext();
          return 100;
        }
        return prev + step;
      });
    }, interval);

    return () => clearInterval(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [index, paused]);

  const handleNext = () => {
    if (index < stories.length - 1) setIndex(index + 1);
    else onClose();
  };

  const handlePrev = () => {
    if (index > 0) setIndex(index - 1);
  };

  const handleReact = async (emoji: string) => {
    if (!userId || !currentStory) return;
    const storyId = currentStory.id;
    const already = currentMine.has(emoji);

    // Spawn a floating emoji at a random horizontal offset
    const id = Date.now() + Math.random();
    const x = Math.random() * 80 - 40;
    setFloats(f => [...f, { id, emoji, x }]);
    setTimeout(() => setFloats(f => f.filter(it => it.id !== id)), 1400);

    // Optimistic update — toggle behaviour
    setCounts(prev => {
      const m = { ...(prev[storyId] ?? {}) };
      m[emoji] = Math.max(0, (m[emoji] ?? 0) + (already ? -1 : 1));
      return { ...prev, [storyId]: m };
    });
    setMine(prev => {
      const s = new Set(prev[storyId] ?? []);
      if (already) s.delete(emoji);
      else s.add(emoji);
      return { ...prev, [storyId]: s };
    });

    if (already) {
      await supabase
        .from('gbairai_story_reactions')
        .delete()
        .match({ story_id: storyId, user_id: userId, reaction_emoji: emoji });
    } else {
      await supabase
        .from('gbairai_story_reactions')
        .insert({ story_id: storyId, user_id: userId, reaction_emoji: emoji });
    }
  };

  if (!currentStory) return null;

  return (
    <div
      style={{
        position: 'fixed', inset: 0, zIndex: 10003,
        background: '#000', display: 'flex', flexDirection: 'column',
      }}
    >
      {/* Progress Bars */}
      <div
        style={{
          position: 'absolute', top: 'max(12px, env(safe-area-inset-top))',
          left: 10, right: 10, display: 'flex', gap: 4, zIndex: 10,
        }}
      >
        {stories.map((_, i) => (
          <div key={i} style={{ flex: 1, height: 2.5, background: 'rgba(255,255,255,0.3)', borderRadius: 2, overflow: 'hidden' }}>
            <div
              style={{
                height: '100%', background: '#fff',
                width: i < index ? '100%' : i === index ? `${progress}%` : '0%',
                transition: i === index ? 'width 60ms linear' : 'none',
              }}
            />
          </div>
        ))}
      </div>

      {/* Header Info */}
      <div
        style={{
          position: 'absolute', top: 'max(24px, env(safe-area-inset-top) + 12px)',
          left: 16, right: 16, display: 'flex', alignItems: 'center', gap: 10, zIndex: 10,
        }}
      >
        <div
          style={{
            width: 36, height: 36, borderRadius: 12, background: 'var(--orange)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 20, color: '#fff', border: '2px solid rgba(255,255,255,0.2)',
          }}
        >
          {currentStory.avatar_emoji || '👤'}
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ color: '#fff', fontSize: 14, fontWeight: 900, textShadow: '0 1px 4px rgba(0,0,0,0.4)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {currentStory.display_name || 'Mobeur'}
          </div>
          <div style={{ color: 'rgba(255,255,255,0.7)', fontSize: 10, fontWeight: 700 }}>
            {new Date(currentStory.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            {totalReactions > 0 && (
              <span style={{ marginLeft: 8, color: '#FFB347' }}>· {totalReactions} réaction{totalReactions > 1 ? 's' : ''}</span>
            )}
          </div>
        </div>
        <button
          onClick={onClose}
          aria-label="Fermer"
          style={{ background: 'rgba(255,255,255,0.1)', border: 'none', color: '#fff', width: 36, height: 36, borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}
        >
          <Ic.X s={20} />
        </button>
      </div>

      {/* Media Content + tap-to-navigate */}
      <div
        style={{ flex: 1, position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}
        onPointerDown={() => setPaused(true)}
        onPointerUp={() => setPaused(false)}
        onPointerCancel={() => setPaused(false)}
        onClick={(e) => {
          const x = e.clientX;
          if (x < window.innerWidth / 3) handlePrev();
          else handleNext();
        }}
      >
        {currentStory.media_url ? (
          currentStory.media_type === 'video' ? (
            <video src={currentStory.media_url} autoPlay loop muted playsInline style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          ) : (
            <img src={currentStory.media_url} alt="story" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          )
        ) : (
          <div style={{ width: '100%', height: '100%', background: 'linear-gradient(135deg, #F26C1A, #E5337A)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 40, position: 'relative' }}>
            <div className="wax-bg" style={{ position: 'absolute', inset: 0, color: '#fff', opacity: 0.18 }} />
            <div style={{ position: 'relative', color: '#fff', fontSize: 24, fontWeight: 900, textAlign: 'center', lineHeight: 1.3 }}>
              {currentStory.content}
            </div>
          </div>
        )}

        {/* Caption */}
        {currentStory.media_url && currentStory.content && (
          <div style={{ position: 'absolute', bottom: 110, left: 20, right: 20, textAlign: 'center', pointerEvents: 'none' }}>
            <p style={{ color: '#fff', fontSize: 16, fontWeight: 800, textShadow: '0 2px 8px rgba(0,0,0,0.8)' }}>
              {currentStory.content}
            </p>
          </div>
        )}

        {/* Floating reactions */}
        <AnimatePresence>
          {floats.map(f => (
            <motion.div
              key={f.id}
              initial={{ y: 0, opacity: 0.95, scale: 0.85, x: f.x }}
              animate={{ y: -220, opacity: 0, scale: 1.4 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 1.4, ease: 'easeOut' }}
              style={{
                position: 'absolute', bottom: 110, left: '50%',
                fontSize: 40, pointerEvents: 'none',
                filter: 'drop-shadow(0 4px 12px rgba(0,0,0,0.4))',
              }}
            >
              {f.emoji}
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {/* Reactions Bar */}
      <div
        style={{
          padding: '14px 14px max(20px, env(safe-area-inset-bottom))',
          display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8,
          background: 'linear-gradient(to top, rgba(0,0,0,0.7), transparent)',
          zIndex: 10,
        }}
      >
        {REACTIONS.map(emoji => {
          const c = currentCounts[emoji] ?? 0;
          const reacted = currentMine.has(emoji);
          return (
            <button
              key={emoji}
              onClick={(e) => { e.stopPropagation(); handleReact(emoji); }}
              className="press"
              aria-pressed={reacted}
              aria-label={`Réagir ${emoji}`}
              style={{
                position: 'relative',
                background: reacted ? 'rgba(242,108,26,0.85)' : 'rgba(255,255,255,0.14)',
                border: reacted ? '1.5px solid #fff' : '1.5px solid rgba(255,255,255,0.05)',
                borderRadius: 18, minWidth: 48, height: 48, padding: '0 10px',
                fontSize: 22, color: '#fff', cursor: 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                backdropFilter: 'blur(10px)',
                WebkitBackdropFilter: 'blur(10px)',
                boxShadow: reacted ? '0 6px 20px rgba(242,108,26,0.5)' : '0 4px 12px rgba(0,0,0,0.3)',
                transition: 'background 0.2s, box-shadow 0.2s',
              }}
            >
              <span>{emoji}</span>
              {c > 0 && (
                <span style={{ fontSize: 11, fontWeight: 900, letterSpacing: 0.3 }}>
                  {c}
                </span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
