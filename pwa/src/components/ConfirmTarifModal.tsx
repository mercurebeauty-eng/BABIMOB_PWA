'use client';

import { useState, useCallback, useRef } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Ic } from '@/components/ui/Ic';

type StopResult = { stop_id: string; stop_name: string; commune: string | null };

type Props = {
  stopIdDepart: string;
  stopNameDepart: string;
  userId: string | null;
  onClose: () => void;
  onSuccess: () => void;
};

const PRIX_RAPIDES = [100, 150, 200, 300, 500];

const MOMENTS = [
  { value: 'matin',   label: 'Matin',   emoji: '🌅' },
  { value: 'journee', label: 'Journée', emoji: '☀️' },
  { value: 'soir',    label: 'Soir',    emoji: '🌆' },
  { value: 'nuit',    label: 'Nuit',    emoji: '🌙' },
];

export default function ConfirmTarifModal({ stopIdDepart, stopNameDepart, userId, onClose, onSuccess }: Props) {
  const supabase = useRef(createClient()).current;

  const [direction, setDirection]       = useState<0 | 1>(0);
  const [searchQuery, setSearchQuery]   = useState('');
  const [searchResults, setSearchResults] = useState<StopResult[]>([]);
  const [selectedStop, setSelectedStop] = useState<StopResult | null>(null);
  const [prix, setPrix]                 = useState<number | null>(null);
  const [moment, setMoment]             = useState('journee');
  const [submitting, setSubmitting]     = useState(false);
  const [error, setError]               = useState<string | null>(null);

  const searchStops = useCallback(async (query: string) => {
    if (query.length < 2) { setSearchResults([]); return; }
    const { data } = await supabase
      .from('gtfs_stops')
      .select('stop_id, stop_name, commune')
      .ilike('stop_name', `%${query}%`)
      .limit(8);
    setSearchResults(data ?? []);
  }, [supabase]);

  const handleSearch = (q: string) => {
    setSearchQuery(q);
    setSelectedStop(null);
    searchStops(q);
  };

  const handleSubmit = async () => {
    if (!selectedStop || prix === null) return;
    setSubmitting(true);
    setError(null);

    const { error: err } = await supabase.from('tarif_confirmations').insert({
      user_id: userId,
      stop_id_depart: stopIdDepart,
      stop_name_depart: stopNameDepart,
      stop_id_arrivee: selectedStop.stop_id,
      stop_name_arrivee: selectedStop.stop_name,
      direction_id: direction,
      prix,
      moment,
    });

    setSubmitting(false);
    if (err) { setError("Erreur lors de l'envoi. Réessaye."); return; }
    onSuccess();
  };

  const canSubmit = selectedStop !== null && prix !== null && !submitting;

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 1000, display: 'flex', alignItems: 'flex-end' }}>
      <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.5)' }} onClick={onClose} />

      <div style={{
        position: 'relative', width: '100%', zIndex: 1,
        background: 'var(--cream)', borderRadius: '24px 24px 0 0',
        padding: '20px 20px calc(env(safe-area-inset-bottom, 0px) + 20px)',
        maxHeight: '90vh', overflowY: 'auto',
      }}>
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
          <div>
            <div style={{ fontSize: 11, fontWeight: 800, color: 'var(--orange)', textTransform: 'uppercase', letterSpacing: 0.5 }}>Confirmer un tarif</div>
            <div className="font-display" style={{ fontSize: 18 }}>Depuis {stopNameDepart}</div>
          </div>
          <button
            onClick={onClose}
            style={{ width: 36, height: 36, borderRadius: 10, border: 'none', background: 'var(--cream-2)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--muted)' }}
          >
            <Ic.X s={16} />
          </button>
        </div>

        {/* Direction */}
        <div style={{ marginBottom: 18 }}>
          <div style={{ fontSize: 11, fontWeight: 800, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 8 }}>Sens</div>
          <div style={{ display: 'flex', gap: 8, padding: 4, background: 'var(--cream-2)', borderRadius: 12, border: '1px solid var(--line)' }}>
            {([0, 1] as const).map(d => (
              <button
                key={d}
                onClick={() => setDirection(d)}
                style={{
                  flex: 1, padding: '10px 8px', borderRadius: 9, border: 'none', cursor: 'pointer',
                  background: direction === d ? 'var(--cream)' : 'transparent',
                  color: direction === d ? 'var(--orange)' : 'var(--muted)',
                  fontWeight: 800, fontSize: 13,
                  boxShadow: direction === d ? '0 2px 8px rgba(0,0,0,0.06)' : 'none',
                }}
              >
                {d === 0 ? '→ Sens aller' : '← Sens retour'}
              </button>
            ))}
          </div>
        </div>

        {/* Destination search */}
        <div style={{ marginBottom: 18 }}>
          <div style={{ fontSize: 11, fontWeight: 800, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 8 }}>Arrêt d&apos;arrivée</div>
          {selectedStop ? (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 14px', borderRadius: 12, background: 'color-mix(in oklab, var(--green) 10%, transparent)', border: '1px solid color-mix(in oklab, var(--green) 30%, transparent)' }}>
              <div>
                <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--ink)' }}>{selectedStop.stop_name}</div>
                {selectedStop.commune && <div style={{ fontSize: 11, color: 'var(--muted)', marginTop: 2 }}>{selectedStop.commune}</div>}
              </div>
              <button
                onClick={() => { setSelectedStop(null); setSearchQuery(''); }}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--muted)', fontSize: 20, padding: 0, lineHeight: 1 }}
              >
                ✕
              </button>
            </div>
          ) : (
            <div>
              <input
                type="text"
                placeholder="Chercher un arrêt..."
                value={searchQuery}
                onChange={e => handleSearch(e.target.value)}
                style={{
                  width: '100%', padding: '12px 14px', borderRadius: 12,
                  border: '1px solid var(--line)', background: 'var(--cream-2)',
                  fontSize: 14, color: 'var(--ink)', outline: 'none',
                  boxSizing: 'border-box',
                }}
              />
              {searchResults.length > 0 && (
                <div style={{ marginTop: 4, borderRadius: 12, border: '1px solid var(--line)', overflow: 'hidden', background: 'var(--cream-2)' }}>
                  {searchResults.map((s, i) => (
                    <button
                      key={s.stop_id}
                      onClick={() => { setSelectedStop(s); setSearchQuery(s.stop_name); setSearchResults([]); }}
                      style={{
                        width: '100%', padding: '12px 14px', textAlign: 'left', border: 'none',
                        borderTop: i === 0 ? 'none' : '1px solid var(--line)',
                        background: 'transparent', cursor: 'pointer', display: 'block',
                      }}
                    >
                      <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--ink)' }}>{s.stop_name}</div>
                      {s.commune && <div style={{ fontSize: 11, color: 'var(--muted)' }}>{s.commune}</div>}
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Price */}
        <div style={{ marginBottom: 18 }}>
          <div style={{ fontSize: 11, fontWeight: 800, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 8 }}>Prix payé (FCFA)</div>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 10 }}>
            {PRIX_RAPIDES.map(p => (
              <button
                key={p}
                onClick={() => setPrix(p)}
                style={{
                  padding: '10px 16px', borderRadius: 10, border: '2px solid',
                  borderColor: prix === p ? 'var(--orange)' : 'var(--line)',
                  background: prix === p ? 'color-mix(in oklab, var(--orange) 10%, transparent)' : 'var(--cream-2)',
                  color: prix === p ? 'var(--orange)' : 'var(--ink)',
                  fontWeight: 800, fontSize: 14, cursor: 'pointer',
                }}
              >
                {p}F
              </button>
            ))}
          </div>
          <input
            type="number"
            placeholder="Autre montant..."
            value={prix !== null && !PRIX_RAPIDES.includes(prix) ? String(prix) : ''}
            onChange={e => { const v = parseInt(e.target.value); if (!isNaN(v) && v > 0) setPrix(v); else setPrix(null); }}
            style={{
              width: '100%', padding: '12px 14px', borderRadius: 12,
              border: '1px solid var(--line)', background: 'var(--cream-2)',
              fontSize: 14, color: 'var(--ink)', outline: 'none',
              boxSizing: 'border-box',
            }}
          />
        </div>

        {/* Moment */}
        <div style={{ marginBottom: 24 }}>
          <div style={{ fontSize: 11, fontWeight: 800, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 8 }}>Moment</div>
          <div style={{ display: 'flex', gap: 8 }}>
            {MOMENTS.map(m => (
              <button
                key={m.value}
                onClick={() => setMoment(m.value)}
                style={{
                  flex: 1, padding: '10px 4px', borderRadius: 10, border: '2px solid',
                  borderColor: moment === m.value ? 'var(--orange)' : 'var(--line)',
                  background: moment === m.value ? 'color-mix(in oklab, var(--orange) 10%, transparent)' : 'var(--cream-2)',
                  color: moment === m.value ? 'var(--orange)' : 'var(--muted)',
                  fontWeight: 800, fontSize: 10, cursor: 'pointer',
                  display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3,
                }}
              >
                <span style={{ fontSize: 16 }}>{m.emoji}</span>
                {m.label}
              </button>
            ))}
          </div>
        </div>

        {error && (
          <div style={{ marginBottom: 12, padding: '10px 14px', borderRadius: 10, background: 'color-mix(in oklab, var(--orange-deep) 10%, transparent)', color: 'var(--orange-deep)', fontSize: 13, fontWeight: 700 }}>
            {error}
          </div>
        )}

        <button
          onClick={handleSubmit}
          disabled={!canSubmit}
          style={{
            width: '100%', height: 54, borderRadius: 16, border: 'none',
            background: canSubmit ? 'var(--orange)' : 'var(--line)',
            color: canSubmit ? '#fff' : 'var(--muted)',
            fontSize: 15, fontWeight: 800, cursor: canSubmit ? 'pointer' : 'default',
            boxShadow: canSubmit ? '0 4px 14px rgba(242,108,26,0.35)' : 'none',
          }}
        >
          {submitting ? 'Envoi...' : 'Confirmer ce tarif 🎯'}
        </button>
      </div>
    </div>
  );
}
