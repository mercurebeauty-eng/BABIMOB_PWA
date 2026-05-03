'use client';

import { useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Ic } from '@/components/ui/Ic';

const PRESETS = [
  { text: 'Je suis là 🎯', emoji: '🎯' },
  { text: 'En route 🚐', emoji: '🚐' },
  { text: "J'attends ici ⏳", emoji: '⏳' },
  { text: 'Qui join ? 🤝', emoji: '🤝' },
  { text: 'Au maquis 🍺', emoji: '🍺' },
  { text: 'Besoin de transport 🙋', emoji: '🙋' },
];

type Props = {
  userId: string;
  currentTier?: string;
  isAdmin?: boolean;
  customTrigger?: React.ReactNode;
};

export default function BroadcastButton({ userId, customTrigger }: Props) {
  const supabase = createClient();
  const [showModal, setShowModal] = useState(false);
  const [text, setText] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [geoError, setGeoError] = useState<string | null>(null);

  function handleOpen() {
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

        setLoading(false);
        if (error) {
          setGeoError("Erreur lors de l'envoi. Réessaie plus tard.");
        } else {
          setSuccess(true);
          setTimeout(() => setShowModal(false), 1800);
        }
      },
      (err) => {
        setLoading(false);
        setGeoError(
          err.code === 1
            ? 'Localisation refusée — active le GPS et réessaie.'
            : "Impossible d'obtenir ta position."
        );
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  }

  return (
    <>
      {customTrigger ? (
        <div onClick={handleOpen} style={{ cursor: 'pointer', display: 'inline-block' }}>
          {customTrigger}
        </div>
      ) : (
        <button
          onClick={handleOpen}
          className="press"
          style={{
            width: '100%',
            background: 'var(--orange)',
            color: '#fff',
            border: 'none',
            borderRadius: 20,
            padding: '14px 20px',
            display: 'flex',
            alignItems: 'center',
            gap: 12,
            cursor: 'pointer',
            boxShadow: '0 8px 24px rgba(242,108,26,0.3)',
          }}
        >
          <div style={{
            width: 36, height: 36, borderRadius: 12,
            background: 'rgba(255,255,255,0.2)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <Ic.Send s={18} color="#fff" />
          </div>
          <div style={{ flex: 1, textAlign: 'left' }}>
            <div style={{ fontSize: 13, fontWeight: 900, letterSpacing: 0.5 }}>DIFFUSER MON STATUT</div>
            <div style={{ fontSize: 10, fontWeight: 700, opacity: 0.75, letterSpacing: 0.5 }}>Visible sur la carte · 4h</div>
          </div>
          <Ic.Arrow s={16} dir="right" color="rgba(255,255,255,0.7)" />
        </button>
      )}

      {showModal && (
        <div
          style={{
            position: 'fixed', inset: 0, zIndex: 10001,
            display: 'flex', alignItems: 'flex-end', justifyContent: 'center',
            background: 'rgba(26,20,16,0.65)', backdropFilter: 'blur(8px)',
          }}
          onClick={() => !loading && setShowModal(false)}
        >
          <div
            style={{
              width: '100%', maxWidth: 480,
              background: 'var(--cream)',
              borderRadius: '32px 32px 0 0',
              padding: '8px 24px 40px',
              boxShadow: '0 -20px 60px rgba(0,0,0,0.2)',
            }}
            onClick={e => e.stopPropagation()}
          >
            {/* Drag handle */}
            <div style={{ width: 40, height: 4, borderRadius: 2, background: 'var(--line)', margin: '12px auto 24px' }} />

            <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 24 }}>
              <div style={{
                width: 48, height: 48, borderRadius: 16,
                background: 'var(--orange)', display: 'flex',
                alignItems: 'center', justifyContent: 'center',
              }}>
                <Ic.Send s={22} color="#fff" />
              </div>
              <div>
                <div style={{ fontSize: 17, fontWeight: 900, color: 'var(--ink)' }}>Diffuser un statut</div>
                <div style={{ fontSize: 11, fontWeight: 800, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: 1 }}>Visible sur la carte · 4h</div>
              </div>
            </div>

            {/* Preset quick-picks */}
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 20 }}>
              {PRESETS.map(preset => (
                <button
                  key={preset.text}
                  onClick={() => setText(preset.text)}
                  className="press"
                  style={{
                    background: text === preset.text ? 'var(--orange)' : 'var(--cream-2)',
                    color: text === preset.text ? '#fff' : 'var(--ink)',
                    border: `1.5px solid ${text === preset.text ? 'var(--orange)' : 'var(--line)'}`,
                    borderRadius: 20,
                    padding: '8px 14px',
                    fontSize: 13,
                    fontWeight: 800,
                    cursor: 'pointer',
                    transition: 'all 0.15s',
                  }}
                >
                  {preset.text}
                </button>
              ))}
            </div>

            <textarea
              value={text}
              onChange={e => setText(e.target.value.slice(0, 80))}
              placeholder="Ou écris ton statut perso…"
              rows={3}
              style={{
                width: '100%', boxSizing: 'border-box',
                background: 'var(--cream-2)',
                border: '2px solid var(--line)',
                borderRadius: 20,
                padding: '14px 18px',
                fontSize: 15,
                fontWeight: 600,
                color: 'var(--ink)',
                outline: 'none',
                resize: 'none',
                fontFamily: 'inherit',
              }}
              autoFocus
            />
            <div style={{ textAlign: 'right', fontSize: 11, fontWeight: 900, color: 'var(--muted)', opacity: 0.5, marginTop: 6, marginBottom: 16 }}>
              {text.length}/80
            </div>

            {geoError && (
              <div style={{
                background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)',
                borderRadius: 16, padding: '12px 16px', marginBottom: 16,
                fontSize: 12, fontWeight: 700, color: '#dc2626',
                display: 'flex', gap: 8, alignItems: 'center',
              }}>
                <span>⚠️</span> {geoError}
              </div>
            )}

            {success ? (
              <div style={{ textAlign: 'center', padding: '16px 0', fontSize: 15, fontWeight: 900, color: 'var(--green)', letterSpacing: 1 }}>
                ✓ Diffusé avec succès !
              </div>
            ) : (
              <div style={{ display: 'flex', gap: 12 }}>
                <button
                  onClick={() => setShowModal(false)}
                  disabled={loading}
                  className="press"
                  style={{
                    flex: 1, padding: '16px', borderRadius: 20,
                    border: '2px solid var(--line)', background: 'transparent',
                    fontSize: 13, fontWeight: 900, color: 'var(--muted)',
                    cursor: 'pointer',
                  }}
                >
                  Annuler
                </button>
                <button
                  onClick={handleSend}
                  disabled={!text.trim() || loading}
                  className="press"
                  style={{
                    flex: 2, padding: '16px', borderRadius: 20,
                    background: 'var(--orange)', border: 'none', color: '#fff',
                    fontSize: 13, fontWeight: 900, letterSpacing: 0.5,
                    cursor: 'pointer',
                    boxShadow: '0 8px 24px rgba(242,108,26,0.3)',
                    opacity: (!text.trim() || loading) ? 0.4 : 1,
                  }}
                >
                  {loading ? (
                    <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
                      <span style={{ width: 14, height: 14, border: '2px solid rgba(255,255,255,0.4)', borderTopColor: '#fff', borderRadius: '50%', display: 'inline-block', animation: 'spin 0.7s linear infinite' }} />
                      GPS…
                    </span>
                  ) : 'DIFFUSER'}
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}
