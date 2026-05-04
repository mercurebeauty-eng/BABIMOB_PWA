'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { useState, useCallback, createContext, useContext } from 'react';

type XPEvent = { id: number; amount: number; x: number; y: number };

const XPContext = createContext<{
  addXP: (amount: number, x?: number, y?: number) => void;
} | null>(null);

export function XPProvider({ children }: { children: React.ReactNode }) {
  const [events, setEvents] = useState<XPEvent[]>([]);

  const addXP = useCallback((amount: number, x?: number, y?: number) => {
    const id = Date.now();
    // Par défaut au centre si pas de coordonnées
    const posX = x ?? (typeof window !== 'undefined' ? window.innerWidth / 2 : 0);
    const posY = y ?? (typeof window !== 'undefined' ? window.innerHeight / 2 : 0);
    
    setEvents(prev => [...prev, { id, amount, x: posX, y: posY }]);
    setTimeout(() => {
      setEvents(prev => prev.filter(e => e.id !== id));
    }, 2000);
  }, []);

  return (
    <XPContext.Provider value={{ addXP }}>
      {children}
      <div style={{ position: 'fixed', inset: 0, pointerEvents: 'none', zIndex: 9999, overflow: 'hidden' }}>
        <AnimatePresence>
          {events.map(event => (
            <motion.div
              key={event.id}
              initial={{ opacity: 0, y: event.y, x: event.x - 20, scale: 0.5 }}
              animate={{ opacity: 1, y: event.y - 100, x: event.x - 20, scale: 1.2 }}
              exit={{ opacity: 0, scale: 1.5 }}
              transition={{ duration: 0.8, ease: "easeOut" }}
              style={{
                position: 'absolute',
                color: 'var(--orange)',
                fontFamily: 'var(--font-archivo-black)',
                fontSize: 28,
                fontWeight: 'bold',
                textShadow: '0 4px 12px rgba(0,0,0,0.3), 0 0 20px rgba(242,108,26,0.4)',
                whiteSpace: 'nowrap',
              }}
            >
              +{event.amount} XP
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </XPContext.Provider>
  );
}

export function useXP() {
  const context = useContext(XPContext);
  if (!context) throw new Error('useXP must be used within XPProvider');
  return context;
}
