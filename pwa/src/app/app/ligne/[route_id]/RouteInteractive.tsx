'use client';

import { useState, useCallback, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import RouteMapWrapper from './RouteMapWrapper';
import Vehicle from '@/components/ui/Vehicle';
import { Pill } from '@/components/ui/Pill';
import { Ic } from '@/components/ui/Ic';
import type { Sense } from './page';

// ── Types ─────────────────────────────────────────────────────────────

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
  senses: Sense[];
  availableDirs: number[];
  routeColor: string;
  routeColorRaw: string;
  fromStop: string | undefined;
  typeKind: 'gbaka' | 'woro' | 'taxi' | 'saloni';
  initialActiveDirection: number;
  routeId: string;
};

// ── Helpers ───────────────────────────────────────────────────────────

function nearestShapeIdx(shape: ShapePoint[], lat: number, lon: number): number {
  let best = 0, bestD = Infinity;
  shape.forEach((pt, i) => {
    const d = Math.abs(pt.shape_pt_lat - lat) + Math.abs(pt.shape_pt_lon - lon);
    if (d < bestD) { bestD = d; best = i; }
  });
  return best;
}

// ── SenseView : timeline des arrêts pour un sens ─────────────────────
//   Rendu strictement identique quel que soit le sens passé en prop.

type SenseViewProps = {
  sense: Sense;
  displayed: StopRow[];   // tranche affichée (segmentée ou complète)
  senseIndex: number;     // 0 ou 1 — utilisé comme préfixe des clés React
  fromStop: string | undefined;
  cutAtId: string | null;
  showSegmentedView: boolean;
  typeKind: 'gbaka' | 'woro' | 'taxi' | 'saloni';
  onDescendIci: (stop: StopRow) => void;
  onReset: () => void;
};

