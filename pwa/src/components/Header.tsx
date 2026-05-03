import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';

export default async function Header() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  return (
    <header
      className="sticky top-0 z-[500]"
      style={{
        background: 'var(--cream)',
        borderBottom: '1px solid var(--line)',
        boxShadow: '0 2px 14px rgba(26,20,16,0.04)',
      }}
    >
      <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between gap-3">
        <Link href="/app" className="flex items-center gap-2.5 group">
          <div
            style={{
              width: 32, height: 32, borderRadius: 10,
              background: 'linear-gradient(135deg, var(--orange) 0%, var(--orange-deep) 100%)',
              boxShadow: '0 4px 14px rgba(242,108,26,0.35), inset 0 0 0 1px rgba(255,255,255,0.2)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              position: 'relative', overflow: 'hidden',
            }}
          >
            <div
              className="wax-bg"
              aria-hidden
              style={{ position: 'absolute', inset: 0, color: '#fff', opacity: 0.18 }}
            />
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" style={{ position: 'relative' }}>
              <path d="M12 22s7-7.5 7-13a7 7 0 10-14 0c0 5.5 7 13 7 13z" stroke="#fff" strokeWidth="2.5" fill="none" strokeLinejoin="round" />
              <circle cx="12" cy="9" r="2" fill="#fff" />
            </svg>
          </div>
          <span
            className="font-display"
            style={{ fontSize: 18, color: 'var(--ink)', letterSpacing: '-0.02em' }}
          >
            BABIMOB
          </span>
        </Link>

        <nav className="flex items-center gap-1.5 sm:gap-2 text-sm">
          <Link
            href="/"
            className="hidden sm:inline-flex items-center px-3 py-1.5 rounded-full transition-colors"
            style={{ color: 'var(--ink-2)', fontWeight: 700, fontSize: 13 }}
          >
            Accueil
          </Link>
          <Link
            href="/app/itineraire"
            className="inline-flex items-center px-3 py-1.5 rounded-full transition-colors"
            style={{ color: 'var(--ink-2)', fontWeight: 700, fontSize: 13 }}
          >
            Itinéraire
          </Link>
          {user ? (
            <Link
              href="/app/compte"
              className="press inline-flex items-center px-3.5 py-1.5 rounded-full"
              style={{
                background: 'var(--cream-2)',
                border: '1px solid var(--line)',
                color: 'var(--ink)',
                fontWeight: 800, fontSize: 12,
                letterSpacing: 0.3,
              }}
            >
              Mon compte
            </Link>
          ) : (
            <Link
              href="/app/auth/signin"
              className="press inline-flex items-center px-3.5 py-1.5 rounded-full"
              style={{
                background: 'var(--orange)',
                color: '#fff',
                fontWeight: 800, fontSize: 12,
                letterSpacing: 0.3,
                boxShadow: '0 2px 10px rgba(242,108,26,0.35)',
              }}
            >
              Se connecter
            </Link>
          )}
        </nav>
      </div>
    </header>
  );
}
