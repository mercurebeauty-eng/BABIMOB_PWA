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
  const [coords, setCoords] = useState({ top: 0, left: 0 });

  // Calcul de la position horizontale sécurisée
  const tooltipWidth = 220;
  const margin = 12;
  const screenWidth = typeof window !== 'undefined' ? window.innerWidth : 400;
  
  // On contraint le centre du tooltip pour qu'il reste à l'intérieur
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
            left: rect.left + rect.width / 2
          });
          setIsOpen(!isOpen);
        }}
        aria-label={`Aide pour ${title}`}
        style={{
          width: 18,
          height: 18,
          borderRadius: '50%',
          border: '1px solid var(--muted)',
          background: 'transparent',
          color: 'var(--muted)',
          fontSize: 10,
          fontWeight: 'bold',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          cursor: 'pointer',
          padding: 0,
        }}
      >
        ?
      </button>

      <AnimatePresence>
        {isOpen && (
          <>
            <div 
              onClick={() => setIsOpen(false)}
              style={{ position: 'fixed', inset: 0, zIndex: 9998 }}
            />
            
            <motion.div
              initial={{ opacity: 0, y: 5, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 5, scale: 0.95 }}
              style={{
                position: 'fixed',
                top: coords.top - 12,
                left: safeLeft,
                transform: 'translate(-50%, -100%)',
                width: tooltipWidth,
                background: 'var(--ink)',
                color: 'var(--cream)',
                padding: 14,
                borderRadius: 16,
                boxShadow: '0 15px 40px rgba(0,0,0,0.4)',
                zIndex: 9999,
                fontSize: 12,
                lineHeight: 1.5,
                border: '1px solid rgba(255,255,255,0.1)',
                pointerEvents: 'auto'
              }}
            >
              <div style={{ fontWeight: 900, color: 'var(--orange)', marginBottom: 6, textTransform: 'uppercase', letterSpacing: 0.8, fontSize: 10 }}>
                {title}
              </div>
              <div style={{ opacity: 0.9 }}>
                {content}
              </div>
              {/* Triangle avec offset dynamique */}
              <div style={{
                position: 'absolute',
                top: '100%',
                left: `calc(50% + ${arrowOffset}px)`,
                marginLeft: -8,
                borderWidth: 8,
                borderStyle: 'solid',
                borderColor: 'var(--ink) transparent transparent transparent'
              }} />
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
