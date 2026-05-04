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
    <div style={{ display: 'inline-block', verticalAlign: 'middle', marginLeft: 6 }}>
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
          width: 20,
          height: 20,
          borderRadius: '50%',
          border: '1.5px solid var(--muted)',
          background: 'transparent',
          fontSize: 11,
          fontWeight: '900',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          cursor: 'pointer',
          padding: 0,
          transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
          opacity: isOpen ? 1 : 0.6,
          boxShadow: isOpen ? '0 0 0 4px color-mix(in oklab, var(--orange) 20%, transparent)' : 'none',
          borderColor: isOpen ? 'var(--orange)' : 'var(--muted)',
          color: isOpen ? 'var(--orange)' : 'var(--muted)',
        }}
      >
        ?
      </button>

      <AnimatePresence>
        {isOpen && (
          <>
            <div 
              onClick={() => setIsOpen(false)}
              style={{ position: 'fixed', inset: 0, zIndex: 9998, background: 'rgba(0,0,0,0.02)', backdropFilter: 'blur(1px)' }}
            />
            
            <motion.div
              initial={{ opacity: 0, y: showBelow ? -10 : 10, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: showBelow ? -10 : 10, scale: 0.95 }}
              style={{
                position: 'fixed',
                top: showBelow ? (coords.bottom + 12) : (coords.top - 12),
                left: safeLeft,
                transform: showBelow ? 'translateX(-50%)' : 'translate(-50%, -100%)',
                width: tooltipWidth,
                background: 'var(--ink)',
                color: 'var(--cream)',
                padding: '16px 18px',
                borderRadius: 20,
                boxShadow: '0 20px 50px rgba(0,0,0,0.5), 0 0 0 1px rgba(255,255,255,0.1)',
                zIndex: 9999,
                fontSize: 13,
                lineHeight: 1.6,
                pointerEvents: 'auto'
              }}
            >
              <div style={{ fontWeight: 950, color: 'var(--orange)', marginBottom: 6, textTransform: 'uppercase', letterSpacing: 1.2, fontSize: 10 }}>
                {title}
              </div>
              <div style={{ opacity: 0.95, fontWeight: 500 }}>
                {content}
              </div>
              
              {/* Triangle avec orientation et offset dynamiques */}
              <div style={{
                position: 'absolute',
                [showBelow ? 'bottom' : 'top']: '100%',
                left: `calc(50% + ${arrowOffset}px)`,
                marginLeft: -10,
                borderWidth: 10,
                borderStyle: 'solid',
                borderColor: showBelow 
                  ? 'transparent transparent var(--ink) transparent' 
                  : 'var(--ink) transparent transparent transparent',
                transform: showBelow ? 'translateY(-200%) translateY(-12px)' : 'none'
              }} />
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
