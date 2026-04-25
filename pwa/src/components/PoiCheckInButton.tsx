'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import Link from 'next/link';

type Props = {
  placeId: string;
  placeName: string;
  commune?: string;
  lat?: number;
  lon?: number;
};

export default function PoiCheckInButton({ placeId, placeName, commune, lat, lon }: Props) {
  const supabase = createClient();
  const [status, setStatus] = useState<'checking' | 'idle' | 'loading' | 'done' | 'already' | 'error'>('checking');
  const [recentCount, setRecentCount] = useState<number | null>(null);

  useEffect(() => {
    async function checkAlready() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { setStatus('idle'); return; }

      // Can check-in again after 6 hours
      const sixHoursAgo = new Date(Date.now() - 6 * 3600000).toISOString();
      const { data } = await supabase
        .from('checkins')
        .select('id')
        .eq('user_id', user.id)
        .eq('place_id', placeId)
        .gt('created_at', sixHoursAgo)
        .maybeSingle();

      if (data) {
        setStatus('already');
        const since = new Date(Date.now() - 7 * 86400000).toISOString();
        const { count } = await supabase
          .from('checkins')
          .select('*', { count: 'exact', head: true })
          .eq('place_id', placeId)
          .eq('is_public', true)
          .gte('created_at', since);
        setRecentCount(count ?? 0);
      } else {
        setStatus('idle');
      }
    }
    checkAlready();
  }, [placeId, supabase]);

  function getDistance(lat1: number, lon1: number, lat2: number, lon2: number) {
    const R = 6371e3; // Earth radius in meters
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
              Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
              Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
  }

  async function handleCheckin() {
    setStatus('loading');
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { setStatus('error'); return; }

    // 1. GEOFENCE CHECK: Verify user is actually at the place
    if (!navigator.geolocation) {
       alert("Désolé, ton appareil ne supporte pas la géolocalisation.");
       setStatus('idle');
       return;
    }

    navigator.geolocation.getCurrentPosition(async (pos) => {
       const userLat = pos.coords.latitude;
       const userLon = pos.coords.longitude;

       if (lat && lon) {
          const dist = getDistance(userLat, userLon, lat, lon);
          if (dist > 150) { // 150m for Abidjan precision margin
             alert("Tu es trop loin pour valider cette visite ! Rapproche-toi un peu.");
             setStatus('idle');
             return;
          }
       }

       // 2. PROCEED WITH CHECKIN
       let { data: profile } = await supabase
         .from('profiles')
         .select('display_name, avatar_emoji')
         .eq('id', user.id)
         .maybeSingle();

       if (!profile) {
         const raw = user.email?.split('@')[0] ?? 'Explorateur';
         const defaultName = raw.replace(/[._-]/g, ' ').split(' ').map((w: string) => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
         const { data: created } = await supabase.from('profiles').insert({ id: user.id, display_name: defaultName, avatar_emoji: '🧭' }).select('display_name, avatar_emoji').single();
         profile = created;
       }

       const { error } = await supabase.from('checkins').insert({
         user_id: user.id,
         place_id: placeId,
         place_name: placeName,
         commune: commune ?? null,
         lat: lat ?? null,
         lon: lon ?? null,
         is_public: true,
         display_name: profile?.display_name ?? 'Explorateur',
         avatar_emoji: profile?.avatar_emoji ?? '🧭',
         points_earned: 10,
       });

       if (error) { setStatus('error'); return; }

       const since = new Date(Date.now() - 7 * 86400000).toISOString();
       const { count } = await supabase.from('checkins').select('*', { count: 'exact', head: true }).eq('place_id', placeId).eq('is_public', true).gte('created_at', since);
       setRecentCount(count ?? 0);
       setStatus('done');

    }, (err) => {
       alert("Erreur GPS : Impossible de vérifier ta position.");
       setStatus('idle');
    }, { enableHighAccuracy: true });
  }

  if (status === 'checking') {
    return <div className="h-[60px] bg-beige-100 rounded-[2rem] animate-pulse" />;
  }

  if (status === 'already') {
    return (
      <div className="flex items-center gap-4 bg-abidjan-blue/10 border-2 border-abidjan-blue/20 rounded-[2rem] px-6 py-4">
        <span className="text-2xl">✅</span>
        <div>
          <div className="text-sm font-black text-abidjan-blue uppercase tracking-widest">Déjà visité !</div>
          {recentCount !== null && (
            <div className="text-[10px] text-abidjan-blue font-bold mt-1 uppercase tracking-wider">
              👤 {recentCount} visiteur{recentCount > 1 ? 's' : ''} cette semaine
            </div>
          )}
        </div>
      </div>
    );
  }

  if (status === 'done') {
    return (
      <div className="flex items-center gap-4 bg-abidjan-green/10 border-2 border-abidjan-green/20 rounded-[2rem] px-6 py-4 animate-in zoom-in-95 duration-300">
        <span className="text-2xl">🗺️</span>
        <div>
          <div className="text-sm font-black text-abidjan-green uppercase tracking-widest">Visite enregistrée !</div>
          {recentCount !== null && (
            <div className="text-[10px] text-abidjan-green font-bold mt-1 uppercase tracking-wider">
              👤 {recentCount} visiteur{recentCount > 1 ? 's' : ''} cette semaine
            </div>
          )}
        </div>
      </div>
    );
  }

  if (status === 'error') {
    return (
      <Link
        href="/app/auth/signin"
        className="w-full flex items-center justify-center gap-3 bg-red-50 border-2 border-red-100 rounded-[2rem] px-6 py-4 text-xs font-black text-red-600 uppercase tracking-widest"
      >
        <span>❌</span>
        <span>Connecte-toi pour marquer ta visite</span>
      </Link>
    );
  }

  return (
    <div className="relative group">
      <div className="absolute -inset-1 bg-abidjan-orange/20 rounded-[2.2rem] animate-pulse group-hover:bg-abidjan-orange/30 transition-all" />
      <button
        onClick={handleCheckin}
        disabled={status === 'loading'}
        className="relative w-full flex items-center justify-center gap-3 bg-abidjan-orange text-white text-base font-black px-6 py-4 rounded-[2rem] shadow-xl shadow-abidjan-orange/30 hover:shadow-abidjan-orange/50 hover:-translate-y-0.5 transition-all active:scale-95 disabled:opacity-60"
      >
        {status === 'loading' ? (
          <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
        ) : (
          <span className="text-xl">🚶</span>
        )}
        <span className="uppercase tracking-tight">J'y étais !</span>
      </button>
    </div>
  );
}
