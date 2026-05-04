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

  return (
    <>
      <button
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          setIsOpen(true);
        }}
        aria-label={`Aide pour ${title}`}
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          verticalAlign: 'middle',
          marginLeft: 6,
          border: 'none',
          background: 'transparent',
          color: 'var(--muted)',
          cursor: 'pointer',
          padding: 2,
          transition: 'all 0.2s ease',
          opacity: 0.8,
        }}
      >
        <Ic.Info s={16} strokeWidth="3" />
      </button>

      <AnimatePresence>
        {isOpen && (
          <>
            {/* Overlay sombre avec flou */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsOpen(false)}
              style={{
                position: 'fixed',
                inset: 0,
                background: 'rgba(26,20,16,0.4)',
                backdropFilter: 'blur(4px)',
                zIndex: 11000, // Au-dessus de tout
                cursor: 'pointer',
              }}
            />

            {/* Volet d'aide (Bottom Sheet) */}
            <motion.div
              initial={{ y: '100%', x: '-50%' }}
              animate={{ y: 0, x: '-50%' }}
              exit={{ y: '100%', x: '-50%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              style={{
                position: 'fixed',
                left: '50%',
                bottom: 0,
                width: '100%',
                maxWidth: 500, // Limite sur desktop
                background: 'var(--cream)',
                padding: '24px 24px calc(env(safe-area-inset-bottom, 20px) + 24px)',
                borderRadius: '24px 24px 0 0',
                boxShadow: '0 -10px 40px rgba(0,0,0,0.2)',
                zIndex: 11001,
                display: 'flex',
                flexDirection: 'column',
                gap: 12,
              }}
            >
              {/* Petite barre de drag visuelle */}
              <div style={{ 
                width: 36, height: 4, background: 'var(--line)', 
                borderRadius: 2, alignSelf: 'center', marginBottom: 8 
              }} />

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h3 style={{ 
                  margin: 0, fontSize: 11, fontWeight: 900, 
                  color: 'var(--orange)', textTransform: 'uppercase', letterSpacing: 1.5 
                }}>
                  {title}
                </h3>
                <button 
                  onClick={() => setIsOpen(false)}
                  style={{ 
                    border: 'none', background: 'var(--cream-2)', 
                    padding: 8, borderRadius: '50%', cursor: 'pointer' 
                  }}
                >
                  <Ic.X s={18} color="var(--ink)" />
                </button>
              </div>

              <div style={{ 
                fontSize: 16, fontWeight: 500, color: 'var(--ink)', 
                lineHeight: 1.6, marginTop: 4 
              }}>
                {content}
              </div>

              <button
                onClick={() => setIsOpen(false)}
                style={{
                  marginTop: 12,
                  padding: '16px',
                  borderRadius: 16,
                  border: 'none',
                  background: 'var(--ink)',
                  color: '#fff',
                  fontWeight: 800,
                  fontSize: 14,
                  cursor: 'pointer',
                }}
              >
                J'ai compris
              </button>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
