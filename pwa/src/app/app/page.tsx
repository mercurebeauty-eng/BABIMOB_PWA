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
import { motion, useAnimation, PanInfo, AnimatePresence } from 'framer-motion';

const Map = dynamic(() => import('@/components/Map'), {
  ssr: false,
  loading: () => (
    <div className="absolute inset-0 bg-bm-obsidian flex items-center justify-center">
      <div className="flex flex-col items-center gap-6">
        <div className="w-20 h-20 bg-bm-orange rounded-[2.5rem] flex items-center justify-center shadow-2xl shadow-bm-orange/40 animate-pulse">
           <span className="text-4xl">🦁</span>
        </div>
        <div className="text-center">
          <div className="text-xl font-black italic uppercase tracking-tighter text-white">BABIMOB</div>
          <div className="text-[10px] font-black text-white/40 uppercase tracking-[0.3em] mt-2">Chargement de la ville…</div>
        </div>
      </div>
    </div>
  ),
});

const ABIDJAN_CENTER: [number, number] = [5.345, -4.020];
const SUGGESTIONS = ['Adjamé gare', 'Zone 4', 'Cocody', 'Riviera 2', 'Plateau'];

function formatDistance(m: number): string {
  return m < 1000 ? `${Math.round(m)} m` : `${(m / 1000).toFixed(1)} km`;
}

/* ── UI Components ──────────────────────────────────────────────────────────── */

const TopPill = ({ onClick, selectedName, onClear }: { onClick: () => void, selectedName?: string, onClear: () => void }) => (
  <button
    onClick={onClick}
    className="w-full flex items-center gap-3 bg-white/90 dark:bg-bm-obsidian/90 backdrop-blur-2xl rounded-3xl shadow-2xl border border-white/20 p-4 transition-all hover:border-bm-orange/40 active:scale-95"
  >
    <div className="w-8 h-8 rounded-xl bg-bm-orange flex items-center justify-center text-white flex-shrink-0">
       <span className="text-sm">🦁</span>
    </div>
    <div className="flex-1 text-left overflow-hidden">
       <div className="text-[10px] font-black uppercase tracking-widest text-bm-orange mb-0.5">Destination</div>
       <div className="text-sm font-bold text-bm-obsidian dark:text-white truncate">
          {selectedName || "Arrêt, quartier ou lieu…"}
       </div>
    </div>
    <div className="p-2 bg-gray-50 dark:bg-white/5 rounded-xl text-bm-orange">
       <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
          <circle cx="11" cy="11" r="8" /><path d="m21 21-4.35-4.35" strokeLinecap="round" />
       </svg>
    </div>
    {selectedName && (
       <div onClick={(e) => { e.stopPropagation(); onClear(); }} className="p-2 hover:bg-gray-100 dark:hover:bg-white/10 rounded-xl">
          <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
             <path d="M18 6 6 18M6 6l12 12" strokeLinecap="round" />
          </svg>
       </div>
    )}
  </button>
);

const FAB = ({ onClick, active, icon, label, primary }: { onClick?: () => void, active?: boolean, icon: string, label: string, primary?: boolean }) => (
  <button
    onClick={onClick}
    className={`bm-fab flex flex-col gap-1 ${primary ? 'bg-bm-orange text-white border-bm-orange/20' : (active ? 'bg-bm-blue text-white' : '')}`}
  >
    <span className="text-xl">{icon}</span>
    {/* Optional: <span className="text-[8px] font-black uppercase">{label}</span> */}
  </button>
);

