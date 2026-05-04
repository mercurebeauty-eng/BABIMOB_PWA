'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import AdminLayout from '@/components/admin/AdminLayout';
import { motion, AnimatePresence } from 'framer-motion';
import { Ic } from '@/components/ui/Ic';

export default function AdminUsersPage() {
  const supabase = createClient();
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    async function fetchUsers() {
      const { data } = await supabase
        .from('profiles')
        .select('*')
        .order('updated_at', { ascending: false });
      setUsers(data || []);
      setLoading(false);
    }
    fetchUsers();
  }, [supabase]);

  const filteredUsers = users.filter(u => 
    u.display_name?.toLowerCase().includes(search.toLowerCase())
  );

  async function toggleAdmin(userId: string, currentStatus: boolean) {
    const { error } = await supabase
      .from('profiles')
      .update({ is_admin: !currentStatus })
      .eq('id', userId);
    
    if (error) alert(error.message);
    else setUsers(users.map(u => u.id === userId ? { ...u, is_admin: !currentStatus } : u));
  }

  return (
    <AdminLayout>
      <div style={{ marginBottom: 40 }}>
        <h1 className="font-display" style={{ fontSize: 40, marginBottom: 8, letterSpacing: -1 }}>Communauté</h1>
        <p style={{ fontSize: 16, color: 'rgba(255,255,255,0.5)', fontWeight: 600 }}>Gère les profils des Babis et les accès administrateur.</p>
      </div>

      <div style={{ 
        background: 'rgba(255,255,255,0.02)', padding: 14, borderRadius: 24, marginBottom: 32,
        display: 'flex', gap: 12, border: '1px solid rgba(255,255,255,0.05)'
      }}>
        <div style={{ position: 'relative', flex: 1 }}>
          <div style={{ position: 'absolute', left: 16, top: '50%', transform: 'translateY(-50%)', opacity: 0.3 }}><Ic.Search s={18} /></div>
          <input 
            placeholder="Rechercher un membre par nom..." 
            style={{ ...inputStyle, paddingLeft: 44, background: 'transparent' }}
            value={search} onChange={e => setSearch(e.target.value)}
          />
        </div>
      </div>

      <div style={{ 
        background: 'rgba(255,255,255,0.01)', borderRadius: 32, overflow: 'hidden',
        border: '1px solid rgba(255,255,255,0.05)', backdropFilter: 'blur(10px)'
      }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
          <thead>
            <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
              <th style={{ padding: '24px', fontSize: 10, fontWeight: 900, color: 'rgba(255,255,255,0.3)', textTransform: 'uppercase', letterSpacing: 1 }}>Membre</th>
              <th style={{ padding: '24px', fontSize: 10, fontWeight: 900, color: 'rgba(255,255,255,0.3)', textTransform: 'uppercase', letterSpacing: 1 }}>Score & Rang</th>
              <th style={{ padding: '24px', fontSize: 10, fontWeight: 900, color: 'rgba(255,255,255,0.3)', textTransform: 'uppercase', letterSpacing: 1 }}>Status PWA</th>
              <th style={{ padding: '24px', fontSize: 10, fontWeight: 900, color: 'rgba(255,255,255,0.3)', textTransform: 'uppercase', letterSpacing: 1 }}>Accès Admin</th>
            </tr>
          </thead>
          <tbody>
            {filteredUsers.map((user, i) => (
              <tr key={user.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.02)' }}>
                <td style={{ padding: '20px 24px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                    <div style={{ 
                      width: 44, height: 44, borderRadius: 14, 
                      background: 'rgba(255,255,255,0.03)', 
                      display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22,
                      border: '1px solid rgba(255,255,255,0.05)'
                    }}>
                      {user.avatar_emoji || '👤'}
                    </div>
                    <div>
                      <div style={{ fontWeight: 800, fontSize: 14 }}>{user.display_name || 'Anonyme'}</div>
                      <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.3)', fontWeight: 800 }}>ID: {user.id.slice(0, 8)}</div>
                    </div>
                  </div>
                </td>
                <td style={{ padding: '20px 24px' }}>
                  <div style={{ fontWeight: 900, color: 'var(--orange)', fontSize: 14 }}>{user.xp || 0} XP</div>
                  <div style={{ fontSize: 9, fontWeight: 900, textTransform: 'uppercase', color: 'rgba(255,255,255,0.3)', marginTop: 2 }}>{user.xp > 1000 ? 'ÉLITE' : 'EXPLORATEUR'}</div>
                </td>
                <td style={{ padding: '20px 24px' }}>
                  <span style={{ 
                    padding: '6px 12px', borderRadius: 10, fontSize: 10, fontWeight: 900,
                    background: user.is_verified_explorer ? 'rgba(0,122,255,0.1)' : 'rgba(255,255,255,0.03)',
                    color: user.is_verified_explorer ? 'var(--blue)' : 'rgba(255,255,255,0.3)',
                    border: '1px solid rgba(255,255,255,0.05)'
                  }}>
                    {user.is_verified_explorer ? 'VÉRIFIÉ ✅' : 'MEMBRE'}
                  </span>
                </td>
                <td style={{ padding: '20px 24px' }}>
                  <button 
                    onClick={() => toggleAdmin(user.id, user.is_admin)}
                    className="press"
                    style={{ 
                      width: 44, height: 24, borderRadius: 12, border: 'none', 
                      background: user.is_admin ? 'var(--orange)' : 'rgba(255,255,255,0.1)',
                      position: 'relative', cursor: 'pointer', transition: 'all 0.3s'
                    }}
                  >
                    <motion.div 
                      animate={{ x: user.is_admin ? 22 : 2 }}
                      style={{ width: 20, height: 20, borderRadius: '50%', background: '#fff', position: 'absolute', top: 2 }} 
                    />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {loading && <div style={{ textAlign: 'center', padding: 100, opacity: 0.3 }}>Synchronisation communautaire...</div>}
      </div>
    </AdminLayout>
  );
}

const inputStyle = {
  width: '100%',
  background: 'rgba(255,255,255,0.05)',
  border: '1px solid rgba(255,255,255,0.05)',
  padding: '16px',
  borderRadius: 16,
  outline: 'none',
  fontWeight: 700,
  color: '#fff',
  fontSize: 14,
  transition: 'all 0.2s'
};
