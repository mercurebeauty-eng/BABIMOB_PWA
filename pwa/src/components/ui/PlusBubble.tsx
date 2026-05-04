'use client';

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Ic } from './Ic';
import Link from 'next/link';

interface PlusBubbleProps {
  isOpen: boolean;
  onClose: () => void;
  onToggleHeatmap: () => void;
  heatMode: boolean;
}

export default function PlusBubble({ isOpen, onClose, onToggleHeatmap, heatMode }: PlusBubbleProps) {
  const menuItems = [
    { icon: <Ic.Pin s={18} />, label: 'Stories', href: '/app/stories', color: 'var(--orange)' },
    { icon: <Ic.Users s={18} />, label: 'Mon Profil', href: '/app/compte', color: 'var(--blue)' },
    { icon: <Ic.Layers s={18} />, label: heatMode ? 'Désactiver Heatmap' : 'Activer Heatmap', action: onToggleHeatmap, color: heatMode ? 'var(--orange)' : 'var(--muted)' },
    { icon: <Ic.Settings s={18} />, label: 'Paramètres', href: '/app/settings', color: 'var(--ink-2)' },
  ];

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Overlay to close on click outside */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            style={{
              position: 'fixed',
              inset: 0,
              zIndex: 998,
              background: 'transparent'
            }}
          />
          
          <motion.div
            initial={{ scale: 0.8, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.8, opacity: 0, y: 20 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            style={{
              position: 'absolute',
              bottom: 80,
              right: 16,
              width: 200,
              background: 'var(--cream-2)',
              backdropFilter: 'blur(20px) saturate(180%)',
              WebkitBackdropFilter: 'blur(20px) saturate(180%)',
              borderRadius: 24,
              border: '1px solid var(--line)',
              boxShadow: '0 12px 40px rgba(0,0,0,0.15)',
              padding: 12,
              zIndex: 999,
              display: 'flex',
              flexDirection: 'column',
              gap: 4,
              pointerEvents: 'auto'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {menuItems.map((item, idx) => {
              const content = (
                <div 
                  style={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    gap: 12, 
                    padding: '10px 12px',
                    borderRadius: 14,
                    cursor: 'pointer',
                    transition: 'background 0.2s ease',
                  }}
                  className="press"
                >
                  <div style={{ color: item.color }}>{item.icon}</div>
                  <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--ink)' }}>{item.label}</span>
                </div>
              );

              if (item.href) {
                return (
                  <Link key={idx} href={item.href} style={{ textDecoration: 'none' }} onClick={onClose}>
                    {content}
                  </Link>
                );
              }

              return (
                <div key={idx} onClick={() => { item.action?.(); onClose(); }}>
                  {content}
                </div>
              );
            })}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
