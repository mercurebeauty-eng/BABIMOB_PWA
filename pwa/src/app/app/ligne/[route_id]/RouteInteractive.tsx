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
  /** hex WITH # — used for CSS */
  routeColor: string;
  /** hex WITHOUT # — passed to RouteMapWrapper */
  routeColorRaw: string;
  fromStop: string | undefined;
  typeKind: 'gbaka' | 'woro' | 'taxi' | 'saloni';
  tripHeadsign: string | null;
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
  fromStop, typeKind, tripHeadsign,
}: Props) {
  const [cutAtId, setCutAtId] = useState<string | null>(null);

  const currentIdx = fromStop ? orderedStops.findIndex(s => s.stop_id === fromStop) : -1;

  // Stops & shape to show on the map
  const displayedStops = cutAtId
    ? orderedStops.slice(0, orderedStops.findIndex(s => s.stop_id === cutAtId) + 1)
    : orderedStops;

  const displayedShape = cutAtId
    ? (() => {
        const cut = orderedStops.find(s => s.stop_id === cutAtId);
        if (!cut || !shapePoints.length) return shapePoints;
        return shapePoints.slice(0, nearestShapeIdx(shapePoints, cut.stop_lat, cut.stop_lon) + 1);
      })()
    : shapePoints;

  const estimatedMin = Math.max(5, displayedStops.length * 2);

  const handleDescendIci = useCallback((stop: StopRow) => {
    setCutAtId(stop.stop_id);
    const dest = { name: stop.stop_name, commune: stop.commune, lat: stop.stop_lat, lon: stop.stop_lon };
    localStorage.setItem('babimob_lastDest', JSON.stringify(dest));
  }, []);

  return (
    <>
      {/* ── Info pills (dynamic) ── */}
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', padding: '10px 16px 12px', borderBottom: '1px solid var(--line)' }}>
        {tripHeadsign && <Pill color="var(--green)">{cutAtId ? `→ ${orderedStops.find(s => s.stop_id === cutAtId)?.stop_name ?? tripHeadsign}` : `→ ${tripHeadsign}`}</Pill>}
        <Pill color="var(--ink)">200F</Pill>
        <Pill color="var(--blue)">~{estimatedMin} min</Pill>
        <Pill color="var(--orange)">{displayedStops.length} arrêts</Pill>
        {cutAtId && (
          <button
            onClick={() => setCutAtId(null)}
            style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0, display: 'flex', alignItems: 'center' }}
          >
            <Pill color="var(--muted)">✕ Réinitialiser</Pill>
          </button>
        )}
      </div>

      {/* ── Map ── */}
      <div style={{ height: 200, overflow: 'hidden', borderBottom: '1px solid var(--line)' }}>
        <RouteMapWrapper
          shape={displayedShape}
          stops={displayedStops}
          routeColor={routeColorRaw}
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
          const noCtx = currentIdx < 0; // no fromStop provided

          const dotColor = isCurrent
            ? 'var(--orange)'
            : isPast ? '#e53935'
            : isTerminus ? 'var(--blue)'
            : isFuture ? 'var(--green)'
            : 'var(--line)';

          const lineColor = isPast ? '#e53935' : isCurrent ? 'var(--orange)' : noCtx ? 'var(--line)' : 'var(--green)';
          const lineDashed = !isPast && !isCurrent && !noCtx;

          const dotSize = isCurrent ? 40 : isTerminus ? 20 : 14;

          return (
            <div key={`${stop.stop_id}-${stop.stop_sequence}`} style={{ display: 'flex', gap: 12, alignItems: 'stretch' }}>

              {/* Timeline column */}
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: 24, flexShrink: 0 }}>
                {/* Connector above */}
                <div style={{
                  flex: 1, width: 2, minHeight: 14,
                  background: isFirst ? 'transparent' : lineColor,
                  backgroundImage: lineDashed ? 'repeating-linear-gradient(180deg, currentColor 0 4px, transparent 4px 8px)' : 'none',
                }} />

                {/* Dot */}
                <div style={{ position: 'relative', flexShrink: 0 }}>
                  {isCurrent && (
                    <div className="pulse-ring" style={{
                      position: 'absolute', top: '50%', left: '50%',
                      transform: 'translate(-50%,-50%)',
                      width: 52, height: 52, borderRadius: '50%',
                      background: 'var(--orange)', opacity: 0.2, pointerEvents: 'none',
                    }} />
                  )}
                  <div style={{
                    width: dotSize, height: dotSize, borderRadius: '50%', flexShrink: 0,
                    background: dotColor,
                    border: isCurrent ? '3px solid var(--cream)' : 'none',
                    boxShadow: isCurrent
                      ? '0 0 0 2px var(--orange), 0 4px 12px rgba(242,108,26,0.35)'
                      : isTerminus ? `0 0 0 3px color-mix(in oklab, var(--blue) 20%, transparent)` : 'none',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}>
                    {isCurrent && <Vehicle kind={typeKind} size={22} color="#fff" />}
                  </div>
                </div>

                {/* Connector below */}
                <div style={{
                  flex: 1, width: 2, minHeight: 14,
                  background: isLast ? 'transparent' : lineColor,
                  backgroundImage: lineDashed ? 'repeating-linear-gradient(180deg, currentColor 0 4px, transparent 4px 8px)' : 'none',
                }} />
              </div>

              {/* Content column */}
              <div style={{ flex: 1, minWidth: 0, paddingTop: isCurrent ? 16 : 12, paddingBottom: isCurrent ? 16 : 12 }}>
                {/* Stop name */}
                {isCurrent ? (
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                      <span className="font-display" style={{ fontSize: 18, fontWeight: 900, color: 'var(--orange)' }}>
                        {stop.stop_name}
                      </span>
                      <span style={{ fontSize: 8, fontWeight: 900, color: 'var(--orange)', background: 'color-mix(in oklab, var(--orange) 12%, transparent)', border: '1px solid color-mix(in oklab, var(--orange) 25%, transparent)', borderRadius: 99, padding: '2px 6px', textTransform: 'uppercase', letterSpacing: 0.4 }}>
                        VOTRE ARRÊT
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
                      }}>
                        {stop.stop_name}
                      </div>
                      {stop.commune && (
                        <div style={{ fontSize: 10, color: 'var(--muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: 0.4, marginTop: 1 }}>{stop.commune}</div>
                      )}
                    </div>
                    <div style={{ color: 'var(--line)', flexShrink: 0 }}><Ic.Arrow s={14} /></div>
                  </Link>
                )}

                {/* TU ES ICI encart */}
                {isCurrent && (
                  <div className="slide-up" style={{ marginTop: 10, padding: 12, borderRadius: 14, background: 'var(--cream-2)', border: '1.5px solid var(--orange)', boxShadow: '0 4px 12px rgba(242,108,26,0.12)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 6 }}>
                      <div className="shimmer" style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--orange)' }} />
                      <span style={{ fontSize: 11, fontWeight: 800, color: 'var(--orange)', letterSpacing: 0.5 }}>TU ES ICI</span>
                    </div>
                    {stop.commune && (
                      <div style={{ fontSize: 12, color: 'var(--ink-2)', marginBottom: 8 }}>Quartier {stop.commune}</div>
                    )}
                    <div style={{ display: 'flex', gap: 6 }}>
                      <Link
                        href={`/app/arret/${encodeURIComponent(stop.stop_id)}`}
                        style={{ flex: 1, padding: '8px', borderRadius: 10, background: 'var(--cream)', border: '1px solid var(--line)', color: 'var(--ink)', fontSize: 12, fontWeight: 700, textAlign: 'center', textDecoration: 'none' }}
                      >
                        Détail arrêt
                      </Link>
                      <button
                        className="press"
                        onClick={() => handleDescendIci(stop)}
                        style={{ flex: 1, padding: '8px', borderRadius: 10, background: 'var(--orange)', color: '#fff', fontSize: 12, fontWeight: 700, border: 'none', cursor: 'pointer' }}
                      >
                        Je descends
                      </button>
                    </div>
                  </div>
                )}

                {/* Je descends ici — future stops only */}
                {isFuture && !isCurrent && (
                  <button
                    className="press"
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
    </>
  );
}
