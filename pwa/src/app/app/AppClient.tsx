'use client';

import NextDynamic from 'next/dynamic';
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
import PlusBubble from '@/components/ui/PlusBubble';
import { HelpTip } from '@/components/ui/HelpTip';
import { useDataStore } from '@/context/DataStoreContext';

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

const Map = NextDynamic(() => import('@/components/Map'), {
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

export default function AppClient() {
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
  const [isPlusOpen, setIsPlusOpen] = useState(false);
  const [selected, setSelected] = useState<Stop | null>(null);
  const [sheet, setSheet] = useState<'mini' | 'peek' | 'half' | 'full'>('mini');
  const [selectedPoi, setSelectedPoi] = useState<POI | null>(null);
  const [isSatellite, setIsSatellite] = useState(false);
  const [lastDestination, setLastDestination] = useState<LastDestination | null>(() => {
    if (typeof window === 'undefined') return null;
    try { return JSON.parse(localStorage.getItem('babimob_lastDest') ?? 'null'); } catch { return null; }
  });
  const [recentItems, setRecentItems] = useState<RecentItem[]>([]);
  const [nearbyIndex, setNearbyIndex] = useState(0);

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

  const { 
    pois, 
    poiCheckins, 
    livePois, 
    liveTickerFeed, 
    handleMapReady,
    userLoc,
    userHeading,
    nearbyStops,
    loading: geoLoading,
    locateMe,
    heatMode,
    setHeatMode,
    hotspots,
    profile,
    broadcasts,
    explorers,
    activeItinerary,
    setActiveItinerary,
    nearbyTransport,
  } = useDataStore();

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

  const handleDiscover = useCallback(() => {
    if (pois.length === 0) return;
    // Priorité aux lieux sponsorisés (partenariats)
    const partners = pois.filter(p => p.is_sponsored || p.sponsor_tier);
    // 70% de chance d'afficher un partenaire s'il y en a, sinon un lieu au hasard
    const pool = (partners.length > 0 && Math.random() > 0.3) ? partners : pois;
    const randomPoi = pool[Math.floor(Math.random() * pool.length)];
    
    setSelected(null);
    setActiveItinerary(null);
    setSelectedPoi(randomPoi);
    setSheet('half');
  }, [pois]);

  // Gestion du paramètre ?discover=1
  useEffect(() => {
    if (typeof window !== 'undefined' && pois.length > 0) {
      const url = new URL(window.location.href);
      if (url.searchParams.get('discover')) {
        handleDiscover();
        // Nettoyer l'URL
        url.searchParams.delete('discover');
        window.history.replaceState({}, '', url.pathname + url.search);
      }
    }
  }, [pois, handleDiscover]);

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
    : selectedPoi
    ? [selectedPoi.lat, selectedPoi.lon]
    : userLoc ?? ABIDJAN_CENTER;
  const zoom = (selected || selectedPoi) ? 16 : userLoc ? 15 : 12;

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
            router.push(`/app/place/${encodeURIComponent(poi.place_id)}`);
          } else {
            setSelectedPoi(poi); 
            setSelected(null); 
            setSheet('half');
          }
        }}
        onMapReady={handleMapReady}
        userLocation={userLoc}
        userHeading={userHeading}
        legs={activeItinerary?.legs?.map((l: any) => ({ coords: l.coords ?? [], mode: l.mode, routeColor: l.routeColor }))}
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

      {/* ── FLOATING ICE BUBBLE (iOS SEARCH STYLE) ── */}
      <AnimatePresence>
        {!selected && !selectedPoi && !activeItinerary && (
          <motion.div 
            initial={{ y: 20, opacity: 0, scale: 0.9 }}
            animate={{ y: 0, opacity: 1, scale: 1 }}
            exit={{ y: 20, opacity: 0, scale: 0.9 }}
            style={{ 
              position: 'absolute', 
              bottom: 'calc(env(safe-area-inset-bottom, 0px) + 110px)',
              left: 0, 
              right: 0, 
              zIndex: 8500,
              display: 'flex', 
              justifyContent: 'center', 
              pointerEvents: 'none' 
            }}
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
              bottom: 'calc(env(safe-area-inset-bottom, 0px) + 84px)',
              left: 16, 
              right: 16, 
              zIndex: 8000, 
              height: heightMV,
              background: 'rgba(255, 255, 255, 0.75)',
              backdropFilter: 'blur(40px) saturate(180%)',
              WebkitBackdropFilter: 'blur(40px) saturate(180%)',
              borderRadius: 32,
              border: '1px solid rgba(255,255,255,0.5)',
              boxShadow: '0 20px 50px rgba(0,0,0,0.12), inset 0 0 0 1px rgba(255,255,255,0.4)',
              overflow: 'hidden',
              display: 'flex',
              flexDirection: 'column',
              pointerEvents: 'auto'
            }}
          >
            {/* Handle & Header (Drag Zone) */}
            <div 
              onPointerDown={onHandlePointerDown}
              style={{ 
                width: '100%', 
                padding: '12px 0 16px', 
                display: 'flex', 
                flexDirection: 'column',
                alignItems: 'center', 
                cursor: 'grab', 
                touchAction: 'none',
                background: 'linear-gradient(to bottom, rgba(255,255,255,0.4), transparent)',
                borderTopLeftRadius: 32,
                borderTopRightRadius: 32
              }}
            >
              <div style={{ width: 36, height: 4, borderRadius: 2, background: 'var(--ink)', opacity: 0.1, marginBottom: 12 }} />
              
              {(selectedPoi || selected) && (
                <div style={{ padding: '0 24px', width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                   <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                      <div style={{ width: 44, height: 44, borderRadius: 14, background: 'var(--cream)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20, boxShadow: '0 4px 12px rgba(0,0,0,0.04)' }}>
                         {selectedPoi ? (selectedPoi.logo_emoji || '📍') : '🚌'}
                      </div>
                      <div>
                        <h2 style={{ fontSize: 16, fontWeight: 900, color: 'var(--ink)', margin: 0, lineHeight: 1.1 }}>
                          {selectedPoi ? selectedPoi.name : selected?.stop_name}
                        </h2>
                        <div style={{ fontSize: 9, fontWeight: 800, color: 'var(--orange)', textTransform: 'uppercase', letterSpacing: 1, marginTop: 2 }}>
                          {selectedPoi ? (selectedPoi.commune || 'Abidjan') : (selected?.commune || 'Abidjan')}
                        </div>
                      </div>
                   </div>
                   <button 
                     onClick={() => { setSelectedPoi(null); setSelected(null); }} 
                     style={{ width: 32, height: 32, borderRadius: 12, border: 'none', background: 'rgba(0,0,0,0.04)', color: 'var(--ink)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}
                   >
                     <Ic.X s={14} />
                   </button>
                </div>
              )}
            </div>

            <div className="no-scrollbar" style={{ flex: 1, overflowY: 'auto', padding: '0 24px 120px' }}>
              {selectedPoi ? (
                <div>
                  <Link 
                    href={`/app/place/${encodeURIComponent(selectedPoi.id)}`} 
                    style={{ 
                      display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10,
                      height: 52, background: 'var(--orange)', color: '#fff', 
                      fontWeight: 900, borderRadius: 18, fontSize: 13, 
                      textTransform: 'uppercase', letterSpacing: 1.2, 
                      textDecoration: 'none', boxShadow: '0 12px 30px rgba(242,108,26,0.25)',
                      marginBottom: 24,
                      transition: 'transform 0.2s ease'
                    }}
                    className="press"
                  >
                    Voir le profil complet
                    <Ic.Arrow s={18} />
                  </Link>

                  {/* Infos Promo / Campagne */}
                  {selectedPoi.has_campaign && (
                    <div style={{ 
                      background: 'linear-gradient(135deg, var(--orange-pale), #FFF)', 
                      border: '1.5px solid var(--orange-pale)', 
                      borderRadius: 20, padding: '16px', marginBottom: 24, 
                      display: 'flex', alignItems: 'center', gap: 14,
                      boxShadow: '0 4px 15px rgba(242,108,26,0.06)'
                    }}>
                      <div style={{ fontSize: 28 }}>🎁</div>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: 9, fontWeight: 900, color: 'var(--orange)', textTransform: 'uppercase', letterSpacing: 1.2, marginBottom: 2 }}>EXCLUSIVITÉ BABIMOB</div>
                        <div style={{ fontSize: 14, fontWeight: 800, color: 'var(--ink)', lineHeight: 1.3 }}>{selectedPoi.campaign_label || 'Offre spéciale disponible sur place !'}</div>
                      </div>
                    </div>
                  )}

                  {/* Description si présente */}
                  {selectedPoi.description && (
                    <div style={{ marginBottom: 24, padding: '0 4px' }}>
                       <div style={{ fontSize: 9, fontWeight: 900, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: 1.5, marginBottom: 8 }}>À PROPOS</div>
                       <p style={{ fontSize: 14, color: 'var(--ink-2)', lineHeight: 1.6, margin: 0, opacity: 0.9 }}>{selectedPoi.description}</p>
                    </div>
                  )}

                  {/* Avis Simulés */}
                  <div style={{ padding: '0 4px' }}>
                    <div style={{ fontSize: 9, fontWeight: 900, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: 1.5, marginBottom: 16 }}>COMMUNAUTÉ</div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                       {[
                         { user: 'Kouassi', note: 5, text: 'Super accueil et service rapide !' },
                         { user: 'Marie', note: 4, text: 'Très bon rapport qualité/prix.' }
                       ].map((rev, i) => (
                         <div key={i} style={{ 
                           background: 'rgba(255,255,255,0.4)', 
                           padding: '14px', 
                           borderRadius: 20,
                           border: '1px solid rgba(0,0,0,0.03)',
                           boxShadow: '0 2px 8px rgba(0,0,0,0.02)'
                         }}>
                           <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6, alignItems: 'center' }}>
                             <span style={{ fontSize: 13, fontWeight: 800, color: 'var(--ink)' }}>{rev.user}</span>
                             <div style={{ display: 'flex', gap: 1 }}>
                               {[...Array(5)].map((_, idx) => (
                                 <span key={idx} style={{ fontSize: 10, opacity: idx < rev.note ? 1 : 0.2 }}>⭐</span>
                               ))}
                             </div>
                           </div>
                           <p style={{ fontSize: 13, color: 'var(--ink-2)', margin: 0, lineHeight: 1.4, opacity: 0.85 }}>{rev.text}</p>
                         </div>
                       ))}
                    </div>
                  </div>
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
                    {activeItinerary.legs.map((leg: any, idx: number) => (
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
                      onClick={() => {
                        handleDescendIci(selected);
                        const safeId = encodeURIComponent(selected.stop_id);
                        router.push(`/app/arret/${safeId}`);
                      }}
                      style={{ flex: 1, height: 44, background: 'var(--ink)', color: '#fff', fontWeight: 800, borderRadius: 14, fontSize: 11, textTransform: 'uppercase', letterSpacing: 0.5, border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}
                    >
                      <Ic.Map s={16} /> J'y suis
                    </button>
                    <button 
                      onClick={() => {
                        const firstLigne = nearbyTransport.find(t => t.available && t.routeId);
                        if (firstLigne && firstLigne.routeId) {
                          const safeRouteId = encodeURIComponent(firstLigne.routeId);
                          router.push(`/app/ligne/${safeRouteId}`);
                        } else {
                          router.push(`/app/ligne`);
                        }
                      }}
                      disabled={!nearbyTransport.some(t => t.available && t.routeId)}
                      style={{ 
                        width: 44, height: 44, 
                        background: nearbyTransport.some(t => t.available && t.routeId) ? 'var(--cream)' : 'rgba(0,0,0,0.05)', 
                        color: nearbyTransport.some(t => t.available && t.routeId) ? 'var(--ink)' : 'var(--muted)', 
                        borderRadius: 14, border: '1px solid var(--line)', 
                        cursor: nearbyTransport.some(t => t.available && t.routeId) ? 'pointer' : 'not-allowed', 
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        opacity: nearbyTransport.some(t => t.available && t.routeId) ? 1 : 0.5
                      }}
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
              {/* État vide — pas de query : affiche les récents */}
              {query.trim().length < 2 && recentItems.length > 0 && (
                <>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', margin: '14px 4px 10px' }}>
                    <div style={{ fontSize: 10, fontWeight: 800, color: 'var(--muted)', letterSpacing: 1, textTransform: 'uppercase' }}>
                      Récents
                    </div>
                    <button
                      onClick={() => { setRecentItems([]); localStorage.setItem('babimob_recent_history', '[]'); }}
                      style={{ fontSize: 11, fontWeight: 700, color: 'var(--orange)', background: 'transparent', border: 'none', cursor: 'pointer', padding: 0 }}
                    >
                      Effacer
                    </button>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                    {recentItems.map((item) => (
                      <button
                        key={`${item.type}-${item.id}`}
                        onClick={() => {
                          closeSearch();
                          if (item.type === 'place') {
                            router.push(`/app/place/${encodeURIComponent(item.id)}`);
                          } else if (item.type === 'line') {
                            router.push(`/app/ligne/${encodeURIComponent(item.id)}`);
                          } else if (item.lat != null && item.lon != null) {
                            handleSelectStop({
                              stop_id: item.id,
                              stop_name: item.name,
                              stop_lat: item.lat,
                              stop_lon: item.lon,
                              commune: item.commune ?? null,
                            } as Stop);
                          }
                        }}
                        className="press"
                        style={{
                          display: 'flex', alignItems: 'center', gap: 12,
                          width: '100%', textAlign: 'left',
                          padding: '12px 14px', background: 'var(--cream)',
                          border: '1px solid var(--line)', borderRadius: 14, cursor: 'pointer',
                        }}
                      >
                        <div style={{
                          width: 36, height: 36, borderRadius: 10,
                          background: 'var(--cream-2)', display: 'flex',
                          alignItems: 'center', justifyContent: 'center',
                          flexShrink: 0,
                        }}>
                          {item.type === 'place'
                            ? <span style={{ fontSize: 18 }}>{item.logo ?? '📍'}</span>
                            : item.type === 'line'
                            ? <Ic.Route s={18} color="var(--ink)" />
                            : <Ic.Bus s={18} color="var(--orange)" />}
                        </div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--ink)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            {item.name}
                          </div>
                          <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--muted)', marginTop: 2 }}>
                            {item.commune ?? (item.type === 'place' ? 'Lieu' : item.type === 'line' ? 'Ligne' : 'Arrêt')}
                          </div>
                        </div>
                        <Ic.History s={14} color="var(--muted)" />
                      </button>
                    ))}
                  </div>
                </>
              )}

              {/* Résultats de recherche */}
              {query.trim().length >= 2 && results.length > 0 && (
                <>
                  <div style={{ fontSize: 10, fontWeight: 800, color: 'var(--muted)', letterSpacing: 1, textTransform: 'uppercase', margin: '14px 4px 10px' }}>
                    Résultats · {results.length}
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                    {results.map((r) => (
                      <button
                        key={`${r.type}-${r.id}`}
                        onClick={() => {
                          closeSearch();
                          if (r.type === 'place') {
                            addToRecent({ id: r.id, name: r.name, type: 'place', commune: r.commune ?? undefined, lat: r.lat, lon: r.lon, logo: r.logo });
                            router.push(`/app/place/${encodeURIComponent(r.id)}`);
                          } else {
                            addToRecent({ id: r.id, name: r.name, type: 'stop', commune: r.commune ?? undefined, lat: r.lat, lon: r.lon });
                            handleSelectStop({
                              stop_id: r.id,
                              stop_name: r.name,
                              stop_lat: r.lat,
                              stop_lon: r.lon,
                              commune: r.commune,
                            } as Stop);
                          }
                        }}
                        className="press"
                        style={{
                          display: 'flex', alignItems: 'center', gap: 12,
                          width: '100%', textAlign: 'left',
                          padding: '12px 14px', background: 'var(--cream)',
                          border: '1px solid var(--line)', borderRadius: 14, cursor: 'pointer',
                        }}
                      >
                        <div style={{
                          width: 36, height: 36, borderRadius: 10,
                          background: r.type === 'place' ? 'var(--orange-pale)' : 'var(--cream-2)',
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          flexShrink: 0,
                        }}>
                          {r.type === 'place'
                            ? <span style={{ fontSize: 18 }}>{r.logo ?? '📍'}</span>
                            : <Ic.Bus s={18} color="var(--orange)" />}
                        </div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--ink)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            {r.name}
                          </div>
                          <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--muted)', marginTop: 2 }}>
                            {r.commune ?? (r.type === 'place' ? 'Lieu' : 'Arrêt')}
                          </div>
                        </div>
                        <div style={{
                          fontSize: 9, fontWeight: 800, color: r.type === 'place' ? 'var(--orange)' : 'var(--ink-2)',
                          textTransform: 'uppercase', letterSpacing: 0.6,
                        }}>
                          {r.type === 'place' ? 'Lieu' : 'Arrêt'}
                        </div>
                      </button>
                    ))}
                  </div>
                </>
              )}

              {/* Aucun résultat */}
              {query.trim().length >= 2 && !isSearching && results.length === 0 && (
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '60px 20px', textAlign: 'center', color: 'var(--muted)' }}>
                  <div style={{ fontSize: 36, marginBottom: 12, opacity: 0.5 }}>🔍</div>
                  <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--ink)', marginBottom: 4 }}>
                    Aucun résultat pour « {query.trim()} »
                  </div>
                  <div style={{ fontSize: 12, fontWeight: 600 }}>
                    Essaie un autre mot-clé ou vérifie l'orthographe.
                  </div>
                </div>
              )}

              {/* Vide initial — pas de query, pas de récents */}
              {query.trim().length < 2 && recentItems.length === 0 && (
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '60px 20px', textAlign: 'center', color: 'var(--muted)' }}>
                  <div style={{ fontSize: 36, marginBottom: 12, opacity: 0.5 }}>🚌</div>
                  <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--ink)', marginBottom: 4 }}>
                    Cherche un arrêt ou un lieu
                  </div>
                  <div style={{ fontSize: 12, fontWeight: 600 }}>
                    Tape au moins 2 lettres pour démarrer.
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
          if (nearbyStops.length > 0) {
            setNearbyIndex(i => (i + 1) % nearbyStops.length);
            handleSelectStop(nearbyStops[(nearbyIndex + 1) % nearbyStops.length]);
          }
        }}
        onDiscover={handleDiscover}
        isAdmin={profile?.role === 'admin'}
        isPlusOpen={isPlusOpen}
        onTogglePlus={() => setIsPlusOpen(!isPlusOpen)}
      />
      <PlusBubble 
        isOpen={isPlusOpen} 
        onClose={() => setIsPlusOpen(false)}
        onToggleHeatmap={() => setHeatMode(!heatMode)}
        onDiscover={handleDiscover}
        heatMode={heatMode}
        isAdmin={profile?.role === 'admin'}
      />

    </div>
  );
}