export default function AppPage() {
  return (
    <Suspense fallback={<div className="flex-1 bg-bm-obsidian animate-pulse" />}>
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
        const { data: allData } = await supabase.from('checkins').select('place_id').in('place_id', fetchedPois.map(p => p.id)).gte('created_at', since7d);
        if (allData) {
          const counts: Record<string, number> = {};
          allData.forEach((c: any) => { counts[c.place_id] = (counts[c.place_id] ?? 0) + 1; });
          setPoiCheckins(counts);
        }
        const since3h = new Date(Date.now() - 3 * 3600000).toISOString();
        const { data: liveData } = await supabase.from('checkins').select('place_id, place_name, profile:profiles(id, display_name, avatar_emoji, is_public_visits)').in('place_id', fetchedPois.map(p => p.id)).gte('created_at', since3h).order('created_at', { ascending: false });
        if (liveData) {
          setLivePois(Array.from(new Set(liveData.map(d => d.place_id))));
          const filteredTicker = liveData.map(d => ({ ...d, display_name: (d.profile as any)?.is_public_visits ? (d.profile as any).display_name : "Explorateur" })).slice(0, 5);
          setLiveTickerFeed(filteredTicker);
          filteredTicker.forEach(d => { if ((d.profile as any)?.id) logReach((d.profile as any).id, 'ticker'); });
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

  const [userLoc, setUserLoc] = useState<[number, number] | null>(null);
  const [nearbyStops, setNearbyStops] = useState<ArretProche[]>([]);
  const [geoLoading, setGeoLoading] = useState(false);
  const [geoError, setGeoError] = useState<string | null>(null);

  useEffect(() => {
    const itiParam = searchParams.get('iti');
    if (itiParam) {
      try {
        const parsed = JSON.parse(decodeURIComponent(itiParam));
        setActiveItinerary(parsed);
        setSheetExpanded(true);
      } catch (e) { console.error(e); }
    }
  }, [searchParams]);

  useEffect(() => {
    async function loadData() {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data } = await supabase.from('profiles').select('*').eq('id', user.id).single();
        setProfile(data);
      }
      const fourHoursAgo = new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString();
      const { data: bc } = await supabase.from('profiles').select('id, display_name, avatar_emoji, last_broadcast_at, broadcast_text, broadcast_lat, broadcast_lon, sub_tier, is_public_visits').not('last_broadcast_at', 'is', null).gt('last_broadcast_at', fourHoursAgo);
      if (bc) {
        setBroadcasts(bc);
        const publicExplorers = bc.filter((p: any) => p.is_public_visits && p.broadcast_lat && p.broadcast_lon);
        setExplorers(publicExplorers.map((p: any) => ({ lat: p.broadcast_lat, lon: p.broadcast_lon, name: p.display_name ?? 'Explorateur', emoji: p.avatar_emoji ?? '🧭' })));
        publicExplorers.forEach((p: any) => logReach(p.id, 'map'));
        bc.filter((p: any) => p.broadcast_text).forEach((p: any) => logReach(p.id, 'broadcast'));
      }
      const { data: globalFeed } = await supabase.from('checkins').select('id, place_id, place_name, created_at, points_earned, profile:profiles(id, display_name, avatar_emoji, is_verified_explorer, is_public_visits)').order('created_at', { ascending: false }).limit(10);
      if (globalFeed) {
        const publicFeed = globalFeed.filter((f: any) => f.profile?.is_public_visits);
        setCommunityFeed(publicFeed);
        publicFeed.forEach((f: any) => { if (f.profile?.id) logReach(f.profile.id, 'feed'); });
        const counts: Record<string, { count: number, name: string }> = {};
        globalFeed.forEach((f: any) => { if (!counts[f.place_id]) counts[f.place_id] = { count: 0, name: f.place_name }; counts[f.place_id].count++; });
        setTrendingPlaces(Object.entries(counts).sort((a,b) => b[1].count - a[1].count).slice(0, 3).map(([id, val]) => ({ id, name: val.name, count: val.count })));
      }
    }
    loadData();
  }, [supabase, logReach]);

  useEffect(() => {
    if (!selectedPoi) { setPoiNearestStop(null); return; }
    supabase.rpc('arrets_proches', { p_lat: selectedPoi.lat, p_lon: selectedPoi.lon, p_radius_m: 1000, p_limit: 1 }).then(({ data }) => {
      if (data && data.length > 0) setPoiNearestStop({ stop_name: data[0].stop_name, distance_m: data[0].distance_m });
    });
  }, [selectedPoi, supabase]);

  const handleSearchChange = useCallback((q: string) => {
    setQuery(q);
    if (searchTimerRef.current) clearTimeout(searchTimerRef.current);
    if (q.trim().length < 2) { setResults([]); return; }
    searchTimerRef.current = setTimeout(async () => {
      setIsSearching(true);
      const words = q.trim().split(/\s+/).filter(w => w.length >= 2);
      let stopsQuery = supabase.from('gtfs_stops').select('stop_id, stop_name, stop_lat, stop_lon, commune');
      words.forEach(word => { stopsQuery = stopsQuery.or(`stop_name.ilike.%${word}%,commune.ilike.%${word}%`); });
      const placesQuery = supabase.from('places').select('id, name, lat, lon, category, commune, logo_emoji, cover_color, is_sponsored, sponsor_tier, has_campaign').or(`name.ilike.%${q}%,commune.ilike.%${q}%`).limit(5);
      const [{ data: searchResults }, { data: placeResults }] = await Promise.all([stopsQuery.limit(10), placesQuery]);
      setIsSearching(false);
      if (searchResults) {
        const final = [...(placeResults || []).map(p => ({ ...p, type: 'place', stop_id: `place-${p.id}`, stop_name: p.name })), ...searchResults.map(s => ({ ...s, type: 'stop' }))];
        setResults(final as any);
      }
    }, 250);
  }, [supabase]);

  const handleSelectStop = useCallback((stop: Stop) => {
    setSelected(stop); setSelectedPoi(null); setActiveItinerary(null); setSheetExpanded(true); setSearchOpen(false); setQuery(''); setResults([]);
  }, []);

  const handleSelectResult = useCallback((item: any) => {
    if (item.type === 'route') { router.push(`/app/ligne/${encodeURIComponent(item.route_id)}`); }
    else if (item.type === 'place') {
      const poi: POI = { id: `sp-${item.id}`, place_id: item.id, name: item.name, lat: item.lat, lon: item.lon, category: item.category ?? 'other', logo_emoji: item.logo_emoji ?? '🏢', cover_color: item.cover_color ?? '#FF7A00', is_sponsored: item.is_sponsored ?? false, sponsor_tier: item.sponsor_tier ?? null, has_campaign: item.has_campaign ?? false, commune: item.commune, source: 'supabase' };
      setSelectedPoi(poi); setSelected(null); setActiveItinerary(null); setSheetExpanded(true); setSearchOpen(false); setQuery(''); setResults([]);
    } else { handleSelectStop(item); }
  }, [handleSelectStop, router]);

  const handleLocateMe = useCallback(async () => {
    if (!navigator.geolocation) { setGeoError("GPS non disponible."); return; }
    if (watchIdRef.current !== null) { navigator.geolocation.clearWatch(watchIdRef.current); watchIdRef.current = null; }
    setGeoLoading(true); setGeoError(null);
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const lat = pos.coords.latitude; const lon = pos.coords.longitude; setUserLoc([lat, lon]); setSelected(null);
        const { data, error } = await supabase.rpc('arrets_proches', { p_lat: lat, p_lon: lon, p_radius_m: 800, p_limit: 15 });
        setGeoLoading(false);
        if (!error && data) { setNearbyStops(data as ArretProche[]); setSheetExpanded(data.length > 0); }
        watchIdRef.current = navigator.geolocation.watchPosition((p) => setUserLoc([p.coords.latitude, p.coords.longitude]), () => {}, { enableHighAccuracy: true });
      },
      (err) => { setGeoLoading(false); setGeoError(err.code === 1 ? "Localisation refusée." : "Erreur GPS."); },
      { enableHighAccuracy: true, timeout: 8000 }
    );
  }, [supabase]);

  const clearSelection = useCallback(() => { setSelected(null); setSelectedPoi(null); setActiveItinerary(null); setSheetExpanded(nearbyStops.length > 0); }, [nearbyStops.length]);

  return (
    <div className="flex-1 relative overflow-hidden bg-bm-obsidian font-sans h-[100dvh]">

      {/* ── Background Map ── */}
      <Map
        stops={selected ? [selected] : nearbyStops.map(a => ({ stop_id: a.stop_id, stop_name: a.stop_name, stop_lat: a.stop_lat, stop_lon: a.stop_lon }))}
        center={selected ? [selected.stop_lat, selected.stop_lon] : (userLoc ?? ABIDJAN_CENTER)}
        zoom={selected ? 16 : (userLoc ? 15 : 12)}
        className="absolute inset-0 z-0"
        selectedStopId={selected?.stop_id ?? null}
        selectedPoiId={selectedPoi?.id ?? null}
        onStopClick={handleSelectStop}
        onPoiClick={(poi) => { setSelectedPoi(poi); setSelected(null); setActiveItinerary(null); setSheetExpanded(true); }}
        onMapReady={handleMapReady}
        userLocation={userLoc}
        legs={activeItinerary?.legs?.map((l: any) => ({ coords: l.coords ?? [], mode: l.mode, routeColor: l.route?.color })) || null}
        hotspots={heatMode ? hotspots : []}
        explorers={explorers}
        pois={pois}
        poiCheckins={poiCheckins}
        livePois={livePois}
        broadcasts={broadcasts}
      />

      {/* ── Community Live Ticker ── */}
      {(profile?.is_verified_explorer || profile?.sub_tier) && liveTickerFeed.length > 0 && (
        <div className="absolute top-28 left-0 right-0 z-[100] pointer-events-none">
           <div className="h-10 overflow-hidden">
              <div className="flex gap-4 animate-marquee whitespace-nowrap px-6">
                 {liveTickerFeed.map((checkin, i) => (
                    <motion.div key={i} initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="inline-flex items-center gap-2 bg-bm-obsidian/40 backdrop-blur-xl border border-white/10 px-3 py-1.5 rounded-full shadow-2xl">
                       <span className="text-[10px] font-black uppercase tracking-widest text-bm-orange">Live</span>
                       <span className="text-[10px] font-bold text-white/90">{checkin.display_name} est à <span className="text-bm-orange">{checkin.place_name}</span></span>
                    </motion.div>
                 ))}
              </div>
           </div>
        </div>
      )}

      {/* ── Top Bar (Floating Pill) ── */}
      <div className="absolute top-8 left-6 right-6 z-[200]">
         <TopPill 
            onClick={() => setSearchOpen(true)} 
            selectedName={selected?.stop_name || selectedPoi?.name || activeItinerary?.to?.name} 
            onClear={clearSelection}
         />
      </div>

      {/* ── Floating Action Buttons (Vertical Stack) ── */}
      <div className="absolute top-28 right-6 z-[200] flex flex-col gap-3">
         <Link href="/app/compte">
            <FAB icon={profile?.avatar_emoji || "👤"} label="Profil" />
         </Link>
         <Link href="/app/itineraire">
            <FAB icon="🚀" label="Route" active={!!activeItinerary} />
         </Link>
         <FAB 
            icon={heatMode ? "🔥" : "❄️"} 
            label="Activité" 
            active={heatMode} 
            onClick={() => setHeatMode(!heatMode)} 
         />
         {profile && (
            <div className="pointer-events-auto">
               <BroadcastButton userId={profile.id} currentTier={profile.sub_tier} />
            </div>
         )}
      </div>

      {/* ── Geolocation Tool (Small separate FAB) ── */}
      <div className="absolute bottom-32 right-6 z-[200]">
         <motion.button
            onClick={handleLocateMe}
            whileTap={{ scale: 0.9 }}
            className={`w-12 h-12 rounded-2xl flex items-center justify-center shadow-2xl transition-all border-2 ${userLoc ? 'bg-bm-orange text-white border-bm-orange/20' : 'bg-white dark:bg-bm-obsidian text-bm-obsidian dark:text-white border-white dark:border-white/10'}`}
         >
            {geoLoading ? (
               <div className="w-5 h-5 border-2 border-current/30 border-t-current rounded-full animate-spin" />
            ) : (
               <svg viewBox="0 0 24 24" className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth="3"><circle cx="12" cy="12" r="3" fill="currentColor"/><path d="M12 2v3M12 19v3M2 12h3M19 12h3" strokeLinecap="round" /><circle cx="12" cy="12" r="8" /></svg>
            )}
         </motion.button>
      </div>

      {/* ── Error Toast ── */}
      <AnimatePresence>
         {geoError && (
            <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }} className="absolute bottom-32 left-6 right-20 z-[200] bg-bm-obsidian border border-red-500/50 p-4 rounded-2xl shadow-2xl flex items-center justify-between">
               <span className="text-[10px] font-black uppercase tracking-widest text-red-500">{geoError}</span>
               <button onClick={() => setGeoError(null)} className="text-white/20 hover:text-white transition">✕</button>
            </motion.div>
         )}
      </AnimatePresence>

      {/* ── Bottom Sheet (Framer Motion) ── */}
      <motion.div
        drag="y"
        dragConstraints={{ top: 0, bottom: 0 }}
        dragElastic={0.15}
        onDragEnd={(e, info) => {
          if (info.offset.y > 60 || info.velocity.y > 300) setSheetExpanded(false);
          else if (info.offset.y < -60 || info.velocity.y < -300) setSheetExpanded(true);
        }}
        initial={false}
        animate={{ y: sheetExpanded ? 0 : 'calc(100% - 100px)' }}
        transition={{ type: 'spring', damping: 25, stiffness: 200, mass: 0.8 }}
        className="bm-sheet absolute bottom-0 left-0 right-0 z-[500] h-[85vh] touch-none pt-2 flex flex-col"
      >
        <div className="bm-sheet-handle" onClick={() => setSheetExpanded(!sheetExpanded)} />

        {/* Peek Content (Collapsed Mode) */}
        {!sheetExpanded && (
           <div className="px-6 py-2 flex items-center justify-between pointer-events-auto">
              <div className="flex-1 truncate">
                 <div className="text-[9px] font-black uppercase tracking-widest text-bm-orange mb-0.5">Exploration</div>
                 <div className="text-base font-black text-bm-obsidian dark:text-white truncate">
                   {selected ? selected.stop_name : selectedPoi ? selectedPoi.name : nearbyStops.length > 0 ? `${nearbyStops.length} arrêts proches` : "À l'écoute d'Abidjan..."}
                 </div>
              </div>
              <button 
                 onClick={() => setSheetExpanded(true)}
                 className="w-10 h-10 rounded-xl bg-bm-orange/10 dark:bg-bm-orange/20 text-bm-orange flex items-center justify-center"
              >
                <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><path d="m18 15-6-6-6 6" strokeLinecap="round" strokeLinejoin="round" /></svg>
              </button>
           </div>
        )}

        {/* Full Content (Expanded Mode) */}
        {sheetExpanded && (
           <div className="flex-1 overflow-y-auto px-6 pt-4 pb-20 pointer-events-auto">
              {selectedPoi ? (
                 <div className="space-y-6 animate-in slide-in-from-bottom-5 duration-500">
                    <div className="flex items-start justify-between">
                       <div className="flex gap-4">
                          <div className="w-16 h-16 rounded-3xl flex items-center justify-center text-3xl shadow-xl border border-white/20" style={{ background: selectedPoi.cover_color, color: '#fff' }}>
                             {selectedPoi.logo_emoji}
                          </div>
                          <div>
                             <div className="text-[10px] font-black uppercase tracking-[0.2em] text-bm-orange">{selectedPoi.category}</div>
                             <h2 className="text-2xl font-black text-bm-obsidian dark:text-white italic leading-tight">{selectedPoi.name}</h2>
                             <div className="text-xs font-bold text-gray-400 mt-1 uppercase tracking-widest">{selectedPoi.commune}</div>
                          </div>
                       </div>
                       <PoiFavoriteButton placeId={selectedPoi.place_id ?? selectedPoi.id} placeName={selectedPoi.name} commune={selectedPoi.commune} lat={selectedPoi.lat} lon={selectedPoi.lon} userId={profile?.id ?? null} />
                    </div>

                    <PoiCheckInButton placeId={selectedPoi.id} placeName={selectedPoi.name} commune={selectedPoi.commune} lat={selectedPoi.lat} lon={selectedPoi.lon} />

                    <div className="grid grid-cols-2 gap-3">
                       <button onClick={() => handleGetDirections(selectedPoi)} className="bg-bm-blue text-white py-4 rounded-2xl font-black uppercase tracking-widest text-[10px] shadow-xl">S'y Rendre</button>
                       {selectedPoi.whatsapp && <a href={`https://wa.me/${selectedPoi.whatsapp.replace(/\D/g, '')}`} className="bg-[#25D366] text-white py-4 rounded-2xl font-black uppercase tracking-widest text-[10px] text-center shadow-xl">WhatsApp</a>}
                    </div>
                 </div>
              ) : activeItinerary ? (
                 <div className="animate-in slide-in-from-left-5 duration-500 space-y-8 pb-10">
                    <div className="flex justify-between items-center">
                       <h2 className="text-3xl font-black italic uppercase tracking-tighter">Ton Trajet</h2>
                       <button onClick={() => setActiveItinerary(null)} className="text-gray-400">✕ Annuler</button>
                    </div>
                    <div className="space-y-4">
                       {activeItinerary.legs.map((leg: any, idx: number) => (
                          <div key={idx} className="flex gap-4 p-4 rounded-3xl bg-gray-50 dark:bg-white/5 border border-white/5">
                             <div className="text-2xl">{leg.mode === 'WALK' ? '🚶' : '🚐'}</div>
                             <div className="flex-1 min-w-0">
                                <div className="text-[10px] font-black uppercase text-bm-orange">{leg.mode === 'WALK' ? 'Marche' : 'Transport'}</div>
                                <div className="text-sm font-bold truncate">{leg.mode === 'WALK' ? 'Marcher vers destination' : `Prendre ${leg.route?.longName || 'ligne'}`}</div>
                                <div className="text-[9px] font-black text-gray-400 uppercase tracking-widest mt-2">{Math.round(leg.duration/60)} min • {formatDistance(leg.distance)}</div>
                             </div>
                          </div>
                       ))}
                    </div>
                 </div>
              ) : selected ? (
                <div className="animate-in fade-in slide-in-from-bottom-4 duration-300">
                    <h2 className="text-3xl font-black italic uppercase tracking-tighter mb-1">{selected.stop_name}</h2>
                    <div className="text-xs font-bold text-bm-orange uppercase tracking-widest mb-8">{selected.commune}</div>
                    <div className="grid grid-cols-1 gap-4">
                        <button onClick={() => router.push(`/app/arret/${encodeURIComponent(selected.stop_id)}`)} className="bg-bm-orange text-white py-5 rounded-[2rem] font-black uppercase tracking-widest shadow-2xl">VOIR LES LIGNES →</button>
                        <button onClick={() => router.push(`/app/itineraire`)} className="bg-bm-blue text-white py-5 rounded-[2rem] font-black uppercase tracking-widest shadow-2xl">ITINÉRAIRE</button>
                    </div>
                </div>
              ) : nearbyStops.length > 0 ? (
                 <div className="animate-in slide-in-from-bottom-4 duration-500 space-y-4">
                    <div className="flex items-baseline justify-between mb-2">
                       <h3 className="text-[10px] font-black uppercase tracking-widest text-bm-orange">Arrêts à proximité</h3>
                       <button onClick={() => setNearbyStops([])} className="text-[10px] text-gray-400 font-bold">Effacer</button>
                    </div>
                    <div className="grid grid-cols-1 gap-3">
                       {nearbyStops.map(a => (
                          <div key={a.stop_id} onClick={() => handleSelectStop({ ...a })} className="flex items-center gap-4 p-4 rounded-[2rem] bg-gray-50 dark:bg-white/5 group active:scale-95 transition-all">
                             <div className="w-12 h-12 rounded-2xl bg-white dark:bg-white/10 flex items-center justify-center text-xl shadow-sm">📍</div>
                             <div className="flex-1 truncate">
                                <div className="text-sm font-black truncate">{a.stop_name}</div>
                                <div className="text-[9px] font-bold text-gray-400 uppercase tracking-widest">{a.commune}</div>
                             </div>
                             <div className="text-[10px] font-black text-bm-orange bg-bm-orange/10 px-3 py-1 rounded-full">{formatDistance(a.distance_m)}</div>
                          </div>
                       ))}
                    </div>
                 </div>
              ) : (
                 <div className="flex flex-col h-full animate-in fade-in duration-500">
                    <div className="flex gap-2 p-1.5 bg-gray-100 dark:bg-white/5 rounded-2xl mb-8">
                       {(['explorer', 'activite'] as const).map(tab => (
                          <button key={tab} onClick={() => setSheetTab(tab)} className={`flex-1 py-3 text-[10px] font-black uppercase tracking-widest rounded-xl transition-all ${sheetTab === tab ? 'bg-white dark:bg-bm-orange text-bm-obsidian dark:text-white shadow-xl' : 'text-gray-400'}`}>
                             {tab === 'explorer' ? '🧭 Explorer' : '💬 Activité'}
                          </button>
                       ))}
                    </div>
                    {sheetTab === 'explorer' ? (
                       <div className="py-6 space-y-8">
                          <div className="flex flex-col items-center text-center gap-4 mb-4">
                             <div className="w-20 h-20 bg-gray-100 dark:bg-white/5 rounded-[2.5rem] flex items-center justify-center text-4xl">🗺️</div>
                             <p className="text-sm font-bold text-gray-400 leading-relaxed px-10 tracking-tight">Abidjan est vaste. <br /> Par où commence-ton ?</p>
                          </div>
                          <div className="grid gap-4">
                             <button onClick={() => setSearchOpen(true)} className="bg-bm-orange text-white py-5 rounded-[2rem] font-black uppercase tracking-widest shadow-2xl">Lancer une recherche</button>
                             <button onClick={handleLocateMe} className="bg-bm-blue text-white py-5 rounded-[2rem] font-black uppercase tracking-widest shadow-2xl">Ma Position GPS</button>
                          </div>
                       </div>
                    ) : (
                       <div className="space-y-8 pb-10">
                          {communityFeed.map((post, i) => (
                             <div key={i} className="flex gap-4 p-4 rounded-[2rem] bg-gray-50 dark:bg-white/5">
                                <div className="text-xl w-10 h-10 rounded-2xl bg-white dark:bg-white/10 flex items-center justify-center border border-white/10 flex-shrink-0">
                                   {post.profile?.avatar_emoji || '👤'}
                                </div>
                                <div className="flex-1 min-w-0">
                                   <div className="flex justify-between items-center mb-1">
                                      <span className="text-xs font-black truncate">{post.profile?.display_name || 'Explorateur'}</span>
                                      <span className="text-[8px] font-bold text-gray-400">{new Date(post.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                                   </div>
                                   <div className="text-xs text-gray-400 font-medium">À <span className="text-bm-orange font-bold italic">{post.place_name}</span></div>
                                   <div className="mt-3 flex items-center gap-2">
                                      <div className="text-[9px] font-black bg-bm-orange/10 text-bm-orange px-2 py-0.5 rounded-full">+{post.points_earned} XP</div>
                                   </div>
                                </div>
                             </div>
                          ))}
                       </div>
                    )}
                 </div>
              )}
           </div>
        )}
      </motion.div>

      {/* ── Search Overlay ── */}
      <AnimatePresence>
        {searchOpen && (
          <motion.div initial={{ opacity: 0, y: '100%' }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: '100%' }} className="fixed inset-0 z-[600] bg-white dark:bg-bm-obsidian flex flex-col">
             <div className="pt-12 px-6 pb-6 border-b border-gray-100 dark:border-white/5 flex items-center gap-4">
                <button onClick={() => setSearchOpen(false)} className="p-2 text-bm-orange">
                   <svg viewBox="0 0 24 24" className="w-8 h-8" fill="none" stroke="currentColor" strokeWidth="3"><path d="m15 18-6-6 6-6" strokeLinecap="round" strokeLinejoin="round" /></svg>
                </button>
                <input 
                  autoFocus 
                  type="text" 
                  value={query} 
                  onChange={(e) => handleSearchChange(e.target.value)} 
                  placeholder="Quartier, gare, maquis..." 
                  className="flex-1 bg-transparent text-2xl font-black italic tracking-tighter placeholder:text-gray-300 outline-none"
                />
                {isSearching && <div className="w-6 h-6 border-4 border-bm-orange/30 border-t-bm-orange rounded-full animate-spin" />}
             </div>
             <div className="flex-1 overflow-y-auto p-6 space-y-4">
                {results.length > 0 ? results.map((r, i) => (
                   <div key={i} onClick={() => handleSelectResult(r)} className="flex items-center gap-4 p-5 rounded-[2.5rem] bg-gray-50 dark:bg-white/5 active:scale-95 transition-all">
                      <div className="w-12 h-12 rounded-2xl bg-white dark:bg-white/10 flex items-center justify-center text-xl shadow-sm">
                         {r.type === 'place' ? (r.logo_emoji ?? '🏢') : '📍'}
                      </div>
                      <div className="flex-1 truncate">
                         <div className="text-[8px] font-black uppercase text-bm-orange mb-0.5 tracking-widest">{r.type}</div>
                         <div className="text-base font-black truncate italic">{r.stop_name}</div>
                         <div className="text-[9px] font-bold text-gray-400 uppercase tracking-widest">{r.commune}</div>
                      </div>
                   </div>
                )) : (
                   <div className="space-y-6">
                      <p className="text-[10px] font-black uppercase tracking-widest text-bm-orange px-2">Suggestions</p>
                      <div className="flex flex-wrap gap-2">
                         {SUGGESTIONS.map(s => (
                            <button key={s} onClick={() => handleSearchChange(s)} className="px-6 py-4 rounded-full bg-gray-50 dark:bg-white/5 border border-white/10 text-xs font-bold">{s}</button>
                         ))}
                      </div>
                   </div>
                )}
             </div>
          </motion.div>
        )}
      </AnimatePresence>

      <style jsx global>{`
        .bm-user-marker { border-radius: 50% / 50%; }
        .scrollbar-hide::-webkit-scrollbar { display: none; }
        .perspective-1000 { perspective: 1000px; }
      `}</style>
    </div>
  );
}
