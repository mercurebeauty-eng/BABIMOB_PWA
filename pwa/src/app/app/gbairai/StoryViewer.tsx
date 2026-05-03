'use client';

import { useState, useEffect } from 'react';
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
};

const REACTIONS = ['👍', '😍', '😂', '😡', '🔥', '💯'];

export default function StoryViewer({ stories, initialIndex, onClose, userId }: Props) {
  const supabase = createClient();
  const [index, setIndex] = useState(initialIndex);
  const [progress, setProgress] = useState(0);
  const currentStory = stories[index];

  // Timer pour la story
  useEffect(() => {
    setProgress(0);
    const duration = 5000; // 5 secondes par story
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
  }, [index]);

  const handleNext = () => {
    if (index < stories.length - 1) {
      setIndex(index + 1);
    } else {
      onClose();
    }
  };

  const handlePrev = () => {
    if (index > 0) {
      setIndex(index - 1);
    }
  };

  const handleReact = async (emoji: string) => {
    if (!userId) return;
    
    // Ajout visuel immédiat (optionnel: animation)
    await supabase.from('gbairai_story_reactions').insert({
      story_id: currentStory.id,
      user_id: userId,
      reaction_emoji: emoji
    });
    
    // On pourrait ajouter une petite animation de cœur qui monte
  };

  if (!currentStory) return null;

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 10003,
      background: '#000', display: 'flex', flexDirection: 'column'
    }}>
      {/* Progress Bars */}
      <div style={{ 
        position: 'absolute', top: 'max(12px, env(safe-area-inset-top))', 
        left: 10, right: 10, display: 'flex', gap: 4, zIndex: 10 
      }}>
        {stories.map((_, i) => (
          <div key={i} style={{ flex: 1, height: 2, background: 'rgba(255,255,255,0.3)', borderRadius: 2, overflow: 'hidden' }}>
            <div style={{ 
              height: '100%', background: '#fff', 
              width: i < index ? '100%' : i === index ? `${progress}%` : '0%' 
            }} />
          </div>
        ))}
      </div>

      {/* Header Info */}
      <div style={{ 
        position: 'absolute', top: 'max(24px, env(safe-area-inset-top) + 12px)', 
        left: 16, right: 16, display: 'flex', alignItems: 'center', gap: 10, zIndex: 10 
      }}>
        <div style={{ width: 36, height: 36, borderRadius: 12, background: 'var(--orange)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20, color: '#fff', border: '2px solid rgba(255,255,255,0.2)' }}>
          {currentStory.avatar_emoji || '👤'}
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ color: '#fff', fontSize: 14, fontWeight: 900, textShadow: '0 1px 4px rgba(0,0,0,0.4)' }}>
            {currentStory.display_name || 'Mobeur'}
          </div>
          <div style={{ color: 'rgba(255,255,255,0.7)', fontSize: 10, fontWeight: 700 }}>
            {new Date(currentStory.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </div>
        </div>
        <button onClick={onClose} style={{ background: 'none', border: 'none', color: '#fff', opacity: 0.8 }}>
          <Ic.X s={24} />
        </button>
      </div>

      {/* Media Content */}
      <div 
        style={{ flex: 1, position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
        onClick={(e) => {
          const x = e.clientX;
          if (x < window.innerWidth / 3) handlePrev();
          else handleNext();
        }}
      >
        {currentStory.media_url ? (
          currentStory.media_type === 'video' ? (
            <video src={currentStory.media_url} autoPlay loop muted style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          ) : (
            <img src={currentStory.media_url} alt="story" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          )
        ) : (
          <div style={{ width: '100%', height: '100%', background: 'linear-gradient(135deg, #F26C1A, #E5337A)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 40 }}>
            <div style={{ color: '#fff', fontSize: 24, fontWeight: 900, textAlign: 'center', lineHeight: 1.3 }}>
              {currentStory.content}
            </div>
          </div>
        )}

        {/* Caption for Media */}
        {currentStory.media_url && currentStory.content && (
          <div style={{ position: 'absolute', bottom: 100, left: 20, right: 20, textAlign: 'center' }}>
             <p style={{ color: '#fff', fontSize: 16, fontWeight: 800, textShadow: '0 2px 8px rgba(0,0,0,0.8)' }}>
               {currentStory.content}
             </p>
          </div>
        )}
      </div>

      {/* Reactions Bar */}
      <div style={{ 
        padding: '20px 20px max(30px, env(safe-area-inset-bottom))', 
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        background: 'linear-gradient(to top, rgba(0,0,0,0.6), transparent)',
        zIndex: 10
      }}>
        <div style={{ display: 'flex', gap: 12 }}>
          {REACTIONS.map(emoji => (
            <button 
              key={emoji} 
              onClick={() => handleReact(emoji)}
              className="press"
              style={{ background: 'rgba(255,255,255,0.15)', border: 'none', borderRadius: '50%', width: 44, height: 44, fontSize: 22, display: 'flex', alignItems: 'center', justifyContent: 'center', backdropFilter: 'blur(10px)' }}
            >
              {emoji}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
