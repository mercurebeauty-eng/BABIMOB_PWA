'use client';

import { useState } from 'react';
import Link from 'next/link';

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
        className="w-10 h-10 rounded-xl bg-bm-surface border border-bm-border flex items-center justify-center text-bm-text transition hover:border-bm-amber/40"
      >
        {open ? (
          <svg viewBox="0 0 24 24" className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
            <path d="M18 6 6 18M6 6l12 12" strokeLinecap="round" />
          </svg>
        ) : (
          <svg viewBox="0 0 24 24" className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
            <path d="M3 12h18M3 6h18M3 18h18" strokeLinecap="round" />
          </svg>
        )}
      </button>

      {open && (
        <div className="fixed inset-0 z-40 bg-bm-bg/97 backdrop-blur-xl flex flex-col pt-20 px-6">
          <nav className="flex flex-col gap-1">
            {[
              ['#comment',    'Comment ça marche'],
              ['#transports', 'Transports'],
              ['#fonctions',  'Fonctionnalités'],
              ['#ccomment',   "C'comment"],
            ].map(([href, label]) => (
              <a
                key={label}
                href={href}
                onClick={close}
                className="font-display font-semibold text-xl py-4 border-b border-bm-border text-bm-text hover:text-bm-amber transition-colors"
              >
                {label}
              </a>
            ))}
          </nav>

          <div className="mt-8 flex flex-col gap-3">
            <a
              href={tgUrl}
              target="_blank"
              rel="noopener noreferrer"
              onClick={close}
              className="flex items-center justify-center gap-2 py-4 rounded-2xl bg-bm-telegram text-white font-display font-bold text-base"
            >
              <TgIcon /> Démarrer sur Telegram
            </a>
            <Link
              href="/app"
              onClick={close}
              className="flex items-center justify-center py-4 rounded-2xl bg-bm-gradient text-black font-display font-bold text-base"
            >
              Ouvrir la carte →
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
