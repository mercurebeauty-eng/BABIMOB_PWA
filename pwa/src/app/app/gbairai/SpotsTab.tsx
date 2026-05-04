'use client';

import { Ic } from '@/components/ui/Ic';
import type { HotSpot } from './page';

const SPOT_COLORS = [
  'linear-gradient(135deg, #E5337A 0%, #F26C1A 50%, #E8B23C 100%)',
  'linear-gradient(135deg, #E8B23C, #F26C1A)',
  'linear-gradient(135deg, #2A1F18, #3A2A1E)',
  'linear-gradient(135deg, #1A2D6B, #E5337A)',
  'linear-gradient(135deg, #1E5BFF, #0EA85B)',
];

export default function SpotsTab({ hotSpots }: { hotSpots: HotSpot[] }) {
  if (hotSpots.length === 0) {
    return (
      <div style={{ padding: '60px 20px', textAlign: 'center' }}>
        <div style={{ fontSize: 48, marginBottom: 16 }}>📍</div>
        <div className="font-display" style={{ fontSize: 22, marginBottom: 8 }}>Pas de spots chauds</div>
        <p style={{ fontSize: 13, color: 'var(--muted)' }}>Fais des check-ins pour faire chauffer les lieux !</p>
      </div>
    );
  }

  const hero = hotSpots[0];
  const rest = hotSpots.slice(1);

  return (
    <>
      <div style={{ padding: '14px 16px 8px' }}>
        <div style={{ fontSize: 10, fontWeight: 800, color: 'var(--orange)', letterSpacing: 0.7 }}>OÙ ÇA BOUGE · MAINTENANT</div>
        <div className="font-display" style={{ fontSize: 22, marginTop: 2 }}>Les spots qui chauffent</div>
      </div>

      {/* Hero spot */}
      <div style={{ padding: '0 16px', marginBottom: 12 }}>
        <div style={{ borderRadius: 20, overflow: 'hidden', position: 'relative', boxShadow: '0 12px 30px rgba(0,0,0,0.12)' }}>
          <div style={{ width: '100%', height: 200, background: hero.cover_color || SPOT_COLORS[0], position: 'relative', overflow: 'hidden' }}>
            <div className="wax-bg" style={{ position: 'absolute', inset: 0, color: '#fff', opacity: 0.18 }} />
            <div style={{ position: 'absolute', top: 12, left: 12, display: 'flex', alignItems: 'center', gap: 6 }}>
              <div style={{ background: 'var(--orange)', color: '#fff', fontFamily: 'Archivo Black, sans-serif', fontSize: 26, padding: '2px 12px', borderRadius: 10, lineHeight: 1 }}>#1</div>
              {hero.is_new && (
                <div style={{ background: '#0EA85B', color: '#fff', fontSize: 9, fontWeight: 900, padding: '4px 8px', borderRadius: 999 }}>✨ NOUVEAU</div>
              )}
              <div style={{ background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(8px)', color: '#fff', fontSize: 9, fontWeight: 800, padding: '4px 8px', borderRadius: 999, letterSpacing: 0.4, display: 'flex', alignItems: 'center', gap: 4 }}>
                {hero.checkin_count > 0 ? `🔥 ${hero.checkin_count} MOBEURS` : '🔥 PREMIER À ARRIVER ?'}
              </div>
            </div>
            <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, padding: 14, color: '#fff', background: 'linear-gradient(180deg, transparent, rgba(0,0,0,0.7))' }}>
              <div className="font-display" style={{ fontSize: 22, lineHeight: 1 }}>{hero.place_name}</div>
              <div style={{ fontSize: 12, opacity: 0.9, marginTop: 2 }}>{hero.commune ?? 'Abidjan'}</div>
            </div>
          </div>
        </div>
      </div>

      {/* Other spots */}
      <div style={{ padding: '0 16px', display: 'flex', flexDirection: 'column', gap: 8 }}>
        {rest.map((s, i) => (
          <div key={s.place_id} style={{ display: 'flex', gap: 12, padding: 10, borderRadius: 14, background: 'var(--cream-2)', border: '1px solid var(--line)' }}>
            <div style={{ width: 64, height: 64, borderRadius: 12, background: s.cover_color || SPOT_COLORS[(i + 1) % SPOT_COLORS.length], position: 'relative', overflow: 'hidden', flexShrink: 0 }}>
              <div className="wax-bg" style={{ position: 'absolute', inset: 0, color: '#fff', opacity: 0.2 }} />
              <div style={{ position: 'absolute', top: 4, left: 4, background: 'rgba(0,0,0,0.6)', color: '#fff', fontFamily: 'Archivo Black, sans-serif', fontSize: 11, padding: '2px 6px', borderRadius: 5 }}>#{i + 2}</div>
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 14, fontWeight: 800, color: 'var(--ink)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{s.place_name}</div>
              <div style={{ fontSize: 11, color: 'var(--muted)', marginTop: 2 }}>{s.commune ?? 'Abidjan'}</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 6 }}>
                <span style={{ fontSize: 10, fontWeight: 800, color: 'var(--orange)', display: 'flex', alignItems: 'center', gap: 3 }}>
                  {s.checkin_count > 0 ? `🔥 ${s.checkin_count}` : '🔥 À DÉCOUVRIR'}
                </span>
                {s.is_new && <span style={{ fontSize: 9, fontWeight: 900, color: '#0EA85B' }}>✨ NOUVEAU</span>}
              </div>
            </div>
          </div>
        ))}
      </div>
    </>
  );
}
