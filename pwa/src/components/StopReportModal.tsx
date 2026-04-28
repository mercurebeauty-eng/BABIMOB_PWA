'use client';

import { useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Ic } from '@/components/ui/Ic';

type Category = 'trafic' | 'tarif' | 'ambiance' | 'incident' | 'travaux';

const CATEGORIES: { id: Category; label: string; emoji: string; color: string; expireH: number }[] = [
  { id: 'trafic',   label: 'Trafic',   emoji: '🚦', color: 'var(--orange-deep)', expireH: 2  },
  { id: 'tarif',    label: 'Tarif',    emoji: '💰', color: 'var(--green)',        expireH: 6  },
  { id: 'incident', label: 'Incident', emoji: '⚠️', color: 'var(--orange)',       expireH: 2  },
  { id: 'travaux',  label: 'Travaux',  emoji: '🚧', color: 'var(--gold)',         expireH: 48 },
  { id: 'ambiance', label: 'Ambiance', emoji: '✨', color: 'var(--blue)',         expireH: 4  },
];

type Props = {
  stopId: string;
  stopName: string;
  userId: string;
  displayName: string | null;
  onClose: () => void;
  onSuccess: () => void;
};

export default function StopReportModal({ stopId, stopName, userId, displayName, onClose, onSuccess }: Props) {
  const supabase = createClient();
  const [category, setCategory] = useState<Category>('trafic');
  const [content, setContent] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const selectedCat = CATEGORIES.find(c => c.id === category)!;

  async function handleSubmit() {
    if (!content.trim() || loading) return;
    setLoading(true);
    setError(null);

    const expiresAt = new Date(Date.now() + selectedCat.expireH * 3600 * 1000).toISOString();

    const { error: err } = await supabase.from('stop_reports').insert({
      stop_id: stopId,
      user_id: userId,
      display_name: displayName ?? 'Un Babi',
      category,
      content: content.trim(),
      expires_at: expiresAt,
    });

    setLoading(false);

    if (err) {
      setError('Erreur lors de l\'envoi. Réessaie.');
      return;
    }

    setSuccess(true);
    setTimeout(() => { onSuccess(); onClose(); }, 1800);
  }

  return (
    <div
      onClick={() => !loading && onClose()}
      style={{ position: 'fixed', inset: 0, zIndex: 900, background: 'rgba(26,20,16,0.55)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'flex-end' }}
    >
      <div
        onClick={e => e.stopPropagation()}
        style={{ width: '100%', maxWidth: 480, margin: '0 auto', background: 'var(--cream-2)', borderRadius: '24px 24px 0 0', padding: '24px 20px calc(32px + env(safe-area-inset-bottom, 0px))', boxShadow: '0 -8px 40px rgba(0,0,0,0.2)' }}
      >
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
          <div style={{ width: 40, height: 40, borderRadius: 12, background: 'color-mix(in oklab, var(--orange) 15%, transparent)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--orange)' }}>
            <Ic.Pin s={20} fill />
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 14, fontWeight: 900, color: 'var(--ink)', textTransform: 'uppercase', letterSpacing: 0.5 }}>J'étais ici</div>
            <div style={{ fontSize: 11, color: 'var(--muted)', fontWeight: 700, marginTop: 1 }}>{stopName}</div>
          </div>
          <button onClick={onClose} style={{ padding: 6, background: 'none', border: 'none', cursor: 'pointer', color: 'var(--muted)' }}>
            <Ic.X s={20} />
          </button>
        </div>

        {success ? (
          <div style={{ textAlign: 'center', padding: '24px 0', color: 'var(--green)' }}>
            <div style={{ fontSize: 42, marginBottom: 10 }}>✓</div>
            <div style={{ fontSize: 15, fontWeight: 900, textTransform: 'uppercase', letterSpacing: 0.5 }}>Merci, Babi !</div>
            <div style={{ fontSize: 12, color: 'var(--muted)', marginTop: 6 }}>Ton signalement aide la communauté.</div>
          </div>
        ) : (
          <>
            {/* Category picker */}
            <div style={{ fontSize: 11, fontWeight: 800, color: 'var(--muted)', letterSpacing: 0.7, textTransform: 'uppercase', marginBottom: 10 }}>Type de signalement</div>
            <div style={{ display: 'flex', gap: 8, marginBottom: 18, flexWrap: 'wrap' }}>
              {CATEGORIES.map(cat => (
                <button
                  key={cat.id}
                  onClick={() => setCategory(cat.id)}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 6, padding: '8px 12px', borderRadius: 99,
                    border: category === cat.id ? 'none' : '1.5px solid var(--line)',
                    background: category === cat.id ? cat.color : 'transparent',
                    color: category === cat.id ? '#fff' : 'var(--ink)',
                    fontSize: 12, fontWeight: 700, cursor: 'pointer',
                  }}
                >
                  <span>{cat.emoji}</span> {cat.label}
                </button>
              ))}
            </div>

            {/* Expiry hint */}
            <div style={{ fontSize: 10, color: 'var(--muted)', fontWeight: 700, marginBottom: 12 }}>
              Ce signalement expirera dans <span style={{ color: selectedCat.color, fontWeight: 900 }}>{selectedCat.expireH}h</span> automatiquement.
            </div>

            {/* Text area */}
            <textarea
              value={content}
              onChange={e => setContent(e.target.value.slice(0, 140))}
              placeholder={
                category === 'trafic'   ? 'Ex: Bouchon sens Plateau depuis 30min…' :
                category === 'tarif'    ? 'Ex: Gbaka pour Yop demande 250F ce soir…' :
                category === 'incident' ? 'Ex: Accident au carrefour, évitez ce côté…' :
                category === 'travaux'  ? 'Ex: Travaux de voirie côté marché…' :
                                          'Ex: Gare propre et bien organisée ce matin…'
              }
              rows={3}
              style={{ width: '100%', background: 'var(--cream)', border: '1.5px solid var(--line)', borderRadius: 14, padding: '12px 14px', fontSize: 14, fontWeight: 500, color: 'var(--ink)', outline: 'none', resize: 'none', fontFamily: 'inherit', boxSizing: 'border-box' }}
              autoFocus
            />
            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 6, marginBottom: 16 }}>
              <span style={{ fontSize: 10, color: 'var(--muted)', fontWeight: 700 }}>{content.length}/140</span>
              {error && <span style={{ fontSize: 11, color: '#e53935', fontWeight: 700 }}>{error}</span>}
            </div>

            {/* Actions */}
            <div style={{ display: 'flex', gap: 10 }}>
              <button
                onClick={onClose}
                style={{ flex: 1, padding: '13px 0', borderRadius: 14, border: '1.5px solid var(--line)', background: 'transparent', color: 'var(--muted)', fontSize: 13, fontWeight: 800, cursor: 'pointer' }}
              >
                Annuler
              </button>
              <button
                onClick={handleSubmit}
                disabled={!content.trim() || loading}
                style={{
                  flex: 2, padding: '13px 0', borderRadius: 14, border: 'none',
                  background: content.trim() && !loading ? selectedCat.color : 'var(--line)',
                  color: content.trim() && !loading ? '#fff' : 'var(--muted)',
                  fontSize: 13, fontWeight: 900, cursor: content.trim() && !loading ? 'pointer' : 'default',
                  textTransform: 'uppercase', letterSpacing: 0.5,
                }}
              >
                {loading ? '…' : 'Signaler'}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
