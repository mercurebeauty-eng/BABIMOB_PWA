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
    <div style={{ display: 'inline-block', verticalAlign: 'middle', marginLeft: 6, position: 'relative' }}>
      <button
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
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
            {/* Backdrop transparent pour fermer au clic ailleurs */}
            <div 
              onClick={() => setIsOpen(false)}
              style={{ position: 'fixed', inset: 0, zIndex: 1999 }}
            />
            
            <motion.div
              initial={{ opacity: 0, y: 10, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 10, scale: 0.95 }}
              style={{
                position: 'absolute',
                bottom: '100%',
                left: '50%',
                transform: 'translateX(-50%)',
                marginBottom: 10,
                width: 200,
                background: 'var(--ink)',
                color: 'var(--cream)',
                padding: 12,
                borderRadius: 12,
                boxShadow: '0 10px 25px rgba(0,0,0,0.25)',
                zIndex: 2000,
                fontSize: 11,
                lineHeight: 1.5,
                border: '1px solid var(--line)',
              }}
            >
              <div style={{ fontWeight: 800, color: 'var(--orange)', marginBottom: 4, textTransform: 'uppercase', letterSpacing: 0.5 }}>
                {title}
              </div>
              <div style={{ opacity: 0.8 }}>
                {content}
              </div>
              {/* Triangle */}
              <div style={{
                position: 'absolute',
                top: '100%',
                left: '50%',
                marginLeft: -6,
                borderWidth: 6,
                borderStyle: 'solid',
                borderColor: 'var(--line) transparent transparent transparent'
              }} />
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
