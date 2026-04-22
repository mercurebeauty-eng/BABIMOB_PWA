export default function ItinerairePage() {
  return (
    <div className="max-w-3xl mx-auto w-full px-4 py-10">
      <div className="bg-white rounded-2xl shadow-md p-8 border border-gray-100 text-center">
        <div className="text-5xl mb-3">🚐</div>
        <h1 className="text-2xl font-bold text-babimob-blue">Calculateur d'itinéraire</h1>
        <p className="text-sm text-gray-500 mt-2 max-w-md mx-auto">
          Bientôt : saisis ton point de départ et ta destination, on te calcule le meilleur itinéraire
          gbaka + woro-woro + marche, avec horaires estimés.
        </p>

        <div className="mt-6 inline-flex items-center gap-2 bg-babimob-orange/10 text-babimob-orange text-xs font-medium px-3 py-1.5 rounded-full">
          <span className="w-2 h-2 rounded-full bg-babimob-orange animate-pulse"></span>
          En développement — OpenTripPlanner
        </div>

        <div className="mt-8 grid grid-cols-1 sm:grid-cols-3 gap-3 text-left">
          <div className="bg-gray-50 rounded-xl p-4 text-sm">
            <div className="font-semibold text-babimob-blue mb-1">1. Saisie</div>
            <div className="text-gray-500 text-xs">Départ et arrivée par adresse ou arrêt.</div>
          </div>
          <div className="bg-gray-50 rounded-xl p-4 text-sm">
            <div className="font-semibold text-babimob-blue mb-1">2. Calcul</div>
            <div className="text-gray-500 text-xs">OTP combine GTFS + OSM pour tracer le trajet.</div>
          </div>
          <div className="bg-gray-50 rounded-xl p-4 text-sm">
            <div className="font-semibold text-babimob-blue mb-1">3. Résultat</div>
            <div className="text-gray-500 text-xs">Étapes, lignes à prendre, durée estimée.</div>
          </div>
        </div>
      </div>
    </div>
  );
}
