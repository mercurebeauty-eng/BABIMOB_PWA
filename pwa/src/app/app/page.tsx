'use client';

import dynamic from 'next/dynamic';
import Image from 'next/image';
import { useState, useRef, useCallback, useEffect, Suspense } from 'react';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import type { Stop, ArretProche } from '@/lib/types';
import type { POI } from '@/lib/poi';
import { useRouter, useSearchParams } from 'next/navigation';
import PoiCheckInButton from '@/components/PoiCheckInButton';
import PoiFavoriteButton from '@/components/PoiFavoriteButton';
import BroadcastButton from '@/components/BroadcastButton';

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
const SUGGESTIONS = ['Adjamé gare', 'Angré', 'Yopougon mairie', 'Riviera 2', 'Plateau'];

function formatDistance(m: number): string {
  return m < 1000 ? `${Math.round(m)} m` : `${(m / 1000).toFixed(1)} km`;
}

/* ── SVG icons ──────────────────────────────────────────────────────────── */
const IconSearch = () => (
  <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
    <circle cx="11" cy="11" r="8" />
    <path d="m21 21-4.35-4.35" strokeLinecap="round" />
  </svg>
);

const IconX = ({ size = 'w-4 h-4' }: { size?: string }) => (
  <svg className={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
    <path d="M18 6 6 18M6 6l12 12" strokeLinecap="round" />
  </svg>
);

const IconChevronLeft = () => (
  <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
    <path d="m15 18-6-6 6-6" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

const IconLocate = () => (
  <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <circle cx="12" cy="12" r="3" fill="currentColor" stroke="none" />
    <path d="M12 2v3M12 19v3M2 12h3M19 12h3" strokeLinecap="round" strokeWidth="3" />
    <circle cx="12" cy="12" r="8" />
  </svg>
);

const IconUser = () => (
  <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <circle cx="12" cy="8" r="4" />
    <path d="M4 20c0-4 3.6-7 8-7s8 3 8 7" strokeLinecap="round" />
  </svg>
);

const IconPin = () => (
  <svg className="w-5 h-5 text-abidjan-orange" viewBox="0 0 24 24" fill="currentColor">
    <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z" />
  </svg>
);

const IconMap = () => (
  <svg className="w-12 h-12 text-beige-200" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
    <path d="M9 3L3 6v15l6-3 6 3 6-3V3l-6 3-6-3z" strokeLinejoin="round" />
    <path d="M9 3v15M15 6v15" strokeLinecap="round" />
  </svg>
);

const IconRoute = () => (
  <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M3 12h18M12 3l9 9-9 9" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

const IconList = () => (
  <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
    <path d="M9 5H7a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2h-2M9 5a2 2 0 0 0 2 2h2a2 2 0 0 0 2-2M9 5a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

export default function AppPage() {
  return (
    <Suspense fallback={<div className="flex-1 bg-beige-50 animate-pulse" />}>
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
  const [sheetExpanded, setSheetExpanded] = useState(false);
  const [sheetTab, setSheetTab] = useState<'explorer' | 'activite'>('explorer');
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [activeItinerary, setActiveItinerary] = useState<any | null>(null);
  const [selectedPoi, setSelectedPoi] = useState<POI | null>(null);
  const [heatMode, setHeatMode] = useState(false);
  const [hotspots, setHotspots] = useState<any[]>([]);
  const [explorers, setExplorers] = useState<any[]>([]);
  const [pois, setPois] = useState<POI[]>([]);
  const [poiCheckins, setPoiCheckins] = useState<Record<string, number>>({});
  const [poiNearestStop, setPoiNearestStop] = useState<{ stop_name: string; distance_m: number } | null>(null);
  const [broadcasts, setBroadcasts] = useState<any[]>([]);
  const [livePois, setLivePois] = useState<string[]>([]);
  const [liveTickerFeed, setLiveTickerFeed] = useState<any[]>([]);
  const [communityFeed, setCommunityFeed] = useState<any[]>([]);
  const [trendingPlaces, setTrendingPlaces] = useState<any[]>([]);
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

  // POI Discovery logic — also fetches check-in counts after each POI load
  const handleMapReady = useCallback((map: any) => {
    mapRef.current = map;
    const loadPois = async () => {
      const b = map.getBounds();
      const mod = await import('@/lib/poi');
      const fetchedPois = await mod.fetchNearbyPOIs(b.getSouth(), b.getNorth(), b.getWest(), b.getEast());
      setPois(fetchedPois);

      if (fetchedPois.length > 0) {
        // 1. Fetch total checkins (7 days) for the numbers on icons
        const since7d = new Date(Date.now() - 7 * 86400000).toISOString();
        const { data: allData } = await supabase
          .from('checkins')
          .select('place_id, place_name, persona_name:profiles(display_name)')
          .in('place_id', fetchedPois.map(p => p.id))
          .gte('created_at', since7d);
        
        if (allData) {
          const counts: Record<string, number> = {};
          allData.forEach((c: any) => { counts[c.place_id] = (counts[c.place_id] ?? 0) + 1; });
          setPoiCheckins(counts);
        }

        // 2. Fetch live checkins (last 3 hours) for pulsars & ticker
        const since3h = new Date(Date.now() - 3 * 3600000).toISOString();
        const { data: liveData } = await supabase
          .from('checkins')
          .select('place_id, place_name, created_at, profile:profiles(display_name, avatar_emoji)')
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

  // Geolocation
  const [userLoc, setUserLoc] = useState<[number, number] | null>(null);
  const [nearbyStops, setNearbyStops] = useState<ArretProche[]>([]);
  const [geoLoading, setGeoLoading] = useState(false);
  const [geoError, setGeoError] = useState<string | null>(null);

  // Parse Itinerary from URL
  useEffect(() => {
    const itiParam = searchParams.get('iti');
    if (itiParam) {
      try {
        const parsed = JSON.parse(decodeURIComponent(itiParam));
        setActiveItinerary(parsed);
        setSheetExpanded(true);
      } catch (e) {
        console.error("Failed to parse itinerary", e);
      }
    }
  }, [searchParams]);

  // Fetch Profile & Broadcasts
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

  // Nearest stop to selected POI — for Phase 2 distance display
  useEffect(() => {
    if (!selectedPoi) { setPoiNearestStop(null); return; }
    supabase.rpc('arrets_proches', {
      p_lat: selectedPoi.lat,
      p_lon: selectedPoi.lon,
      p_radius_m: 1000,
      p_limit: 1,
    }).then(({ data }) => {
      if (data && data.length > 0) {
        setPoiNearestStop({ stop_name: data[0].stop_name, distance_m: data[0].distance_m });
      } else {
        setPoiNearestStop(null);
      }
    });
  }, [selectedPoi, supabase]);

  const center: [number, number] = selected
    ? [selected.stop_lat, selected.stop_lon]
    : userLoc ?? ABIDJAN_CENTER;
  const zoom = selected ? 16 : userLoc ? 15 : 12;

  const mapStops: Stop[] = selected
    ? [selected]
    : nearbyStops.map((a) => ({
        stop_id: a.stop_id,
        stop_name: a.stop_name,
        stop_lat: a.stop_lat,
        stop_lon: a.stop_lon,
        commune: a.commune,
      }));

  const handleSearchChange = useCallback(
    (q: string) => {
      setQuery(q);
      if (searchTimerRef.current) clearTimeout(searchTimerRef.current);
      if (q.trim().length < 2) { setResults([]); return; }
      searchTimerRef.current = setTimeout(async () => {
        setIsSearching(true);
        const words = q.trim().split(/\s+/).filter(w => w.length >= 2);
        
        // 1. Search stops with multi-word logic
        let stopsQuery = supabase
          .from('gtfs_stops')
          .select('stop_id, stop_name, stop_lat, stop_lon, commune');
        
        // Apply filter for each word (AND logic across words, OR across fields)
        words.forEach(word => {
          stopsQuery = stopsQuery.or(`stop_name.ilike.%${word}%,commune.ilike.%${word}%`);
        });
        
        // 2. Search places (Supabase POIs + community spots)
        const placesQuery = supabase
          .from('places')
          .select('id, name, lat, lon, category, commune, logo_emoji, cover_color, is_sponsored, sponsor_tier, has_campaign')
          .or(`name.ilike.%${q}%,commune.ilike.%${q}%`)
          .limit(5);

        const [
          { data: searchResults, error: stopError },
          { data: placeResults },
        ] = await Promise.all([stopsQuery.limit(15), placesQuery]);

        setIsSearching(false);

        if (!stopError && searchResults) {
          const enrichedStops = searchResults.map(s => ({
            ...s,
            type: 'stop',
          }));

          const enrichedPlaces = (placeResults || []).map(p => ({
            ...p,
            type: 'place',
            stop_id: `place-${p.id}`,
            stop_name: p.name,
          }));

          const final = [...enrichedPlaces, ...enrichedStops];
          setResults(final as any);
        }
      }, 250);
    },
    [supabase]
  );

  const handleSelectStop = useCallback((stop: Stop) => {
    setSelected(stop);
    setSheetExpanded(true);
    setSearchOpen(false);
    setQuery('');
    setResults([]);
  }, []);

  const handleSelectResult = useCallback((item: any) => {
    if (item.type === 'route') {
      router.push(`/app/ligne/${encodeURIComponent(item.route_id)}`);
    } else if (item.type === 'place') {
      const poi: POI = {
        id: `sp-${item.id}`,
        place_id: item.id,
        name: item.name,
        lat: item.lat,
        lon: item.lon,
        category: item.category ?? 'other',
        logo_emoji: item.logo_emoji ?? '🏢',
        cover_color: item.cover_color ?? '#FF7A00',
        is_sponsored: item.is_sponsored ?? false,
        sponsor_tier: item.sponsor_tier ?? null,
        has_campaign: item.has_campaign ?? false,
        commune: item.commune,
        source: 'supabase',
      };
      setSelectedPoi(poi);
      setSelected(null);
      setSheetExpanded(true);
      setSearchOpen(false);
      setQuery('');
      setResults([]);
    } else {
      handleSelectStop(item);
    }
  }, [handleSelectStop, router]);

  const clearSelection = useCallback(() => {
    setSelected(null);
    setSheetExpanded(nearbyStops.length > 0);
  }, [nearbyStops.length]);

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

  return (
    <div className="flex-1 relative overflow-hidden bg-beige-50 font-sans text-beige-text">

      {/* ── Map ─────────────────────────────────────────────────────────── */}
      <Map
        stops={mapStops}
        center={center}
        zoom={zoom}
        className="absolute inset-0"
        selectedStopId={selected?.stop_id ?? null}
        selectedPoiId={selectedPoi?.id ?? null}
        onStopClick={handleSelectStop}
        onPoiClick={(poi) => { setSelectedPoi(poi); setSelected(null); setSheetExpanded(true); }}
        onMapReady={handleMapReady}
        userLocation={userLoc}
        legs={activeItinerary?.legs?.map((l: any) => ({
          coords: l.coords ?? [],
          mode: l.mode,
          routeColor: l.route?.color,
        })) || null}
        hotspots={heatMode ? hotspots : []}
        explorers={explorers}
        pois={pois}
        poiCheckins={poiCheckins}
        livePois={livePois}
        broadcasts={broadcasts}
      />

      {/* ── Live Ticker ── */}
      {/* Feature restricted to Verified Explorers/Premium viewers */}
      {(profile?.is_verified_explorer || profile?.sub_tier === 'pro' || profile?.sub_tier === 'elite') && liveTickerFeed.length > 0 && (
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
          </button>

          {/* Broadcast (Pro) */}
          {profile && (
            <div className="flex-shrink-0">
               <BroadcastButton userId={profile.id} currentTier={profile.sub_tier} />
            </div>
          )}

        </div>
      </div>

      {/* Geo error toast */}
      {geoError && (
        <div className="bm-toast absolute top-36 left-4 right-4 z-[500] bg-red-50 border-2 border-red-100 rounded-2xl px-5 py-4 text-xs font-black text-red-600 flex items-center justify-between shadow-xl uppercase tracking-widest animate-in slide-in-from-top-4 duration-300">
          <span>{geoError}</span>
          <button
            onClick={() => setGeoError(null)}
            className="ml-4 p-1.5 text-red-300 hover:text-red-500 rounded-full transition"
            aria-label="Fermer"
          >
            <IconX />
          </button>
        </div>
      )}

      {/* ── Bottom sheet ────────────────────────────────────────────────── */}
      <div
        className={`bm-sheet absolute bottom-0 left-0 right-0 z-[500] bg-white rounded-t-[3rem] shadow-[0_-10px_40px_rgba(0,0,0,0.1)] transition-transform duration-500 ease-out border-t-2 border-beige-100 ${
          sheetExpanded ? 'translate-y-0' : 'translate-y-[calc(100%-88px)]'
        }`}
      >
        {/* Handle */}
        <div
          className="flex flex-col items-center pt-4 pb-2 cursor-pointer select-none"
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
        )}

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

                  <Link
                    href="/app/itineraire"
                    className="flex items-center justify-center gap-3 bg-beige-50 hover:bg-beige-100 text-beige-text text-sm font-black px-6 py-5 rounded-3xl transition-all border-2 border-beige-100"
                  >
                    <IconRoute />
                    ITINÉRAIRE
                  </Link>

                  <button
                    onClick={openSearch}
                    className="flex items-center justify-center gap-3 bg-beige-50 hover:bg-beige-100 text-beige-text text-sm font-black px-6 py-5 rounded-3xl transition-all border-2 border-beige-100"
                  >
                    <IconSearch />
                    AUTRE ARRÊT
                  </button>
                </div>
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
              </div>
            ) : (
              /* ── Empty state with tabs ── */
              <div className="animate-in fade-in slide-in-from-bottom-4 duration-300">
                {/* Tabs */}
                <div className="flex gap-2 bg-beige-100/50 p-1.5 rounded-2xl mb-8 border border-beige-200/30">
                  <button
                    onClick={() => setSheetTab('explorer')}
                    className={`flex-1 text-xs font-black py-3 rounded-[1.25rem] transition-all uppercase tracking-widest ${
                      sheetTab === 'explorer'
                        ? 'bg-white text-abidjan-orange shadow-md'
                        : 'text-beige-muted'
                    }`}
                  >
                    🗺️ Explorer
                  </button>
                  <button
                    onClick={() => setSheetTab('activite')}
                    className={`flex-1 text-xs font-black py-3 rounded-[1.25rem] transition-all uppercase tracking-widest ${
                      sheetTab === 'activite'
                        ? 'bg-white text-abidjan-orange shadow-md'
                        : 'text-beige-muted'
                    }`}
                  >
                    💬 Activité
                  </button>
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
                      </div>
                    )}

                    {/* Community Activity Feed */}
                    <div>
                        <div className="flex items-center gap-2 mb-4 px-2">
                           <span className="text-xl">👥</span>
                           <span className="text-[10px] font-black uppercase tracking-[0.2em] text-abidjan-blue">Dernières visites</span>
                        </div>
                        <div className="space-y-4">
                           {communityFeed.length > 0 ? communityFeed.map((post, idx) => (
                              <div key={idx} className="flex gap-4 p-4 bg-beige-50/50 rounded-3xl border border-beige-100 group hover:border-abidjan-orange/30 transition-all">
                                 <div className="relative flex-shrink-0">
                                    <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center text-xl shadow-sm border border-beige-100 group-hover:scale-105 transition-transform">
                                       {post.profile?.avatar_emoji || '👤'}
                                    </div>
                                    {post.profile?.is_verified_explorer && (
                                       <div className="absolute -top-1 -right-1 w-5 h-5 bg-abidjan-orange rounded-full border-2 border-white flex items-center justify-center text-[10px] text-white">✓</div>
                                    )}
                                 </div>
                                 <div className="flex-1 min-w-0">
                                    <div className="flex items-baseline justify-between gap-2 mb-1">
                                       <span className="text-sm font-black text-beige-text truncate">
                                          {post.profile?.display_name || 'Explorateur'}
                                       </span>
                                       <span className="text-[9px] font-bold text-beige-muted uppercase tracking-widest whitespace-nowrap">
                                          {new Date(post.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                       </span>
                                    </div>
                                    <div className="text-xs text-beige-muted font-medium leading-relaxed">
                                       À <span className="text-abidjan-orange font-bold">{post.place_name}</span>
                                    </div>
                                    <div className="mt-2.5 flex items-center gap-3">
                                       <div className="flex items-center gap-1 bg-white px-2 py-0.5 rounded-lg border border-beige-100">
                                          <span className="text-[10px]">⭐</span>
                                          <span className="text-[9px] font-black text-beige-text">+{post.points_earned} XP</span>
                                       </div>
                                       <button className="text-[9px] font-black uppercase tracking-widest text-abidjan-blue hover:underline">
                                          Saluer 👋
                                       </button>
                                    </div>
                                 </div>
                              </div>
                           )) : (
                              <div className="text-center py-10 opacity-50">
                                 <div className="text-3xl mb-4">💤</div>
                                 <p className="text-[10px] font-black uppercase tracking-widest">Abidjan dort ? Fais un check-in !</p>
                              </div>
                           )}
                        </div>
                    </div>

                    <div className="text-center pt-4">
                        <Link
                           href="/app/ccomment"
                           className="inline-flex items-center gap-3 bg-beige-50 border-2 border-beige-200 text-beige-muted text-[10px] font-black px-8 py-3 rounded-2xl uppercase tracking-widest hover:border-abidjan-orange hover:text-abidjan-orange transition-all"
                        >
                           <span>💬</span> Voir tous les avis
                        </Link>
                    </div>

                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>

      {/* ── Search overlay ──────────────────────────────────────────────── */}
      {searchOpen && (
        <div className="bm-search-overlay fixed inset-0 z-[600] bg-beige-50 flex flex-col animate-in slide-in-from-bottom-8 duration-500">
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

          <div className="flex-1 overflow-y-auto px-5 py-6">
            {results.length > 0 ? (
              <ul className="space-y-3">
                {results.map((s) => (
                  <li
                    key={`${s.type}-${s.stop_id}`}
                    onClick={() => handleSelectResult(s)}
                    className="flex items-center gap-4 bg-white rounded-3xl p-5 border-2 border-beige-100 hover:border-abidjan-orange/30 shadow-sm hover:shadow-lg transition-all cursor-pointer group"
                    role="button"
                  >
                    <div className="w-12 h-12 rounded-2xl bg-beige-50 flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform text-xl">
                      {s.type === 'route' ? '🚌' : s.type === 'place' ? (s.logo_emoji ?? '🏢') : <IconPin />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-base font-black text-beige-text group-hover:text-abidjan-orange transition-colors">
                        {s.type === 'route' && (
                          <span className="text-[10px] bg-abidjan-orange/10 text-abidjan-orange px-2 py-0.5 rounded-md mr-2 uppercase tracking-widest">Ligne</span>
                        )}
                        {s.type === 'place' && (
                          <span className="text-[10px] bg-abidjan-green/10 text-abidjan-green px-2 py-0.5 rounded-md mr-2 uppercase tracking-widest">Lieu</span>
                        )}
                        {s.stop_name}
                      </div>
                      <div className="flex items-center gap-2 mt-1">
                        {s.commune && <div className="text-[10px] text-beige-muted font-bold uppercase tracking-[0.2em]">{s.commune}</div>}
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            ) : query.trim().length >= 2 && !isSearching ? (
              <div className="flex flex-col items-center py-20 gap-6">
                <div className="text-6xl">🔍</div>
                <p className="text-base font-bold text-beige-muted uppercase tracking-widest">Aucun résultat trouvé</p>
              </div>
            ) : (
              <div className="space-y-8">
                <div className="text-[10px] uppercase tracking-[0.2em] text-beige-muted font-black px-2">
                  Suggestions populaires
                </div>
                <div className="grid grid-cols-1 gap-3">
                  {SUGGESTIONS.map((s) => (
                    <button
                      key={s}
                      onClick={() => handleSearchChange(s)}
                      className="w-full text-left flex items-center gap-4 px-6 py-5 bg-white border-2 border-beige-100 rounded-3xl hover:border-abidjan-orange transition-all font-black text-beige-text group"
                    >
                      <span className="text-beige-200 group-hover:text-abidjan-orange transition-colors"><IconSearch /></span>
                      {s}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
