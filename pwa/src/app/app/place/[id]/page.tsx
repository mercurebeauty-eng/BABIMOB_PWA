export const dynamic = 'force-dynamic';

import { createClient } from '@/lib/supabase/server';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import PlaceHeroMap from '@/components/PlaceHeroMap';
import PoiCheckInButton from '@/components/PoiCheckInButton';
import PoiFavoriteButton from '@/components/PoiFavoriteButton';
import PlaceSocialSections from '@/components/PlaceSocialSections';
import { Ic } from '@/components/ui/Ic';

type Props = { 
  params: Promise<{ id: string }>,
  searchParams: Promise<{ lat?: string; lon?: string; name?: string; emoji?: string }> 
};

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

export default async function PlacePage({ params, searchParams }: Props) {
  const supabase = await createClient();
  const { id } = await params;
  const sParams = await searchParams;
  const { data: { user } } = await supabase.auth.getUser();

  const isOSM = id.startsWith('osm-') || id.startsWith('nominatim-');
  
  let place: any = null;
  let offers: any[] = [];
  let checkins: any[] = [];
  let advice: any[] = [];
  let userProfile: any = null;

  if (isOSM) {
    // MODE VIRTUEL (OSM)
    // On construit l'objet place à partir des données de l'URL
    place = {
      id: id,
      name: sParams.name || 'Lieu inconnu',
      lat: parseFloat(sParams.lat || '0'),
      lon: parseFloat(sParams.lon || '0'),
      logo_emoji: sParams.emoji || '📍',
      category: 'other',
      address: '',
      description: 'Lieu identifié via OpenStreetMap.',
      is_sponsored: false,
    };
  } else {
    // MODE STANDARD (Supabase)
    const [
      { data: dbPlace }, 
      { data: dbOffers },
      { data: dbCheckins },
      { data: dbAdvice },
      { data: dbUserProfile }
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
        ? supabase.from('profiles').select('display_name, avatar_emoji, is_verified_explorer').eq('id', user.id).single()
        : Promise.resolve({ data: null }),
    ]);

    if (!dbPlace) notFound();
    place = dbPlace;
    offers = dbOffers || [];
    checkins = dbCheckins || [];
    advice = dbAdvice || [];
    userProfile = dbUserProfile;
  }

  // Les arrêts proches marchent pour tout le monde !
  const { data: nearbyStops } = await supabase.rpc('arrets_proches', {
    p_lat: place.lat,
    p_lon: place.lon,
    p_radius_m: 600,
    p_limit: 4,
  });

  const now = new Date();
  const isActive = (d: string | null) => !d || new Date(d) > now;
  const sponsoredActive = !isOSM && place.is_sponsored && isActive(place.sponsor_expires_at);
  const color = place.cover_color ?? 'var(--orange)';

  return (
    <div style={{ minHeight: '100dvh', background: 'var(--cream)', color: 'var(--ink)', position: 'relative', overflowX: 'hidden' }}>
      
      {/* MAP HERO */}
      <div style={{ position: 'relative', height: '45vh', minHeight: 300 }}>
        <PlaceHeroMap lat={place.lat} lon={place.lon} emoji={place.logo_emoji ?? '📍'} name={place.name} id={place.id} />

        {/* TOP HEADER OVERLAY */}
        <div style={{ position: 'absolute', top: 'calc(env(safe-area-inset-top, 0px) + 16px)', left: 20, right: 20, display: 'flex', justifyContent: 'space-between', alignItems: 'center', zIndex: 10 }}>
          <div style={{ display: 'flex', gap: 12 }}>
            <Link href="/app" className="press" style={{ 
              width: 44, height: 44, borderRadius: '50%', background: 'rgba(255,255,255,0.9)', 
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              boxShadow: '0 8px 24px rgba(0,0,0,0.12)', border: 'none', backdropFilter: 'blur(10px)'
            }}>
              <Ic.Back s={22} />
            </Link>

            {!isOSM && user && (
              <PoiFavoriteButton 
                placeId={place.id}
                placeName={place.name}
                commune={place.commune}
                lat={place.lat}
                lon={place.lon}
                userId={user.id}
              />
            )}
          </div>
          
          {sponsoredActive && (
             <div style={{ 
               background: 'rgba(255,255,255,0.95)', padding: '8px 16px', borderRadius: 24,
               display: 'flex', alignItems: 'center', gap: 6, fontSize: 11, fontWeight: 900,
               boxShadow: '0 8px 24px rgba(0,0,0,0.08)', color: color, backdropFilter: 'blur(10px)',
               border: `1.5px solid ${color}20`
             }}>
               <span style={{ fontSize: 16 }}>{place.sponsor_tier === 'elite' ? '⭐' : '✓'}</span>
               {place.sponsor_tier === 'elite' ? 'PARTENAIRE ÉLITE' : 'PARTENAIRE PRO'}
             </div>
          )}
        </div>

        {/* Bottom Fade */}
        <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: 100, background: 'linear-gradient(to top, var(--cream), transparent)', zIndex: 2 }} />
      </div>

      <div className="no-scrollbar" style={{ position: 'relative', marginTop: -60, padding: '0 16px 120px 16px', zIndex: 5 }}>
        
        {/* TITLE CARD — dark ink header */}
        <div className="slide-up" style={{
          background: 'var(--ink)', padding: 24, borderRadius: 32,
          boxShadow: '0 20px 60px rgba(26,20,16,0.25)',
          marginBottom: 20, position: 'relative', overflow: 'hidden',
        }}>
          <div className="wax-bg" style={{ position: 'absolute', inset: 0, opacity: 0.07 }} />
          <div style={{ position: 'relative', zIndex: 1 }}>
            <div style={{ display: 'flex', gap: 20, alignItems: 'flex-start' }}>
              <div style={{
                width: 80, height: 80, borderRadius: 22,
                background: 'rgba(255,255,255,0.1)', display: 'flex',
                alignItems: 'center', justifyContent: 'center', fontSize: 40,
                border: '2px solid rgba(255,255,255,0.15)',
                flexShrink: 0,
              }}>
                {place.logo_emoji ?? '📍'}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 10, fontWeight: 900, color: 'var(--orange)', letterSpacing: 1.5, marginBottom: 6, textTransform: 'uppercase' }}>
                  {CATEGORY_LABELS[place.category] ?? 'LIEU'}{place.commune ? ` · ${place.commune}` : ''}
                </div>
                <h1 className="font-display" style={{ fontSize: 26, margin: 0, lineHeight: 1.1, fontWeight: 900, color: '#fff' }}>{place.name}</h1>
                {(place.address || isOSM) && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 8 }}>
                    <Ic.Pin s={14} color="rgba(255,255,255,0.5)" />
                    <div style={{ fontSize: 12, fontWeight: 600, color: 'rgba(255,255,255,0.5)' }}>{place.address || 'Source: OpenStreetMap'}</div>
                  </div>
                )}
              </div>
            </div>

            {place.description && (
              <p style={{ marginTop: 16, fontSize: 14, color: 'rgba(255,255,255,0.65)', lineHeight: 1.6, margin: '16px 0 0 0', fontWeight: 500 }}>
                {place.description}
              </p>
            )}
          </div>
        </div>

        {/* CHECK-IN CTA - Hide for OSM for now to avoid ID issues */}
        {!isOSM && (
          <div className="slide-up" style={{ marginBottom: 28, animationDelay: '0.1s' }}>
            <PoiCheckInButton
              placeId={place.id}
              placeName={place.name}
              commune={place.commune ?? undefined}
              lat={place.lat}
              lon={place.lon}
              sponsorTier={place.sponsor_tier as 'pro' | 'elite' | null}
            />
          </div>
        )}

        {/* CONTACT QUICK LINKS - MODERNIZED */}
        {(place.phone || place.whatsapp || place.instagram || place.website) && (
          <div className="slide-up" style={{ 
            display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 12, marginBottom: 28,
            animationDelay: '0.2s'
          }}>
            {place.phone && (
              <a href={`tel:${place.phone}`} style={{ textDecoration: 'none' }}>
                <div className="press" style={{ background: 'var(--ink)', color: '#fff', padding: '16px 12px', borderRadius: 24, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10, boxShadow: '0 8px 20px rgba(0,0,0,0.1)' }}>
                  <span style={{ fontSize: 20 }}>📞</span>
                  <span style={{ fontSize: 12, fontWeight: 900, letterSpacing: 0.5 }}>APPELER</span>
                </div>
              </a>
            )}
            {place.whatsapp && (
              <a href={`https://wa.me/${place.whatsapp.replace(/\D/g, '')}`} target="_blank" rel="noopener noreferrer" style={{ textDecoration: 'none' }}>
                <div className="press" style={{ background: '#25D366', color: '#fff', padding: '16px 12px', borderRadius: 24, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10, boxShadow: '0 8px 20px rgba(37,211,102,0.2)' }}>
                  <span style={{ fontSize: 20 }}>💬</span>
                  <span style={{ fontSize: 12, fontWeight: 900, letterSpacing: 0.5 }}>WHATSAPP</span>
                </div>
              </a>
            )}
            {place.instagram && (
              <a href={`https://instagram.com/${place.instagram.replace('@', '')}`} target="_blank" rel="noopener noreferrer" style={{ textDecoration: 'none' }}>
                <div className="press" style={{ background: 'linear-gradient(45deg, #f09433 0%,#e6683c 25%,#dc2743 50%,#cc2366 75%,#bc1888 100%)', color: '#fff', padding: '16px 12px', borderRadius: 24, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10, boxShadow: '0 8px 20px rgba(220,39,67,0.2)' }}>
                  <span style={{ fontSize: 20 }}>📸</span>
                  <span style={{ fontSize: 12, fontWeight: 900, letterSpacing: 0.5 }}>INSTAGRAM</span>
                </div>
              </a>
            )}
            {place.website && (
              <a href={place.website} target="_blank" rel="noopener noreferrer" style={{ textDecoration: 'none' }}>
                <div className="press" style={{ background: 'var(--cream-2)', color: 'var(--ink)', padding: '16px 12px', borderRadius: 24, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10, boxShadow: '0 8px 20px rgba(0,0,0,0.05)', border: '1.5px solid var(--line)' }}>
                  <span style={{ fontSize: 20 }}>🌐</span>
                  <span style={{ fontSize: 12, fontWeight: 900, letterSpacing: 0.5 }}>SITE WEB</span>
                </div>
              </a>
            )}
          </div>
        )}

        {/* OFFRES & PROMOS */}
        {!isOSM && ((place.has_campaign && place.campaign_label) || (offers && offers.length > 0)) && (
          <div className="slide-up" style={{
            background: 'var(--cream-2)', padding: 24, borderRadius: 32, marginBottom: 28,
            boxShadow: '0 4px 24px rgba(0,0,0,0.03)', animationDelay: '0.3s',
            border: '1px solid rgba(26,20,16,0.04)'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 24 }}>
              <Ic.Bolt s={22} color="var(--orange)" />
              <h2 style={{ fontSize: 13, fontWeight: 900, letterSpacing: 1, margin: 0 }}>OFFRES & ÉVÉNEMENTS</h2>
            </div>

            {place.has_campaign && place.campaign_label && (
              <div style={{ 
                background: 'linear-gradient(135deg, var(--orange) 0%, var(--orange-deep) 100%)', color: '#fff', padding: 20, 
                borderRadius: 24, marginBottom: 16, position: 'relative', overflow: 'hidden',
                boxShadow: '0 12px 30px rgba(242,108,26,0.25)' 
              }}>
                <div className="wax-bg" style={{ position: 'absolute', inset: 0, opacity: 0.15 }} />
                <div style={{ position: 'relative', zIndex: 1 }}>
                  <div style={{ fontSize: 11, fontWeight: 900, opacity: 0.8, letterSpacing: 1 }}>EXCLUSIVITÉ BABIMOB</div>
                  <div className="font-display" style={{ fontSize: 20, marginTop: 6, fontWeight: 900 }}>{place.campaign_label}</div>
                </div>
              </div>
            )}

            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {offers?.map((offer) => (
                <div key={offer.id} style={{ 
                  background: 'var(--cream-2)', padding: 18, borderRadius: 24, 
                  display: 'flex', gap: 16, alignItems: 'center', border: '1px solid rgba(0,0,0,0.02)'
                }}>
                  {offer.discount_pct && (
                    <div style={{ 
                      width: 54, height: 54, borderRadius: 16, background: '#fff',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: 15, fontWeight: 900, color: 'var(--orange)',
                      boxShadow: '0 8px 20px rgba(0,0,0,0.06)'
                    }}>
                      -{offer.discount_pct}%
                    </div>
                  )}
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 15, fontWeight: 800, color: 'var(--ink)' }}>{offer.title}</div>
                    {offer.description && <div style={{ fontSize: 12, color: 'var(--muted)', marginTop: 4, lineHeight: 1.4 }}>{offer.description}</div>}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ARRÊTS PROCHES - DESIGN REVISITÉ */}
        {nearbyStops && nearbyStops.length > 0 && (
          <div className="slide-up" style={{
            background: 'var(--cream-2)', padding: 24, borderRadius: 32, marginBottom: 28,
            boxShadow: '0 4px 24px rgba(0,0,0,0.03)', animationDelay: '0.4s',
            border: '1px solid rgba(26,20,16,0.04)'
          }}>
             <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 24 }}>
              <div style={{ width: 32, height: 32, borderRadius: 10, background: 'var(--orange-pale)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Ic.Route s={18} color="var(--orange)" />
              </div>
              <h2 style={{ fontSize: 13, fontWeight: 900, letterSpacing: 1, margin: 0 }}>POUR VENIR ICI</h2>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {(nearbyStops as any[]).map((stop) => (
                <Link key={stop.stop_id} href={`/app/arret/${encodeURIComponent(stop.stop_id)}`} style={{ textDecoration: 'none' }}>
                  <div className="press" style={{ 
                    background: 'var(--cream-2)', padding: '14px 18px', borderRadius: 24,
                    display: 'flex', alignItems: 'center', gap: 16, border: '1px solid rgba(0,0,0,0.01)'
                  }}>
                    <div style={{ width: 48, height: 48, borderRadius: 14, background: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 24, boxShadow: '0 4px 12px rgba(0,0,0,0.04)' }}>
                      🚐
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 15, fontWeight: 800, color: 'var(--ink)' }}>{stop.stop_name}</div>
                      <div style={{ fontSize: 12, fontWeight: 900, color: 'var(--orange)', marginTop: 4, display: 'flex', alignItems: 'center', gap: 4 }}>
                        <Ic.Locate s={12} /> {formatDist(stop.distance_m)}
                      </div>
                    </div>
                    <Ic.Arrow s={20} color="var(--muted)" />
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* SECTIONS SOCIALES - Hide for OSM for now */}
        {!isOSM && (
          <div className="slide-up" style={{ animationDelay: '0.5s' }}>
            <PlaceSocialSections 
              placeId={id} 
              placeName={place.name}
              initialCheckins={checkins || []} 
              initialAdvice={(advice as any[]) || []}
              userId={user?.id || null}
              userDisplayName={userProfile?.display_name || 'Un Babi'}
              userAvatarEmoji={userProfile?.avatar_emoji || '👤'}
              isVerifiedExplorer={!!userProfile?.is_verified_explorer}
            />
          </div>
        )}

      </div>
    </div>
  );
}
