import { createClient } from '@/lib/supabase/server';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import FavoriteButton from './FavoriteButton';
import StopLinesList from './StopLinesList';
import { Ic } from '@/components/ui/Ic';
import { Pill } from '@/components/ui/Pill';
import { WaxStrip } from '@/components/ui/WaxStrip';

type Props = { params: Promise<{ stop_id: string }> };

export default async function ArretPage({ params }: Props) {
  const supabase = await createClient();
  const { stop_id } = await params;
  const stopId = decodeURIComponent(stop_id);

  const { data: stop, error: stopErr } = await supabase
    .from('gtfs_stops')
    .select('stop_id, stop_name, stop_lat, stop_lon, commune')
    .eq('stop_id', stopId)
    .maybeSingle();

  if (stopErr || !stop) notFound();

  const { data: { user } } = await supabase.auth.getUser();

  const [{ data: lignes }, { data: favRow }, { data: profile }] = await Promise.all([
    supabase.rpc('lignes_par_arret', { p_stop_id: stopId }),
    user
      ? supabase.from('user_favorites').select('id').eq('user_id', user.id).eq('stop_id', stopId).eq('kind', 'stop').limit(1).maybeSingle()
      : Promise.resolve({ data: null }),
    user
      ? supabase.from('profiles').select('preferred_transit_modes').eq('id', user.id).maybeSingle()
      : Promise.resolve({ data: null }),
  ]);

  const isFavorited = !!favRow;
  const prefs = profile?.preferred_transit_modes || ['Gbaka', 'Woro-woro', 'Taxi', 'Saloni'];

  return (
    <div style={{ minHeight: '100dvh', background: 'var(--cream)', color: 'var(--ink)', display: 'flex', flexDirection: 'column' }}>

      {/* HERO */}
      <div style={{ background: 'var(--ink)', color: 'var(--cream)', position: 'relative', overflow: 'hidden', paddingTop: 'max(56px, env(safe-area-inset-top, 0px) + 16px)', paddingBottom: 28, paddingLeft: 20, paddingRight: 20 }}>
        <div className="wax-bg" style={{ position: 'absolute', inset: 0, color: 'var(--orange)', opacity: 0.12, pointerEvents: 'none' }} />
        <div style={{ position: 'relative', zIndex: 2 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
            <Link href="/app" style={{ width: 40, height: 40, borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--cream)', background: 'rgba(255,255,255,0.1)', textDecoration: 'none' }}>
              <Ic.Back s={20} />
            </Link>
            <div style={{ display: 'flex', gap: 8 }}>
              <Pill color="var(--orange)">GARE GBAKA</Pill>
              <Pill color="var(--green)">ACTIVE</Pill>
            </div>
          </div>
          <h1 className="font-display" style={{ fontSize: 28, color: '#fff', lineHeight: 1.05, marginBottom: 6 }}>{stop.stop_name}</h1>
          {stop.commune && (
            <p style={{ fontSize: 13, color: 'rgba(247,241,230,0.6)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: 0.5 }}>{stop.commune} · Abidjan</p>
          )}
        </div>
      </div>

      <WaxStrip color="var(--orange)" height={6} />

      {/* CONTENT */}
      <div className="no-scrollbar" style={{ flex: 1, overflowY: 'auto', padding: '20px 16px 100px', display: 'flex', flexDirection: 'column', gap: 14 }}>

        {/* Favorite + coords */}
        <div style={{ padding: 16, borderRadius: 18, background: 'var(--cream-2)', border: '1px solid var(--line)', display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 12, color: 'var(--muted)', fontWeight: 600, marginBottom: 4 }}>
              {stop.stop_lat.toFixed(4)}, {stop.stop_lon.toFixed(4)}
            </div>
            <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--ink)' }}>
              {lignes ? lignes.length : 0} ligne{(lignes?.length ?? 0) !== 1 ? 's' : ''} passante{(lignes?.length ?? 0) !== 1 ? 's' : ''}
            </div>
          </div>
          {user && (
            <FavoriteButton
              stopId={stop.stop_id}
              stopName={stop.stop_name}
              commune={stop.commune ?? null}
              lat={stop.stop_lat}
              lon={stop.stop_lon}
              initialFavorited={isFavorited}
              userId={user.id}
            />
          )}
        </div>

        {/* Live tarifs (static for now) */}
        <div style={{ borderRadius: 18, background: 'var(--cream-2)', border: '1px solid var(--line)', overflow: 'hidden' }}>
          <div style={{ padding: '12px 16px', borderBottom: '1px solid var(--line)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div className="font-display" style={{ fontSize: 17 }}>Tarifs réels</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 11, color: 'var(--green)', fontWeight: 700 }}>
              <div className="shimmer" style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--green)' }} />
              EN DIRECT
            </div>
          </div>
          {[
            { dest: 'Yopougon Selmer', price: '200F', conf: 14 },
            { dest: 'Plateau', price: '300F', conf: 28 },
            { dest: 'Abobo', price: '250F', conf: 9 },
          ].map((t, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 16px', borderBottom: i < 2 ? '1px solid var(--line)' : 'none' }}>
              <div style={{ width: 36, height: 36, borderRadius: 10, background: 'color-mix(in oklab, var(--orange) 12%, transparent)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--orange)', flexShrink: 0 }}>
                <Ic.Route s={18} />
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--ink)' }}>{t.dest}</div>
                <div style={{ fontSize: 11, color: 'var(--muted)' }}>Confirmé par {t.conf} Babis</div>
              </div>
              <div className="font-display" style={{ fontSize: 18, color: 'var(--orange)' }}>{t.price}</div>
            </div>
          ))}
          <div style={{ padding: 12 }}>
            <button className="press" style={{ width: '100%', padding: 12, borderRadius: 12, border: '1.5px dashed var(--orange)', background: 'transparent', color: 'var(--orange)', fontSize: 13, fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
              <Ic.Plus s={16} /> Confirmer un tarif
            </button>
          </div>
        </div>

        {/* Lines */}
        <div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
            <div className="font-display" style={{ fontSize: 18 }}>Lignes passantes</div>
            {lignes && <span style={{ fontSize: 11, color: 'var(--muted)', fontWeight: 700 }}>{lignes.length} ligne{lignes.length !== 1 ? 's' : ''}</span>}
          </div>
          <StopLinesList lines={lignes || []} preferredModes={prefs} />
        </div>
      </div>
    </div>
  );
}
