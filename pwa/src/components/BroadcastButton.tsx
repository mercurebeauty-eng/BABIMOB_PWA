'use client';

import { useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Ic } from '@/components/ui/Ic';

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

  function open() {
    if (!canBroadcast) { setShowWall(true); return; }
    setText('');
    setGeoError(null);
    setSuccess(false);
    setShowModal(true);
  }

  async function handleSend() {
    if (!text.trim() || loading) return;
    setLoading(true);
    setGeoError(null);

  canBroadcast: boolean;
  onBroadcast?: () => void;
};

export default function BroadcastButton({ userId, canBroadcast, onBroadcast }: Props) {
  const supabase = createClient();
  const [open, setOpen] = useState(false);
  const [text, setText] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function handleOpen() {
    setText('');
    setError(null);
    setSuccess(false);
    setOpen(true);
  }

  async function handleSend() {
    if (!text.trim() || loading) return;
    setLoading(true);
    setError(null);
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
        onBroadcast?.();
        setTimeout(() => setOpen(false), 1600);
      },
      () => {
        setLoading(false);
        setError('GPS refusé — active la localisation et réessaie.');
      }
    );
  }

  return (
    <>
      <button
        onClick={open}
        className={`w-14 h-14 rounded-2xl flex items-center justify-center text-2xl shadow-xl transition-all active:scale-95 ${
          canBroadcast
            ? 'bg-abidjan-orange text-white shadow-abidjan-orange/30 animate-pulse'
            : 'bg-white text-beige-muted border-2 border-beige-100'
        }`}
        title={canBroadcast ? 'Diffuser ma position' : 'Diffuser ma position (Pro)'}
      >
        <span className="relative">
          📢
          {!canBroadcast && <span className="absolute -top-2 -right-2 text-[10px] bg-abidjan-orange text-white px-1 rounded-md">PRO</span>}
        </span>
      </button>

      {showModal && (
        <div className="fixed inset-0 z-[700] flex items-center justify-center p-5 bg-black/40 backdrop-blur-sm" onClick={() => !loading && setShowModal(false)}>
          <div className="w-full max-w-sm bg-white rounded-[2rem] p-6 shadow-2xl space-y-4" onClick={e => e.stopPropagation()}>
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
              className="w-full bg-beige-50 border-2 border-beige-100 focus:border-abidjan-orange rounded-2xl px-4 py-3 text-sm font-medium outline-none resize-none transition-all"
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
        onClick={handleOpen}
        title={canBroadcast ? 'Diffuser ma position' : 'Diffuser (Pro)'}
        style={{
          width: 44, height: 44, borderRadius: 14, border: 'none',
          background: canBroadcast ? 'var(--orange)' : 'var(--cream)',
          color: canBroadcast ? 'white' : 'var(--muted)',
          boxShadow: canBroadcast ? '0 4px 16px rgba(242,108,26,0.35)' : '0 2px 8px rgba(0,0,0,0.08)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          cursor: 'pointer', flexShrink: 0, position: 'relative',
          animation: canBroadcast ? 'bm-pulse-slow 3s ease-in-out infinite' : 'none',
        }}
      >
        <Ic.Send s={18} />
        {!canBroadcast && (
          <span style={{
            position: 'absolute', top: -4, right: -4,
            background: 'var(--orange)', color: 'white',
            fontSize: 7, fontWeight: 900, borderRadius: 4, padding: '1px 3px',
            textTransform: 'uppercase', letterSpacing: 0.3,
          }}>PRO</span>
        )}
      </button>

      {open && (
        <div
          onClick={() => !loading && setOpen(false)}
          style={{ position: 'fixed', inset: 0, zIndex: 800, background: 'rgba(26,20,16,0.5)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'flex-end' }}
        >
          <div
            onClick={e => e.stopPropagation()}
            style={{ width: '100%', maxWidth: 480, margin: '0 auto', background: 'var(--cream-2)', borderRadius: '24px 24px 0 0', padding: '24px 20px calc(32px + env(safe-area-inset-bottom, 0px))', boxShadow: '0 -8px 40px rgba(0,0,0,0.2)' }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
              <div style={{ width: 40, height: 40, borderRadius: 12, background: 'color-mix(in oklab, var(--orange) 15%, transparent)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--orange)' }}>
                <Ic.Send s={20} />
              </div>
              <div>
                <div style={{ fontSize: 14, fontWeight: 900, color: 'var(--ink)', textTransform: 'uppercase', letterSpacing: 0.5 }}>Diffuser un statut</div>
                <div style={{ fontSize: 10, color: 'var(--muted)', fontWeight: 700, marginTop: 1 }}>Visible sur la carte · 4 heures</div>
              </div>
            </div>

            {!canBroadcast ? (
              <div style={{ textAlign: 'center', padding: '20px 0 4px' }}>
                <div style={{ fontSize: 36, marginBottom: 12 }}>🔒</div>
                <div style={{ fontSize: 15, fontWeight: 800, color: 'var(--ink)', marginBottom: 6 }}>Fonctionnalité Pro</div>
                <div style={{ fontSize: 12, color: 'var(--muted)', lineHeight: 1.5 }}>Passe à BabiMob Pro pour diffuser ta position en direct sur la carte.</div>
              </div>
            ) : success ? (
              <div style={{ textAlign: 'center', padding: '20px 0', color: 'var(--green)' }}>
                <div style={{ fontSize: 36, marginBottom: 8 }}>✓</div>
                <div style={{ fontSize: 14, fontWeight: 900, textTransform: 'uppercase', letterSpacing: 0.5 }}>Diffusé sur la carte !</div>
              </div>
            ) : (
              <>
                <textarea
                  value={text}
                  onChange={e => setText(e.target.value.slice(0, 80))}
                  placeholder="Ex: Je suis au marché de Cocody !"
                  rows={3}
                  style={{ width: '100%', background: 'white', border: '1.5px solid var(--line)', borderRadius: 14, padding: '12px 14px', fontSize: 14, fontWeight: 500, color: 'var(--ink)', outline: 'none', resize: 'none', fontFamily: 'inherit', boxSizing: 'border-box' }}
                  autoFocus
                />
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 6, marginBottom: 14 }}>
                  <span style={{ fontSize: 10, color: 'var(--muted)', fontWeight: 700 }}>{text.length}/80</span>
                  {error && <span style={{ fontSize: 11, color: '#e53935', fontWeight: 700 }}>{error}</span>}
                </div>
                <div style={{ display: 'flex', gap: 10 }}>
                  <button
                    onClick={() => setOpen(false)}
                    style={{ flex: 1, padding: '13px 0', borderRadius: 14, border: '1.5px solid var(--line)', background: 'transparent', color: 'var(--muted)', fontSize: 13, fontWeight: 800, cursor: 'pointer' }}
                  >
                    Annuler
                  </button>
                  <button
                    onClick={handleSend}
                    disabled={!text.trim() || loading}
                    style={{ flex: 2, padding: '13px 0', borderRadius: 14, border: 'none', background: text.trim() && !loading ? 'var(--orange)' : 'var(--line)', color: text.trim() && !loading ? 'white' : 'var(--muted)', fontSize: 13, fontWeight: 900, cursor: text.trim() && !loading ? 'pointer' : 'default', textTransform: 'uppercase', letterSpacing: 0.5 }}
                  >
                    {loading ? '…' : 'Diffuser'}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      <PremiumWall isOpen={showWall} onClose={() => setShowWall(false)} requiredTier="pro" />
    </>
  );
}
