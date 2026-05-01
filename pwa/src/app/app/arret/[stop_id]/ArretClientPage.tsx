'use client';

import { useState } from 'react';
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
import CcommentButton from '@/components/CcommentButton';

type Props = { 
  stop: any;
  lignes: any[];
  user: any;
  profile: any;
  isFavorited: boolean;
};

export default function ArretClientPage({ stop, lignes, user, profile, isFavorited }: Props) {
  const [showReviewModal, setShowReviewModal] = useState(false);
  const stopId = stop.stop_id;
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
              onClick={() => setShowReviewModal(true)}
              className="press" 
              style={{ display: 'flex', alignItems: 'center', gap: 4, color: 'var(--orange)', fontWeight: 700, border: 'none', background: 'transparent', cursor: 'pointer', padding: 0 }}
            >
              <Ic.Star s={14} fill /> 4.6
              <span style={{ color: 'var(--muted)', fontWeight: 500 }}>· 1 247 avis</span>
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

      {showReviewModal && (
        <StopReviewModal
          stopId={stopId}
          stopName={stop.stop_name}
          userId={user?.id || null}
          displayName={profile?.display_name ?? null}
          onClose={() => setShowReviewModal(false)}
          onSuccess={() => {
            setShowReviewModal(false);
            window.dispatchEvent(new CustomEvent('ccomment-refresh'));
          }}
        />
      )}

      {/* Fixed Bottom CTA */}
      <div style={{ position: 'sticky', bottom: 0, padding: '16px 16px calc(env(safe-area-inset-bottom, 0px) + 16px)', background: 'linear-gradient(0deg, var(--cream) 80%, transparent)', borderTop: '1px solid var(--line)', zIndex: 100 }}>
        <div style={{ display: 'flex', gap: 12 }}>
          <CcommentButton
            stopId={stopId}
            stopName={stop.stop_name}
            userId={user?.id || null}
            displayName={profile?.display_name ?? null}
          />
          
          <button className="press" style={{ flex: 1.5, height: 54, borderRadius: 16, border: 'none', background: 'var(--ink)', color: 'white', fontSize: 14, fontWeight: 800, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, boxShadow: '0 8px 20px rgba(0,0,0,0.2)' }}>
            Suivre en direct
            <Ic.Arrow s={16} />
          </button>
        </div>
      </div>
    </div>
  );
}
