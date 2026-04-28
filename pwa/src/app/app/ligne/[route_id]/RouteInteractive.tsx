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
  const cutIdx     = cutAtId  ? orderedStops.findIndex(s => s.stop_id === cutAtId)  : -1;

  // Segment de la carte : du point d'embarquement (ou début) jusqu'à la destination choisie
  const segStart = cutIdx >= 0 && currentIdx >= 0 ? currentIdx : 0;
  const segEnd   = cutIdx >= 0 ? cutIdx : orderedStops.length - 1;

  const displayedStops = cutIdx >= 0
    ? orderedStops.slice(segStart, segEnd + 1)
    : orderedStops;

  const displayedShape = (() => {
    if (!shapePoints.length || cutIdx < 0) return shapePoints;
    const startStop = orderedStops[segStart];
    const endStop   = orderedStops[segEnd];
    const i0 = startStop ? nearestShapeIdx(shapePoints, startStop.stop_lat, startStop.stop_lon) : 0;
    const i1 = endStop   ? nearestShapeIdx(shapePoints, endStop.stop_lat,   endStop.stop_lon)   : shapePoints.length - 1;
    return shapePoints.slice(Math.min(i0, i1), Math.max(i0, i1) + 1);
  })();

  // Durée et prix basés sur le trajet réel (embarquement → destination)
  const journeyStart = currentIdx >= 0 ? currentIdx : 0;
  const journeyEnd   = cutIdx    >= 0 ? cutIdx    : orderedStops.length - 1;
  const journeyStops = Math.max(1, journeyEnd - journeyStart + 1);
  const estimatedMin = Math.max(3, journeyStops * 2);
  const estimatedPrice = journeyStops <= 3 ? '100F' : journeyStops <= 7 ? '200F' : journeyStops <= 12 ? '300F' : '500F';

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
        <Pill color="var(--ink)">{estimatedPrice}</Pill>
        <Pill color="var(--blue)">~{estimatedMin} min</Pill>
        <Pill color="var(--orange)">{journeyStops} arrêt{journeyStops > 1 ? 's' : ''}</Pill>
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
            <div
              key={`${stop.stop_id}-${stop.stop_sequence}`}
              style={{
                display: 'flex', gap: 12, alignItems: 'stretch',
                background: isCurrent ? 'color-mix(in oklab, var(--orange) 6%, transparent)' : 'transparent',
                borderRadius: isCurrent ? 14 : 0,
                margin: isCurrent ? '2px -8px' : 0,
                padding: isCurrent ? '0 8px' : 0,
                border: isCurrent ? '1px solid color-mix(in oklab, var(--orange) 18%, transparent)' : 'none',
              }}
            >

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
              <div style={{
                flex: 1, minWidth: 0,
                paddingTop: isCurrent ? 14 : 10, paddingBottom: isCurrent ? 14 : 10,
                borderBottom: !isLast && !isCurrent ? '1px solid color-mix(in oklab, var(--line) 55%, transparent)' : 'none',
              }}>
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

                {/* TU ES ICI — compact */}
                {isCurrent && (
                  <div style={{ marginTop: 6, display: 'flex', alignItems: 'center', gap: 8, padding: '5px 8px', borderRadius: 8, background: 'color-mix(in oklab, var(--orange) 8%, transparent)' }}>
                    <div className="shimmer" style={{ width: 5, height: 5, borderRadius: '50%', background: 'var(--orange)', flexShrink: 0 }} />
                    <span style={{ fontSize: 10, fontWeight: 800, color: 'var(--orange)', letterSpacing: 0.5, flex: 1 }}>TU ES ICI</span>
                    <Link
                      href={`/app/arret/${encodeURIComponent(stop.stop_id)}`}
                      style={{ padding: '4px 10px', borderRadius: 6, background: 'var(--orange)', color: '#fff', fontSize: 10, fontWeight: 800, textDecoration: 'none', flexShrink: 0, letterSpacing: 0.3 }}
                    >
                      Revenir aux détails
                    </Link>
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
