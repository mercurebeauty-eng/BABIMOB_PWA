'use client';

import { useState, useEffect, useCallback } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Ic } from '@/components/ui/Ic';

type Review = {
  id: string;
  display_name: string;
  category: string;
  content: string;
  upvotes: number;
  downvotes: number;
  created_at: string;
};

type Props = {
  stopId: string;
  stopName: string;
  onClose: () => void;
  onAddReview: () => void;
};

const CAT_LABELS: Record<string, string> = {
  ambiance: 'Ambiance',
  infrastructure: 'Infrastructure',
  autorites: 'Autorités',
  proprete: 'Propreté',
  securite: 'Sécurité',
  accessibilite: 'Accessibilité'
};

function timeAgo(iso: string): string {
  const diff = Math.floor((Date.now() - new Date(iso).getTime()) / 1000);
  if (diff < 60) return "à l'instant";
  if (diff < 3600) return `il y a ${Math.floor(diff / 60)} min`;
  if (diff < 86400) return `il y a ${Math.floor(diff / 3600)}h`;
  return `il y a ${Math.floor(diff / 86400)}j`;
}

export default function StopReviewsListModal({ stopId, stopName, onClose, onAddReview }: Props) {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const supabase = createClient();

  const load = useCallback(async () => {
    setLoading(true);
    const { data } = await supabase
      .from('avis_arret')
      .select('*')
      .eq('stop_id', stopId)
      .order('created_at', { ascending: false });
    
    if (data) setReviews(data);
    setLoading(false);
  }, [supabase, stopId]);

  useEffect(() => { load(); }, [load]);

  const handleVote = async (id: string, type: 'up' | 'down') => {
    const field = type === 'up' ? 'upvotes' : 'downvotes';
    const current = reviews.find(r => r.id === id);
    if (!current) return;

    // Optimistic update
    setReviews(prev => prev.map(r => r.id === id ? { ...r, [field]: r[field] + 1 } : r));

    await supabase.rpc('increment_vote', { row_id: id, field_name: field });
  };

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 1500, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
      <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(10px)' }} onClick={onClose} />
      
      <div style={{ 
        position: 'relative', width: '100%', maxWidth: 480, background: 'var(--cream)', 
        borderRadius: 32, boxShadow: '0 30px 80px rgba(0,0,0,0.5)', overflow: 'hidden',
        display: 'flex', flexDirection: 'column', maxHeight: '85vh'
      }}>
        {/* Header */}
        <div style={{ padding: '24px 24px 20px', borderBottom: '1px solid var(--line)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <h3 className="font-display" style={{ fontSize: 22, margin: 0 }}>Avis de la communauté</h3>
            <p style={{ fontSize: 12, color: 'var(--muted)', margin: '4px 0 0' }}>{stopName}</p>
          </div>
          <button onClick={onClose} className="press" style={{ background: 'var(--cream-2)', border: 'none', width: 36, height: 36, borderRadius: '50%', color: 'var(--muted)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
            <Ic.X s={16} />
          </button>
        </div>

        {/* Top Action Bar */}
        <div style={{ padding: '16px 24px', background: 'var(--cream-2)', borderBottom: '1px solid var(--line)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--ink)' }}>
                {reviews.length} avis réel{reviews.length > 1 ? 's' : ''}
            </div>
            <button 
                onClick={onAddReview}
                className="press"
                style={{ 
                    padding: '10px 16px', borderRadius: 12, background: 'var(--orange)', color: 'white', 
                    fontSize: 12, fontWeight: 900, border: 'none', cursor: 'pointer',
                    display: 'flex', alignItems: 'center', gap: 6,
                    boxShadow: '0 4px 12px rgba(242,108,26,0.3)',
                    animation: 'shimmer-button 2s infinite'
                }}
            >
                <Ic.Plus s={14} />
                DONNER MON AVIS
            </button>
        </div>

        {/* List */}
        <div className="no-scrollbar" style={{ flex: 1, overflowY: 'auto', padding: '20px 24px' }}>
          {loading ? (
            <div style={{ padding: 40, textAlign: 'center', color: 'var(--muted)', fontWeight: 600 }}>Chargement...</div>
          ) : reviews.length === 0 ? (
            <div style={{ padding: '60px 20px', textAlign: 'center' }}>
                <div style={{ fontSize: 40, marginBottom: 16 }}>📝</div>
                <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--ink)' }}>Aucun avis pour le moment</div>
                <div style={{ fontSize: 12, color: 'var(--muted)', marginTop: 6 }}>Partage ton expérience pour aider les autres Babis !</div>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              {reviews.map(r => (
                <div key={r.id} style={{ padding: 16, borderRadius: 20, background: 'var(--cream-2)', border: '1px solid var(--line)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 }}>
                    <div>
                        <div style={{ fontSize: 13, fontWeight: 800, color: 'var(--ink)' }}>{r.display_name || 'Un Babi'}</div>
                        <div style={{ fontSize: 10, color: 'var(--muted)', fontWeight: 600 }}>{timeAgo(r.created_at)} · <span style={{ color: 'var(--orange)' }}>{CAT_LABELS[r.category] || r.category}</span></div>
                    </div>
                    {/* Voting */}
                    <div style={{ display: 'flex', gap: 8 }}>
                        <button 
                            onClick={() => handleVote(r.id, 'up')}
                            className="press" 
                            style={{ 
                                display: 'flex', alignItems: 'center', gap: 4, padding: '4px 8px', 
                                borderRadius: 8, background: 'var(--cream)', border: '1px solid var(--line)', 
                                color: 'var(--green)', fontSize: 11, fontWeight: 800, cursor: 'pointer' 
                            }}
                        >
                            👍 {r.upvotes}
                        </button>
                        <button 
                            onClick={() => handleVote(r.id, 'down')}
                            className="press" 
                            style={{ 
                                display: 'flex', alignItems: 'center', gap: 4, padding: '4px 8px', 
                                borderRadius: 8, background: 'var(--cream)', border: '1px solid var(--line)', 
                                color: 'var(--orange-deep)', fontSize: 11, fontWeight: 800, cursor: 'pointer' 
                            }}
                        >
                            👎 {r.downvotes}
                        </button>
                    </div>
                  </div>
                  <p style={{ fontSize: 14, color: 'var(--ink-2)', margin: 0, lineHeight: 1.5, fontWeight: 500 }}>{r.content}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <style jsx>{`
        @keyframes shimmer-button {
            0% { transform: scale(1); box-shadow: 0 4px 12px rgba(242,108,26,0.3); }
            50% { transform: scale(1.02); box-shadow: 0 6px 20px rgba(242,108,26,0.5); }
            100% { transform: scale(1); box-shadow: 0 4px 12px rgba(242,108,26,0.3); }
        }
      `}</style>
    </div>
  );
}
