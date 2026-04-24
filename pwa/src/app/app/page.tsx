'use client';

import dynamic from 'next/dynamic';
import { useState, useRef, useCallback, useEffect } from 'react';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import type { Stop, ArretProche } from '@/lib/types';
import { useRouter } from 'next/navigation';

const Map = dynamic(() => import('@/components/Map'), {
  ssr: false,
  loading: () => (
    <div className="absolute inset-0 bg-gray-100 flex items-center justify-center">
      <div className="flex flex-col items-center gap-3">
        <div className="w-8 h-8 border-2 border-bm-amber border-t-transparent rounded-full animate-spin" />
        <span className="text-xs text-gray-400 font-medium">Chargement de la carte…</span>
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
  <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <circle cx="11" cy="11" r="8" />
    <path d="m21 21-4.35-4.35" strokeLinecap="round" />
  </svg>
);

const IconX = ({ size = 'w-3.5 h-3.5' }: { size?: string }) => (
  <svg className={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
    <path d="M18 6 6 18M6 6l12 12" strokeLinecap="round" />
  </svg>
);

const IconChevronLeft = () => (
  <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="m15 18-6-6 6-6" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

const IconLocate = () => (
  <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
    <circle cx="12" cy="12" r="3" fill="currentColor" stroke="none" />
    <path d="M12 2v3M12 19v3M2 12h3M19 12h3" strokeLinecap="round" strokeWidth="2" />
    <circle cx="12" cy="12" r="8" />
  </svg>
);

const IconUser = () => (
  <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
    <circle cx="12" cy="8" r="4" />
    <path d="M4 20c0-4 3.6-7 8-7s8 3 8 7" strokeLinecap="round" />
  </svg>
);

const IconPin = () => (
  <svg className="w-4 h-4 text-bm-amber" viewBox="0 0 24 24" fill="currentColor">
    <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z" />
  </svg>
);

const IconMap = () => (
  <svg className="w-10 h-10 text-gray-300" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.2">
    <path d="M9 3L3 6v15l6-3 6 3 6-3V3l-6 3-6-3z" strokeLinejoin="round" />
    <path d="M9 3v15M15 6v15" strokeLinecap="round" />
  </svg>
);

const IconRoute = () => (
  <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
    <path d="M3 12h18M12 3l9 9-9 9" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

const IconList = () => (
  <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M9 5H7a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2h-2M9 5a2 2 0 0 0 2 2h2a2 2 0 0 0 2-2M9 5a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

export default function AppPage() {
  const router = useRouter();
  const supabase = createClient();
  const searchTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const [searchOpen, setSearchOpen] = useState(false);
  const [selected, setSelected] = useState<Stop | null>(null);
  const [sheetExpanded, setSheetExpanded] = useState(false);
  const [sheetTab, setSheetTab] = useState<'explorer' | 'activite'>('explorer');
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<Stop[]>([]);
  const [isSearching, setIsSearching] = useState(false);

  // Geolocation
  const [userLoc, setUserLoc] = useState<[number, number] | null>(null);
  const [nearbyStops, setNearbyStops] = useState<ArretProche[]>([]);
  const [geoLoading, setGeoLoading] = useState(false);
  const [geoError, setGeoError] = useState<string | null>(null);

  // Auto-dismiss geo error after 5 s
  useEffect(() => {
    if (!geoError) return;
    const t = setTimeout(() => setGeoError(null), 5000);
    return () => clearTimeout(t);
  }, [geoError]);

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
        const { data, error } = await supabase
          .from('gtfs_stops')
          .select('stop_id, stop_name, stop_lat, stop_lon, commune')
          .ilike('stop_name', `%${q}%`)
          .limit(12);
        setIsSearching(false);
        if (!error && data) setResults(data as Stop[]);
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

  const clearSelection = useCallback(() => {
    setSelected(null);
    setSheetExpanded(nearbyStops.length > 0);
  }, [nearbyStops.length]);

  const handleLocateMe = useCallback(async () => {
    if (!navigator.geolocation) {
      setGeoError("La géolocalisation n'est pas disponible sur cet appareil.");
      return;
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

  const openSearch = () => setSearchOpen(true);
  const closeSearch = () => { setSearchOpen(false); setQuery(''); setResults([]); };

  return (
    <div className="flex-1 relative overflow-hidden">

      {/* ── Map ─────────────────────────────────────────────────────────── */}
      <Map
        stops={mapStops}
        center={center}
        zoom={zoom}
        className="absolute inset-0"
        selectedStopId={selected?.stop_id ?? null}
        onStopClick={handleSelectStop}
        userLocation={userLoc}
      />

      {/* ── Floating top bar ────────────────────────────────────────────── */}
      <div className="absolute top-4 left-4 right-4 z-[500] flex items-center gap-2">
        {/* Search bar */}
        <button
          onClick={openSearch}
          className="flex-1 flex items-center gap-3 bg-white/95 backdrop-blur-xl rounded-2xl shadow-lg border border-gray-200/80 px-4 py-3 text-left transition-shadow hover:shadow-xl active:scale-[0.99]"
        >
          <span className="text-gray-400 flex-shrink-0"><IconSearch /></span>
          <span className="text-sm text-gray-500 flex-1 truncate">
            {selected ? selected.stop_name : "Rechercher un arrêt…"}
          </span>
          {selected && (
            <button
              onClick={(e) => { e.stopPropagation(); clearSelection(); }}
              className="text-gray-400 hover:text-gray-700 p-0.5 rounded-full transition"
              aria-label="Effacer la sélection"
            >
              <IconX />
            </button>
          )}
        </button>

        {/* Locate me */}
        <button
          onClick={handleLocateMe}
          disabled={geoLoading}
          aria-label="Me localiser"
          className={`w-11 h-11 bg-white/95 backdrop-blur-xl rounded-2xl shadow-lg border flex items-center justify-center flex-shrink-0 transition-all hover:shadow-xl active:scale-95 ${
            userLoc ? 'border-blue-400 text-blue-500' : 'border-gray-200/80 text-gray-500'
          } disabled:opacity-60`}
        >
          {geoLoading ? (
            <div className="w-4 h-4 border-2 border-blue-400 border-t-transparent rounded-full animate-spin" />
          ) : (
            <IconLocate />
          )}
        </button>

        {/* Account */}
        <Link
          href="/app/compte"
          className="w-11 h-11 bg-white/95 backdrop-blur-xl rounded-2xl shadow-lg border border-gray-200/80 flex items-center justify-center flex-shrink-0 transition-all hover:shadow-xl active:scale-95 text-gray-500"
          aria-label="Mon compte"
        >
          <IconUser />
        </Link>
      </div>

      {/* Geo error toast */}
      {geoError && (
        <div className="bm-toast absolute top-20 left-4 right-4 z-[500] bg-red-50 border border-red-200 rounded-2xl px-4 py-3 text-sm text-red-700 flex items-center justify-between shadow-md">
          <span>{geoError}</span>
          <button
            onClick={() => setGeoError(null)}
            className="ml-3 p-1 text-red-400 hover:text-red-600 rounded-full transition"
            aria-label="Fermer"
          >
            <IconX />
          </button>
        </div>
      )}

      {/* ── Bottom sheet ────────────────────────────────────────────────── */}
      <div
        className={`bm-sheet absolute bottom-0 left-0 right-0 z-[500] bg-white rounded-t-3xl shadow-[0_-4px_24px_rgba(0,0,0,0.10)] transition-transform duration-300 ease-out ${
          sheetExpanded ? 'translate-y-0' : 'translate-y-[calc(100%-72px)]'
        }`}
      >
        {/* Handle */}
        <div
          className="flex flex-col items-center pt-3 pb-1 cursor-pointer select-none"
          onClick={() => setSheetExpanded(!sheetExpanded)}
          role="button"
          aria-label={sheetExpanded ? "Réduire" : "Agrandir"}
          aria-expanded={sheetExpanded}
        >
          <div className="w-10 h-1 bg-gray-200 rounded-full" />
        </div>

        {/* Collapsed peek */}
        {!sheetExpanded && (
          <div className="flex items-center justify-between px-5 py-2 pb-4">
            <div className="text-sm font-semibold text-gray-800 truncate max-w-[200px]">
              {selected
                ? selected.stop_name
                : nearbyStops.length > 0
                  ? `${nearbyStops.length} arrêt${nearbyStops.length > 1 ? 's' : ''} à proximité`
                  : "Explorer Abidjan"}
            </div>
            {selected ? (
              <button
                onClick={() => router.push(`/app/arret/${encodeURIComponent(selected.stop_id)}`)}
                className="text-xs font-semibold text-bm-amber"
              >
                Voir les lignes →
              </button>
            ) : nearbyStops.length > 0 ? (
              <button onClick={() => setSheetExpanded(true)} className="text-xs font-semibold text-blue-500">
                Voir la liste →
              </button>
            ) : (
              <button onClick={openSearch} className="text-xs font-semibold text-bm-amber">
                Rechercher →
              </button>
            )}
          </div>
        )}

        {/* Expanded content */}
        {sheetExpanded && (
          <div className="px-5 pt-2 pb-safe">
            {selected ? (
              /* ── Stop detail ── */
              <>
                <div className="flex items-start justify-between gap-3 mb-5">
                  <div>
                    <div className="text-xs uppercase tracking-widest text-bm-amber font-semibold mb-0.5">Arrêt sélectionné</div>
                    <h2 className="text-xl font-bold text-gray-900 leading-tight">{selected.stop_name}</h2>
                    {selected.commune && (
                      <div className="text-sm text-gray-400 mt-0.5">{selected.commune}</div>
                    )}
                  </div>
                  <button
                    onClick={clearSelection}
                    className="mt-1 p-2 rounded-xl bg-gray-100 hover:bg-gray-200 transition text-gray-500 flex-shrink-0"
                    aria-label="Fermer"
                  >
                    <IconX size="w-4 h-4" />
                  </button>
                </div>

                <div className="grid grid-cols-2 gap-2.5">
                  <button
                    onClick={() => router.push(`/app/arret/${encodeURIComponent(selected.stop_id)}`)}
                    className="flex items-center justify-center gap-2.5 bg-bm-gradient text-black text-sm font-semibold px-4 py-3.5 rounded-2xl col-span-2 active:opacity-90 transition-opacity"
                  >
                    <IconList />
                    Voir les lignes desservant cet arrêt
                  </button>

                  <Link
                    href="/app/itineraire"
                    className="flex items-center justify-center gap-2 bg-gray-100 hover:bg-gray-200 text-gray-700 text-sm font-medium px-4 py-3.5 rounded-2xl transition-colors"
                  >
                    <IconRoute />
                    Itinéraire
                  </Link>

                  <button
                    onClick={openSearch}
                    className="flex items-center justify-center gap-2 bg-gray-100 hover:bg-gray-200 text-gray-700 text-sm font-medium px-4 py-3.5 rounded-2xl transition-colors"
                  >
                    <IconSearch />
                    Autre arrêt
                  </button>
                </div>
              </>
            ) : nearbyStops.length > 0 ? (
              /* ── Nearby stops list ── */
              <>
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <div className="text-xs uppercase tracking-widest text-blue-500 font-semibold mb-0.5">
                      Arrêts à proximité
                    </div>
                    <div className="text-base font-bold text-gray-900">
                      {nearbyStops.length} arrêt{nearbyStops.length > 1 ? 's' : ''} · rayon 800 m
                    </div>
                  </div>
                  <button
                    onClick={() => { setUserLoc(null); setNearbyStops([]); setSheetExpanded(false); }}
                    className="p-2 rounded-xl bg-gray-100 hover:bg-gray-200 transition text-gray-500"
                    aria-label="Effacer"
                  >
                    <IconX size="w-4 h-4" />
                  </button>
                </div>

                <ul className="space-y-1.5 max-h-60 overflow-y-auto -mx-1 px-1">
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
                      className="flex items-center gap-3 bg-gray-50 hover:bg-gray-100 active:bg-gray-200 rounded-2xl px-4 py-3 cursor-pointer transition-colors"
                      role="button"
                    >
                      <div className="w-9 h-9 rounded-xl bg-bm-amber/10 flex items-center justify-center flex-shrink-0">
                        <IconPin />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-medium text-gray-900 truncate">{a.stop_name}</div>
                        {a.commune && (
                          <div className="text-xs text-gray-400">{a.commune}</div>
                        )}
                      </div>
                      <div className="text-xs font-semibold text-blue-500 flex-shrink-0 tabular-nums">
                        {formatDistance(a.distance_m)}
                      </div>
                    </li>
                  ))}
                </ul>
              </>
            ) : (
              /* ── Empty state with tabs ── */
              <>
                {/* Tabs */}
                <div className="flex gap-1 bg-gray-100 rounded-2xl p-1 mb-5">
                  <button
                    onClick={() => setSheetTab('explorer')}
                    className={`flex-1 text-sm font-semibold py-2 rounded-xl transition-all ${
                      sheetTab === 'explorer'
                        ? 'bg-white text-gray-900 shadow-sm'
                        : 'text-gray-500'
                    }`}
                  >
                    🗺️ Explorer
                  </button>
                  <button
                    onClick={() => setSheetTab('activite')}
                    className={`flex-1 text-sm font-semibold py-2 rounded-xl transition-all ${
                      sheetTab === 'activite'
                        ? 'bg-white text-gray-900 shadow-sm'
                        : 'text-gray-500'
                    }`}
                  >
                    💬 Activité
                  </button>
                </div>

                {sheetTab === 'explorer' ? (
                  <div className="text-center py-4">
                    <div className="flex justify-center mb-4">
                      <IconMap />
                    </div>
                    <p className="text-sm font-medium text-gray-500 mb-5 leading-relaxed">
                      Recherche un arrêt ou utilise ta position GPS<br />pour voir les arrêts proches.
                    </p>
                    <div className="flex flex-col gap-2.5">
                      <button
                        onClick={openSearch}
                        className="bg-bm-gradient text-black text-sm font-semibold px-6 py-3.5 rounded-2xl active:opacity-90 transition-opacity"
                      >
                        Rechercher un arrêt
                      </button>
                      <button
                        onClick={handleLocateMe}
                        disabled={geoLoading}
                        className="flex items-center justify-center gap-2 bg-blue-50 hover:bg-blue-100 text-blue-600 text-sm font-semibold px-6 py-3.5 rounded-2xl disabled:opacity-60 transition-colors"
                      >
                        {geoLoading ? (
                          <div className="w-4 h-4 border-2 border-blue-400 border-t-transparent rounded-full animate-spin" />
                        ) : (
                          <IconLocate />
                        )}
                        Arrêts proches de moi
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-4">
                    <p className="text-sm text-gray-500 mb-4">
                      Découvre les arrêts actifs de la communauté.
                    </p>
                    <Link
                      href="/app/ccomment"
                      className="inline-flex items-center gap-2 bg-bm-amber/10 text-bm-amber text-sm font-semibold px-5 py-3 rounded-2xl"
                    >
                      💬 Voir C&apos;comment
                    </Link>
                  </div>
                )}
              </>
            )}
          </div>
        )}
      </div>

      {/* ── Search overlay ──────────────────────────────────────────────── */}
      {searchOpen && (
        <div className="bm-search-overlay fixed inset-0 z-[600] bg-white flex flex-col">
          <div className="flex items-center gap-3 px-4 pt-12 pb-3 border-b border-gray-100">
            <button
              onClick={closeSearch}
              className="p-2 -ml-1 rounded-xl hover:bg-gray-100 transition text-gray-600"
              aria-label="Retour"
            >
              <IconChevronLeft />
            </button>
            <input
              autoFocus
              type="text"
              value={query}
              onChange={(e) => handleSearchChange(e.target.value)}
              placeholder="Rechercher un arrêt…"
              className="flex-1 text-base outline-none text-gray-900 placeholder-gray-400"
            />
            {isSearching ? (
              <div className="w-4 h-4 border-2 border-bm-amber border-t-transparent rounded-full animate-spin" />
            ) : query ? (
              <button
                onClick={() => handleSearchChange('')}
                className="p-1.5 text-gray-400 hover:text-gray-700 rounded-full transition"
                aria-label="Effacer"
              >
                <IconX />
              </button>
            ) : null}
          </div>

          <div className="flex-1 overflow-y-auto">
            {results.length > 0 ? (
              <ul>
                {results.map((s) => (
                  <li
                    key={s.stop_id}
                    onClick={() => handleSelectStop(s)}
                    className="flex items-center gap-3 px-4 py-3.5 border-b border-gray-50 hover:bg-gray-50 active:bg-gray-100 cursor-pointer transition-colors"
                    role="button"
                  >
                    <div className="w-9 h-9 rounded-xl bg-bm-amber/10 flex items-center justify-center flex-shrink-0">
                      <IconPin />
                    </div>
                    <div>
                      <div className="text-sm font-medium text-gray-900">{s.stop_name}</div>
                      {s.commune && <div className="text-xs text-gray-400">{s.commune}</div>}
                    </div>
                  </li>
                ))}
              </ul>
            ) : query.trim().length >= 2 && !isSearching ? (
              <div className="flex flex-col items-center py-16 gap-3">
                <IconMap />
                <p className="text-sm text-gray-400">Aucun arrêt trouvé pour «{query}»</p>
              </div>
            ) : (
              <div className="px-4 py-8">
                <div className="text-xs uppercase tracking-widest text-gray-400 font-semibold mb-3">
                  Suggestions
                </div>
                {SUGGESTIONS.map((s) => (
                  <button
                    key={s}
                    onClick={() => handleSearchChange(s)}
                    className="w-full text-left flex items-center gap-3 px-3 py-3 text-sm text-gray-700 hover:bg-gray-50 rounded-xl transition-colors"
                  >
                    <span className="text-gray-300"><IconSearch /></span>
                    {s}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

