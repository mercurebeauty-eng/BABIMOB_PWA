'use client';

import { useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import Link from 'next/link';
import { Ic } from './ui/Ic';

type Props = { 
  placeId: string; 
  placeName: string; 
  commune: string | null;
  lat?: number;
  lon?: number;
  onSuccess?: () => void;
};

export default function CheckInButtonPlace({ placeId, placeName, commune, lat, lon, onSuccess }: Props) {
  const supabase = createClient();
  const [status, setStatus] = useState<'idle' | 'loading' | 'done' | 'error'>('idle');
  const [recentCount, setRecentCount] = useState<number | null>(null);

  async function handleCheckin() {
    setStatus('loading');
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { setStatus('error'); return; }

    // Get or create profile
    let { data: profile } = await supabase
      .from('profiles')
      .select('display_name, avatar_emoji')
      .eq('id', user.id)
      .maybeSingle();

    if (!profile) {
      const raw = user.email?.split('@')[0] ?? 'Explorateur';
      const defaultName = raw
        .replace(/[._-]/g, ' ')
        .split(' ')
        .map((w: string) => w.charAt(0).toUpperCase() + w.slice(1))
        .join(' ');
      const { data: created } = await supabase
        .from('profiles')
        .insert({ id: user.id, display_name: defaultName, avatar_emoji: '👤' })
        .select('display_name, avatar_emoji')
        .single();
      profile = created;
    }

    const { error } = await supabase.from('checkins').insert({
      user_id: user.id,
      place_id: placeId,
      place_name: placeName,
      commune,
      lat: lat ?? null,
      lon: lon ?? null,
      is_public: true,
      display_name: profile?.display_name ?? 'Explorateur',
      avatar_emoji: profile?.avatar_emoji ?? '👤',
    });

    if (error) { 
      if (error.message.includes('moins de 24h')) {
        alert("Tu as déjà marqué ton territoire ici aujourd'hui ! 📍");
      } else {
        console.error(error);
        alert("Erreur lors du check-in. Réessaye plus tard.");
      }
      setStatus('idle'); 
      return; 
    }

    const { count } = await supabase
      .from('checkins')
      .select('*', { count: 'exact', head: true })
      .eq('place_id', placeId);

    setRecentCount(count ?? 0);
    setStatus('done');
    onSuccess?.();
  }

  if (status === 'done') {
    return (
      <div className="press" style={{ 
        display: 'flex', alignItems: 'center', gap: 14, 
        background: 'var(--green-deep)', color: '#fff', 
        padding: '16px 20px', borderRadius: 20,
        boxShadow: '0 8px 24px rgba(45, 134, 60, 0.2)'
      }}>
        <div style={{ fontSize: 24 }}>✅</div>
        <div>
          <div style={{ fontSize: 11, fontWeight: 800, opacity: 0.8, letterSpacing: 0.6, textTransform: 'uppercase' }}>TERRITOIRE MARQUÉ</div>
          <div className="font-display" style={{ fontSize: 18 }}>C'est validé !</div>
        </div>
      </div>
    );
  }

  if (status === 'error') {
    return (
      <Link href="/app/auth/signin" style={{ textDecoration: 'none' }}>
        <div className="press" style={{ 
          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10,
          padding: '16px 20px', borderRadius: 20, border: '1.5px dashed var(--orange)',
          color: 'var(--orange)', fontSize: 13, fontWeight: 800
        }}>
          <span>❌</span>
          <span>CONNECTE-TOI POUR CHECK-IN</span>
        </div>
      </Link>
    );
  }

  return (
    <button
      onClick={handleCheckin}
      disabled={status === 'loading'}
      className="press wax-bg"
      style={{
        width: '100%', height: 60, borderRadius: 20, border: 'none',
        background: 'var(--orange)', color: '#fff',
        fontSize: 14, fontWeight: 800, cursor: 'pointer',
        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10,
        boxShadow: '0 10px 30px rgba(242,108,26,0.2)'
      }}
    >
      {status === 'loading' ? (
        <div className="shimmer" style={{ width: 24, height: 24, borderRadius: '50%', background: '#fff' }} />
      ) : (
        <Ic.Pin s={20} fill />
      )}
      <span style={{ letterSpacing: 0.5 }}>JE SUIS ICI ! (CHECK-IN)</span>
    </button>
  );
}
