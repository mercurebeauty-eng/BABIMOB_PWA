import Link from 'next/link';

export default function ItinerairePage() {
  return (
    <div className="flex-1 flex flex-col overflow-y-auto bg-gray-50">
      {/* Top nav */}
      <div className="sticky top-0 z-10 bg-white/95 backdrop-blur-xl border-b border-gray-100 px-4 py-3 flex items-center gap-3">
        <Link
          href="/app"
          className="p-1.5 -ml-1 rounded-xl hover:bg-gray-100 transition"
          aria-label="Retour à la carte"
        >
          <svg className="w-5 h-5 text-gray-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="m15 18-6-6 6-6" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </Link>
        <span className="text-sm font-medium text-gray-600">Itinéraire</span>
      </div>

      <div className="flex-1 flex flex-col items-center justify-center px-4 py-10">
        <div className="w-full max-w-md">
          <div className="text-center mb-8">
            <div className="flex justify-center mb-4">
              <div className="w-16 h-16 rounded-2xl bg-bm-amber/10 flex items-center justify-center">
                <svg className="w-8 h-8 text-bm-amber" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <rect x="1" y="6" width="15" height="10" rx="2" />
                  <path d="M16 10h4l2 3v3h-6V10z" />
                  <circle cx="5.5" cy="18.5" r="1.5" fill="currentColor" stroke="none" />
                  <circle cx="18.5" cy="18.5" r="1.5" fill="currentColor" stroke="none" />
                </svg>
              </div>
            </div>
            <h1 className="text-2xl font-bold text-gray-900">Calculateur d&apos;itinéraire</h1>
            <p className="text-sm text-gray-500 mt-2 max-w-xs mx-auto">
              Saisis ton point de départ et ta destination, on calcule le meilleur trajet
              gbaka + woro-woro + marche.
            </p>
          </div>

          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 mb-4">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-2 h-2 rounded-full bg-bm-coral animate-pulse" />
              <span className="text-xs font-semibold text-bm-coral uppercase tracking-wide">
                En développement
              </span>
            </div>
            <p className="text-sm text-gray-600">
              Intégration <strong>OpenTripPlanner</strong> avec les données GTFS d&apos;Abidjan.
            </p>
          </div>

          <div className="grid grid-cols-3 gap-2.5">
            {[
              { n: '1', title: 'Saisie', desc: "Départ et arrivée par adresse ou arrêt." },
              { n: '2', title: 'Calcul', desc: "OTP combine GTFS + OSM pour tracer le trajet." },
              { n: '3', title: 'Résultat', desc: "Étapes, lignes à prendre, durée estimée." },
            ].map(({ n, title, desc }) => (
              <div key={n} className="bg-white rounded-2xl border border-gray-100 p-4">
                <div className="w-7 h-7 rounded-lg bg-bm-amber/10 flex items-center justify-center mb-2">
                  <span className="text-xs font-bold text-bm-amber">{n}</span>
                </div>
                <div className="text-sm font-semibold text-gray-900 mb-1">{title}</div>
                <div className="text-xs text-gray-500 leading-relaxed">{desc}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
