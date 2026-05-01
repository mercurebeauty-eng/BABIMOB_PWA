'use client';

import { useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { motion } from 'framer-motion';
import { Ic } from '@/components/ui/Ic';

export default function AdminGate() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const supabase = createClient();

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const { data, error: authError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (authError) {
      setError("Identifiants invalides ou accès refusé.");
      setLoading(false);
      return;
    }

    // Vérifier si c'est vraiment un admin
    const { data: profile } = await supabase
      .from('profiles')
      .select('is_admin')
      .eq('id', data.user.id)
      .single();

    if (!profile?.is_admin) {
      await supabase.auth.signOut();
      setError("Accès réservé aux administrateurs.");
      setLoading(false);
      return;
    }

    // Succès ! On recharge pour laisser passer le Layout
    window.location.reload();
  }

  return (
    <div style={{ 
      height: '100vh', width: '100vw', background: 'var(--ink)', 
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: 20
    }}>
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        style={{ 
          width: '100%', maxWidth: 400, background: 'rgba(255,255,255,0.03)',
          backdropFilter: 'blur(40px)', border: '1px solid rgba(255,255,255,0.1)',
          borderRadius: 40, padding: '48px 32px', textAlign: 'center',
          boxShadow: '0 30px 60px rgba(0,0,0,0.5)'
        }}
      >
        <div style={{ 
          width: 80, height: 80, borderRadius: 24, background: 'var(--orange)',
          margin: '0 auto 32px', display: 'flex', alignItems: 'center', 
          justifyContent: 'center', fontSize: 40, boxShadow: '0 20px 40px rgba(242,108,26,0.3)'
        }}>
          🔐
        </div>

        <h1 style={{ color: '#fff', fontSize: 24, fontWeight: 900, marginBottom: 8 }}>BABIMOB ADMIN</h1>
        <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: 14, fontWeight: 600, marginBottom: 40 }}>
          Identifie-toi pour accéder au cockpit.
        </p>

        <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div style={{ textAlign: 'left' }}>
            <label style={{ color: 'rgba(255,255,255,0.4)', fontSize: 10, fontWeight: 900, textTransform: 'uppercase', letterSpacing: 1.5, marginLeft: 16, marginBottom: 8, display: 'block' }}>Email Admin</label>
            <input 
              required type="email" value={email} onChange={e => setEmail(e.target.value)}
              placeholder="boss@babimob.com"
              style={{ width: '100%', background: 'rgba(255,255,255,0.05)', border: 'none', padding: '20px', borderRadius: 20, color: '#fff', outline: 'none', fontWeight: 700 }}
            />
          </div>

          <div style={{ textAlign: 'left' }}>
            <label style={{ color: 'rgba(255,255,255,0.4)', fontSize: 10, fontWeight: 900, textTransform: 'uppercase', letterSpacing: 1.5, marginLeft: 16, marginBottom: 8, display: 'block' }}>Mot de passe</label>
            <input 
              required type="password" value={password} onChange={e => setPassword(e.target.value)}
              placeholder="••••••••"
              style={{ width: '100%', background: 'rgba(255,255,255,0.05)', border: 'none', padding: '20px', borderRadius: 20, color: '#fff', outline: 'none', fontWeight: 700 }}
            />
          </div>

          {error && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} style={{ color: '#ff4444', fontSize: 12, fontWeight: 800, marginTop: 8 }}>
              {error}
            </motion.div>
          )}

          <button 
            disabled={loading}
            className="press"
            style={{ 
              marginTop: 24, background: 'var(--orange)', color: '#fff', border: 'none',
              padding: '22px', borderRadius: 24, fontSize: 16, fontWeight: 900,
              cursor: 'pointer', boxShadow: '0 15px 30px rgba(242,108,26,0.3)',
              textTransform: 'uppercase', letterSpacing: 1
            }}
          >
            {loading ? 'Vérification...' : 'Déverrouiller le Cockpit'}
          </button>
        </form>

        <div style={{ marginTop: 40, fontSize: 11, color: 'rgba(255,255,255,0.2)', fontWeight: 800 }}>
          SYSTÈME SÉCURISÉ PAR BABIMOB TECH
        </div>
      </motion.div>
    </div>
  );
}
