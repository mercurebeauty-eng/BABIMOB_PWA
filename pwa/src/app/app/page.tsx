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
import { getLevel } from '@/lib/levels';
import { BottomNav } from '@/components/ui/BottomNav';

type RecentItem = {
  id: string;
  name: string;
  type: 'line' | 'stop' | 'place';
  commune?: string;
  color?: string;
  lat?: number;
  lon?: number;
  logo?: string;
};

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
  const [recentItems, setRecentItems] = useState<RecentItem[]>([]);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      try {
        const saved = JSON.parse(localStorage.getItem('babimob_recent_history') || '[]');
        setRecentItems(saved);
      } catch (e) {
        console.error("Erreur lecture recents:", e);
      }
    }
  }, []);

  const addToRecent = useCallback((item: RecentItem) => {
    setRecentItems((prev) => {
      const filtered = prev.filter((i) => i.id !== item.id);
      const next = [item, ...filtered].slice(0, 8);
      localStorage.setItem('babimob_recent_history', JSON.stringify(next));
      return next;
    });
  }, []);

  const { heatMode, setHeatMode, hotspots } = useHotspots();
  const [nearbyIndex, setNearbyIndex] = useState(0);
  const { activeItinerary, setActiveItinerary } = useItinerary();

  const { logReach } = useReachTracking();
  const { profile, broadcasts, explorers, communityFeed, trendingPlaces } = useCommunityData({ logReach });
  const { pois, poiCheckins, livePois, liveTickerFeed, handleMapReady } = useMapPois({ logReach });
  const {
    userLoc,
    userHeading,
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

  const handleGetDirections = useCallback((target: { name: string; lat: number; lon: number }) => {
    router.push(`/app/itineraire?toStop=${encodeURIComponent(JSON.stringify({
      stop_name: target.name,
      stop_lat: target.lat,
      stop_lon: target.lon,
    }))}`);
  }, [router]);

  const [recenterSignal, setRecenterSignal] = useState(0);

  // Auto-request geolocation on mount
  const locateMeRef = useRef(locateMe);
  useEffect(() => { locateMeRef.current(); }, []);

  const handleLocateMe = useCallback(() => {
    setRecenterSignal(s => s + 1);
    locateMe();
  }, [locateMe]);

  const SNAP = { mini: 0, peek: 240, half: 450, full: 680 } as const;
  type SheetState = keyof typeof SNAP;

  const heightMV = useMotionValue<number>(SNAP.mini);

  // Auto-hide sheet if no content
  useEffect(() => {
    if (!selected && !selectedPoi && !activeItinerary) {
      setSheet('mini');
    } else if (sheet === 'mini') {
      setSheet('peek');
    }
  }, [selected, selectedPoi, activeItinerary]);

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
    addToRecent({ 
      id: stop.stop_id, 
      name: stop.stop_name, 
      type: 'stop', 
      commune: stop.commune ?? undefined,
      lat: stop.stop_lat,
      lon: stop.stop_lon
    });
    setSelected(stop);
    setSheet('half');
  }, [addToRecent]);

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
        recenterSignal={recenterSignal}
        onStopClick={handleSelectStop}
        onPoiClick={(poi) => {
          if (poi.place_id) {
            addToRecent({
              id: poi.id,
              name: poi.name,
              type: 'place',
              commune: poi.commune ?? undefined,
              lat: poi.lat,
              lon: poi.lon
            });
            router.push(`/app/place/${poi.place_id}`);
          } else {
            setSelectedPoi(poi); 
            setSelected(null); 
            setSheet('half');
          }
        }}
        onMapReady={handleMapReady}
        userLocation={userLoc}
        userHeading={userHeading}
        legs={activeItinerary?.legs?.map((l) => ({ coords: l.coords ?? [], mode: l.mode, routeColor: l.route?.color })) || null}
        hotspots={heatMode ? hotspots : []}
        explorers={explorers}
        pois={pois}
        poiCheckins={poiCheckins}
        livePois={livePois}
        broadcasts={broadcasts}
      />

      {/* ── Top Floating Badge (Minimalist) ── */}
      <div style={{ position: 'absolute', top: 'calc(env(safe-area-inset-top,0px) + 12px)', left: 16, zIndex: 10 }}>
        <div style={{ background: 'var(--cream)', padding: '6px 12px', borderRadius: 12, boxShadow: '0 4px 12px rgba(0,0,0,0.08)', display: 'flex', alignItems: 'center', gap: 6, fontSize: 10, fontWeight: 800, color: 'var(--orange)' }}>
          <div className="shimmer" style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--orange)' }} />
          LIVE · 247 MOBEURS
        </div>
      </div>

      {/* ── FAB Stack (Right) ── */}
      <div style={{ position: 'absolute', right: 16, top: 'calc(env(safe-area-inset-top,0px) + 68px)', display: 'flex', flexDirection: 'column', gap: 8, zIndex: 10 }}>
        {(
          [
            { icon: <Ic.Layers s={18} />, action: () => setIsSatellite(v => !v), active: isSatellite, loading: false },
            { icon: <Ic.Locate s={18} />, action: handleLocateMe, active: !!userLoc, loading: geoLoading },
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

      {/* ── PlusBubble is now inside BottomNav ── */}

      {/* ── Nearby Stops Bubble (Floating) ── */}
      {!selected && !selectedPoi && !activeItinerary && (
        <NearbyStopsBubble 
          stops={nearbyStops} 
          onSelect={(stop) => {
            // Optionnel: recentrer ou autre action
          }} 
        />
      )}

      {/* ── FLOATING ICE BUBBLE (iOS SEARCH STYLE) ── */}
      <AnimatePresence>
        {!selected && !selectedPoi && !activeItinerary && (
          <motion.div 
            initial={{ y: 20, opacity: 0, scale: 0.9 }}
            animate={{ y: 0, opacity: 1, scale: 1 }}
            exit={{ y: 20, opacity: 0, scale: 0.9 }}
            style={{ position: 'absolute', bottom: 100, left: 0, right: 0, zIndex: 500, display: 'flex', justifyContent: 'center', pointerEvents: 'none' }}
          >
            {/* Recherche & Swipe */}
            <motion.button 
              drag="x"
              dragConstraints={{ left: 0, right: 0 }}
              onDragEnd={(_, info) => {
                  setHeatMode(!heatMode);
              }}
              onClick={openSearch}
              className="press"
              style={{ 
                pointerEvents: 'auto',
                height: 36, 
                padding: '0 18px',
                borderRadius: 18, 
                border: 'none', 
                background: heatMode ? 'var(--orange)' : 'rgba(255, 255, 255, 0.45)', 
                color: heatMode ? '#fff' : 'var(--ink)',
                backdropFilter: 'blur(20px) saturate(180%)',
                WebkitBackdropFilter: 'blur(20px) saturate(180%)',
                boxShadow: heatMode ? '0 8px 20px rgba(242,108,26,0.3)' : '0 4px 12px rgba(0,0,0,0.08)', 
                display: 'flex', 
                alignItems: 'center', 
                gap: 8, 
                cursor: 'pointer',
                transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
                position: 'relative',
                transform: heatMode ? 'scale(1.05)' : 'scale(1)'
              }}
            >
              <Ic.Search s={16} />
              <span style={{ fontSize: 13, fontWeight: 800 }}>{heatMode ? 'Heatmap active' : 'Recherche'}</span>
              
              <div style={{ display: 'flex', gap: 4, marginLeft: 4 }}>
                <div style={{ width: 4, height: 4, borderRadius: '50%', background: 'currentColor', opacity: 0.8 }} />
                <div style={{ width: 4, height: 4, borderRadius: '50%', background: 'currentColor', opacity: 0.3 }} />
              </div>
            </motion.button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── FLOATING INFO POD (ANTIGRAVITY STACK STYLE) ── */}
      <AnimatePresence>
        {(selected || selectedPoi || activeItinerary) && (
          <motion.div
            initial={{ y: 100, opacity: 0, scale: 0.95 }}
            animate={{ y: 0, opacity: 1, scale: 1 }}
            exit={{ y: 100, opacity: 0, scale: 0.95 }}
            style={{ 
              position: 'absolute', 
              bottom: 100, 
              left: 16, 
              right: 16, 
              zIndex: 600, 
              maxHeight: '65vh',
              background: 'rgba(255, 255, 255, 0.7)',
              backdropFilter: 'blur(24px) saturate(200%)',
              WebkitBackdropFilter: 'blur(24px) saturate(200%)',
              borderRadius: 32,
              boxShadow: '0 12px 40px rgba(0,0,0,0.15)',
              border: '1px solid rgba(255,255,255,0.4)',
              overflow: 'hidden',
              display: 'flex',
              flexDirection: 'column'
            }}
          >
            <div style={{ width: '100%', padding: '12px 0', display: 'flex', justifyContent: 'center', cursor: 'pointer' }}>
              <div style={{ width: 40, height: 4, borderRadius: 2, background: 'var(--ink)', opacity: 0.1 }} />
            </div>

            <div className="no-scrollbar" style={{ flex: 1, overflowY: 'auto', padding: '0 20px 24px' }}>
              {selectedPoi ? (
                <div>
                  <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 16, marginBottom: 20 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                      <div style={{ width: 50, height: 50, borderRadius: 16, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 24, background: 'var(--cream)', border: '1px solid rgba(0,0,0,0.05)' }}>
                        {selectedPoi.logo_emoji || '📍'}
                      </div>
                      <div>
                        <h2 style={{ fontSize: 18, fontWeight: 800, color: 'var(--ink)', margin: 0, lineHeight: 1.2 }}>{selectedPoi.name}</h2>
                        <div style={{ fontSize: 10, fontWeight: 700, color: 'var(--orange)', textTransform: 'uppercase', letterSpacing: 1, marginTop: 2 }}>{selectedPoi.commune || 'Abidjan'}</div>
                      </div>
                    </div>
                    <button onClick={() => setSelectedPoi(null)} style={{ width: 32, height: 32, borderRadius: 12, border: 'none', background: 'rgba(0,0,0,0.05)', color: 'var(--ink)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
                      <Ic.X s={16} />
                    </button>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 16 }}>
                    <PoiCheckInButton placeId={selectedPoi.id} placeName={selectedPoi.name} commune={selectedPoi.commune} lat={selectedPoi.lat} lon={selectedPoi.lon} />
                    <button onClick={() => handleGetDirections(selectedPoi)} style={{ height: 44, background: 'var(--orange)', color: '#fff', fontWeight: 800, borderRadius: 14, fontSize: 11, textTransform: 'uppercase', letterSpacing: 0.5, border: 'none', cursor: 'pointer', boxShadow: '0 4px 12px rgba(242,108,26,0.2)' }}>S'y rendre</button>
                  </div>

                  {selectedPoi.description && <p style={{ fontSize: 13, color: 'var(--muted)', lineHeight: 1.5, marginBottom: 16 }}>{selectedPoi.description}</p>}
                  
                  <Link href={`/app/place/${selectedPoi.id}`} style={{ display: 'block', textAlign: 'center', fontSize: 11, fontWeight: 800, color: 'var(--ink)', textTransform: 'uppercase', letterSpacing: 1, padding: '12px', background: 'rgba(0,0,0,0.05)', borderRadius: 12, textDecoration: 'none' }}>Voir le profil complet</Link>
                </div>

              ) : activeItinerary ? (
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
                    <h2 style={{ fontSize: 18, fontWeight: 800, color: 'var(--ink)', margin: 0 }}>Ton trajet</h2>
                    <button onClick={() => setActiveItinerary(null)} style={{ width: 32, height: 32, borderRadius: 12, border: 'none', background: 'rgba(0,0,0,0.05)', color: 'var(--ink)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
                      <Ic.X s={16} />
                    </button>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                    {activeItinerary.legs.map((leg, idx) => (
                      <div key={idx} style={{ display: 'flex', gap: 16 }}>
                        <div style={{ width: 32, height: 32, borderRadius: 10, background: 'var(--cream)', border: '1px solid var(--line)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16, flexShrink: 0 }}>
                          {leg.mode === 'WALK' ? '🚶' : '🚌'}
                        </div>
                        <div style={{ flex: 1 }}>
                          <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--ink)' }}>{leg.route?.shortName ? `Ligne ${leg.route.shortName}` : 'Marche'}</div>
                          <div style={{ fontSize: 11, color: 'var(--muted)' }}>Vers {leg.to.name}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

              ) : selected ? (
                <div>
                  <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 20 }}>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 10, fontWeight: 800, color: 'var(--orange)', letterSpacing: 1, textTransform: 'uppercase', marginBottom: 2 }}>{selected.commune || 'Abidjan'}</div>
                      <h2 style={{ fontSize: 20, fontWeight: 900, color: 'var(--ink)', margin: 0, lineHeight: 1.1 }}>{selected.stop_name}</h2>
                    </div>
                    <div style={{ display: 'flex', gap: 8 }}>
                      <button onClick={clearSelection} style={{ width: 32, height: 32, borderRadius: 12, border: 'none', background: 'rgba(0,0,0,0.05)', color: 'var(--ink)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
                        <Ic.X s={16} />
                      </button>
                    </div>
                  </div>

                  <div style={{ background: 'rgba(0,0,0,0.03)', borderRadius: 20, padding: 16, marginBottom: 16 }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
                      <div style={{ fontSize: 12, fontWeight: 800, color: 'var(--ink)' }}>Prochains passages</div>
                      <div style={{ fontSize: 10, fontWeight: 800, color: 'var(--green)', display: 'flex', alignItems: 'center', gap: 4 }}>
                        <div className="shimmer" style={{ width: 6, height: 6, borderRadius: '50%', background: 'currentColor' }} />
                        EN DIRECT
                      </div>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                      {nearbyTransport.filter(t => t.available).slice(0, 3).map((t, i) => (
                        <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                          <div style={{ width: 36, height: 36, borderRadius: 10, background: t.color || 'var(--ink)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 900 }}>
                            {t.kind.substring(0, 1).toUpperCase()}
                          </div>
                          <div style={{ flex: 1 }}>
                            <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--ink)' }}>{t.label}</div>
                            <div style={{ fontSize: 11, color: 'var(--muted)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{t.routeName || 'Ligne disponible'}</div>
                          </div>
                          {t.stop && (
                            <div style={{ fontSize: 12, fontWeight: 900, color: 'var(--orange)' }}>
                              {formatDistance(t.stop.distance_m)}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>

                  <div style={{ display: 'flex', gap: 10 }}>
                    <button 
                      onClick={() => handleDescendIci(selected)}
                      style={{ flex: 1, height: 44, background: 'var(--ink)', color: '#fff', fontWeight: 800, borderRadius: 14, fontSize: 11, textTransform: 'uppercase', letterSpacing: 0.5, border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}
                    >
                      <Ic.Map s={16} /> J'y suis
                    </button>
                    <button 
                      onClick={() => handleGetDirections({ name: selected.stop_name, lat: selected.stop_lat, lon: selected.stop_lon })}
                      style={{ width: 44, height: 44, background: 'var(--cream)', color: 'var(--ink)', borderRadius: 14, border: '1px solid var(--line)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                    >
                      <Ic.Route s={20} />
                    </button>
                  </div>
                </div>
              ) : null}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Search Overlay ── */}
      <AnimatePresence>
        {searchOpen && (
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 24 }}
            transition={{ type: 'spring', damping: 28, stiffness: 280 }}
            style={{ position: 'fixed', inset: 0, zIndex: 1000, background: 'var(--cream-2)', display: 'flex', flexDirection: 'column' }}
          >
            <div
              style={{
                background: 'var(--cream)',
                padding: 'calc(env(safe-area-inset-top, 0px) + 14px) 16px 14px',
                borderBottom: '1px solid var(--line)',
                display: 'flex', alignItems: 'center', gap: 10,
                boxShadow: '0 6px 20px rgba(26,20,16,0.05)',
              }}
            >
              <button
                onClick={closeSearch}
                aria-label="Fermer la recherche"
                className="press"
                style={{
                  width: 40, height: 40, borderRadius: 12, border: 'none',
                  background: 'var(--cream-2)',
                  color: 'var(--ink)', cursor: 'pointer',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}
              >
                <Ic.Back s={20} />
              </button>
              <div
                style={{
                  flex: 1, height: 44, borderRadius: 14,
                  background: 'var(--cream-2)',
                  border: '1px solid var(--line)',
                  display: 'flex', alignItems: 'center', gap: 10,
                  padding: '0 14px',
                }}
              >
                <Ic.Search s={18} />
                <input
                  autoFocus
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Chercher un arrêt, un lieu…"
                  style={{
                    flex: 1, fontSize: 15, fontWeight: 600,
                    border: 'none', outline: 'none', background: 'transparent',
                    color: 'var(--ink)',
                  }}
                />
                {isSearching ? (
                  <div
                    className="animate-spin"
                    style={{
                      width: 16, height: 16,
                      border: '2px solid var(--orange)',
                      borderTopColor: 'transparent',
                      borderRadius: '50%',
                    }}
                  />
                ) : (
                  <span
                    style={{
                      fontSize: 10, fontWeight: 800, color: 'var(--orange)',
                      background: 'var(--orange-pale)',
                      padding: '3px 7px', borderRadius: 6, letterSpacing: 0.5,
                    }}
                  >IA</span>
                )}
              </div>
            </div>

            <div className="no-scrollbar" style={{ flex: 1, overflowY: 'auto', padding: '14px 16px 32px' }}>
              {/* Résultats de recherche */}
              {results.length > 0 && (
                <div style={{ fontSize: 10, fontWeight: 800, color: 'var(--muted)', letterSpacing: 1, textTransform: 'uppercase', margin: '14px 4px 10px' }}>
                  Résultats
                </div>
              )}
              {results.map((r, i) => (
                <button
                  key={i}
                  onClick={() => {
                    addToRecent({
                      id: r.id,
                      name: r.name,
                      type: r.type,
                      commune: r.commune ?? undefined,
                      lat: r.lat,
                      lon: r.lon,
                      logo: r.logo
                    });
                    if (r.type === 'stop') {
                      handleSelectStop({
                        stop_id: r.id,
                        stop_name: r.name,
                        stop_lat: r.lat,
                        stop_lon: r.lon,
                        commune: r.commune ?? null
                      });
                    } else {
                      router.push(`/app/place/${r.id}`);
                    }
                    closeSearch();
                  }}
                  className="press"
                  style={{
                    width: '100%', display: 'flex', alignItems: 'center', gap: 12,
                    padding: 12, background: 'var(--cream)',
                    borderRadius: 14, border: '1px solid var(--line)',
                    marginBottom: 8, textAlign: 'left', cursor: 'pointer',
                  }}
                >
                  <div style={{ width: 40, height: 40, borderRadius: 12, background: r.type === 'stop' ? 'var(--orange-pale)' : 'var(--blue-pale)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: r.type === 'stop' ? 'var(--orange)' : 'var(--blue)', flexShrink: 0, border: 'none' }}>
                    {r.type === 'stop' ? <Ic.Bus s={18} /> : (r.logo ? <span style={{ fontSize: 18 }}>{r.logo}</span> : <Ic.Pin s={18} />)}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontWeight: 800, fontSize: 14, color: 'var(--ink)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{r.name}</div>
                    <div style={{ fontSize: 10, fontWeight: 700, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: 1, marginTop: 2 }}>{r.commune || (r.type === 'stop' ? 'Arrêt' : 'Lieu')}</div>
                  </div>
                  <Ic.Arrow s={16} />
                </button>
              ))}

              {/* Historique récent */}
              {!query && recentItems.length > 0 && (
                <>
                  <div style={{ fontSize: 10, fontWeight: 800, color: 'var(--muted)', letterSpacing: 1, textTransform: 'uppercase', margin: '20px 4px 10px' }}>
                    Récentes
                  </div>
                  {recentItems.map((r, i) => (
                    <button
                      key={i}
                      onClick={() => {
                        if (r.type === 'stop') {
                          handleSelectStop({
                            stop_id: r.id,
                            stop_name: r.name,
                            stop_lat: r.lat!,
                            stop_lon: r.lon!,
                            commune: r.commune ?? null
                          });
                        } else {
                          router.push(`/app/place/${r.id}`);
                        }
                        closeSearch();
                      }}
                      className="press"
                      style={{
                        width: '100%', background: 'var(--cream)', padding: 12, borderRadius: 14,
                        border: '1px solid var(--line)',
                        display: 'flex', alignItems: 'center', gap: 12,
                        marginBottom: 8, textAlign: 'left', cursor: 'pointer',
                      }}
                    >
                      <div style={{ width: 40, height: 40, borderRadius: 12, background: r.type === 'stop' ? 'var(--orange-pale)' : 'var(--blue-pale)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: r.type === 'stop' ? 'var(--orange)' : 'var(--blue)', flexShrink: 0, border: 'none' }}>
                        {r.type === 'stop' ? <Ic.Bus s={18} /> : (r.logo ? <span style={{ fontSize: 18 }}>{r.logo}</span> : <Ic.Pin s={18} />)}
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: 14, fontWeight: 800, color: 'var(--ink)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{r.name}</div>
                        <div style={{ fontSize: 10, color: 'var(--muted)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.5, marginTop: 2 }}>
                          {r.type === 'stop' ? (r.commune || 'Arrêt') : (r.commune || 'Lieu')}
                        </div>
                      </div>
                      <Ic.Arrow s={16} />
                    </button>
                  ))}
                </>
              )}

              {/* État vide par défaut */}
              {!query && recentItems.length === 0 && (
                <div
                  style={{
                    marginTop: 24, padding: '32px 20px',
                    borderRadius: 18,
                    background: 'var(--cream)',
                    border: '1.5px dashed var(--line-strong)',
                    textAlign: 'center',
                    color: 'var(--muted)',
                  }}
                >
                  <div
                    style={{
                      width: 56, height: 56, margin: '0 auto 12px',
                      borderRadius: 18, background: 'var(--orange-pale)',
                      color: 'var(--orange)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                    }}
                  >
                    <Ic.Search s={26} />
                  </div>
                  <div className="font-display" style={{ fontSize: 18, color: 'var(--ink)' }}>
                    Cherche ton chemin
                  </div>
                  <div style={{ fontSize: 12, fontWeight: 600, marginTop: 6, lineHeight: 1.4 }}>
                    Tape un arrêt, un quartier ou une ligne pour démarrer.
                  </div>
                </div>
              )}

              {/* Aucun résultat */}
              {query && !isSearching && results.length === 0 && (
                <div
                  style={{
                    marginTop: 16, padding: '24px 20px',
                    borderRadius: 16, background: 'var(--cream)',
                    border: '1px solid var(--line)', textAlign: 'center',
                  }}
                >
                  <div className="font-display" style={{ fontSize: 16, color: 'var(--ink)' }}>
                    Rien trouvé pour « {query} »
                  </div>
                  <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--muted)', marginTop: 6 }}>
                    Essaie un autre nom ou un quartier voisin.
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <BottomNav 
        onToggleHeatmap={() => setHeatMode(!heatMode)} 
        heatMode={heatMode}
        nearbyStopsCount={nearbyStops.length}
        onCycleNearby={() => {
          if (nearbyStops.length === 0) return;
          const next = (nearbyIndex + 1) % Math.min(nearbyStops.length, 5);
          setNearbyIndex(next);
          handleSelectStop(nearbyStops[next]);
        }}
      />
    </div>
  );
}
