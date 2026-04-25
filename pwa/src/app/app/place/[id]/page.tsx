import { createClient } from '@/lib/supabase/server';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import BeigeMapBackground from '@/components/BeigeMapBackground';
import CheckInButtonPlace from '@/components/CheckInButtonPlace';
import PlaceSocialSections from '@/components/PlaceSocialSections';

type Props = { params: Promise<{ id: string }> };

const CATEGORY_LABELS: Record<string, string> = {
  food:          'Restauration',
  shop:          'Commerce',
  service:       'Service',
  health:        'Santé',
  entertainment: 'Loisirs',
  other:         'Lieu',
};

function formatDist(m: number) {
  return m < 1000 ? `${Math.round(m)} m` : `${(m / 1000).toFixed(1)} km`;
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
  const campaignActive  = place.has_campaign  && isActive(place.campaign_expires_at);
  const color           = place.cover_color ?? '#FF7A00';

  return (
    <div className="flex-1 flex flex-col overflow-y-auto bg-beige-50 text-beige-text font-sans relative">
      <BeigeMapBackground />

      {/* Header */}
      <div className="sticky top-0 z-20 bg-beige-50/80 backdrop-blur-xl border-b border-beige-200/50 px-4 py-3 flex items-center gap-3">
        <Link href="/app" className="p-2 -ml-2 rounded-full hover:bg-beige-100 transition-colors" aria-label="Retour">
          <svg className="w-5 h-5 text-beige-muted" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <path d="m15 18-6-6 6-6" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </Link>
        <div className="flex-1 min-w-0">
          <div className="text-sm font-black text-beige-text truncate">{place.name}</div>
          <div className="text-[10px] text-beige-muted font-bold uppercase tracking-widest">
            {CATEGORY_LABELS[place.category] ?? 'Lieu'}{place.commune ? ` · ${place.commune}` : ''}
          </div>
        </div>
        {sponsoredActive && (
          <span
            className="text-[9px] font-black uppercase tracking-widest px-2.5 py-1 rounded-full border flex-shrink-0"
            style={{ background: `${color}15`, color, borderColor: `${color}30` }}
          >
            {place.sponsor_tier === 'elite' ? '⭐ Elite' : '✓ Pro'}
          </span>
        )}
      </div>

      <div className="max-w-2xl mx-auto w-full px-5 py-8 space-y-6 relative z-10">

        {/* Hero */}
        <div
          className="rounded-[2.5rem] p-8 flex items-center gap-6 shadow-xl relative overflow-hidden"
          style={{ background: `${color}12`, border: `2px solid ${color}20` }}
        >
          {sponsoredActive && place.sponsor_tier === 'elite' && (
            <div
              className="absolute -top-12 -right-12 w-48 h-48 rounded-full opacity-10 pointer-events-none"
              style={{ background: color }}
            />
          )}
          <div
            className="w-20 h-20 rounded-2xl flex items-center justify-center text-4xl flex-shrink-0 shadow-lg relative z-10"
            style={{ background: `${color}18`, border: `2px solid ${color}25` }}
          >
            {place.logo_emoji}
          </div>
          <div className="flex-1 min-w-0 relative z-10">
            <h1 className="text-xl font-black text-beige-text leading-tight mb-2">{place.name}</h1>
            {place.description && (
              <p className="text-sm text-beige-muted font-medium leading-relaxed">{place.description}</p>
            )}
            {place.address && (
              <div className="text-xs text-beige-muted font-bold mt-2 flex items-center gap-1">
                <span>📍</span> {place.address}
              </div>
            )}
          </div>
        </div>

        {/* Action Check-in */}
        <div className="max-w-md mx-auto w-full">
           <CheckInButtonPlace 
             placeId={place.id} 
             placeName={place.name} 
             commune={place.commune ?? null} 
             lat={place.lat}
             lon={place.lon}
           />
        </div>

        {/* Campagne active */}
        {campaignActive && place.campaign_label && (
          <div className="bg-abidjan-orange/10 border-2 border-abidjan-orange/30 rounded-2xl px-5 py-4 flex items-center gap-3 animate-in fade-in duration-300">
            <span className="text-2xl flex-shrink-0">🔥</span>
            <div>
              <div className="text-[10px] font-black text-abidjan-orange uppercase tracking-widest">Promotion en cours</div>
              <div className="text-sm font-black text-beige-text mt-0.5">{place.campaign_label}</div>
              {place.campaign_expires_at && (
                <div className="text-[10px] text-beige-muted font-bold mt-1">
                  Jusqu'au {new Date(place.campaign_expires_at).toLocaleDateString('fr-FR')}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Offres */}
        {offers && offers.length > 0 && (
          <div className="bg-white rounded-[2.5rem] border-2 border-beige-200 shadow-xl shadow-black/5 p-6 space-y-3">
            <div className="text-[10px] uppercase tracking-widest text-beige-muted font-black mb-2">Offres du moment</div>
            {offers.map((offer) => (
              <div key={offer.id} className="flex items-center gap-4 bg-beige-50 rounded-2xl px-4 py-4 border border-beige-100">
                {offer.discount_pct && (
                  <div className="w-14 h-14 rounded-xl bg-abidjan-orange text-white flex flex-col items-center justify-center flex-shrink-0 shadow-md">
                    <span className="text-lg font-black leading-none">-{offer.discount_pct}%</span>
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-black text-beige-text">{offer.title}</div>
                  {offer.description && (
                    <div className="text-xs text-beige-muted font-medium mt-0.5">{offer.description}</div>
                  )}
                  {offer.valid_until && (
                    <div className="text-[10px] text-beige-muted font-bold uppercase tracking-widest mt-1">
                      Jusqu'au {new Date(offer.valid_until).toLocaleDateString('fr-FR')}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Contact */}
        {(place.phone || place.whatsapp || place.instagram || place.website) && (
          <div className="bg-white rounded-[2.5rem] border-2 border-beige-200 shadow-xl shadow-black/5 p-6">
            <div className="text-[10px] uppercase tracking-widest text-beige-muted font-black mb-4">Contact</div>
            <div className="flex flex-wrap gap-3">
              {place.whatsapp && (
                <a
                  href={`https://wa.me/${place.whatsapp.replace(/\D/g, '')}`}
                  target="_blank" rel="noopener noreferrer"
                  className="flex items-center gap-2 bg-abidjan-green/10 border-2 border-abidjan-green/30 text-abidjan-green font-black text-sm px-5 py-3 rounded-2xl transition-all hover:bg-abidjan-green/20 active:scale-95"
                >
                  <span className="text-lg">💬</span> WhatsApp
                </a>
              )}
              {place.phone && (
                <a
                  href={`tel:${place.phone}`}
                  className="flex items-center gap-2 bg-abidjan-blue/10 border-2 border-abidjan-blue/30 text-abidjan-blue font-black text-sm px-5 py-3 rounded-2xl transition-all hover:bg-abidjan-blue/20 active:scale-95"
                >
                  <span className="text-lg">📞</span> Appeler
                </a>
              )}
              {place.instagram && (
                <a
                  href={`https://instagram.com/${place.instagram.replace('@', '')}`}
                  target="_blank" rel="noopener noreferrer"
                  className="flex items-center gap-2 bg-purple-50 border-2 border-purple-200 text-purple-600 font-black text-sm px-5 py-3 rounded-2xl transition-all hover:bg-purple-100 active:scale-95"
                >
                  <span className="text-lg">📸</span> Instagram
                </a>
              )}
              {place.website && (
                <a
                  href={place.website}
                  target="_blank" rel="noopener noreferrer"
                  className="flex items-center gap-2 bg-beige-50 border-2 border-beige-200 text-beige-muted font-black text-sm px-5 py-3 rounded-2xl transition-all hover:bg-beige-100 active:scale-95"
                >
                  <span className="text-lg">🌐</span> Site web
                </a>
              )}
            </div>
          </div>
        )}

        {/* Arrêts de transport proches */}
        {nearbyStops && nearbyStops.length > 0 && (
          <div className="bg-white rounded-[2.5rem] border-2 border-beige-200 shadow-xl shadow-black/5 p-6">
            <div className="text-[10px] uppercase tracking-widest text-beige-muted font-black mb-4">
              Arrêts de transport proches
            </div>
            <div className="space-y-3">
              {(nearbyStops as any[]).map((stop) => (
                <Link
                  key={stop.stop_id}
                  href={`/app/arret/${encodeURIComponent(stop.stop_id)}`}
                  className="flex items-center gap-4 bg-beige-50 hover:bg-white border border-beige-100 hover:border-abidjan-orange/30 rounded-2xl px-4 py-3.5 transition-all group"
                >
                  <div className="w-10 h-10 rounded-xl bg-white flex items-center justify-center text-xl shadow-sm group-hover:scale-110 transition-transform flex-shrink-0">
                    🚐
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-black text-beige-text truncate group-hover:text-abidjan-orange transition-colors">
                      {stop.stop_name}
                    </div>
                    {stop.commune && (
                      <div className="text-[10px] text-beige-muted font-bold uppercase tracking-widest mt-0.5">
                        {stop.commune}
                      </div>
                    )}
                  </div>
                  <div className="text-[10px] font-black text-abidjan-blue bg-abidjan-blue/10 px-2 py-1 rounded-lg flex-shrink-0 tabular-nums">
                    {formatDist(stop.distance_m)}
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* Sections Sociales (Traces et Q&A) */}
        <PlaceSocialSections 
          placeId={id} 
          initialCheckins={checkins || []} 
          initialAdvice={(advice as any[]) || []}
          userId={user?.id || null}
          isVerifiedExplorer={!!userProfile?.is_verified_explorer}
        />

        {/* CTA inscription commerçant */}
        {!sponsoredActive && (
          <div className="bg-white rounded-[2.5rem] border-2 border-dashed border-beige-200 p-8 text-center">
            <div className="text-3xl mb-4">🚀</div>
            <div className="text-base font-black text-beige-text mb-2">Vous êtes ce commerce ?</div>
            <p className="text-sm text-beige-muted font-medium mb-6 leading-relaxed px-4">
              Revendiquez cette fiche et gagnez en visibilité auprès des{' '}
              <strong className="text-abidjan-orange">voyageurs d&apos;Abidjan</strong>.
            </p>
            <div className="space-y-3 text-left">
              <div className="flex justify-between items-center bg-beige-50 rounded-2xl px-5 py-3.5 border border-beige-100">
                <div>
                  <div className="text-sm font-black text-beige-text">Pro</div>
                  <div className="text-[10px] text-beige-muted font-bold">Profil complet + marqueur coloré</div>
                </div>
                <span className="text-sm font-black text-abidjan-orange whitespace-nowrap">8 000 FCFA / mois</span>
              </div>
              <div className="flex justify-between items-center bg-abidjan-orange/5 rounded-2xl px-5 py-3.5 border-2 border-abidjan-orange/20">
                <div>
                  <div className="text-sm font-black text-beige-text">⭐ Elite</div>
                  <div className="text-[10px] text-beige-muted font-bold">Marqueur animé + campagnes + priorité</div>
                </div>
                <span className="text-sm font-black text-abidjan-orange whitespace-nowrap">28 000 FCFA / mois</span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
