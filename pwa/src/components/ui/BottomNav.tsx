'use client';

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { usePathname, useRouter } from 'next/navigation';
import Link from 'next/link';
import { Ic } from './Ic';

interface BottomNavProps {
  onToggleHeatmap: () => void;
  heatMode: boolean;
  nearbyStopsCount?: number;
  onCycleNearby?: () => void;
  onDiscover?: () => void;
  isAdmin?: boolean;
  isPlusOpen?: boolean;
  onTogglePlus?: () => void;
}

export function BottomNav({
  nearbyStopsCount = 0,
  onCycleNearby,
  onDiscover,
  isPlusOpen,
  onTogglePlus,
  heatMode
}: BottomNavProps) {
  const pathname = usePathname();
  const router = useRouter();

  const NAV_ITEMS = [
    { 
      id: 'transport', 
      label: 'Transport', 
      icon: Ic.Bus, 
      action: onCycleNearby,
      badge: nearbyStopsCount > 0 ? nearbyStopsCount : null,
      active: false // Dynamic highlight based on badge
    },
    { 
      id: 'home', 
      label: 'Carte', 
      icon: Ic.Map, 
      path: '/app',
      active: pathname === '/app'
    },
    { 
      id: 'discover', 
      label: 'Découvrir', 
      icon: Ic.Search, 
      action: onDiscover,
      active: false
    },
    { 
      id: 'compte', 
      label: 'Profil', 
      icon: Ic.Users, 
      path: '/app/compte',
      active: pathname === '/app/compte'
    },
    { 
      id: 'plus', 
      label: 'Plus', 
      icon: Ic.Menu, 
      action: onTogglePlus,
      active: isPlusOpen
    }
  ];

  return (
    <div style={{
      position: 'fixed',
      bottom: 'calc(env(safe-area-inset-bottom, 0px) + 24px)',
      left: 0,
      right: 0,
      zIndex: 9000,
      display: 'flex',
      justifyContent: 'center',
      pointerEvents: 'none',
      padding: '0 16px'
    }}>
      <motion.nav
        initial={{ y: 80, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        style={{
          background: 'rgba(255, 255, 255, 0.7)',
          backdropFilter: 'blur(30px) saturate(210%)',
          WebkitBackdropFilter: 'blur(30px) saturate(210%)',
          borderRadius: 28,
          padding: '6px',
          display: 'flex',
          alignItems: 'center',
          gap: 4,
          boxShadow: '0 20px 50px rgba(0,0,0,0.15), inset 0 0 0 1px rgba(255,255,255,0.4)',
          pointerEvents: 'auto',
          border: '1px solid rgba(255,255,255,0.5)',
          maxWidth: '400px',
          width: '100%',
          justifyContent: 'space-around'
        }}
      >
        {NAV_ITEMS.map((item) => {
          const Icon = item.icon;
          const isTransportAlert = item.id === 'transport' && item.badge;
          
          return (
            <div key={item.id} style={{ position: 'relative', flex: 1, display: 'flex', justifyContent: 'center' }}>
              <button
                onClick={(e) => {
                  if (item.path) {
                    router.push(item.path);
                  } else if (item.action) {
                    item.action();
                  }
                }}
                className="press"
                style={{
                  width: '100%',
                  height: 52,
                  borderRadius: 22,
                  background: item.active ? 'var(--orange)' : (isTransportAlert ? 'rgba(255, 149, 0, 0.15)' : 'transparent'),
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: item.active ? '#fff' : (isTransportAlert ? 'var(--orange)' : 'var(--ink)'),
                  border: 'none',
                  cursor: 'pointer',
                  transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                  gap: 2,
                  opacity: (item.id === 'plus' && isPlusOpen) ? 1 : (item.active ? 1 : 0.7)
                }}
              >
                <div style={{ position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Icon s={22} fill={item.active} />
                  
                  {item.badge && (
                    <motion.span
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      style={{
                        position: 'absolute',
                        top: -8,
                        right: -10,
                        background: 'var(--orange)',
                        color: '#fff',
                        fontSize: 9,
                        fontWeight: 900,
                        minWidth: 16,
                        height: 16,
                        borderRadius: 8,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        padding: '0 4px',
                        border: '2px solid #fff',
                        boxShadow: '0 2px 6px rgba(242,108,26,0.3)'
                      }}
                      className="pulse"
                    >
                      {item.badge}
                    </motion.span>
                  )}
                </div>
                <span style={{ fontSize: 8, fontWeight: 800, textTransform: 'uppercase', letterSpacing: 0.2, opacity: 0.8 }}>
                  {item.label}
                </span>
              </button>
            </div>
          );
        })}
      </motion.nav>
    </div>
  );
}
