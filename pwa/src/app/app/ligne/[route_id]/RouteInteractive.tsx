'use client';

import { useState, useCallback } from 'react';
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
      {/* ── Direction switch (unified UI) ── */}
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

      {/* ── Info pills (dynamic) ── */}
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', padding: '10px 16px 12px', borderBottom: '1px solid var(--line)' }}>
        {tripHeadsign && <Pill color=\"var(--green)\">{showSegmentedView ? `→ ${orderedStops.find(s => s.stop_id === cutAtId)?.stop_name ?? tripHeadsign}` : `→ ${tripHeadsign}`}</Pill>}
        <Pill color=\"var(--ink)\">{estimatedPrice}</Pill>
        <Pill color=\"var(--blue)\">~{estimatedMin} min</Pill>
        <Pill color=\"var(--orange)\">{journeyStops} arrêt{journeyStops > 1 ? 's' : ''}</Pill>
        {showSegmentedView && (
          <button
            onClick={resetSegmentation}
            style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0, display: 'flex', alignItems: 'center' }}
          >
            <Pill color=\"var(--muted)\">✕ Choisir une autre destination</Pill>
          </button>
        )}
      </div>

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
        {fromStop && (
          <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 10 }}>
            <span style={{ fontSize: 9, fontWeight: 900, color: 'var(--green)', background: 'color-mix(in oklab, var(--green) 12%, transparent)', border: '1px solid color-mix(in oklab, var(--green) 25%, transparent)', borderRadius: 99, padding: '3px 8px', textTransform: 'uppercase', letterSpacing: 0.4 }}>
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
          const noCtx = currentIdx < 0; 
          const isDestination = cutAtId === stop.stop_id;

          const dotColor = isCurrent
            ? 'var(--orange)'
            : isDestination ? 'var(--gold)'
            : isPast ? '#e53935'
            : isTerminus ? 'var(--blue)'
            : isFuture ? 'var(--green)'
            : 'var(--line)';

          const lineColor = isPast ? '#e53935' : isCurrent ? 'var(--orange)' : noCtx ? 'var(--line)' : 'var(--green)';
          const lineDashed = !isPast && !isCurrent && !noCtx;

          const dotSize = isCurrent ? 40 : isDestination ? 30 : isTerminus ? 20 : 14;

          return (
            <div
              key={`${stop.stop_id}-${stop.stop_sequence}`}
              style={{
                display: 'flex', gap: 12, alignItems: 'stretch',
                background: isCurrent ? 'color-mix(in oklab, var(--orange) 6%, transparent)' : isDestination ? 'color-mix(in oklab, var(--gold) 6%, transparent)' : 'transparent',
                borderRadius: (isCurrent || isDestination) ? 14 : 0,
                margin: (isCurrent || isDestination) ? '2px -8px' : 0,
                padding: (isCurrent || isDestination) ? '0 8px' : 0,
                border: (isCurrent || isDestination) ? `1px solid color-mix(in oklab, ${isCurrent ? 'var(--orange)' : 'var(--gold)'} 18%, transparent)` : 'none',
              }}
            >
              {/* Timeline column */}
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: 24, flexShrink: 0 }}>
                <div style={{
                  flex: 1, width: 2, minHeight: 14,
                  background: isFirst ? 'transparent' : lineColor,
                  backgroundImage: lineDashed ? 'repeating-linear-gradient(180deg, currentColor 0 4px, transparent 4px 8px)' : 'none',
                }} />
                <div style={{ position: 'relative', flexShrink: 0 }}>
                  {(isCurrent || isDestination) && (
                    <div className=\"pulse-ring\" style={{
                      position: 'absolute', top: '50%', left: '50%',
                      transform: 'translate(-50%,-50%)',
                      width: 52, height: 52, borderRadius: '50%',
                      background: isCurrent ? 'var(--orange)' : 'var(--gold)', opacity: 0.2, pointerEvents: 'none',
                    }} />
                  )}
                  <div style={{
                    width: dotSize, height: dotSize, borderRadius: '50%', flexShrink: 0,
                    background: dotColor,
                    border: (isCurrent || isDestination) ? '3px solid var(--cream)' : 'none',
                    boxShadow: (isCurrent || isDestination)
                      ? `0 0 0 2px ${isCurrent ? 'var(--orange)' : 'var(--gold)'}, 0 4px 12px rgba(0,0,0,0.15)`
                      : isTerminus ? `0 0 0 3px color-mix(in oklab, var(--blue) 20%, transparent)` : 'none',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}>
                    {isCurrent && <Vehicle kind={typeKind} size={22} color=\"#fff\" />}
                    {isDestination && <Ic.Star s={18} fill color=\"#fff\" />}
                  </div>
                </div>
                <div style={{
                  flex: 1, width: 2, minHeight: 14,
                  background: isLast ? 'transparent' : lineColor,
                  backgroundImage: lineDashed ? 'repeating-linear-gradient(180deg, currentColor 0 4px, transparent 4px 8px)' : 'none',
                }} />
              </div>

              {/* Content column */}
              <div style={{
                flex: 1, minWidth: 0,
                paddingTop: (isCurrent || isDestination) ? 14 : 10, paddingBottom: (isCurrent || isDestination) ? 14 : 10,
                borderBottom: !isLast && !isCurrent && !isDestination ? '1px solid color-mix(in oklab, var(--line) 55%, transparent)' : 'none',
              }}>
                {isCurrent || isDestination ? (
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                      <span className=\"font-display\" style={{ fontSize: 18, fontWeight: 900, color: isCurrent ? 'var(--orange)' : 'var(--gold)' }}>
                        {stop.stop_name}
                      </span>
                      <span style={{ fontSize: 8, fontWeight: 900, color: isCurrent ? 'var(--orange)' : 'var(--gold)', background: `color-mix(in oklab, ${isCurrent ? 'var(--orange)' : 'var(--gold)'} 12%, transparent)`, border: `1px solid color-mix(in oklab, ${isCurrent ? 'var(--orange)' : 'var(--gold)'} 25%, transparent)`, borderRadius: 99, padding: '2px 6px', textTransform: 'uppercase', letterSpacing: 0.4 }}>
                        {isCurrent ? 'TU ES ICI' : 'DESTINATION'}
                      </span>
                    </div>
                    {stop.commune && (
                      <div style={{ fontSize: 10, color: 'var(--muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: 0.4, marginTop: 2 }}>{stop.commune}</div>
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
                        fontWeight: isTerminus ? 800 : isPast ? 500 : 600,
                        color: isPast ? 'var(--muted)' : isTerminus ? 'var(--ink)' : 'var(--ink-2)',
                        textDecoration: isPast ? 'line-through' : 'none',
                        opacity: isPast ? 0.55 : 1,
                        whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
                      }}>{stop.stop_name}</div>
                      {stop.commune && (
                        <div style={{ fontSize: 10, color: 'var(--muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: 0.4, marginTop: 1 }}>{stop.commune}</div>
                      )}
                    </div>
                    <div style={{ color: 'var(--line)', flexShrink: 0 }}><Ic.Arrow s={14} /></div>
                  </Link>
                )}

                {isCurrent && (
                  <div style={{ marginTop: 8, display: 'flex', gap: 8 }}>
                     <button className=\"press\" style={{ padding: '6px 12px', borderRadius: 8, background: 'var(--orange)', color: '#fff', fontSize: 10, fontWeight: 800, border: 'none', cursor: 'pointer' }}>
                        Suivi en direct
                     </button>
                  </div>
                )}

                {isDestination && (
                  <div style={{ marginTop: 8, display: 'flex', gap: 8 }}>
                     <button className=\"press\" onClick={resetSegmentation} style={{ padding: '6px 12px', borderRadius: 8, background: 'var(--muted)', color: '#fff', fontSize: 10, fontWeight: 800, border: 'none', cursor: 'pointer' }}>
                        Changer destination
                     </button>
                  </div>
                )}

                {isFuture && !isCurrent && !isDestination && !showSegmentedView && (
                  <button
                    className=\"press\"
                    onClick={() => handleDescendIci(stop)}
                    style={{ marginTop: 4, padding: '5px 10px', borderRadius: 8, background: 'var(--orange)', color: '#fff', fontSize: 11, fontWeight: 800, border: 'none', cursor: 'pointer', letterSpacing: 0.3 }}
                  >
                    Je descends ici 🎯
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </>\n  );\n}\n