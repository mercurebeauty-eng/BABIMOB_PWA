'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { usePathname, useRouter } from 'next/navigation';
import { Ic } from './Ic';
import PlusBubble from './PlusBubble';

const NAV_ITEMS = [
  { id: 'home', label: 'Carte', icon: Ic.Map, path: '/app', color: 'var(--orange)' },
  { id: 'gbairai', label: 'Gbairai', icon: Ic.Chat, path: '/app/gbairai', color: 'var(--blue)' },
  { id: 'compte', label: 'Profil', icon: Ic.Users, path: '/app/compte', color: 'var(--ink)' },
];

export function BottomNav({ 
  onToggleHeatmap, 
  heatMode,
  nearbyStopsCount = 0,
  onCycleNearby
}: { 
  onToggleHeatmap: () => void;
  heatMode: boolean;
  nearbyStopsCount?: number;
  onCycleNearby?: () => void;
  isAdmin?: boolean;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const [isPlusOpen, setIsPlusOpen] = React.useState(false);

  return (
    <div style={{
      position: 'fixed',
      bottom: 'calc(env(safe-area-inset-bottom, 0px) + 20px)',
      left: 0,
      right: 0,
      zIndex: 9000,
      display: 'flex',
      justifyContent: 'center',
      pointerEvents: 'none',
    }}>


      <motion.nav 
        initial={{ y: 100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        style={{
          background: 'rgba(255, 255, 255, 0.45)',
          backdropFilter: 'blur(30px) saturate(200%)',
          WebkitBackdropFilter: 'blur(30px) saturate(200%)',
          borderRadius: 32,
          padding: '10px',
          display: 'flex',
          alignItems: 'center',
          gap: 10,
          boxShadow: '0 20px 40px rgba(0,0,0,0.15), inset 0 0 0 1px rgba(255,255,255,0.4)',
          pointerEvents: 'auto',
          border: '1px solid rgba(0,0,0,0.05)',
        }}
      >
        {/* Nearby Stops / Près de toi Icon (App Style) */}
        {nearbyStopsCount > 0 && (
          <button
            onClick={onCycleNearby}
            className="press"
            style={{
              width: 54,
              height: 54,
              borderRadius: 16,
              background: 'linear-gradient(135deg, #FF9500, #FF5E00)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#fff',
              border: 'none',
              cursor: 'pointer',
              position: 'relative',
              boxShadow: '0 4px 12px rgba(255,149,0,0.3)'
            }}
          >
            <Ic.Bus s={24} />
            <div style={{
              position: 'absolute',
              top: -5,
              right: -5,
              background: 'var(--ink)',
              color: '#fff',
              fontSize: 10,
              fontWeight: 900,
              width: 18,
              height: 18,
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              border: '2px solid rgba(255,255,255,0.8)'
            }}>
              {nearbyStopsCount}
            </div>
          </button>
        )}

        {NAV_ITEMS.map((item) => {
          const isActive = pathname === item.path;
          const Icon = item.icon;

          return (
            <button
              key={item.id}
              onClick={() => item.path && router.push(item.path)}
              className="press"
              style={{
                width: 54,
                height: 54,
                borderRadius: 16,
                background: isActive ? '#fff' : 'rgba(255,255,255,0.3)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: isActive ? item.color : 'rgba(0,0,0,0.6)',
                border: 'none',
                cursor: 'pointer',
                transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                boxShadow: isActive ? '0 4px 12px rgba(0,0,0,0.1)' : 'none',
              }}
            >
              <Icon s={24} fill={isActive} />
            </button>
          );
        })}

        {/* Separator like iPad Dock */}
        <div style={{
          width: 1.5,
          height: 32,
          background: 'rgba(0,0,0,0.1)',
          margin: '0 4px',
          borderRadius: 1
        }} />

        <div style={{ position: 'relative' }}>
          {/* Plus Button */}
          <button
            onClick={() => setIsPlusOpen(!isPlusOpen)}
            className="press"
            style={{
              width: 54,
              height: 54,
              borderRadius: 16,
              background: isPlusOpen ? 'var(--ink)' : 'rgba(255,255,255,0.3)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: isPlusOpen ? '#fff' : 'rgba(0,0,0,0.6)',
              border: 'none',
              cursor: 'pointer',
              transition: 'all 0.3s ease',
            }}
          >
            <Ic.Menu s={24} />
          </button>

          <PlusBubble 
            isOpen={isPlusOpen} 
            onClose={() => setIsPlusOpen(false)} 
            onToggleHeatmap={onToggleHeatmap}
            heatMode={heatMode}
            isAdmin={isAdmin}
          />
        </div>
      </motion.nav>
    </div>
  );
}
