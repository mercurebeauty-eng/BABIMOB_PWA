import { createClient } from '@/lib/supabase/server';
import Link from 'next/link';

type Checkin = {
  id: string;
  stop_name: string;
  commune: string | null;
  created_at: string;
};

function timeAgo(iso: string): string {
  const mins = Math.round((Date.now() - new Date(iso).getTime()) / 60000);
  if (mins < 1)  return "à l'instant";
  if (mins < 60) return `il y a ${mins} min`;
  if (mins < 1440) return `il y a ${Math.floor(mins / 60)} h`;
  return `il y a ${Math.floor(mins / 1440)} j`;
}

export default async function CcommentPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const { data: feed } = await supabase
    .from('checkins')
    .select('id, stop_name, commune, created_at')
    .eq('is_public', true)
    .order('created_at', { ascending: false })
    .limit(30);

  const { data: mine } = user ? await supabase
    .from('checkins')
    .select('id, stop_name, commune, created_at')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })
    .limit(10) : { data: [] };

  const checkins = (feed ?? []) as Checkin[];
  const myCheckins = (mine ?? []) as Checkin[];

  return (
    <div className="flex-1 flex flex-col overflow-y-auto bg-gray-50">
      <div className="sticky top-0 z-10 bg-white/95 backdrop-blur-xl border-b border-gray-100 px-4 py-3 flex items-center gap-3">
        <Link href="/app" className="p-1.5 -ml-1 rounded-xl hover:bg-gray-100 transition" aria-label="Retour à la carte">
          <svg className="w-5 h-5 text-gray-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="m15 18-6-6 6-6" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </Link>
        <div className="flex-1">
          <div className="text-sm font-bold text-gray-900">C&apos;comment</div>
          <div className="text-xs text-gray-400">Activité locale</div>
        </div>
        {user && (
          <Link href="/app/compte" className="w-8 h-8 rounded-xl bg-bm-gradient flex items-center justify-center text-black font-bold text-xs">
            {(user.email?.[0] ?? 'U').toUpperCase()}
          </Link>
        )}
      </div>

      <div className="max-w-2xl mx-auto w-full px-4 py-5 space-y-5">
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
          <div className="text-2xl mb-2">💬</div>
          <h1 className="font-bold text-gray-900 text-lg mb-1">C&apos;comment ?</h1>
          <p className="text-sm text-gray-500 leading-relaxed">
            Dis à la communauté que tu es quelque part. Découvre les lieux actifs, demande des avis, gagne le badge <strong className="text-bm-amber">Explorateur</strong>.
          </p>
          {!user && (
            <Link href="/app/auth/signin" className="mt-4 inline-flex items-center gap-2 bg-bm-gradient text-black text-sm font-semibold px-4 py-2.5 rounded-xl">
              Se connecter pour participer →
            </Link>
          )}
        </div>

        {user && myCheckins.length > 0 && (
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
            <div className="flex items-center justify-between mb-3">
              <div className="text-xs uppercase tracking-widest text-bm-amber font-semibold">Mes visites récentes</div>
              <Link href="/app/compte" className="text-xs text-gray-400 hover:text-gray-600">Profil →</Link>
            </div>
            <ul className="space-y-2">
              {myCheckins.slice(0, 3).map((c) => (
                <li key={c.id} className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-xl bg-bm-amber/10 flex items-center justify-center flex-shrink-0">
                    <span className="text-sm">📍</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium text-gray-900 truncate">{c.stop_name}</div>
                    {c.commune && <div className="text-xs text-gray-400">{c.commune}</div>}
                  </div>
                  <div className="text-xs text-gray-400 flex-shrink-0">{timeAgo(c.created_at)}</div>
                </li>
              ))}
            </ul>
          </div>
        )}

        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
          <div className="text-xs uppercase tracking-widest text-gray-400 font-semibold mb-3">Demander un avis</div>
          <p className="text-sm text-gray-500 mb-4">
            Sur la page d'un arrêt, appuie sur <strong>📍 J'y suis !</strong> pour laisser un check-in.
          </p>
          <Link href="/app" className="flex items-center justify-center gap-2 bg-gray-100 hover:bg-gray-200 text-gray-700 text-sm font-semibold px-4 py-3 rounded-2xl transition-colors">
            🗺️ Retour à la carte
          </Link>
        </div>

        <div>
          <div className="text-xs uppercase tracking-widest text-gray-400 font-semibold mb-3 px-1">
            Activité récente ({checkins.length})
          </div>
          {checkins.length === 0 ? (
            <div className="bg-white rounded-2xl border border-gray-100 p-8 text-center">
              <div className="text-3xl mb-2">👋</div>
              <p className="text-sm text-gray-500">Sois le premier à faire un check-in !</p>
              <Link href="/app" className="mt-3 inline-block text-sm font-semibold text-bm-amber">Explorer la carte →</Link>
            </div>
          ) : (
            <ul className="space-y-2">
              {checkins.map((c) => (
                <li key={c.id} className="bg-white rounded-2xl border border-gray-100 shadow-sm flex items-center gap-3 px-4 py-3.5">
                  <div className="w-9 h-9 rounded-xl bg-bm-amber/10 flex items-center justify-center flex-shrink-0">
                    <span className="text-base">📍</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium text-gray-900 truncate">{c.stop_name}</div>
                    {c.commune && <div className="text-xs text-gray-400">{c.commune}</div>}
                  </div>
                  <div className="text-xs text-gray-400 flex-shrink-0 text-right">
                    <div>👤</div>
                    <div className="mt-0.5">{timeAgo(c.created_at)}</div>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}
