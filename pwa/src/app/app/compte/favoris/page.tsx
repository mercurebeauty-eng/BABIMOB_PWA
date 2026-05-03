import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import Link from 'next/link';

export default async function FavorisPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/app/auth/signin');

  const { data: favorites } = await supabase
    .from('user_favorites')
    .select('id, label, stop_id, route_id, kind')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false });

  return (
    <div className="flex-1 flex flex-col overflow-y-auto bg-beige-50 text-beige-text font-sans">
      <div className="sticky top-0 z-30 bg-beige-50/80 backdrop-blur-xl border-b border-beige-200/50 px-4 py-3 flex items-center gap-3">
        <Link href="/app/compte" className="p-2 -ml-2 rounded-full hover:bg-beige-100 transition-colors" aria-label="Retour au profil">
          <svg className="w-5 h-5 text-beige-muted" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <path d="m15 18-6-6 6-6" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </Link>
        <span className="text-[10px] font-black uppercase tracking-[0.2em] text-beige-muted flex-1 text-center pr-8">Mes Favoris</span>
      </div>

      <div className="max-w-xl mx-auto w-full px-5 py-8">
        <div className="space-y-2">
          {favorites?.map(f => (
            <Link
              key={f.id}
              href={
                f.kind === 'stop' && f.stop_id ? `/app/arret/${encodeURIComponent(f.stop_id)}`
                : f.kind === 'place' && f.stop_id ? `/app/place/${encodeURIComponent(f.stop_id)}`
                : f.kind === 'route' && f.route_id ? `/app/ligne/${encodeURIComponent(f.route_id)}?dir=0`
                : '/app'
              }
              className="flex items-center justify-between p-4 bg-white rounded-2xl border-2 border-beige-200 hover:border-abidjan-orange/30 transition-all shadow-sm"
            >
              <span className="text-[11px] font-black text-beige-text">{f.label}</span>
              <span className="text-[8px] font-black uppercase text-beige-muted border border-beige-200 px-2 py-0.5 rounded-full">
                {f.kind === 'stop' ? 'Arrêt' : f.kind === 'place' ? 'Lieu' : 'Ligne'}
              </span>
            </Link>
          ))}
          {(!favorites || favorites.length === 0) && (
            <div className="py-16 text-center text-[10px] font-bold text-beige-muted uppercase tracking-widest border-2 border-dashed border-beige-100 rounded-3xl">
              Aucun favori enregistré
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
