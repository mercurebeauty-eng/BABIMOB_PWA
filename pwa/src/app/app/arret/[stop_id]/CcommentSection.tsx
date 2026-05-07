'use client';

import { useState, useEffect, useCallback } from 'react';
import { createClient } from '@/lib/supabase/client';
import CcommentButton from '@/components/CcommentButton';

type Report = {
  id: string;
  category: string;
  content: string;
  display_name: string;
  created_at: string;
};

type Props = {
  stopId: string;
  stopName: string;
  userId: string | null;
  displayName: string | null;
};

const PRIORITY: Record<string, number> = {
  incident: 0,
  trafic: 1,
  travaux: 2,
  tarif: 3,
  ambiance: 4,
};

const CAT_META: Record<string, { label: string; emoji: string; color: string }> = {
  trafic:   { label: 'Trafic',   emoji: '🚦', color: 'var(--orange-deep)' },
  tarif:    { label: 'Tarif',    emoji: '💰', color: 'var(--green)'        },
  incident: { label: 'Incident', emoji: '⚠️', color: 'var(--orange)'       },
  travaux:  { label: 'Travaux',  emoji: '🚧', color: 'var(--gold)'         },
  ambiance: { label: 'Ambiance', emoji: '✨', color: 'var(--blue)'         },
};

function timeAgo(iso: string): string {
  const diff = Math.floor((Date.now() - new Date(iso).getTime()) / 1000);
  if (diff < 60) return "à l'instant";
  if (diff < 3600) return `il y a ${Math.floor(diff / 60)} min`;
  if (diff < 86400) return `il y a ${Math.floor(diff / 3600)}h`;
  return `il y a ${Math.floor(diff / 86400)}j`;
}

export default function CcommentSection({ stopId, stopName, userId, displayName }: Props) {
  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);
  const supabase = createClient();

  const loadReports = useCallback(async () => {
    setLoading(true);
    // On récupère les signalements des 7 derniers jours (168h)
    const since = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
    
    const { data, error } = await supabase
      .from('stop_reports')
      .select('*')
      .eq('stop_id', stopId)
      .gte('created_at', since)
      .order('created_at', { ascending: false });

    if (!error && data) {
      const sorted = data.sort((a, b) => 
        (PRIORITY[a.category] ?? 9) - (PRIORITY[b.category] ?? 9)
      );
      setReports(sorted);
    }
    setLoading(false);
  }, [supabase, stopId]);

  useEffect(() => {
    // Reset state on stopId change to avoid showing stale data from previous stop
    setReports([]);
    loadReports();

    // Listen for refresh events (from the button)
    const handleRefresh = () => loadReports();
    window.addEventListener('ccomment-refresh', handleRefresh);
    return () => window.removeEventListener('ccomment-refresh', handleRefresh);
  }, [stopId, loadReports]);

  return (
    <div style={{ marginTop: 32, paddingBottom: 40 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
        <h3 className="font-display" style={{ fontSize: 18, margin: 0 }}>C&apos;comment ?</h3>
        {!loading && reports.length > 0 && (
          <div style={{ fontSize: 11, color: 'var(--green)', fontWeight: 800, display: 'flex', alignItems: 'center', gap: 4 }}>
            <div className="shimmer" style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--green)' }} />
            {reports.length} SIGNALEMENT{reports.length > 1 ? 'S' : ''}
          </div>
        )}
      </div>

      {loading && reports.length === 0 ? (
        <div style={{ padding: '32px 16px', textAlign: 'center', color: 'var(--muted)', fontSize: 13, fontWeight: 600 }}>
          Chargement des avis...
        </div>
      ) : reports.length === 0 ? (
        <div style={{ padding: '32px 16px', borderRadius: 20, background: 'var(--cream-2)', border: '1.5px dashed var(--line)', textAlign: 'center' }}>
          <div style={{ fontSize: 32, marginBottom: 8 }}>🤫</div>
          <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--ink)' }}>Aucun avis récent</div>
          <div style={{ fontSize: 11, color: 'var(--muted)', marginTop: 4 }}>Sois le premier à dire comment c&apos;est ici !</div>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {reports.map((r) => {
            const meta = CAT_META[r.category] || CAT_META.ambiance;
            return (
              <div key={r.id} style={{ 
                padding: 16, borderRadius: 18, background: 'var(--cream-2)', 
                border: '1px solid var(--line)', boxShadow: '0 2px 8px rgba(0,0,0,0.02)' 
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
                  <div style={{ 
                    width: 32, height: 32, borderRadius: 10, 
                    background: `color-mix(in oklab, ${meta.color} 12%, transparent)`, 
                    display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16, flexShrink: 0 
                  }}>
                    {meta.emoji}
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 13, fontWeight: 800, color: 'var(--ink)' }}>{r.display_name}</div>
                    <div style={{ fontSize: 10, color: 'var(--muted)', fontWeight: 600 }}>{timeAgo(r.created_at)}</div>
                  </div>
                  <div style={{ 
                    fontSize: 9, fontWeight: 900, color: meta.color, 
                    background: `color-mix(in oklab, ${meta.color} 10%, transparent)`, 
                    padding: '4px 8px', borderRadius: 8, textTransform: 'uppercase', letterSpacing: 0.5 
                  }}>
                    {meta.label}
                  </div>
                </div>
                <p style={{ fontSize: 14, color: 'var(--ink-2)', margin: 0, lineHeight: 1.5, fontWeight: 500 }}>{r.content}</p>
              </div>
            );
          })}
        </div>
      )}

      {/* Footer Button portal (we'll handle the button separately in the page but this component needs to be able to refresh) */}
      {/* For now we just put the button here if needed, but it's better in the page footer for design */}
    </div>
  );
}
