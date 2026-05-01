'use client';

import dynamic from 'next/dynamic';
import Image from 'next/image';
import React, { useState, useCallback, Suspense, useEffect, useRef } from 'react';
import Link from 'next/link';
import type { Stop } from '@/lib/types';
import type { POI } from '@/lib/poi';
import { useRouter } from 'next/navigation';
import { formatDistance } from '@/lib/format';
import { Ic } from '@/components/ui/Ic';
import Vehicle from '@/components/ui/Vehicle';
import BroadcastButton from '@/components/BroadcastButton';
import PoiCheckInButton from '@/components/PoiCheckInButton';
import { motion, AnimatePresence, useMotionValue, animate } from 'framer-motion';
import { useReachTracking } from '@/hooks/useReachTracking';
import { useGeoLocation } from '@/hooks/useGeoLocation';
import { useStopSearch } from '@/hooks/useStopSearch';
import { useCommunityData } from '@/hooks/useCommunityData';
import { useMapPois } from '@/hooks/useMapPois';
import { useHotspots } from '@/hooks/useHotspots';
import { useItinerary } from '@/hooks/useItinerary';
import { useNearbyTransport } from '@/hooks/useNearbyTransport';
import { haversineM } from '@/lib/geo';

const Map = dynamic(() => import('@/components/Map'), {
  ssr: false,
  loading: () => (
    <div className="absolute inset-0 bg-beige-50 flex items-center justify-center">
      <div className="flex flex-col items-center gap-4">
        <Image src="/icons/icon-192.png" alt="BABIMOB" width={64} height={64} className="rounded-2xl shadow-lg shadow-abidjan-orange/20" />
        <div className="text-center">
          <div className="text-base font-black uppercase tracking-[0.2em] text-beige-text">BABIMOB</div>
          <div className="text-[10px] font-bold text-beige-muted uppercase tracking-widest mt-0.5">Chargement de la ville…</div>
        </div>
        <div className="w-8 h-8 border-[3px] border-abidjan-orange/20 border-t-abidjan-orange rounded-full animate-spin" />
      </div>
    </div>
  ),
});

const ABIDJAN_CENTER: [number, number] = [5.345, -4.020];

export default function AppPage() {
  return (
    <Suspense fallback={<div style={{ flex: 1, background: 'var(--cream)' }} />}>
      <AppPageContent />
    </Suspense>
  );
}

