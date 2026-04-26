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
  const [showModal, setShowModal] = useState(false);
  const [text, setText] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [geoError, setGeoError] = useState<string | null>(null);
  const isPro = currentTier === 'pro';

  function open() {
    if (!isPro) { setShowWall(true); return; }
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
        await supabase.from('profiles').update({
          last_broadcast_at: new Date().toISOString(),
          broadcast_text: text.trim(),
          broadcast_lat: pos.coords.latitude,
          broadcast_lon: pos.coords.longitude,
        }).eq('id', userId);
        setLoading(false);
        setSuccess(true);
        setTimeout(() => setShowModal(false), 1800);
      },
      () => {
        setLoading(false);
        setGeoError('Localisation refusée — active le GPS et réessaie.');
      }
    );
  }

  return (
    <>
      <button
        onClick={open}
        className={`flex-shrink-0 flex items-center gap-2 px-5 py-3 rounded-2xl bm-glass border border-white/20 transition-all active:scale-95 ${
          isPro
            ? 'bg-abidjan-orange text-white shadow-abidjan-orange/30'
            : 'text-abidjan-blue'
        }`}
        title="Diffuser ma position (Pro)"
      >
        <span className="text-xl">📢</span>
        <span className="text-[10px] font-black uppercase tracking-widest">
          {isPro ? 'Live' : 'Pro'}
        </span>
      </button>

      {showModal && (
        <div className="fixed inset-0 z-[700] flex items-center justify-center p-5 bg-black/40 backdrop-blur-sm" onClick={() => !loading && setShowModal(false)}>
          <div className="w-full max-w-sm bg-white/90 backdrop-blur-xl rounded-[2rem] p-6 shadow-2xl space-y-4 border border-white/50" onClick={e => e.stopPropagation()}>
            <div className="flex items-center gap-3">
              <span className="text-2xl">📢</span>
              <div>
                <div className="text-sm font-black uppercase tracking-widest text-beige-text">Diffuser un statut</div>
                <div className="text-[10px] text-beige-muted font-bold uppercase tracking-widest">Visible sur la carte</div>
              </div>
            </div>

            <textarea
              value={text}
              onChange={e => setText(e.target.value.slice(0, 80))}
              placeholder="Ex : Venez me rejoindre au café !"
              rows={3}
              className="w-full bg-white/50 border-2 border-beige-100 focus:border-abidjan-orange rounded-2xl px-4 py-3 text-sm font-medium outline-none resize-none transition-all"
            />
            <div className="text-right text-[10px] text-beige-muted font-bold -mt-2">{text.length}/80</div>

            {geoError && <p className="text-xs text-red-500 font-bold">{geoError}</p>}

            {success ? (
              <div className="py-3 text-center text-sm font-black text-abidjan-green uppercase tracking-widest">
                ✓ Diffusé sur la carte !
              </div>
            ) : (
              <div className="flex gap-3">
                <button
                  onClick={() => setShowModal(false)}
                  disabled={loading}
                  className="flex-1 py-3 rounded-2xl border-2 border-beige-200 text-xs font-black uppercase tracking-widest text-beige-muted hover:bg-beige-50 transition-all"
                >
                  Annuler
                </button>
                <button
                  onClick={handleSend}
                  disabled={!text.trim() || loading}
                  className="flex-1 py-3 rounded-2xl bg-abidjan-orange text-white text-xs font-black uppercase tracking-widest shadow-lg shadow-abidjan-orange/20 disabled:opacity-50 active:scale-95 transition-all"
                >
                  {loading ? (
                    <span className="flex items-center justify-center gap-2">
                      <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      GPS…
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
