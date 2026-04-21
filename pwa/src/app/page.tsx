'use client';

import dynamic from 'next/dynamic';
import { useState } from 'react';
import StopSearch from '@/components/StopSearch';
import type { Stop } from '@/lib/types';
import { useRouter } from 'next/navigation';

// Leaflet ne supporte pas le SSR → dynamic import sans SSR
const Map = dynamic(() => import('@/components/Map'), {
  ssr: false,
  loading: () => (
    <div className="h-[70vh] w-full rounded-xl bg-gray-100 animate-pulse flex items-center justify-center text-gray-400">
      Chargement de la carte…
    </div>
  )
});

const ABIDJAN_CENTER: [number, number] = [5.345, -4.020];

export default function Home() {
  const [selected, setSelected] = useState<Stop | null>(null);
  const router = useRouter();

  const center: [number, number] =
    selected ? [selected.stop_lat, selected.stop_lon] : ABIDJAN_CENTER;

  return (
    <div className="flex-1 flex flex-col">
      <section className="bg-gradient-to-br from-babimob-blue to-babimob-blue-dark text-white px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-2xl md:text-3xl font-bold mb-1">
            Où vas-tu à Abidjan ?
          </h1>
          <p className="text-white/80 text-sm mb-5">
            Retrouve instantanément tes lignes de gbaka et woro-woro, les arrêts et les fréquences de passage.
          </p>
          <StopSearch
            onSelect={(s) => {
              setSelected(s);
              // Plus tard : router.push(`/arret/${encodeURIComponent(s.stop_id)}`)
            }}
          />
        </div>
      </section>

      <section className="flex-1 max-w-6xl mx-auto w-full px-4 py-6">
        <Map
          stops={selected ? [selected] : []}
          center={center}
          zoom={selected ? 16 : 12}
        />

        {selected && (
          <div className="mt-4 bg-white rounded-xl shadow-md p-5 border border-gray-100">
            <div className="flex items-start justify-between gap-4">
              <div>
                <div className="text-xs uppercase tracking-wide text-babimob-blue font-semibold">
                  Arrêt sélectionné
                </div>
                <h2 className="text-lg font-bold mt-1">{selected.stop_name}</h2>
                {selected.commune && (
                  <div className="text-sm text-gray-500">{selected.commune}</div>
                )}
              </div>
              <button
                onClick={() => router.push(`/arret/${encodeURIComponent(selected.stop_id)}`)}
                className="bg-babimob-orange hover:bg-babimob-orange-br text-white px-4 py-2 rounded-lg text-sm font-medium transition"
              >
                Voir les lignes →
              </button>
            </div>
          </div>
        )}
      </section>
    </div>
  );
}
