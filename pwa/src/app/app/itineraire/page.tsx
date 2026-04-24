'use client';

import { useState } from 'react';
import Link from 'next/link';
import BeigeMapBackground from '@/components/BeigeMapBackground';
import LocationInput from './LocationInput';
import { fetchItinerary } from '@/lib/otp';
import type { Stop } from '@/lib/types';

export default function ItinerairePage() {
  const [start, setStart] = useState('');
  const [startStop, setStartStop] = useState<Stop | null>(null);
  const [end, setEnd] = useState('');
  const [endStop, setEndStop] = useState<Stop | null>(null);
  
  const [calculating, setCalculating] = useState(false);
  const [itineraries, setItineraries] = useState<any[]>([]);
  const [error, setError] = useState<string | null>(null);

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
        to: { lat: endStop.stop_lat, lon: endStop.stop_lon }
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

            {error && (
              <div className="p-4 bg-red-50 border-2 border-red-100 rounded-2xl text-xs font-bold text-red-600 uppercase tracking-widest text-center animate-in shake duration-300">
                {error}
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

          {/* Results List */}
          <div className="mt-8 space-y-4 pb-12">
            {itineraries.map((iti, idx) => (
              <div key={idx} className="bg-white rounded-[2rem] border-2 border-beige-200 shadow-lg p-6 animate-in slide-in-from-bottom-4 duration-500" style={{ animationDelay: `${idx * 100}ms` }}>
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center gap-2">
                    <span className="text-2xl font-black text-beige-text">{Math.round(iti.duration / 60)}</span>
                    <span className="text-xs font-bold text-beige-muted uppercase tracking-widest">min</span>
                  </div>
                  <div className="text-[10px] font-black text-beige-muted bg-beige-50 px-3 py-1.5 rounded-full border border-beige-100">
                    {Math.round(iti.walkDistance)}m de marche
                  </div>
                </div>

                <div className="flex items-center gap-2 overflow-x-auto pb-4 -mx-1 px-1 scrollbar-hide">
                  {iti.legs.map((leg: any, lidx: number) => (
                    <div key={lidx} className="flex items-center gap-2 flex-shrink-0">
                      <div 
                        className="flex items-center gap-2 px-3 py-2 rounded-xl border text-xs font-black"
                        style={{ 
                          backgroundColor: leg.route?.color ? `#${leg.route.color}15` : '#f3f4f6',
                          borderColor: leg.route?.color ? `#${leg.route.color}30` : '#e5e7eb',
                          color: leg.route?.color ? `#${leg.route.color}` : '#4b5563'
                        }}
                      >
                        <span>{leg.mode === 'WALK' ? '🚶' : leg.mode === 'BUS' ? '🚐' : '🚌'}</span>
                        {leg.route?.shortName && <span>{leg.route.shortName}</span>}
                      </div>
                      {lidx < iti.legs.length - 1 && <span className="text-beige-200">→</span>}
                    </div>
                  ))}
                </div>

                <div className="mt-6 pt-6 border-t border-beige-50">
                  <Link 
                    href={`/app?iti=${encodeURIComponent(JSON.stringify(iti))}`}
                    className="w-full flex items-center justify-center gap-2 bg-abidjan-blue text-white font-black py-4 rounded-2xl shadow-lg shadow-abidjan-blue/20 hover:scale-[1.02] transition-transform text-sm uppercase tracking-widest"
                  >
                    🚀 Voir sur la carte
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
