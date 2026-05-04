'use client';

import { useState, useEffect, Suspense } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { Ic } from '@/components/ui/Ic';
import { createClient } from '@/lib/supabase/client';
import AdminGate from './AdminGate';

type Props = {
  children: React.ReactNode;
};

const MENU_ITEMS = [
  { id: 'overview', label: 'Overview', icon: '📊', path: '/app/admin' },
  { id: 'places', label: 'Lieux & Marketing', icon: '🏢', path: '/app/admin/places' },
  { id: 'transport', label: 'Réseau Transport', icon: '🚌', path: '/app/admin/transport' },
  { id: 'users', label: 'Communauté', icon: '👥', path: '/app/admin/users' },
  { id: 'account', label: 'Sécurité', icon: '🔐', path: '/app/admin/account' },
];

export default function AdminLayout({ children }: Props) {
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null); // null = checking
  const supabase = createClient();

  useEffect(() => {
    async function checkAccess() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setIsAdmin(false);
        return;
      }

      const { data: profile } = await supabase
        .from('profiles')
        .select('is_admin')
        .eq('id', user.id)
        .single();
      
      setIsAdmin(!!profile?.is_admin);
    }
    checkAccess();
  }, [supabase]);

  // ÉCRAN DE CHARGEMENT
  if (isAdmin === null) return (
    <div style={{ height: '100vh', width: '100vw', background: 'var(--ink)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: 24 }}>
      <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1, ease: "linear" }} style={{ fontSize: 40 }}>🌀</motion.div>
      <div style={{ color: 'rgba(255,255,255,0.4)', fontSize: 11, fontWeight: 900, textTransform: 'uppercase', letterSpacing: 2 }}>Vérification des accès...</div>
    </div>
  );

  // SI PAS ADMIN -> ON MONTRE LA PORTE D'ENTRÉE
  if (!isAdmin) {
    return <AdminGate />;
  }

  // SI ADMIN -> ON MONTRE LE DASHBOARD
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <div style={{ display: 'flex', height: '100vh', background: '#0D0B0A', overflow: 'hidden', color: '#fff' }}>
      
      {/* SIDEBAR - DESKTOP */}
      <aside style={{ 
        width: 300, background: '#14110F', display: 'flex', flexDirection: 'column', 
        padding: '40px 24px', color: '#fff', position: 'relative', zIndex: 10,
        borderRight: '1px solid rgba(255,255,255,0.05)',
        boxShadow: '20px 0 50px rgba(0,0,0,0.2)'
      }} className="hide-mobile">
        <div style={{ marginBottom: 50, padding: '0 8px' }}>
          <div className="font-display" style={{ fontSize: 26, letterSpacing: -1, color: '#fff' }}>BABIMOB <span style={{ color: 'var(--orange)' }}>CORE</span></div>
          <div style={{ fontSize: 9, fontWeight: 900, color: 'rgba(255,255,255,0.3)', textTransform: 'uppercase', letterSpacing: 3, marginTop: 6 }}>OS v3.0 • PREMIUM ADMIN</div>
        </div>

        <nav style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 6 }}>
          {MENU_ITEMS.map(item => (
            <Link key={item.id} href={item.path} style={{ textDecoration: 'none' }}>
              <motion.div
                whileHover={{ x: 4, background: 'rgba(255,255,255,0.03)' }}
                whileTap={{ scale: 0.98 }}
                style={{
                  padding: '14px 18px', borderRadius: 14, display: 'flex', alignItems: 'center', gap: 14,
                  background: pathname === item.path ? 'rgba(242, 108, 26, 0.12)' : 'transparent',
                  color: pathname === item.path ? 'var(--orange)' : 'rgba(255,255,255,0.5)',
                  fontSize: 14, fontWeight: 800, transition: 'all 0.2s',
                  border: pathname === item.path ? '1px solid rgba(242, 108, 26, 0.2)' : '1px solid transparent'
                }}
              >
                <span style={{ fontSize: 20, filter: pathname === item.path ? 'none' : 'grayscale(1) opacity(0.5)' }}>{item.icon}</span>
                {item.label}
                {pathname === item.path && (
                  <motion.div layoutId="active_pill" style={{ marginLeft: 'auto', width: 4, height: 16, borderRadius: 2, background: 'var(--orange)', boxShadow: '0 0 10px var(--orange)' }} />
                )}
              </motion.div>
            </Link>
          ))}
        </nav>

        <div style={{ 
          marginTop: 'auto', padding: 24, background: 'rgba(255,255,255,0.02)', 
          borderRadius: 28, border: '1px solid rgba(255,255,255,0.05)',
          display: 'flex', flexDirection: 'column', gap: 16
        }}>
           <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <div style={{ width: 40, height: 40, borderRadius: 12, background: 'var(--orange)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18 }}>👑</div>
              <div>
                <div style={{ fontSize: 13, fontWeight: 900 }}>Administrateur</div>
                <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.4)', fontWeight: 800 }}>Session active</div>
              </div>
           </div>
           <div style={{ height: 1, background: 'rgba(255,255,255,0.05)' }} />
           <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <div className="shimmer" style={{ width: 8, height: 8, borderRadius: '50%', background: '#10b981', boxShadow: '0 0 10px #10b981' }} />
              <div style={{ fontSize: 11, fontWeight: 900, color: 'rgba(255,255,255,0.5)', textTransform: 'uppercase', letterSpacing: 1 }}>Système Optimal</div>
           </div>
        </div>
      </aside>

      {/* MOBILE HEADER */}
      <div style={{ 
        position: 'fixed', top: 0, left: 0, right: 0, height: 72, 
        background: 'rgba(13, 11, 10, 0.8)', backdropFilter: 'blur(20px)',
        zIndex: 50, display: 'flex', alignItems: 'center', padding: '0 20px',
        borderBottom: '1px solid rgba(255,255,255,0.05)'
      }} className="show-mobile">
        <button onClick={() => setIsOpen(true)} style={{ background: 'rgba(255,255,255,0.05)', border: 'none', padding: 10, borderRadius: 12, cursor: 'pointer' }}>
          <Ic.Menu s={22} color="#fff" />
        </button>
        <div className="font-display" style={{ flex: 1, textAlign: 'center', fontSize: 18, letterSpacing: -0.5 }}>ADMIN</div>
        <div style={{ width: 44 }} />
      </div>

      {/* MOBILE MENU OVERLAY */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            style={{ 
              position: 'fixed', inset: 0, zIndex: 100, background: '#0D0B0A',
              padding: '80px 32px'
            }}
          >
            <button onClick={() => setIsOpen(false)} style={{ position: 'absolute', top: 20, right: 20, background: 'rgba(255,255,255,0.05)', border: 'none', color: '#fff', padding: 12, borderRadius: '50%' }}>
              <Ic.X s={24} />
            </button>
            <div style={{ marginBottom: 60 }}>
              <div className="font-display" style={{ fontSize: 32, color: '#fff' }}>BABIMOB <span style={{ color: 'var(--orange)' }}>CORE</span></div>
            </div>
            <nav style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {MENU_ITEMS.map(item => (
                <Link key={item.id} href={item.path} onClick={() => setIsOpen(false)} style={{ textDecoration: 'none' }}>
                  <motion.div 
                    whileTap={{ scale: 0.95 }}
                    style={{ 
                      padding: '20px 24px', borderRadius: 20, background: 'rgba(255,255,255,0.03)',
                      fontSize: 20, fontWeight: 900, color: pathname === item.path ? 'var(--orange)' : '#fff', 
                      display: 'flex', alignItems: 'center', gap: 18,
                      border: pathname === item.path ? '1px solid var(--orange)' : '1px solid rgba(255,255,255,0.05)'
                    }}
                  >
                    <span style={{ fontSize: 24 }}>{item.icon}</span> {item.label}
                  </motion.div>
                </Link>
              ))}
            </nav>
          </motion.div>
        )}
      </AnimatePresence>

      {/* MAIN CONTENT AREA */}
      <main style={{ 
        flex: 1, height: '100vh', overflowY: 'auto', 
        padding: '50px 60px 100px', 
        position: 'relative',
        background: 'radial-gradient(circle at top right, rgba(242,108,26,0.05), transparent 400px)'
      }} className="admin-content">
        <div style={{ maxWidth: 1300, margin: '0 auto' }}>
          {children}
        </div>
      </main>

      <style jsx global>{`
        @media (max-width: 768px) {
          .hide-mobile { display: none !important; }
          .admin-content { padding: 110px 20px 120px !important; }
        }
        @media (min-width: 769px) {
          .show-mobile { display: none !important; }
        }
        .no-scrollbar::-webkit-scrollbar { display: none; }
        ::selection { background: var(--orange); color: #fff; }
      `}</style>
      </div>
    </Suspense>
  );
}
