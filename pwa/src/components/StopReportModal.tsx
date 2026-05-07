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

    // Reward XP logic: 10 XP per report, limit 5 per month
    const startOfMonth = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString();
    const { count: monthlyCount } = await supabase
      .from('stop_reports')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId)
      .gte('created_at', startOfMonth);

    const { error: err } = await supabase.from('stop_reports').insert({
      stop_id: stopId,
      user_id: userId,
      display_name: displayName ?? 'Un Babi',
      category,
      content: content.trim(),
      expires_at: expiresAt,
      xp_earned: (monthlyCount ?? 0) < 5 ? 10 : 0
    });

    if (!err && (monthlyCount ?? 0) < 5) {
      await supabase.rpc('award_xp', { p_xp: 10 });
    }

    setLoading(false);

    if (err) {
      console.error('Error inserting report:', err);
      setError('Erreur lors de l\'envoi. Réessaie.');
      return;
    }

    setSuccess(true);
    setTimeout(() => { onSuccess(); onClose(); }, 1800);
  }

  return (
    <div
      onClick={() => !loading && onClose()}
      style={{ 
        position: 'fixed', inset: 0, zIndex: 900, 
        background: 'rgba(26,20,16,0.6)', backdropFilter: 'blur(8px)', 
        display: 'flex', alignItems: 'flex-end',
        animation: 'fadeIn 0.3s ease-out'
      }}
    >
      <style jsx>{`
        @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
        @keyframes slideUp { from { transform: translateY(100%); } to { transform: translateY(0); } }
      `}</style>

      <div
        onClick={e => e.stopPropagation()}
        style={{ 
          width: '100%', maxWidth: 480, margin: '0 auto', 
          background: 'var(--cream-2)', borderRadius: '32px 32px 0 0', 
          padding: '24px 20px calc(32px + env(safe-area-inset-bottom, 0px))', 
          boxShadow: '0 -8px 40px rgba(0,0,0,0.25)',
          animation: 'slideUp 0.4s cubic-bezier(0.16, 1, 0.3, 1)'
        }}
      >
        {/* Handle bar */}
        <div style={{ width: 40, height: 4, background: 'var(--line-strong)', borderRadius: 2, margin: '0 auto 20px', opacity: 0.5 }} />

        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 24 }}>
          <div style={{ 
            width: 48, height: 48, borderRadius: 16, 
            background: 'var(--orange)', color: '#fff', 
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: '0 4px 12px rgba(242,108,26,0.2)'
          }}>
            <Ic.Pin s={24} fill />
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 16, fontWeight: 900, color: 'var(--ink)', textTransform: 'uppercase', letterSpacing: 0.5 }}>C&apos;comment ?</div>
            <div style={{ fontSize: 12, color: 'var(--muted)', fontWeight: 700, marginTop: 1 }}>{stopName}</div>
          </div>
          <button 
            onClick={onClose} 
            className="press"
            style={{ padding: 8, background: 'var(--line)', borderRadius: 12, border: 'none', cursor: 'pointer', color: 'var(--ink)' }}
          >
            <Ic.X s={20} />
          </button>
        </div>

        {success ? (
          <div style={{ textAlign: 'center', padding: '32px 0', animation: 'fadeIn 0.5s' }}>
            <div style={{ fontSize: 56, marginBottom: 12 }}>🙌</div>
            <div style={{ fontSize: 18, fontWeight: 900, textTransform: 'uppercase', letterSpacing: 1, color: 'var(--green)' }}>Merci, Babi !</div>
            <div style={{ fontSize: 13, color: 'var(--muted)', marginTop: 8, fontWeight: 600 }}>Ton signalement est maintenant en direct.</div>
          </div>
        ) : (
          <>
            {/* Category picker */}
            <div style={{ fontSize: 11, fontWeight: 800, color: 'var(--muted)', letterSpacing: 1, textTransform: 'uppercase', marginBottom: 12 }}>Choisis une catégorie</div>
            <div style={{ display: 'flex', gap: 10, marginBottom: 24, flexWrap: 'wrap' }}>
              {CATEGORIES.map(cat => (
                <button
                  key={cat.id}
                  onClick={() => setCategory(cat.id)}
                  className="press"
                  style={{
                    display: 'flex', alignItems: 'center', gap: 8, padding: '10px 16px', borderRadius: 14,
                    border: 'none',
                    background: category === cat.id ? cat.color : 'var(--cream)',
                    color: category === cat.id ? '#fff' : 'var(--ink)',
                    fontSize: 13, fontWeight: 800, cursor: 'pointer',
                    boxShadow: category === cat.id ? `0 4px 12px ${cat.color}40` : 'none',
                    transition: 'all 0.2s'
                  }}
                >
                  <span style={{ fontSize: 16 }}>{cat.emoji}</span> {cat.label}
                </button>
              ))}
            </div>

            {/* Input area */}
            <div style={{ position: 'relative', marginBottom: 24 }}>
              <div style={{ fontSize: 11, fontWeight: 800, color: 'var(--muted)', letterSpacing: 1, textTransform: 'uppercase', marginBottom: 10 }}>Ton commentaire</div>
              <textarea
                value={content}
                onChange={e => setContent(e.target.value.slice(0, 140))}
                placeholder={
                  category === 'trafic'   ? 'Ex: Ça roule bien ici, pas de bouchons…' :
                  category === 'tarif'    ? 'Ex: Le trajet est à 300F ce soir…' :
                  category === 'incident' ? 'Ex: Attention, accident au carrefour…' :
                  category === 'travaux'  ? 'Ex: Rue barrée pour travaux…' :
                                            'Ex: Gare calme, beaucoup de gbakas…'
                }
                rows={4}
                style={{ 
                  width: '100%', background: 'var(--cream)', border: '2px solid var(--line)', 
                  borderRadius: 20, padding: '16px', fontSize: 15, fontWeight: 600, 
                  color: 'var(--ink)', outline: 'none', resize: 'none', fontFamily: 'inherit', 
                  boxSizing: 'border-box', transition: 'border-color 0.2s'
                }}
                onFocus={(e) => e.target.style.borderColor = selectedCat.color}
                onBlur={(e) => e.target.style.borderColor = 'var(--line)'}
                autoFocus
              />
              <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 8 }}>
                <div style={{ fontSize: 11, color: 'var(--muted)', fontWeight: 700 }}>
                  Expirera dans <span style={{ color: selectedCat.color, fontWeight: 900 }}>{selectedCat.expireH}h</span>
                </div>
                <div style={{ fontSize: 11, color: content.length > 130 ? 'var(--orange)' : 'var(--muted)', fontWeight: 800 }}>
                  {content.length}/140
                </div>
              </div>
            </div>

            {error && (
              <div style={{ padding: '12px 16px', background: '#fee2e2', borderRadius: 14, color: '#dc2626', fontSize: 12, fontWeight: 700, marginBottom: 20, display: 'flex', alignItems: 'center', gap: 8 }}>
                <span>⚠️</span> {error}
              </div>
            )}

            {/* Actions */}
            <div style={{ display: 'flex', gap: 12 }}>
              <button
                onClick={onClose}
                className="press"
                style={{ flex: 1, height: 56, borderRadius: 18, border: '2px solid var(--line)', background: 'transparent', color: 'var(--muted)', fontSize: 14, fontWeight: 800, cursor: 'pointer' }}
              >
                Annuler
              </button>
              <button
                onClick={handleSubmit}
                disabled={!content.trim() || loading}
                className="press"
                style={{
                  flex: 2, height: 56, borderRadius: 18, border: 'none',
                  background: content.trim() && !loading ? selectedCat.color : 'var(--line-strong)',
                  color: content.trim() && !loading ? '#fff' : 'rgba(255,255,255,0.5)',
                  fontSize: 14, fontWeight: 900, cursor: content.trim() && !loading ? 'pointer' : 'default',
                  textTransform: 'uppercase', letterSpacing: 1,
                  boxShadow: content.trim() && !loading ? `0 8px 24px ${selectedCat.color}40` : 'none'
                }}
              >
                {loading ? 'Envoi...' : 'Publier'}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
