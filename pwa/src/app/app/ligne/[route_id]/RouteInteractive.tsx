'use client';

import { useState, useCallback, useEffect } from 'react';
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

type SenseViewProps = {
  sense: Sense;
  senseIndex: number;
  fromStop: string | undefined;
  typeKind: 'gbaka' | 'woro' | 'taxi' | 'saloni';
  routeColorRaw: string;
  onSegmentChange: (seg: SegmentState) => void;
};

function SenseView({ sense, senseIndex, fromStop, typeKind, routeColorRaw, onSegmentChange }: SenseViewProps) {
  const { stops } = sense;

  const [cutAtId, setCutAtId] = useState<string | null>(null);
  const [showSeg, setShowSeg] = useState(false);

  if (stops.length === 0) {
    return (
      <div style={{ padding: '48px 16px', textAlign: 'center' }}>
        <div style={{ fontSize: 36, marginBottom: 12 }}>🚌</div>
        <div style={{ fontWeight: 700, fontSize: 14, color: 'var(--ink-2)' }}>Aucun arrêt pour cette direction</div>
        <div style={{ fontSize: 12, marginTop: 6, color: 'var(--muted)' }}>Les données GTFS ne sont pas disponibles pour ce sens.</div>
      </div>
    );
  }

  // Si fromStop est défini, trouver l'arrêt correspondant. Sinon, le premier arrêt est le départ implicite.
  const currentIdx = fromStop
    ? stops.findIndex((s) => s.stop_id === fromStop)
    : 0;
  const cutIdx     = cutAtId  ? stops.findIndex((s) => s.stop_id === cutAtId)  : -1;

  const segStart = showSeg && currentIdx >= 0 ? currentIdx : 0;
  const segEnd   = showSeg && cutIdx >= 0     ? cutIdx     : stops.length - 1;

  const displayed = showSeg ? stops.slice(segStart, segEnd + 1) : stops;

  const routeColor = `#${routeColorRaw}`;

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
        const realIdx = stops.findIndex((s) => s.stop_id === stop.stop_id);

        const isDisplayFirst = displayIdx === 0;
        const isDisplayLast  = displayIdx === displayed.length - 1;
        const isTerminus = realIdx === 0 || realIdx === stops.length - 1;

        const isCurrent     = currentIdx >= 0 && realIdx === currentIdx;
        const isPast        = currentIdx >= 0 && realIdx < currentIdx;
        const isFuture      = currentIdx >= 0 ? realIdx > currentIdx : false;
        const isDestination = cutAtId === stop.stop_id;

        // ── Couleurs fidèles au design original ──
        // Points : passé = rouge, courant = bleu, destination = vert, terminus = ink, futur = ligne pâle
        const dotColor = isCurrent
          ? 'var(--blue)'
          : isDestination ? 'var(--green)'
          : isPast ? '#e53935'
          : isTerminus ? routeColor
          : 'var(--line)';

        // Ligne : passé = rouge solide, courant→destination = orange/gold solide, reste = tirets orange
        const lineColor = isPast ? '#e53935'
          : isCurrent ? routeColor
          : (showSeg && currentIdx >= 0 && cutIdx >= 0 && realIdx >= currentIdx && realIdx <= cutIdx) ? routeColor
          : routeColor;

        const lineSolid = isPast || isCurrent || (showSeg && currentIdx >= 0 && cutIdx >= 0 && realIdx >= currentIdx && realIdx <= cutIdx);

        const dotSize = isCurrent ? 40 : isDestination ? 30 : isTerminus ? 18 : 12;

        const itemKey = `${senseIndex}-${stop.stop_id}`;

        return (
          <div
            key={itemKey}
            style={{
              display: 'flex', gap: 12, alignItems: 'stretch',
              background: isCurrent
                ? 'color-mix(in oklab, var(--blue) 6%, transparent)'
                : isDestination
                ? 'color-mix(in oklab, var(--green) 6%, transparent)'
                : 'transparent',
              borderRadius: (isCurrent || isDestination) ? 14 : 0,
              margin:  (isCurrent || isDestination) ? '2px -8px' : 0,
              padding: (isCurrent || isDestination) ? '0 8px' : 0,
              border: (isCurrent || isDestination)
                ? `1px solid color-mix(in oklab, ${isCurrent ? 'var(--blue)' : 'var(--green)'} 18%, transparent)`
                : 'none',
            }}
          >
            {/* ── Timeline column ── */}
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: 24, flexShrink: 0 }}>
              <div style={{
                flex: 1, width: lineSolid ? 3 : 2, minHeight: 14,
                background: isDisplayFirst ? 'transparent' : lineColor,
                backgroundImage: !lineSolid && !isDisplayFirst
                  ? 'repeating-linear-gradient(180deg, currentColor 0 4px, transparent 4px 8px)'
                  : 'none',
              }} />
              <div style={{ position: 'relative', flexShrink: 0 }}>
                {(isCurrent || isDestination) && (
                  <div className="pulse-ring" style={{
                    position: 'absolute', top: '50%', left: '50%',
                    transform: 'translate(-50%,-50%)',
                    width: 52, height: 52, borderRadius: '50%',
                    background: isCurrent ? 'var(--blue)' : 'var(--green)', opacity: 0.2, pointerEvents: 'none',
                  }} />
                )}
                <div style={{
                  width: dotSize, height: dotSize, borderRadius: '50%', flexShrink: 0,
                  background: dotColor,
                  border: (isCurrent || isDestination) ? '3px solid var(--cream)' : 'none',
                  boxShadow: (isCurrent || isDestination)
                    ? `0 0 0 2px ${isCurrent ? 'var(--blue)' : 'var(--green)'}, 0 4px 12px rgba(0,0,0,0.15)`
                    : isTerminus ? `0 0 0 3px color-mix(in oklab, ${routeColor} 15%, transparent)` : 'none',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  {isCurrent     && <Vehicle kind={typeKind} size={22} color="#fff" />}
                  {isDestination && <Ic.Star s={16} fill color="#fff" />}
                </div>
              </div>
              <div style={{
                flex: 1, width: lineSolid ? 3 : 2, minHeight: 14,
                background: isDisplayLast ? 'transparent' : lineColor,
                backgroundImage: !lineSolid && !isDisplayLast
                  ? 'repeating-linear-gradient(180deg, currentColor 0 4px, transparent 4px 8px)'
                  : 'none',
              }} />
            </div>

            {/* ── Content column ── */}
            <div style={{
              flex: 1, minWidth: 0,
              paddingTop:    (isCurrent || isDestination) ? 14 : 10,
              paddingBottom: (isCurrent || isDestination) ? 14 : 10,
              borderBottom: !isDisplayLast && !isCurrent && !isDestination
                ? '1px solid color-mix(in oklab, var(--line) 55%, transparent)'
                : 'none',
            }}>
              {isCurrent || isDestination ? (
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                    <span className="font-display" style={{ fontSize: 18, fontWeight: 900, color: isCurrent ? 'var(--blue)' : 'var(--green)' }}>
                      {stop.stop_name}
                    </span>
                    <span style={{
                      fontSize: 8, fontWeight: 900,
                      color: isCurrent ? 'var(--blue)' : 'var(--green)',
                      background: `color-mix(in oklab, ${isCurrent ? 'var(--blue)' : 'var(--green)'} 12%, transparent)`,
                      border: `1px solid color-mix(in oklab, ${isCurrent ? 'var(--blue)' : 'var(--green)'} 25%, transparent)`,
                      borderRadius: 99, padding: '2px 6px', textTransform: 'uppercase', letterSpacing: 0.4,
                    }}>
                      {isCurrent ? 'DÉPART' : 'DESTINATION'}
                    </span>
                  </div>
                  {stop.commune && (
                    <div style={{ fontSize: 10, color: 'var(--muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: 0.4, marginTop: 2 }}>
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
                      fontWeight: isTerminus ? 800 : isPast ? 500 : 600,
                      color: isPast ? 'var(--muted)' : isTerminus ? 'var(--ink)' : 'var(--ink-2)',
                      textDecoration: isPast ? 'line-through' : 'none',
                      opacity: isPast ? 0.55 : 1,
                      whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
                    }}>{stop.stop_name}</div>
                    {stop.commune && (
                      <div style={{ fontSize: 10, color: 'var(--muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: 0.4, marginTop: 1 }}>
                        {stop.commune}
                      </div>
                    )}
                  </div>
                  <div style={{ color: 'var(--line)', flexShrink: 0 }}><Ic.Arrow s={14} /></div>
                </a>
              )}

              {/* Suivi en direct button */}
              {isCurrent && (
                <div style={{ marginTop: 8, display: 'flex', gap: 8 }}>
                  <button className="press" style={{
                    padding: '6px 12px', borderRadius: 8,
                    background: 'var(--orange)', color: '#fff',
                    fontSize: 10, fontWeight: 800, border: 'none', cursor: 'pointer',
                  }}>
                    Suivi en direct
                  </button>
                </div>
              )}

              {/* Changer destination */}
              {isDestination && (
                <div style={{ marginTop: 8, display: 'flex', gap: 8 }}>
                  <button className="press" onClick={handleReset} style={{
                    padding: '6px 12px', borderRadius: 8,
                    background: 'var(--muted)', color: '#fff',
                    fontSize: 10, fontWeight: 800, border: 'none', cursor: 'pointer',
                  }}>
                    Changer destination
                  </button>
                </div>
              )}

              {/* Je descends ici — future stops only, not in segmented mode */}
              {isFuture && !isCurrent && !isDestination && !showSeg && (
                <button
                  className="press"
                  onClick={() => handleDescendIci(stop)}
                  style={{
                    marginTop: 4, padding: '5px 10px', borderRadius: 8,
                    background: 'var(--orange)', color: '#fff',
                    fontSize: 11, fontWeight: 800, border: 'none',
                    cursor: 'pointer', letterSpacing: 0.3,
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
  const [activeDir, setActiveDir] = useState(initialActiveDirection);
  const [activeDirFromStop, setActiveDirFromStop] = useState<string | undefined>(fromStop);
  const [activeSegment, setActiveSegment] = useState<SegmentState>({ cutAtId: null, showSeg: false });

  const activeSense = senses[activeDir] ?? { stops: [], shape: [], headsign: null };

  // ── FIX URL : garantir ?dir= dans l'URL dès le montage (sans casser from) ──
  useEffect(() => {
    const url = new URL(window.location.href);
    if (!url.searchParams.has('dir')) {
      url.searchParams.set('dir', String(initialActiveDirection));
      // Utiliser window.history pour éviter un re-render Next.js qui perdrait le state
      window.history.replaceState(null, '', url.pathname + url.search);
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

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

  // ── Calculs pour la carte ──
  const currentIdx = activeDirFromStop
    ? activeSense.stops.findIndex((s) => s.stop_id === activeDirFromStop)
    : 0; // Premier arrêt = départ implicite
  const cutIdx = activeSegment.cutAtId
    ? activeSense.stops.findIndex((s) => s.stop_id === activeSegment.cutAtId)
    : -1;

  const segStart = activeSegment.showSeg && currentIdx >= 0 ? currentIdx : 0;
  const segEnd   = activeSegment.showSeg && cutIdx >= 0     ? cutIdx     : activeSense.stops.length - 1;

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

  // Stats
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
    // Sync URL sans déclencher de navigation Next.js (pas de re-render serveur)
    const url = new URL(window.location.href);
    url.searchParams.set('dir', String(dir));
    url.searchParams.delete('from');
    window.history.replaceState(null, '', url.pathname + url.search);
  };

  const handleSegmentChange = useCallback((seg: SegmentState) => {
    setActiveSegment(seg);
  }, []);

  const destStopName = activeSegment.cutAtId
    ? activeSense.stops.find((s) => s.stop_id === activeSegment.cutAtId)?.stop_name
    : undefined;

  return (
    <>
      {/* ── Direction switch ── */}
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
              }}
            >
              {dir === 0 ? '→' : '←'} {senses[dir]?.headsign ?? `Dir. ${dir}`}
            </button>
          ))}
        </div>
      )}

      {/* ── Info pills ── */}
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', padding: '10px 16px 12px', borderBottom: '1px solid var(--line)' }}>
        {activeSense.headsign && (
          <Pill color="var(--green)">
            {activeSegment.showSeg && destStopName ? `→ ${destStopName}` : `→ ${activeSense.headsign}`}
          </Pill>
        )}
        <Pill color="var(--ink)">{estimatedPrice}</Pill>
        <Pill color="var(--blue)">~{estimatedMin} min</Pill>
        <Pill color="var(--orange)">{journeyStops} arrêt{journeyStops > 1 ? 's' : ''}</Pill>
        {activeSegment.showSeg && (
          <button
            onClick={() => setActiveSegment({ cutAtId: null, showSeg: false })}
            style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0, display: 'flex', alignItems: 'center' }}
          >
            <Pill color="var(--muted)">✕ Autre destination</Pill>
          </button>
        )}
      </div>

      {/* ── Map ── */}
      <div style={{ height: 250, overflow: 'hidden', borderBottom: '1px solid var(--line)' }}>
        <RouteMapWrapper
          shape={mapShape}
          stops={mapStops}
          routeColor={routeColorRaw}
          isSegmented={activeSegment.showSeg}
        />
      </div>

      {/* ── Timeline ── */}
      <SenseView
        key={`sense-${activeDir}`}
        sense={activeSense}
        senseIndex={activeDir}
        fromStop={activeDirFromStop}
        typeKind={typeKind}
        routeColorRaw={routeColorRaw}
        onSegmentChange={handleSegmentChange}
      />
    </>
  );
}
