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
  onDiscover?: () => void;
  onVoiceCreate?: () => void;
  heatMode: boolean;
  isAdmin?: boolean;
}

export default function PlusBubble({ isOpen, onClose, onToggleHeatmap, onDiscover, onVoiceCreate, heatMode, isAdmin }: PlusBubbleProps) {
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
      icon: <Ic.Search s={20} />, 
      label: 'Découvrir', 
      action: onDiscover || (() => router.push('/app?discover=1')), 
      color: 'var(--green)',
      help: { title: 'Découvrir', content: 'Laissez le hasard choisir votre prochaine destination parmi nos lieux préférés.' }
    },
    { 
      icon: <Ic.Chat s={20} />, 
      label: 'Gbairai', 
      path: '/app/gbairai',
      color: 'var(--orange-deep)',
      help: { title: 'Gbairai', content: 'Discutez en temps réel avec les autres Mobeurs.' }
    },
    { 
      icon: <Ic.Route s={20} />, 
      label: 'Escale', 
      disabled: true,
      badge: 'Bientôt',
      color: 'var(--muted)',
      help: { title: 'Escale', content: 'Préparez vos trajets avec des arrêts intermédiaires (Fonctionnalité en cours de développement).' }
    },
    ...(onVoiceCreate ? [{ 
      icon: <Ic.Mic s={20} fill />, 
      label: 'Lancer un Gbairai', 
      action: onVoiceCreate, 
      color: 'var(--pink)',
      help: { title: 'Gbairai Vocal', content: 'Lancez un salon vocal méritocratique pour discuter en direct.' }
    }] : []),
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
            onClick={(e) => {
              e.stopPropagation();
              onClose();
            }}
            style={{
              position: 'fixed',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              zIndex: 9400, 
              background: 'rgba(0,0,0,0.15)',
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
              position: 'fixed',
              bottom: 'calc(env(safe-area-inset-bottom, 0px) + 90px)',
              right: 16,
              width: 240,
              background: 'rgba(255, 255, 255, 0.85)',
              backdropFilter: 'blur(40px) saturate(200%)',
              WebkitBackdropFilter: 'blur(40px) saturate(200%)',
              borderRadius: 32,
              border: '1px solid rgba(255,255,255,0.6)',
              boxShadow: '0 30px 60px rgba(0,0,0,0.18), inset 0 0 0 1px rgba(255,255,255,0.4)',
              padding: '8px',
              zIndex: 9500,
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
                    if (item.disabled) return;
                    if (item.path) router.push(item.path);
                    if (item.action) item.action();
                    onClose();
                  }}
                  className={item.disabled ? "" : "press"}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '12px 14px',
                    borderRadius: 18,
                    border: 'none',
                    background: 'transparent',
                    cursor: item.disabled ? 'not-allowed' : 'pointer',
                    width: '100%',
                    textAlign: 'left',
                    transition: 'background 0.2s ease',
                    opacity: item.disabled ? 0.5 : 1,
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <span style={{ 
                      fontSize: 14, 
                      fontWeight: 700, 
                      color: 'var(--ink)',
                      letterSpacing: -0.3
                    }}>
                      {item.label}
                    </span>
                    {(item as any).badge && (
                      <span style={{ fontSize: 9, fontWeight: 900, background: 'var(--orange-pale)', color: 'var(--orange)', padding: '2px 6px', borderRadius: 6, textTransform: 'uppercase' }}>
                        {(item as any).badge}
                      </span>
                    )}
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
