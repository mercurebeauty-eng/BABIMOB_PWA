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
        className={`w-16 h-16 rounded-3xl flex items-center justify-center text-2xl shadow-2xl transition-all active:scale-90 ${
          canBroadcast
            ? 'bg-abidjan-orange text-white shadow-abidjan-orange/40 ring-4 ring-white'
            : 'bg-white text-beige-muted border-2 border-beige-100 shadow-xl'
        }`}
        style={{ background: canBroadcast ? 'var(--orange)' : 'white' }}
        title={canBroadcast ? 'Diffuser ma position' : 'Diffuser ma position (Pro)'}
      >
        <div className="relative">
          <Ic.Send s={28} />
          {!canBroadcast && (
            <span className="absolute -top-4 -right-4 text-[9px] bg-abidjan-orange text-white px-2 py-1 rounded-full font-black border-2 border-white shadow-sm"
                  style={{ background: 'var(--orange)' }}>
              PRO
            </span>
          )}
        </div>
      </button>

      {showModal && (
        <div 
          className="fixed inset-0 z-[1000] flex items-center justify-center p-5 bg-ink/60 backdrop-blur-xl animate-in fade-in duration-300" 
          style={{ background: 'rgba(26,20,16,0.6)' }}
          onClick={() => !loading && setShowModal(false)}
        >
          <div 
            className="w-full max-w-sm bg-white rounded-[2.5rem] p-8 shadow-[0_20px_50px_rgba(0,0,0,0.3)] space-y-6 border border-white/20" 
            onClick={e => e.stopPropagation()}
          >
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-2xl flex items-center justify-center text-2xl shadow-inner"
                   style={{ background: 'var(--cream-2)', color: 'var(--orange)' }}>
                <Ic.Send s={24} />
              </div>
              <div>
                <div className="text-lg font-black uppercase tracking-tight text-beige-text" style={{ color: 'var(--ink)', fontFamily: 'var(--font-archivo-black)' }}>Diffuser un statut</div>
                <div className="text-[11px] text-beige-muted font-bold uppercase tracking-widest opacity-60">Visible sur la carte · 4h</div>
              </div>
            </div>

            <textarea
              value={text}
              onChange={e => setText(e.target.value.slice(0, 80))}
              placeholder="Ex : Venez me rejoindre au maquis !"
              rows={3}
              className="w-full bg-cream-2 border-2 border-transparent focus:border-abidjan-orange rounded-[1.5rem] px-5 py-4 text-base font-bold outline-none resize-none transition-all placeholder:opacity-30"
              style={{ background: 'var(--cream-2)', color: 'var(--ink)' }}
              autoFocus
            />
            <div className="text-right text-[11px] text-beige-muted font-black -mt-2 opacity-40">
              {text.length}/80
            </div>

            {geoError && (
              <p className="text-[12px] text-red-500 font-bold bg-red-50 p-3 rounded-2xl border border-red-100 flex items-center gap-2">
                <span>⚠️</span> {geoError}
              </p>
            )}

            {success ? (
              <div className="py-4 text-center text-base font-black text-abidjan-green uppercase tracking-widest animate-bounce"
                   style={{ color: 'var(--green)' }}>
                ✓ Diffusé avec succès !
              </div>
            ) : (
              <div className="flex gap-4">
                <button
                  onClick={() => setShowModal(false)}
                  disabled={loading}
                  className="flex-1 py-4 rounded-2xl border-2 border-beige-200 text-[11px] font-black uppercase tracking-widest text-beige-muted hover:bg-beige-50 transition-all active:scale-95"
                >
                  Annuler
                </button>
                <button
                  onClick={handleSend}
                  disabled={!text.trim() || loading}
                  className="flex-[1.5] py-4 rounded-2xl bg-abidjan-orange text-white text-[11px] font-black uppercase tracking-widest shadow-xl shadow-abidjan-orange/30 disabled:opacity-30 active:scale-95 transition-all"
                  style={{ background: 'var(--orange)' }}
                >
                  {loading ? (
                    <span className="flex items-center justify-center gap-3">
                      <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
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
