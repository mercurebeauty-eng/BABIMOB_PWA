'use client';

import dynamic from 'next/dynamic';
import Image from 'next/image';
import { useState, useRef, useCallback, useEffect, Suspense } from 'react';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import type { Stop } from '@/lib/types';
import type { POI } from '@/lib/poi';
import { useRouter, useSearchParams } from 'next/navigation';
import { Ic } from '@/components/ui/Ic';
import Vehicle from '@/components/ui/Vehicle';
import { WaxStrip } from '@/components/ui/WaxStrip';
import { Pill } from '@/components/ui/Pill';
import BroadcastButton from '@/components/BroadcastButton';
import PoiFavoriteButton from '@/components/PoiFavoriteButton';
import PoiCheckInButton from '@/components/PoiCheckInButton';
import { motion, useAnimation, PanInfo, AnimatePresence } from 'framer-motion';
import { useReachTracking } from '@/hooks/useReachTracking';
import { useGeoLocation } from '@/hooks/useGeoLocation';
import { useStopSearch } from '@/hooks/useStopSearch';
import { useCommunityData } from '@/hooks/useCommunityData';
import { useMapPois } from '@/hooks/useMapPois';

function formatDistance(m: number) {
  if (m < 1000) return `${Math.round(m)}m`;
  return `${(m/1000).toFixed(1)}km`;
}



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
  const searchParams = useSearchParams();
  const supabase = createClient();

  const [searchOpen, setSearchOpen] = useState(false);
  const [selected, setSelected] = useState<Stop | null>(null);
  const [sheet, setSheet] = useState<'peek' | 'half' | 'full'>('peek');
  const [activeItinerary, setActiveItinerary] = useState<any | null>(null);
  const controls = useAnimation();
  const [selectedPoi, setSelectedPoi] = useState<POI | null>(null);
  const [hotspots, setHotspots] = useState<any[]>([]);

  const [heatMode, setHeatMode] = useState(false);
  const [sheetExpanded, setSheetExpanded] = useState(false);
  const [poiNearestStop, setPoiNearestStop] = useState<any>(null);

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

  useEffect(() => {
    if (heatMode && hotspots.length === 0) {
      import('@/lib/activity').then(mod => mod.fetchActivityHotspots()).then(data => {
        setHotspots(data.map(h => ({ lat: h.lat, lon: h.lon, intensity: h.count })));
      });
    }
  }, [heatMode, hotspots.length]);

  // Parse Itinerary from URL
  useEffect(() => {
    const itiParam = searchParams.get('iti');
    if (itiParam) {
      try { setActiveItinerary(JSON.parse(decodeURIComponent(itiParam))); } catch { /* noop */ }
    }
  }, [searchParams]);

  const sheetH = sheet === 'full' ? 620 : sheet === 'half' ? 440 : 240;

  const cycleSheet = useCallback(() => {
    setSheet(current => {
      if (current === 'peek') return 'half';
      if (current === 'half') return 'full';
      return 'peek';
    });
  }, []);

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
    setNearbyStops([]);
    setSheet('peek');
  }, [setNearbyStops]);

  const openSearch = () => setSearchOpen(true);
  const closeSearch = () => { setSearchOpen(false); clearSearch(); };

  const TICKER = [
    ['Cocody', 'fluide', 'var(--green)'],
    ['Yop → Plateau', '15 min', 'var(--green)'],
    ['Pont HKB', 'embouteillé', 'var(--orange-deep)'],
    ['Adjamé Liberté', 'Gbaka 200F', 'var(--ink)'],
    ['Riviera 2', 'fluide', 'var(--green)'],
    ['Cocody', 'fluide', 'var(--green)'],
  ];

  const RECENT = [
    { from: 'Cocody Saint-Jean', to: 'Plateau', tarif: '300F' },
    { from: 'Adjamé Liberté', to: 'Yopougon Selmer', tarif: '200F' },
    { from: 'Riviera 2', to: 'Marcory Zone 4', tarif: '500F' },
  ];

  const TRANSPORT_DEMO = [
    { kind: 'gbaka' as const, line: 'Adjamé ↔ Yop', eta: '2 min', color: 'var(--orange)' },
    { kind: 'woro' as const, line: 'Cocody', eta: '4 min', color: 'var(--green)' },
    { kind: 'taxi' as const, line: 'Plateau', eta: 'sur place', color: 'var(--gold)' },
    { kind: 'saloni' as const, line: 'quartier', eta: '1 min', color: 'var(--blue)' },
  ];

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
        onStopClick={handleSelectStop}
        onPoiClick={(poi) => { setSelectedPoi(poi); setSelected(null); setSheet('half'); }}
        onMapReady={handleMapReady}
        userLocation={userLoc}
        legs={activeItinerary?.legs?.map((l: any) => ({ coords: l.coords ?? [], mode: l.mode, routeColor: l.route?.color })) || null}
        hotspots={hotspots}
        explorers={explorers}
        pois={pois}
        poiCheckins={poiCheckins}
        livePois={livePois}
        broadcasts={broadcasts}
      />

      {/* ── Live Ticker (Top Over Map) ── */}
      {liveTickerFeed.length > 0 && (
        <div className="absolute top-[env(safe-area-inset-top,0px)] left-0 right-0 z-[300] pointer-events-none">
          <div className="bg-gradient-to-b from-black/20 to-transparent pt-2 pb-8 px-4 overflow-hidden">
            <div className="flex gap-4 animate-marquee-slow">
              {liveTickerFeed.map((checkin, i) => (
                <div key={i} className="flex-shrink-0 flex items-center gap-2 bg-white/10 backdrop-blur-md px-3 py-1.5 rounded-full border border-white/20 shadow-sm">
                  <span className="text-sm">{(checkin.profile as any)?.avatar_emoji || '👤'}</span>
                  <span className="text-[10px] font-black uppercase tracking-widest text-white">
                    {checkin.display_name} est à <span className="text-abidjan-orange">{checkin.place_name}</span>
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ── Top Floating Bar (Header) ── */}
      <div className="absolute top-[calc(env(safe-area-inset-top,0px)+12px)] left-4 right-4 z-[500] flex gap-2.5">
        <button
          onClick={() => {}} // TODO: Menu
          className="w-11 h-11 flex items-center justify-center bg-white/90 backdrop-blur-2xl rounded-xl shadow-lg border border-beige-200/50 text-ink active:scale-95 transition-all"
        >
          <Ic.Menu s={22} />
        </button>
        
        <button
          onClick={openSearch}
          className="flex-1 h-11 flex items-center gap-3 bg-white/90 backdrop-blur-2xl rounded-xl shadow-lg border border-beige-200/50 px-4 text-left active:scale-[0.98] transition-all"
        >
          <Ic.Search s={18} color="var(--muted)" />
          <span className="text-sm font-semibold text-muted flex-1 truncate">
            {selected ? selected.stop_name : "Où vas-tu, Babi ?"}
          </span>
          <span className="text-[9px] font-black text-abidjan-orange bg-abidjan-orange/10 px-1.5 py-0.5 rounded-md tracking-widest">IA</span>
        </button>

        <Link
          href="/app/compte"
          className="w-11 h-11 flex items-center justify-center bg-abidjan-orange rounded-xl shadow-lg shadow-abidjan-orange/30 text-white font-black text-sm active:scale-95 transition-all"
        >
          {profile?.display_name?.slice(0, 2).toUpperCase() || 'MK'}
        </Link>
      </div>

      {/* ── Floating Action Stack (Right) ── */}
      <div className="absolute top-[calc(env(safe-area-inset-top,0px)+72px)] right-4 z-[500] flex flex-col gap-2">
        {[
          { icon: <Ic.Layers s={20} />, action: () => {}, label: 'Couches' },
          { icon: <Ic.Locate s={20} />, action: locateMe, label: 'Moi', active: !!userLoc, loading: geoLoading },
          { icon: <Ic.Compass s={20} />, action: () => router.push('/app/boussole'), label: 'Boussole' },
        ].map((btn, i) => (
          <button
            key={i}
            onClick={btn.action}
            disabled={btn.loading}
            className={`w-11 h-11 flex items-center justify-center rounded-xl shadow-lg border transition-all active:scale-90 ${
              btn.active 
                ? 'bg-abidjan-blue text-white border-abidjan-blue' 
                : 'bg-white/90 text-ink border-beige-200/50 backdrop-blur-2xl'
            }`}
          >
            {btn.loading ? <div className="w-4 h-4 border-2 border-current/30 border-t-current rounded-full animate-spin" /> : btn.icon}
          </button>
        ))}
      </div>

      {/* ── Live Ticker ── */}
      <div className="absolute top-[calc(env(safe-area-inset-top,0px)+68px)] left-0 right-0 z-[400] pointer-events-none">
        <div className="flex overflow-hidden [mask-image:linear-gradient(90deg,transparent,black_15%,black_85%,transparent)]">
          <div className="ticker flex gap-12 py-2 text-abidjan-orange text-[13px] font-black whitespace-nowrap">
            <span>PLATEAU : Trafic fluide sur le pont Houphouët</span>
            <span>COCODY : Gbaka en panne carrefour la vie</span>
            <span>YOP : 15 min d'attente à la gare Siporex</span>
            <span>ADJAMÉ : Forte affluence à Liberté</span>
            {/* Repeat for seamless loop */}
            <span>PLATEAU : Trafic fluide sur le pont Houphouët</span>
            <span>COCODY : Gbaka en panne carrefour la vie</span>
            <span>YOP : 15 min d'attente à la gare Siporex</span>
            <span>ADJAMÉ : Forte affluence à Liberté</span>
          </div>
        </div>
      </div>

      {/* ── Broadcast FAB ── */}
      {profile && sheet === 'peek' && (
        <div className="absolute bottom-64 right-5 z-[450] animate-in fade-in zoom-in duration-300">
          <BroadcastButton userId={profile.id} currentTier={profile.sub_tier ?? 'free'} isAdmin={profile.is_admin} />
        </div>
      )}

      {/* ── Modular Bottom Sheet ── */}
      <motion.div
        drag="y"
        dragConstraints={{ top: 0, bottom: 0 }}
        dragElastic={0.1}
        onDragEnd={(e, info) => {
          if (info.offset.y > 50 || info.velocity.y > 200) {
            if (sheet === 'full') setSheet('half');
            else if (sheet === 'half') setSheet('peek');
          } else if (info.offset.y < -50 || info.velocity.y < -200) {
            if (sheet === 'peek') setSheet('half');
            else if (sheet === 'half') setSheet('full');
          }
        }}
        animate={{ height: sheetH }}
        transition={{ type: 'spring', damping: 30, stiffness: 300, mass: 0.8 }}
        className="absolute bottom-0 left-0 right-0 z-[600] bg-white rounded-t-[2.5rem] shadow-[0_-10px_40px_rgba(0,0,0,0.1)] border-t border-beige-100 flex flex-col overflow-hidden"
      >
        {/* 1-Click Height Selectors */}
        <div className="flex flex-col items-center pt-3 pb-2">
          <div className="flex gap-1.5 p-1 bg-beige-50/50 rounded-full mb-3">
            {[
              { id: 'peek', label: 'Bas', h: 240 },
              { id: 'half', label: 'Milieu', h: 440 },
              { id: 'full', label: 'Plein', h: 620 }
            ].map(lvl => (
              <button
                key={lvl.id}
                onClick={() => setSheet(lvl.id as any)}
                className={`px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest transition-all ${
                  sheet === lvl.id ? 'bg-abidjan-orange text-white shadow-md' : 'text-beige-muted hover:text-beige-text'
                }`}
              >
                {lvl.label}
              </button>
            ))}
          </div>
          <div onClick={cycleSheet} className="w-12 h-1.5 bg-beige-200/60 rounded-full cursor-pointer active:scale-x-125 transition-transform" />
        </div>

        {/* Scrollable Area */}
        <div className="flex-1 overflow-y-auto px-6 pb-20 overscroll-contain scrollbar-hide">
          {selectedPoi ? (
            /* POI PREVIEW */
            <div className="animate-in fade-in slide-in-from-bottom-4 duration-300">
              <div className="flex items-start justify-between gap-4 mb-6">
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 rounded-2xl flex items-center justify-center text-2xl bg-beige-50 border border-beige-100 shadow-sm">
                    {selectedPoi.logo_emoji || '📍'}
                  </div>
                  <div>
                    <h2 className="text-lg font-black text-beige-text leading-tight">{selectedPoi.name}</h2>
                    <div className="text-[10px] text-beige-muted font-bold uppercase tracking-widest mt-1">{selectedPoi.commune || 'Abidjan'}</div>
                  </div>
                </div>
                <button onClick={() => setSelectedPoi(null)} className="p-2 bg-beige-50 rounded-xl text-beige-200">
                  <Ic.X s={20} />
                </button>
              </div>

              <div className="grid grid-cols-2 gap-3 mb-6">
                <PoiCheckInButton placeId={selectedPoi.id} placeName={selectedPoi.name} commune={selectedPoi.commune} lat={selectedPoi.lat} lon={selectedPoi.lon} />
                <button onClick={() => handleGetDirections(selectedPoi)} className="bg-abidjan-orange text-white font-black py-4 rounded-2xl text-xs uppercase tracking-widest shadow-lg shadow-abidjan-orange/20">🚀 S'y rendre</button>
              </div>

              {selectedPoi.description && <p className="text-sm text-beige-muted font-medium leading-relaxed mb-6">{selectedPoi.description}</p>}

              <Link href={`/app/place/${selectedPoi.id}`} className="block text-center text-xs font-black text-abidjan-blue uppercase tracking-widest py-4 bg-abidjan-blue/5 rounded-2xl">Profil Complet →</Link>
            </div>
          ) : activeItinerary ? (
            /* ITINERARY STEPS */
            <div className="animate-in fade-in slide-in-from-bottom-4 duration-300">
              <div className="flex items-center justify-between mb-8">
                <h2 className="text-xl font-black text-beige-text">Ton trajet</h2>
                <button onClick={() => setActiveItinerary(null)} className="p-2 bg-beige-50 rounded-xl text-beige-200"><Ic.X s={20} /></button>
              </div>
              <div className="space-y-6 relative before:absolute before:left-[19px] before:top-4 before:bottom-4 before:w-1 before:bg-beige-100 before:rounded-full">
                {activeItinerary.legs.map((leg: any, idx: number) => (
                  <div key={idx} className="flex gap-6 relative z-10">
                    <div className="w-10 h-10 rounded-2xl bg-white border-2 border-beige-100 flex items-center justify-center text-xl shadow-sm">
                      {leg.mode === 'WALK' ? '🚶' : '🚐'}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-black text-beige-text">{leg.mode === 'WALK' ? 'Marcher' : `Ligne ${leg.route?.shortName || ''}`}</div>
                      <div className="text-xs font-bold text-beige-muted truncate">Vers {leg.to.name}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : selected ? (
            /* STOP DETAIL */
            <div className="animate-in fade-in slide-in-from-bottom-4 duration-300">
              <div className="flex items-start justify-between mb-8">
                <div>
                  <h2 className="text-xl font-black text-beige-text leading-tight">{selected.stop_name}</h2>
                  <div className="text-xs text-beige-muted font-bold uppercase tracking-widest mt-1">{selected.commune}</div>
                </div>
                <button onClick={clearSelection} className="p-2 bg-beige-50 rounded-xl text-beige-200"><Ic.X s={20} /></button>
              </div>
              <button onClick={() => router.push(`/app/arret/${selected.stop_id}`)} className="w-full bg-abidjan-orange text-white font-black py-5 rounded-3xl shadow-xl shadow-abidjan-orange/20 text-sm uppercase tracking-widest">Voir les lignes</button>
            </div>
          ) : (
            /* DEFAULT LIST (NEARBY STOPS) */
            <div className="animate-in fade-in duration-500">
              {/* PRÈS DE TOI */}
              <div className="mb-6">
                <div className="flex items-center justify-between mb-4 px-1">
                  <div className="text-[11px] font-black text-muted tracking-widest uppercase">
                    {nearbyStops.length > 0 
                      ? `À ${formatDistance(nearbyStops[0].distance_m)} — ${nearbyStops[0].stop_name}` 
                      : 'PRÈS DE TOI'}
                  </div>
                  <div className="flex items-center gap-1.5 text-[10px] text-green font-black">
                    <div className="w-1.5 h-1.5 rounded-full bg-green shimmer" />
                    LIVE
                  </div>
                </div>

                <div className="no-scrollbar flex gap-3 overflow-x-auto -mx-6 px-6 pb-2">
                  {([
                    { kind: 'gbaka', line: 'G04', eta: '2 min', color: 'var(--orange)' },
                    { kind: 'woro', line: 'W12', eta: '5 min', color: 'var(--green)' },
                    { kind: 'taxi', line: 'Taxi', eta: '1 min', color: 'var(--blue)' },
                    { kind: 'saloni', line: 'Saloni', eta: '8 min', color: 'var(--gold)' },
                  ] as const).map((v, i) => (
                    <div key={i} className="flex-shrink-0 w-[130px] p-4 rounded-[22px] bg-beige-50 border border-beige-100 active:scale-95 transition-all">
                      <Vehicle kind={v.kind} size={28} />
                      <div className="mt-3 text-sm font-black text-ink truncate">{v.line}</div>
                      <div className="text-[11px] font-black mt-1" style={{ color: v.color }}>{v.eta}</div>
                    </div>
                  ))}
                </div>
              </div>

              {/* AI SEARCH CTA */}
              <button className="w-full relative overflow-hidden p-5 rounded-[24px] bg-abidjan-orange text-white active:scale-[0.98] transition-all group mb-6">
                <div className="wax-bg absolute inset-0 opacity-20 group-hover:opacity-30 transition-opacity" />
                <div className="relative flex items-center justify-center gap-3">
                  <Ic.Search s={20} color="#fff" />
                  <span className="text-sm font-black uppercase tracking-widest">Démarrer le trajet IA</span>
                </div>
              </button>

              {/* RÉCENTS */}
              <div className="mb-6">
                <div className="text-[10px] font-black text-muted tracking-widest uppercase mb-3 px-1">RÉCENTS</div>
                <div className="space-y-2">
                  {[
                    { name: 'Adjamé Liberté', sub: 'Gbaka · 200F' },
                    { name: 'Cocody Saint-Jean', sub: 'Woro · 150F' },
                  ].map((r, i) => (
                    <div key={i} className="flex items-center gap-4 p-3 rounded-2xl bg-beige-50/50 border border-beige-100/50 active:bg-beige-50 transition-colors">
                      <div className="w-10 h-10 rounded-xl bg-white flex items-center justify-center text-muted">
                        <Ic.History s={18} />
                      </div>
                      <div className="flex-1">
                        <div className="text-sm font-bold text-ink">{r.name}</div>
                        <div className="text-[11px] text-muted font-semibold">{r.sub}</div>
                      </div>
                      <Ic.Arrow s={14} color="var(--line-strong)" />
                    </div>
                  ))}
                </div>
              </div>

              {/* COMMUNITY PULSE */}
              <div className="relative p-5 rounded-[28px] bg-abidjan-blue text-white overflow-hidden active:scale-[0.98] transition-all">
                <div className="wax-zigzag absolute inset-0 opacity-10" />
                <div className="relative">
                  <div className="flex items-center gap-2 mb-3">
                    <div className="flex -space-x-2">
                      {[1, 2, 3].map(i => (
                        <div key={i} className="w-6 h-6 rounded-full border-2 border-abidjan-blue bg-beige-200" />
                      ))}
                    </div>
                    <span className="text-[10px] font-black uppercase tracking-wider opacity-80">247k Babis en ligne</span>
                  </div>
                  <div className="font-display text-lg leading-tight">COCODY COULE.<br/>PLATEAU BOUCHONNE.</div>
                </div>
              </div>

            </div>
          )}
        </div>
      </motion.div>

      {/* ── Search Overlay ── */}
      <AnimatePresence>
        {searchOpen && (
          <motion.div initial={{ opacity: 0, y: 100 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 100 }} className="fixed inset-0 z-[1000] bg-beige-50 flex flex-col">
            <div className="bg-white px-5 pt-12 pb-6 border-b border-beige-200 flex items-center gap-4">
              <button onClick={closeSearch} className="p-2 text-beige-text"><Ic.Back s={24} /></button>
              <input autoFocus value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Chercher un lieu..." className="flex-1 text-lg font-black outline-none placeholder-beige-200 bg-transparent" />
              {isSearching && <div className="w-5 h-5 border-2 border-abidjan-orange border-t-transparent rounded-full animate-spin" />}
            </div>
            <div className="flex-1 overflow-y-auto p-5">
              {results.map((r, i) => (
                <button key={i} onClick={() => handleSelectStop(r)} className="w-full flex items-center gap-4 p-4 bg-white rounded-2xl border border-beige-100 mb-2 text-left">
                  <div className="w-10 h-10 rounded-xl bg-beige-50 flex items-center justify-center"><Ic.Pin s={18} /></div>
                  <div className="flex-1 min-w-0">
                    <div className="font-black text-sm text-beige-text truncate">{r.stop_name}</div>
                    <div className="text-[10px] text-beige-muted font-bold uppercase">{r.commune}</div>
                  </div>
                </button>
              ))}
              {!query && (
                <div className="space-y-4">
                  <div className="text-[10px] font-black uppercase tracking-widest text-beige-muted">Récents</div>
                  {RECENT.map((r, i) => (
                    <div key={i} className="bg-white p-4 rounded-2xl border border-beige-100 flex items-center gap-3">
                      <span className="text-lg">📍</span>
                      <div className="text-sm font-bold text-beige-text">{r.from} → {r.to}</div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <style>{`
        .animate-marquee-slow {
          display: flex;
          width: fit-content;
          animation: marquee 30s linear infinite;
        }
        @keyframes marquee {
          0% { transform: translateX(100vw); }
          100% { transform: translateX(-100%); }
        }
      `}</style>
    </div>
  );
}
