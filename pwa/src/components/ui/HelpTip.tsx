'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Ic } from './Ic';

interface HelpTipProps {
  title: string;
  content: string;
}

export function HelpTip({ title, content }: HelpTipProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [coords, setCoords] = useState({ top: 0, left: 0, bottom: 0 });
  const screenWidth = typeof window !== 'undefined' ? window.innerWidth : 400;

  // Dimensions et marges
  const tooltipWidth = Math.min(260, screenWidth - 24);
  const margin = 12;
  
  // Vérifier s'il y a de la place en haut (besoin d'environ 120px)
  const showBelow = coords.top < 150;
  
  // On contraint le centre du tooltip pour qu'il reste à l'intérieur horizontalement
  const safeLeft = Math.max(
    tooltipWidth / 2 + margin, 
    Math.min(screenWidth - tooltipWidth / 2 - margin, coords.left)
  );

  // Décalage de la flèche par rapport au centre du tooltip
  const arrowOffset = coords.left - safeLeft;

  return (
    <div style={{ display: 'inline-flex', alignItems: 'center', verticalAlign: 'middle', marginLeft: 6 }}>
      <button
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          const rect = e.currentTarget.getBoundingClientRect();
          setCoords({
            top: rect.top,
            bottom: rect.bottom,
            left: rect.left + rect.width / 2
          });
          setIsOpen(!isOpen);
        }}
        aria-label={`Aide pour ${title}`}
        style={{
          border: 'none',
          background: 'transparent',
          color: isOpen ? 'var(--orange)' : 'var(--muted)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          cursor: 'pointer',
          padding: 2,
          transition: 'all 0.2s ease',
          opacity: isOpen ? 1 : 0.7,
        }}
      >
        <Ic.Info s={16} color={isOpen ? 'var(--orange)' : 'var(--muted)'} strokeWidth="3" />
      </button>

      <AnimatePresence>
        {isOpen && (
          <>
            <div 
              onClick={() => setIsOpen(false)}
              style={{ position: 'fixed', inset: 0, zIndex: 9998, background: 'rgba(0,0,0,0.02)', backdropFilter: 'blur(1px)' }}
            />
            
            <motion.div
              initial={{ opacity: 0, y: showBelow ? -8 : 8, scale: 0.96 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: showBelow ? -8 : 8, scale: 0.96 }}
              style={{
                position: 'fixed',
                top: showBelow ? (coords.bottom + 10) : (coords.top - 10),
                left: safeLeft,
                transform: showBelow ? 'translateX(-50%)' : 'translate(-50%, -100%)',
                width: tooltipWidth,
                background: 'var(--ink)',
                color: 'var(--cream)',
                padding: '14px 16px',
                borderRadius: 18,
                boxShadow: '0 12px 40px rgba(0,0,0,0.4), 0 0 0 1px rgba(255,255,255,0.1)',
                zIndex: 9999,
                fontSize: 13,
                lineHeight: 1.55,
                pointerEvents: 'auto'
              }}
            >
              {title && (
                <div style={{ fontWeight: 900, color: 'var(--orange)', marginBottom: 4, textTransform: 'uppercase', letterSpacing: 1, fontSize: 10 }}>
                  {title}
                </div>
              )}
              <div style={{ fontWeight: 500 }}>
                {content}
              </div>
              
              {/* Triangle ajusté */}
              <div style={{
                position: 'absolute',
                [showBelow ? 'bottom' : 'top']: '100%',
                left: `calc(50% + ${arrowOffset}px)`,
                marginLeft: -8,
                borderWidth: 8,
                borderStyle: 'solid',
                borderColor: showBelow 
                  ? 'transparent transparent var(--ink) transparent' 
                  : 'var(--ink) transparent transparent transparent',
                transform: showBelow ? 'translateY(-200%) translateY(2px)' : 'translateY(-2px)',
                zIndex: 1
              }} />
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
