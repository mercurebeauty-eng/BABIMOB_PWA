'use client';

import { useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Ic } from '@/components/ui/Ic';

type Props = {
  userId: string;
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
    </>
  );
}
