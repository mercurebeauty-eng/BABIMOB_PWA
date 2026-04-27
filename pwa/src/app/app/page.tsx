'use client';

import dynamic from 'next/dynamic';
import { useState, useRef, useCallback, useEffect, Suspense } from 'react';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import type { Stop, ArretProche } from '@/lib/types';
import type { POI } from '@/lib/poi';
import { useRouter, useSearchParams } from 'next/navigation';
import { Vehicle } from '@/components/ui/Vehicle';
import { Ic } from '@/components/ui/Ic';
import BroadcastButton from '@/components/BroadcastButton';

const Map = dynamic(() => import('@/components/Map'), {
  ssr: false,
  loading: () => (
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

  const [searchOpen, setSearchOpen] = useState(false);
  const [profile, setProfile] = useState<any>(null);
  const [selected, setSelected] = useState<Stop | null>(null);
  const [sheet, setSheet] = useState<'peek' | 'half' | 'full'>('peek');
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [activeItinerary, setActiveItinerary] = useState<any | null>(null);
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
          .gte('created_at', since3h);
        if (liveData) setLivePois(Array.from(new Set(liveData.map((d: any) => d.place_id))));
      }
    };
    map.on('moveend', loadPois);
    loadPois();
  }, [supabase]);

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
