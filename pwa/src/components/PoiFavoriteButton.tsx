'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { motion, AnimatePresence } from 'framer-motion';

type Props = {
  placeId: string;
  placeName: string;
  commune?: string | null;
  lat: number;
  lon: number;
  userId: string | null;
};

export default function PoiFavoriteButton({ placeId, placeName, commune, lat, lon, userId }: Props) {
  const [favorited, setFavorited] = useState(false);
  const [loading, setLoading] = useState(true);
  const supabase = createClient();

  useEffect(() => {
    if (!userId) { setLoading(false); return; }
    supabase
      .from('user_favorites')
      .select('id')
      .eq('user_id', userId)
      .eq('kind', 'place')
      .eq('stop_id', placeId)
      .maybeSingle()
      .then(({ data }) => { setFavorited(!!data); setLoading(false); });
  }, [userId, placeId, supabase]);

  if (!userId) return null;

  async function toggle() {
    if (loading) return;
    const next = !favorited;
    setFavorited(next);
    if (next) {
      const { error } = await supabase.from('user_favorites').insert({
        user_id: userId,
        kind: 'place',
        label: commune ? `${placeName} · ${commune}` : placeName,
        stop_id: placeId,
        lat,
        lon,
      });
      if (error) setFavorited(false);
    } else {
      const { error } = await supabase
        .from('user_favorites')
        .delete()
        .eq('user_id', userId)
        .eq('kind', 'place')
        .eq('stop_id', placeId);
      if (error) setFavorited(true);
    }
  }

  return (
    <button
      onClick={toggle}
      disabled={loading}
      aria-label={favorited ? 'Retirer des favoris' : 'Sauvegarder ce lieu'}
      className="press"
      style={{
        width: 44, height: 44, borderRadius: '50%', 
        background: favorited ? 'rgba(239, 68, 68, 0.1)' : 'rgba(255, 255, 255, 0.9)',
        color: favorited ? '#ef4444' : 'var(--muted)',
        border: favorited ? '1.5px solid rgba(239, 68, 68, 0.2)' : 'none',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        boxShadow: favorited ? 'none' : '0 8px 24px rgba(0,0,0,0.1)',
        cursor: 'pointer', backdropFilter: 'blur(10px)', transition: 'all 0.2s'
      }}
    >
      <motion.div
        animate={favorited ? { scale: [1, 1.4, 1] } : { scale: 1 }}
        transition={{ duration: 0.3 }}
      >
        <svg 
          width="20" height="20" 
          viewBox="0 0 24 24" 
          fill={favorited ? 'currentColor' : 'none'} 
          stroke="currentColor" 
          strokeWidth="2.5"
          strokeLinecap="round" 
          strokeLinejoin="round"
        >
          <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
        </svg>
      </motion.div>
    </button>
  );
}
