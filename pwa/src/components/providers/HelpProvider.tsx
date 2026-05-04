'use client';

import React, { createContext, useContext, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Ic } from '@/components/ui/Ic';

interface HelpContextType {
  showHelp: (title: string, content: string) => void;
}

const HelpContext = createContext<HelpContextType | undefined>(undefined);

export function HelpProvider({ children }: { children: React.ReactNode }) {
  const [help, setHelp] = useState<{ title: string; content: string } | null>(null);

  const showHelp = useCallback((title: string, content: string) => {
    setHelp({ title, content });
  }, []);

  const closeHelp = () => setHelp(null);

  return (
    <HelpContext.Provider value={{ showHelp }}>
      {children}
      
      <AnimatePresence>
        {help && (
          <>
            {/* Overlay flouté */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={closeHelp}
              style={{
                position: 'fixed',
                inset: 0,
                background: 'rgba(26,20,16,0.5)',
                backdropFilter: 'blur(8px)',
                zIndex: 20000,
                cursor: 'pointer',
              }}
            />

            {/* Popup Feedback Style */}
            <div style={{
              position: 'fixed',
              inset: 0,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              zIndex: 20001,
              pointerEvents: 'none',
              padding: 24
            }}>
              <motion.div
                initial={{ opacity: 0, scale: 0.9, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.9, y: 20 }}
                style={{
                  background: 'var(--cream)',
                  width: '100%',
                  maxWidth: 320,
                  borderRadius: 28,
                  padding: '32px 24px 24px',
                  boxShadow: '0 20px 60px rgba(0,0,0,0.3)',
                  textAlign: 'center',
                  pointerEvents: 'auto',
                  border: '1px solid rgba(255,255,255,0.5)',
                }}
              >
                <div style={{ 
                  width: 56, height: 56, borderRadius: 20, 
                  background: 'var(--orange-pale)', color: 'var(--orange)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  margin: '0 auto 20px',
                }}>
                  <Ic.Info s={28} strokeWidth="3" />
                </div>

                <h3 style={{ 
                  margin: '0 0 8px', fontSize: 18, fontWeight: 900, 
                  color: 'var(--ink)', lineHeight: 1.2 
                }}>
                  {help.title}
                </h3>
                
                <p style={{ 
                  margin: 0, fontSize: 14, fontWeight: 500, 
                  color: 'var(--muted)', lineHeight: 1.6 
                }}>
                  {help.content}
                </p>

                <button
                  onClick={closeHelp}
                  style={{
                    marginTop: 24,
                    width: '100%',
                    padding: '14px',
                    borderRadius: 18,
                    border: 'none',
                    background: 'var(--ink)',
                    color: '#fff',
                    fontWeight: 800,
                    fontSize: 14,
                    cursor: 'pointer',
                    transition: 'transform 0.2s ease',
                  }}
                  className="press"
                >
                  D'accord
                </button>
              </motion.div>
            </div>
          </>
        )}
      </AnimatePresence>
    </HelpContext.Provider>
  );
}

export function useHelp() {
  const context = useContext(HelpContext);
  if (!context) throw new Error('useHelp must be used within a HelpProvider');
  return context;
}
