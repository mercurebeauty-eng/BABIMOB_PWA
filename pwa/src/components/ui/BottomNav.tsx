'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { usePathname, useRouter } from 'next/navigation';
import { Ic } from './Ic';

import PlusBubble from './PlusBubble';

const NAV_ITEMS = [
  { id: 'home', label: 'Carte', icon: Ic.Map, path: '/app' },
  { id: 'gbairai', label: 'Gbairai', icon: Ic.Chat, path: '/app/gbairai' },
  { id: 'compte', label: 'Profil', icon: Ic.Star, path: '/app/compte' },
  { id: 'menu', label: 'Plus', icon: Ic.Menu, path: null },
];

export function BottomNav({ 
  onToggleHeatmap, 
  heatMode 
}: { 
  onToggleHeatmap: () => void;
  heatMode: boolean;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const [isPlusOpen, setIsPlusOpen] = React.useState(false);

  return (
    <div style={{
      position: 'fixed',
      bottom: 'calc(env(safe-area-inset-bottom, 0px) + 16px)',
      left: 16,
      right: 16,
      zIndex: 9000,
      display: 'flex',
      justifyContent: 'center',
      pointerEvents: 'none',
    }}>
      <PlusBubble 
        isOpen={isPlusOpen} 
        onClose={() => setIsPlusOpen(false)} 
        onToggleHeatmap={onToggleHeatmap}
        heatMode={heatMode}
      />

      <motion.nav 
        initial={{ y: 100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        style={{
          background: 'rgba(255, 255, 255, 0.55)',
          backdropFilter: 'blur(24px) saturate(200%)',
          WebkitBackdropFilter: 'blur(24px) saturate(200%)',
          borderRadius: 24,
          padding: '8px 12px',
          display: 'flex',
          alignItems: 'center',
          gap: 4,
          boxShadow: '0 8px 32px rgba(0,0,0,0.12), 0 1px 2px rgba(0,0,0,0.05)',
          pointerEvents: 'auto',
          border: '1px solid rgba(255, 255, 255, 0.4)',
        }}
      >
        {NAV_ITEMS.map((item) => {
          const isActive = pathname === item.path;
          const Icon = item.icon;

          return (
            <button
              key={item.id}
              onClick={() => {
                if (item.path) {
                  router.push(item.path);
                } else {
                  setIsPlusOpen(!isPlusOpen);
                }
              }}
              style={{
                position: 'relative',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '10px 16px',
                border: 'none',
                background: 'transparent',
                cursor: 'pointer',
                borderRadius: 18,
                transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                minWidth: 64,
              }}
            >
              {isActive && (
                <motion.div
                  layoutId="nav-active"
                  style={{
                    position: 'absolute',
                    inset: 0,
                    background: 'var(--orange)',
                    borderRadius: 16,
                    zIndex: 0,
                  }}
                  transition={{ type: 'spring', bounce: 0.2, duration: 0.6 }}
                />
              )}
              
              <div style={{ 
                position: 'relative', 
                zIndex: 1,
                color: isActive ? '#fff' : 'var(--muted)',
                transition: 'color 0.3s ease',
              }}>
                <Icon s={22} fill={isActive} />
              </div>
              
              <span style={{
                position: 'relative',
                zIndex: 1,
                fontSize: 10,
                fontWeight: 800,
                marginTop: 4,
                color: isActive ? '#fff' : 'var(--muted)',
                transition: 'color 0.3s ease',
                textTransform: 'uppercase',
                letterSpacing: 0.5,
              }}>
                {item.label}
              </span>
            </button>
          );
        })}
      </motion.nav>
    </div>
  );
}
