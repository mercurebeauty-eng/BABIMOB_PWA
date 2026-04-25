'use client';

import { useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import PremiumWall from './PremiumWall';

type Props = {
  userId: string;
  currentTier: 'free' | 'messenger' | 'social' | 'pro';
};

export default function BroadcastButton({ userId, currentTier }: Props) {
  const supabase = createClient();
  const [showWall, setShowWall] = useState(false);
  const [isBroadcasting, setIsBroadcasting] = useState(false);
  const isPro = currentTier === 'pro';

  async function handleBroadcast() {
    if (!isPro) {
      setShowWall(true);
      return;
    }

    const text = prompt("Que veux-tu dire à tes abonnés ? (ex: Venez me voir au café !)");
    if (!text) return;

    setIsBroadcasting(true);
    
    navigator.geolocation.getCurrentPosition(async (pos) => {
      await supabase
        .from('profiles')
        .update({ 
          last_broadcast_at: new Date().toISOString(),
          broadcast_text: text,
          broadcast_lat: pos.coords.latitude,
          broadcast_lon: pos.coords.longitude
        })
        .eq('id', userId);
      
      alert("C'est diffusé ! Ton statut est visible sur la carte.");
      setIsBroadcasting(false);
    }, () => {
      alert("Erreur de localisation. Impossible de diffuser sans position.");
      setIsBroadcasting(false);
    });
  }

  return (
    <>
      <button 
        onClick={handleBroadcast}
        className={`w-14 h-14 rounded-2xl flex items-center justify-center text-2xl shadow-xl transition-all active:scale-95 ${
          isPro 
          ? 'bg-abidjan-orange text-white shadow-abidjan-orange/30 animate-pulse' 
          : 'bg-white text-beige-muted border-2 border-beige-100'
        }`}
        title="Diffuser ma position (Pro)"
      >
        <span className="relative">
          📢
          {!isPro && <span className="absolute -top-2 -right-2 text-[10px] bg-abidjan-orange text-white px-1 rounded-md">PRO</span>}
        </span>
      </button>

      <PremiumWall 
        isOpen={showWall} 
        onClose={() => setShowWall(false)} 
        requiredTier="pro" 
      />
    </>
  );
}
