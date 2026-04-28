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
import StopCheckinButton from './StopCheckinButton';

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

  const [{ data: lignes }, { data: favRow }, { data: profile }, { data: reports }] = await Promise.all([
    supabase.rpc('lignes_par_arret', { p_stop_id: stopId }),
    user
      ? supabase.from('user_favorites').select('id').eq('user_id', user.id).eq('stop_id', stopId).eq('kind', 'stop').limit(1).maybeSingle()
      : Promise.resolve({ data: null }),
    user
      ? supabase.from('profiles').select('preferred_transit_modes, display_name').eq('id', user.id).maybeSingle()
      : Promise.resolve({ data: null }),
    supabase
      .from('stop_reports')
      .select('id, display_name, category, content, created_at')
      .eq('stop_id', stopId)
      .gt('expires_at', new Date().toISOString())
      .order('created_at', { ascending: false })
      .limit(10),
  ]);

  const isFavorited = !!favRow;
  const prefs = profile?.preferred_transit_modes || ['Gbaka', 'Woro-woro', 'Taxi', 'Saloni'];

  const CAT_META: Record<string, { label: string; emoji: string; color: string }> = {
    trafic:   { label: 'Trafic',   emoji: '🚦', color: 'var(--orange-deep)' },
    tarif:    { label: 'Tarif',    emoji: '💰', color: 'var(--green)'        },
    incident: { label: 'Incident', emoji: '⚠️', color: 'var(--orange)'      },
    travaux:  { label: 'Travaux',  emoji: '🚧', color: 'var(--gold)'         },
    ambiance: { label: 'Ambiance', emoji: '✨', color: 'var(--blue)'         },
  };

  // Priorité d'affichage : incidents/trafic/travaux d'abord, puis le reste
  const PRIORITY: Record<string, number> = { incident: 0, trafic: 1, travaux: 2, tarif: 3, ambiance: 4 };
  const sortedReports = (reports ?? []).sort((a, b) =>
    (PRIORITY[a.category] ?? 9) - (PRIORITY[b.category] ?? 9)
  );

  function timeAgo(iso: string): string {
    const diff = Math.floor((Date.now() - new Date(iso).getTime()) / 1000);
    if (diff < 60) return 'à l\'instant';
    if (diff < 3600) return `il y a ${Math.floor(diff / 60)} min`;
    if (diff < 86400) return `il y a ${Math.floor(diff / 3600)}h`;
    return `il y a ${Math.floor(diff / 86400)}j`;
  }

  return (
    <div style={{ minHeight: '100dvh', background: 'var(--cream)', color: 'var(--ink)', display: 'flex', flexDirection: 'column' }}>
      
      {/* Hero map */}
      <div style={{ position: 'relative', height: 240, flexShrink: 0, overflow: 'hidden' }}>
        <Map
          center={[stop.stop_lat, stop.stop_lon]}
          zoom={16}
          className="absolute inset-0"
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

        {/* Tarifs réels — live */}
        <div style={{ marginTop: 24 }}>
          <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: 12 }}>
            <h3 className="font-display" style={{ fontSize: 18, margin: 0 }}>Tarifs réels aujourd'hui</h3>
            <div style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 11, color: 'var(--green)', fontWeight: 800 }}>
              <div className="shimmer" style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--green)' }} />
              EN DIRECT
            </div>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {[
              { dest: 'Yopougon Selmer', price: '200F', conf: 14, trend: 'stable' },
              { dest: 'Plateau', price: '300F', conf: 28, trend: 'up' },
            ].map((t, i) => (
              <div key={i} className="press" style={{
                display: 'flex', alignItems: 'center', gap: 12,
                padding: 14, borderRadius: 16, background: 'var(--cream-2)', border: '1px solid var(--line)'
              }}>
                <Vehicle kind="gbaka" size={32} />
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--ink)' }}>{t.dest}</div>
                  <div style={{ fontSize: 11, color: 'var(--muted)', fontWeight: 600 }}>Confirmé par {t.conf} Babis</div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div className="font-display" style={{ fontSize: 18, color: 'var(--orange)' }}>{t.price}</div>
                  <div style={{ fontSize: 10, color: t.trend === 'up' ? 'var(--orange-deep)' : 'var(--muted)', fontWeight: 800 }}>
                    {t.trend === 'up' ? '↗ +50F' : '— stable'}
                  </div>
                </div>
              </div>
            ))}
            <button className="press" style={{
              width: '100%', padding: 14, borderRadius: 16, border: '2px dashed var(--line-strong)',
              background: 'transparent', color: 'var(--muted)', fontSize: 12, fontWeight: 800,
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, marginTop: 4
            }}>
              <Ic.Plus s={16} />
              CONFIRMER UN TARIF
            </button>
          </div>
        </div>

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
            {sortedReports.length > 0 && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 11, color: 'var(--green)', fontWeight: 800 }}>
                <div className="shimmer" style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--green)' }} />
                {sortedReports.length} signalement{sortedReports.length > 1 ? 's' : ''}
              </div>
            )}
          </div>

          {sortedReports.length === 0 ? (
            <div style={{ padding: '28px 16px', borderRadius: 16, background: 'var(--cream-2)', border: '1px solid var(--line)', textAlign: 'center' }}>
              <div style={{ fontSize: 28, marginBottom: 8 }}>🤫</div>
              <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--ink)' }}>Aucun signalement actif</div>
              <div style={{ fontSize: 11, color: 'var(--muted)', marginTop: 4 }}>Sois le premier à signaler quelque chose ici.</div>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {sortedReports.map((r) => {
                const meta = CAT_META[r.category] ?? CAT_META.ambiance;
                return (
                  <div key={r.id} style={{ padding: 14, borderRadius: 14, background: 'var(--cream-2)', border: '1px solid var(--line)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
                      <div style={{ width: 32, height: 32, borderRadius: '50%', background: `color-mix(in oklab, ${meta.color} 15%, transparent)`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16, flexShrink: 0 }}>
                        {meta.emoji}
                      </div>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: 12, fontWeight: 800, color: 'var(--ink)' }}>{r.display_name ?? 'Un Babi'}</div>
                        <div style={{ fontSize: 10, color: 'var(--muted)' }}>{timeAgo(r.created_at)}</div>
                      </div>
                      <div style={{ fontSize: 10, fontWeight: 900, color: meta.color, background: `color-mix(in oklab, ${meta.color} 12%, transparent)`, padding: '3px 8px', borderRadius: 99, textTransform: 'uppercase', letterSpacing: 0.4 }}>
                        {meta.label}
                      </div>
                    </div>
                    <p style={{ fontSize: 13, color: 'var(--ink-2)', margin: 0, lineHeight: 1.5 }}>{r.content}</p>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Fixed Bottom CTA */}
      <div style={{ position: 'sticky', bottom: 0, padding: '12px 16px calc(env(safe-area-inset-bottom, 0px) + 12px)', background: 'linear-gradient(0deg, var(--cream) 70%, transparent)', zIndex: 100 }}>
        <div style={{ display: 'flex', gap: 10 }}>
          {user && (
            <StopCheckinButton
              stopId={stopId}
              stopName={stop.stop_name}
              userId={user.id}
              displayName={profile?.display_name ?? null}
            />
          )}
          <button className="press" style={{
            flex: 2, height: 56, borderRadius: 18, border: 'none',
            background: 'var(--orange)', color: '#fff',
            fontSize: 14, fontWeight: 800, cursor: 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10,
            boxShadow: '0 4px 14px rgba(242,108,26,0.4)',
          }}>
            Suivre en direct
            <Ic.Route s={18} />
          </button>
        </div>
      </div>
    </div>
  );
}