function AppPageContent() {
  const router = useRouter();

  type LastDestination = { name: string; commune: string | null; lat: number; lon: number };

  const [searchOpen, setSearchOpen] = useState(false);
  const [selected, setSelected] = useState<Stop | null>(null);
  const [sheet, setSheet] = useState<'mini' | 'peek' | 'half' | 'full'>('mini');
  const [selectedPoi, setSelectedPoi] = useState<POI | null>(null);
  const [isSatellite, setIsSatellite] = useState(false);
  const [lastDestination, setLastDestination] = useState<LastDestination | null>(() => {
    if (typeof window === 'undefined') return null;
    try { return JSON.parse(localStorage.getItem('babimob_lastDest') ?? 'null'); } catch { return null; }
  });

  const { heatMode, setHeatMode, hotspots } = useHotspots();
  const { activeItinerary, setActiveItinerary } = useItinerary();

  const { logReach } = useReachTracking();
  const { profile, broadcasts, explorers, communityFeed, trendingPlaces } = useCommunityData({ logReach });
  const { pois, poiCheckins, livePois, liveTickerFeed, handleMapReady } = useMapPois({ logReach });
  const {
    userLoc,
    nearbyStops,
    setNearbyStops,
    loading: geoLoading,
    error: geoError,
    locateMe,
  } = useGeoLocation({
    onPositionAcquired: () => setSelected(null),
    onLocate: () => setSheet('half'),
  });
  const nearbyTransport = useNearbyTransport(nearbyStops);

  const {
    query,
    setQuery,
    results,
    searching: isSearching,
    clear: clearSearch,
  } = useStopSearch();

  const handleGetDirections = useCallback((poi: POI) => {
    router.push(`/app/itineraire?toStop=${encodeURIComponent(JSON.stringify({
      stop_name: poi.name,
      stop_lat: poi.lat,
      stop_lon: poi.lon,
    }))}`);
  }, [router]);

  // Auto-request geolocation on mount
  const locateMeRef = useRef(locateMe);
  useEffect(() => { locateMeRef.current(); }, []);

  const SNAP = { mini: 60, peek: 120, half: 400, full: 620 } as const;
  type SheetState = keyof typeof SNAP;

  const heightMV = useMotionValue<number>(SNAP.mini);

  // Sync programmatic state changes → spring animation
  useEffect(() => {
    animate(heightMV, SNAP[sheet], { type: 'spring', damping: 30, stiffness: 300, mass: 0.8 });
  }, [sheet]); // eslint-disable-line react-hooks/exhaustive-deps

  const cycleSheet = useCallback(() => {
    setSheet((cur) => cur === 'mini' ? 'peek' : cur === 'peek' ? 'half' : cur === 'half' ? 'full' : 'mini');
  }, []);

  // Pointer-based drag on handle only — no conflict with content scroll
  const onHandlePointerDown = useCallback((e: React.PointerEvent<HTMLDivElement>) => {
    e.currentTarget.setPointerCapture(e.pointerId);
    const startY = e.clientY;
    const startH = heightMV.get();

    function onMove(ev: PointerEvent) {
      const h = Math.min(SNAP.full, Math.max(SNAP.mini, startH - (ev.clientY - startY)));
      heightMV.set(h);
    }

    function onUp(ev: PointerEvent) {
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('pointerup', onUp);

      const h = heightMV.get();
      const velocity = ev.movementY;
      const snaps = [SNAP.mini, SNAP.peek, SNAP.half, SNAP.full] as const;

      let target: number;
      if (velocity > 8 && h > SNAP.mini) {
        const lower = snaps.filter((s) => s < h);
        target = lower.length ? lower[lower.length - 1] : SNAP.mini;
      } else if (velocity < -8 && h < SNAP.full) {
        const higher = snaps.filter((s) => s > h);
        target = higher.length ? higher[0] : SNAP.full;
      } else {
        target = snaps.reduce((a, b) => Math.abs(b - h) < Math.abs(a - h) ? b : a);
      }

      animate(heightMV, target, { type: 'spring', damping: 30, stiffness: 300, mass: 0.8 });
      const snap: SheetState = target === SNAP.full ? 'full' : target === SNAP.half ? 'half' : target === SNAP.peek ? 'peek' : 'mini';
      setSheet(snap);
    }

    window.addEventListener('pointermove', onMove);
    window.addEventListener('pointerup', onUp);
  }, [heightMV]); // eslint-disable-line react-hooks/exhaustive-deps

  const center: [number, number] = selected
    ? [selected.stop_lat, selected.stop_lon]
    : userLoc ?? ABIDJAN_CENTER;
  const zoom = selected ? 16 : userLoc ? 15 : 12;

  const mapStops: Stop[] = selected
    ? [selected]
    : nearbyStops.map(a => ({ stop_id: a.stop_id, stop_name: a.stop_name, stop_lat: a.stop_lat, stop_lon: a.stop_lon, commune: a.commune }));

  const handleSelectStop = useCallback((stop: Stop) => {
    setSelected(stop);
    setSheet('half');
    setSearchOpen(false);
    clearSearch();
  }, [clearSearch]);

  const clearSelection = useCallback(() => {
    setSelected(null);
    setSheet('peek');
  }, []);

  const handleDescendIci = useCallback((stop: Stop) => {
    const dest: LastDestination = {
      name: stop.stop_name,
      commune: stop.commune ?? null,
      lat: stop.stop_lat,
      lon: stop.stop_lon,
    };
    setLastDestination(dest);
    localStorage.setItem('babimob_lastDest', JSON.stringify(dest));
    clearSelection();
  }, [clearSelection]);

  const openSearch = () => setSearchOpen(true);
  const closeSearch = () => { setSearchOpen(false); clearSearch(); };

  const TICKER_FALLBACK: [string, string, string][] = [
    ['Cocody', 'fluide', 'var(--green)'],
    ['Yop → Plateau', '15 min', 'var(--green)'],
    ['Pont HKB', 'embouteillé', 'var(--orange-deep)'],
    ['Adjamé Liberté', 'Gbaka 200F', 'var(--ink)'],
    ['Riviera 2', 'fluide', 'var(--green)'],
  ];

  const tickerCheckins: [string, string, string][] = liveTickerFeed.map(c => [
    c.display_name ?? 'Un Babi',
    `à ${c.place_name}`,
    'var(--orange)',
  ]);

  const TICKER: [string, string, string][] =
    tickerCheckins.length > 0 ? tickerCheckins : TICKER_FALLBACK;

  const RECENT = [
    { from: 'Cocody Saint-Jean', to: 'Plateau', tarif: '300F' },
    { from: 'Adjamé Liberté', to: 'Yopougon Selmer', tarif: '200F' },
    { from: 'Riviera 2', to: 'Marcory Zone 4', tarif: '500F' },
  ];

  const selectedDistanceM = selected && userLoc
    ? haversineM(userLoc[0], userLoc[1], selected.stop_lat, selected.stop_lon)
    : null;
  const isNearbyStop = selectedDistanceM !== null && selectedDistanceM < 300;

  const headerLabel = (() => {
    if (lastDestination) {
      const label = (lastDestination.commune ?? lastDestination.name).toUpperCase();
      if (userLoc) {
        const d = haversineM(userLoc[0], userLoc[1], lastDestination.lat, lastDestination.lon);
        return `${label} · ${formatDistance(d)}`;
      }
      return label;
    }
    if (nearbyStops.length > 0)
      return `${nearbyStops[0].commune?.toUpperCase() ?? 'ABIDJAN'} · ${formatDistance(nearbyStops[0].distance_m)}`;
    return null;
  })();

  return (
    <div style={{ position: 'relative', width: '100%', height: '100dvh', overflow: 'hidden', background: 'var(--cream)' }}>

      {/* MAP */}
      <Map
        stops={mapStops}
        center={center}
        zoom={zoom}
        className="absolute inset-0"
        selectedStopId={selected?.stop_id ?? null}
        selectedPoiId={selectedPoi?.id ?? null}
        satellite={isSatellite}
        onStopClick={handleSelectStop}
        onPoiClick={(poi) => {
          if (poi.place_id) {
            router.push(`/app/place/${poi.place_id}`);
          } else {
            setSelectedPoi(poi); setSelected(null); setSheet('half');
          }
        }}
        onMapReady={handleMapReady}
        userLocation={userLoc}
        legs={activeItinerary?.legs?.map((l) => ({ coords: l.coords ?? [], mode: l.mode, routeColor: l.route?.color })) || null}
        hotspots={hotspots}
        explorers={explorers}
        pois={pois}
        poiCheckins={poiCheckins}
        livePois={livePois}
        broadcasts={broadcasts}
      />

      {/* ── Top Floating Bar ── */}
      <div style={{ position: 'absolute', top: 'calc(env(safe-area-inset-top,0px) + 12px)', left: 16, right: 16, display: 'flex', gap: 10, zIndex: 10 }}>
        <button
          onClick={() => {}}
          className="press"
          style={{ width: 44, height: 44, borderRadius: 14, border: 'none', background: 'var(--cream)', color: 'var(--ink)', boxShadow: '0 4px 14px rgba(0,0,0,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}
        >
          <Ic.Menu s={20} />
        </button>

        <button
          onClick={openSearch}
          className="press"
          style={{ flex: 1, height: 44, borderRadius: 14, border: 'none', background: 'var(--cream)', color: 'var(--muted)', boxShadow: '0 4px 14px rgba(0,0,0,0.1)', display: 'flex', alignItems: 'center', gap: 10, padding: '0 14px', fontSize: 14, fontWeight: 500, cursor: 'pointer', textAlign: 'left' }}
        >
          <Ic.Search s={18} />
          <span style={{ flex: 1 }}>{selected ? selected.stop_name : "Où vas-tu, Babi ?"}</span>
          <span style={{ fontSize: 10, fontWeight: 800, color: 'var(--orange)', background: 'color-mix(in oklab, var(--orange) 12%, transparent)', padding: '3px 7px', borderRadius: 6, letterSpacing: 0.5 }}>IA</span>
        </button>

        <Link
          href="/app/compte"
          className="press"
          style={{ width: 44, height: 44, borderRadius: 14, background: 'var(--orange)', color: '#fff', boxShadow: '0 4px 14px rgba(242,108,26,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, fontWeight: 800, textDecoration: 'none' }}
        >
          {profile?.display_name?.slice(0, 2).toUpperCase() || 'MK'}
        </Link>
      </div>

      {/* ── FAB Stack (Right) ── */}
      <div style={{ position: 'absolute', right: 16, top: 'calc(env(safe-area-inset-top,0px) + 68px)', display: 'flex', flexDirection: 'column', gap: 8, zIndex: 10 }}>
        {(
          [
            { icon: <Ic.Layers s={18} />, action: () => setIsSatellite(v => !v), active: isSatellite, loading: false },
            { icon: <Ic.Locate s={18} />, action: locateMe, active: !!userLoc, loading: geoLoading },
            { icon: <Ic.Compass s={18} />, action: () => router.push('/app/boussole'), active: false, loading: false },
          ] as { icon: React.ReactNode; action: () => void; active: boolean; loading: boolean }[]
        ).map((btn, i) => (
          <button
            key={i}
            onClick={btn.action}
            disabled={btn.loading}
            className="press"
            style={{ width: 44, height: 44, borderRadius: 14, border: 'none', background: btn.active ? 'var(--orange)' : 'var(--cream)', color: btn.active ? '#fff' : 'var(--ink)', boxShadow: '0 2px 8px rgba(0,0,0,0.08)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}
          >
            {btn.loading
              ? <div style={{ width: 16, height: 16, border: '2px solid currentColor', borderTopColor: 'transparent', borderRadius: '50%' }} className="animate-spin" />
              : btn.icon}
          </button>
        ))}
      </div>

      {/* ── Live Ticker ── */}
      <div style={{ position: 'absolute', top: 'calc(env(safe-area-inset-top,0px) + 62px)', left: 0, right: 0, zIndex: 5, height: 28, overflow: 'hidden', pointerEvents: 'none' }}>
        <div className="ticker" style={{ display: 'flex', gap: 24, whiteSpace: 'nowrap', paddingLeft: 16, alignItems: 'center', height: '100%' }}>
          {TICKER.concat(TICKER).map(([place, status, c], i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12, color: 'var(--ink-2)' }}>
              <div className="shimmer" style={{ width: 6, height: 6, borderRadius: '50%', background: c, flexShrink: 0 }} />
              <span style={{ fontWeight: 700 }}>{place}</span>
              <span style={{ color: 'var(--muted)' }}>· {status}</span>
            </div>
          ))}
        </div>
      </div>

      {/* ── Broadcast FAB ── */}
      {profile && sheet === 'peek' && (
        <div style={{ position: 'absolute', bottom: 264, right: 20, zIndex: 450 }}>
          <BroadcastButton userId={profile.id} currentTier={profile.sub_tier ?? 'free'} isAdmin={profile.is_admin} />
        </div>
      )}

      {/* ── BOTTOM SHEET – DRAG (structure unique corrigée) ── */}
      <motion.div
        style={{ position: 'absolute', left: 0, right: 0, bottom: 0, height: heightMV, background: 'var(--cream-2)', borderRadius: '24px 24px 0 0', boxShadow: '0 -8px 32px rgba(0,0,0,0.12)', zIndex: 400, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}
      >
        {/* Poignée — drag + clic */}
        <div
          onPointerDown={onHandlePointerDown}
          onClick={cycleSheet}
          style={{ cursor: 'grab', paddingTop: 4, flexShrink: 0, touchAction: 'none', userSelect: 'none' }}
        >
          <div className="sheet-handle" />
        </div>

        {/* Contenu scrollable unique */}
        <div
          className="no-scrollbar"
          style={{ flex: 1, overflowY: 'auto', padding: '8px 16px 100px' }}
        >
          {selectedPoi ? (
            /* ── POI PREVIEW ── */
            <div>
              <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 16, marginBottom: 24 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                  <div style={{ width: 56, height: 56, borderRadius: 16, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 28, background: 'var(--cream)', border: '1px solid var(--line)' }}>
                    {selectedPoi.logo_emoji || '📍'}
                  </div>
                  <div>
                    <h2 style={{ fontSize: 18, fontWeight: 800, color: 'var(--ink)', margin: 0, lineHeight: 1.2 }}>{selectedPoi.name}</h2>
                    <div style={{ fontSize: 10, fontWeight: 700, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: 1, marginTop: 4 }}>{selectedPoi.commune || 'Abidjan'}</div>
                  </div>
                </div>
                <button onClick={() => setSelectedPoi(null)} style={{ padding: 8, background: 'var(--cream)', borderRadius: 12, border: 'none', cursor: 'pointer', color: 'var(--muted)' }}>
                  <Ic.X s={20} />
                </button>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 24 }}>
                <PoiCheckInButton placeId={selectedPoi.id} placeName={selectedPoi.name} commune={selectedPoi.commune} lat={selectedPoi.lat} lon={selectedPoi.lon} />
                <button onClick={() => handleGetDirections(selectedPoi)} style={{ background: 'var(--orange)', color: '#fff', fontWeight: 800, padding: '16px 0', borderRadius: 16, fontSize: 12, textTransform: 'uppercase', letterSpacing: 1, border: 'none', cursor: 'pointer', boxShadow: '0 4px 14px rgba(242,108,26,0.3)' }}>S'y rendre</button>
              </div>

              {selectedPoi.description && <p style={{ fontSize: 14, color: 'var(--muted)', lineHeight: 1.6, marginBottom: 24 }}>{selectedPoi.description}</p>}

              <Link href={`/app/place/${selectedPoi.id}`} style={{ display: 'block', textAlign: 'center', fontSize: 12, fontWeight: 800, color: 'var(--blue)', textTransform: 'uppercase', letterSpacing: 1, padding: 16, background: 'color-mix(in oklab, var(--blue) 8%, transparent)', borderRadius: 16, textDecoration: 'none' }}>Profil Complet →</Link>
            </div>

          ) : activeItinerary ? (
            /* ── ITINERARY ── */
            <div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 32 }}>
                <h2 style={{ fontSize: 21, fontWeight: 900, color: 'var(--ink)', margin: 0 }}>Ton trajet</h2>
                <button onClick={() => setActiveItinerary(null)} style={{ padding: 8, background: 'var(--cream)', borderRadius: 12, border: 'none', cursor: 'pointer', color: 'var(--muted)' }}><Ic.X s={20} /></button>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
                {activeItinerary.legs.map((leg, idx) => (
                  <div key={idx} style={{ display: 'flex', gap: 24 }}>
                    <div style={{ width: 40, height: 40, borderRadius: 16, background: 'var(--cream)', border: '2px solid var(--line)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20, flexShrink: 0 }}>
                      {leg.mode === 'WALK' ? '🚶' : '🚐'}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 14, fontWeight: 800, color: 'var(--ink)' }}>{leg.mode === 'WALK' ? 'Marcher' : `Ligne ${leg.route?.shortName || ''}`}</div>
                      <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--muted)' }}>Vers {leg.to.name}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

          ) : selected ? (
            /* ── STOP DETAIL ── */
            <div>
              <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 24 }}>
                <div>
                  <h2 style={{ fontSize: 21, fontWeight: 900, color: 'var(--ink)', margin: 0, lineHeight: 1.2 }}>{selected.stop_name}</h2>
                  <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: 1, marginTop: 4 }}>{selected.commune}</div>
                  {!isNearbyStop && selectedDistanceM !== null && (
                    <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--orange)', marginTop: 6 }}>
                      {formatDistance(selectedDistanceM)} de toi
                    </div>
                  )}
                </div>
                <button onClick={clearSelection} style={{ padding: 8, background: 'var(--cream)', borderRadius: 12, border: 'none', cursor: 'pointer', color: 'var(--muted)' }}><Ic.X s={20} /></button>
              </div>
              {isNearbyStop ? (
                <button onClick={() => router.push(`/app/arret/${encodeURIComponent(selected.stop_id)}`)} style={{ width: '100%', background: 'var(--orange)', color: '#fff', fontWeight: 800, padding: '20px 0', borderRadius: 24, fontSize: 14, textTransform: 'uppercase', letterSpacing: 1.5, border: 'none', cursor: 'pointer', boxShadow: '0 4px 14px rgba(242,108,26,0.4)' }}>
                  Voir les lignes & tarifs
                </button>
              ) : (
                <div style={{ display: 'flex', gap: 10 }}>
                  <button onClick={() => router.push(`/app/arret/${encodeURIComponent(selected.stop_id)}`)} style={{ flex: 1, background: 'var(--cream)', color: 'var(--ink)', fontWeight: 800, padding: '18px 0', borderRadius: 20, fontSize: 13, textTransform: 'uppercase', letterSpacing: 1, border: '1.5px solid var(--line)', cursor: 'pointer' }}>
                    Détail arrêt
                  </button>
                  <button onClick={() => handleDescendIci(selected)} style={{ flex: 1, background: 'var(--orange)', color: '#fff', fontWeight: 800, padding: '18px 0', borderRadius: 20, fontSize: 13, textTransform: 'uppercase', letterSpacing: 1, border: 'none', cursor: 'pointer', boxShadow: '0 4px 14px rgba(242,108,26,0.4)' }}>
                    Je descends ici 🎯
                  </button>
                </div>
              )}
            </div>

          ) : (
            /* ── DEFAULT — NEARBY ── */
            <>
              {/* Près de toi */}
              <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: 10 }}>
                <h3 className="font-display" style={{ fontSize: 22, margin: 0, color: 'var(--ink)' }}>Près de toi</h3>
                {headerLabel && (
                  <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--orange)', letterSpacing: 0.5 }}>
                    {headerLabel}
                  </span>
                )}
              </div>

              {/* Transport cards */}
              <div className="no-scrollbar" style={{ display: 'flex', gap: 10, overflowX: 'auto', marginBottom: 14, paddingBottom: 4 }}>
                {nearbyTransport.map((card) => (
                  <div
                    key={card.kind}
                    className={card.available ? 'press' : ''}
                    onClick={() => {
                      if (card.available && card.stop) {
                        handleSelectStop({ stop_id: card.stop.stop_id, stop_name: card.stop.stop_name, stop_lat: card.stop.stop_lat, stop_lon: card.stop.stop_lon, commune: card.stop.commune ?? null });
                      }
                    }}
                    style={{ minWidth: 140, padding: 12, borderRadius: 14, background: 'var(--cream)', border: '1px solid var(--line)', flexShrink: 0, cursor: card.available ? 'pointer' : 'default', opacity: card.available ? 1 : 0.55 }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
                      <Vehicle kind={card.kind} size={32} />
                      {card.available && card.stop && (
                        <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                          <div className="shimmer" style={{ width: 6, height: 6, borderRadius: '50%', background: card.color }} />
                          <span style={{ fontSize: 11, fontWeight: 800, color: card.color, letterSpacing: 0.3 }}>{formatDistance(card.stop.distance_m)}</span>
                        </div>
                      )}
                    </div>
                    <div style={{ fontSize: 13, fontWeight: 700, color: card.available ? 'var(--ink)' : 'var(--muted)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {card.available && card.stop ? card.stop.stop_name : 'Bientôt dispo'}
                    </div>
                    <div style={{ fontSize: 11, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: 0.5, marginTop: 2 }}>{card.label}</div>
                  </div>
                ))}
              </div>

              {/* Boussole banner */}
              <div onClick={() => router.push('/app/boussole')} className="press" style={{ padding: 16, borderRadius: 18, marginBottom: 14, background: 'linear-gradient(135deg, var(--orange) 0%, var(--orange-deep) 100%)', color: '#fff', position: 'relative', overflow: 'hidden', cursor: 'pointer' }}>
                <div className="wax-bg" style={{ position: 'absolute', inset: 0, color: '#fff', opacity: 0.15 }} />
                <div style={{ position: 'relative', display: 'flex', alignItems: 'center', gap: 14 }}>
                  <div style={{ width: 54, height: 54, borderRadius: 14, background: 'rgba(255,255,255,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <Ic.Compass s={28} />
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 11, fontWeight: 800, opacity: 0.85, letterSpacing: 0.6 }}>BOUSSOLE BABI</div>
                    <div className="font-display" style={{ fontSize: 18, marginTop: 2 }}>
                      {nearbyStops[0] 
                        ? <>L'arrêt le plus proche<br />est à {formatDistance(nearbyStops[0].distance_m)}, pointe →</>
                        : <>Le prochain Gbaka<br />est proche, pointe →</>
                      }
                    </div>
                  </div>
                  <Ic.Arrow s={22} />
                </div>
              </div>

              {/* Récents */}
              <div style={{ fontSize: 11, fontWeight: 800, color: 'var(--muted)', letterSpacing: 0.7, margin: '8px 4px 8px' }}>RÉCENTS</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 14 }}>
                {RECENT.map((r, i) => (
                  <div key={i} onClick={() => router.push('/app/chat')} className="press" style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 12px', borderRadius: 12, background: 'var(--cream)', border: '1px solid var(--line)', cursor: 'pointer' }}>
                    <div style={{ width: 36, height: 36, borderRadius: 10, background: 'color-mix(in oklab, var(--orange) 10%, transparent)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--orange)', flexShrink: 0 }}>
                      <Ic.Route s={18} />
                    </div>
                    <div style={{ flex: 1, fontSize: 13 }}>
                      <div style={{ fontWeight: 700, color: 'var(--ink)' }}>{r.from} → {r.to}</div>
                      <div style={{ fontSize: 11, color: 'var(--muted)', marginTop: 1 }}>Tarif moyen · {r.tarif}</div>
                    </div>
                    <Ic.Arrow s={16} />
                  </div>
                ))}
              </div>

              {/* Community pulse */}
              <div onClick={() => router.push('/app/community')} className="press" style={{ padding: 16, borderRadius: 18, background: 'var(--cream)', border: '1px solid var(--line)', display: 'flex', alignItems: 'center', gap: 12, cursor: 'pointer', marginBottom: 8 }}>
                <div style={{ display: 'flex' }}>
                  {(['#F26C1A', '#0EA85B', '#1E5BFF', '#E8B23C'] as const).map((c, i) => (
                    <div key={i} style={{ width: 28, height: 28, borderRadius: '50%', background: c, border: '2px solid var(--cream-2)', marginLeft: i === 0 ? 0 : -8, fontSize: 11, fontWeight: 800, color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      {['K', 'A', 'M', 'D'][i]}
                    </div>
                  ))}
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--ink)' }}>247 Babis sont en ligne</div>
                  <div style={{ fontSize: 11, color: 'var(--muted)' }}>Demande ton C'comment</div>
                </div>
                <Ic.Arrow s={18} />
              </div>
            </>
          )}
        </div>
      </motion.div>

      {/* ── Search Overlay ── */}
      <AnimatePresence>
        {searchOpen && (
          <motion.div
            initial={{ opacity: 0, y: 100 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 100 }}
            style={{ position: 'fixed', inset: 0, zIndex: 1000, background: 'var(--cream-2)', display: 'flex', flexDirection: 'column' }}
          >
            <div style={{ background: 'var(--cream)', padding: '48px 20px 20px', borderBottom: '1px solid var(--line)', display: 'flex', alignItems: 'center', gap: 16 }}>
              <button onClick={closeSearch} style={{ padding: 8, background: 'none', border: 'none', cursor: 'pointer', color: 'var(--ink)' }}><Ic.Back s={24} /></button>
              <input autoFocus value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Chercher un lieu…" style={{ flex: 1, fontSize: 18, fontWeight: 800, border: 'none', outline: 'none', background: 'transparent', color: 'var(--ink)' }} />
              {isSearching && <div style={{ width: 20, height: 20, border: '2px solid var(--orange)', borderTopColor: 'transparent', borderRadius: '50%' }} className="animate-spin" />}
            </div>
            <div style={{ flex: 1, overflowY: 'auto', padding: 20 }}>
              {results.map((r, i) => (
                <button key={i} onClick={() => handleSelectStop(r)} style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 16, padding: 16, background: 'var(--cream)', borderRadius: 16, border: '1px solid var(--line)', marginBottom: 8, textAlign: 'left', cursor: 'pointer' }}>
                  <div style={{ width: 40, height: 40, borderRadius: 12, background: 'color-mix(in oklab, var(--orange) 10%, transparent)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--orange)' }}><Ic.Pin s={18} /></div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontWeight: 800, fontSize: 14, color: 'var(--ink)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{r.stop_name}</div>
                    <div style={{ fontSize: 10, fontWeight: 700, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: 1 }}>{r.commune}</div>
                  </div>
                </button>
              ))}
              {!query && (
                <>
                  <div style={{ fontSize: 10, fontWeight: 800, color: 'var(--muted)', letterSpacing: 1, textTransform: 'uppercase', marginBottom: 12 }}>Récents</div>
                  {RECENT.map((r, i) => (
                    <div key={i} style={{ background: 'var(--cream)', padding: 16, borderRadius: 16, border: '1px solid var(--line)', display: 'flex', alignItems: 'center', gap: 12, marginBottom: 8 }}>
                      <div style={{ width: 36, height: 36, borderRadius: 10, background: 'color-mix(in oklab, var(--orange) 10%, transparent)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--orange)' }}><Ic.Route s={16} /></div>
                      <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--ink)' }}>{r.from} → {r.to}</div>
                    </div>
                  ))}
                </>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

    </div>
  );
}
