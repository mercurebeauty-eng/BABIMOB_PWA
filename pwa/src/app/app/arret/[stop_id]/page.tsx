import { createClient } from '@/lib/supabase/server';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { Ic } from '@/components/ui/Ic';
import Vehicle from '@/components/ui/Vehicle';
import { Pill } from '@/components/ui/Pill';
import { WaxStrip } from '@/components/ui/WaxStrip';
import Map from '@/components/MapWrapper';
import FavoriteButton from './FavoriteButton';
import StopLinesList from './StopLinesList';
import TarifsSection from './TarifsSection';

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
      
      {/* Hero map */}
      <div style={{ position: 'relative', height: 240, flexShrink: 0, overflow: 'hidden' }}>
        <Map
          center={[stop.stop_lat, stop.stop_lon]}
          zoom={16}
          className="w-full h-full"
          stops={[stop]}
          selectedStopId={stop.stop_id}
        />
        <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(180deg, transparent 50%, var(--cream) 100%)', pointerEvents: 'none' }} />
        <div style={{ position: 'absolute', top: 56, left: 16, right: 16, display: 'flex', justifyContent: 'space-between', zIndex: 10 }}>
          <Link href="/app" style={{ width: 40, height: 40, borderRadius: 12, border: 'none', background: 'var(--cream)', color: 'var(--ink)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 2px 8px rgba(0,0,0,0.15)', textDecoration: 'none' }}>
            <Ic.Back s={20} />
          </Link>
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
      </div>

      <div className="no-scrollbar" style={{ flex: 1, overflowY: 'auto', padding: '0 16px 100px', marginTop: -40, position: 'relative', zIndex: 2 }}>
        {/* Title card */}
        <div style={{ background: 'var(--cream-2)', borderRadius: 22, padding: 18, border: '1px solid var(--line)', boxShadow: '0 8px 24px rgba(0,0,0,0.06)' }}>
          <div style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
            <Pill color="var(--orange)">GARE GBAKA</Pill>
            <Pill color="var(--green)">ACTIVE</Pill>
          </div>
          <div className="font-display" style={{ fontSize: 28, lineHeight: 1.05 }}>{stop.stop_name}</div>
          <div style={{ fontSize: 13, color: 'var(--muted)', marginTop: 4 }}>Abidjan · Côte d'Ivoire</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginTop: 14, fontSize: 12 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 4, color: 'var(--orange)', fontWeight: 700 }}>
              <Ic.Star s={14} fill /> 4.6
            </div>
            <span style={{ color: 'var(--muted)' }}>· 1 247 avis</span>
          </div>
        </div>

        <div style={{ marginTop: 16 }}>
          <WaxStrip color="var(--orange)" height={4} />
        </div>

        {/* Tarifs réels — Live Section (Replaced hardcoded with dynamic component) */}
        <TarifsSection
          stopId={stopId}
          stopName={stop.stop_name}
          userId={user?.id || null}
          lines={lignes || []}
        />

        {/* Lines list */}
        <div style={{ marginTop: 28 }}>
          <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: 12 }}>
            <h3 className="font-display" style={{ fontSize: 18, margin: 0 }}>Lignes passantes</h3>
          </div>
          <StopLinesList lines={lignes || []} preferredModes={prefs} stopId={stopId} />
        </div>

        {/* C'COMMENT ? */}
        <div style={{ marginTop: 32, paddingBottom: 40 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
            <h3 className="font-display" style={{ fontSize: 18, margin: 0 }}>C'comment ?</h3>
            <div style={{ fontSize: 11, color: 'var(--orange)', fontWeight: 800 }}>VOIR TOUT</div>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {[
              { user: 'Koffi S.', text: 'Gare bien organisée ce matin. Pas trop de rang.', time: 'il y a 12 min', color: 'var(--orange)' },
              { user: 'Marie-Noëlle', text: 'Attention, le tarif pour Plateau est passé à 300F.', time: 'il y a 45 min', color: 'var(--green)' },
            ].map((r, i) => (
              <div key={i} style={{ display: 'flex', gap: 12 }}>
                <div style={{ width: 36, height: 36, borderRadius: '50%', background: r.color, color: '#fff', fontSize: 14, fontWeight: 900, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>{r.user[0]}</div>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 2 }}>
                    <span style={{ fontSize: 13, fontWeight: 800 }}>{r.user}</span>
                    <span style={{ fontSize: 10, color: 'var(--muted)' }}>{r.time}</span>
                  </div>
                  <p style={{ fontSize: 13, color: 'var(--ink-2)', margin: 0, lineHeight: 1.4 }}>{r.text}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Fixed Bottom CTA */}
      <div style={{ position: 'sticky', bottom: 0, padding: '16px 16px calc(env(safe-area-inset-bottom, 0px) + 16px)', background: 'var(--cream)', borderTop: '1px solid var(--line)', zIndex: 100 }}>
        <button className="press wax-bg" style={{
          width: '100%', height: 56, borderRadius: 18, border: 'none',
          background: 'var(--ink)', color: 'var(--cream)',
          fontSize: 14, fontWeight: 800, cursor: 'pointer',
          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10,
          boxShadow: '0 10px 30px rgba(0,0,0,0.2)'
        }}>
          SUIVRE CETTE LIGNE EN DIRECT
          <Ic.Route s={20} />
        </button>
      </div>
    </div>
  );
}
