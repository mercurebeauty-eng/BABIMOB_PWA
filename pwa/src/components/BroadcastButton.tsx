'use client';

import { useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Ic } from '@/components/ui/Ic';
import PremiumWall from './PremiumWall';

type Props = {
  userId: string;
  currentTier: 'free' | 'messenger' | 'social' | 'pro' | 'elite';
  isAdmin?: boolean;
};

export default function BroadcastButton({ userId, currentTier, isAdmin = false }: Props) {
  const supabase = createClient();
  const [showWall, setShowWall] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [text, setText] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [geoError, setGeoError] = useState<string | null>(null);

  const canBroadcast = isAdmin || currentTier === 'pro' || currentTier === 'elite';

  function handleOpen() {
    if (!canBroadcast) {
      setShowWall(true);
      return;
    }
    setText('');
    setGeoError(null);
    setSuccess(false);
    setShowModal(true);
  }

  async function handleSend() {
    if (!text.trim() || loading) return;
    setLoading(true);
    setGeoError(null);

    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const { error } = await supabase.from('profiles').update({
          last_broadcast_at: new Date().toISOString(),
          broadcast_text: text.trim(),
          broadcast_lat: pos.coords.latitude,
          broadcast_lon: pos.coords.longitude,
        }).eq('id', userId);

        if (error) {
          setGeoError("Erreur lors de l'envoi. Réessaie plus tard.");
          setLoading(false);
        } else {
          setLoading(false);
          setSuccess(true);
          setTimeout(() => setShowModal(false), 1800);
        }
      },
      (err) => {
        setLoading(false);
        if (err.code === 1) {
          setGeoError('Localisation refusée — active le GPS et réessaie.');
        } else {
          setGeoError('Impossible d\'obtenir ta position.');
        }
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  }

  return (
    <>
      <button
        onClick={handleOpen}
        className={`w-14 h-14 rounded-2xl flex items-center justify-center text-2xl shadow-xl transition-all active:scale-95 ${
          canBroadcast
            ? 'bg-abidjan-orange text-white shadow-abidjan-orange/30 animate-pulse'
            : 'bg-white text-beige-muted border-2 border-beige-100'
        }`}
        title={canBroadcast ? 'Diffuser ma position' : 'Diffuser ma position (Pro)'}
      >
        <div className="relative">
          <Ic.Send s={24} />
          {!canBroadcast && (
            <span className="absolute -top-3 -right-3 text-[8px] bg-abidjan-orange text-white px-1.5 py-0.5 rounded-full font-black">
              PRO
            </span>
          )}
        </div>
      </button>

      {showModal && (
        <div 
          className="fixed inset-0 z-[700] flex items-center justify-center p-5 bg-black/40 backdrop-blur-sm" 
          onClick={() => !loading && setShowModal(false)}
        >
          <div 
            className="w-full max-w-sm bg-white rounded-[2.5rem] p-6 shadow-2xl space-y-4" 
            onClick={e => e.stopPropagation()}
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-abidjan-orange/10 text-abidjan-orange flex items-center justify-center text-xl">
                <Ic.Send s={20} />
              </div>
              <div>
                <div className="text-sm font-black uppercase tracking-widest text-beige-text">Diffuser un statut</div>
                <div className="text-[10px] text-beige-muted font-bold uppercase tracking-widest">Visible sur la carte · 4h</div>
              </div>
            </div>

            <textarea
              value={text}
              onChange={e => setText(e.target.value.slice(0, 80))}
              placeholder="Ex : Venez me rejoindre au maquis !"
              rows={3}
              className="w-full bg-beige-50 border-2 border-beige-100 focus:border-abidjan-orange rounded-2xl px-4 py-3 text-sm font-medium outline-none resize-none transition-all"
              autoFocus
            />
            <div className="text-right text-[10px] text-beige-muted font-bold -mt-2">
              {text.length}/80
            </div>

            {geoError && (
              <p className="text-[11px] text-red-500 font-bold bg-red-50 p-2 rounded-lg border border-red-100">
                ⚠️ {geoError}
              </p>
            )}

            {success ? (
              <div className="py-2 text-center text-sm font-black text-abidjan-green uppercase tracking-widest animate-bounce">
                ✓ Diffusé avec succès !
              </div>
            ) : (
              <div className="flex gap-3">
                <button
                  onClick={() => setShowModal(false)}
                  disabled={loading}
                  className="flex-1 py-3 rounded-2xl border-2 border-beige-200 text-[10px] font-black uppercase tracking-widest text-beige-muted hover:bg-beige-50 transition-all"
                >
                  Annuler
                </button>
                <button
                  onClick={handleSend}
                  disabled={!text.trim() || loading}
                  className="flex-2 py-3 rounded-2xl bg-abidjan-orange text-white text-[10px] font-black uppercase tracking-widest shadow-lg shadow-abidjan-orange/20 disabled:opacity-50 active:scale-95 transition-all"
                >
                  {loading ? (
                    <span className="flex items-center justify-center gap-2">
                      <span className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      GPS...
                    </span>
                  ) : 'Diffuser'}
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      <PremiumWall isOpen={showWall} onClose={() => setShowWall(false)} requiredTier="pro" />
    </>
  );
}
