'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { Ic } from './Ic';

const NAV_ITEMS = [
  { id: 'home', label: 'Carte', icon: Ic.Map, path: '/app', color: 'var(--orange)' },
  { id: 'gbairai', label: 'Gbairai', icon: Ic.Chat, path: '/app/gbairai', color: 'var(--blue)' },
  { id: 'compte', label: 'Profil', icon: Ic.Users, path: '/app/compte', color: 'var(--ink)' },
];

type NearbyStop = { stop_id: string; stop_name: string; distance_m: number };

export function BottomNav({
  onToggleHeatmap,
  heatMode,
  nearbyStop,
  onNearbyStopClick,
  onDiscover,
  isAdmin,
  isPlusOpen,
  onTogglePlus
}: {
  onToggleHeatmap: () => void;
  heatMode: boolean;
  nearbyStop?: NearbyStop | null;
  onNearbyStopClick?: () => void;
  onDiscover?: () => void;
  isAdmin?: boolean;
  isPlusOpen?: boolean;
  onTogglePlus?: () => void;
}) {
  const pathname = usePathname();

  const stopName = nearbyStop?.stop_name ?? '';
  const shortName = stopName.length > 11 ? stopName.slice(0, 10) + '…' : stopName;
  const distLabel = nearbyStop
    ? nearbyStop.distance_m < 1000
      ? `${Math.round(nearbyStop.distance_m)} m`
      : `${(nearbyStop.distance_m / 1000).toFixed(1)} km`
    : '';

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
        {/* Arret proche — visible uniquement si géolocalisation active */}
        {nearbyStop && (
          <button
            onClick={onNearbyStopClick}
            className="press"
            style={{
              height: 54,
              padding: '0 14px 0 10px',
              borderRadius: 16,
              background: 'linear-gradient(135deg, #FF9500, #FF5E00)',
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              color: '#fff',
              border: 'none',
              cursor: 'pointer',
              boxShadow: '0 4px 12px rgba(255,149,0,0.3)',
              minWidth: 54,
            }}
          >
            <Ic.Bus s={20} />
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: 1 }}>
              <span style={{ fontSize: 11, fontWeight: 900, lineHeight: 1, whiteSpace: 'nowrap' }}>{shortName}</span>
              <span style={{ fontSize: 9, fontWeight: 700, opacity: 0.85, lineHeight: 1 }}>{distLabel}</span>
            </div>
          </button>
        )}

        {NAV_ITEMS.map((item) => {
          const isActive = pathname === item.path;
          const Icon = item.icon;

          return (
            <Link
              key={item.id}
              href={item.path}
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
                textDecoration: 'none'
              }}
            >
              <Icon s={24} fill={isActive} />
            </Link>
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
            onClick={onTogglePlus}
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
        </div>

      </motion.nav>
    </div>
  );
}
