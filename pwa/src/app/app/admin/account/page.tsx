'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import AdminLayout from '@/components/admin/AdminLayout';
import { motion } from 'framer-motion';
import { Ic } from '@/components/ui/Ic';

export default function AdminAccountPage() {
  const supabase = createClient();
  const [user, setUser] = useState<any>(null);
  const [newPassword, setNewPassword] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    async function getUser() {
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);
    }
    getUser();
  }, [supabase]);

  async function updatePassword() {
    if (!newPassword) return;
    setLoading(true);
    const { error } = await supabase.auth.updateUser({ password: newPassword });
    if (error) alert(error.message);
    else { alert('Mot de passe mis à jour !'); setNewPassword(''); }
    setLoading(false);
  }

  return (
    <AdminLayout>
      <div style={{ marginBottom: 40 }}>
        <h1 style={{ fontSize: 32, fontWeight: 900, marginBottom: 8 }}>Mon Accès</h1>
        <p style={{ fontSize: 16, color: 'var(--muted)', fontWeight: 600 }}>Gère tes identifiants et la sécurité du cockpit.</p>
      </div>

      <div style={{ maxWidth: 500 }}>
        
        <div style={{ background: '#fff', padding: 32, borderRadius: 32, border: '1px solid var(--line)', marginBottom: 24 }}>
          <h3 style={{ fontSize: 16, fontWeight: 900, marginBottom: 24 }}>Profil Admin</h3>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 32 }}>
             <div style={{ width: 64, height: 64, borderRadius: 20, background: 'var(--orange-pale)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 32 }}>👑</div>
             <div>
                <div style={{ fontSize: 18, fontWeight: 900 }}>{user?.email}</div>
                <div style={{ fontSize: 12, fontWeight: 900, color: 'var(--orange)', textTransform: 'uppercase', marginTop: 4 }}>Administrateur Racine</div>
             </div>
          </div>
          
          <div style={{ marginBottom: 24 }}>
            <label style={{ fontSize: 11, fontWeight: 900, color: 'var(--muted)', textTransform: 'uppercase', marginBottom: 12, display: 'block' }}>Nouveau mot de passe</label>
            <input 
              type="password" 
              value={newPassword}
              onChange={e => setNewPassword(e.target.value)}
              placeholder="••••••••"
              style={{ width: '100%', background: 'var(--cream-2)', border: 'none', padding: '16px', borderRadius: 16, outline: 'none', fontWeight: 700 }}
            />
          </div>

          <button 
            onClick={updatePassword}
            disabled={loading || !newPassword}
            className="press"
            style={{ 
              width: '100%', background: 'var(--ink)', color: '#fff', border: 'none', 
              padding: '20px', borderRadius: 20, fontWeight: 900, cursor: 'pointer',
              opacity: loading || !newPassword ? 0.5 : 1
            }}
          >
            {loading ? 'Mise à jour...' : 'CHANGER LE MOT DE PASSE'}
          </button>
        </div>

        <div style={{ background: 'var(--orange-pale)', padding: 24, borderRadius: 24, color: 'var(--orange)' }}>
           <div style={{ display: 'flex', gap: 14 }}>
              <Ic.Alert s={24} />
              <div style={{ fontSize: 13, fontWeight: 800, lineHeight: 1.5 }}>
                Attention : Le changement de mot de passe est immédiat. Assure-toi de le noter en lieu sûr.
              </div>
           </div>
        </div>

      </div>
    </AdminLayout>
  );
}
