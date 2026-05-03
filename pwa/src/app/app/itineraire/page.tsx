'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { Ic } from '@/components/ui/Ic';
import Vehicle from '@/components/ui/Vehicle';
import { Pill } from '@/components/ui/Pill';
import Link from 'next/link';
import BeigeMapBackground from '@/components/BeigeMapBackground';
import LocationInput from './LocationInput';
import { fetchItinerary } from '@/lib/otp';
import { createClient } from '@/lib/supabase/client';
import type { Stop } from '@/lib/types';

export default function ItinerairePage() {
  const [start, setStart] = useState('');
  const [startStop, setStartStop] = useState<Stop | null>(null);
  const [end, setEnd] = useState('');
  const [endStop, setEndStop] = useState<Stop | null>(null);
  const router = useRouter();
  
  const [calculating, setCalculating] = useState(false);
  const [wheelchair, setWheelchair] = useState(false);
  const [itineraries, setItineraries] = useState<any[]>([]);
  const [error, setError] = useState<string | null>(null);
  
  const [prefs, setPrefs] = useState<string[]>([]);
  const supabase = createClient();

  // Parse toStop from URL
  useEffect(() => {
    const toParam = new URLSearchParams(window.location.search).get('toStop');
    if (toParam) {
      try {
        const stop = JSON.parse(decodeURIComponent(toParam));
        setEnd(stop.stop_name);
        setEndStop(stop);
      } catch (err) {
        console.error("Failed to parse toStop", err);
      }
    }

    const loadPrefs = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data } = await supabase.from('profiles').select('preferred_transit_modes').eq('id', user.id).single();
        if (data && data.preferred_transit_modes) {
           setPrefs(data.preferred_transit_modes);
        } else {
           // By default all are enabled
           setPrefs(['Gbaka', 'Woro-woro', 'Taxi', 'Saloni']);
        }
      }
    };
    loadPrefs();
  }, [supabase]);

  const handleCalculate = async () => {
    if (!startStop || !endStop) {
      setError("Sélectionne des arrêts valides dans les suggestions.");
      return;
    }

    setCalculating(true);
    setError(null);
    
    try {
      const results = await fetchItinerary({
        from: { lat: startStop.stop_lat, lon: startStop.stop_lon },
        to: { lat: endStop.stop_lat, lon: endStop.stop_lon },
        wheelchair,
      });
      setItineraries(results);
      if (results.length === 0) setError("Aucun itinéraire trouvé.");
    } catch (err) {
      setError("Erreur lors de la connexion au serveur de calcul.");
    } finally {
      setCalculating(false);
    }
  };

  return (
    <div className="flex-1 flex flex-col overflow-y-auto bg-beige-50 text-beige-text font-sans relative">
      <BeigeMapBackground />
      
      {/* Top nav */}
      <div className="sticky top-0 z-20 bg-beige-50/80 backdrop-blur-xl border-b border-beige-200/50 px-4 py-3 flex items-center gap-3">
        <Link
          href="/app"
          className="p-2 -ml-2 rounded-full hover:bg-beige-100 transition-colors"
          aria-label="Retour à la carte"
        >
          <svg className="w-5 h-5 text-beige-muted" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <path d="m15 18-6-6 6-6" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </Link>
        <span className="text-sm font-bold uppercase tracking-widest text-beige-muted">Itinéraire</span>
      </div>

      <div className="flex-1 flex flex-col items-center px-5 py-8 relative z-10">
        <div className="w-full max-w-lg">
          <div className="bg-white rounded-[2.5rem] border-2 border-beige-200 shadow-xl shadow-black/5 p-8 space-y-6">
            <LocationInput 
              label="Départ"
              placeholder="Point de départ"
              icon="📍"
              value={start}
              colorClass="text-abidjan-green"
              onChange={(val, stop) => { setStart(val); if (stop) setStartStop(stop); }}
            />

            <div className="flex justify-start pl-7 -my-3 h-6">
               <div className="w-0.5 h-full border-l-2 border-dashed border-beige-200" />
            </div>

            <LocationInput 
              label="Arrivée"
              placeholder="Destination"
              icon="🏁"
              value={end}
              colorClass="text-abidjan-orange"
              onChange={(val, stop) => { setEnd(val); if (stop) setEndStop(stop); }}
            />

            <div className="flex items-center justify-between p-4 bg-beige-50 rounded-2xl border border-beige-100">
               <div className="flex items-center gap-3">
                  <span className="text-xl">♿</span>
                  <div className="flex flex-col">
                     <span className="text-[10px] font-black uppercase tracking-widest text-beige-text">Accessibilité</span>
                     <span className="text-[9px] font-bold text-beige-muted">Filtrer les trajets adaptés</span>
                  </div>
               </div>
               <button
                 onClick={() => setWheelchair(!wheelchair)}
                 className={`w-12 h-6 rounded-full transition-all relative ${wheelchair ? 'bg-abidjan-blue' : 'bg-beige-200'}`}
               >
                 <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${wheelchair ? 'left-7' : 'left-1'}`} />
               </button>
            </div>

            {error && (
              <div
                key={error}
                className="bm-shake"
                style={{
                  display: 'flex', alignItems: 'center', gap: 12,
                  padding: '14px 16px', borderRadius: 16,
                  background: 'var(--danger-pale)',
                  border: '1.5px solid color-mix(in oklab, var(--danger) 35%, transparent)',
                  color: 'var(--danger)',
                }}
                role="alert"
              >
                <div
                  aria-hidden
                  style={{
                    width: 28, height: 28, borderRadius: 999,
                    background: 'var(--danger)', color: '#fff',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 16, fontWeight: 900, flexShrink: 0,
                  }}
                >!</div>
                <div style={{ fontSize: 12, fontWeight: 800, letterSpacing: 0.4, lineHeight: 1.4 }}>
                  {error}
                </div>
              </div>
            )}

            <button
              onClick={handleCalculate}
              disabled={calculating || !start || !end}
              className="w-full bg-abidjan-orange text-white font-black py-5 rounded-2xl shadow-lg shadow-abidjan-orange/20 hover:shadow-abidjan-orange/40 hover:-translate-y-0.5 transition-all disabled:opacity-50 text-lg uppercase tracking-tight"
            >
              {calculating ? (
                <span className="flex items-center justify-center gap-3">
                  <span className="w-5 h-5 border-3 border-white/30 border-t-white rounded-full animate-spin" />
                  Calcul...
                </span>
              ) : "Trouver le trajet"}
            </button>
          </div>

          <div className="space-y-4 mt-8">
              {itineraries.map((itinerary, idx) => {
                const primaryMode = itinerary.legs.find((l: any) => l.mode !== 'WALK')?.mode || 'WALK';
                const kind = primaryMode.toLowerCase() as any;
                const isFastest = idx === 0;

                return (
                  <motion.div
                    key={idx}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: idx * 0.1 }}
                    className="press"
                    onClick={() => {
                      const params = new URLSearchParams();
                      params.set('itinerary', JSON.stringify(itinerary));
                      router.push(`/app?${params.toString()}`);
                    }}
                    style={{
                      display: 'flex', alignItems: 'center', gap: 12,
                      padding: 14, borderRadius: 18,
                      background: isFastest ? 'color-mix(in oklab, var(--green) 12%, transparent)' : 'var(--cream)',
                      border: isFastest ? '1.5px solid var(--green)' : '1px solid var(--line)',
                      cursor: 'pointer'
                    }}
                  >
                    <Vehicle kind={kind} size={40} />
                    <div style={{ flex: 1 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <span style={{ fontSize: 15, fontWeight: 800, color: 'var(--ink)' }}>
                          {primaryMode === 'BUS' ? 'Gbaka direct' : primaryMode === 'TAXI' ? 'Taxi / Woro' : 'Trajet mixte'}
                        </span>
                        {isFastest && <Pill color="var(--green)" size="sm">RAPIDE</Pill>}
                      </div>
                      <div style={{ fontSize: 12, color: 'var(--muted)', marginTop: 2 }}>
                        {itinerary.legs.length - 1} changements · {Math.round(itinerary.duration / 60)} min
                      </div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <div className="font-display" style={{ fontSize: 18, color: 'var(--orange)' }}>
                        {primaryMode === 'BUS' ? '200F' : primaryMode === 'TAXI' ? '500F' : '350F'}
                      </div>
                      <div style={{ fontSize: 9, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: 0.5 }}>tarif estimé</div>
                    </div>
                  </motion.div>
                );
              })}
            </div>
        </div>
      </div>
    </div>
  );
}
