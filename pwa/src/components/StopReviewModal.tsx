'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Ic } from '@/components/ui/Ic';

type Props = {
  stopId: string;
  stopName: string;
  userId: string | null;
  displayName: string | null;
  onClose: () => void;
  onSuccess: () => void;
};

type Category = 'ambiance' | 'infrastructure' | 'autorites' | 'proprete' | 'securite' | 'accessibilite';

const CATS: { id: Category; label: string; emoji: string; keywords: string[] }[] = [
  { id: 'ambiance',       label: 'Ambiance',       emoji: '✨', keywords: ['atmosphere', 'noise', 'quiet', 'stress', 'ambiance', 'calme', 'bruit', 'musique', 'foule'] },
  { id: 'infrastructure', label: 'Infrastructure', emoji: '🚧', keywords: ['shelter', 'bench', 'lighting', 'roof', 'banc', 'abri', 'toit', 'eclairage', 'trottoir', 'poteau', 'siege'] },
  { id: 'autorites',      label: 'Autorités',      emoji: '👮', keywords: ['city hall', 'police', 'fine', 'ticket', 'mairie', 'controle', 'amende', 'billet', 'agent', 'flic'] },
  { id: 'proprete',       label: 'Propreté',       emoji: '🧹', keywords: ['propre', 'sale', 'poubelle', 'dechets', 'odeur', 'nettoyage'] },
  { id: 'securite',       label: 'Sécurité',       emoji: '🛡️', keywords: ['securite', 'danger', 'agression', 'vol', 'eclairage', 'nuit'] },
  { id: 'accessibilite',  label: 'Accessibilité',  emoji: '♿', keywords: ['handicap', 'rampe', 'accessible', 'fauteuil', 'marche'] },
];

export default function StopReviewModal({ stopId, stopName, userId, displayName, onClose, onSuccess }: Props) {
  const [category, setCategory] = useState<Category>('ambiance');
  const [content, setContent]   = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [userHasOverridden, setUserHasOverridden] = useState(false);

  const supabase = createClient();

  // Logic for automatic classification based on keywords
  useEffect(() => {
    if (userHasOverridden || content.length < 3) return;

    const lower = content.toLowerCase();
    let bestCat = category;
    let maxMatches = 0;

    CATS.forEach(cat => {
      const matches = cat.keywords.filter(kw => lower.includes(kw)).length;
      if (matches > maxMatches) {
        maxMatches = matches;
        bestCat = cat.id;
      }
    });

    if (maxMatches > 0 && bestCat !== category) {
      setCategory(bestCat);
    }
  }, [content, userHasOverridden, category]);

  const handleSubmit = async () => {
    if (!userId || content.trim().length < 5) return;
    setSubmitting(true);
    setError(null);

    // Persistent reviews: expires in 1 year
    const expiresAt = new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString();

    const { error: err } = await supabase.from('stop_reports').insert({
      stop_id: stopId,
      user_id: userId,
      display_name: displayName || 'Un Babi',
      category: category,
      content: content.trim(),
      expires_at: expiresAt
    });

    if (err) {
      setError(err.message);
      setSubmitting(false);
    } else {
      onSuccess();
    }
  };

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 2000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
      <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(8px)' }} onClick={onClose} />
      
      <div style={{ 
        position: 'relative', width: '100%', maxWidth: 420, background: 'var(--cream)', 
        borderRadius: 28, boxShadow: '0 24px 64px rgba(0,0,0,0.4)', overflow: 'hidden',
        display: 'flex', flexDirection: 'column'
      }}>
        {/* Header */}
        <div style={{ padding: '20px 24px', borderBottom: '1px solid var(--line)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <h3 className="font-display" style={{ fontSize: 20, margin: 0 }}>Donner mon avis</h3>
            <p style={{ fontSize: 11, color: 'var(--muted)', margin: '2px 0 0' }}>{stopName}</p>
          </div>
          <button onClick={onClose} className="press" style={{ background: 'var(--cream-2)', border: 'none', width: 32, height: 32, borderRadius: '50%', color: 'var(--muted)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
            <Ic.X s={14} />
          </button>
        </div>

        <div style={{ padding: 24, overflowY: 'auto', maxHeight: '70vh' }}>
          {/* Category Chips */}
          <div style={{ marginBottom: 20 }}>
            <label style={{ fontSize: 10, fontWeight: 900, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 10, display: 'block' }}>
              Catégorie {userHasOverridden ? '' : '(suggérée auto)'}
            </label>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
              {CATS.map(cat => (
                <button
                  key={cat.id}
                  onClick={() => { setCategory(cat.id); setUserHasOverridden(true); }}
                  style={{
                    padding: '8px 12px', borderRadius: 12, border: '2px solid',
                    borderColor: category === cat.id ? 'var(--orange)' : 'var(--line)',
                    background: category === cat.id ? 'color-mix(in oklab, var(--orange) 10%, transparent)' : 'transparent',
                    color: category === cat.id ? 'var(--orange)' : 'var(--ink)',
                    fontSize: 12, fontWeight: 800, cursor: 'pointer', transition: 'all 0.2s',
                    display: 'flex', alignItems: 'center', gap: 6
                  }}
                  className="press"
                >
                  <span>{cat.emoji}</span>
                  {cat.label}
                </button>
              ))}
            </div>
          </div>

          {/* Text Area */}
          <div style={{ marginBottom: 20 }}>
            <label style={{ fontSize: 10, fontWeight: 900, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 8, display: 'block' }}>
              Ton commentaire
            </label>
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Explique ce qui va ou ce qui ne va pas..."
              style={{
                width: '100%', height: 120, padding: 16, borderRadius: 18, border: '1px solid var(--line)',
                background: 'var(--cream-2)', fontSize: 14, color: 'var(--ink)', outline: 'none',
                resize: 'none', boxSizing: 'border-box', lineHeight: 1.5
              }}
            />
          </div>

          {error && (
            <div style={{ padding: 12, borderRadius: 12, background: '#fee', color: '#c33', fontSize: 12, fontWeight: 700, marginBottom: 16 }}>
              {error}
            </div>
          )}

          <button
            onClick={handleSubmit}
            disabled={submitting || content.trim().length < 5}
            style={{
              width: '100%', height: 54, borderRadius: 16, border: 'none',
              background: 'var(--orange)', color: '#fff', fontSize: 16, fontWeight: 900,
              cursor: submitting ? 'default' : 'pointer', opacity: submitting ? 0.7 : 1,
              boxShadow: '0 8px 20px rgba(242,108,26,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10
            }}
            className="press"
          >
            {submitting ? 'Envoi en cours...' : 'Poster mon avis'}
            {!submitting && <Ic.Arrow s={18} />}
          </button>
        </div>
      </div>
    </div>
  );
}
