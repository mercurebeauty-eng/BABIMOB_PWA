import { createClient } from '@/lib/supabase/server';
import Link from 'next/link';
import BeigeMapBackground from '@/components/BeigeMapBackground';

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
    <div className="flex-1 flex flex-col overflow-y-auto bg-beige-50 text-beige-text font-sans relative">
      <BeigeMapBackground />
      
      <div className="sticky top-0 z-20 bg-beige-50/80 backdrop-blur-xl border-b border-beige-200/50 px-4 py-3 flex items-center gap-3">
        <Link href="/app" className="p-2 -ml-2 rounded-full hover:bg-beige-100 transition-colors" aria-label="Retour à la carte">
          <svg className="w-5 h-5 text-beige-muted" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <path d="m15 18-6-6 6-6" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </Link>
        <div className="flex-1">
          <div className="text-sm font-black uppercase tracking-widest text-beige-text">C&apos;comment</div>
          <div className="text-[10px] text-beige-muted font-bold uppercase tracking-widest">Activité d&apos;Abidjan</div>
        </div>
        {user && (
          <Link href="/app/compte" className="w-9 h-9 rounded-xl bg-abidjan-gradient flex items-center justify-center text-white font-black text-sm shadow-sm hover:scale-105 transition-transform">
            {(user.email?.[0] ?? 'U').toUpperCase()}
          </Link>
        )}
      </div>

      <div className="max-w-2xl mx-auto w-full px-5 py-8 space-y-8 relative z-10">
        {/* Pitch Card */}
        <div className="bg-white rounded-[2.5rem] border-2 border-beige-200 shadow-xl shadow-black/5 p-8 relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-32 h-32 bg-abidjan-orange/5 rounded-full -mr-16 -mt-16 blur-2xl group-hover:bg-abidjan-orange/10 transition-colors" />
          <div className="text-4xl mb-6">💬</div>
          <h1 className="font-display font-black text-3xl mb-4 tracking-tight">C&apos;est comment Abidjan ?</h1>
          <p className="text-base text-beige-muted font-medium leading-relaxed mb-8">
            Dis à la communauté où tu es. Découvre les lieux chauds, demande des avis et deviens une <strong className="text-abidjan-orange">Légende</strong> de la cité.
          </p>
          {!user && (
            <Link href="/app/auth/signin" className="inline-flex items-center gap-3 bg-abidjan-orange text-white text-sm font-black px-8 py-4 rounded-full shadow-lg shadow-abidjan-orange/20 hover:shadow-abidjan-orange/40 transition-all">
              Se connecter pour participer <span className="text-lg">→</span>
            </Link>
          )}
        </div>

        {user && myCheckins.length > 0 && (
          <div className="bg-white rounded-[2.5rem] border-2 border-beige-200 shadow-xl shadow-black/5 p-8">
            <div className="flex items-center justify-between mb-8">
              <div className="text-xs uppercase tracking-widest text-abidjan-orange font-black">Mon historique</div>
              <Link href="/app/compte" className="text-xs font-black text-beige-muted hover:text-abidjan-orange transition-colors uppercase tracking-widest">Voir profil →</Link>
            </div>
            <ul className="space-y-4">
              {myCheckins.slice(0, 3).map((c) => (
                <li key={c.id} className="flex items-center gap-4 bg-beige-50 rounded-2xl p-4 border border-beige-100">
                  <div className="w-10 h-10 rounded-xl bg-white flex items-center justify-center text-xl shadow-sm">
                    📍
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-black text-beige-text truncate">{c.stop_name}</div>
                    {c.commune && <div className="text-[10px] text-beige-muted font-bold uppercase tracking-widest mt-1">{c.commune}</div>}
                  </div>
                  <div className="text-[10px] text-beige-muted font-black uppercase tracking-widest">{timeAgo(c.created_at)}</div>
                </li>
              ))}
            </ul>
          </div>
        )}

        <div>
          <div className="text-xs uppercase tracking-widest text-beige-muted font-black mb-6 px-4 flex items-center justify-between">
            <span>En direct du terrain ({checkins.length})</span>
            <span className="w-2 h-2 rounded-full bg-abidjan-green animate-pulse shadow-[0_0_8px_rgba(46,221,139,0.5)]" />
          </div>
          
          {checkins.length === 0 ? (
            <div className="bg-white rounded-[2.5rem] border-2 border-beige-200 p-12 text-center shadow-xl shadow-black/5">
              <div className="text-5xl mb-6">👋</div>
              <p className="text-lg text-beige-muted font-bold mb-8 leading-relaxed">Sois le premier à marquer ton territoire !</p>
              <Link href="/app" className="inline-flex items-center gap-2 bg-abidjan-orange text-white font-black px-8 py-4 rounded-full shadow-lg shadow-abidjan-orange/20">
                Explorer la carte →
              </Link>
            </div>
          ) : (
            <ul className="space-y-3">
              {checkins.map((c) => (
                <li key={c.id} className="bg-white rounded-2xl border-2 border-beige-200 shadow-sm hover:shadow-md transition-all flex items-center gap-4 px-5 py-4 group">
                  <div className="w-12 h-12 rounded-xl bg-beige-50 flex items-center justify-center text-2xl shadow-inner group-hover:scale-110 transition-transform">
                    📍
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-black text-beige-text truncate">{c.stop_name}</div>
                    {c.commune && <div className="text-[10px] text-beige-muted font-bold uppercase tracking-widest mt-1">{c.commune}</div>}
                  </div>
                  <div className="text-right flex-shrink-0">
                    <div className="text-lg">👤</div>
                    <div className="text-[9px] font-black text-beige-muted uppercase tracking-widest mt-1">{timeAgo(c.created_at)}</div>
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
