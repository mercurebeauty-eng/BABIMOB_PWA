import { createClient } from '@/lib/supabase/server';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import PlaceHeroMap from '@/components/PlaceHeroMap';
import CheckInButtonPlace from '@/components/CheckInButtonPlace';
import PlaceSocialSections from '@/components/PlaceSocialSections';
import { Ic } from '@/components/ui/Ic';

type Props = { params: Promise<{ id: string }> };

const CATEGORY_LABELS: Record<string, string> = {
  food:          'RESTAURATION',
  shop:          'COMMERCE',
  service:       'SERVICE',
  health:        'SANTÉ',
  entertainment: 'LOISIRS',
  other:         'LIEU',
};

function formatDist(m: number) {
  return m < 1000 ? `${Math.round(m)}m` : `${(m / 1000).toFixed(1)}km`;
}

export default async function PlacePage({ params }: Props) {
  const supabase = await createClient();
  const { id } = await params;
  const { data: { user } } = await supabase.auth.getUser();

  const [
    { data: place }, 
    { data: offers },
    { data: checkins },
    { data: advice },
    { data: userProfile }
  ] = await Promise.all([
    supabase.from('places').select('*').eq('id', id).maybeSingle(),
    supabase
      .from('place_offers')
      .select('*')
      .eq('place_id', id)
      .eq('is_active', true)
      .order('created_at', { ascending: false }),
    supabase
      .from('checkins')
      .select('id, created_at, display_name, avatar_emoji, is_public')
      .eq('place_id', id)
      .order('created_at', { ascending: false })
      .limit(5),
    supabase
      .from('place_advice')
      .select('id, content, created_at, is_question, profiles(display_name, avatar_emoji)')
      .eq('place_id', id)
      .order('created_at', { ascending: false })
      .limit(10),
    user 
      ? supabase.from('profiles').select('is_verified_explorer').eq('id', user.id).single()
      : Promise.resolve({ data: null }),
  ]);

  if (!place) notFound();

  const { data: nearbyStops } = await supabase.rpc('arrets_proches', {
    p_lat: place.lat,
    p_lon: place.lon,
    p_radius_m: 600,
    p_limit: 4,
  });

  const now = new Date();
  const isActive = (d: string | null) => !d || new Date(d) > now;
  const sponsoredActive = place.is_sponsored && isActive(place.sponsor_expires_at);
  const color = place.cover_color ?? 'var(--orange)';

  return (
    <div style={{ minHeight: '100dvh', background: 'var(--cream)', color: 'var(--ink)', position: 'relative' }}>
      
      {/* MAP HERO */}
      <div style={{ position: 'relative' }}>
        <PlaceHeroMap lat={place.lat} lon={place.lon} emoji={place.logo_emoji ?? '📍'} name={place.name} id={place.id} />

        {/* TOP HEADER OVERLAY */}
        <div style={{ position: 'absolute', top: 20, left: 20, right: 20, display: 'flex', justifyContent: 'space-between', alignItems: 'center', zIndex: 10 }}>
          <Link href="/app" className="press" style={{ 
            width: 44, height: 44, borderRadius: '50%', background: '#fff', 
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: '0 4px 12px rgba(0,0,0,0.1)', border: 'none'
          }}>
            <Ic.Back s={22} />
          </Link>
          
          {sponsoredActive && (
             <div style={{ 
               background: 'rgba(255,255,255,0.9)', padding: '6px 12px', borderRadius: 20,
               display: 'flex', alignItems: 'center', gap: 6, fontSize: 10, fontWeight: 900,
               boxShadow: '0 4px 12px rgba(0,0,0,0.05)', color: color
             }}>
               <span style={{ fontSize: 14 }}>{place.sponsor_tier === 'elite' ? '⭐' : '✓'}</span>
               {place.sponsor_tier === 'elite' ? 'ÉLITE' : 'PRO'}
             </div>
          )}
        </div>
      </div>

      <div className="no-scrollbar" style={{ position: 'relative', marginTop: -40, padding: '0 20px 100px 20px' }}>
        
        {/* TITLE CARD */}
        <div className="slide-up" style={{ 
          background: '#fff', padding: 24, borderRadius: 28, 
          boxShadow: '0 10px 40px rgba(26,20,16,0.08)',
          marginBottom: 20, position: 'relative'
        }}>
          <div style={{ display: 'flex', gap: 16 }}>
            <div style={{ 
              width: 72, height: 72, borderRadius: 20, 
              background: 'var(--cream)', display: 'flex', 
              alignItems: 'center', justifyContent: 'center', fontSize: 36,
              border: '1.5px solid var(--cream-2)'
            }}>
              {place.logo_emoji ?? '📍'}
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 10, fontWeight: 900, color: 'var(--orange)', letterSpacing: 1, marginBottom: 4 }}>
                {CATEGORY_LABELS[place.category] ?? 'LIEU'}{place.commune ? ` · ${place.commune.toUpperCase()}` : ''}
              </div>
              <h1 className="font-display" style={{ fontSize: 24, margin: 0, lineHeight: 1.1 }}>{place.name}</h1>
            </div>
          </div>

          {place.description && (
            <p style={{ marginTop: 16, fontSize: 14, color: 'var(--muted)', lineHeight: 1.5, margin: '16px 0 0 0' }}>
              {place.description}
            </p>
          )}

          {place.address && (
            <div style={{ 
              marginTop: 16, padding: '12px 16px', borderRadius: 16, 
              background: 'var(--cream-2)', display: 'flex', gap: 10, alignItems: 'center' 
            }}>
              <Ic.Pin s={16} color="var(--muted)" />
              <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--ink)' }}>{place.address}</div>
            </div>
          )}
        </div>

        {/* CHECK-IN CTA */}
        <div className="slide-up" style={{ marginBottom: 24, animationDelay: '0.1s' }}>
          <CheckInButtonPlace 
            placeId={place.id} 
            placeName={place.name} 
            commune={place.commune ?? null} 
            lat={place.lat}
            lon={place.lon}
          />
        </div>

        {/* OFFRES & PROMOS */}
        {((place.has_campaign && place.campaign_label) || (offers && offers.length > 0)) && (
          <div className="slide-up" style={{ 
            background: '#fff', padding: 24, borderRadius: 28, marginBottom: 24,
            boxShadow: '0 4px 20px rgba(0,0,0,0.03)', animationDelay: '0.2s'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 20 }}>
              <Ic.Bolt s={20} color="var(--orange)" />
              <h2 style={{ fontSize: 12, fontWeight: 900, letterSpacing: 0.8, margin: 0 }}>OFFRES & ÉVÉNEMENTS</h2>
            </div>

            {place.has_campaign && place.campaign_label && (
              <div style={{ 
                background: 'var(--orange)', color: '#fff', padding: 16, 
                borderRadius: 20, marginBottom: 12, position: 'relative', overflow: 'hidden' 
              }}>
                <div className="wax-bg" style={{ position: 'absolute', inset: 0, opacity: 0.1 }} />
                <div style={{ position: 'relative', zIndex: 1 }}>
                  <div style={{ fontSize: 10, fontWeight: 900, opacity: 0.9 }}>CAMPAGNE EN COURS</div>
                  <div className="font-display" style={{ fontSize: 18, marginTop: 4 }}>{place.campaign_label}</div>
                </div>
              </div>
            )}

            {offers?.map((offer) => (
              <div key={offer.id} style={{ 
                background: 'var(--cream-2)', padding: 16, borderRadius: 20, 
                display: 'flex', gap: 14, alignItems: 'center', marginBottom: 10
              }}>
                {offer.discount_pct && (
                  <div style={{ 
                    width: 50, height: 50, borderRadius: 12, background: '#fff',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 14, fontWeight: 900, color: 'var(--orange)',
                    boxShadow: '0 4px 10px rgba(0,0,0,0.05)'
                  }}>
                    -{offer.discount_pct}%
                  </div>
                )}
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 14, fontWeight: 700 }}>{offer.title}</div>
                  {offer.description && <div style={{ fontSize: 11, color: 'var(--muted)', marginTop: 2 }}>{offer.description}</div>}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* CONTACT QUICK LINKS */}
        {(place.phone || place.whatsapp || place.instagram || place.website) && (
          <div className="slide-up" style={{ 
            display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 12, marginBottom: 24,
            animationDelay: '0.3s'
          }}>
            {place.whatsapp && (
              <a href={`https://wa.me/${place.whatsapp.replace(/\D/g, '')}`} target="_blank" rel="noopener noreferrer" style={{ textDecoration: 'none' }}>
                <div className="press" style={{ background: '#25D366', color: '#fff', padding: 16, borderRadius: 20, display: 'flex', alignItems: 'center', gap: 10 }}>
                  <span style={{ fontSize: 20 }}>💬</span>
                  <span style={{ fontSize: 12, fontWeight: 800 }}>WHATSAPP</span>
                </div>
              </a>
            )}
            {place.phone && (
              <a href={`tel:${place.phone}`} style={{ textDecoration: 'none' }}>
                <div className="press" style={{ background: 'var(--ink)', color: '#fff', padding: 16, borderRadius: 20, display: 'flex', alignItems: 'center', gap: 10 }}>
                  <span style={{ fontSize: 20 }}>📞</span>
                  <span style={{ fontSize: 12, fontWeight: 800 }}>APPELER</span>
                </div>
              </a>
            )}
            {place.instagram && (
              <a href={`https://instagram.com/${place.instagram.replace('@', '')}`} target="_blank" rel="noopener noreferrer" style={{ textDecoration: 'none' }}>
                <div className="press" style={{ background: '#E4405F', color: '#fff', padding: 16, borderRadius: 20, display: 'flex', alignItems: 'center', gap: 10 }}>
                  <span style={{ fontSize: 20 }}>📸</span>
                  <span style={{ fontSize: 12, fontWeight: 800 }}>INSTAGRAM</span>
                </div>
              </a>
            )}
            {place.website && (
              <a href={place.website} target="_blank" rel="noopener noreferrer" style={{ textDecoration: 'none' }}>
                <div className="press" style={{ background: '#fff', color: 'var(--ink)', padding: 16, borderRadius: 20, display: 'flex', alignItems: 'center', gap: 10, boxShadow: '0 4px 12px rgba(0,0,0,0.05)' }}>
                  <span style={{ fontSize: 20 }}>🌐</span>
                  <span style={{ fontSize: 12, fontWeight: 800 }}>SITE WEB</span>
                </div>
              </a>
            )}
          </div>
        )}

        {/* ARRÊTS PROCHES */}
        {nearbyStops && nearbyStops.length > 0 && (
          <div className="slide-up" style={{ 
            background: '#fff', padding: 24, borderRadius: 28, marginBottom: 24,
            boxShadow: '0 4px 20px rgba(0,0,0,0.03)', animationDelay: '0.4s'
          }}>
             <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 20 }}>
              <Ic.Route s={20} color="var(--orange)" />
              <h2 style={{ fontSize: 12, fontWeight: 900, letterSpacing: 0.8, margin: 0 }}>ARRÊTS À PROXIMITÉ</h2>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {(nearbyStops as any[]).map((stop) => (
                <Link key={stop.stop_id} href={`/app/arret/${encodeURIComponent(stop.stop_id)}`} style={{ textDecoration: 'none' }}>
                  <div className="press" style={{ 
                    background: 'var(--cream-2)', padding: '12px 16px', borderRadius: 20,
                    display: 'flex', alignItems: 'center', gap: 14
                  }}>
                    <div style={{ width: 44, height: 44, borderRadius: 12, background: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20 }}>
                      🚐
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--ink)' }}>{stop.stop_name}</div>
                      <div style={{ fontSize: 11, fontWeight: 900, color: 'var(--orange)', marginTop: 2 }}>{formatDist(stop.distance_m)}</div>
                    </div>
                    <Ic.Arrow s={18} color="var(--muted)" />
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* SECTIONS SOCIALES */}
        <div className="slide-up" style={{ animationDelay: '0.5s' }}>
          <PlaceSocialSections 
            placeId={id} 
            initialCheckins={checkins || []} 
            initialAdvice={(advice as any[]) || []}
            userId={user?.id || null}
            isVerifiedExplorer={!!userProfile?.is_verified_explorer}
          />
        </div>

      </div>
    </div>
  );
}
