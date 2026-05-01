'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import AdminLayout from '@/components/admin/AdminLayout';
import { motion } from 'framer-motion';
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
        .order('created_at', { ascending: false });
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
        <h1 style={{ fontSize: 32, fontWeight: 900, marginBottom: 8 }}>Communauté</h1>
        <p style={{ fontSize: 16, color: 'var(--muted)', fontWeight: 600 }}>Gère les profils des Babis et les accès modérateur.</p>
      </div>

      <div style={{ 
        background: '#fff', padding: 12, borderRadius: 24, marginBottom: 32,
        display: 'flex', gap: 12, boxShadow: '0 4px 15px rgba(0,0,0,0.02)'
      }}>
        <input 
          placeholder="Rechercher un membre..." 
          style={{ flex: 1, background: 'var(--cream-2)', border: 'none', padding: '14px 20px', borderRadius: 16, outline: 'none', fontWeight: 600 }}
          value={search} onChange={e => setSearch(e.target.value)}
        />
      </div>

      <div style={{ 
        background: '#fff', borderRadius: 32, overflow: 'hidden',
        boxShadow: '0 10px 40px rgba(0,0,0,0.03)', border: '1px solid rgba(0,0,0,0.02)'
      }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
          <thead style={{ background: 'var(--cream-2)' }}>
            <tr>
              <th style={{ padding: '20px 24px', fontSize: 11, fontWeight: 900, color: 'var(--muted)', textTransform: 'uppercase' }}>Membre</th>
              <th style={{ padding: '20px 24px', fontSize: 11, fontWeight: 900, color: 'var(--muted)', textTransform: 'uppercase' }}>XP / Rang</th>
              <th style={{ padding: '20px 24px', fontSize: 11, fontWeight: 900, color: 'var(--muted)', textTransform: 'uppercase' }}>Status</th>
              <th style={{ padding: '20px 24px', fontSize: 11, fontWeight: 900, color: 'var(--muted)', textTransform: 'uppercase' }}>Admin</th>
            </tr>
          </thead>
          <tbody>
            {filteredUsers.map((user, i) => (
              <tr key={user.id} style={{ borderBottom: '1px solid var(--line)' }}>
                <td style={{ padding: '20px 24px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                    <div style={{ width: 44, height: 44, borderRadius: 14, background: 'var(--cream-2)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22 }}>
                      {user.avatar_emoji || '👤'}
                    </div>
                    <div>
                      <div style={{ fontWeight: 800, fontSize: 14 }}>{user.display_name || 'Anonyme'}</div>
                      <div style={{ fontSize: 11, color: 'var(--muted)', fontWeight: 600 }}>{user.id.slice(0, 8)}...</div>
                    </div>
                  </div>
                </td>
                <td style={{ padding: '20px 24px' }}>
                  <div style={{ fontWeight: 900, color: 'var(--orange)', fontSize: 14 }}>{user.xp || 0} XP</div>
                  <div style={{ fontSize: 10, fontWeight: 900, textTransform: 'uppercase', color: 'var(--muted)' }}>Explorateur</div>
                </td>
                <td style={{ padding: '20px 24px' }}>
                  <span style={{ 
                    padding: '6px 12px', borderRadius: 10, fontSize: 10, fontWeight: 900,
                    background: user.is_verified_explorer ? 'var(--blue-pale)' : 'var(--cream-2)',
                    color: user.is_verified_explorer ? 'var(--blue)' : 'var(--muted)'
                  }}>
                    {user.is_verified_explorer ? 'VÉRIFIÉ' : 'STANDARD'}
                  </span>
                </td>
                <td style={{ padding: '20px 24px' }}>
                  <button 
                    onClick={() => toggleAdmin(user.id, user.is_admin)}
                    style={{ 
                      width: 44, height: 24, borderRadius: 12, border: 'none', 
                      background: user.is_admin ? 'var(--orange)' : 'var(--line-strong)',
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
      </div>
    </AdminLayout>
  );
}
