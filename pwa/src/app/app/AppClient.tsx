'use client'; // Vercel Trigger: Final UX Audit Stable

import NextDynamic from 'next/dynamic';
import Image from 'next/image';
import React, { useState, useCallback, useMemo, Suspense, useEffect, useRef } from 'react';
import Link from 'next/link';
import type { Stop, ArretProche } from '@/lib/types';
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
import { createClient } from '@/lib/supabase/client';

type RecentItem = {
  id: string;
  name: string;
  type: 'line' | 'stop' | 'place';
  commune?: string;
  color?: string;
  lat?: number;
  lon?: number;
  logo?: string;
  source?: string;
};

const Map = NextDynamic(() => import('@/components/MapModern'), {
  ssr: false,
  loading: () => (
    <div className="absolute inset-0 bg-beige-50 flex items-center justify-center">
      <div className="flex flex-col items-center gap-2">
        <div className="text-center mb-4">
          <div className="text-base font-black uppercase tracking-[0.2em] text-orange-600 animate-pulse">BABIMOB</div>
          <div className="text-[10px] font-bold text-beige-muted uppercase tracking-widest mt-0.5">Chargement de la ville…</div>
        </div>
        <div className="w-12 h-0.5 bg-orange-100 overflow-hidden relative rounded-full">
           <div className="absolute inset-0 bg-orange-600 animate-loading-bar" />
        </div>
      </div>
    </div>
  ),
});

const ABIDJAN_CENTER: [number, number] = [5.345, -4.020];

const Skeleton = ({ 
  width = '100%', 
  height = '20px', 
  radius = '12px' 
}: { 
  width?: string | number, 
  height?: string | number, 
  radius?: string | number 
}) => (
  <div style={{ 
    width: typeof width === 'number' ? `${width}px` : width, 
    height: typeof height === 'number' ? `${height}px` : height, 
    borderRadius: typeof radius === 'number' ? `${radius}px` : radius, 
    background: 'linear-gradient(90deg, rgba(0,0,0,0.04) 25%, rgba(0,0,0,0.08) 50%, rgba(0,0,0,0.04) 75%)',
    backgroundSize: '200% 100%',
    animation: 'skeleton-wave 1.5s infinite linear'
  }} />
);

export default function AppClient() {
  return (
    <Suspense fallback={<div style={{ flex: 1, background: 'var(--cream)' }} />}>
      <AppPageContent />
    </Suspense>
  );
}

