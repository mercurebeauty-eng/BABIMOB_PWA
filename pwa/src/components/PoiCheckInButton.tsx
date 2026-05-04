'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { haversineM } from '@/lib/geo';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { Ic } from '@/components/ui/Ic';
import { toast } from 'sonner';
import { useXP } from '@/components/providers/XPProvider';
import { HelpTip } from './ui/HelpTip';

type Props = {
  placeId: string;
  placeName: string;
  commune?: string;
  lat?: number;
  lon?: number;
  sponsorTier?: 'pro' | 'elite' | null;
};

export default function PoiCheckInButton({ placeId, placeName, commune, lat, lon, sponsorTier }: Props) {
  const xpAmount = sponsorTier === 'elite' ? 50 : sponsorTier === 'pro' ? 30 : 10;
  const supabase = createClient();
  const [status, setStatus] = useState<'checking' | 'idle' | 'loading' | 'done' | 'already' | 'error'>('checking');
  const [recentCount, setRecentCount] = useState<number | null>(null);
  const { addXP } = useXP();

  useEffect(() => {
    async function checkAlready() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { setStatus('idle'); return; }

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

  async function handleCheckin() {
    setStatus('loading');
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { setStatus('error'); return; }

    if (!navigator.geolocation) {
       alert("Désolé, ton appareil ne supporte pas la géolocalisation.");
       setStatus('idle');
       return;
    }

    navigator.geolocation.getCurrentPosition(async (pos) => {
       const userLat = pos.coords.latitude;
       const userLon = pos.coords.longitude;

       if (lat && lon) {
          const dist = haversineM(userLat, userLon, lat, lon);
          if (dist > 100) { // Stricter geofencing as requested
             alert(`Tu es trop loin (${Math.round(dist)}m). Rapproche-toi du lieu !`);
             setStatus('idle');
             return;
          }
       }

       let { data: profile } = await supabase
         .from('profiles')
         .select('display_name, avatar_emoji, is_public_visits')
         .eq('id', user.id)
         .maybeSingle();

       if (!profile) {
         const raw = user.email?.split('@')[0] ?? 'Explorateur';
         const defaultName = raw.replace(/[._-]/g, ' ').split(' ').map((w: string) => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
         const { data: created } = await supabase.from('profiles').insert({ id: user.id, display_name: defaultName, avatar_emoji: '🧭' }).select('display_name, avatar_emoji, is_public_visits').single();
         profile = created;
       }

       const { error } = await supabase.from('checkins').insert({
         user_id: user.id,
         place_id: placeId,
         place_name: placeName,
         commune: commune ?? null,
         lat: lat ?? null,
         lon: lon ?? null,
         is_public: profile?.is_public_visits ?? false,
         display_name: profile?.display_name ?? 'Explorateur',
         avatar_emoji: profile?.avatar_emoji ?? '🧭',
         points_earned: xpAmount,
       });

       if (error) { setStatus('error'); return; }

       await supabase.rpc('award_xp', { p_xp: xpAmount });
       addXP(xpAmount);
        
       toast.success("Check-in réussi !", {
         description: `Tu as gagné ${xpAmount} XP à ${placeName}`
       });

       setRecentCount((prev) => (prev ?? 0) + 1);
       setStatus('done');

    }, (err) => {
       alert("Erreur GPS : Impossible de vérifier ta position.");
       setStatus('idle');
    }, { enableHighAccuracy: true });
  }

  if (status === 'checking') {
    return (
      <div style={{ height: 64, background: 'var(--cream-2)', borderRadius: 24, animation: 'pulse 2s infinite' }} />
    );
  }

  if (status === 'already' || status === 'done') {
    return (
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        style={{ 
          display: 'flex', alignItems: 'center', gap: 14, 
          background: 'color-mix(in oklab, var(--green) 10%, transparent)', 
          border: '1.5px solid color-mix(in oklab, var(--green) 20%, transparent)', 
          borderRadius: 24, padding: '14px 20px' 
        }}
      >
        <div style={{ 
          width: 40, height: 40, borderRadius: 14, background: 'var(--green)', 
          display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: 20
        }}>
          {status === 'done' ? '✨' : '✓'}
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 13, fontWeight: 900, color: 'var(--green)', textTransform: 'uppercase', letterSpacing: 0.5 }}>
            {status === 'done' ? `Présence validée (+${xpAmount} XP) !` : 'Déjà visité aujourd\'hui'}
          </div>
          {recentCount !== null && (
            <div style={{ fontSize: 10, fontWeight: 700, opacity: 0.6, marginTop: 2 }}>
              👤 {recentCount} VISITEUR{recentCount > 1 ? 'S' : ''} CETTE SEMAINE
            </div>
          )}
        </div>
      </motion.div>
    );
  }

  if (status === 'error') {
    return (
      <Link href="/app/auth/signin" style={{ textDecoration: 'none' }}>
        <div style={{ 
          width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10,
          background: 'var(--cream-2)', color: 'var(--muted)', padding: '16px 20px', borderRadius: 24,
          border: '1.5px dashed var(--line)', fontSize: 13, fontWeight: 700
        }}>
          🔒 Connecte-toi pour marquer ta visite
        </div>
      </Link>
    );
  }

  return (
    <div style={{ position: 'relative' }}>
      <button
        onClick={handleCheckin}
        disabled={status === 'loading'}
        className="press"
        style={{
          width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 12,
          background: 'var(--orange)', color: '#fff', padding: '18px 0', borderRadius: 24,
          border: 'none', fontSize: 16, fontWeight: 900, cursor: 'pointer',
          boxShadow: '0 8px 24px rgba(242,108,26,0.25)', 
          textTransform: 'uppercase', letterSpacing: 0.5,
          position: 'relative', overflow: 'hidden'
        }}
      >
        <div className="wax-bg" style={{ position: 'absolute', inset: 0, opacity: 0.15, pointerEvents: 'none' }} />
        
        {status === 'loading' ? (
          <motion.div 
            animate={{ rotate: 360 }}
            transition={{ repeat: Infinity, duration: 1, ease: "linear" }}
            style={{ width: 22, height: 22, border: '3px solid rgba(255,255,255,0.3)', borderTopColor: '#fff', borderRadius: '50%' }} 
          />
        ) : (
          <span style={{ fontSize: 20 }}>📍</span>
        )}
        <span style={{ position: 'relative', zIndex: 1 }}>
          {status === 'loading' ? 'Localisation...' : 'Je suis là 📍'}
        </span>
      </button>
      
      {/* Subtle hint */}
      {status === 'idle' && (
        <div style={{ textAlign: 'center', marginTop: 10, fontSize: 10, fontWeight: 700, opacity: 0.4, textTransform: 'uppercase', letterSpacing: 0.5 }}>
          Gagne +{xpAmount} XP en validant ta présence
          <HelpTip title="Check-in" content="Le check-in prouve ta présence physique sur un lieu grâce au GPS. Cela te rapporte de l'XP et aide la communauté à savoir quels lieux sont fréquentés." />
        </div>
      )}
    </div>
  );
}
