'use client';

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { usePathname, useRouter } from 'next/navigation';
import Link from 'next/link';
import { Ic } from './Ic';

interface BottomNavProps {
  onToggleHeatmap?: () => void;
  heatMode?: boolean;
  nearbyStopsCount?: number;
  onCycleNearby?: () => void;
  onDiscover?: () => void;
  isAdmin?: boolean;
  isPlusOpen?: boolean;
  onTogglePlus?: () => void;
  onToggleSearch?: () => void;
}

export function BottomNav({
  nearbyStopsCount = 0,
  onCycleNearby,
  onToggleSearch,
  onTogglePlus,
  pathname: passedPathname,
}: BottomNavProps & { pathname?: string }) {
  const router = useRouter();
  const currentPath = usePathname() || passedPathname || '';

  const NAV_ITEMS = [
    { 
      id: 'map', 
      label: 'Carte', 
      icon: Ic.Map, 
      path: '/app',
      active: currentPath === '/app'
    },
    { 
      id: 'transport', 
      label: 'Transport', 
      icon: Ic.Bus, 
      action: onCycleNearby,
      badge: nearbyStopsCount > 0 ? nearbyStopsCount : null,
      active: false
    },
    { 
      id: 'gbairai', 
      label: 'Gbairai', 
      icon: null, // Custom center button
      path: '/app/gbairai',
      active: currentPath.includes('/app/gbairai'),
      isCenter: true
    },
    { 
      id: 'search', 
      label: 'Recherche', 
      icon: Ic.Search, 
      action: onToggleSearch,
      active: false
    },
    { 
      id: 'compte', 
      label: 'Profil', 
      icon: Ic.Users, 
      path: '/app/compte',
      active: currentPath === '/app/compte'
    }
  ];

  return (
    <div style={{
      position: 'fixed',
      bottom: 'calc(env(safe-area-inset-bottom, 0px) + 16px)',
      left: 0,
      right: 0,
      zIndex: 9000,
      display: 'flex',
      justifyContent: 'center',
      pointerEvents: 'none',
      padding: '0 12px'
    }}>
      <motion.nav
        initial={{ y: 80, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        style={{
          background: 'rgba(255, 255, 255, 0.75)',
          backdropFilter: 'blur(24px) saturate(180%)',
          WebkitBackdropFilter: 'blur(24px) saturate(180%)',
          borderRadius: 32,
          padding: '4px 8px',
          display: 'flex',
          alignItems: 'center',
          gap: 2,
          boxShadow: '0 15px 40px rgba(0,0,0,0.12), inset 0 0 0 1px rgba(255,255,255,0.4)',
          pointerEvents: 'auto',
          border: '1px solid rgba(255,255,255,0.4)',
          maxWidth: '420px',
          width: '100%',
          justifyContent: 'space-between',
          position: 'relative'
        }}
      >
        {NAV_ITEMS.map((item) => {
          if (item.isCenter) {
            return (
              <div key={item.id} style={{ position: 'relative', width: 64, height: 64, marginTop: -32 }}>
                <button
                  onClick={() => router.push(item.path!)}
                  className="press"
                  style={{
                    width: 64,
                    height: 64,
                    borderRadius: 24,
                    background: 'linear-gradient(135deg, var(--orange) 0%, var(--orange-deep) 100%)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    border: '4px solid #fff',
                    cursor: 'pointer',
                    boxShadow: '0 12px 28px rgba(242,108,26,0.35)',
                    position: 'relative',
                    overflow: 'hidden'
                  }}
                >
                  <div className="wax-bg" style={{ position: 'absolute', inset: 0, opacity: 0.15, color: '#fff' }} />
                  <span className="font-display" style={{ fontSize: 26, color: '#fff', position: 'relative', fontWeight: 900 }}>G</span>
                  {item.active && (
                    <motion.div 
                      layoutId="active-center"
                      style={{ position: 'absolute', bottom: 4, width: 4, height: 4, borderRadius: '50%', background: '#fff' }} 
                    />
                  )}
                </button>
              </div>
            );
          }

          const Icon = item.icon!;
          
          return (
            <button
              key={item.id}
              onClick={() => {
                if (item.path) router.push(item.path);
                else if (item.action) item.action();
              }}
              className="press"
              style={{
                flex: 1,
                height: 54,
                borderRadius: 22,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                color: item.active ? 'var(--orange)' : 'var(--ink)',
                border: 'none',
                background: 'transparent',
                cursor: 'pointer',
                transition: 'all 0.2s',
                gap: 3,
                opacity: item.active ? 1 : 0.6,
                position: 'relative'
              }}
            >
              <div style={{ position: 'relative' }}>
                <Icon s={22} fill={item.active} />
                {item.badge && (
                  <span style={{
                    position: 'absolute',
                    top: -6,
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
                    border: '2px solid #fff'
                  }}>
                    {item.badge}
                  </span>
                )}
              </div>
              <span style={{ fontSize: 8, fontWeight: 800, textTransform: 'uppercase', letterSpacing: 0.2 }}>
                {item.label}
              </span>
              {item.active && (
                <motion.div 
                  layoutId="active-nav"
                  style={{ position: 'absolute', bottom: 4, width: 12, height: 2, borderRadius: 2, background: 'var(--orange)' }} 
                />
              )}
            </button>
          );
        })}
      </motion.nav>
    </div>
  );
}
