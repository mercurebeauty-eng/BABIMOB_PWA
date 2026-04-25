'use client';

import { useState, useTransition } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';

type Props = {
  stopId: string;
  stopName: string;
  commune: string | null;
  lat: number;
  lon: number;
  initialFavorited: boolean;
  userId: string | null;
};

export default function FavoriteButton({
  stopId,
  stopName,
  commune,
  lat,
  lon,
  initialFavorited,
  userId,
}: Props) {
  const [favorited, setFavorited] = useState(initialFavorited);
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  if (!userId) {
    return (
      <a
        href="/app/auth/signin"
        className="flex items-center gap-2 text-sm text-gray-400 hover:text-bm-amber transition-colors"
        aria-label="Se connecter pour sauvegarder"
      >
        <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
          <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
        Sauvegarder
      </a>
    );
  }

  function toggle() {
    startTransition(async () => {
      const supabase = createClient();
      const next = !favorited;
      setFavorited(next);

      if (next) {
        const { error } = await supabase.from('user_favorites').insert({
          user_id: userId,
          kind: 'stop',
          label: commune ? `${stopName} · ${commune}` : stopName,
          stop_id: stopId,
          lat,
          lon,
        });
        if (error) setFavorited(false);
      } else {
        const { error } = await supabase
          .from('user_favorites')
          .delete()
          .eq('user_id', userId)
          .eq('stop_id', stopId)
          .eq('kind', 'stop');
        if (error) setFavorited(true);
      }

      router.refresh();
    });
  }

  return (
    <button
      onClick={toggle}
      disabled={isPending}
      aria-label={favorited ? 'Retirer des favoris' : 'Ajouter aux favoris'}
      className={`w-full flex items-center justify-center gap-3 py-4 rounded-[1.5rem] border-2 font-black transition-all active:scale-[0.97] uppercase tracking-widest text-xs ${
        favorited 
          ? 'bg-red-50 border-red-200 text-red-600 shadow-lg shadow-red-500/10' 
          : 'bg-white border-beige-200 text-beige-muted hover:border-abidjan-orange/30 hover:text-abidjan-orange'
      }`}
    >
      <svg
        className={`w-5 h-5 transition-transform ${favorited ? 'scale-110' : 'group-hover:scale-110'}`}
        viewBox="0 0 24 24"
        fill={favorited ? 'currentColor' : 'none'}
        stroke="currentColor"
        strokeWidth="2.5"
      >
        <path
          d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
      {favorited ? 'Enregistré dans mes lieux' : 'Sauvegarder cet arrêt'}
    </button>
  );
}
