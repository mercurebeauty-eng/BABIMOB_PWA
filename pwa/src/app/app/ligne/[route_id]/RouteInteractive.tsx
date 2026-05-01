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
    <>\n      {/* ── Direction switch (unified UI) ── */}\n      <div style={{ display: 'flex', gap: 8, margin: '10px 16px 0', padding: 4, background: 'var(--cream-2)', borderRadius: 14, border: '1px solid var(--line)' }}>\n        {tripPerDir.map((dir) => (\n          <Link\n            key={dir.id}\n            href={`/app/ligne/${encodeURIComponent(routeId)}?dir=${dir.id}${fromStop ? `&from=${fromStop}` : ''}`}\n            style={{\n              flex: 1, textAlign: 'center', padding: '10px 8px', borderRadius: 10,\n              background: activeDirection === dir.id ? 'var(--cream)' : 'transparent',\n              color: activeDirection === dir.id ? 'var(--orange)' : 'var(--muted)',\n              fontWeight: 800, fontSize: 12, textDecoration: 'none',\n              textTransform: 'uppercase', letterSpacing: 0.3,\n              boxShadow: activeDirection === dir.id ? '0 2px 8px rgba(0,0,0,0.06)' : 'none',\n            }}\n          >\n            {dir.id === 0 ? '→' : '←'} {dir.headsign || `Dir. ${dir.id}`}\n          </Link>\n        ))}\n      </div>\n\n      {/* ── Info pills (dynamic) ── */}\n      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', padding: '10px 16px 12px', borderBottom: '1px solid var(--line)' }}>\n        {tripHeadsign && <Pill color="var(--green)">{showSegmentedView ? `→ ${orderedStops.find(s => s.stop_id === cutAtId)?.stop_name ?? tripHeadsign}` : `→ ${tripHeadsign}`}</Pill>}\n        <Pill color="var(--ink)">{estimatedPrice}</Pill>\n        <Pill color="var(--blue)">~{estimatedMin} min</Pill>\n        <Pill color="var(--orange)">{journeyStops} arrêt{journeyStops > 1 ? 's' : ''}</Pill>\n        {showSegmentedView && (\n          <button\n            onClick={resetSegmentation}\n            style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0, display: 'flex', alignItems: 'center' }}\n          >\n            <Pill color="var(--muted)">✕ Choisir une autre destination</Pill>\n          </button>\n        )}\n      </div>\n\n      {/* ── Map ── */}\n      <div style={{ height: 250, overflow: 'hidden', borderBottom: '1px solid var(--line)' }}>\n        <RouteMapWrapper\n          shape={displayedShape}\n          stops={displayedStops}\n          routeColor={routeColorRaw}\n          activeDirection={activeDirection}\n          isSegmented={showSegmentedView}\n        />\n      </div>\n\n      {/* ── Timeline ── */}\n      <div style={{ padding: '16px 16px 100px', position: 'relative' }}>\n        {fromStop && (\n          <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 10 }}>\n            <span style={{ fontSize: 9, fontWeight: 900, color: 'var(--green)', background: 'color-mix(in oklab, var(--green) 12%, transparent)', border: '1px solid color-mix(in oklab, var(--green) 25%, transparent)', borderRadius: 99, padding: '3px 8px', textTransform: 'uppercase', letterSpacing: 0.4 }}>\n              Votre arrêt mis en évidence\n            </span>\n          </div>\n        )}\n\n        {orderedStops.map((stop, idx) => {\n          const isFirst = idx === 0;\n          const isLast = idx === orderedStops.length - 1;\n          const isTerminus = isFirst || isLast;\n          const isCurrent = fromStop === stop.stop_id;\n          const isPast = currentIdx >= 0 && idx < currentIdx;\n          const isFuture = currentIdx >= 0 ? idx > currentIdx : !isFirst;\n          const noCtx = currentIdx < 0; \n          const isDestination = cutAtId === stop.stop_id;\n\n          const dotColor = isCurrent\n            ? 'var(--orange)'\n            : isDestination ? 'var(--gold)'\n            : isPast ? '#e53935'\n            : isTerminus ? 'var(--blue)'\n            : isFuture ? 'var(--green)'\n            : 'var(--line)';\n\n          const lineColor = isPast ? '#e53935' : isCurrent ? 'var(--orange)' : noCtx ? 'var(--line)' : 'var(--green)';\n          const lineDashed = !isPast && !isCurrent && !noCtx;\n\n          const dotSize = isCurrent ? 40 : isDestination ? 30 : isTerminus ? 20 : 14;\n\n          return (\n            <div\n              key={`${stop.stop_id}-${stop.stop_sequence}`}\n              style={{\n                display: 'flex', gap: 12, alignItems: 'stretch',\n                background: isCurrent ? 'color-mix(in oklab, var(--orange) 6%, transparent)' : isDestination ? 'color-mix(in oklab, var(--gold) 6%, transparent)' : 'transparent',\n                borderRadius: (isCurrent || isDestination) ? 14 : 0,\n                margin: (isCurrent || isDestination) ? '2px -8px' : 0,\n                padding: (isCurrent || isDestination) ? '0 8px' : 0,\n                border: (isCurrent || isDestination) ? `1px solid color-mix(in oklab, ${isCurrent ? 'var(--orange)' : 'var(--gold)'} 18%, transparent)` : 'none',\n              }}\n            >\n              {/* Timeline column */}\n              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: 24, flexShrink: 0 }}>\n                <div style={{\n                  flex: 1, width: 2, minHeight: 14,\n                  background: isFirst ? 'transparent' : lineColor,\n                  backgroundImage: lineDashed ? 'repeating-linear-gradient(180deg, currentColor 0 4px, transparent 4px 8px)' : 'none',\n                }} />\n                <div style={{ position: 'relative', flexShrink: 0 }}>\n                  {(isCurrent || isDestination) && (\n                    <div className="pulse-ring" style={{\n                      position: 'absolute', top: '50%', left: '50%',\n                      transform: 'translate(-50%,-50%)',\n                      width: 52, height: 52, borderRadius: '50%',\n                      background: isCurrent ? 'var(--orange)' : 'var(--gold)', opacity: 0.2, pointerEvents: 'none',\n                    }} />\n                  )}\n                  <div style={{\n                    width: dotSize, height: dotSize, borderRadius: '50%', flexShrink: 0,\n                    background: dotColor,\n                    border: (isCurrent || isDestination) ? '3px solid var(--cream)' : 'none',\n                    boxShadow: (isCurrent || isDestination)\n                      ? `0 0 0 2px ${isCurrent ? 'var(--orange)' : 'var(--gold)'}, 0 4px 12px rgba(0,0,0,0.15)`\n                      : isTerminus ? `0 0 0 3px color-mix(in oklab, var(--blue) 20%, transparent)` : 'none',\n                    display: 'flex', alignItems: 'center', justifyContent: 'center',\n                  }}>\n                    {isCurrent && <Vehicle kind={typeKind} size={22} color="#fff" />}\n                    {isDestination && <Ic.Star s={18} fill color="#fff" />}\n                  </div>\n                </div>\n                <div style={{\n                  flex: 1, width: 2, minHeight: 14,\n                  background: isLast ? 'transparent' : lineColor,\n                  backgroundImage: lineDashed ? 'repeating-linear-gradient(180deg, currentColor 0 4px, transparent 4px 8px)' : 'none',\n                }} />\n              </div>\n\n              {/* Content column */}\n              <div style={{\n                flex: 1, minWidth: 0,\n                paddingTop: (isCurrent || isDestination) ? 14 : 10, paddingBottom: (isCurrent || isDestination) ? 14 : 10,\n                borderBottom: !isLast && !isCurrent && !isDestination ? '1px solid color-mix(in oklab, var(--line) 55%, transparent)' : 'none',\n              }}>\n                {isCurrent || isDestination ? (\n                  <div>\n                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>\n                      <span className="font-display" style={{ fontSize: 18, fontWeight: 900, color: isCurrent ? 'var(--orange)' : 'var(--gold)' }}>\n                        {stop.stop_name}\n                      </span>\n                      <span style={{ fontSize: 8, fontWeight: 900, color: isCurrent ? 'var(--orange)' : 'var(--gold)', background: `color-mix(in oklab, ${isCurrent ? 'var(--orange)' : 'var(--gold)'} 12%, transparent)`, border: `1px solid color-mix(in oklab, ${isCurrent ? 'var(--orange)' : 'var(--gold)'} 25%, transparent)`, borderRadius: 99, padding: '2px 6px', textTransform: 'uppercase', letterSpacing: 0.4 }}>\n                        {isCurrent ? 'TU ES ICI' : 'DESTINATION'}\n                      </span>\n                    </div>\n                    {stop.commune && (\n                      <div style={{ fontSize: 10, color: 'var(--muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: 0.4, marginTop: 2 }}>{stop.commune}</div>\n                    )}\n                  </div>\n                ) : (\n                  <Link\n                    href={`/app/arret/${encodeURIComponent(stop.stop_id)}`}\n                    style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8, textDecoration: 'none' }}\n                  >\n                    <div style={{ minWidth: 0 }}>\n                      <div style={{\n                        fontSize: isTerminus ? 15 : 13,\n                        fontWeight: isTerminus ? 800 : isPast ? 500 : 600,\n                        color: isPast ? 'var(--muted)' : isTerminus ? 'var(--ink)' : 'var(--ink-2)',\n                        textDecoration: isPast ? 'line-through' : 'none',\n                        opacity: isPast ? 0.55 : 1,\n                        whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',\n                      }}>{stop.stop_name}</div>\n                      {stop.commune && (\n                        <div style={{ fontSize: 10, color: 'var(--muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: 0.4, marginTop: 1 }}>{stop.commune}</div>\n                      )}\n                    </div>\n                    <div style={{ color: 'var(--line)', flexShrink: 0 }}><Ic.Arrow s={14} /></div>\n                  </Link>\n                )}\n\n                {isCurrent && (\n                  <div style={{ marginTop: 8, display: 'flex', gap: 8 }}>\n                     <button className="press" style={{ padding: '6px 12px', borderRadius: 8, background: 'var(--orange)', color: '#fff', fontSize: 10, fontWeight: 800, border: 'none', cursor: 'pointer' }}>\n                        Suivi en direct\n                     </button>\n                  </div>\n                )}\n\n                {isDestination && (\n                  <div style={{ marginTop: 8, display: 'flex', gap: 8 }}>\n                     <button className="press" onClick={resetSegmentation} style={{ padding: '6px 12px', borderRadius: 8, background: 'var(--muted)', color: '#fff', fontSize: 10, fontWeight: 800, border: 'none', cursor: 'pointer' }}>\n                        Changer destination\n                     </button>\n                  </div>\n                )}\n\n                {isFuture && !isCurrent && !isDestination && !showSegmentedView && (\n                  <button\n                    className="press"\n                    onClick={() => handleDescendIci(stop)}\n                    style={{ marginTop: 4, padding: '5px 10px', borderRadius: 8, background: 'var(--orange)', color: '#fff', fontSize: 11, fontWeight: 800, border: 'none', cursor: 'pointer', letterSpacing: 0.3 }}\n                  >\n                    Je descends ici 🎯\n                  </button>\n                )}\n              </div>\n            </div>\n          );\n        })}\n      </div>\n    </>\n  );\n}\n