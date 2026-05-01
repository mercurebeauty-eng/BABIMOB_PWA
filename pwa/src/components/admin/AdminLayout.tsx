'use client';

import { useState, useEffect } from 'react';
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
  { id: 'overview', label: 'Dashboard', icon: '📊', path: '/app/admin' },
  { id: 'places', label: 'Lieux', icon: '🏢', path: '/app/admin/places' },
  { id: 'users', label: 'Communauté', icon: '👥', path: '/app/admin/users' },
  { id: 'transport', label: 'Transport', icon: '🚌', path: '/app/admin/transport' },
  { id: 'account', label: 'Mon Accès', icon: '🔐', path: '/app/admin/account' },
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
    <div style={{ display: 'flex', height: '100vh', background: 'var(--cream)', overflow: 'hidden' }}>
      
      {/* SIDEBAR - DESKTOP */}
      <aside style={{ 
        width: 280, background: 'var(--ink)', display: 'flex', flexDirection: 'column', 
        padding: '40px 20px', color: '#fff', position: 'relative', zIndex: 10,
        boxShadow: '10px 0 30px rgba(0,0,0,0.1)'
      }} className="hide-mobile">
        <div style={{ marginBottom: 60, padding: '0 10px' }}>
          <div style={{ fontSize: 24, fontWeight: 900, letterSpacing: -1 }}>BABIMOB <span style={{ color: 'var(--orange)' }}>ADMIN</span></div>
          <div style={{ fontSize: 10, fontWeight: 900, color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: 2, marginTop: 4 }}>Control Center v2.0</div>
        </div>

        <nav style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 8 }}>
          {MENU_ITEMS.map(item => (
            <Link key={item.id} href={item.path} style={{ textDecoration: 'none' }}>
              <motion.div
                whileHover={{ x: 5 }}
                whileTap={{ scale: 0.98 }}
                style={{
                  padding: '16px 20px', borderRadius: 16, display: 'flex', alignItems: 'center', gap: 14,
                  background: pathname === item.path ? 'rgba(255,255,255,0.1)' : 'transparent',
                  color: pathname === item.path ? 'var(--orange)' : 'rgba(255,255,255,0.6)',
                  fontSize: 14, fontWeight: 800, transition: 'all 0.2s'
                }}
              >
                <span style={{ fontSize: 20, filter: pathname === item.path ? 'none' : 'grayscale(1)' }}>{item.icon}</span>
                {item.label}
                {pathname === item.path && <motion.div layoutId="active" style={{ marginLeft: 'auto', width: 6, height: 6, borderRadius: '50%', background: 'var(--orange)' }} />}
              </motion.div>
            </Link>
          ))}
        </nav>

        <div style={{ 
          marginTop: 'auto', padding: 20, background: 'rgba(255,255,255,0.05)', 
          borderRadius: 24, border: '1px solid rgba(255,255,255,0.1)' 
        }}>
           <div style={{ fontSize: 11, fontWeight: 900, color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', marginBottom: 12 }}>Serveur Status</div>
           <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#10b981', boxShadow: '0 0 10px #10b981' }} />
              <div style={{ fontSize: 12, fontWeight: 800 }}>Opérationnel</div>
           </div>
        </div>
      </aside>

      {/* MOBILE HEADER */}
      <div style={{ 
        position: 'fixed', top: 0, left: 0, right: 0, height: 70, 
        background: 'rgba(255,255,255,0.8)', backdropFilter: 'blur(20px)',
        zIndex: 50, display: 'flex', alignItems: 'center', padding: '0 20px',
        borderBottom: '1px solid var(--line)'
      }} className="show-mobile">
        <button onClick={() => setIsOpen(true)} style={{ background: 'none', border: 'none', padding: 10, cursor: 'pointer' }}>
          <Ic.Menu s={24} color="var(--ink)" />
        </button>
        <div style={{ flex: 1, textAlign: 'center', fontSize: 16, fontWeight: 900 }}>ADMIN</div>
        <div style={{ width: 44 }} />
      </div>

      {/* MOBILE MENU OVERLAY */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ x: '-100%' }}
            animate={{ x: 0 }}
            exit={{ x: '-100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            style={{ 
              position: 'fixed', inset: 0, zIndex: 100, background: 'var(--ink)',
              padding: '60px 30px'
            }}
          >
            <button onClick={() => setIsOpen(false)} style={{ position: 'absolute', top: 20, right: 20, background: 'none', border: 'none', color: '#fff' }}>
              <Ic.X s={32} />
            </button>
            <div style={{ marginBottom: 60 }}>
              <div style={{ fontSize: 28, fontWeight: 900, color: '#fff' }}>BABIMOB <span style={{ color: 'var(--orange)' }}>ADMIN</span></div>
            </div>
            <nav style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
              {MENU_ITEMS.map(item => (
                <Link key={item.id} href={item.path} onClick={() => setIsOpen(false)} style={{ textDecoration: 'none' }}>
                  <div style={{ fontSize: 22, fontWeight: 900, color: pathname === item.path ? 'var(--orange)' : '#fff', display: 'flex', alignItems: 'center', gap: 16 }}>
                    <span>{item.icon}</span> {item.label}
                  </div>
                </Link>
              ))}
            </nav>
          </motion.div>
        )}
      </AnimatePresence>

      {/* MAIN CONTENT AREA */}
      <main style={{ 
        flex: 1, height: '100vh', overflowY: 'auto', 
        padding: '40px 40px 100px', 
        position: 'relative'
      }} className="admin-content">
        <div style={{ maxWidth: 1200, margin: '0 auto' }}>
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
      `}</style>
    </div>
  );
}
