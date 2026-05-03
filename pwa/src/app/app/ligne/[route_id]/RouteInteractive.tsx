'use client';

import { useState, useCallback, useEffect } from 'react';
import Link from 'next/link';
import RouteMapWrapper from './RouteMapWrapper';
import Vehicle from '@/components/ui/Vehicle';
import { Pill } from '@/components/ui/Pill';
import { Ic } from '@/components/ui/Ic';

type StopRow = {
  stop_id: string;
  stop_name: string;
  commune: string | null;
  stop_lat: number;
  stop_lon: number;
  stop_sequence: number;
};

type ShapePoint = { shape_pt_lat: number; shape_pt_lon: number };

type Props = {
  orderedStops: StopRow[];
  shapePoints: ShapePoint[];
  routeColor: string;
  routeColorRaw: string;
  fromStop: string | undefined;
  typeKind: 'gbaka' | 'woro' | 'taxi' | 'saloni';
  tripHeadsign: string | null;
  activeDirection: number;
  tripPerDir: {id: number, headsign: string | null}[];
  routeId: string;
};

function nearestShapeIdx(shape: ShapePoint[], lat: number, lon: number): number {
  let best = 0, bestD = Infinity;
  shape.forEach((pt, i) => {
    const d = Math.abs(pt.shape_pt_lat - lat) + Math.abs(pt.shape_pt_lon - lon);
    if (d < bestD) { bestD = d; best = i; }
  });
  return best;
}

