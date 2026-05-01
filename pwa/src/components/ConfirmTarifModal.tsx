'use client';

import { useState, useCallback, useRef, useEffect, useMemo } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Ic } from '@/components/ui/Ic';

type StopResult = { stop_id: string; stop_name: string; commune: string | null; stop_sequence: number };

type Props = {
  stopIdDepart: string;
  stopNameDepart: string;
  userId: string | null;
  lines: any[];
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

export default function ConfirmTarifModal({ stopIdDepart, stopNameDepart, userId, lines, onClose, onSuccess }: Props) {
  const supabase = useRef(createClient()).current;

  const [direction, setDirection]           = useState<0 | 1>(0);
  const [selectedLineId, setSelectedLineId]     = useState<string>(lines[0]?.route_id || '');
  const [allStops, setAllStops]                 = useState<StopResult[]>([]);
  const [stopIdStart, setStopIdStart]           = useState<string>(stopIdDepart);
  const [stopIdEnd, setStopIdEnd]               = useState<string>('');
  const [prix, setPrix]                         = useState<number | null>(null);
  const [moment, setMoment]                     = useState('journee');
  const [submitting, setSubmitting]             = useState(false);
  const [error, setError]                       = useState<string | null>(null);
  const [loadingStops, setLoadingStops]         = useState(false);

  // Charger tous les arrêts de la ligne/direction
  useEffect(() => {
    async function loadStops() {
      if (!selectedLineId) return;
      setLoadingStops(true);
      
      const { data: trips } = await supabase
        .from('gtfs_trips')
        .select('trip_id')
        .eq('route_id', selectedLineId)
        .eq('direction_id', direction)
        .limit(1);

      if (trips && trips.length > 0) {
        const { data: st } = await supabase
          .from('gtfs_stop_times')
          .select('stop_id, stop_sequence, gtfs_stops(stop_name, commune)')
          .eq('trip_id', trips[0].trip_id)
          .order('stop_sequence');

        if (st) {
          const formatted = st.map(s => ({
            stop_id: s.stop_id,
            stop_name: (s.gtfs_stops as any)?.stop_name || 'Arrêt inconnu',
            commune: (s.gtfs_stops as any)?.commune || null,
            stop_sequence: s.stop_sequence
          }));
          setAllStops(formatted);
          
          // Vérifier si le stop actuel est dans cette liste, sinon reset start
          if (!formatted.find(s => s.stop_id === stopIdStart)) {
             // On ne change pas stopIdStart s'il est déjà fixé par le contexte, 
             // mais si on change de ligne et qu'il n'existe plus, on prend le premier.
             if (formatted.length > 0) setStopIdStart(formatted[0].stop_id);
          }
        }
      } else {
        setAllStops([]);
      }
      setLoadingStops(false);
    }
    loadStops();
  }, [selectedLineId, direction, supabase, stopIdStart]);

  const possibleStarts = allStops;
  const startIndex = allStops.findIndex(s => s.stop_id === stopIdStart);
  const possibleEnds = startIndex !== -1 ? allStops.slice(startIndex + 1) : [];

  const handleSubmit = async () => {
    const startStop = allStops.find(s => s.stop_id === stopIdStart);
    const endStop   = allStops.find(s => s.stop_id === stopIdEnd);
    if (!startStop || !endStop || prix === null) return;
    
    setSubmitting(true);
    setError(null);

    const { error: err } = await supabase.from('tarif_confirmations').insert({
      user_id: userId,
      stop_id_depart: startStop.stop_id,
      stop_name_depart: startStop.stop_name,
      stop_id_arrivee: endStop.stop_id,
      stop_name_arrivee: endStop.stop_name,
      direction_id: direction,
      prix,
      moment,
    });

    setSubmitting(false);
    if (err) { setError("Erreur lors de l'envoi. Réessaye."); return; }
    onSuccess();
  };

  const canSubmit = stopIdStart !== '' && stopIdEnd !== '' && prix !== null && !submitting;

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
      <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(8px)' }} onClick={onClose} />

      <div style={{
        position: 'relative', width: '100%', maxWidth: 440, zIndex: 1,
        background: 'var(--cream)', borderRadius: 28,
        display: 'flex', flexDirection: 'column',
        maxHeight: '85vh', boxShadow: '0 20px 60px rgba(0,0,0,0.3)',
        overflow: 'hidden'
      }}>
        {/* Handle for aesthetic */}
        <div style={{ display: 'flex', justifyContent: 'center', paddingTop: 12 }}>
            <div style={{ width: 40, height: 4, borderRadius: 2, background: 'var(--line)', opacity: 0.5 }} />
        </div>

        {/* Header */}
        <div style={{ padding: '12px 20px 20px', borderBottom: '1px solid var(--line)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <div style={{ fontSize: 10, fontWeight: 900, color: 'var(--orange)', textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 2 }}>Tarification collaborative</div>
            <div className="font-display" style={{ fontSize: 20, color: 'var(--ink)' }}>Confirmer un tarif</div>
          </div>
          <button
            onClick={onClose}
            className="press"
            style={{ width: 32, height: 32, borderRadius: '50%', border: 'none', background: 'var(--cream-2)', color: 'var(--muted)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
          >
            <Ic.X s={14} />
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="no-scrollbar" style={{ flex: 1, overflowY: 'auto', padding: 20 }}>
          
          {/* Ligne & Direction Row */}
          <div style={{ display: 'flex', gap: 12, marginBottom: 20 }}>
            <div style={{ flex: 2 }}>
              <div style={{ fontSize: 10, fontWeight: 800, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 6 }}>Ligne</div>
              <select
                value={selectedLineId}
                onChange={(e) => setSelectedLineId(e.target.value)}
                style={{ width: '100%', padding: '10px 12px', borderRadius: 12, border: '1px solid var(--line)', background: 'var(--cream-2)', fontSize: 13, color: 'var(--ink)', outline: 'none' }}
              >
                {lines.map(l => (
                  <option key={l.route_id} value={l.route_id}>{l.route_long_name}</option>
                ))}
              </select>
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 10, fontWeight: 800, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 6 }}>Sens</div>
              <select
                value={direction}
                onChange={(e) => setDirection(parseInt(e.target.value) as 0|1)}
                style={{ width: '100%', padding: '10px 12px', borderRadius: 12, border: '1px solid var(--line)', background: 'var(--cream-2)', fontSize: 13, color: 'var(--ink)', outline: 'none' }}
              >
                <option value={0}>Aller</option>
                <option value={1}>Retour</option>
              </select>
            </div>
          </div>

          {/* Segment selection (Double selector as requested) */}
          <div style={{ padding: 16, borderRadius: 16, background: 'var(--cream-2)', border: '1px solid var(--line)', marginBottom: 20 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
              <div style={{ width: 10, height: 10, borderRadius: '50%', background: 'var(--blue)', flexShrink: 0 }} />
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 9, fontWeight: 800, color: 'var(--muted)', textTransform: 'uppercase', marginBottom: 2 }}>Départ</div>
                <select
                    value={stopIdStart}
                    onChange={(e) => { setStopIdStart(e.target.value); setStopIdEnd(''); }}
                    style={{ width: '100%', border: 'none', background: 'transparent', fontSize: 14, fontWeight: 700, padding: 0, outline: 'none', color: 'var(--ink)' }}
                >
                    <option value="">Choisir...</option>
                    {possibleStarts.map(s => (
                        <option key={s.stop_id} value={s.stop_id}>{s.stop_name}</option>
                    ))}
                </select>
              </div>
            </div>

            <div style={{ height: 15, borderLeft: '2px dashed var(--line)', marginLeft: 4, marginBottom: 4 }} />

            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div style={{ width: 10, height: 10, borderRadius: '50%', background: 'var(--green)', flexShrink: 0 }} />
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 9, fontWeight: 800, color: 'var(--muted)', textTransform: 'uppercase', marginBottom: 2 }}>Arrivée</div>
                <select
                    value={stopIdEnd}
                    onChange={(e) => setStopIdEnd(e.target.value)}
                    disabled={!stopIdStart}
                    style={{ width: '100%', border: 'none', background: 'transparent', fontSize: 14, fontWeight: 700, padding: 0, outline: 'none', color: stopIdStart ? 'var(--ink)' : 'var(--muted)' }}
                >
                    <option value="">{stopIdStart ? 'Où es-tu descendu ?' : 'Choisir le départ d\'abord'}</option>
                    {possibleEnds.map(s => (
                        <option key={s.stop_id} value={s.stop_id}>{s.stop_name}</option>
                    ))}
                </select>
              </div>
            </div>
          </div>

          {/* Price selection */}
          <div style={{ marginBottom: 20 }}>
            <div style={{ fontSize: 10, fontWeight: 800, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 8 }}>Prix payé (FCFA)</div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 6, marginBottom: 10 }}>
              {PRIX_RAPIDES.map(p => (
                <button
                  key={p}
                  onClick={() => setPrix(p)}
                  className="press"
                  style={{
                    padding: '10px 0', borderRadius: 10, border: '2px solid',
                    borderColor: prix === p ? 'var(--orange)' : 'var(--line)',
                    background: prix === p ? 'color-mix(in oklab, var(--orange) 10%, transparent)' : 'var(--cream-2)',
                    color: prix === p ? 'var(--orange)' : 'var(--ink)',
                    fontWeight: 900, fontSize: 13, cursor: 'pointer'
                  }}
                >
                  {p}
                </button>
              ))}
            </div>
            <input
              type="number"
              placeholder="Montant personnalisé..."
              value={prix !== null && !PRIX_RAPIDES.includes(prix) ? String(prix) : ''}
              onChange={e => { const v = parseInt(e.target.value); if (!isNaN(v) && v > 0) setPrix(v); else setPrix(null); }}
              style={{ width: '100%', padding: '12px 14px', borderRadius: 12, border: '1px solid var(--line)', background: 'var(--cream-2)', fontSize: 14, color: 'var(--ink)', outline: 'none', boxSizing: 'border-box' }}
            />
          </div>

          {/* Moment */}
          <div style={{ marginBottom: 24 }}>
            <div style={{ fontSize: 10, fontWeight: 800, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 8 }}>Moment du trajet</div>
            <div style={{ display: 'flex', gap: 6 }}>
              {MOMENTS.map(m => (
                <button
                  key={m.value}
                  onClick={() => setMoment(m.value)}
                  className="press"
                  style={{
                    flex: 1, padding: '8px 4px', borderRadius: 10, border: '2px solid',
                    borderColor: moment === m.value ? 'var(--orange)' : 'var(--line)',
                    background: moment === m.value ? 'color-mix(in oklab, var(--orange) 10%, transparent)' : 'var(--cream-2)',
                    color: moment === m.value ? 'var(--orange)' : 'var(--muted)',
                    fontWeight: 800, fontSize: 9, cursor: 'pointer',
                    display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4
                  }}
                >
                  <span style={{ fontSize: 18 }}>{m.emoji}</span>
                  {m.label}
                </button>
              ))}
            </div>
          </div>

          {error && (
            <div style={{ marginBottom: 12, padding: '10px 14px', borderRadius: 10, background: 'color-mix(in oklab, var(--orange-deep) 10%, transparent)', color: 'var(--orange-deep)', fontSize: 12, fontWeight: 700 }}>
              {error}
            </div>
          )}
        </div>

        {/* Footer / Validation */}
        <div style={{ padding: 20, background: 'var(--cream)', borderTop: '1px solid var(--line)' }}>
          <button
            onClick={handleSubmit}
            disabled={!canSubmit}
            className="press"
            style={{
              width: '100%', height: 50, borderRadius: 14, border: 'none',
              background: canSubmit ? 'var(--orange)' : 'var(--line)',
              color: canSubmit ? '#fff' : 'var(--muted)',
              fontSize: 15, fontWeight: 900, cursor: canSubmit ? 'pointer' : 'default',
              boxShadow: canSubmit ? '0 8px 20px rgba(242,108,26,0.25)' : 'none',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8
            }}
          >
            {submitting ? 'Envoi...' : (
                <>
                   <span>Confirmer {prix ? `${prix}F` : ''}</span>
                   <Ic.Arrow s={16} />
                </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
