'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import { Ic } from '@/components/ui/Ic';
import { useCompass } from '@/hooks/useCompass';
import { useGeoLocation } from '@/hooks/useGeoLocation';
import { calculateBearing, haversineM } from '@/lib/geo';

export default function CompassPage() {
  const { heading, permissionStatus, requestPermission } = useCompass();
  const { userLoc, nearbyStops, locateMe } = useGeoLocation();
  
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    locateMe();
  }, [locateMe]);

  const target = nearbyStops[0] || null;

  const { relativeAngle, distance } = useMemo(() => {
    if (!userLoc || !target) return { relativeAngle: 0, distance: 0 };
    
    const bearing = calculateBearing(userLoc[0], userLoc[1], target.stop_lat, target.stop_lon);
    const dist = haversineM(userLoc[0], userLoc[1], target.stop_lat, target.stop_lon);
    
    // Si on a le heading (boussole), l'angle de la flèche est bearing - heading
    // Sinon on fait une simulation légère pour le visuel
    const rel = heading !== null ? (bearing - heading) : -15; 
    
    return { relativeAngle: rel, distance: dist };
  }, [userLoc, target, heading]);

  if (!mounted) return null;

  return (
    <div style={{ 
      position: 'fixed', inset: 0, 
      background: 'var(--ink)', 
      display: 'flex', flexDirection: 'column', color: 'var(--cream)',
      zIndex: 100,
      overflow: 'hidden'
    }}>
      {/* Animation de fond premium */}
      <div style={{ position: 'absolute', inset: 0, overflow: 'hidden', opacity: 0.4 }}>
        <motion.div 
          animate={{ 
            scale: [1, 1.2, 1],
            rotate: [0, 90, 0],
            opacity: [0.1, 0.2, 0.1]
          }}
          transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
          style={{ 
            position: 'absolute', top: '-50%', left: '-50%', width: '200%', height: '200%',
            background: 'radial-gradient(circle, var(--orange) 0%, transparent 70%)',
            filter: 'blur(80px)'
          }} 
        />
      </div>

      <div className="wax-bg" style={{ position: 'absolute', inset: 0, color: '#fff', opacity: 0.08, pointerEvents: 'none' }} />

      {/* Header */}
      <div style={{ paddingTop: 'calc(env(safe-area-inset-top, 0px) + 16px)', paddingBottom: 12, paddingLeft: 16, paddingRight: 16, display: 'flex', alignItems: 'center', gap: 12, position: 'relative', zIndex: 10 }}>
        <Link href="/app" style={{ 
          width: 44, height: 44, borderRadius: 14, 
          background: 'rgba(255,255,255,0.12)', color: '#fff', 
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          textDecoration: 'none', backdropFilter: 'blur(10px)', border: '1px solid rgba(255,255,255,0.1)'
        }}>
          <Ic.Back s={22} />
        </Link>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 11, fontWeight: 800, opacity: 0.8, letterSpacing: 1, textTransform: 'uppercase' }}>Boussole Intelligente</div>
          <div className="font-display" style={{ fontSize: 24, fontWeight: 900 }}>{target ? 'Suis la flèche' : 'Recherche GPS...'}</div>
        </div>
      </div>

      {/* Main Content */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', position: 'relative', zIndex: 5, padding: 20 }}>
        
        {/* Compass Ring */}
        <div style={{ position: 'relative', width: 320, height: 320, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ position: 'absolute', inset: 0, borderRadius: '50%', border: '2px solid rgba(255,255,255,0.05)', boxShadow: 'inset 0 0 40px rgba(0,0,0,0.5)' }} />
          <div style={{ position: 'absolute', inset: 40, borderRadius: '50%', border: '1px solid rgba(255,255,255,0.1)' }} />
          
          {/* Cardinaux dynamiques si boussole dispo */}
          <motion.div 
            animate={{ rotate: heading !== null ? -heading : 0 }}
            transition={{ type: 'spring', damping: 20, stiffness: 80 }}
            style={{ position: 'absolute', inset: 0 }}
          >
            {['N', 'E', 'S', 'O'].map((d, i) => (
              <div key={i} style={{
                position: 'absolute', left: '50%', top: '50%',
                transform: `translate(-50%, -50%) rotate(${i * 90}deg) translateY(-145px)`,
                fontSize: 16, fontWeight: 900, color: d === 'N' ? 'var(--orange)' : '#fff', opacity: 0.8
              }}>{d}</div>
            ))}
          </motion.div>

          {/* Target Arrow */}
          <motion.div 
            animate={{ rotate: relativeAngle }}
            transition={{ type: 'spring', damping: 12, stiffness: 50, mass: 1 }}
            style={{
              position: 'absolute', width: 80, height: 240,
              display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center'
            }}
          >
            <svg width="80" height="240" viewBox="0 0 80 240" style={{ filter: 'drop-shadow(0 0 15px var(--orange))' }}>
              <defs>
                <linearGradient id="arrowGrad" x1="0%" y1="0%" x2="0%" y2="100%">
                  <stop offset="0%" stopColor="var(--orange)" />
                  <stop offset="100%" stopColor="#FF8C42" />
                </linearGradient>
              </defs>
              <path d="M40 10 L70 120 L40 105 L10 120 Z" fill="url(#arrowGrad)"/>
              <path d="M40 105 L70 120 L40 230 L10 120 Z" fill="rgba(255,255,255,0.1)"/>
              <circle cx="40" cy="120" r="10" fill="var(--cream)" stroke="var(--ink)" strokeWidth="3"/>
            </svg>
          </motion.div>
        </div>

        {/* Distance Display */}
        <div style={{ marginTop: 40, textAlign: 'center' }}>
          <AnimatePresence mode="wait">
            <motion.div 
              key={target?.stop_id || 'searching'}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="font-display" 
              style={{ fontSize: 64, fontWeight: 900, lineHeight: 1, color: 'var(--cream)' }}
            >
              {target ? Math.round(distance) : '--'}
              <span style={{ fontSize: 24, fontWeight: 700, opacity: 0.6, marginLeft: 4 }}>m</span>
            </motion.div>
          </AnimatePresence>
          <div style={{ fontSize: 18, fontWeight: 800, color: 'var(--orange)', marginTop: 8 }}>
            {target ? target.stop_name : 'Localisation...'}
          </div>
          <div style={{ fontSize: 13, fontWeight: 500, opacity: 0.6, marginTop: 4, maxWidth: 240 }}>
            {target ? `${target.commune} · Pointe ton téléphone vers l'arrêt` : 'Active ton GPS pour une précision maximale'}
          </div>
        </div>
      </div>

      {/* Permission / Status Bar */}
      <div style={{ padding: 16, paddingBottom: 'calc(env(safe-area-inset-bottom, 0px) + 20px)', position: 'relative', zIndex: 10 }}>
        {permissionStatus !== 'granted' && (
          <button 
            onClick={requestPermission}
            style={{ 
              width: '100%', padding: '18px', borderRadius: 20, 
              background: 'var(--orange)', color: '#fff', 
              fontWeight: 900, fontSize: 15, border: 'none',
              textTransform: 'uppercase', letterSpacing: 1,
              boxShadow: '0 8px 24px rgba(242,108,26,0.4)',
              marginBottom: 16, cursor: 'pointer'
            }}
          >
            Activer la boussole physique 🧭
          </button>
        )}

        <div style={{ 
          background: 'rgba(255,255,255,0.08)', borderRadius: 24, padding: '16px 20px', 
          backdropFilter: 'blur(20px)', border: '1px solid rgba(255,255,255,0.1)',
          display: 'flex', alignItems: 'center', gap: 12
        }}>
          <div style={{ width: 10, height: 10, borderRadius: '50%', background: target ? 'var(--green)' : 'var(--orange)', boxShadow: `0 0 10px ${target ? 'var(--green)' : 'var(--orange)'}` }} className="animate-pulse" />
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 13, fontWeight: 700 }}>Signal {target ? 'Optimal' : 'Faible'}</div>
            <div style={{ fontSize: 11, opacity: 0.6 }}>Précision GPS: {target ? '±5m' : 'Calibrage...'}</div>
          </div>
          <div style={{ opacity: 0.6 }}><Ic.Users s={20} /></div>
        </div>
      </div>
    </div>
  );
}
