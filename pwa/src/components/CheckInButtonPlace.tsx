'use client';

import { useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { haversineM } from '@/lib/geo';
import Link from 'next/link';
import { Ic } from '@/components/ui/Ic';

const MAX_DISTANCE_M = 300;

type Props = {
  placeId: string;
  placeName: string;
  commune: string | null;
  lat?: number;
  lon?: number;
  onSuccess?: () => void;
};

type Status = 'idle' | 'locating' | 'too_far' | 'loading' | 'done' | 'error' | 'already';

export default function CheckInButtonPlace({ placeId, placeName, commune, lat, lon, onSuccess }: Props) {
  const supabase = createClient();
  const [status, setStatus] = useState<Status>('idle');
  const [distanceM, setDistanceM] = useState<number | null>(null);

  async function handleJySuis() {
    // Etape 1 — Vérifier géolocalisation
    if (!navigator.geolocation) {
      setStatus('error');
      return;
    }

    setStatus('locating');

    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const userLat = pos.coords.latitude;
        const userLon = pos.coords.longitude;

        if (lat !== undefined && lon !== undefined) {
          const dist = haversineM(userLat, userLon, lat, lon);
          setDistanceM(Math.round(dist));

          if (dist > MAX_DISTANCE_M) {
            setStatus('too_far');
            return;
          }
        }

        // Etape 2 — Valider le checkin
        setStatus('loading');
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) { setStatus('error'); return; }

        let { data: profile } = await supabase
          .from('profiles')
          .select('display_name, avatar_emoji, is_public_visits')
          .eq('id', user.id)
          .maybeSingle();

        if (!profile) {
          const raw = user.email?.split('@')[0] ?? 'Explorateur';
          const defaultName = raw.replace(/[._-]/g, ' ').split(' ')
            .map((w: string) => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
          const { data: created } = await supabase
            .from('profiles')
            .insert({ id: user.id, display_name: defaultName, avatar_emoji: '🧭' })
            .select('display_name, avatar_emoji').single();
          profile = created;
        }

        const { error } = await supabase.from('checkins').insert({
          user_id: user.id,
          place_id: placeId,
          place_name: placeName,
          commune,
          lat: pos.coords.latitude,
          lon: pos.coords.longitude,
          is_public: profile?.is_public_visits ?? false,
          display_name: profile?.display_name ?? 'Explorateur',
          avatar_emoji: profile?.avatar_emoji ?? '🧭',
        });

        if (error) {
          if (error.message.includes('moins de 24h') || error.code === '23505') {
            setStatus('already');
          } else {
            setStatus('error');
          }
          return;
        }

        setStatus('done');
        onSuccess?.();
      },
      () => setStatus('error')
    );
  }

  if (status === 'done') {
    return (
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, background: 'color-mix(in oklab, var(--green) 10%, transparent)', border: '1.5px solid color-mix(in oklab, var(--green) 25%, transparent)', borderRadius: 18, padding: '14px 18px' }}>
        <div style={{ width: 36, height: 36, borderRadius: 12, background: 'var(--green)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', flexShrink: 0 }}>
          <Ic.Pin s={18} fill />
        </div>
        <div>
          <div style={{ fontSize: 13, fontWeight: 900, color: 'var(--green)', textTransform: 'uppercase', letterSpacing: 0.5 }}>Présence validée !</div>
          <div style={{ fontSize: 11, color: 'var(--muted)', marginTop: 2 }}>Tu es bien à {placeName}</div>
        </div>
      </div>
    );
  }

  if (status === 'already') {
    return (
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, background: 'color-mix(in oklab, var(--gold) 10%, transparent)', border: '1.5px solid color-mix(in oklab, var(--gold) 25%, transparent)', borderRadius: 18, padding: '14px 18px' }}>
        <span style={{ fontSize: 22 }}>⏰</span>
        <div style={{ fontSize: 12, color: 'var(--ink)', fontWeight: 700 }}>Déjà validé aujourd'hui — reviens demain.</div>
      </div>
    );
  }

  if (status === 'too_far') {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, background: 'color-mix(in oklab, var(--orange-deep) 8%, transparent)', border: '1.5px solid color-mix(in oklab, var(--orange-deep) 20%, transparent)', borderRadius: 18, padding: '14px 18px' }}>
          <span style={{ fontSize: 22, flexShrink: 0 }}>📍</span>
          <div>
            <div style={{ fontSize: 13, fontWeight: 900, color: 'var(--orange-deep)' }}>Tu es trop loin</div>
            <div style={{ fontSize: 11, color: 'var(--muted)', marginTop: 2 }}>
              {distanceM !== null ? `${distanceM}m de distance — max ${MAX_DISTANCE_M}m` : `Approche-toi à moins de ${MAX_DISTANCE_M}m`}
            </div>
          </div>
        </div>
        <button
          onClick={() => setStatus('idle')}
          style={{ padding: '10px 0', borderRadius: 12, border: '1.5px solid var(--line)', background: 'transparent', color: 'var(--muted)', fontSize: 12, fontWeight: 700, cursor: 'pointer' }}
        >
          Réessayer
        </button>
      </div>
    );
  }

  if (status === 'error') {
    return (
      <Link href="/app/auth/signin" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10, background: 'var(--cream-2)', border: '1.5px solid var(--line)', borderRadius: 18, padding: '14px 18px', textDecoration: 'none', color: 'var(--muted)', fontSize: 12, fontWeight: 700 }}>
        <span>🔒</span> Connecte-toi pour valider ta présence
      </Link>
    );
  }

  return (
    <button
      onClick={handleJySuis}
      disabled={status === 'locating' || status === 'loading'}
      style={{
        width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10,
        background: 'var(--green)', color: '#fff', padding: '16px 0', borderRadius: 18,
        border: 'none', fontSize: 15, fontWeight: 900, cursor: 'pointer',
        boxShadow: '0 4px 14px rgba(14,168,91,0.35)', textTransform: 'uppercase', letterSpacing: 0.5,
        opacity: (status === 'locating' || status === 'loading') ? 0.7 : 1,
      }}
    >
      {status === 'locating' ? (
        <><div style={{ width: 18, height: 18, border: '2.5px solid rgba(255,255,255,0.4)', borderTopColor: '#fff', borderRadius: '50%' }} className="animate-spin" /> Localisation…</>
      ) : status === 'loading' ? (
        <><div style={{ width: 18, height: 18, border: '2.5px solid rgba(255,255,255,0.4)', borderTopColor: '#fff', borderRadius: '50%' }} className="animate-spin" /> Validation…</>
      ) : (
        <><Ic.Locate s={18} /> J'y suis</>
      )}
    </button>
  );
}