export default function RouteInteractive({
  orderedStops, shapePoints, routeColor, routeColorRaw,
  fromStop, typeKind, tripHeadsign, activeDirection, tripPerDir, routeId
}: Props) {
  const [cutAtId, setCutAtId] = useState<string | null>(null);
  const [showSegmentedView, setShowSegmentedView] = useState(false);

  // Sauvegarder dans les récents
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const lineData = {
        id: routeId,
        name: tripHeadsign || `Ligne ${routeId}`,
        type: typeKind,
        color: routeColorRaw,
        timestamp: Date.now()
      };
      
      try {
        const saved = JSON.parse(localStorage.getItem('babimob_recentLines') || '[]');
        const filtered = saved.filter((l: any) => l.id !== routeId);
        const updated = [lineData, ...filtered].slice(0, 5);
        localStorage.setItem('babimob_recentLines', JSON.stringify(updated));
      } catch (e) {
        console.error("Erreur localStorage recents:", e);
      }
    }
  }, [routeId, tripHeadsign, typeKind, routeColorRaw]);

  const currentIdx = fromStop ? orderedStops.findIndex(s => s.stop_id === fromStop) : -1;
  const cutIdx     = cutAtId  ? orderedStops.findIndex(s => s.stop_id === cutAtId)  : -1;

  const segStart = (showSegmentedView && currentIdx >= 0) ? currentIdx : 0;
  const segEnd   = (showSegmentedView && cutIdx >= 0) ? cutIdx : orderedStops.length - 1;

  const displayedStops = showSegmentedView
    ? orderedStops.slice(segStart, segEnd + 1)
    : orderedStops;

  const displayedShape = (() => {
    if (!shapePoints.length || !showSegmentedView) return shapePoints;
    const startStop = orderedStops[segStart];
    const endStop   = orderedStops[segEnd];
    const i0 = startStop ? nearestShapeIdx(shapePoints, startStop.stop_lat, startStop.stop_lon) : 0;
    const i1 = endStop   ? nearestShapeIdx(shapePoints, endStop.stop_lat,   endStop.stop_lon)   : shapePoints.length - 1;
    return shapePoints.slice(Math.min(i0, i1), Math.max(i0, i1) + 1);
  })();

  const journeyStart = currentIdx >= 0 ? currentIdx : 0;
  const journeyEnd   = (showSegmentedView && cutIdx >= 0) ? cutIdx : orderedStops.length - 1;
  const journeyStops = Math.max(1, journeyEnd - journeyStart + 1);
  const estimatedMin = Math.max(3, journeyStops * 2);
  const estimatedPrice = journeyStops <= 3 ? '100F' : journeyStops <= 7 ? '200F' : journeyStops <= 12 ? '300F' : '500F';

  const handleDescendIci = useCallback((stop: StopRow) => {
    setCutAtId(stop.stop_id);
    setShowSegmentedView(true);
    const dest = { name: stop.stop_name, commune: stop.commune, lat: stop.stop_lat, lon: stop.stop_lon };
    localStorage.setItem('babimob_lastDest', JSON.stringify(dest));
  }, []);

  const resetSegmentation = () => {
    setCutAtId(null);
    setShowSegmentedView(false);
  };

  return (
    <>
      {/* ── Direction switch ── */}
      <div style={{ display: 'flex', gap: 8, margin: '10px 16px 0', padding: 4, background: 'var(--cream-2)', borderRadius: 14, border: '1px solid var(--line)' }}>
        {tripPerDir.map((dir) => (
          <Link
            key={dir.id}
            href={`/app/ligne/${encodeURIComponent(routeId)}?dir=${dir.id}${fromStop ? `&from=${fromStop}` : ''}`}
            style={{
              flex: 1, textAlign: 'center', padding: '10px 8px', borderRadius: 10,
              background: activeDirection === dir.id ? 'var(--cream)' : 'transparent',
              color: activeDirection === dir.id ? 'var(--orange)' : 'var(--muted)',
              fontWeight: 800, fontSize: 12, textDecoration: 'none',
              textTransform: 'uppercase', letterSpacing: 0.3,
              boxShadow: activeDirection === dir.id ? '0 2px 8px rgba(0,0,0,0.06)' : 'none',
            }}
          >
            {dir.id === 0 ? '→' : '←'} {dir.headsign || `Dir. ${dir.id}`}
          </Link>
        ))}
      </div>

      {/* ── Journey summary card ── */}
      {showSegmentedView && currentIdx >= 0 && cutIdx >= 0 && (
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
                <div style={{ fontSize: 14, fontWeight: 800, marginBottom: 8 }}>{orderedStops[currentIdx]?.stop_name}</div>
                <div style={{ fontSize: 14, fontWeight: 800, color: '#a5f3c4' }}>{orderedStops[cutIdx]?.stop_name}</div>
              </div>
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              <div style={{ padding: '6px 12px', borderRadius: 99, background: 'rgba(255,255,255,0.2)', fontSize: 12, fontWeight: 800 }}>~{estimatedMin} min</div>
              <div style={{ padding: '6px 12px', borderRadius: 99, background: 'rgba(255,255,255,0.2)', fontSize: 12, fontWeight: 800 }}>{estimatedPrice}</div>
              <div style={{ padding: '6px 12px', borderRadius: 99, background: 'rgba(255,255,255,0.2)', fontSize: 12, fontWeight: 800 }}>{journeyStops} arrêts</div>
              <button onClick={resetSegmentation} style={{ marginLeft: 'auto', padding: '6px 12px', borderRadius: 99, background: 'rgba(255,255,255,0.15)', border: '1px solid rgba(255,255,255,0.3)', color: '#fff', fontSize: 11, fontWeight: 800, cursor: 'pointer' }}>✕</button>
            </div>
          </div>
        </div>
      )}

      {/* ── Info pills (when NOT segmented) ── */}
      {!showSegmentedView && (
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', padding: '10px 16px 12px', borderBottom: '1px solid var(--line)' }}>
          {tripHeadsign && <Pill color="var(--green)">→ {tripHeadsign}</Pill>}
          <Pill color="var(--ink)">{estimatedPrice}</Pill>
          <Pill color="var(--blue)">~{estimatedMin} min</Pill>
          <Pill color="var(--orange)">{journeyStops} arrêt{journeyStops > 1 ? 's' : ''}</Pill>
        </div>
      )}

      {/* ── Map ── */}
      <div style={{ height: 250, overflow: 'hidden', borderBottom: '1px solid var(--line)' }}>
        <RouteMapWrapper
          shape={displayedShape}
          stops={displayedStops}
          routeColor={routeColorRaw}
          activeDirection={activeDirection}
          isSegmented={showSegmentedView}
        />
      </div>

      {/* ── Timeline ── */}
      <div style={{ padding: '16px 16px 100px', position: 'relative' }}>
        {fromStop && !showSegmentedView && (
          <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 10 }}>
            <span style={{ fontSize: 9, fontWeight: 900, color: 'var(--blue)', background: 'color-mix(in oklab, var(--blue) 12%, transparent)', border: '1px solid color-mix(in oklab, var(--blue) 25%, transparent)', borderRadius: 99, padding: '3px 8px', textTransform: 'uppercase', letterSpacing: 0.4 }}>
              Votre arrêt mis en évidence
            </span>
          </div>
        )}

        {orderedStops.map((stop, idx) => {
          const isFirst = idx === 0;
          const isLast = idx === orderedStops.length - 1;
          const isTerminus = isFirst || isLast;
          const isCurrent = fromStop === stop.stop_id;
          const isPast = currentIdx >= 0 && idx < currentIdx;
          const isFuture = currentIdx >= 0 ? idx > currentIdx : !isFirst;
          const isDestination = cutAtId === stop.stop_id;
          const isOnJourney = showSegmentedView && currentIdx >= 0 && cutIdx >= 0 && idx > currentIdx && idx < cutIdx;

          // Colors
          const dotColor = isCurrent
            ? 'var(--blue)'
            : isDestination ? 'var(--green)'
            : isPast ? '#e53935'
            : isTerminus ? 'var(--ink)'
            : isOnJourney ? 'var(--gold)'
            : isFuture ? 'color-mix(in oklab, var(--line) 40%, transparent)'
            : 'var(--line)';

          const lineColor = isPast ? '#e53935' : (isCurrent || isOnJourney) ? 'var(--gold)' : 'var(--line)';
          const lineDashed = !isPast && !isCurrent && !isOnJourney;

          const dotSize = isCurrent ? 44 : isDestination ? 34 : isTerminus ? 22 : isOnJourney ? 16 : 12;

          return (
            <div
              key={`${stop.stop_id}-${stop.stop_sequence}`}
              style={{
                display: 'flex', gap: 14, alignItems: 'stretch',
                background: isCurrent
                  ? 'color-mix(in oklab, var(--blue) 6%, transparent)'
                  : isDestination
                  ? 'color-mix(in oklab, var(--green) 6%, transparent)'
                  : 'transparent',
                borderRadius: (isCurrent || isDestination) ? 18 : 0,
                margin: (isCurrent || isDestination) ? '4px -10px' : 0,
                padding: (isCurrent || isDestination) ? '4px 10px' : 0,
                border: (isCurrent || isDestination) ? `1.5px solid color-mix(in oklab, ${isCurrent ? 'var(--blue)' : 'var(--green)'} 20%, transparent)` : 'none',
                transition: 'all 0.3s ease',
              }}
            >
              {/* Timeline column */}
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: 28, flexShrink: 0 }}>
                <div style={{
                  flex: 1, width: isPast || isCurrent || isOnJourney ? 3 : 2, minHeight: 16,
                  background: isFirst ? 'transparent' : lineColor,
                  backgroundImage: lineDashed ? 'repeating-linear-gradient(180deg, currentColor 0 4px, transparent 4px 8px)' : 'none',
                  transition: 'background 0.3s',
                }} />
                <div style={{ position: 'relative', flexShrink: 0 }}>
                  {(isCurrent || isDestination) && (
                    <div className="pulse-ring" style={{
                      position: 'absolute', top: '50%', left: '50%',
                      transform: 'translate(-50%,-50%)',
                      width: dotSize + 16, height: dotSize + 16, borderRadius: '50%',
                      background: isCurrent ? 'var(--blue)' : 'var(--green)', opacity: 0.15, pointerEvents: 'none',
                    }} />
                  )}
                  <div style={{
                    width: dotSize, height: dotSize, borderRadius: '50%', flexShrink: 0,
                    background: dotColor,
                    border: (isCurrent || isDestination) ? '3px solid var(--cream)' : isOnJourney ? '2px solid var(--cream)' : 'none',
                    boxShadow: (isCurrent || isDestination)
                      ? `0 0 0 2px ${isCurrent ? 'var(--blue)' : 'var(--green)'}, 0 4px 14px rgba(0,0,0,0.18)`
                      : isTerminus ? `0 0 0 3px color-mix(in oklab, var(--ink) 12%, transparent)` : 'none',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    transition: 'all 0.3s ease',
                  }}>
                    {isCurrent && <Vehicle kind={typeKind} size={24} color="#fff" />}
                    {isDestination && <Ic.Pin s={18} fill color="#fff" />}
                  </div>
                </div>
                <div style={{
                  flex: 1, width: isPast || isCurrent || isOnJourney ? 3 : 2, minHeight: 16,
                  background: isLast ? 'transparent' : lineColor,
                  backgroundImage: lineDashed ? 'repeating-linear-gradient(180deg, currentColor 0 4px, transparent 4px 8px)' : 'none',
                  transition: 'background 0.3s',
                }} />
              </div>

              {/* Content column */}
              <div style={{
                flex: 1, minWidth: 0,
                paddingTop: (isCurrent || isDestination) ? 16 : 12, paddingBottom: (isCurrent || isDestination) ? 16 : 12,
                borderBottom: !isLast && !isCurrent && !isDestination ? '1px solid color-mix(in oklab, var(--line) 50%, transparent)' : 'none',
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
                      <div style={{ fontSize: 11, color: 'var(--muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: 0.4, marginTop: 3 }}>{stop.commune}</div>
                    )}
                  </div>
                ) : (
                  <Link
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
                      }}>{stop.stop_name}</div>
                      {stop.commune && (
                        <div style={{ fontSize: 10, color: 'var(--muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: 0.4, marginTop: 1 }}>{stop.commune}</div>
                      )}
                    </div>
                    <div style={{ color: 'var(--line)', flexShrink: 0 }}><Ic.Arrow s={14} /></div>
                  </Link>
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
                      letterSpacing: 0.3
                    }}>
                      <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#fff', animation: 'pulse 1.5s infinite' }} />
                      Suivi en direct
                    </button>
                  </div>
                )}

                {/* Destination actions */}
                {isDestination && (
                  <div style={{ marginTop: 10, display: 'flex', gap: 8 }}>
                    <button className="press" onClick={resetSegmentation} style={{
                      padding: '8px 16px', borderRadius: 10,
                      background: 'var(--cream)', color: 'var(--ink)',
                      fontSize: 11, fontWeight: 800, border: '1.5px solid var(--line)', cursor: 'pointer',
                      letterSpacing: 0.3
                    }}>
                      Changer destination
                    </button>
                  </div>
                )}

                {/* "Je descends ici" on future stops */}
                {isFuture && !isCurrent && !isDestination && !showSegmentedView && (
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
    </>
  );
}
