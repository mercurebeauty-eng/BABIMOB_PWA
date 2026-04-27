'use client';

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { Ic } from '@/components/ui/Ic';

export default function CompassPage() {
  const [angle, setAngle] = useState(-15);
  const [distance, setDistance] = useState(60);

  useEffect(() => {
    const id = setInterval(() => {
      setAngle(a => a + (Math.random() - 0.5) * 12);
      setDistance(d => Math.max(10, d + (Math.random() - 0.5) * 4));
    }, 800);
    return () => clearInterval(id);
  }, []);

  return (
    <div style={{ 
      position: 'fixed', inset: 0, 
      background: 'linear-gradient(180deg, var(--orange) 0%, var(--orange-deep) 100%)', 
      display: 'flex', flexDirection: 'column', color: '#fff',
      zIndex: 100
    }}>
      <div className="wax-bg" style={{ position: 'absolute', inset: 0, color: '#fff', opacity: 0.08, pointerEvents: 'none' }} />

      <div style={{ paddingTop: 56, padding: '56px 16px 12px', display: 'flex', alignItems: 'center', gap: 12, position: 'relative', zIndex: 2 }}>
        <Link href="/app" style={{ 
          width: 40, height: 40, borderRadius: 12, border: 'none', 
          background: 'rgba(255,255,255,0.18)', color: '#fff', 
          cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
          textDecoration: 'none'
        }}>
          <Ic.Back s={20} />
        </Link>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 11, fontWeight: 800, opacity: 0.85, letterSpacing: 0.6 }}>BOUSSOLE BABI</div>
          <div className="font-display" style={{ fontSize: 22 }}>Pointe le Gbaka</div>
        </div>
      </div>

      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', position: 'relative', zIndex: 2, padding: 20 }}>
        <div style={{ position: 'relative', width: 280, height: 280 }}>
          <div style={{ position: 'absolute', inset: 0, borderRadius: '50%', border: '2px dashed rgba(255,255,255,0.3)' }} />
          <div style={{ position: 'absolute', inset: 30, borderRadius: '50%', border: '1px solid rgba(255,255,255,0.2)' }} />
          {['N', 'E', 'S', 'O'].map((d, i) => (
            <div key={i} style={{
              position: 'absolute', left: '50%', top: '50%',
              transform: `translate(-50%, -50%) rotate(${i * 90}deg) translateY(-130px) rotate(${-i * 90}deg)`,
              fontSize: 14, fontWeight: 800, opacity: 0.7
            }}>{d}</div>
          ))}
          <motion.div 
            animate={{ rotate: angle }}
            transition={{ type: 'spring', damping: 15, stiffness: 60 }}
            style={{
              position: 'absolute', left: '50%', top: '50%',
              width: 60, height: 200,
              marginLeft: -30, marginTop: -100,
              transformOrigin: 'center'
            }}
          >
            <svg width="60" height="200" viewBox="0 0 60 200">
              <path d="M30 10 L50 100 L30 90 L10 100 Z" fill="#fff"/>
              <path d="M30 90 L50 100 L30 190 L10 100 Z" fill="rgba(255,255,255,0.4)"/>
              <circle cx="30" cy="100" r="8" fill="var(--ink)" stroke="#fff" strokeWidth="2"/>
            </svg>
          </motion.div>
        </div>

        <div style={{ marginTop: 32, textAlign: 'center' }}>
          <div className="font-display" style={{ fontSize: 56, lineHeight: 1 }}>
            {Math.round(distance)}
            <span style={{ fontSize: 28, opacity: 0.8 }}>m</span>
          </div>
          <div style={{ fontSize: 14, fontWeight: 600, opacity: 0.9, marginTop: 4 }}>Arrêt Gbaka — Marché Cocody</div>
          <div style={{ fontSize: 12, opacity: 0.7, marginTop: 2 }}>Direction Adjamé · prochain dans 2 min</div>
        </div>
      </div>

      <div style={{ padding: 16, paddingBottom: 36, position: 'relative', zIndex: 2 }}>
        <div style={{ background: 'rgba(255,255,255,0.18)', borderRadius: 18, padding: 14, backdropFilter: 'blur(10px)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div className="shimmer" style={{ width: 8, height: 8, borderRadius: '50%', background: '#fff' }} />
            <div style={{ flex: 1, fontSize: 13, fontWeight: 600 }}>Tarif aujourd'hui : <b>200F</b> · confirmé par 14 Babis</div>
            <Ic.Users s={18} />
          </div>
        </div>
      </div>
    </div>
  );
}
