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
    { icon: <Ic.Pin s={20} />, label: 'Stories', href: '/app/stories', color: 'var(--orange)' },
    { icon: <Ic.Users s={20} />, label: 'Mon Profil', href: '/app/compte', color: 'var(--blue)' },
    { icon: <Ic.Layers s={20} />, label: heatMode ? 'Désactiver Heatmap' : 'Activer Heatmap', action: onToggleHeatmap, color: heatMode ? 'var(--orange)' : 'var(--muted)' },
    { icon: <Ic.Settings s={20} />, label: 'Paramètres', href: '/app/settings', color: 'var(--ink-2)' },
  ];

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Transparent Overlay with Blur for iOS effect */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            style={{
              position: 'fixed',
              inset: 0,
              zIndex: 2000,
              background: 'rgba(26,20,16,0.2)',
              backdropFilter: 'blur(4px)',
              WebkitBackdropFilter: 'blur(4px)'
            }}
          />
          
          {/* iOS Style Context Menu Bubble */}
          <motion.div
            initial={{ scale: 0.4, opacity: 0, y: 100, x: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0, x: 0 }}
            exit={{ scale: 0.4, opacity: 0, y: 100, x: 20 }}
            transition={{ type: 'spring', damping: 25, stiffness: 400 }}
            style={{
              position: 'fixed',
              bottom: 100,
              right: 20,
              width: 220,
              background: 'rgba(255, 255, 255, 0.85)',
              backdropFilter: 'blur(30px) saturate(200%)',
              WebkitBackdropFilter: 'blur(30px) saturate(200%)',
              borderRadius: 28,
              border: '1px solid rgba(255,255,255,0.4)',
              boxShadow: '0 20px 50px rgba(0,0,0,0.2)',
              padding: 8,
              zIndex: 2100,
              display: 'flex',
              flexDirection: 'column',
              transformOrigin: 'bottom right',
              overflow: 'hidden'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {menuItems.map((item, idx) => {
              const content = (
                <div 
                  style={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    justifyContent: 'space-between',
                    padding: '14px 16px',
                    borderRadius: 20,
                    cursor: 'pointer',
                    transition: 'all 0.2s ease',
                  }}
                  className="press"
                >
                  <span style={{ fontSize: 15, fontWeight: 700, color: 'var(--ink)' }}>{item.label}</span>
                  <div style={{ 
                    color: item.color, 
                    width: 32, 
                    height: 32, 
                    borderRadius: 10, 
                    background: 'rgba(0,0,0,0.03)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}>
                    {item.icon}
                  </div>
                </div>
              );

              return (
                <React.Fragment key={idx}>
                  {item.href ? (
                    <Link href={item.href} style={{ textDecoration: 'none' }} onClick={onClose}>
                      {content}
                    </Link>
                  ) : (
                    <div onClick={() => { item.action?.(); onClose(); }}>
                      {content}
                    </div>
                  )}
                  {idx < menuItems.length - 1 && (
                    <div style={{ height: 1, background: 'rgba(0,0,0,0.05)', margin: '0 16px' }} />
                  )}
                </React.Fragment>
              );
            })}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
