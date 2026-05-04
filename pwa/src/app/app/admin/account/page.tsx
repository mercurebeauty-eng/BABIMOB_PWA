'use client';

export const dynamic = 'force-dynamic';

import { useState, useEffect, Suspense } from 'react';
import { createClient } from '@/lib/supabase/client';
import AdminLayout from '@/components/admin/AdminLayout';
import { motion } from 'framer-motion';
import { Ic } from '@/components/ui/Ic';

const inputStyle = {
  width: '100%',
  background: 'rgba(255,255,255,0.05)',
  border: 'none',
  padding: '20px',
  borderRadius: 20,
  color: '#fff',
  outline: 'none',
  fontWeight: 700,
  fontSize: 14,
  marginTop: 8
};

export default function AdminAccountPage() {
  const [user, setUser] = useState<any>(null);
  const [newPassword, setNewPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const supabase = createClient();

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setUser(data.user));
  }, []);

  async function updatePassword() {
    setLoading(true);
    const { error } = await supabase.auth.updateUser({ password: newPassword });
    if (error) alert(error.message);
    else {
      alert("Mot de passe mis à jour !");
      setNewPassword('');
    }
    setLoading(false);
  }

  return (
    <Suspense fallback={<div>Chargement sécurisé...</div>}>
      <AdminLayout>
        <div style={{ marginBottom: 40 }}>
          <h1 className="font-display" style={{ fontSize: 40, marginBottom: 8, letterSpacing: -1 }}>Mon Accès</h1>
          <p style={{ fontSize: 16, color: 'rgba(255,255,255,0.5)', fontWeight: 600 }}>Gère tes identifiants et la sécurité du cockpit.</p>
        </div>

        <div style={{ maxWidth: 500 }}>
          
          <div style={{ 
            background: 'rgba(255,255,255,0.02)', padding: 32, borderRadius: 32, 
            border: '1px solid rgba(255,255,255,0.05)', marginBottom: 24,
            backdropFilter: 'blur(20px)'
          }}>
            <h3 style={{ fontSize: 14, fontWeight: 900, marginBottom: 24, color: 'rgba(255,255,255,0.3)', textTransform: 'uppercase', letterSpacing: 1 }}>Profil Admin</h3>
            <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 32 }}>
               <div style={{ 
                 width: 64, height: 64, borderRadius: 20, 
                 background: 'var(--orange)', display: 'flex', alignItems: 'center', 
                 justifyContent: 'center', fontSize: 32, boxShadow: '0 10px 30px rgba(242,108,26,0.3)'
               }}>👑</div>
               <div>
                  <div style={{ fontSize: 18, fontWeight: 900 }}>{user?.email}</div>
                  <div style={{ fontSize: 11, fontWeight: 900, color: 'var(--orange)', textTransform: 'uppercase', marginTop: 4 }}>Administrateur Racine</div>
               </div>
            </div>
            
            <div style={{ marginBottom: 24 }}>
              <label style={{ fontSize: 10, fontWeight: 900, color: 'rgba(255,255,255,0.3)', textTransform: 'uppercase', marginBottom: 12, display: 'block' }}>Nouveau mot de passe</label>
              <input 
                type="password" 
                value={newPassword}
                onChange={e => setNewPassword(e.target.value)}
                placeholder="••••••••"
                style={inputStyle}
              />
            </div>

            <button 
              onClick={updatePassword}
              disabled={loading || !newPassword}
              className="press"
              style={{ 
                width: '100%', background: '#fff', color: '#000', border: 'none', 
                padding: '20px', borderRadius: 20, fontWeight: 900, cursor: 'pointer',
                opacity: loading || !newPassword ? 0.5 : 1,
                fontSize: 14, letterSpacing: 1
              }}
            >
              {loading ? 'MISE À JOUR...' : 'CHANGER LE MOT DE PASSE'}
            </button>
          </div>

          <div style={{ background: 'rgba(242,108,26,0.1)', padding: 24, borderRadius: 24, color: 'var(--orange)', border: '1px solid rgba(242,108,26,0.2)' }}>
             <div style={{ display: 'flex', gap: 14 }}>
                <Ic.Alert s={24} />
                <div style={{ fontSize: 13, fontWeight: 800, lineHeight: 1.5 }}>
                  Attention : Le changement de mot de passe est immédiat. Assure-toi de le noter en lieu sûr pour garder le contrôle de Babimob.
                </div>
             </div>
          </div>

        </div>
      </AdminLayout>
    </Suspense>
  );
}
