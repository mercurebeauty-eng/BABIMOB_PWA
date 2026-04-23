'use client';

import dynamic from 'next/dynamic';
import { useState, useRef, useCallback } from 'react';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import type { Stop } from '@/lib/types';
import { useRouter } from 'next/navigation';

const Map = dynamic(() => import('@/components/Map'), {
  ssr: false,
  loading: () => (
    <div className="absolute inset-0 bg-gray-100 flex items-center justify-center">
      <div className="w-8 h-8 border-2 border-bm-amber border-t-transparent rounded-full animate-spin" />
    </div>
  ),
});

const ABIDJAN_CENTER: [number, number] = [5.345, -4.020];

const SUGGESTIONS = ['Adjamé gare', 'Angré', 'Yopougon mairie', 'Riviera 2', 'Plateau'];

export default function AppPage() {
  const router = useRouter();
  const supabase = createClient();
  const searchTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const [searchOpen, setSearchOpen] = useState(false);
  const [selected, setSelected] = useState<Stop | null>(null);
  const [sheetExpanded, setSheetExpanded] = useState(false);
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<Stop[]>([]);
  const [isSearching, setIsSearching] = useState(false);

  const center: [number, number] = selected
    ? [selected.stop_lat, selected.stop_lon]
    : ABIDJAN_CENTER;
  const zoom = selected ? 16 : 12;

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
    setSheetExpanded(false);
  }, []);

  const openSearch = () => setSearchOpen(true);

  const closeSearch = () => {
    setSearchOpen(false);
    setQuery('');
    setResults([]);
  };

  return (
    <div className="flex-1 relative overflow-hidden">

      {/* ── Map (full-screen background) ───────────────────────────────── */}
      <Map
        stops={selected ? [selected] : []}
        center={center}
        zoom={zoom}
        className="absolute inset-0"
        selectedStopId={selected?.stop_id ?? null}
        onStopClick={handleSelectStop}
      />

      {/* ── Floating top bar ───────────────────────────────────────────── */}
      <div className="absolute top-4 left-4 right-4 z-[500] flex items-center gap-2">
        <button
          onClick={openSearch}
          className="flex-1 flex items-center gap-3 bg-white/95 backdrop-blur-xl rounded-2xl shadow-lg border border-gray-200/80 px-4 py-3 text-left transition hover:shadow-xl"
        >
          <svg className="w-4 h-4 text-gray-400 flex-shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="11" cy="11" r="8" />
            <path d="m21 21-4.35-4.35" strokeLinecap="round" />
          </svg>
          <span className="text-sm text-gray-500 flex-1 truncate">
            {selected ? selected.stop_name : "Rechercher un arrêt…"}
          </span>
          {selected && (
            <button
              onClick={(e) => { e.stopPropagation(); clearSelection(); }}
              className="text-gray-400 hover:text-gray-700 p-0.5 rounded-full transition"
            >
              <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <path d="M18 6 6 18M6 6l12 12" strokeLinecap="round" />
              </svg>
            </button>
          )}
        </button>

        <Link
          href="/app/compte"
          className="w-11 h-11 bg-white/95 backdrop-blur-xl rounded-2xl shadow-lg border border-gray-200/80 flex items-center justify-center flex-shrink-0 transition hover:shadow-xl"
          aria-label="Mon compte"
        >
          <svg className="w-5 h-5 text-gray-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
            <circle cx="12" cy="8" r="4" />
            <path d="M4 20c0-4 3.6-7 8-7s8 3 8 7" strokeLinecap="round" />
          </svg>
        </Link>
      </div>

      {/* ── Bottom sheet ───────────────────────────────────────────────── */}
      <div
        className={`absolute bottom-0 left-0 right-0 z-[500] bg-white rounded-t-3xl shadow-[0_-4px_24px_rgba(0,0,0,0.10)] transition-transform duration-300 ease-out ${
          sheetExpanded ? 'translate-y-0' : 'translate-y-[calc(100%-72px)]'
        }`}
      >
        {/* Handle bar */}
        <div
          className="flex flex-col items-center pt-3 pb-1 cursor-pointer select-none"
          onClick={() => setSheetExpanded(!sheetExpanded)}
          role="button"
          aria-label={sheetExpanded ? "Réduire" : "Agrandir"}
        >
          <div className="w-10 h-1 bg-gray-200 rounded-full" />
        </div>

        {/* Collapsed peek: stop name + quick action */}
        {!sheetExpanded && (
          <div className="flex items-center justify-between px-5 py-2 pb-4">
            <div className="text-sm font-semibold text-gray-800 truncate max-w-[200px]">
              {selected ? selected.stop_name : "Explore Abidjan"}
            </div>
            {selected ? (
              <button
                onClick={() => router.push(`/app/arret/${encodeURIComponent(selected.stop_id)}`)}
                className="text-xs font-semibold text-bm-amber"
              >
                Voir les lignes →
              </button>
            ) : (
              <button
                onClick={openSearch}
                className="text-xs font-semibold text-bm-amber"
              >
                Rechercher →
              </button>
            )}
          </div>
        )}

        {/* Expanded content */}
        {sheetExpanded && (
          <div className="px-5 pb-10 pt-2">
            {selected ? (
              <>
                <div className="flex items-start justify-between gap-3 mb-5">
                  <div>
                    <div className="text-xs uppercase tracking-wide text-bm-amber font-semibold mb-0.5">
                      Arrêt
                    </div>
                    <h2 className="text-xl font-bold text-gray-900">{selected.stop_name}</h2>
                    {selected.commune && (
                      <div className="text-sm text-gray-500 mt-0.5">{selected.commune}</div>
                    )}
                  </div>
                  <button
                    onClick={clearSelection}
                    className="mt-1 p-1.5 rounded-xl bg-gray-100 hover:bg-gray-200 transition text-gray-500 flex-shrink-0"
                    aria-label="Fermer"
                  >
                    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M18 6 6 18M6 6l12 12" strokeLinecap="round" />
                    </svg>
                  </button>
                </div>

                <div className="grid grid-cols-2 gap-2.5">
                  <button
                    onClick={() => router.push(`/app/arret/${encodeURIComponent(selected.stop_id)}`)}
                    className="flex items-center gap-2.5 bg-bm-gradient text-white text-sm font-semibold px-4 py-3 rounded-2xl col-span-2"
                  >
                    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M9 5H7a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2h-2M9 5a2 2 0 0 0 2 2h2a2 2 0 0 0 2-2M9 5a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                    Voir les lignes desservant cet arrêt
                  </button>

                  <Link
                    href="/app/itineraire"
                    className="flex items-center justify-center gap-2 bg-gray-100 text-gray-700 text-sm font-medium px-4 py-3 rounded-2xl"
                  >
                    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                      <path d="M3 12h18M12 3l9 9-9 9" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                    Itinéraire
                  </Link>

                  <button
                    onClick={openSearch}
                    className="flex items-center justify-center gap-2 bg-gray-100 text-gray-700 text-sm font-medium px-4 py-3 rounded-2xl"
                  >
                    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <circle cx="11" cy="11" r="8" />
                      <path d="m21 21-4.35-4.35" strokeLinecap="round" />
                    </svg>
                    Autre arrêt
                  </button>
                </div>
              </>
            ) : (
              <div className="text-center py-4">
                <div className="text-4xl mb-3">🗺️</div>
                <p className="text-sm text-gray-500 mb-4">
                  Recherche un arrêt pour voir les lignes de gbaka et woro-woro.
                </p>
                <button
                  onClick={openSearch}
                  className="bg-bm-gradient text-white text-sm font-semibold px-6 py-3 rounded-2xl"
                >
                  Rechercher un arrêt
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* ── Search overlay ─────────────────────────────────────────────── */}
      {searchOpen && (
        <div className="fixed inset-0 z-[600] bg-white flex flex-col">
          {/* Header */}
          <div className="flex items-center gap-3 px-4 pt-12 pb-3 border-b border-gray-100">
            <button
              onClick={closeSearch}
              className="p-1.5 -ml-1 rounded-xl hover:bg-gray-100 transition"
              aria-label="Retour"
            >
              <svg className="w-5 h-5 text-gray-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="m15 18-6-6 6-6" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
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
                className="p-1 text-gray-400 hover:text-gray-700 rounded-full transition"
                aria-label="Effacer"
              >
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <path d="M18 6 6 18M6 6l12 12" strokeLinecap="round" />
                </svg>
              </button>
            ) : null}
          </div>

          {/* Results / suggestions */}
          <div className="flex-1 overflow-y-auto">
            {results.length > 0 ? (
              <ul>
                {results.map((s) => (
                  <li
                    key={s.stop_id}
                    onClick={() => handleSelectStop(s)}
                    className="flex items-center gap-3 px-4 py-3.5 border-b border-gray-50 hover:bg-gray-50 active:bg-gray-100 cursor-pointer"
                  >
                    <div className="w-8 h-8 rounded-xl bg-bm-amber/10 flex items-center justify-center flex-shrink-0">
                      <svg className="w-4 h-4 text-bm-amber" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z" />
                      </svg>
                    </div>
                    <div>
                      <div className="text-sm font-medium text-gray-900">{s.stop_name}</div>
                      {s.commune && (
                        <div className="text-xs text-gray-500">{s.commune}</div>
                      )}
                    </div>
                  </li>
                ))}
              </ul>
            ) : query.trim().length >= 2 && !isSearching ? (
              <div className="text-center py-16 text-gray-400 text-sm">
                Aucun arrêt trouvé pour «{query}»
              </div>
            ) : (
              <div className="px-4 py-8">
                <div className="text-xs uppercase tracking-wide text-gray-400 font-semibold mb-3">
                  Suggestions
                </div>
                {SUGGESTIONS.map((s) => (
                  <button
                    key={s}
                    onClick={() => handleSearchChange(s)}
                    className="w-full text-left flex items-center gap-3 px-3 py-3 text-sm text-gray-700 hover:bg-gray-50 rounded-xl transition"
                  >
                    <svg className="w-4 h-4 text-gray-300" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <circle cx="11" cy="11" r="8" />
                      <path d="m21 21-4.35-4.35" strokeLinecap="round" />
                    </svg>
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
