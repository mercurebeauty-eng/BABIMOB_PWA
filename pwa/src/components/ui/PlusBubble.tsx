'use client';

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Ic } from './Ic';
import { useRouter } from 'next/navigation';
import { HelpTip } from './HelpTip';

interface PlusBubbleProps {
  isOpen: boolean;
  onClose: () => void;
  onToggleHeatmap: () => void;
  heatMode: boolean;
  isAdmin?: boolean;
}

export default function PlusBubble({ isOpen, onClose, onToggleHeatmap, heatMode, isAdmin }: PlusBubbleProps) {
  const router = useRouter();

  const menuItems = [
    { 
      icon: <Ic.Flame s={20} />, 
      label: heatMode ? 'Heatmap: Activée' : 'Heatmap: Désactivée', 
      action: onToggleHeatmap, 
      color: heatMode ? 'var(--orange)' : 'var(--muted)',
      help: { title: 'Heatmap', content: 'Affiche l\'affluence en temps réel sur la carte. Plus c\'est orange, plus il y a de mouvement !' }
    },
    { 
      icon: <Ic.Route s={20} />, 
      label: 'Escale', 
      path: '/app/itineraire', 
      color: 'var(--blue)',
      help: { title: 'Escale', content: 'Préparez vos trajets avec des arrêts intermédiaires (Fonctionnalité en cours de développement).' }
    },
    ...(isAdmin ? [{ icon: <Ic.Map s={20} />, label: 'Admin', path: '/app/admin', color: 'var(--ink)' }] : []),
  ];

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Overlay subtil */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            style={{
              position: 'fixed',
              inset: 0,
              zIndex: 8000,
              background: 'rgba(0,0,0,0.1)',
              backdropFilter: 'blur(10px)',
              WebkitBackdropFilter: 'blur(10px)',
              pointerEvents: 'auto'
            }}
          />
          
          {/* Menu flottant Antigravity */}
          <motion.div
            initial={{ scale: 0.8, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.8, opacity: 0, y: 20 }}
            transition={{ type: 'spring', damping: 25, stiffness: 350 }}
            style={{
              position: 'absolute',
              bottom: 'calc(100% + 15px)',
              right: 0,
              width: 220,
              background: 'rgba(255, 255, 255, 0.75)',
              backdropFilter: 'blur(40px) saturate(180%)',
              WebkitBackdropFilter: 'blur(40px) saturate(180%)',
              borderRadius: 28,
              border: '1px solid rgba(255,255,255,0.5)',
              boxShadow: '0 20px 40px rgba(0,0,0,0.12), inset 0 0 0 1px rgba(255,255,255,0.4)',
              padding: '8px',
              zIndex: 8100,
              display: 'flex',
              flexDirection: 'column',
              pointerEvents: 'auto',
              overflow: 'hidden'
            }}
          >
            {menuItems.map((item, idx) => (
              <React.Fragment key={idx}>
                <button
                  onClick={() => {
                    if (item.path) router.push(item.path);
                    if (item.action) item.action();
                    onClose();
                  }}
                  className="press"
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '12px 14px',
                    borderRadius: 18,
                    border: 'none',
                    background: 'transparent',
                    cursor: 'pointer',
                    width: '100%',
                    textAlign: 'left',
                    transition: 'background 0.2s ease',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center' }}>
                    <span style={{ 
                      fontSize: 14, 
                      fontWeight: 700, 
                      color: 'var(--ink)',
                      letterSpacing: -0.3
                    }}>
                      {item.label}
                    </span>
                    {item.help && <HelpTip {...item.help} />}
                  </div>
                  <div style={{ 
                    color: item.color, 
                    width: 32, 
                    height: 32, 
                    borderRadius: 12, 
                    background: 'rgba(255,255,255,0.5)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    boxShadow: '0 2px 8px rgba(0,0,0,0.05)'
                  }}>
                    {item.icon}
                  </div>
                </button>
                {idx < menuItems.length - 1 && (
                  <div style={{ 
                    height: 1, 
                    background: 'rgba(0,0,0,0.04)', 
                    margin: '4px 12px' 
                  }} />
                )}
              </React.Fragment>
            ))}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