function AppPageContent() {

  const router = useRouter();
  const supabase = createClient();

  type LastDestination = { name: string; commune: string | null; lat: number; lon: number };

  const [searchOpen, setSearchOpen] = useState(false);
  const [isPlusOpen, setIsPlusOpen] = useState(false);
  const [selected, setSelected] = useState<Stop | null>(null);
  const [sheet, setSheet] = useState<'mini' | 'peek' | 'half' | 'full'>('mini');
  const [selectedPoi, setSelectedPoi] = useState<POI | null>(null);
  const [poiSocialStats, setPoiSocialStats] = useState<{ checkins: number; advice: number } | null>(null);
  const [isDiscoveryMode, setIsDiscoveryMode] = useState(false);
  const [isSatellite, setIsSatellite] = useState(false);
  const [lastDestination, setLastDestination] = useState<LastDestination | null>(() => {
    if (typeof window === 'undefined') return null;
    try { return JSON.parse(localStorage.getItem('babimob_lastDest') ?? 'null'); } catch { return null; }
  });
  const [recentItems, setRecentItems] = useState<RecentItem[]>([]);
  const [nearbyIndex, setNearbyIndex] = useState(0);
  const [placeReviews, setPlaceReviews] = useState<any[]>([]);
  const [loadingReviews, setLoadingReviews] = useState(false);
  const [discoveryPois, setDiscoveryPois] = useState<POI[]>([]);
  const [discoveryIndex, setDiscoveryIndex] = useState(0);
  const [isGlobalLoading, setIsGlobalLoading] = useState(false);
  const [onlineCount, setOnlineCount] = useState(247);

  useEffect(() => {
    const interval = setInterval(() => {
      setOnlineCount(prev => {
        const delta = Math.floor(Math.random() * 5) - 2; // -2 to +2
        const next = prev + delta;
        // On reste dans une fourchette réaliste
        return next < 238 ? 242 : next > 265 ? 258 : next;
      });
    }, 7000 + Math.random() * 5000);
    return () => clearInterval(interval);
  }, []);

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
    mapRef,
    userLoc,
    userHeading,
    userAccuracy,
    nearbyStops: allNearbyStops,
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
    nearbyTransport: allNearbyTransport,
  } = useDataStore();

  /**
   * Lieu épinglé suite à une recherche OSM (queryRenderedFeatures ou Nominatim).
   * Pas en BDD → on l'affiche via un marker temporaire et on flyTo dessus.
   */
  type PinnedSearch = { id: string; name: string; lat: number; lon: number; emoji?: string; subtitle?: string; source?: string };
  const [pinnedSearch, setPinnedSearch] = useState<PinnedSearch | null>(null);

  // Drag-offset de la bulle de recherche (pour feedback visuel + seuil swipe→heatmap)
  const [bubbleDragX, setBubbleDragX] = useState(0);
  const SWIPE_HEAT_THRESHOLD = 60;

  const nearbyStops = useMemo(() => allNearbyStops.slice(0, 5), [allNearbyStops]);
  const selectedStopList = useMemo(() => {
    if (selected) {
      return [{ 
        stop_id: selected.stop_id, 
        stop_name: selected.stop_name, 
        stop_lat: selected.stop_lat, 
        stop_lon: selected.stop_lon, 
        commune: selected.commune,
        distance_m: 0 
      } as ArretProche];
    }
    return nearbyStops;
  }, [selected, nearbyStops]);
  const nearbyTransport = useNearbyTransport(selectedStopList);

  const hasInitialCenter = useRef(false);

  useEffect(() => {
    if (userLoc && !hasInitialCenter.current && mapRef.current) {
      hasInitialCenter.current = true;
      mapRef.current.flyTo({
        center: [userLoc[1], userLoc[0]],
        zoom: 15,
        duration: 3000
      });
    }
  }, [userLoc]);

  const {
    query,
    setQuery,
    results,
    searching: isSearching,
    clear: clearSearch,
  } = useStopSearch({ mapRef });

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

  // Charger les stats sociales du lieu sélectionné
  useEffect(() => {
    if (!selectedPoi) {
      setPoiSocialStats(null);
      return;
    }

    async function loadStats() {
      const id = selectedPoi?.place_id || selectedPoi?.id;
      if (!id) return;

      const since = new Date(Date.now() - 7 * 86400000).toISOString();
      
      const [checkRes, adviceRes] = await Promise.all([
        supabase.from('checkins').select('*', { count: 'exact', head: true }).eq('place_id', id).gte('created_at', since),
        supabase.from('place_advice').select('*', { count: 'exact', head: true }).eq('place_id', id)
      ]);

      setPoiSocialStats({
        checkins: checkRes.count || 0,
        advice: adviceRes.count || 0
      });
    }

    loadStats();
  }, [selectedPoi, supabase]);

  const handlePoiClick = useCallback((poi: POI) => {
    setSelected(null);
    setSelectedPoi({
      id: poi.id,
      place_id: poi.place_id,
      name: poi.name,
      lat: poi.lat,
      lon: poi.lon,
      category: poi.category || 'other',
      logo_emoji: poi.logo_emoji || '📍',
      cover_color: poi.cover_color || 'var(--orange)',
      is_sponsored: poi.is_sponsored || false,
      sponsor_tier: poi.sponsor_tier || null,
      has_campaign: poi.has_campaign || false,
      commune: poi.commune || undefined,
      source: poi.source === 'osm' ? 'osm' : 'supabase'
    });
    setPinnedSearch({
      id: poi.id,
      name: poi.name,
      lat: poi.lat,
      lon: poi.lon,
      emoji: poi.logo_emoji || '📍',
      source: 'supabase'
    });
    setSheet('half');
  }, []);

  const handleDiscover = useCallback(async () => {
    setIsGlobalLoading(true);
    console.log("🎲 Discovery Triggered - Checking local pool...");
    let pool = [...pois];
    
    // Si la piscine locale est vide, on va chercher les pépites globales d'Abidjan !
    if (pool.length === 0) {
      console.log("🌐 Local area empty, fetching global Abidjan gems...");
      const { fetchNearbyPOIs } = await import('@/lib/poi');
      // Abidjan large bounds
      const globalGems = await fetchNearbyPOIs(5.2, 5.5, -4.1, -3.8);
      if (globalGems && globalGems.length > 0) {
        pool = globalGems;
      }
    }

    if (pool.length === 0) {
      setIsGlobalLoading(false);
      alert("Chargement des lieux... Réessaie dans une seconde ! ⏳");
      return;
    }
    
    // Mélange et sélection
    const shuffled = pool.sort(() => Math.random() - 0.5);
    const partners = shuffled.filter(p => p.is_sponsored || p.sponsor_tier);
    const others = shuffled.filter(p => !p.is_sponsored && !p.sponsor_tier);
    
    const selection = [...partners, ...others].slice(0, 10);
    
    setDiscoveryPois(selection);
    setDiscoveryIndex(0);
    setIsDiscoveryMode(true);
    
    // Afficher le premier dans le sheet principal
    const first = selection[0];
    setSelectedPoi(first);
    setSelected(null);
    setSheet('half'); // On l'ouvre à moitié pour montrer qu'il y a du contenu
    
    // Simuler un petit délai pour le "Wow" effect et laisser la carte fly
    setTimeout(() => setIsGlobalLoading(false), 800);
  }, [pois, handlePoiClick]);

  const handleNextDiscovery = useCallback(() => {
    if (discoveryPois.length === 0) return;
    setIsGlobalLoading(true);
    const nextIdx = (discoveryIndex + 1) % discoveryPois.length;
    setDiscoveryIndex(nextIdx);
    
    const nextPoi = discoveryPois[nextIdx];
    setSelectedPoi(nextPoi);
    setSelected(null);
    setSheet('half');
    
    setTimeout(() => setIsGlobalLoading(false), 600);
  }, [discoveryPois, discoveryIndex]);

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

  // Real reviews loader
  useEffect(() => {
    if (!selectedPoi) {
      setPlaceReviews([]);
      return;
    }
    const poiId = selectedPoi.id;
    async function load() {
      setLoadingReviews(true);
      const { data } = await supabase
        .from('place_advice')
        .select('*, profile:profiles(display_name, avatar_emoji)')
        .eq('place_id', poiId)
        .order('created_at', { ascending: false })
        .limit(3);
      if (data) setPlaceReviews(data);
      setLoadingReviews(false);
    }
    load();
  }, [selectedPoi, supabase]);

  const handleLocateMe = useCallback(() => {
    setRecenterSignal(s => s + 1);
    locateMe();
  }, [locateMe]);

  const SNAP = { mini: 90, peek: 240, half: 450, full: 680 } as const;
  type SheetState = keyof typeof SNAP;

  const heightMV = useMotionValue<number>(SNAP.peek);

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
    : nearbyStops; // Déjà limité à 5

  const nearbyStopsToPoi = useMemo(() => {
    if (!selectedPoi) return [];
    return allNearbyStops
      .map(s => ({
        ...s,
        distance: Math.sqrt(
          Math.pow((s.stop_lat - selectedPoi.lat) * 111000, 2) +
          Math.pow((s.stop_lon - selectedPoi.lon) * 111000 * Math.cos(s.stop_lat * Math.PI / 180), 2)
        )
      }))
      .filter(s => s.distance < 1000) 
      .sort((a, b) => a.distance - b.distance)
      .slice(0, 3);
  }, [selectedPoi, allNearbyStops]);

  const handleSelectStop = useCallback((stop: Stop) => {
    setIsGlobalLoading(true);
    setSelectedPoi(null);
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
    setTimeout(() => setIsGlobalLoading(false), 800);
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
  const closeSearch = useCallback(() => { setSearchOpen(false); clearSearch(); }, [clearSearch]);

  // Escape ferme l'overlay de recherche
  useEffect(() => {
    if (!searchOpen) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') closeSearch(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [searchOpen, closeSearch]);


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
      <AnimatePresence>
        {isGlobalLoading && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            style={{
              position: 'fixed', top: 0, left: 0, right: 0, height: 3, 
              background: 'rgba(255,255,255,0.1)', zIndex: 10000, overflow: 'hidden'
            }}
          >
            <motion.div 
              initial={{ x: '-100%' }}
              animate={{ x: '100%' }}
              transition={{ repeat: Infinity, duration: 1, ease: "linear" }}
              style={{
                width: '40%', height: '100%', background: 'var(--orange)',
                boxShadow: '0 0 10px var(--orange)'
              }}
            />
          </motion.div>
        )}
      </AnimatePresence>

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
        onPoiClick={handlePoiClick}
        onMapReady={handleMapReady}
        userLocation={userLoc}
        userHeading={userHeading}
        userAccuracy={userAccuracy}
        legs={activeItinerary?.legs?.map((l: any) => ({ coords: l.coords ?? [], mode: l.mode, routeColor: l.routeColor }))}
        hotspots={heatMode ? hotspots : []}
        explorers={explorers}
        pois={pois}
        poiCheckins={poiCheckins}
        livePois={livePois}
        broadcasts={broadcasts}
        pinnedSearch={pinnedSearch}
        onPinnedSearchClear={() => setPinnedSearch(null)}
      />

      {/* ── Top Floating Badge (Minimalist) ── */}
      <div style={{ position: 'absolute', top: 'calc(env(safe-area-inset-top,0px) + 12px)', left: 16, zIndex: 10 }}>
        <div style={{ background: 'var(--cream)', padding: '6px 12px', borderRadius: 12, boxShadow: '0 4px 12px rgba(0,0,0,0.08)', display: 'flex', alignItems: 'center', gap: 6, fontSize: 10, fontWeight: 800, color: 'var(--orange)' }}>
          <div className="shimmer" style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--orange)' }} />
          <span>LIVE · </span>
          <AnimatePresence mode="wait">
            <motion.span
              key={onlineCount}
              initial={{ opacity: 0, y: 5 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -5 }}
              style={{ display: 'inline-block', minWidth: 20 }}
            >
              {onlineCount}
            </motion.span>
          </AnimatePresence>
          <span> MOBEURS</span>
        </div>
      </div>

      {/* ── FAB Stack (Right) ── */}
      <div style={{ position: 'absolute', right: 16, top: 'calc(env(safe-area-inset-top,0px) + 68px)', display: 'flex', flexDirection: 'column', gap: 8, zIndex: 10 }}>
        {(
          [
            { icon: <Ic.Layers s={18} />, action: () => {
              setIsGlobalLoading(true);
              setIsSatellite(v => !v);
              setTimeout(() => setIsGlobalLoading(false), 800);
            }, active: isSatellite, loading: false },
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
        {!selected && !selectedPoi && !activeItinerary && !searchOpen && (
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
            {/* Recherche (tap) + Heatmap (swipe ≥ 60 px) */}
            {(() => {
              const dragMag = Math.abs(bubbleDragX);
              const willToggleHeat = dragMag > SWIPE_HEAT_THRESHOLD;
              const dragProgress = Math.min(dragMag / SWIPE_HEAT_THRESHOLD, 1);
              const isDragging = dragMag > 2;
              const label = willToggleHeat
                ? (heatMode ? 'Relâche pour désactiver' : 'Relâche pour la heatmap')
                : isDragging
                  ? (heatMode ? 'Continue pour désactiver' : 'Continue → heatmap')
                  : (heatMode ? 'Heatmap active' : 'Recherche');
              return (
                <motion.button
                  drag="x"
                  dragConstraints={{ left: 0, right: 0 }}
                  dragElastic={0.5}
                  onDrag={(_, info) => setBubbleDragX(info.offset.x)}
                  onDragEnd={(_, info) => {
                    setBubbleDragX(0);
                    if (Math.abs(info.offset.x) > SWIPE_HEAT_THRESHOLD) {
                      setHeatMode(!heatMode);
                    }
                  }}
                  onClick={openSearch}
                  className="press"
                  aria-label={heatMode ? 'Recherche (heatmap active, swipe pour désactiver)' : 'Recherche (swipe pour activer la heatmap)'}
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
                    boxShadow: willToggleHeat
                      ? '0 10px 24px rgba(242,108,26,0.45)'
                      : heatMode
                        ? '0 8px 20px rgba(242,108,26,0.3)'
                        : '0 4px 12px rgba(0,0,0,0.08)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 8,
                    cursor: 'pointer',
                    transition: isDragging ? 'none' : 'background 0.3s, box-shadow 0.3s',
                    position: 'relative',
                    transform: heatMode ? 'scale(1.05)' : 'scale(1)',
                    overflow: 'hidden',
                  }}
                >
                  {/* Trail de progression remplissant la pilule pendant le drag */}
                  {isDragging && (
                    <span
                      aria-hidden
                      style={{
                        position: 'absolute',
                        inset: 0,
                        background: willToggleHeat ? 'var(--orange)' : 'rgba(242,108,26,0.18)',
                        transformOrigin: bubbleDragX < 0 ? 'right' : 'left',
                        transform: `scaleX(${dragProgress})`,
                        transition: 'background 0.15s',
                        pointerEvents: 'none',
                      }}
                    />
                  )}
                  <Ic.Search s={16} />
                  <span style={{ fontSize: 13, fontWeight: 800, position: 'relative', zIndex: 1 }}>{label}</span>
                  <div aria-hidden style={{ display: 'flex', gap: 4, marginLeft: 4, position: 'relative', zIndex: 1 }}>
                    <div style={{ width: 4, height: 4, borderRadius: '50%', background: 'currentColor', opacity: 0.8 }} />
                    <div style={{ width: 4, height: 4, borderRadius: '50%', background: 'currentColor', opacity: 0.3 }} />
                  </div>
                </motion.button>
              );
            })()}
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── FLOATING INFO POD (ANTIGRAVITY STACK STYLE) ── */}
      <AnimatePresence>
        {(selected || selectedPoi || activeItinerary || isDiscoveryMode) && (
          <motion.div
            initial={{ y: 100, opacity: 0, scale: 0.95 }}
            animate={{ y: 0, opacity: 1, scale: 1 }}
            exit={{ y: 100, opacity: 0, scale: 0.95 }}
            style={{ 
              position: 'absolute', 
              bottom: 'calc(env(safe-area-inset-bottom, 0px) + 96px)',
              left: 12, 
              right: 12, 
              zIndex: 8000, 
              height: heightMV,
              background: 'rgba(255, 255, 255, 0.85)',
              backdropFilter: 'blur(40px) saturate(200%)',
              WebkitBackdropFilter: 'blur(40px) saturate(200%)',
              borderRadius: 32,
              border: '1px solid rgba(255,255,255,0.6)',
              boxShadow: '0 20px 60px rgba(0,0,0,0.18), inset 0 0 0 1px rgba(255,255,255,0.5)',
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
                padding: '10px 0 14px', 
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
              <div style={{ width: 40, height: 5, borderRadius: 2.5, background: 'var(--ink)', opacity: 0.15, marginBottom: 8 }} />
              {(selectedPoi || selected || activeItinerary || isDiscoveryMode) && (
                <div 
                  onPointerDown={(e) => e.stopPropagation()}
                  style={{ padding: '0 24px', width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}
                >
                   <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                      <div style={{ width: 44, height: 44, borderRadius: 14, background: 'var(--cream)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20, boxShadow: '0 4px 12px rgba(0,0,0,0.04)' }}>
                         {isDiscoveryMode ? '🧭' : selectedPoi ? (selectedPoi.logo_emoji || '📍') : activeItinerary ? '🗺️' : '🚌'}
                      </div>
                      <div>
                        <button 
                          onClick={() => {
                            if (selectedPoi) {
                              setIsGlobalLoading(true);
                              const isOSM = selectedPoi.source === 'osm' || 
                                            selectedPoi.id.toString().startsWith('osm-');
                              const url = isOSM
                                ? `/app/place/${selectedPoi.id}?lat=${selectedPoi.lat}&lon=${selectedPoi.lon}&name=${encodeURIComponent(selectedPoi.name)}&emoji=${encodeURIComponent(selectedPoi.logo_emoji || '📍')}`
                                : `/app/place/${selectedPoi.place_id || selectedPoi.id.toString().replace('sp-', '')}`;
                              router.push(url);
                            } else if (selected) {
                              const safeId = encodeURIComponent(selected.stop_id);
                              router.push(`/app/arret/${safeId}`);
                            }
                          }}
                          style={{ background: 'none', border: 'none', padding: 0, textAlign: 'left', cursor: 'pointer' }}
                        >
                          <h2 style={{ fontSize: 16, fontWeight: 900, color: 'var(--ink)', margin: 0, lineHeight: 1.1, display: 'flex', alignItems: 'center', gap: 6 }}>
                            {isDiscoveryMode ? 'Découvre Abidjan' : selectedPoi ? selectedPoi.name : activeItinerary ? 'Ton trajet' : selected?.stop_name}
                            {selectedPoi && poiSocialStats && poiSocialStats.checkins > 0 && (
                              <span style={{ fontSize: 10, color: 'var(--orange)', background: 'var(--orange-pale)', padding: '2px 6px', borderRadius: 6, fontWeight: 900 }}>🔥 {poiSocialStats.checkins}</span>
                            )}
                          </h2>
                          <div style={{ fontSize: 9, fontWeight: 800, color: 'var(--orange)', textTransform: 'uppercase', letterSpacing: 1, marginTop: 2 }}>
                            {isDiscoveryMode ? 'Sélection aléatoire' : selectedPoi ? (selectedPoi.commune || 'Abidjan') : activeItinerary ? 'Itinéraire optimisé' : (selected?.commune || 'Abidjan')}
                          </div>
                        </button>
                      </div>
                   </div>
                    <button 
                      onPointerDown={(e) => e.stopPropagation()}
                      onClick={(e) => { 
                        e.stopPropagation();
                        setIsDiscoveryMode(false);
                        setDiscoveryPois([]);
                        setSelectedPoi(null); 
                        setSelected(null); 
                        if (typeof setActiveItinerary === 'function') setActiveItinerary(null);
                        setSheet('mini');
                      }} 
                      style={{ 
                        width: 36, 
                        height: 36, 
                        borderRadius: 12, 
                        border: 'none', 
                        background: 'rgba(0,0,0,0.06)', 
                        color: 'var(--ink)', 
                        display: 'flex', 
                        alignItems: 'center', 
                        justifyContent: 'center', 
                        cursor: 'pointer',
                        zIndex: 10
                      }}
                    >
                      <Ic.X s={18} />
                    </button>
                </div>
              )}
            </div>

            <div className="no-scrollbar" style={{ flex: 1, overflowY: 'auto', padding: '0 24px 120px' }}>
              {isDiscoveryMode ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                  <p style={{ fontSize: 13, color: 'var(--muted)', fontWeight: 600, marginBottom: 8 }}>Voici quelques pépites à découvrir aujourd'hui :</p>
                  {discoveryPois.map((p, i) => (
                    <button
                      key={p.id + i}
                      onClick={() => {
                        handlePoiClick(p);
                        setIsDiscoveryMode(false);
                      }}
                      className="press"
                      style={{
                        display: 'flex', alignItems: 'center', gap: 14,
                        padding: '14px', background: 'rgba(255,255,255,0.5)',
                        borderRadius: 20, border: '1px solid rgba(0,0,0,0.03)',
                        textAlign: 'left', cursor: 'pointer'
                      }}
                    >
                      <div style={{ width: 40, height: 40, borderRadius: 12, background: 'var(--cream)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20 }}>
                        {p.logo_emoji || '📍'}
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: 14, fontWeight: 800, color: 'var(--ink)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {p.name}
                        </div>
                        <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--muted)' }}>
                          {p.commune || 'Abidjan'} • {p.category}
                        </div>
                      </div>
                      {(p.is_sponsored || p.sponsor_tier) && (
                        <div style={{ padding: '4px 8px', background: 'var(--orange-pale)', color: 'var(--orange)', borderRadius: 8, fontSize: 9, fontWeight: 900 }}>PRO</div>
                      )}
                    </button>
                  ))}
                  <button
                    onClick={handleDiscover}
                    style={{
                      marginTop: 12, padding: '16px', borderRadius: 20, border: '2px dashed var(--line)',
                      background: 'transparent', color: 'var(--ink)', fontWeight: 800, fontSize: 13,
                      cursor: 'pointer'
                    }}
                  >
                    Mélanger à nouveau 🔄
                  </button>
                </div>
              ) : selectedPoi ? (
                <div style={{ paddingBottom: 40 }}>
                  <div style={{ marginBottom: 16, padding: '0 4px' }}>
                    <div style={{ fontSize: 11, fontWeight: 800, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: 1.2, marginBottom: 4 }}>
                      {selectedPoi.subcategory || selectedPoi.category || 'Lieu'}
                    </div>
                    <h1 className="font-display" style={{ fontSize: 28, margin: '8px 0', fontWeight: 900, color: 'var(--ink)', lineHeight: 1.1 }}>
                      {selectedPoi.name}
                    </h1>
                    {poiSocialStats && (poiSocialStats.checkins > 0 || poiSocialStats.advice > 0) && (
                      <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
                        {poiSocialStats.checkins > 0 && (
                          <div style={{ fontSize: 10, fontWeight: 900, color: 'var(--orange)', display: 'flex', alignItems: 'center', gap: 4, background: 'var(--orange-pale)', padding: '6px 12px', borderRadius: 12 }}>
                            🔥 {poiSocialStats.checkins} BABIS SONT PASSÉS PAR ICI
                          </div>
                        )}
                        {poiSocialStats.advice > 0 && (
                          <div style={{ fontSize: 10, fontWeight: 900, color: 'var(--blue)', display: 'flex', alignItems: 'center', gap: 4, background: 'var(--blue-pale)', padding: '6px 12px', borderRadius: 12 }}>
                            💬 {poiSocialStats.advice} AVIS COMMUNAUTÉ
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                  <>
                    <button
                      onClick={() => {
                        setIsGlobalLoading(true);
                        const isOSM = selectedPoi.source === 'osm' || 
                                      selectedPoi.id.toString().startsWith('osm-') || 
                                      selectedPoi.id.toString().startsWith('nominatim-');
                        const url = isOSM
                          ? `/app/place/${selectedPoi.id}?lat=${selectedPoi.lat}&lon=${selectedPoi.lon}&name=${encodeURIComponent(selectedPoi.name)}&emoji=${encodeURIComponent(selectedPoi.logo_emoji || '📍')}`
                          : `/app/place/${selectedPoi.place_id || selectedPoi.id.toString().replace('sp-', '')}`;
                        router.push(url);
                      }}
                      style={{
                        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10,
                        height: 52, background: 'var(--orange)', color: '#fff',
                        width: '100%', border: 'none',
                        fontWeight: 900, borderRadius: 18, fontSize: 13,
                        textTransform: 'uppercase', letterSpacing: 1.2,
                        boxShadow: '0 12px 30px rgba(242,108,26,0.25)',
                        marginBottom: 12, cursor: 'pointer'
                      }}
                      className="press"
                    >
                      Voir le profil complet <Ic.Arrow s={18} />
                    </button>

                    <div style={{ display: 'flex', gap: 10, marginBottom: 24 }}>
                      <div style={{ flex: 1 }}>
                        <PoiCheckInButton
                          placeId={selectedPoi.place_id || selectedPoi.id}
                          placeName={selectedPoi.name}
                          commune={selectedPoi.commune}
                          lat={selectedPoi.lat}
                          lon={selectedPoi.lon}
                          sponsorTier={selectedPoi.sponsor_tier as any}
                        />
                      </div>
                      {isDiscoveryMode && (
                        <button
                          onClick={handleNextDiscovery}
                          className="press"
                          style={{
                            width: 52, height: 52, background: 'var(--cream)', color: 'var(--ink)',
                            borderRadius: 24, border: '1.5px solid var(--line)', cursor: 'pointer',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            boxShadow: '0 4px 12px rgba(0,0,0,0.05)'
                          }}
                        >
                          <Ic.Arrow s={20} />
                        </button>
                      )}
                    </div>

                    {/* Transports à proximité du lieu */}
                    {nearbyStopsToPoi.length > 0 && (
                      <div style={{ background: 'rgba(0,0,0,0.03)', borderRadius: 20, padding: 16, marginBottom: 24 }}>
                        <div style={{ fontSize: 10, fontWeight: 900, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 12 }}>Transports à proximité</div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                          {nearbyStopsToPoi.map((st, idx) => (
                            <button
                              key={idx}
                              onClick={() => handleSelectStop(st)}
                              style={{ display: 'flex', alignItems: 'center', gap: 10, background: 'none', border: 'none', padding: 0, width: '100%', textAlign: 'left', cursor: 'pointer' }}
                            >
                              <div style={{ width: 32, height: 32, borderRadius: 10, background: 'var(--cream)', border: '1px solid var(--line)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14 }}>🚌</div>
                              <div style={{ flex: 1 }}>
                                <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--ink)' }}>{st.stop_name}</div>
                                <div style={{ fontSize: 10, color: 'var(--muted)' }}>À environ {Math.round(st.distance)}m</div>
                              </div>
                              <Ic.Arrow s={14} color="var(--line)" />
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                  </>

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

                  {/* Avis Réels de la communauté */}
                  <div style={{ padding: '0 4px' }}>
                    <div style={{ fontSize: 9, fontWeight: 900, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: 1.5, marginBottom: 16 }}>COMMUNAUTÉ</div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                     {loadingReviews ? (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                          {[1, 2].map(i => (
                            <div key={i} style={{ padding: '16px', borderRadius: 24, border: '1px solid rgba(0,0,0,0.03)', background: 'white' }}>
                              <div style={{ display: 'flex', gap: 12, marginBottom: 12 }}>
                                <Skeleton width="36px" height="36px" radius="12px" />
                                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 6 }}>
                                  <Skeleton width="40%" height="12px" />
                                  <Skeleton width="20%" height="10px" />
                                </div>
                              </div>
                              <Skeleton width="90%" height="14px" />
                              <div style={{ height: 6 }} />
                              <Skeleton width="70%" height="14px" />
                            </div>
                          ))}
                        </div>
                       ) : placeReviews.length > 0 ? (
                         placeReviews.map((rev, i) => (
                          <div key={rev.id || i} style={{ 
                            background: 'rgba(255,255,255,0.45)', 
                            padding: '16px', 
                            borderRadius: 24,
                            border: '1px solid rgba(0,0,0,0.03)',
                            boxShadow: '0 4px 12px rgba(0,0,0,0.03)'
                          }}>
                            <div style={{ display: 'flex', gap: 12 }}>
                              <div style={{ width: 36, height: 36, borderRadius: 12, background: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, boxShadow: '0 2px 6px rgba(0,0,0,0.05)' }}>
                                {rev.profile?.avatar_emoji || '🧭'}
                              </div>
                              <div style={{ flex: 1 }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                                  <span style={{ fontSize: 13, fontWeight: 800, color: 'var(--ink)' }}>{rev.profile?.display_name || 'Explorateur'}</span>
                                  <div style={{ display: 'flex', gap: 1 }}>
                                    {[...Array(5)].map((_, idx) => (
                                      <span key={idx} style={{ fontSize: 10, filter: idx < (rev.rating || 5) ? 'grayscale(0)' : 'grayscale(1)', opacity: idx < (rev.rating || 5) ? 1 : 0.2 }}>⭐</span>
                                    ))}
                                  </div>
                                </div>
                                <p style={{ fontSize: 13, color: 'var(--ink-2)', margin: 0, lineHeight: 1.5 }}>{rev.content}</p>
                              </div>
                            </div>
                          </div>
                        ))
                       ) : (
                        <div style={{ background: 'rgba(0,0,0,0.02)', padding: '24px', borderRadius: 24, textAlign: 'center', border: '1px dashed rgba(0,0,0,0.1)' }}>
                          <div style={{ fontSize: 24, marginBottom: 8 }}>✨</div>
                          <h2 className="font-display" style={{ fontSize: 24, margin: 0, fontWeight: 900, color: 'var(--ink)', lineHeight: 1.1 }}>{selectedPoi.name}</h2>
                      
                          {poiSocialStats && (poiSocialStats.checkins > 0 || poiSocialStats.advice > 0) && (
                            <div style={{ display: 'flex', gap: 12, marginTop: 8 }}>
                              {poiSocialStats.checkins > 0 && (
                                <div style={{ fontSize: 10, fontWeight: 900, color: 'var(--orange)', display: 'flex', alignItems: 'center', gap: 4, background: 'var(--orange-pale)', padding: '4px 10px', borderRadius: 8 }}>
                                  🔥 {poiSocialStats.checkins} PASSAGES RÉCENTS
                                </div>
                              )}
                              {poiSocialStats.advice > 0 && (
                                <div style={{ fontSize: 10, fontWeight: 900, color: 'var(--blue)', display: 'flex', alignItems: 'center', gap: 4, background: 'var(--blue-pale)', padding: '4px 10px', borderRadius: 8 }}>
                                  💬 {poiSocialStats.advice} AVIS
                                </div>
                              )}
                            </div>
                          )}
                      
                          <div style={{ marginTop: 8, opacity: 0.6 }}>
                            <div style={{ fontSize: 13, fontWeight: 800, color: 'var(--ink)' }}>Aucun avis pour l'instant</div>
                            <p style={{ fontSize: 12, color: 'var(--muted)', marginTop: 4, lineHeight: 1.4 }}>Soyez le premier à partager votre expérience sur ce lieu !</p>
                          </div>
                        </div>
                       )}
                    </div>
                  </div>
                </div>

              ) : activeItinerary ? (
                <div style={{ paddingTop: 8 }}>
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
            role="dialog"
            aria-modal="true"
            aria-label="Recherche"
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
                  type="search"
                  inputMode="search"
                  enterKeyHint="search"
                  autoComplete="off"
                  autoCorrect="off"
                  autoCapitalize="off"
                  spellCheck={false}
                  aria-label="Champ de recherche"
                  style={{
                    flex: 1, fontSize: 15, fontWeight: 600,
                    border: 'none', outline: 'none', background: 'transparent',
                    color: 'var(--ink)',
                  }}
                />
                {isSearching ? (
                  <div
                    className="animate-spin"
                    aria-label="Recherche en cours"
                    role="status"
                    style={{
                      width: 16, height: 16,
                      border: '2px solid var(--orange)',
                      borderTopColor: 'transparent',
                      borderRadius: '50%',
                    }}
                  />
                ) : query.length > 0 ? (
                  <button
                    type="button"
                    onClick={() => setQuery('')}
                    aria-label="Effacer la recherche"
                    className="press"
                    style={{
                      width: 22, height: 22, borderRadius: 11, border: 'none',
                      background: 'var(--ink-2)', color: '#fff',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      cursor: 'pointer', fontSize: 14, lineHeight: 1, padding: 0,
                      flexShrink: 0,
                    }}
                  >×</button>
                ) : null}
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
                            const fullId = (item.source === 'osm' && !item.id.toString().startsWith('osm-')) 
                              ? `osm-${item.id}` 
                              : item.id;
                            
                            // Flux Aperçu pour les récents aussi
                            if (item.lat && item.lon) {
                              setPinnedSearch({ 
                                id: fullId, name: item.name, 
                                lat: item.lat, lon: item.lon, 
                                emoji: item.logo || '📍',
                                source: (item.source as 'supabase' | 'osm') || 'supabase'
                              });
                              setSelectedPoi({
                                id: fullId, 
                                place_id: item.source === 'supabase' ? item.id : undefined,
                                name: item.name,
                                lat: item.lat, lon: item.lon,
                                category: (item as any).category || 'other',
                                logo_emoji: item.logo || '📍',
                                cover_color: (item as any).cover_color || 'var(--orange)',
                                is_sponsored: (item as any).is_sponsored || false,
                                sponsor_tier: (item as any).sponsor_tier || null,
                                has_campaign: (item as any).has_campaign || false,
                                commune: item.commune || undefined,
                                source: (item.source as 'supabase' | 'osm') || 'supabase'
                              });
                              setSheet('half');
                            }
                          } else if (item.type === 'line') {
                            router.push(`/app/ligne/${encodeURIComponent(item.id)}`);
                          } else {
                            router.push(`/app/arret/${encodeURIComponent(item.id)}`);
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
                    {results.map((r) => {
                      const isOSM = r.source === 'osm-map' || r.source === 'osm-nominatim';
                      const badgeLabel = isOSM ? 'OSM' : (r.type === 'place' ? 'Lieu' : 'Arrêt');
                      const badgeColor = isOSM
                        ? 'var(--ink-2)'
                        : (r.type === 'place' ? 'var(--orange)' : 'var(--ink-2)');
                      return (
                        <button
                          key={`${r.source}-${r.id}`}
                          onClick={() => {
                            closeSearch();
                            
                            // NAVIGATION UNIFIÉE -> APERÇU SUR CARTE
                            const fullId = isOSM ? `osm-${r.id}` : r.id;
                            
                            if (isOSM || r.type === 'place') {
                              addToRecent({
                                id: fullId, name: r.name, type: 'place',
                                commune: r.commune ?? undefined,
                                lat: r.lat, lon: r.lon, logo: r.logo,
                                source: isOSM ? 'osm' : 'supabase'
                              });
                              
                              setPinnedSearch({ 
                                id: fullId, name: r.name, 
                                lat: r.lat, lon: r.lon, 
                                emoji: r.logo || '📍',
                                source: isOSM ? 'osm' : 'supabase'
                              });

                              setSelectedPoi({
                                id: fullId,
                                place_id: isOSM ? undefined : r.id,
                                name: r.name,
                                lat: r.lat, lon: r.lon,
                                category: r.type === 'place' ? 'shop' : 'other',
                                logo_emoji: r.logo || '📍',
                                cover_color: r.type === 'place' ? 'var(--orange)' : 'var(--ink-2)',
                                is_sponsored: false,
                                sponsor_tier: null,
                                has_campaign: false,
                                commune: r.commune || undefined,
                                source: isOSM ? 'osm' : 'supabase'
                              });
                              setSheet('half');

                            } else {
                              addToRecent({ id: r.id, name: r.name, type: 'stop', commune: r.commune ?? undefined, lat: r.lat, lon: r.lon });
                              router.push(`/app/arret/${encodeURIComponent(r.id)}`);
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
                            <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--muted)', marginTop: 2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                              {r.subtitle ?? r.commune ?? (r.type === 'place' ? 'Lieu' : 'Arrêt')}
                            </div>
                          </div>
                          <div style={{
                            fontSize: 9, fontWeight: 800, color: badgeColor,
                            textTransform: 'uppercase', letterSpacing: 0.6,
                          }}>
                            {badgeLabel}
                          </div>
                        </button>
                      );
                    })}
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
            const nextIdx = (nearbyIndex + 1) % nearbyStops.length;
            setNearbyIndex(nextIdx);
            handleSelectStop(nearbyStops[nextIdx]);
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
