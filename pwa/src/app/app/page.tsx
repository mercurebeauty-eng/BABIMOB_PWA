'use client';

import dynamic from 'next/dynamic';
import Image from 'next/image';
import { useState, useRef, useCallback, useEffect, Suspense } from 'react';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import type { Stop, ArretProche } from '@/lib/types';
import type { POI } from '@/lib/poi';
import { useRouter, useSearchParams } from 'next/navigation';
import { Vehicle } from '@/components/ui/Vehicle';
import { Ic } from '@/components/ui/Ic';
import BroadcastButton from '@/components/BroadcastButton';
import { motion, useAnimation, PanInfo, AnimatePresence } from 'framer-motion';

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
    <div style={{ position: 'absolute', inset: 0, background: 'var(--cream)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 12 }}>
      <div style={{ width: 40, height: 40, borderRadius: '50%', border: '3px solid color-mix(in oklab, var(--orange) 20%, transparent)', borderTopColor: 'var(--orange)', animation: 'spin 0.8s linear infinite' }} />
      <span style={{ fontSize: 11, fontWeight: 800, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: 0.7 }}>Chargement de la ville…</span>
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
  const [hotspots] = useState<any[]>([]);
  const [explorers, setExplorers] = useState<any[]>([]);
  const [pois, setPois] = useState<POI[]>([]);
  const [poiCheckins, setPoiCheckins] = useState<Record<string, number>>({});
  const [broadcasts, setBroadcasts] = useState<any[]>([]);
  const [livePois, setLivePois] = useState<string[]>([]);
  const [userLoc, setUserLoc] = useState<[number, number] | null>(null);
  const [nearbyStops, setNearbyStops] = useState<ArretProche[]>([]);
  const [geoLoading, setGeoLoading] = useState(false);
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
  const sheetH = sheet === 'peek' ? 240 : sheet === 'half' ? 440 : 620;

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
          .from('checkins').select('place_id')
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
          .gte('created_at', since3h);
        if (liveData) setLivePois(Array.from(new Set(liveData.map((d: any) => d.place_id))));
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

  // Geolocation
  const [userLoc, setUserLoc] = useState<[number, number] | null>(null);
  const [nearbyStops, setNearbyStops] = useState<ArretProche[]>([]);
  const [geoLoading, setGeoLoading] = useState(false);
  const [geoError, setGeoError] = useState<string | null>(null);

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
      const fourHoursAgo = new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString();
      const { data: bc } = await supabase
        .from('profiles')
        .select('id, display_name, avatar_emoji, last_broadcast_at, broadcast_text, broadcast_lat, broadcast_lon, sub_tier')
        .not('last_broadcast_at', 'is', null)
        .gt('last_broadcast_at', fourHoursAgo);
      if (bc) setBroadcasts(bc);
    }
    loadData();
    setExplorers([
      { lat: 5.3484, lon: -4.0305, name: 'Jean', level: 3 },
      { lat: 5.3310, lon: -4.0210, name: 'Awa', level: 2 },
      { lat: 5.3590, lon: -3.9850, name: 'Koffi', level: 4 },
    ]);
  }, [supabase]);

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

  const handleLocateMe = useCallback(async () => {
    if (!navigator.geolocation) {
      setGeoError("La géolocalisation n'est pas disponible sur cet appareil.");
      return;
    }

    // Stop any previous watch
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
          setSheetExpanded(data.length > 0);
        }

        // Start continuous tracking after initial fix
        watchIdRef.current = navigator.geolocation.watchPosition(
          (p) => setUserLoc([p.coords.latitude, p.coords.longitude]),
          () => {},
          { enableHighAccuracy: true }
        );
      },
      (err) => {
        setGeoLoading(false);
        if (err.code === err.PERMISSION_DENIED) {
          setGeoError("Autorise la localisation dans ton navigateur.");
        } else {
          setGeoError("Impossible d'obtenir ta position.");
        }
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  }, [supabase]);

  // Clean up geolocation watch on unmount
  useEffect(() => {
    return () => {
      if (watchIdRef.current !== null) navigator.geolocation.clearWatch(watchIdRef.current);
    };
  }, []);

  const openSearch = () => setSearchOpen(true);
  const closeSearch = () => { setSearchOpen(false); setQuery(''); setResults([]); };
    if (!navigator.geolocation) return;
    setGeoLoading(true);
    navigator.geolocation.getCurrentPosition(async (pos) => {
      const lat = pos.coords.latitude;
      const lon = pos.coords.longitude;
      setUserLoc([lat, lon]);
      setSelected(null);
      const { data } = await supabase.rpc('arrets_proches', { p_lat: lat, p_lon: lon, p_radius_m: 800, p_limit: 10 });
      setGeoLoading(false);
      if (data) { setNearbyStops(data as ArretProche[]); setSheet('half'); }
    }, () => setGeoLoading(false), { enableHighAccuracy: true, timeout: 10000 });
  }, [supabase]);

  const initials = profile?.display_name
    ? profile.display_name.split(' ').map((w: string) => w[0]).join('').slice(0, 2).toUpperCase()
    : 'MK';

  const TICKER = [
    ['Cocody', 'fluide', 'var(--green)'],
    ['Yop → Plateau', '15 min', 'var(--green)'],
    ['Pont HKB', 'embouteillé', 'var(--orange-deep)'],
    ['Adjamé Liberté', 'Gbaka 200F', 'var(--ink)'],
    ['Riviera 2', 'fluide', 'var(--green)'],
    ['Cocody', 'fluide', 'var(--green)'],
    ['Yop → Plateau', '15 min', 'var(--green)'],
    ['Pont HKB', 'embouteillé', 'var(--orange-deep)'],
    ['Adjamé Liberté', 'Gbaka 200F', 'var(--ink)'],
    ['Riviera 2', 'fluide', 'var(--green)'],
  ];

  const TRANSPORT_DEMO = [
    { kind: 'gbaka' as const, line: 'Adjamé ↔ Yop', eta: '2 min', color: 'var(--orange)' },
    { kind: 'woro' as const, line: 'Cocody', eta: '4 min', color: 'var(--green)' },
    { kind: 'taxi' as const, line: 'Plateau', eta: 'sur place', color: 'var(--gold)' },
    { kind: 'saloni' as const, line: 'quartier', eta: '1 min', color: 'var(--blue)' },
  ];

  const RECENT = [
    { from: 'Cocody Saint-Jean', to: 'Plateau', tarif: '300F' },
    { from: 'Adjamé Liberté', to: 'Yopougon Selmer', tarif: '200F' },
    { from: 'Riviera 2', to: 'Marcory Zone 4', tarif: '500F' },
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

      {/* ── Live Ticker ── */}
      {/* Feature restricted to Verified Explorers/Premium viewers */}
      {(profile?.is_admin || profile?.is_verified_explorer || profile?.sub_tier === 'pro' || profile?.sub_tier === 'elite') && liveTickerFeed.length > 0 && (
        <div className="absolute top-0 left-0 right-0 z-[600] pointer-events-none">
           <div className="bg-gradient-to-b from-black/20 to-transparent pt-1 pb-8 px-4 overflow-hidden">
              <div className="flex gap-4 animate-marquee-slow">
                 {liveTickerFeed.map((checkin, i) => (
                    <div key={i} className="flex-shrink-0 flex items-center gap-2 bg-white/10 backdrop-blur-md px-3 py-1.5 rounded-full border border-white/20 shadow-sm animate-in fade-in slide-in-from-top-2 duration-700">
                       <span className="text-sm">{(checkin.profile as any)?.is_public_visits ? (checkin.profile as any)?.avatar_emoji : '👤'}</span>
                       <span className="text-[10px] font-black uppercase tracking-widest text-white">
                          {checkin.display_name} est à <span className="text-abidjan-orange">{checkin.place_name}</span>
                       </span>
                    </div>
                 ))}
              </div>
           </div>
        </div>
      )}

      {/* ── Floating top bar ────────────────────────────────────────────── */}
      <div className="absolute top-6 left-4 right-4 z-[500] flex flex-col gap-3">

        {/* Ligne 1 : barre de recherche pleine largeur */}
        <button
          onClick={openSearch}
          className="w-full flex items-center gap-4 bg-white/90 backdrop-blur-2xl rounded-[1.5rem] shadow-xl shadow-black/5 border-2 border-beige-200/50 px-5 py-4 text-left transition-all hover:border-abidjan-orange/30 active:scale-95"
        >
          <Image src="/icons/icon-192.png" alt="" width={24} height={24} className="rounded-lg flex-shrink-0 opacity-90" />
          <span className="text-abidjan-orange flex-shrink-0"><IconSearch /></span>
          <span className="text-sm font-bold text-beige-muted flex-1 truncate">
            {selected ? selected.stop_name : "Arrêt, quartier ou lieu…"}
          </span>
          {selected && (
            <button
              onClick={(e) => { e.stopPropagation(); clearSelection(); }}
              className="text-beige-200 hover:text-beige-text p-1 rounded-full transition"
              aria-label="Effacer la sélection"
            >
              <IconX />
            </button>
          )}
        </button>

        {/* Ligne 2 : chips d'action en carousel scrollable */}
        <div className="flex gap-2 overflow-x-auto scrollbar-hide -mx-4 px-4 pb-1">

          {/* Me localiser */}
          <button
            onClick={handleLocateMe}
            disabled={geoLoading}
            aria-label="Me localiser"
            className={`flex-shrink-0 flex items-center gap-2 backdrop-blur-2xl rounded-2xl shadow-lg shadow-black/5 border-2 px-4 py-2.5 transition-all active:scale-95 disabled:opacity-50 ${
              userLoc
                ? 'bg-abidjan-blue text-white border-abidjan-blue shadow-abidjan-blue/20'
                : 'bg-white/90 text-beige-muted border-beige-200/50 hover:border-abidjan-blue/30 hover:text-abidjan-blue'
            }`}
          >
            {geoLoading
              ? <div className="w-4 h-4 border-2 border-current/30 border-t-current rounded-full animate-spin" />
              : <IconLocate />
            }
            <span className="text-[11px] font-black uppercase tracking-wider whitespace-nowrap">
              {userLoc ? 'Localisé' : 'Me localiser'}
            </span>
          </button>

          {/* Profil */}
          <Link
            href="/app/compte"
            aria-label="Mon compte"
            className="flex-shrink-0 flex items-center gap-2 bg-white/90 backdrop-blur-2xl rounded-2xl shadow-lg shadow-black/5 border-2 border-beige-200/50 px-4 py-2.5 text-beige-muted hover:border-abidjan-orange/30 hover:text-abidjan-orange transition-all active:scale-95"
          >
            <IconUser />
            <span className="text-[11px] font-black uppercase tracking-wider">Profil</span>
          </Link>

          {/* Itinéraire */}
          <Link
            href="/app/itineraire"
            aria-label="Calculer un itinéraire"
            className="flex-shrink-0 flex items-center gap-2 bg-white/90 backdrop-blur-2xl rounded-2xl shadow-lg shadow-black/5 border-2 border-beige-200/50 px-4 py-2.5 text-beige-muted hover:border-abidjan-blue/30 hover:text-abidjan-blue transition-all active:scale-95"
          >
            <IconRoute />
            <span className="text-[11px] font-black uppercase tracking-wider">Itinéraire</span>
          </Link>

          {/* Découvrir (POIs) */}
          <button
            onClick={() => {
              if (pois.length > 0) {
                const randomPoi = pois[Math.floor(Math.random() * pois.length)];
                setSelectedPoi(randomPoi);
                setSheetExpanded(true);
              } else if (mapRef.current) {
                // S'il n'y a pas de POIs chargés, on fait un fetch rapide et on en prend un
                const b = mapRef.current.getBounds();
                import('@/lib/poi').then(mod =>
                  mod.fetchNearbyPOIs(b.getSouth(), b.getNorth(), b.getWest(), b.getEast())
                ).then(loadedPois => {
                  setPois(loadedPois);
                  if(loadedPois.length > 0) {
                    setSelectedPoi(loadedPois[Math.floor(Math.random() * loadedPois.length)]);
                    setSheetExpanded(true);
                  }
                });
              }
            }}
            aria-label="Découvrir les lieux"
            className="flex-shrink-0 flex items-center gap-2 bg-white/90 backdrop-blur-2xl rounded-2xl shadow-lg shadow-black/5 border-2 border-beige-200/50 px-4 py-2.5 text-beige-muted hover:border-abidjan-orange/30 transition-all active:scale-95"
          >
            <span className="text-base leading-none">✨</span>
            <span className="text-[11px] font-black uppercase tracking-wider whitespace-nowrap">Découvrir</span>
          </button>

          {/* Activité (heatmap) */}
          <button
            onClick={() => setHeatMode(!heatMode)}
            aria-label="Mode activité"
            className={`flex-shrink-0 flex items-center gap-2 backdrop-blur-2xl rounded-2xl shadow-lg shadow-black/5 border-2 px-4 py-2.5 transition-all active:scale-95 ${
              heatMode
                ? 'bg-abidjan-orange text-white border-abidjan-orange shadow-abidjan-orange/20'
                : 'bg-white/90 text-beige-muted border-beige-200/50 hover:border-abidjan-orange/30'
            }`}
          >
            <span className="text-base leading-none">{heatMode ? '🔥' : '❄️'}</span>
            <span className="text-[11px] font-black uppercase tracking-wider">Activité</span>
      {/* TOP BAR */}
      <div style={{ position: 'absolute', top: 'max(56px, env(safe-area-inset-top, 0px) + 16px)', left: 16, right: 16, display: 'flex', gap: 10, zIndex: 500 }}>
        <button style={{ width: 44, height: 44, borderRadius: 14, border: 'none', background: 'var(--cream)', color: 'var(--ink)', boxShadow: '0 4px 14px rgba(0,0,0,0.10)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', flexShrink: 0 }}>
          <Ic.Menu s={20} />
        </button>

        {searchOpen ? (
          <div style={{ flex: 1, height: 44, borderRadius: 14, background: 'var(--cream)', boxShadow: '0 4px 14px rgba(0,0,0,0.10)', display: 'flex', alignItems: 'center', gap: 10, padding: '0 14px' }}>
            <Ic.Search s={18} />
            <input
              autoFocus
              value={query}
              onChange={e => handleSearchChange(e.target.value)}
              placeholder="Arrêt, quartier ou lieu…"
              style={{ flex: 1, border: 'none', outline: 'none', background: 'transparent', fontSize: 14, fontWeight: 500, color: 'var(--ink)', fontFamily: 'inherit' }}
            />
            <button onClick={() => { setSearchOpen(false); setQuery(''); setResults([]); }} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--muted)', display: 'flex' }}>
              <Ic.X s={18} />
            </button>
          </div>
        ) : (
          <button onClick={() => setSearchOpen(true)} style={{ flex: 1, height: 44, borderRadius: 14, border: 'none', background: 'var(--cream)', color: 'var(--muted)', boxShadow: '0 4px 14px rgba(0,0,0,0.10)', display: 'flex', alignItems: 'center', gap: 10, padding: '0 14px', fontSize: 14, fontWeight: 500, cursor: 'pointer' }}>
            <Ic.Search s={18} />
            <span style={{ flex: 1, textAlign: 'left' }}>Où vas-tu, Babi ?</span>
            <Link href="/app/chat" onClick={e => e.stopPropagation()} style={{ fontSize: 10, fontWeight: 800, color: 'var(--orange)', background: 'color-mix(in oklab, var(--orange) 12%, transparent)', padding: '3px 7px', borderRadius: 6, letterSpacing: 0.5, textDecoration: 'none' }}>IA</Link>
          </button>
        )}

        </div>
      </div>

      {/* Broadcast FAB — floating action button, always visible bottom-right */}
      {profile && !sheetExpanded && (
        <div className="absolute bottom-28 right-5 z-[600] animate-in fade-in zoom-in duration-300">
          <BroadcastButton
            userId={profile.id}
            currentTier={profile.sub_tier ?? 'free'}
            isAdmin={profile.is_admin === true}
          />
        </div>
      )}

      {/* Geo error toast */}
      <AnimatePresence>
        {geoError && (
          <motion.div
            initial={{ opacity: 0, y: -20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.95 }}
            transition={{ type: 'spring', damping: 20, stiffness: 300 }}
            className="bm-toast absolute top-36 left-4 right-4 z-[500] bg-red-50 border-2 border-red-100 rounded-2xl px-5 py-4 text-xs font-black text-red-600 flex flex-nowrap items-center justify-between shadow-xl uppercase tracking-widest"
          >
            <span className="flex-1 mr-2 leading-tight">{geoError}</span>
            <button
              onClick={() => setGeoError(null)}
              className="p-2 ml-auto text-red-300 hover:text-red-500 hover:bg-red-100 rounded-full transition flex-shrink-0"
              aria-label="Fermer"
            >
              <IconX />
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Bottom sheet (Framer Motion) ────────────────────────────────────────────────── */}
      <motion.div
        drag="y"
        dragConstraints={{ top: 0, bottom: 0 }}
        dragElastic={0.2}
        onDragEnd={(e, info: PanInfo) => {
          if (info.offset.y > 50 || info.velocity.y > 200) {
            setSheetExpanded(false);
          } else if (info.offset.y < -50 || info.velocity.y < -200) {
            setSheetExpanded(true);
          }
        }}
        initial={false}
        animate={{ y: sheetExpanded ? 0 : 'calc(100% - 88px)' }}
        transition={{ type: 'spring', damping: 25, stiffness: 200, mass: 0.8 }}
        className="absolute bottom-0 left-0 right-0 z-[500] bg-white rounded-t-[3rem] shadow-[0_-10px_40px_rgba(0,0,0,0.1)] border-t-2 border-beige-100 h-[85vh] touch-none"
      >
        {/* Handle */}
        <div
          className="flex flex-col items-center pt-4 pb-2 cursor-grab active:cursor-grabbing select-none"
          onClick={() => setSheetExpanded(!sheetExpanded)}
          role="button"
          aria-label={sheetExpanded ? "Réduire" : "Agrandir"}
          aria-expanded={sheetExpanded}
        >
          <div className="w-12 h-1.5 bg-beige-200 rounded-full" />
        </div>

        {/* Collapsed peek */}
        {!sheetExpanded && (
          <div className="flex items-center justify-between px-6 py-3 pb-6">
            <div className="text-base font-black text-beige-text truncate max-w-[220px] tracking-tight">
              {selected
                ? selected.stop_name
                : nearbyStops.length > 0
                  ? `${nearbyStops.length} arrêt${nearbyStops.length > 1 ? 's' : ''} proches`
                  : "Où vas-tu aujourd'hui ?"}
            </div>
            {selected ? (
              <button
                onClick={() => router.push(`/app/arret/${encodeURIComponent(selected.stop_id)}`)}
                className="text-xs font-black text-abidjan-orange uppercase tracking-widest px-4 py-2 bg-abidjan-orange/10 rounded-full"
              >
                Lignes →
              </button>
            ) : nearbyStops.length > 0 ? (
              <button onClick={() => setSheetExpanded(true)} className="text-xs font-black text-abidjan-blue uppercase tracking-widest px-4 py-2 bg-abidjan-blue/10 rounded-full">
                Liste →
              </button>
            ) : (
              <button onClick={openSearch} className="text-xs font-black text-abidjan-orange uppercase tracking-widest px-4 py-2 bg-abidjan-orange/10 rounded-full">
                Chercher →
              </button>
            )}
          </div>
        <Link href="/app/compte" style={{ width: 44, height: 44, borderRadius: 14, background: 'var(--orange)', color: '#fff', boxShadow: '0 4px 14px rgba(242,108,26,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, fontWeight: 800, textDecoration: 'none', flexShrink: 0 }}>
          {initials}
        </Link>
      </div>

      {/* SEARCH RESULTS */}
      {searchOpen && (results.length > 0 || isSearching || query.length >= 2) && (
        <div className="bm-search-overlay no-scrollbar" style={{ position: 'absolute', top: 'calc(max(56px, env(safe-area-inset-top, 0px) + 16px) + 54px)', left: 16, right: 16, zIndex: 500, background: 'var(--cream-2)', borderRadius: 18, boxShadow: '0 8px 32px rgba(0,0,0,0.12)', border: '1px solid var(--line)', maxHeight: 320, overflowY: 'auto' }}>
          {isSearching ? (
            <div style={{ padding: 20, textAlign: 'center', fontSize: 13, color: 'var(--muted)' }}>Recherche…</div>
          ) : results.length === 0 ? (
            <div style={{ padding: 20, textAlign: 'center', fontSize: 13, color: 'var(--muted)' }}>Aucun résultat pour « {query} »</div>
          ) : results.map((r, i) => (
            <button key={r.stop_id ?? i} onClick={() => handleSelectStop(r)} style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 12, padding: '12px 16px', border: 'none', borderBottom: i < results.length - 1 ? '1px solid var(--line)' : 'none', background: 'transparent', cursor: 'pointer', textAlign: 'left' }}>
              <div style={{ width: 36, height: 36, borderRadius: 10, background: 'color-mix(in oklab, var(--orange) 12%, transparent)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--orange)', flexShrink: 0 }}>
                <Ic.Pin s={18} />
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--ink)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{r.stop_name}</div>
                {r.commune && <div style={{ fontSize: 11, color: 'var(--muted)' }}>{r.commune}</div>}
              </div>
              <Ic.Arrow s={16} />
            </button>
          ))}
        </div>
      )}

      {/* RIGHT FABs */}
      <div style={{ position: 'absolute', right: 16, top: 'max(120px, env(safe-area-inset-top, 0px) + 80px)', display: 'flex', flexDirection: 'column', gap: 8, zIndex: 400 }}>
        {profile && (
          <BroadcastButton
            userId={profile.id}
            canBroadcast={profile.sub_tier === 'pro' || profile.sub_tier === 'elite'}
          />
        )}
        <button className="press" onClick={handleLocateMe} style={{ width: 44, height: 44, borderRadius: 14, border: 'none', background: 'var(--cream)', color: geoLoading ? 'var(--orange)' : 'var(--ink)', boxShadow: '0 2px 8px rgba(0,0,0,0.08)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
          <Ic.Locate s={18} />
        </button>
      </div>

        {/* Expanded content */}
        {sheetExpanded && (
          <div className="px-6 pt-4 pb-12 overflow-y-auto max-h-[70vh]">
            {selectedPoi ? (
              /* ── POI preview ── */
              <div className="animate-in fade-in slide-in-from-bottom-4 duration-300">
                <div className="flex items-start justify-between gap-4 mb-6">
                  <div className="flex items-center gap-4">
                    <div
                      className="w-14 h-14 rounded-2xl flex items-center justify-center text-2xl flex-shrink-0 shadow-md"
                      style={{ background: `${selectedPoi.cover_color}18`, border: `2px solid ${selectedPoi.cover_color}25` }}
                    >
                      {selectedPoi.logo_emoji}
                    </div>
                    <div>
                      {selectedPoi.sponsor_tier === 'elite' && (
                        <div className="text-[9px] font-black text-abidjan-orange uppercase tracking-widest mb-1">⭐ Partenaire Elite</div>
                      )}
                      {selectedPoi.sponsor_tier === 'pro' && (
                        <div className="text-[9px] font-black text-abidjan-blue uppercase tracking-widest mb-1">✓ Partenaire Pro</div>
                      )}
                      <h2 className="text-lg font-black text-beige-text leading-tight">{selectedPoi.name}</h2>
                      {selectedPoi.commune && (
                        <div className="text-xs text-beige-muted font-bold uppercase tracking-widest mt-0.5">{selectedPoi.commune}</div>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <PoiFavoriteButton
                      placeId={selectedPoi.place_id ?? selectedPoi.id}
                      placeName={selectedPoi.name}
                      commune={selectedPoi.commune}
                      lat={selectedPoi.lat}
                      lon={selectedPoi.lon}
                      userId={profile?.id ?? null}
                    />
                    <button
                      onClick={() => setSelectedPoi(null)}
                      className="p-2.5 rounded-2xl bg-beige-50 hover:bg-beige-100 transition text-beige-200"
                    >
                      <IconX size="w-5 h-5" />
                    </button>
                  </div>
                </div>

                {selectedPoi.has_campaign && selectedPoi.campaign_label && (
                  <div className="flex items-center gap-3 bg-abidjan-orange/10 border border-abidjan-orange/30 rounded-2xl px-4 py-3 mb-4">
                    <span className="text-xl">🔥</span>
                    <span className="text-xs font-black text-abidjan-orange">{selectedPoi.campaign_label}</span>
                  </div>
                )}

                {selectedPoi.description && (
                  <p className="text-sm text-beige-muted font-medium leading-relaxed mb-5">{selectedPoi.description}</p>
                )}

                {/* Nearest stop indicator */}
                {poiNearestStop && (
                  <div className="flex items-center gap-2 mb-4 bg-abidjan-blue/8 border border-abidjan-blue/20 rounded-2xl px-4 py-3">
                    <span className="text-sm">📍</span>
                    <span className="text-[11px] font-bold text-beige-muted flex-1 truncate">{poiNearestStop.stop_name}</span>
                    <span className="text-[11px] font-black text-abidjan-blue bg-abidjan-blue/10 px-2 py-0.5 rounded-lg flex-shrink-0">
                      {formatDistance(poiNearestStop.distance_m)}
                    </span>
                  </div>
                )}

                {/* Check-in button */}
                <div className="mb-3">
                  <PoiCheckInButton
                    placeId={selectedPoi.id}
                    placeName={selectedPoi.name}
                    commune={selectedPoi.commune}
                    lat={selectedPoi.lat}
                    lon={selectedPoi.lon}
                  />
                </div>

                <div className="flex flex-col gap-3">
                  {selectedPoi.place_id && (
                    <Link
                      href={`/app/place/${selectedPoi.place_id}`}
                      className="flex items-center justify-center gap-2 bg-beige-50 border-2 border-beige-200 text-beige-muted font-bold py-4 rounded-2xl text-sm uppercase tracking-tight active:scale-95 transition-all hover:border-abidjan-orange/30"
                    >
                      Voir le profil complet →
                    </Link>
                  )}
                  <div className="flex gap-3">
                    {selectedPoi.whatsapp && (
                      <a
                        href={`https://wa.me/${selectedPoi.whatsapp.replace(/\D/g, '')}`}
                        target="_blank" rel="noopener noreferrer"
                        className="flex-1 flex items-center justify-center gap-2 bg-abidjan-green/10 border-2 border-abidjan-green/30 text-abidjan-green font-black py-3.5 rounded-2xl text-sm active:scale-95 transition-all"
                      >
                        <span>💬</span> WhatsApp
                      </a>
                    )}
                    {selectedPoi.phone && (
                      <a
                        href={`tel:${selectedPoi.phone}`}
                        className="flex-1 flex items-center justify-center gap-2 bg-abidjan-blue/10 border-2 border-abidjan-blue/30 text-abidjan-blue font-black py-3.5 rounded-2xl text-sm active:scale-95 transition-all"
                      >
                        <span>📞</span> Appeler
                      </a>
                    )}
                    <button
                      onClick={() => handleGetDirections(selectedPoi)}
                      className="flex-1 flex items-center justify-center gap-2 bg-beige-50 border-2 border-beige-200 text-beige-muted font-black py-3.5 rounded-2xl text-sm active:scale-95 transition-all hover:border-abidjan-orange/30 hover:text-abidjan-orange"
                    >
                      <span>🚀</span> S'y rendre
                    </button>
                  </div>
                  {!selectedPoi.place_id && (
                    <div className="text-center text-[10px] text-beige-muted font-bold uppercase tracking-widest pt-2">
                      Source OpenStreetMap · <span className="text-abidjan-orange cursor-pointer">Référencer ce commerce</span>
                    </div>
                  )}
                </div>
              </div>
            ) : activeItinerary ? (
               /* ── Itinerary steps ── */
               <div className="animate-in fade-in slide-in-from-bottom-4 duration-300">
                  <div className="flex items-center justify-between mb-8">
                     <div>
                        <div className="text-[10px] uppercase tracking-[0.2em] text-abidjan-orange font-black mb-1">Trajet calculé</div>
                        <h2 className="text-2xl font-black text-beige-text tracking-tight">C&apos;est parti !</h2>
                     </div>
                     <button 
                        onClick={() => setActiveItinerary(null)} 
                        className="p-2.5 rounded-2xl bg-beige-50 hover:bg-beige-100 transition text-beige-200"
                     >
                        <IconX size="w-5 h-5" />
                     </button>
                  </div>

                  <div className="space-y-0">
                     {activeItinerary.legs.map((leg: any, idx: number) => (
                        <div key={idx} className="flex gap-6">
                           <div className="flex flex-col items-center flex-shrink-0">
                              <div className={`w-10 h-10 rounded-2xl flex items-center justify-center text-xl shadow-sm ${
                                 leg.mode === 'WALK' ? 'bg-beige-50 text-beige-text' : 'bg-abidjan-orange/10 text-abidjan-orange'
                              }`}>
                                 {leg.mode === 'WALK' ? '🚶' : '🚐'}
                              </div>
                              {idx < activeItinerary.legs.length - 1 && (
                                 <div className="w-1 flex-1 bg-beige-100 my-2 rounded-full" />
                              )}
                           </div>
                           <div className="flex-1 pb-8 min-w-0">
                              <div className="text-sm font-black text-beige-text leading-tight mb-1">
                                 {leg.mode === 'WALK' ? 'Marcher' : `Prendre ${leg.route?.longName || 'la ligne'}`}
                              </div>
                              <div className="text-xs font-bold text-beige-muted truncate">
                                 Vers <span className="text-beige-text">{leg.to.name}</span>
                              </div>
                              <div className="flex items-center gap-3 mt-3">
                                 <span className="text-[10px] font-black text-beige-muted uppercase tracking-widest bg-beige-50 px-2 py-1 rounded-md border border-beige-100">
                                    {Math.round(leg.duration/60)} min
                                 </span>
                                 <span className="text-[10px] font-black text-beige-muted uppercase tracking-widest">
                                    {Math.round(leg.distance)} m
                                 </span>
                              </div>
                           </div>
                        </div>
                     ))}
                  </div>

                  <button 
                     onClick={() => router.push('/app/itineraire')}
                     className="w-full mt-4 bg-beige-50 hover:bg-beige-100 text-beige-muted font-black py-4 rounded-[1.5rem] text-xs uppercase tracking-widest transition-all"
                  >
                     Nouvelle recherche
                  </button>
               </div>
            ) : selected ? (
              /* ── Stop detail ── */

              <div className="animate-in fade-in slide-in-from-bottom-4 duration-300">
                <div className="flex items-start justify-between gap-4 mb-8">
                  <div>
                    <div className="text-[10px] uppercase tracking-[0.2em] text-abidjan-orange font-black mb-1">Arrêt sélectionné</div>
                    <h2 className="text-2xl font-black text-beige-text leading-tight tracking-tight">{selected.stop_name}</h2>
                    {selected.commune && (
                      <div className="text-sm text-beige-muted font-bold mt-1 uppercase tracking-widest opacity-80">{selected.commune}</div>
                    )}
                  </div>
                  <button
                    onClick={clearSelection}
                    className="p-2.5 rounded-2xl bg-beige-50 hover:bg-beige-100 transition text-beige-200 flex-shrink-0"
                    aria-label="Fermer"
                  >
                    <IconX size="w-5 h-5" />
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <button
                    onClick={() => router.push(`/app/arret/${encodeURIComponent(selected.stop_id)}`)}
                    className="flex items-center justify-center gap-3 bg-abidjan-orange text-white text-base font-black px-6 py-5 rounded-3xl col-span-1 sm:col-span-2 shadow-xl shadow-abidjan-orange/20 active:scale-95 transition-all"
                  >
                    <IconList />
                    VOIR LES LIGNES
                  </button>
      {/* LIVE TICKER */}
      <div style={{ position: 'absolute', top: 'max(110px, env(safe-area-inset-top, 0px) + 70px)', left: 0, right: 0, zIndex: 300, height: 28, overflow: 'hidden', pointerEvents: 'none' }}>
        <div className="ticker" style={{ display: 'flex', gap: 24, whiteSpace: 'nowrap', paddingLeft: 16, alignItems: 'center', height: '100%' }}>
          {TICKER.map(([place, status, c], i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12, color: 'var(--ink-2)' }}>
              <div className="shimmer" style={{ width: 6, height: 6, borderRadius: '50%', background: c, flexShrink: 0 }} />
              <span style={{ fontWeight: 700 }}>{place}</span>
              <span style={{ color: 'var(--muted)' }}>· {status}</span>
            </div>
          ))}
        </div>
      </div>

      {/* BOTTOM SHEET */}
      <div style={{ position: 'absolute', left: 0, right: 0, bottom: 0, height: sheetH, transition: 'height 0.35s cubic-bezier(0.32,0.72,0,1)', background: 'var(--cream-2)', borderRadius: '24px 24px 0 0', boxShadow: '0 -8px 32px rgba(0,0,0,0.12)', zIndex: 400, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        <div onClick={() => setSheet(s => s === 'peek' ? 'half' : s === 'half' ? 'full' : 'peek')} style={{ cursor: 'pointer', paddingTop: 4, flexShrink: 0 }}>
          <div className="sheet-handle" />
        </div>

        <div className="no-scrollbar" style={{ flex: 1, overflowY: 'auto', padding: '8px 16px 120px' }}>

          {selected ? (
            /* SELECTED STOP */
            <div>
              <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 14 }}>
                <div>
                  <div style={{ fontSize: 11, fontWeight: 800, color: 'var(--orange)', letterSpacing: 0.5, marginBottom: 4, textTransform: 'uppercase' }}>Arrêt sélectionné</div>
                  <div className="font-display" style={{ fontSize: 22 }}>{selected.stop_name}</div>
                  {selected.commune && <div style={{ fontSize: 12, color: 'var(--muted)', marginTop: 2 }}>{selected.commune}</div>}
                </div>
                <button onClick={() => setSelected(null)} style={{ width: 36, height: 36, borderRadius: 10, border: '1px solid var(--line)', background: 'var(--cream)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: 'var(--muted)', flexShrink: 0 }}>
                  <Ic.X s={16} />
                </button>
              </div>
            ) : nearbyStops.length > 0 ? (
              /* ── Nearby stops list ── */
              <div className="animate-in fade-in slide-in-from-bottom-4 duration-300">
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <div className="text-[10px] uppercase tracking-[0.2em] text-abidjan-blue font-black mb-1">
                      À proximité
                    </div>
                    <div className="text-lg font-black text-beige-text tracking-tight">
                      {nearbyStops.length} arrêt{nearbyStops.length > 1 ? 's' : ''} trouvés
                    </div>
                  </div>
                  <button
                    onClick={() => {
                      if (watchIdRef.current !== null) { navigator.geolocation.clearWatch(watchIdRef.current); watchIdRef.current = null; }
                      setUserLoc(null); setNearbyStops([]); setSheetExpanded(false);
                    }}
                    className="p-2.5 rounded-2xl bg-beige-50 hover:bg-beige-100 transition text-beige-200"
                    aria-label="Effacer"
                  >
                    <IconX size="w-5 h-5" />
                  </button>
                </div>

                <ul className="space-y-3">
                  {nearbyStops.map((a) => (
                    <li
                      key={a.stop_id}
                      onClick={() => handleSelectStop({
                        stop_id: a.stop_id,
                        stop_name: a.stop_name,
                        stop_lat: a.stop_lat,
                        stop_lon: a.stop_lon,
                        commune: a.commune,
                      })}
                      className="flex items-center gap-4 bg-beige-50/50 hover:bg-white active:bg-beige-100 border-2 border-beige-100/50 hover:border-abidjan-orange/30 rounded-3xl px-5 py-4 cursor-pointer transition-all group"
                      role="button"
                    >
                      <div className="w-12 h-12 rounded-2xl bg-white flex items-center justify-center flex-shrink-0 shadow-sm group-hover:scale-110 transition-transform">
                        <IconPin />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-black text-beige-text truncate group-hover:text-abidjan-orange transition-colors">{a.stop_name}</div>
                        {a.commune && (
                          <div className="text-[10px] text-beige-muted font-bold uppercase tracking-widest mt-1">{a.commune}</div>
                        )}
                      </div>
                      <div className="text-[10px] font-black text-abidjan-blue flex-shrink-0 tabular-nums bg-abidjan-blue/10 px-2 py-1 rounded-lg">
                        {formatDistance(a.distance_m)}
                      </div>
                    </li>
                  ))}
                </ul>
              <Link href={`/app/arret/${encodeURIComponent(selected.stop_id)}`} className="press" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, padding: 14, borderRadius: 16, background: 'var(--orange)', color: '#fff', fontWeight: 800, fontSize: 14, textDecoration: 'none' }}>
                Voir les détails & tarifs <Ic.Arrow s={18} />
              </Link>
            </div>
          ) : (
            /* DEFAULT SHEET */
            <>
              <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: 10 }}>
                <h3 className="font-display" style={{ fontSize: 22, margin: 0 }}>Près de toi</h3>
                <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--orange)', letterSpacing: 0.5 }}>COCODY · 250m</span>
              </div>

                {sheetTab === 'explorer' ? (
                  <div className="text-center py-6">
                    <div className="flex justify-center mb-6">
                      <IconMap />
                    </div>
                    <p className="text-base font-bold text-beige-muted mb-8 leading-relaxed px-4 tracking-tight">
                      Recherche un arrêt ou utilise le GPS pour voir ce qui est proche de toi.
                    </p>
                    <div className="flex flex-col gap-4">
                      <button
                        onClick={openSearch}
                        className="bg-abidjan-orange text-white text-base font-black px-8 py-5 rounded-3xl shadow-xl shadow-abidjan-orange/20 active:scale-95 transition-all"
                      >
                        RECHERCHER UN ARRÊT
                      </button>
                      <button
                        onClick={handleLocateMe}
                        disabled={geoLoading}
                        className="flex items-center justify-center gap-3 bg-white border-2 border-abidjan-blue text-abidjan-blue text-base font-black px-8 py-5 rounded-3xl active:scale-95 transition-all shadow-xl shadow-abidjan-blue/10 disabled:opacity-50"
                      >
                        {geoLoading ? (
                          <div className="w-5 h-5 border-3 border-abidjan-blue/30 border-t-abidjan-blue rounded-full animate-spin" />
                        ) : (
                          <IconLocate />
                        )}
                        ARRÊTS À PROXIMITÉ
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-8 pb-8 animate-in fade-in slide-in-from-right-4 duration-500">
                    
                    {/* Trending Places Section */}
                    {trendingPlaces.length > 0 && (
                      <div>
                         <div className="flex items-center gap-2 mb-4 px-2">
                            <span className="text-xl">🔥</span>
                            <span className="text-[10px] font-black uppercase tracking-[0.2em] text-abidjan-orange">Tendances du jour</span>
                         </div>
                         <div className="flex gap-3 overflow-x-auto pb-4 scrollbar-hide -mx-2 px-2">
                            {trendingPlaces.map((tp, idx) => (
                               <div 
                                 key={idx} 
                                 onClick={() => {
                                    // Small trick to select POI if found or at least search for it
                                    setQuery(tp.name);
                                    setSearchOpen(true);
                                    handleSearchChange(tp.name);
                                 }}
                                 className="flex-shrink-0 bg-white border-2 border-beige-100 rounded-[2rem] px-5 py-4 flex flex-col items-center gap-1 shadow-sm active:scale-95 transition-all text-center min-w-[140px]"
                               >
                                  <div className="text-[10px] font-black text-abidjan-orange flex items-center gap-1 bg-abidjan-orange/10 px-2 py-0.5 rounded-full mb-1">
                                     #{idx + 1}
                                  </div>
                                  <div className="text-sm font-black text-beige-text whitespace-nowrap overflow-hidden text-ellipsis w-full">{tp.name}</div>
                                  <div className="text-[9px] font-bold text-beige-muted uppercase tracking-widest">{tp.count} visites</div>
                               </div>
                            ))}
                         </div>
              {/* Transport scroll */}
              <div className="no-scrollbar" style={{ display: 'flex', gap: 10, overflowX: 'auto', marginBottom: 14, paddingBottom: 4 }}>
                {(nearbyStops.length > 0
                  ? nearbyStops.slice(0, 4).map((s, i) => ({
                      kind: (['gbaka', 'woro', 'taxi', 'saloni'] as const)[i % 4],
                      line: s.stop_name,
                      eta: `${Math.round(s.distance_m)}m`,
                      color: ['var(--orange)', 'var(--green)', 'var(--gold)', 'var(--blue)'][i % 4],
                      stopId: s.stop_id,
                    }))
                  : TRANSPORT_DEMO
                ).map((v, i) => (
                  <div key={i} className="press" onClick={() => 'stopId' in v && v.stopId ? handleSelectStop({ stop_id: v.stopId, stop_name: v.line, stop_lat: 0, stop_lon: 0, commune: null } as any) : undefined} style={{ minWidth: 140, padding: 12, borderRadius: 14, background: 'var(--cream)', border: '1px solid var(--line)', cursor: 'pointer', flexShrink: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
                      <Vehicle kind={v.kind} size={32} />
                      <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                        <div className="shimmer" style={{ width: 6, height: 6, borderRadius: '50%', background: v.color }} />
                        <span style={{ fontSize: 11, fontWeight: 800, color: v.color }}>{v.eta}</span>
                      </div>
                    </div>
                    <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--ink)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{v.line}</div>
                    <div style={{ fontSize: 11, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: 0.5, marginTop: 2 }}>{v.kind}</div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </motion.div>

      {/* ── Search overlay ──────────────────────────────────────────────── */}
      <AnimatePresence>
        {searchOpen && (
          <motion.div
            initial={{ opacity: 0, y: '20vh' }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: '20vh' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="bm-search-overlay fixed inset-0 z-[600] bg-beige-50 flex flex-col"
          >
            <div className="flex items-center gap-4 px-5 pt-12 pb-4 bg-white border-b-2 border-beige-200">
            <button
              onClick={closeSearch}
              className="p-2 -ml-2 rounded-full hover:bg-beige-50 transition text-beige-text"
              aria-label="Retour"
            >
              <IconChevronLeft />
            </button>
            <input
              autoFocus
              type="text"
              value={query}
              onChange={(e) => handleSearchChange(e.target.value)}
              placeholder="Arrêt, quartier ou lieu…"
              className="flex-1 text-lg font-black outline-none text-beige-text placeholder-beige-200 bg-transparent"
            />
            {isSearching ? (
              <div className="w-5 h-5 border-3 border-abidjan-orange/30 border-t-abidjan-orange rounded-full animate-spin" />
            ) : query ? (
              <button
                onClick={() => handleSearchChange('')}
                className="p-2 text-beige-200 hover:text-beige-text rounded-full transition"
                aria-label="Effacer"
              >
                <IconX />
              </button>
            ) : null}
          </div>

              {/* Babi IA CTA */}
              <Link href="/app/chat" className="press" style={{ display: 'block', padding: 16, borderRadius: 18, marginBottom: 14, background: 'linear-gradient(135deg, var(--orange) 0%, var(--orange-deep) 100%)', color: '#fff', position: 'relative', overflow: 'hidden', textDecoration: 'none' }}>
                <div className="wax-bg" style={{ position: 'absolute', inset: 0, color: '#fff', opacity: 0.15 }} />
                <div style={{ position: 'relative', display: 'flex', alignItems: 'center', gap: 14 }}>
                  <div style={{ width: 48, height: 48, borderRadius: 14, background: 'rgba(255,255,255,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, fontSize: 22 }}>🗺️</div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 11, fontWeight: 800, opacity: 0.85, letterSpacing: 0.6 }}>BABI IA</div>
                    <div className="font-display" style={{ fontSize: 17, marginTop: 2 }}>Où vas-tu ?<br/>Demande en nouchi.</div>
                  </div>
                  <Ic.Arrow s={22} />
                </div>
              </Link>

              {/* Recent */}
              <div style={{ fontSize: 11, fontWeight: 800, color: 'var(--muted)', letterSpacing: 0.7, textTransform: 'uppercase', margin: '8px 4px 8px' }}>RÉCENTS</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 14 }}>
                {RECENT.map((r, i) => (
                  <Link key={i} href="/app/chat" className="press" style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 12px', borderRadius: 12, background: 'var(--cream)', border: '1px solid var(--line)', textDecoration: 'none' }}>
                    <div style={{ width: 36, height: 36, borderRadius: 10, background: 'color-mix(in oklab, var(--orange) 10%, transparent)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--orange)', flexShrink: 0 }}>
                      <Ic.Route s={18} />
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--ink)' }}>{r.from} → {r.to}</div>
                      <div style={{ fontSize: 11, color: 'var(--muted)', marginTop: 1 }}>Tarif moyen · {r.tarif}</div>
                    </div>
                    <Ic.Arrow s={16} />
                  </Link>
                ))}
              </div>

              {/* Community pulse */}
              <Link href="/app/ccomment" className="press" style={{ display: 'flex', alignItems: 'center', gap: 12, padding: 16, borderRadius: 18, background: 'var(--cream)', border: '1px solid var(--line)', textDecoration: 'none' }}>
                <div style={{ display: 'flex' }}>
                  {['var(--orange)', 'var(--green)', 'var(--blue)', 'var(--gold)'].map((c, i) => (
                    <div key={i} style={{ width: 28, height: 28, borderRadius: '50%', background: c, border: '2px solid var(--cream-2)', marginLeft: i === 0 ? 0 : -8, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 800, color: '#fff', flexShrink: 0 }}>
                      {['K', 'A', 'M', 'D'][i]}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </motion.div>
      )}
      </AnimatePresence>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--ink)' }}>247 Babis sont en ligne</div>
                  <div style={{ fontSize: 11, color: 'var(--muted)' }}>Demande ton C'comment</div>
                </div>
                <Ic.Arrow s={18} />
              </Link>
            </>
          )}
        </div>
      </div>

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
