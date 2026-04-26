'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';

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
  }, [userId, placeId]);

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
      className={`p-2.5 rounded-2xl border-2 transition-all active:scale-95 disabled:opacity-50 ${
        favorited
          ? 'bg-red-50 border-red-200 text-red-500'
          : 'bg-beige-50 border-beige-200 text-beige-200 hover:border-red-200 hover:text-red-400'
      }`}
    >
      <svg className="w-5 h-5" viewBox="0 0 24 24" fill={favorited ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="2">
        <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" strokeLinecap="round" strokeLinejoin="round"/>
      </svg>
    </button>
  );
}
