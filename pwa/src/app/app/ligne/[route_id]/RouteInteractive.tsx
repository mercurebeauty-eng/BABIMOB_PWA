'use client';

import { useState, useCallback, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import RouteMapWrapper from './RouteMapWrapper';
import Vehicle from '@/components/ui/Vehicle';
import { Pill } from '@/components/ui/Pill';
import { Ic } from '@/components/ui/Ic';
import type { Sense } from './page';

// ── Types ────────────────────────────────────────────────────────────

type StopRow = {
  stop_id: string;
  stop_name: string;
  commune: string | null;
  stop_lat: number;
  stop_lon: number;
  stop_sequence: number;
};

type ShapePoint = { shape_pt_lat: number; shape_pt_lon: number };

type SegmentState = { cutAtId: string | null; showSeg: boolean };

type Props = {
  senses: Sense[];
  availableDirs: number[];
  routeColor: string;
  routeColorRaw: string;
  fromStop: string | undefined;
  typeKind: 'gbaka' | 'woro' | 'taxi' | 'saloni';
  initialActiveDirection: number;
  routeId: string;
};

// ── Helpers ──────────────────────────────────────────────────────────

function nearestShapeIdx(shape: ShapePoint[], lat: number, lon: number): number {
  let best = 0, bestD = Infinity;
  shape.forEach((pt, i) => {
    const d = Math.abs(pt.shape_pt_lat - lat) + Math.abs(pt.shape_pt_lon - lon);
    if (d < bestD) { bestD = d; best = i; }
  });
  return best;
}

// ── SenseView ────────────────────────────────────────────────────────
//
// Composant autonome : gère son propre état de segmentation.
// Keyed par senseIndex dans le parent → remount complet au changement de sens,
// ce qui réinitialise automatiquement cutAtId et showSeg.
//
// fromStop : undefined quand la direction a été changée manuellement, pour
// éviter l'artefact "tout en rouge".

type SenseViewProps = {
  sense: Sense;
  senseIndex: number;
  fromStop: string | undefined;
  typeKind: 'gbaka' | 'woro' | 'taxi' | 'saloni';
  onSegmentChange: (seg: SegmentState) => void;
};

function SenseView({ sense, senseIndex, fromStop, typeKind, onSegmentChange }: SenseViewProps) {
  const { stops } = sense;

  // État interne : isolation totale entre les deux sens
  const [cutAtId, setCutAtId] = useState<string | null>(null);
  const [showSeg, setShowSeg] = useState(false);

  // ── Arrêts absents ──
  if (stops.length === 0) {
    return (
      <div style={{ padding: '48px 16px', textAlign: 'center' }}>
        <div style={{ fontSize: 36, marginBottom: 12 }}>🚌</div>
        <div style={{ fontWeight: 700, fontSize: 14, color: 'var(--ink-2)' }}>
          Aucun arrêt pour cette direction
        </div>
        <div style={{ fontSize: 12, marginTop: 6, color: 'var(--muted)' }}>
          Les données GTFS ne sont pas disponibles pour ce sens.
        </div>
      </div>
    );
  }

  // Indices dans la liste COMPLÈTE du sens
  const currentIdx = fromStop ? stops.findIndex((s) => s.stop_id === fromStop) : -1;
  const cutIdx     = cutAtId  ? stops.findIndex((s) => s.stop_id === cutAtId)  : -1;

  const segStart = showSeg && currentIdx >= 0 ? currentIdx : 0;
  const segEnd   = showSeg && cutIdx >= 0     ? cutIdx     : stops.length - 1;

  // Tranche d'arrêts affichés
  const displayed = showSeg ? stops.slice(segStart, segEnd + 1) : stops;

  const handleDescendIci = (stop: StopRow) => {
    setCutAtId(stop.stop_id);
    setShowSeg(true);
    onSegmentChange({ cutAtId: stop.stop_id, showSeg: true });
    try {
      localStorage.setItem('babimob_lastDest', JSON.stringify({
        name: stop.stop_name, commune: stop.commune,
        lat: stop.stop_lat, lon: stop.stop_lon,
      }));
    } catch (_) {}
  };

  const handleReset = () => {
    setCutAtId(null);
    setShowSeg(false);
    onSegmentChange({ cutAtId: null, showSeg: false });
  };

  return (
    <div style={{ padding: '16px 16px 100px', position: 'relative' }}>
      {/* Badge "votre arrêt mis en évidence" — uniquement si fromStop trouvé */}
      {currentIdx >= 0 && !showSeg && (
        <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 10 }}>
          <span style={{
            fontSize: 9, fontWeight: 900, color: 'var(--blue)',
            background: 'color-mix(in oklab, var(--blue) 12%, transparent)',
            border: '1px solid color-mix(in oklab, var(--blue) 25%, transparent)',
            borderRadius: 99, padding: '3px 8px', textTransform: 'uppercase', letterSpacing: 0.4,
          }}>
            Votre arrêt mis en évidence
          </span>
        </div>
      )}

      {displayed.map((stop, displayIdx) => {
        // Indice réel dans la liste complète
        const realIdx = stops.findIndex((s) => s.stop_id === stop.stop_id);

        const isDisplayFirst = displayIdx === 0;
        const isDisplayLast  = displayIdx === displayed.length - 1;

        // Terminus = premier ou dernier de la ROUTE COMPLÈTE
        const isTerminus = realIdx === 0 || realIdx === stops.length - 1;

        const isCurrent     = fromStop === stop.stop_id;
        const isPast        = currentIdx >= 0 && realIdx < currentIdx;
        const isFuture      = currentIdx >= 0 ? realIdx > currentIdx : !isDisplayFirst;
        const isDestination = cutAtId === stop.stop_id;
        const isOnJourney   = showSeg && currentIdx >= 0 && cutIdx >= 0 && realIdx > currentIdx && realIdx < cutIdx;

        // ── Couleurs premium ──
        const dotColor = isCurrent
          ? 'var(--blue)'
          : isDestination ? 'var(--green)'
          : isPast ? '#e53935'
          : isTerminus ? 'var(--ink)'
          : isOnJourney ? 'var(--gold)'
          : isFuture ? 'color-mix(in oklab, var(--line) 40%, transparent)'
          : 'var(--line)';

        const lineColor = isPast
          ? '#e53935'
          : (isCurrent || isOnJourney || (currentIdx >= 0 && cutIdx >= 0 && realIdx <= cutIdx))
          ? 'var(--gold)'
          : 'var(--line)';

        const lineDashed = !isPast
          && !isCurrent
          && !isOnJourney
          && !(currentIdx >= 0 && cutIdx >= 0 && realIdx <= cutIdx);

        const dotSize = isCurrent ? 44 : isDestination ? 34 : isTerminus ? 22 : isOnJourney ? 16 : 12;

        const itemKey = `${senseIndex}-${stop.stop_id}`;

        return (
          <div
            key={itemKey}
            style={{
              display: 'flex', gap: 14, alignItems: 'stretch',
              background: isCurrent
                ? 'color-mix(in oklab, var(--blue) 6%, transparent)'
                : isDestination
                ? 'color-mix(in oklab, var(--green) 6%, transparent)'
                : 'transparent',
              borderRadius: (isCurrent || isDestination) ? 18 : 0,
              margin:  (isCurrent || isDestination) ? '4px -10px' : 0,
              padding: (isCurrent || isDestination) ? '4px 10px' : 0,
              border: (isCurrent || isDestination)
                ? `1.5px solid color-mix(in oklab, ${isCurrent ? 'var(--blue)' : 'var(--green)'} 20%, transparent)`
                : 'none',
              transition: 'all 0.3s ease',
            }}
          >
            {/* ── Timeline column ── */}
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: 28, flexShrink: 0 }}>
              <div style={{
                flex: 1, width: isPast || isCurrent || isOnJourney ? 3 : 2, minHeight: 16,
                background: isDisplayFirst ? 'transparent' : lineColor,
                backgroundImage: lineDashed
                  ? 'repeating-linear-gradient(180deg, currentColor 0 4px, transparent 4px 8px)'
                  : 'none',
                transition: 'background 0.3s',
              }} />
              <div style={{ position: 'relative', flexShrink: 0 }}>
                {(isCurrent || isDestination) && (
                  <div className="pulse-ring" style={{
                    position: 'absolute', top: '50%', left: '50%',
                    transform: 'translate(-50%,-50%)',
                    width: dotSize + 16, height: dotSize + 16, borderRadius: '50%',
                    background: isCurrent ? 'var(--blue)' : 'var(--green)',
                    opacity: 0.15, pointerEvents: 'none',
                  }} />
                )}
                <div style={{
                  width: dotSize, height: dotSize, borderRadius: '50%', flexShrink: 0,
                  background: dotColor,
                  border: (isCurrent || isDestination) ? '3px solid var(--cream)' : isOnJourney ? '2px solid var(--cream)' : 'none',
                  boxShadow: (isCurrent || isDestination)
                    ? `0 0 0 2px ${isCurrent ? 'var(--blue)' : 'var(--green)'}, 0 4px 14px rgba(0,0,0,0.18)`
                    : isTerminus ? '0 0 0 3px color-mix(in oklab, var(--ink) 12%, transparent)' : 'none',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  transition: 'all 0.3s ease',
                }}>
                  {isCurrent     && <Vehicle kind={typeKind} size={24} color="#fff" />}
                  {isDestination && <Ic.Pin s={18} fill color="#fff" />}
                </div>
              </div>
              <div style={{
                flex: 1, width: isPast || isCurrent || isOnJourney ? 3 : 2, minHeight: 16,
                background: isDisplayLast ? 'transparent' : lineColor,
                backgroundImage: lineDashed
                  ? 'repeating-linear-gradient(180deg, currentColor 0 4px, transparent 4px 8px)'
                  : 'none',
                transition: 'background 0.3s',
              }} />
            </div>

            {/* ── Content column ── */}
            <div style={{
              flex: 1, minWidth: 0,
              paddingTop:    (isCurrent || isDestination) ? 16 : 12,
              paddingBottom: (isCurrent || isDestination) ? 16 : 12,
              borderBottom: !isDisplayLast && !isCurrent && !isDestination
                ? '1px solid color-mix(in oklab, var(--line) 50%, transparent)'
                : 'none',
            }}>
              {isCurrent || isDestination ? (
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                    <span className="font-display" style={{ fontSize: 18, fontWeight: 900, color: isCurrent ? 'var(--blue)' : 'var(--green)' }}>
                      {stop.stop_name}
                    </span>
                    <span style={{
                      fontSize: 9, fontWeight: 900,
                      color: '#fff',
                      background: isCurrent ? 'var(--blue)' : 'var(--green)',
                      borderRadius: 6, padding: '3px 8px',
                      textTransform: 'uppercase', letterSpacing: 0.6,
                    }}>
                      {isCurrent ? 'DÉPART' : 'ARRIVÉE'}
                    </span>
                  </div>
                  {stop.commune && (
                    <div style={{ fontSize: 11, color: 'var(--muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: 0.4, marginTop: 3 }}>
                      {stop.commune}
                    </div>
                  )}
                </div>
              ) : (
                <a
                  href={`/app/arret/${encodeURIComponent(stop.stop_id)}`}
                  style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8, textDecoration: 'none' }}
                >
                  <div style={{ minWidth: 0 }}>
                    <div style={{
                      fontSize: isTerminus ? 15 : 13,
                      fontWeight: isTerminus ? 800 : isPast ? 500 : isOnJourney ? 700 : 600,
                      color: isPast ? 'var(--muted)' : isOnJourney ? 'var(--ink)' : isTerminus ? 'var(--ink)' : 'var(--ink-2)',
                      textDecoration: isPast ? 'line-through' : 'none',
                      opacity: isPast ? 0.5 : 1,
                      whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
                    }}>
                      {stop.stop_name}
                    </div>
                    {stop.commune && (
                      <div style={{ fontSize: 10, color: 'var(--muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: 0.4, marginTop: 1 }}>
                        {stop.commune}
                      </div>
                    )}
                  </div>
                  <div style={{ color: 'var(--line)', flexShrink: 0 }}><Ic.Arrow s={14} /></div>
                </a>
              )}

              {/* Departure actions */}
              {isCurrent && (
                <div style={{ marginTop: 10, display: 'flex', gap: 8 }}>
                  <button className="press" style={{
                    padding: '8px 16px', borderRadius: 10,
                    background: 'var(--orange)', color: '#fff',
                    fontSize: 11, fontWeight: 800, border: 'none', cursor: 'pointer',
                    display: 'flex', alignItems: 'center', gap: 6,
                    boxShadow: '0 3px 10px rgba(242,108,26,0.3)',
                    letterSpacing: 0.3,
                  }}>
                    <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#fff', animation: 'pulse 1.5s infinite' }} />
                    Suivi en direct
                  </button>
                </div>
              )}

              {/* Destination actions */}
              {isDestination && (
                <div style={{ marginTop: 10, display: 'flex', gap: 8 }}>
                  <button className="press" onClick={handleReset} style={{
                    padding: '8px 16px', borderRadius: 10,
                    background: 'var(--cream)', color: 'var(--ink)',
                    fontSize: 11, fontWeight: 800, border: '1.5px solid var(--line)', cursor: 'pointer',
                    letterSpacing: 0.3,
                  }}>
                    Changer destination
                  </button>
                </div>
              )}

              {/* "Je descends ici" : arrêts futurs uniquement, hors mode segmenté */}
              {isFuture && !isCurrent && !isDestination && !showSeg && (
                <button
                  className="press"
                  onClick={() => handleDescendIci(stop)}
                  style={{
                    marginTop: 6, padding: '7px 14px', borderRadius: 10,
                    background: 'color-mix(in oklab, var(--orange) 10%, transparent)',
                    color: 'var(--orange)', fontSize: 11, fontWeight: 800,
                    border: '1.5px solid color-mix(in oklab, var(--orange) 25%, transparent)',
                    cursor: 'pointer', letterSpacing: 0.3,
                    transition: 'all 0.2s',
                  }}
                >
                  Je descends ici 🎯
                </button>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ── Composant principal ──────────────────────────────────────────────

export default function RouteInteractive({
  senses, availableDirs, routeColor, routeColorRaw,
  fromStop, typeKind, initialActiveDirection, routeId,
}: Props) {
  const router = useRouter();

  const [activeDir, setActiveDir] = useState(initialActiveDirection);

  // fromStop actif : undefined si l'utilisateur a changé de direction manuellement.
  const [activeDirFromStop, setActiveDirFromStop] = useState<string | undefined>(fromStop);

  // Données de segmentation du sens actif, remontées par SenseView → carte
  const [activeSegment, setActiveSegment] = useState<SegmentState>({ cutAtId: null, showSeg: false });

  // ── Extraction symétrique des deux sens ──
  const activeSense = senses[activeDir] ?? { stops: [], shape: [], headsign: null };

  // ── Sauvegarde dans les récents ──
  useEffect(() => {
    if (typeof window === 'undefined') return;
    try {
      const lineData = { id: routeId, name: activeSense.headsign || `Ligne ${routeId}`, type: typeKind, color: routeColorRaw, timestamp: Date.now() };
      const saved = JSON.parse(localStorage.getItem('babimob_recentLines') || '[]');
      localStorage.setItem('babimob_recentLines', JSON.stringify(
        [lineData, ...saved.filter((l: { id: string }) => l.id !== routeId)].slice(0, 5)
      ));
    } catch (_) {}
  }, [routeId, typeKind, routeColorRaw, activeSense.headsign]);

  // ── Calculs pour la carte et les pills ──
  const currentIdx = activeDirFromStop
    ? activeSense.stops.findIndex((s) => s.stop_id === activeDirFromStop)
    : -1;
  const cutIdx = activeSegment.cutAtId
    ? activeSense.stops.findIndex((s) => s.stop_id === activeSegment.cutAtId)
    : -1;

  const segStart = activeSegment.showSeg && currentIdx >= 0 ? currentIdx : 0;
  const segEnd   = activeSegment.showSeg && cutIdx >= 0     ? cutIdx     : activeSense.stops.length - 1;

  // Arrêts et shape envoyés à la carte
  const mapStops: StopRow[] = activeSegment.showSeg
    ? activeSense.stops.slice(segStart, segEnd + 1)
    : activeSense.stops;

  const mapShape = (() => {
    const shape = activeSense.shape;
    if (!shape.length || !activeSegment.showSeg) return shape;
    const s0 = activeSense.stops[segStart];
    const s1 = activeSense.stops[segEnd];
    const i0 = s0 ? nearestShapeIdx(shape, s0.stop_lat, s0.stop_lon) : 0;
    const i1 = s1 ? nearestShapeIdx(shape, s1.stop_lat, s1.stop_lon) : shape.length - 1;
    return shape.slice(Math.min(i0, i1), Math.max(i0, i1) + 1);
  })();

  // Stats trajet pour les pills
  const journeyStart = currentIdx >= 0 ? currentIdx : 0;
  const journeyEnd   = activeSegment.showSeg && cutIdx >= 0 ? cutIdx : activeSense.stops.length - 1;
  const journeyStops = Math.max(1, journeyEnd - journeyStart + 1);
  const estimatedMin = Math.max(3, journeyStops * 2);
  const estimatedPrice = journeyStops <= 3 ? '100F' : journeyStops <= 7 ? '200F' : journeyStops <= 12 ? '300F' : '500F';

  // ── Bascule de direction ──
  const switchDirection = (dir: number) => {
    if (dir === activeDir) return;
    setActiveDir(dir);
    setActiveDirFromStop(undefined);
    setActiveSegment({ cutAtId: null, showSeg: false });
    const url = new URL(window.location.href);
    url.searchParams.set('dir', String(dir));
    url.searchParams.delete('from');
    router.replace(url.pathname + url.search);
  };

  const handleSegmentChange = useCallback((seg: SegmentState) => {
    setActiveSegment(seg);
  }, []);

  // Nom de la destination segmentée pour la pill
  const destStopName = activeSegment.cutAtId
    ? activeSense.stops.find((s) => s.stop_id === activeSegment.cutAtId)?.stop_name
    : undefined;

  return (
    <>
      {/* ── Sélecteur de direction ── */}
      {availableDirs.length > 1 && (
        <div style={{ display: 'flex', gap: 8, margin: '10px 16px 0', padding: 4, background: 'var(--cream-2)', borderRadius: 14, border: '1px solid var(--line)' }}>
          {availableDirs.map((dir) => (
            <button
              key={dir}
              onClick={() => switchDirection(dir)}
              style={{
                flex: 1, textAlign: 'center', padding: '10px 8px', borderRadius: 10,
                background: activeDir === dir ? 'var(--cream)' : 'transparent',
                color: activeDir === dir ? 'var(--orange)' : 'var(--muted)',
                fontWeight: 800, fontSize: 12, border: 'none', cursor: 'pointer',
                textTransform: 'uppercase', letterSpacing: 0.3,
                boxShadow: activeDir === dir ? '0 2px 8px rgba(0,0,0,0.06)' : 'none',
                transition: 'all 0.2s ease',
              }}
            >
              {dir === 0 ? '→' : '←'} {senses[dir]?.headsign ?? `Dir. ${dir}`}
            </button>
          ))}
        </div>
      )}

      {/* ── Journey summary card (when segmented) ── */}
      {activeSegment.showSeg && currentIdx >= 0 && cutIdx >= 0 && (
        <div style={{
          margin: '12px 16px 0', padding: 16, borderRadius: 18,
          background: 'linear-gradient(135deg, var(--blue) 0%, #1a4fd4 100%)',
          color: '#fff', position: 'relative', overflow: 'hidden'
        }}>
          <div className="wax-bg" style={{ position: 'absolute', inset: 0, opacity: 0.1 }} />
          <div style={{ position: 'relative', zIndex: 1 }}>
            <div style={{ fontSize: 9, fontWeight: 900, letterSpacing: 1.5, opacity: 0.7, marginBottom: 10, textTransform: 'uppercase' }}>Ton trajet</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2, flexShrink: 0 }}>
                <div style={{ width: 12, height: 12, borderRadius: '50%', background: '#fff', border: '3px solid rgba(255,255,255,0.4)' }} />
                <div style={{ width: 2, height: 24, background: 'rgba(255,255,255,0.3)' }} />
                <div style={{ width: 12, height: 12, borderRadius: '50%', background: 'var(--green)', border: '3px solid rgba(255,255,255,0.4)' }} />
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 14, fontWeight: 800, marginBottom: 8 }}>{activeSense.stops[currentIdx]?.stop_name}</div>
                <div style={{ fontSize: 14, fontWeight: 800, color: '#a5f3c4' }}>{activeSense.stops[cutIdx]?.stop_name}</div>
              </div>
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              <div style={{ padding: '6px 12px', borderRadius: 99, background: 'rgba(255,255,255,0.2)', fontSize: 12, fontWeight: 800 }}>~{estimatedMin} min</div>
              <div style={{ padding: '6px 12px', borderRadius: 99, background: 'rgba(255,255,255,0.2)', fontSize: 12, fontWeight: 800 }}>{estimatedPrice}</div>
              <div style={{ padding: '6px 12px', borderRadius: 99, background: 'rgba(255,255,255,0.2)', fontSize: 12, fontWeight: 800 }}>{journeyStops} arrêts</div>
              <button onClick={() => setActiveSegment({ cutAtId: null, showSeg: false })} style={{ marginLeft: 'auto', padding: '6px 12px', borderRadius: 99, background: 'rgba(255,255,255,0.15)', border: '1px solid rgba(255,255,255,0.3)', color: '#fff', fontSize: 11, fontWeight: 800, cursor: 'pointer' }}>✕</button>
            </div>
          </div>
        </div>
      )}

      {/* ── Info pills (when NOT segmented) ── */}
      {!activeSegment.showSeg && (
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', padding: '10px 16px 12px', borderBottom: '1px solid var(--line)' }}>
          {activeSense.headsign && <Pill color="var(--green)">→ {activeSense.headsign}</Pill>}
          <Pill color="var(--ink)">{estimatedPrice}</Pill>
          <Pill color="var(--blue)">~{estimatedMin} min</Pill>
          <Pill color="var(--orange)">{journeyStops} arrêt{journeyStops > 1 ? 's' : ''}</Pill>
        </div>
      )}

      {/* ── Carte (singleton — ne se recrée pas au changement de direction) ── */}
      <div style={{ height: 250, overflow: 'hidden', borderBottom: '1px solid var(--line)' }}>
        <RouteMapWrapper
          shape={mapShape}
          stops={mapStops}
          routeColor={routeColorRaw}
          isSegmented={activeSegment.showSeg}
        />
      </div>

      {/* ── Timeline ──
          key={`sense-${activeDir}`} → remount complet au changement de sens,
          ce qui réinitialise l'état interne de SenseView (cutAtId, showSeg).
      ── */}
      <SenseView
        key={`sense-${activeDir}`}
        sense={activeSense}
        senseIndex={activeDir}
        fromStop={activeDirFromStop}
        typeKind={typeKind}
        onSegmentChange={handleSegmentChange}
      />
    </>
  );
}
