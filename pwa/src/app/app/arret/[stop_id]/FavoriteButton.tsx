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
      className={`flex items-center gap-2 text-sm font-medium transition-colors disabled:opacity-60 ${
        favorited ? 'text-red-500 hover:text-red-400' : 'text-gray-400 hover:text-bm-amber'
      }`}
    >
      <svg
        className="w-5 h-5"
        viewBox="0 0 24 24"
        fill={favorited ? 'currentColor' : 'none'}
        stroke="currentColor"
        strokeWidth="1.8"
      >
        <path
          d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
      {favorited ? 'Sauvegardé' : 'Sauvegarder'}
    </button>
  );
}
