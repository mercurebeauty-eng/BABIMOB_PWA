import { createClient } from '@/lib/supabase/server';
import Link from 'next/link';
import { notFound } from 'next/navigation';

// Next.js 15+ : params est maintenant une Promise
type Props = { params: Promise<{ stop_id: string }> };

export default async function ArretPage({ params }: Props) {
  const supabase = await createClient();
  const { stop_id } = await params;
  const stopId = decodeURIComponent(stop_id);

  // 1) Récupérer l'arrêt
  const { data: stop, error: stopErr } = await supabase
    .from('gtfs_stops')
    .select('stop_id, stop_name, stop_lat, stop_lon, commune')
    .eq('stop_id', stopId)
    .maybeSingle();

  if (stopErr || !stop) notFound();

  // 2) Récupérer les lignes qui passent par cet arrêt
  const { data: lignes } = await supabase.rpc('lignes_par_arret', {
    p_stop_id: stopId
  });

  return (
    <div className="max-w-4xl mx-auto w-full px-4 py-6">
      <Link href="/" className="text-sm text-babimob-blue hover:underline">
        ← Retour
      </Link>

      <div className="mt-4 bg-white rounded-xl shadow-md p-6 border border-gray-100">
        <div className="text-xs uppercase tracking-wide text-babimob-blue font-semibold">
          Arrêt
        </div>
        <h1 className="text-2xl font-bold mt-1">{stop.stop_name}</h1>
        {stop.commune && <div className="text-gray-500 mt-1">{stop.commune}</div>}
      </div>

      <section className="mt-6">
        <h2 className="text-lg font-bold mb-3">
          Lignes desservant cet arrêt
          {lignes && <span className="text-gray-400 font-normal"> · {lignes.length}</span>}
        </h2>

        {(!lignes || lignes.length === 0) && (
          <div className="text-sm text-gray-500 bg-white rounded-xl p-5 border border-gray-100">
            Aucune ligne trouvée pour cet arrêt.
          </div>
        )}

        <ul className="space-y-2">
          {lignes?.map((l: any) => (
            <li
              key={`${l.route_id}-${l.direction_id ?? 0}`}
              className="bg-white rounded-xl border border-gray-100 hover:border-babimob-blue transition p-4 flex items-center justify-between"
            >
              <div>
                <div className="font-semibold text-sm">{l.route_long_name}</div>
                <div className="text-xs text-gray-500 mt-0.5">
                  {l.agency_id}
                  {l.trip_headsign && <> · Direction : {l.trip_headsign}</>}
                </div>
              </div>
              <div className="text-xs text-babimob-orange font-medium">
                {l.route_id}
              </div>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
