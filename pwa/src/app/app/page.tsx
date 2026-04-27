'use client';

import dynamic from 'next/dynamic';
import Image from 'next/image';
import { useState, useRef, useCallback, useEffect, Suspense } from 'react';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import type { Stop, ArretProche } from '@/lib/types';
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
  const searchTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const watchIdRef = useRef<number | null>(null);
  const reachLoggedRef = useRef<Set<string>>(new Set());

  const [searchOpen, setSearchOpen] = useState(false);
  const [profile, setProfile] = useState<any>(null);
  const [selected, setSelected] = useState<Stop | null>(null);
  const [sheet, setSheet] = useState<'peek' | 'half' | 'full'>('peek');
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [activeItinerary, setActiveItinerary] = useState<any | null>(null);
  const controls = useAnimation();
  const [selectedPoi, setSelectedPoi] = useState<POI | null>(null);
  const [hotspots, setHotspots] = useState<any[]>([]);

  const [explorers, setExplorers] = useState<any[]>([]);
  const [pois, setPois] = useState<POI[]>([]);
  const [poiCheckins, setPoiCheckins] = useState<Record<string, number>>({});
  const [broadcasts, setBroadcasts] = useState<any[]>([]);
  const [livePois, setLivePois] = useState<string[]>([]);
  const [liveTickerFeed, setLiveTickerFeed] = useState<any[]>([]);
  const [userLoc, setUserLoc] = useState<[number, number] | null>(null);
  const [nearbyStops, setNearbyStops] = useState<ArretProche[]>([]);
  const [geoLoading, setGeoLoading] = useState(false);
  const [geoError, setGeoError] = useState<string | null>(null);
  const [heatMode, setHeatMode] = useState(false);
  const [communityFeed, setCommunityFeed] = useState<any[]>([]);
  const [trendingPlaces, setTrendingPlaces] = useState<any[]>([]);
  const [sheetExpanded, setSheetExpanded] = useState(false);
  const [poiNearestStop, setPoiNearestStop] = useState<any>(null);
  const mapRef = useRef<any>(null);






  // Fire-and-forget reach impression — deduplicated per user+source per session
  const logReach = useCallback((userId: string, source: 'ticker' | 'map' | 'feed' | 'broadcast') => {
    const key = `${userId}:${source}`;
    if (reachLoggedRef.current.has(key)) return;
    reachLoggedRef.current.add(key);
    supabase.rpc('record_reach', { p_user_id: userId, p_source: source });
  }, [supabase]);

  const handleGetDirections = useCallback((poi: POI) => {
    router.push(`/app/itineraire?toStop=${encodeURIComponent(JSON.stringify({
      stop_name: poi.name,
      stop_lat: poi.lat,
      stop_lon: poi.lon,
    }))}`);
  }, [router]);

  const handleMapReady = useCallback((map: any) => {
    mapRef.current = map;
    const loadPois = async () => {
      const b = map.getBounds();
      const mod = await import('@/lib/poi');
      const fetchedPois = await mod.fetchNearbyPOIs(b.getSouth(), b.getNorth(), b.getWest(), b.getEast());
      setPois(fetchedPois);
      if (fetchedPois.length > 0) {
        const since7d = new Date(Date.now() - 7 * 86400000).toISOString();
        const { data } = await supabase
          .from('checkins').select('place_id')
          .in('place_id', fetchedPois.map(p => p.id))
          .gte('created_at', since7d);
        if (data) {
          const counts: Record<string, number> = {};
          data.forEach((c: any) => { counts[c.place_id] = (counts[c.place_id] ?? 0) + 1; });
          setPoiCheckins(counts);
        }
        const since3h = new Date(Date.now() - 3 * 3600000).toISOString();
        const { data: liveData } = await supabase
          .from('checkins').select('place_id, profile:profiles(id, display_name, is_public_visits)')
          .in('place_id', fetchedPois.map(p => p.id))
          .gte('created_at', since3h)
          .order('created_at', { ascending: false });


        if (liveData) {
          setLivePois(Array.from(new Set(liveData.map(d => d.place_id))));

          // Privacy Filter: Only show names if profile.is_public_visits is true
          const filteredTicker = liveData.map(d => ({
             ...d,
             display_name: (d.profile as any)?.is_public_visits ? (d.profile as any).display_name : "Un explorateur"
          })).slice(0, 5);

          setLiveTickerFeed(filteredTicker);
          // Track ticker impressions for each visible public user
          filteredTicker.forEach(d => {
            const uid = (d.profile as any)?.id;
            if (uid) logReach(uid, 'ticker');
          });
        }
      }
    };
    map.on('moveend', loadPois);
    loadPois();
  }, [supabase, logReach]);

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

  useEffect(() => {
    async function loadData() {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data } = await supabase.from('profiles').select('*').eq('id', user.id).single();
        setProfile(data);
      }

      // Fetch active broadcasts (last 4 hours) — includes lat/lon for map rendering
      const fourHoursAgo = new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString();
      const { data: bc } = await supabase
        .from('profiles')
        .select('id, display_name, avatar_emoji, last_broadcast_at, broadcast_text, broadcast_lat, broadcast_lon, sub_tier, is_public_visits')
        .not('last_broadcast_at', 'is', null)
        .gt('last_broadcast_at', fourHoursAgo);
      if (bc) {
        setBroadcasts(bc);
        // Derive Snap-style explorer markers from public broadcast users
        const publicExplorers = bc.filter((p: any) => p.is_public_visits && p.broadcast_lat && p.broadcast_lon);
        setExplorers(
          publicExplorers.map((p: any) => ({
            lat: p.broadcast_lat,
            lon: p.broadcast_lon,
            name: p.display_name ?? 'Explorateur',
            emoji: p.avatar_emoji ?? '🧭',
          }))
        );
        // Track map impressions for each visible public explorer
        publicExplorers.forEach((p: any) => logReach(p.id, 'map'));
        // Track broadcast impressions for users with an active broadcast
        bc.filter((p: any) => p.broadcast_text).forEach((p: any) => logReach(p.id, 'broadcast'));
      }

      // Fetch Global Community Activity (last 24h)
      const { data: globalFeed } = await supabase
        .from('checkins')
        .select(`
          id, place_id, place_name, created_at, points_earned,
          profile:profiles(id, display_name, avatar_emoji, is_verified_explorer, is_public_visits)
        `)
        .order('created_at', { ascending: false })
        .limit(10);
      if (globalFeed) {
        const publicFeed = globalFeed.filter((f: any) => f.profile?.is_public_visits);
        setCommunityFeed(publicFeed);
        // Track feed impressions for each visible user
        publicFeed.forEach((f: any) => {
          if (f.profile?.id) logReach(f.profile.id, 'feed');
        });
        // Calculate trending (most frequent place_id in the last 24h)
        const counts: Record<string, { count: number, name: string }> = {};
        globalFeed.forEach((f: any) => {
           if (!counts[f.place_id]) counts[f.place_id] = { count: 0, name: f.place_name };
           counts[f.place_id].count++;
        });
        const sorted = Object.entries(counts)
          .sort((a,b) => b[1].count - a[1].count)
          .slice(0, 3)
          .map(([id, val]) => ({ id, name: val.name, count: val.count }));
        setTrendingPlaces(sorted);
      }
    }
    loadData();
  }, [supabase, logReach]);
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

  const handleSearchChange = useCallback((q: string) => {
    setQuery(q);
    if (searchTimerRef.current) clearTimeout(searchTimerRef.current);
    if (q.trim().length < 2) { setResults([]); return; }
    searchTimerRef.current = setTimeout(async () => {
      setIsSearching(true);
      const words = q.trim().split(/\s+/).filter(w => w.length >= 2);
      let stopsQuery = supabase.from('gtfs_stops').select('stop_id, stop_name, stop_lat, stop_lon, commune');
      words.forEach(word => { stopsQuery = stopsQuery.or(`stop_name.ilike.%${word}%,commune.ilike.%${word}%`); });
      const { data: searchResults } = await stopsQuery.limit(12);
      setIsSearching(false);
      setResults((searchResults ?? []).map(s => ({ ...s, type: 'stop' })));
    }, 250);
  }, [supabase]);

  const handleSelectStop = useCallback((stop: Stop) => {
    setSelected(stop);
    setSheet('half');
    setSearchOpen(false);
    setQuery('');
    setResults([]);
  }, []);

  const clearSelection = useCallback(() => {
    setSelected(null);
    setNearbyStops([]);
    setSheet('peek');
  }, []);


  const handleLocateMe = useCallback(async () => {
    if (!navigator.geolocation) {
      setGeoError("La géolocalisation n'est pas disponible sur cet appareil.");
      return;
    }

    if (watchIdRef.current !== null) {
      navigator.geolocation.clearWatch(watchIdRef.current);
      watchIdRef.current = null;
    }

    setGeoLoading(true);
    setGeoError(null);

    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const lat = pos.coords.latitude;
        const lon = pos.coords.longitude;
        setUserLoc([lat, lon]);
        setSelected(null);

        const { data, error } = await supabase.rpc('arrets_proches', {
          p_lat: lat,
          p_lon: lon,
          p_radius_m: 800,
          p_limit: 15,
        });

        setGeoLoading(false);
        if (!error && data) {
          setNearbyStops(data as ArretProche[]);
          setSheet('half');
        }

        watchIdRef.current = navigator.geolocation.watchPosition(
          (p) => setUserLoc([p.coords.latitude, p.coords.longitude]),
          () => {},
          { enableHighAccuracy: true }
        );
      },
      (err) => {
        setGeoLoading(false);
        setGeoError(err.code === err.PERMISSION_DENIED ? "Autorise la localisation." : "Erreur GPS.");
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  }, [supabase]);

  useEffect(() => {
    return () => {
      if (watchIdRef.current !== null) navigator.geolocation.clearWatch(watchIdRef.current);
    };
  }, []);

  const openSearch = () => setSearchOpen(true);
  const closeSearch = () => { setSearchOpen(false); setQuery(''); setResults([]); };

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

      {/* ── Floating Interface ── */}
      <div className="absolute top-[calc(env(safe-area-inset-top,0px)+12px)] left-4 right-4 z-[500] flex flex-col gap-3">
        {/* Search Bar */}
        <button
          onClick={openSearch}
          className="w-full flex items-center gap-4 bg-white/90 backdrop-blur-2xl rounded-[1.5rem] shadow-xl shadow-black/5 border-2 border-beige-200/50 px-5 py-4 text-left transition-all hover:border-abidjan-orange/30 active:scale-95"
        >
          <Image src="/icons/icon-192.png" alt="" width={24} height={24} className="rounded-lg opacity-90" />
          <span className="text-abidjan-orange"><Ic.Search s={20} /></span>
          <span className="text-sm font-bold text-beige-muted flex-1 truncate">
            {selected ? selected.stop_name : "Où vas-tu aujourd'hui ?"}
          </span>
          {selected && (
            <div onClick={(e) => { e.stopPropagation(); clearSelection(); }} className="text-beige-200 p-1">
              <Ic.X s={20} />
            </div>
          )}
        </button>

        {/* Action Chips */}
        <div className="flex gap-2 overflow-x-auto scrollbar-hide -mx-4 px-4 pb-1">
          <button
            onClick={handleLocateMe}
            disabled={geoLoading}
            className={`flex-shrink-0 flex items-center gap-2 backdrop-blur-2xl rounded-2xl shadow-lg border-2 px-4 py-2.5 transition-all active:scale-95 ${
              userLoc ? 'bg-abidjan-blue text-white border-abidjan-blue' : 'bg-white/90 text-beige-muted border-beige-200/50'
            }`}
          >
            {geoLoading ? <div className="w-4 h-4 border-2 border-current/30 border-t-current rounded-full animate-spin" /> : <Ic.Locate s={22} />}
            <span className="text-[11px] font-black uppercase tracking-wider whitespace-nowrap">GPS</span>
          </button>

          <Link href="/app/itineraire" className="flex-shrink-0 flex items-center gap-2 bg-white/90 backdrop-blur-2xl rounded-2xl shadow-lg border-2 border-beige-200/50 px-4 py-2.5 text-beige-muted">
            <Ic.Route s={22} />
            <span className="text-[11px] font-black uppercase tracking-wider">Itinéraire</span>
          </Link>

          <button onClick={() => setHeatMode(!heatMode)} className={`flex-shrink-0 flex items-center gap-2 backdrop-blur-2xl rounded-2xl shadow-lg border-2 px-4 py-2.5 ${heatMode ? 'bg-abidjan-orange text-white border-abidjan-orange' : 'bg-white/90 text-beige-muted border-beige-200/50'}`}>
            <span className="text-base leading-none">{heatMode ? '🔥' : '❄️'}</span>
            <span className="text-[11px] font-black uppercase tracking-wider">Activité</span>
          </button>

          <Link href="/app/compte" className="flex-shrink-0 flex items-center gap-2 bg-white/90 backdrop-blur-2xl rounded-2xl shadow-lg border-2 border-beige-200/50 px-4 py-2.5 text-beige-muted">
            <Ic.Users s={22} />
            <span className="text-[11px] font-black uppercase tracking-wider">Compte</span>
          </Link>
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
        {/* Clickable Handle to cycle height */}
        <div
          onClick={cycleSheet}
          className="flex flex-col items-center pt-3 pb-4 cursor-pointer active:bg-beige-50/50 transition-colors"
        >
          <div className="w-12 h-1.5 bg-beige-200/60 rounded-full" />
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
              {nearbyStops.length > 0 && (
                <div style={{ marginBottom: 24 }}>
                  <div style={{ fontSize: 11, fontWeight: 800, color: 'var(--muted)', letterSpacing: 0.7, textTransform: 'uppercase', marginBottom: 12 }}>PRÈS DE TOI</div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                    {nearbyStops.slice(0, 3).map(s => (
                      <div key={s.stop_id} onClick={() => handleSelectStop(s)} style={{ display: 'flex', alignItems: 'center', gap: 14, padding: 16, borderRadius: 20, background: 'var(--cream-2)', border: '1px solid var(--line)', cursor: 'pointer' }}>
                        <div style={{ width: 44, height: 44, borderRadius: 14, background: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 4px 12px rgba(0,0,0,0.05)' }}>
                          <Ic.Pin s={20} color="var(--orange)" />
                        </div>
                        <div style={{ flex: 1 }}>
                          <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--ink)' }}>{s.stop_name}</div>
                          <div style={{ fontSize: 11, color: 'var(--muted)', fontWeight: 600 }}>{formatDistance(s.distance_m)} · {s.commune}</div>
                        </div>
                        <Ic.Arrow s={16} color="var(--line)" />
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* TRANSPORTS — Horizontal Scroll */}
              <div style={{ marginBottom: 24 }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
                  <div style={{ fontSize: 11, fontWeight: 800, color: 'var(--muted)', letterSpacing: 0.7, textTransform: 'uppercase' }}>TRANSPORTS</div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 10, color: 'var(--green)', fontWeight: 800 }}>
                    <div className="shimmer" style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--green)' }} />
                    LIVE
                  </div>
                </div>
                <div className="no-scrollbar" style={{ display: 'flex', gap: 12, overflowX: 'auto', margin: '0 -24px', padding: '0 24px' }}>
                  {TRANSPORT_DEMO.map((t, i) => (
                    <div key={i} style={{ flexShrink: 0, width: 140, padding: 16, borderRadius: 22, background: 'var(--cream-2)', border: '1px solid var(--line)' }}>
                      <Vehicle kind={t.kind} size={32} />
                      <div style={{ marginTop: 12, fontSize: 13, fontWeight: 800, color: 'var(--ink)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{t.line}</div>
                      <div style={{ fontSize: 11, color: t.color, fontWeight: 700, marginTop: 2 }}>{t.eta}</div>
                    </div>
                  ))}
                </div>
              </div>

              {/* BOUSSOLE CARD */}
              <Link href="/app/boussole" style={{ textDecoration: 'none', display: 'block', marginBottom: 24 }}>
                <div style={{ padding: 20, borderRadius: 24, background: 'var(--ink)', color: 'var(--cream)', position: 'relative', overflow: 'hidden' }}>
                  <div className="wax-bg" style={{ position: 'absolute', inset: 0, color: 'var(--orange)', opacity: 0.15 }} />
                  <div style={{ position: 'relative', display: 'flex', alignItems: 'center', gap: 20 }}>
                    <div style={{ width: 64, height: 64, borderRadius: '50%', background: 'rgba(255,255,255,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <div className="compass-needle" style={{ fontSize: 32 }}>🧭</div>
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 11, fontWeight: 800, color: 'var(--orange)', letterSpacing: 0.7, marginBottom: 4 }}>NOUVEAU</div>
                      <div className="font-display" style={{ fontSize: 20 }}>Ma Boussole Babi</div>
                      <div style={{ fontSize: 12, opacity: 0.6, marginTop: 2 }}>Ne te perds plus jamais en ville.</div>
                    </div>
                  </div>
                </div>
              </Link>
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
              <input autoFocus value={query} onChange={(e) => handleSearchChange(e.target.value)} placeholder="Chercher un lieu..." className="flex-1 text-lg font-black outline-none placeholder-beige-200 bg-transparent" />
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
