'use client';

import { useState, useEffect, useCallback } from 'react';
import { createClient } from '@/lib/supabase/client';
import Link from 'next/link';
import { Ic } from '@/components/ui/Ic';
import { Pill } from '@/components/ui/Pill';
import { WaxStrip } from '@/components/ui/WaxStrip';
import Map from '@/components/MapWrapper';
import FavoriteButton from './FavoriteButton';
import StopLinesList from './StopLinesList';
import TarifsSection from './TarifsSection';
import CcommentSection from './CcommentSection';
import StopReviewModal from '@/components/StopReviewModal';
import StopReviewsListModal from './StopReviewsListModal';
import StopReportModal from '@/components/StopReportModal';
import { haversineM } from '@/lib/geo';

type Props = { 
  stop: any;
  lignes: any[];
  user: any;
  profile: any;
  isFavorited: boolean;
};

export default function ArretClientPage({ stop, lignes, user, profile, isFavorited }: Props) {
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [showReviewsListModal, setShowReviewsListModal] = useState(false);
  const [reviewsCount, setReviewsCount] = useState(0);
  const [avgRating, setAvgRating] = useState(0);
  const [validated, setValidated] = useState(false);
  const [validating, setValidating] = useState(false);
  const [tooFarDist, setTooFarDist] = useState<number | null>(null);
  const [showCcommentModal, setShowCcommentModal] = useState(false);
  const stopId = stop.stop_id;
  // ... (rest of states)
  const prefs = profile?.preferred_transit_modes || ['Gbaka', 'Woro-woro', 'Taxi', 'Saloni'];
  const supabase = createClient();

  const loadReviewsData = useCallback(async () => {
    const { data, count } = await supabase
      .from('avis_arret')
      .select('rating', { count: 'exact' })
      .eq('stop_id', stopId);
    
    setReviewsCount(count || 0);
    if (data && data.length > 0) {
      const sum = data.reduce((acc, curr) => acc + (curr.rating || 5), 0);
      setAvgRating(sum / data.length);
    } else {
      setAvgRating(0);
    }
  }, [supabase, stopId]);

  useEffect(() => {
    loadReviewsData();
  }, [loadReviewsData]);

  async function handleValidatePresence() {
    if (!user) return;
    setValidating(true);
    setTooFarDist(null);

    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const dist = haversineM(pos.coords.latitude, pos.coords.longitude, stop.stop_lat, stop.stop_lon);
        if (dist > 100) {
          setTooFarDist(Math.round(dist));
          setValidating(false);
          return;
        }
        // Save validation + award XP
        await Promise.all([
          supabase.from('arret_validations').insert({
            user_id: user.id,
            stop_id: stopId,
            stop_name: stop.stop_name,
            lat: pos.coords.latitude,
            lon: pos.coords.longitude,
            xp_earned: 5,
          }),
          supabase.rpc('award_xp', { p_xp: 5 }),
        ]);
        setValidated(true);
        setValidating(false);
      },
      () => {
        setTooFarDist(-1);
        setValidating(false);
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  }

  const renderStars = (rating: number) => {
    return (
      <div style={{ display: 'flex', gap: 2 }}>
        {[1, 2, 3, 4, 5].map((s) => {
          const filled = s <= Math.round(rating);
          return <Ic.Star key={s} s={14} fill={filled} color={filled ? 'var(--orange)' : 'var(--line)'} />;
        })}
      </div>
    );
  };

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
        </div>
      </div>

      <div className="no-scrollbar" style={{ flex: 1, overflowY: 'auto', padding: '0 16px 100px', marginTop: -40, position: 'relative', zIndex: 2 }}>
        {/* Title card */}
        <div style={{ background: 'var(--cream-2)', borderRadius: 22, padding: 18, border: '1px solid var(--line)', boxShadow: '0 8px 24px rgba(0,0,0,0.06)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div style={{ flex: 1 }}>
              <div style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
                <Pill color="var(--orange)">GARE GBAKA</Pill>
                <Pill color="var(--green)">ACTIVE</Pill>
              </div>
              <div className="font-display" style={{ fontSize: 28, lineHeight: 1.05 }}>{stop.stop_name}</div>
              <div style={{ fontSize: 13, color: 'var(--muted)', marginTop: 4 }}>
                {stop.commune ? `${stop.commune}, ` : ''}Abidjan · Côte d'Ivoire
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
                compact={true}
              />
            )}
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginTop: 14, fontSize: 12 }}>
            <button 
              onClick={() => setShowReviewsListModal(true)}
              className="press" 
              style={{ display: 'flex', alignItems: 'center', gap: 8, color: 'var(--orange)', fontWeight: 700, border: 'none', background: 'transparent', cursor: 'pointer', padding: 0 }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                {renderStars(avgRating)}
                <span style={{ marginLeft: 4 }}>{avgRating > 0 ? avgRating.toFixed(1) : '0.0'}</span>
              </div>
              <span style={{ color: 'var(--muted)', fontWeight: 500 }}>· {reviewsCount} avis réel{reviewsCount > 1 ? 's' : ''}</span>
            </button>
          </div>
        </div>

        <div style={{ marginTop: 16 }}>
          <WaxStrip color="var(--orange)" height={4} />
        </div>

        {/* Tarifs réels — Live Section */}
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

        {/* C'COMMENT ? (Maintenant géré par le composant client) */}
        <CcommentSection 
          stopId={stopId} 
          stopName={stop.stop_name} 
          userId={user?.id || null} 
          displayName={profile?.display_name ?? null} 
        />
      </div>

      {showReviewsListModal && (
        <StopReviewsListModal
          stopId={stopId}
          stopName={stop.stop_name}
          userId={user?.id || null}
          onClose={() => setShowReviewsListModal(false)}
          onAddReview={() => {
              setShowReviewsListModal(false);
              setShowReviewModal(true);
          }}
        />
      )}

      {showReviewModal && (
        <StopReviewModal
          stopId={stopId}
          stopName={stop.stop_name}
          userId={user?.id || null}
          displayName={profile?.display_name ?? null}
          onClose={() => setShowReviewModal(false)}
          onSuccess={() => {
            setShowReviewModal(false);
            loadReviewsData();
            window.dispatchEvent(new CustomEvent('ccomment-refresh'));
          }}
        />
      )}

      {/* Fixed Bottom CTA — geoloc-gated */}
      <div style={{ position: 'sticky', bottom: 0, padding: '12px 16px calc(env(safe-area-inset-bottom, 0px) + 12px)', background: 'linear-gradient(0deg, var(--cream) 85%, transparent)', zIndex: 100 }}>
        {!validated ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {tooFarDist !== null && (
              <div style={{ textAlign: 'center', fontSize: 12, fontWeight: 700, color: '#EF4444' }}>
                {tooFarDist === -1 ? 'GPS indisponible — active la localisation' : `Tu es à ${tooFarDist}m de l'arrêt (max 100m)`}
              </div>
            )}
            <button
              onClick={user ? handleValidatePresence : undefined}
              disabled={validating}
              className="press"
              style={{
                width: '100%', height: 56, borderRadius: 18,
                background: user ? 'var(--ink)' : 'var(--line)',
                color: user ? '#fff' : 'var(--muted)',
                border: 'none', fontSize: 15, fontWeight: 900,
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10,
                cursor: (validating || !user) ? 'default' : 'pointer',
                boxShadow: user ? '0 8px 20px rgba(26,20,16,0.2)' : 'none',
                position: 'relative', overflow: 'hidden',
              }}
            >
              <div className="wax-bg" style={{ position: 'absolute', inset: 0, opacity: 0.06, pointerEvents: 'none' }} />
              {validating ? (
                <>
                  <span style={{ width: 16, height: 16, border: '2px solid rgba(255,255,255,0.4)', borderTopColor: '#fff', borderRadius: '50%', display: 'inline-block', animation: 'spin 0.7s linear infinite' }} />
                  <span style={{ position: 'relative' }}>Vérification GPS…</span>
                </>
              ) : (
                <>
                  <span style={{ fontSize: 20, position: 'relative' }}>📍</span>
                  <span style={{ position: 'relative' }}>{user ? 'Signaler ma présence' : 'Connecte-toi pour signaler'}</span>
                </>
              )}
            </button>
              <div style={{ textAlign: 'center', fontSize: 10, fontWeight: 700, color: 'var(--muted)', opacity: 0.6 }}>
                Valide ta présence (+5 XP) pour pouvoir signaler
              </div>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            <div style={{
              display: 'flex', alignItems: 'center', gap: 10,
              background: 'color-mix(in oklab, var(--green) 12%, transparent)',
              border: '1px solid color-mix(in oklab, var(--green) 25%, transparent)',
              borderRadius: 14, padding: '8px 16px',
            }}>
              <span style={{ fontSize: 18 }}>✅</span>
              <div>
                <div style={{ fontSize: 12, fontWeight: 900, color: 'var(--green)' }}>Position validée · +5 XP</div>
                <div style={{ fontSize: 10, color: 'var(--muted)', fontWeight: 600 }}>Tu peux maintenant donner ton avis</div>
              </div>
            </div>
            <button
              onClick={() => setShowCcommentModal(true)}
              className="press"
              style={{
                width: '100%', height: 54, borderRadius: 18,
                background: 'var(--orange)', color: '#fff',
                border: 'none', fontSize: 15, fontWeight: 900,
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10,
                cursor: 'pointer', boxShadow: '0 8px 20px rgba(242,108,26,0.3)',
              }}
            >
              <Ic.Pin s={18} />
              C'comment ici ?
            </button>
          </div>
        )}
      </div>

      {showCcommentModal && user && (
        <StopReportModal
          stopId={stopId}
          stopName={stop.stop_name}
          userId={user.id}
          displayName={profile?.display_name ?? null}
          onClose={() => setShowCcommentModal(false)}
          onSuccess={() => {
            setShowCcommentModal(false);
            window.dispatchEvent(new CustomEvent('ccomment-refresh'));
          }}
        />
      )}
    </div>
  );
}
