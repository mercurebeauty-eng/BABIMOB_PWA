'use client';

import { useState } from 'react';
import { createClient } from '@/lib/supabase/client';

type Props = {
  stopId: string;
  stopName: string;
  commune: string | null;
  lat: number;
  lon: number;
  initialFavorited: boolean;
  userId: string | null;
  compact?: boolean;
};

export default function FavoriteButton({
  stopId,
  stopName,
  commune,
  lat,
  lon,
  initialFavorited,
  userId,
  compact = false,
}: Props) {
  const [favorited, setFavorited] = useState(initialFavorited);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  if (!userId) {
    if (compact) return null; // Or a small disabled heart
    return (
      <a
        href="/app/auth/signin"
        className="w-full flex items-center justify-center gap-3 py-4 rounded-[1.5rem] border-2 font-black transition-all uppercase tracking-widest text-xs bg-white border-beige-200 text-beige-muted hover:border-abidjan-orange/30 hover:text-abidjan-orange"
      >
        <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
          <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
        Se connecter pour sauvegarder
      </a>
    );
  }

  const uid = userId as string;

  async function toggle() {
    if (loading) return;
    setLoading(true);
    setErrorMsg(null);
    const next = !favorited;
    setFavorited(next);

    const supabase = createClient();
    let err = null;

    if (next) {
      ({ error: err } = await supabase.from('user_favorites').insert({
        user_id: uid,
        kind: 'stop',
        label: commune ? `${stopName} · ${commune}` : stopName,
        stop_id: stopId,
        lat,
        lon,
      }));
    } else {
      ({ error: err } = await supabase
        .from('user_favorites')
        .delete()
        .eq('user_id', uid)
        .eq('stop_id', stopId)
        .eq('kind', 'stop'));
    }

    if (err) {
      setFavorited(!next);
      setErrorMsg(err.message);
      setTimeout(() => setErrorMsg(null), 6000);
    }
    setLoading(false);
  }

  if (errorMsg) {
    return (
      <div className={compact ? "text-red-500" : "w-full flex flex-col items-center gap-1 py-4 rounded-[1.5rem] border-2 border-red-200 bg-red-50 text-red-500"}>
        {!compact && <span className="font-black text-xs uppercase tracking-widest">Erreur</span>}
        <span className="text-[10px] font-medium px-4 text-center break-all">{errorMsg}</span>
      </div>
    );
  }

  if (compact) {
    return (
      <button
        onClick={toggle}
        disabled={loading}
        style={{
          width: 44, height: 44, borderRadius: '50%',
          background: favorited ? 'var(--orange)' : 'var(--cream-2)',
          border: '1px solid var(--line)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          color: favorited ? '#fff' : 'var(--muted)',
          cursor: 'pointer',
          boxShadow: favorited ? '0 4px 12px rgba(242,108,26,0.25)' : 'none'
        }}
        className="press"
      >
        {loading ? (
          <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
        ) : (
          <svg
            className="w-5 h-5 transition-transform"
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
        )}
      </button>
    );
  }

  return (
    <button
      onClick={toggle}
      disabled={loading}
      aria-label={favorited ? 'Retirer des favoris' : 'Ajouter aux favoris'}
      className={`w-full flex items-center justify-center gap-3 py-4 rounded-[1.5rem] border-2 font-black transition-all active:scale-95 uppercase tracking-widest text-xs disabled:opacity-50 ${
        favorited
          ? 'bg-red-50 border-red-200 text-red-600 shadow-lg shadow-red-500/10'
          : 'bg-white border-beige-200 text-beige-muted hover:border-abidjan-orange/30 hover:text-abidjan-orange'
      }`}
    >
      {loading ? (
        <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
      ) : (
        <svg
          className="w-5 h-5 transition-transform"
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
      )}
      {favorited ? 'Enregistré dans mes favoris' : 'Sauvegarder cet arrêt'}
    </button>
  );
}
