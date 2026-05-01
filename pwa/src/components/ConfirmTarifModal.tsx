'use client';

import { useState, useCallback, useRef, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Ic } from '@/components/ui/Ic';

type StopResult = { stop_id: string; stop_name: string; commune: string | null };

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

  const [direction, setDirection]       = useState<0 | 1>(0);
  const [selectedLineId, setSelectedLineId] = useState<string>(lines[0]?.route_id || '');
  const [segments, setSegments]         = useState<{from: string, to: string, to_id: string}[]>([]);
  const [selectedSegment, setSelectedSegment] = useState<string>('');
  const [prix, setPrix]                 = useState<number | null>(null);
  const [moment, setMoment]             = useState('journee');
  const [submitting, setSubmitting]     = useState(false);
  const [error, setError]               = useState<string | null>(null);
  const [loadingSegments, setLoadingSegments] = useState(false);

  // Charger les segments pour la ligne et le sens choisis
  useEffect(() => {
    async function loadSegments() {
      if (!selectedLineId) return;
      setLoadingSegments(true);
      
      // Récupérer le trip_id pour cette ligne et ce sens
      const { data: trips } = await supabase
        .from('gtfs_trips')
        .select('trip_id, trip_headsign')
        .eq('route_id', selectedLineId)
        .eq('direction_id', direction)
        .limit(1);

      if (trips && trips.length > 0) {
        const tripId = trips[0].trip_id;
        // Récupérer les arrêts de ce trip
        const { data: st } = await supabase
          .from('gtfs_stop_times')
          .select('stop_id, stop_sequence, gtfs_stops(stop_name)')
          .eq('trip_id', tripId)
          .order('stop_sequence');

        if (st) {
          const currentStopIdx = st.findIndex(s => s.stop_id === stopIdDepart);
          if (currentStopIdx !== -1) {
            // Segments possibles : de cet arrêt vers tous les arrêts suivants
            const possible = st.slice(currentStopIdx + 1).map(s => ({
              from: stopNameDepart,
              to: (s.gtfs_stops as any)?.stop_name || 'Inconnu',
              to_id: s.stop_id
            }));
            setSegments(possible);
          } else {
            setSegments([]);
          }
        }
      }
      setLoadingSegments(false);
    }
    loadSegments();
  }, [selectedLineId, direction, stopIdDepart, stopNameDepart, supabase]);

  const handleSubmit = async () => {
    const seg = segments.find(s => s.to_id === selectedSegment);
    if (!seg || prix === null) return;
    
    setSubmitting(true);
    setError(null);

    const { error: err } = await supabase.from('tarif_confirmations').insert({
      user_id: userId,
      stop_id_depart: stopIdDepart,
      stop_name_depart: stopNameDepart,
      stop_id_arrivee: seg.to_id,
      stop_name_arrivee: seg.to,
      direction_id: direction,
      prix,
      moment,
    });

    setSubmitting(false);
    if (err) { setError("Erreur lors de l'envoi. Réessaye."); return; }
    onSuccess();
  };

  const canSubmit = selectedSegment !== '' && prix !== null && !submitting;

  // Trouver le headsign actuel pour le libellé de direction
  const currentLine = lines.find(l => l.route_id === selectedLineId);
  const destinationLabel = direction === 0 ? "Aller" : "Retour";

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 1000, display: 'flex', alignItems: 'flex-end', justifyContent: 'center' }}>
      <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.4)', backdropFilter: 'blur(4px)' }} onClick={onClose} />

      <div style={{
        position: 'relative', width: '100%', maxWidth: 500, zIndex: 1,
        background: 'var(--cream)', borderRadius: '24px 24px 0 0',
        padding: '20px 20px calc(env(safe-area-inset-bottom, 0px) + 20px)',
        maxHeight: '92vh', overflowY: 'auto',
        boxShadow: '0 -10px 40px rgba(0,0,0,0.2)',
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

        {/* Ligne */}
        <div style={{ marginBottom: 18 }}>
          <div style={{ fontSize: 11, fontWeight: 800, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 8 }}>Ligne</div>
          <select
            value={selectedLineId}
            onChange={(e) => setSelectedLineId(e.target.value)}
            style={{
              width: '100%', padding: '12px 14px', borderRadius: 12,
              border: '1px solid var(--line)', background: 'var(--cream-2)',
              fontSize: 14, color: 'var(--ink)', outline: 'none',
            }}
          >
            {lines.map(l => (
              <option key={l.route_id} value={l.route_id}>{l.route_long_name}</option>
            ))}
          </select>
        </div>

        {/* Direction */}
        <div style={{ marginBottom: 18 }}>
          <div style={{ fontSize: 11, fontWeight: 800, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 8 }}>Direction</div>
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
                {d === 0 ? '→ Aller' : '← Retour'}
              </button>
            ))}
          </div>
        </div>

        {/* Segment selector */}
        <div style={{ marginBottom: 18 }}>
          <div style={{ fontSize: 11, fontWeight: 800, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 8 }}>Trajet effectué</div>
          {loadingSegments ? (
            <div style={{ fontSize: 12, color: 'var(--muted)' }}>Chargement des segments...</div>
          ) : (
            <select
              value={selectedSegment}
              onChange={(e) => setSelectedSegment(e.target.value)}
              style={{
                width: '100%', padding: '12px 14px', borderRadius: 12,
                border: '1px solid var(--line)', background: 'var(--cream-2)',
                fontSize: 14, color: 'var(--ink)', outline: 'none',
              }}
            >
              <option value="">Choisir votre destination...</option>
              {segments.map(s => (
                <option key={s.to_id} value={s.to_id}>{s.from} → {s.to}</option>
              ))}
            </select>
          )}
          {!loadingSegments && segments.length === 0 && (
            <div style={{ fontSize: 11, color: 'var(--orange-deep)', marginTop: 4 }}>
              Aucun arrêt de destination trouvé pour ce sens.
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