function SenseView({
  sense, displayed, senseIndex, fromStop, cutAtId,
  showSegmentedView, typeKind, onDescendIci, onReset,
}: SenseViewProps) {
  const { stops } = sense;

  // ── Arrêts absents ──
  if (stops.length === 0) {
    return (
      <div style={{ padding: '48px 16px', textAlign: 'center', color: 'var(--muted)' }}>
        <div style={{ fontSize: 36, marginBottom: 12 }}>🚧</div>
        <div style={{ fontWeight: 700, fontSize: 14, color: 'var(--ink-2)' }}>
          Aucun arrêt pour cette direction
        </div>
        <div style={{ fontSize: 12, marginTop: 6 }}>
          Les données GTFS ne sont pas disponibles pour ce sens.
        </div>
      </div>
    );
  }

  // Index dans le tableau COMPLET (pour les logiques passé/futur)
  const currentIdx = fromStop ? stops.findIndex((s) => s.stop_id === fromStop) : -1;
  const cutIdx     = cutAtId  ? stops.findIndex((s) => s.stop_id === cutAtId)  : -1;

  return (
    <div style={{ padding: '16px 16px 100px', position: 'relative' }}>
      {fromStop && (
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
        // Indice réel dans le tableau complet pour isPast / isFuture
        const realIdx = stops.findIndex((s) => s.stop_id === stop.stop_id);

        const isDisplayFirst = displayIdx === 0;
        const isDisplayLast  = displayIdx === displayed.length - 1;

        // Terminus = premier / dernier de la ROUTE COMPLÈTE (pas du segment)
        const isRouteFirst = realIdx === 0;
        const isRouteLast  = realIdx === stops.length - 1;
        const isTerminus   = isRouteFirst || isRouteLast;

        const isCurrent     = fromStop === stop.stop_id;
        const isPast        = currentIdx >= 0 && realIdx < currentIdx;
        const isFuture      = currentIdx >= 0 ? realIdx > currentIdx : !isDisplayFirst;
        const noCtx         = currentIdx < 0;
        const isDestination = cutAtId === stop.stop_id;

        // Couleurs (alignées avec la carte : Départ = Bleu, Destination = Vert)
        const dotColor = isCurrent
          ? 'var(--blue)'
          : isDestination ? 'var(--green)'
          : isPast ? '#e53935'
          : isTerminus ? 'var(--ink)'
          : isFuture
            ? 'color-mix(in oklab, var(--line) 40%, transparent)'
            : 'var(--line)';

        const lineColor  = isPast ? '#e53935'
          : (isCurrent || (currentIdx >= 0 && realIdx <= cutIdx && cutIdx >= 0)) ? 'var(--gold)'
          : noCtx ? 'var(--line)'
          : 'var(--line)';
        const lineDashed = !isPast && !isCurrent && !(currentIdx >= 0 && realIdx <= cutIdx && cutIdx >= 0);

        const dotSize = isCurrent ? 40 : isDestination ? 30 : isTerminus ? 20 : 14;

        // Clé unique : sens + id de l'arrêt (évite le recyclage d'état entre directions)
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
            {/* ── Colonne timeline ── */}
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: 24, flexShrink: 0 }}>
              {/* Ligne au-dessus */}
              <div style={{
                flex: 1, width: 2, minHeight: 14,
                background: isDisplayFirst ? 'transparent' : lineColor,
                backgroundImage: lineDashed
                  ? 'repeating-linear-gradient(180deg, currentColor 0 4px, transparent 4px 8px)'
                  : 'none',
              }} />
              {/* Point */}
              <div style={{ position: 'relative', flexShrink: 0 }}>
                {(isCurrent || isDestination) && (
                  <div className="pulse-ring" style={{
                    position: 'absolute', top: '50%', left: '50%',
                    transform: 'translate(-50%,-50%)',
                    width: 52, height: 52, borderRadius: '50%',
                    background: isCurrent ? 'var(--blue)' : 'var(--green)',
                    opacity: 0.2, pointerEvents: 'none',
                  }} />
                )}
                <div style={{
                  width: dotSize, height: dotSize, borderRadius: '50%', flexShrink: 0,
                  background: dotColor,
                  border: (isCurrent || isDestination) ? '3px solid var(--cream)' : 'none',
                  boxShadow: (isCurrent || isDestination)
                    ? `0 0 0 2px ${isCurrent ? 'var(--blue)' : 'var(--green)'}, 0 4px 12px rgba(0,0,0,0.15)`
                    : isTerminus ? '0 0 0 3px color-mix(in oklab, var(--ink) 10%, transparent)' : 'none',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  {isCurrent     && <Vehicle kind={typeKind} size={22} color="#fff" />}
                  {isDestination && <Ic.Star s={18} fill color="#fff" />}
                </div>
              </div>
              {/* Ligne en dessous */}
              <div style={{
                flex: 1, width: 2, minHeight: 14,
                background: isDisplayLast ? 'transparent' : lineColor,
                backgroundImage: lineDashed
                  ? 'repeating-linear-gradient(180deg, currentColor 0 4px, transparent 4px 8px)'
                  : 'none',
              }} />
            </div>

            {/* ── Colonne contenu ── */}
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

              {isCurrent && (
                <div style={{ marginTop: 8, display: 'flex', gap: 8 }}>
                  <button className="press" style={{ padding: '6px 12px', borderRadius: 8, background: 'var(--orange)', color: '#fff', fontSize: 10, fontWeight: 800, border: 'none', cursor: 'pointer' }}>
                    Suivi en direct
                  </button>
                </div>
              )}

              {isDestination && (
                <div style={{ marginTop: 8, display: 'flex', gap: 8 }}>
                  <button className="press" onClick={onReset} style={{ padding: '6px 12px', borderRadius: 8, background: 'var(--muted)', color: '#fff', fontSize: 10, fontWeight: 800, border: 'none', cursor: 'pointer' }}>
                    Changer destination
                  </button>
                </div>
              )}

              {/* Bouton "Je descends ici" : visible uniquement sur les arrêts futurs, hors mode segmenté */}
              {isFuture && !isCurrent && !isDestination && !showSegmentedView && (
                <button
                  className="press"
                  onClick={() => onDescendIci(stop)}
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
  );
}

// ── Composant principal ───────────────────────────────────────────────

export default function RouteInteractive({
  senses, availableDirs, routeColor, routeColorRaw,
  fromStop, typeKind, initialActiveDirection, routeId,
}: Props) {
  const router = useRouter();

  const [activeDir, setActiveDir] = useState(initialActiveDirection);

  // État de segmentation séparé par direction : { 0: stopId | null, 1: stopId | null }
  const [cutPerDir, setCutPerDir]     = useState<Record<number, string | null>>({ 0: null, 1: null });
  const [showSegPerDir, setShowSegPerDir] = useState<Record<number, boolean>>({ 0: false, 1: false });

  // ── Extraction symétrique des deux sens ──
  const sense0 = senses[0] ?? { stops: [], shape: [], headsign: null };
  const sense1 = senses[1] ?? { stops: [], shape: [], headsign: null };
  const activeSense = senses[activeDir] ?? { stops: [], shape: [], headsign: null };

  const cutAtId          = cutPerDir[activeDir]   ?? null;
  const showSegmentedView = showSegPerDir[activeDir] ?? false;

  // ── Log de débogage (à retirer une fois stabilisé) ──
  useEffect(() => {
    console.log('[RouteInteractive] direction active:', activeDir);
    console.log('[RouteInteractive] sens 0 — arrêts:', sense0.stops.length, '| headsign:', sense0.headsign);
    console.log('[RouteInteractive] sens 1 — arrêts:', sense1.stops.length, '| headsign:', sense1.headsign);
    console.log('[RouteInteractive] sens actif — arrêts:', activeSense.stops.length);
  }, [activeDir, sense0.stops.length, sense1.stops.length, activeSense.stops.length,
      sense0.headsign, sense1.headsign]);

  // ── Sauvegarde dans les récents ──
  useEffect(() => {
    if (typeof window === 'undefined') return;
    try {
      const lineData = {
        id: routeId,
        name: activeSense.headsign || `Ligne ${routeId}`,
        type: typeKind,
        color: routeColorRaw,
        timestamp: Date.now(),
      };
      const saved   = JSON.parse(localStorage.getItem('babimob_recentLines') || '[]');
      const filtered = saved.filter((l: { id: string }) => l.id !== routeId);
      localStorage.setItem('babimob_recentLines', JSON.stringify([lineData, ...filtered].slice(0, 5)));
    } catch (e) {
      console.error('[RouteInteractive] Erreur localStorage recents:', e);
    }
  }, [routeId, typeKind, routeColorRaw, activeSense.headsign]);

  // ── Calculs de trajet ──
  const currentIdx = fromStop ? activeSense.stops.findIndex((s) => s.stop_id === fromStop) : -1;
  const cutIdx     = cutAtId  ? activeSense.stops.findIndex((s) => s.stop_id === cutAtId)  : -1;

  const segStart = (showSegmentedView && currentIdx >= 0) ? currentIdx : 0;
  const segEnd   = (showSegmentedView && cutIdx >= 0)     ? cutIdx     : activeSense.stops.length - 1;

  const journeyStart = currentIdx >= 0 ? currentIdx : 0;
  const journeyEnd   = (showSegmentedView && cutIdx >= 0) ? cutIdx : activeSense.stops.length - 1;
  const journeyStops = Math.max(1, journeyEnd - journeyStart + 1);
  const estimatedMin = Math.max(3, journeyStops * 2);
  const estimatedPrice = journeyStops <= 3 ? '100F' : journeyStops <= 7 ? '200F' : journeyStops <= 12 ? '300F' : '500F';

  // Arrêts affichés (segment ou tout)
  const displayedStops: StopRow[] = showSegmentedView
    ? activeSense.stops.slice(segStart, segEnd + 1)
    : activeSense.stops;

  // Tranche de shape pour la carte
  const displayedShape = (() => {
    const shape = activeSense.shape;
    if (!shape.length || !showSegmentedView) return shape;
    const startStop = activeSense.stops[segStart];
    const endStop   = activeSense.stops[segEnd];
    const i0 = startStop ? nearestShapeIdx(shape, startStop.stop_lat, startStop.stop_lon) : 0;
    const i1 = endStop   ? nearestShapeIdx(shape, endStop.stop_lat,   endStop.stop_lon)   : shape.length - 1;
    return shape.slice(Math.min(i0, i1), Math.max(i0, i1) + 1);
  })();

  // ── Actions ──

  const handleDescendIci = useCallback((stop: StopRow) => {
    setCutPerDir((prev) => ({ ...prev, [activeDir]: stop.stop_id }));
    setShowSegPerDir((prev) => ({ ...prev, [activeDir]: true }));
    try {
      localStorage.setItem('babimob_lastDest', JSON.stringify({
        name: stop.stop_name, commune: stop.commune,
        lat: stop.stop_lat, lon: stop.stop_lon,
      }));
    } catch (_) {}
  }, [activeDir]);

  const resetSegmentation = useCallback(() => {
    setCutPerDir((prev)     => ({ ...prev, [activeDir]: null }));
    setShowSegPerDir((prev) => ({ ...prev, [activeDir]: false }));
  }, [activeDir]);

  /** Bascule de direction — réinitialise la segmentation du sens cible */
  const switchDirection = (dir: number) => {
    if (dir === activeDir) return;
    // On réinitialise le sens cible pour éviter les artefacts visuels
    setCutPerDir((prev)     => ({ ...prev, [dir]: null }));
    setShowSegPerDir((prev) => ({ ...prev, [dir]: false }));
    setActiveDir(dir);
    // Sync URL sans rechargement complet
    const url = new URL(window.location.href);
    url.searchParams.set('dir', String(dir));
    if (fromStop) url.searchParams.set('from', fromStop);
    router.replace(url.pathname + url.search);
  };

  return (
    <>
      {/* ── Sélecteur de direction ── */}
      {availableDirs.length > 1 && (
        <div style={{ display: 'flex', gap: 8, margin: '10px 16px 0', padding: 4, background: 'var(--cream-2)', borderRadius: 14, border: '1px solid var(--line)' }}>
          {availableDirs.map((dir) => {
            const headsign = senses[dir]?.headsign ?? `Dir. ${dir}`;
            return (
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
                {dir === 0 ? '→' : '←'} {headsign}
              </button>
            );
          })}
        </div>
      )}

      {/* ── Pills d'info dynamiques ── */}
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', padding: '10px 16px 12px', borderBottom: '1px solid var(--line)' }}>
        {activeSense.headsign && (
          <Pill color="var(--green)">
            {showSegmentedView
              ? `→ ${activeSense.stops.find((s) => s.stop_id === cutAtId)?.stop_name ?? activeSense.headsign}`
              : `→ ${activeSense.headsign}`}
          </Pill>
        )}
        <Pill color="var(--ink)">{estimatedPrice}</Pill>
        <Pill color="var(--blue)">~{estimatedMin} min</Pill>
        <Pill color="var(--orange)">{journeyStops} arrêt{journeyStops > 1 ? 's' : ''}</Pill>
        {showSegmentedView && (
          <button
            onClick={resetSegmentation}
            style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0, display: 'flex', alignItems: 'center' }}
          >
            <Pill color="var(--muted)">✕ Choisir une autre destination</Pill>
          </button>
        )}
      </div>

      {/* ── Carte ── */}
      <div style={{ height: 250, overflow: 'hidden', borderBottom: '1px solid var(--line)' }}>
        <RouteMapWrapper
          shape={displayedShape}
          stops={displayedStops}
          routeColor={routeColorRaw}
          activeDirection={activeDir}
          isSegmented={showSegmentedView}
        />
      </div>

      {/* ── Timeline (SenseView) — même composant pour les deux sens ── */}
      <SenseView
        sense={activeSense}
        displayed={displayedStops}
        senseIndex={activeDir}
        fromStop={fromStop}
        cutAtId={cutAtId}
        showSegmentedView={showSegmentedView}
        typeKind={typeKind}
        onDescendIci={handleDescendIci}
        onReset={resetSegmentation}
      />
    </>
  );
}
