'use client';

import { useState } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';

function TgIcon() {
  return (
    <svg viewBox="0 0 24 24" className="w-5 h-5" fill="currentColor" aria-hidden>
      <path d="M9.04 15.47 8.9 19.3c.38 0 .55-.16.75-.36l1.8-1.72 3.73 2.72c.68.38 1.17.18 1.35-.63l2.45-11.47c.22-1.02-.37-1.42-1.03-1.18L2.77 11.03c-1 .39-.98.95-.17 1.2l3.88 1.21 9-5.67c.42-.28.81-.12.49.16" />
    </svg>
  );
}

export default function NavMobile({ tgUrl }: { tgUrl: string }) {
  const [open, setOpen] = useState(false);

  const close = () => setOpen(false);

  return (
    <div className="md:hidden">
      <button
        onClick={() => setOpen(!open)}
        aria-label={open ? 'Fermer le menu' : 'Ouvrir le menu'}
        className="relative z-[100] w-11 h-11 rounded-2xl bg-white border border-beige-200 flex items-center justify-center text-bm-obsidian shadow-sm transition-all hover:border-bm-orange/40 active:scale-90"
      >
        <AnimatePresence mode="wait">
          {open ? (
            <motion.svg 
              key="close"
              initial={{ rotate: -90, opacity: 0 }}
              animate={{ rotate: 0, opacity: 1 }}
              exit={{ rotate: 90, opacity: 0 }}
              viewBox="0 0 24 24" 
              className="w-5 h-5 font-bold" 
              fill="none" 
              stroke="currentColor" 
              strokeWidth="3" 
              aria-hidden
            >
              <path d="M18 6 6 18M6 6l12 12" strokeLinecap="round" />
            </motion.svg>
          ) : (
            <motion.svg 
              key="menu"
              initial={{ rotate: 90, opacity: 0 }}
              animate={{ rotate: 0, opacity: 1 }}
              exit={{ rotate: -90, opacity: 0 }}
              viewBox="0 0 24 24" 
              className="w-5 h-5" 
              fill="none" 
              stroke="currentColor" 
              strokeWidth="3" 
              aria-hidden
            >
              <path d="M4 8h16M4 16h16" strokeLinecap="round" />
            </motion.svg>
          )}
        </AnimatePresence>
      </button>

      <AnimatePresence>
        {open && (
          <>
            {/* Backdrop */}
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={close}
              className="fixed inset-0 z-40 bg-bm-obsidian/20 backdrop-blur-sm"
            />
            
            {/* Menu Drawer */}
            <motion.div 
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="fixed top-0 right-0 bottom-0 w-[80%] z-50 bg-white shadow-2xl flex flex-col p-8 pt-24"
            >
              <nav className="flex flex-col gap-1">
                {[
                  ['#comment',    'Comment ça marche'],
                  ['#fonctions',  'Fonctionnalités'],
                  ['#transports', 'Transports'],
                ].map(([href, label]) => (
                  <motion.a
                    key={label}
                    href={href}
                    onClick={close}
                    whileHover={{ x: 10 }}
                    className="font-display font-black text-3xl py-4 border-b border-gray-50 text-bm-obsidian hover:text-bm-orange transition-colors"
                  >
                    {label}
                  </motion.a>
                ))}
              </nav>

              <div className="mt-auto flex flex-col gap-4">
                <a
                  href={tgUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={close}
                  className="flex items-center justify-center gap-3 py-5 rounded-2xl bg-bm-blue text-white font-black text-lg shadow-xl shadow-bm-blue/20"
                >
                  <TgIcon /> Telegram
                </a>
                <Link
                  href="/app"
                  onClick={close}
                  className="flex items-center justify-center py-5 rounded-2xl bg-bm-orange text-white font-black text-lg shadow-xl shadow-bm-orange/20"
                >
                  Ouvrir la carte →
                </Link>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
