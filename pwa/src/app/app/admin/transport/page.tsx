'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import AdminLayout from '@/components/admin/AdminLayout';
import { motion } from 'framer-motion';
import { Ic } from '@/components/ui/Ic';

export default function AdminTransportPage() {
  const supabase = createClient();
  const [stops, setStops] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    async function fetchStops() {
      // On prend les 50 derniers arrêts pour l'admin
      const { data } = await supabase
        .from('stops')
        .select('*')
        .order('id', { ascending: false })
        .limit(50);
      setStops(data || []);
      setLoading(false);
    }
    fetchStops();
  }, [supabase]);

  return (
    <AdminLayout>
      <div style={{ marginBottom: 40, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
        <div>
          <h1 style={{ fontSize: 32, fontWeight: 900, marginBottom: 8 }}>Transport</h1>
          <p style={{ fontSize: 16, color: 'var(--muted)', fontWeight: 600 }}>Pilote le réseau de transport (GTFS & Custom).</p>
        </div>
        <button 
          className="press"
          style={{ 
            background: 'var(--blue)', color: '#fff', border: 'none',
            padding: '16px 24px', borderRadius: 20, fontSize: 14, fontWeight: 900,
            cursor: 'pointer', boxShadow: '0 12px 30px rgba(43,89,255,0.2)'
          }}
        >
          + AJOUTER UN ARRÊT
        </button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24, marginBottom: 40 }}>
        
        {/* QUICK ACTION CARD */}
        <div style={{ 
          background: 'linear-gradient(135deg, var(--blue), #5077FF)', borderRadius: 32, padding: 32, color: '#fff',
          boxShadow: '0 20px 40px rgba(43,89,255,0.2)'
        }}>
          <h3 style={{ fontSize: 18, fontWeight: 900, marginBottom: 12 }}>Lier une ligne</h3>
          <p style={{ fontSize: 13, opacity: 0.8, marginBottom: 24, lineHeight: 1.5 }}>L'arrêt n'est pas sur la ligne ? Ajoute-le manuellement pour que les Babis puissent le voir sur la carte.</p>
          <div style={{ display: 'flex', gap: 12 }}>
            <input placeholder="Code Arrêt" style={{ flex: 1, background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.2)', padding: 14, borderRadius: 16, color: '#fff', outline: 'none' }} />
            <input placeholder="Ligne (ex: 82)" style={{ width: 100, background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.2)', padding: 14, borderRadius: 16, color: '#fff', outline: 'none' }} />
            <button style={{ background: '#fff', color: 'var(--blue)', border: 'none', padding: '0 20px', borderRadius: 16, fontWeight: 900, cursor: 'pointer' }}>OK</button>
          </div>
        </div>

        <div style={{ background: '#fff', borderRadius: 32, padding: 32, border: '1px solid var(--line)' }}>
          <h3 style={{ fontSize: 18, fontWeight: 900, marginBottom: 12 }}>Intégrité GTFS</h3>
          <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
             <div style={{ fontSize: 32 }}>✅</div>
             <div>
                <div style={{ fontSize: 14, fontWeight: 800 }}>Dernière synchro : ce matin</div>
                <div style={{ fontSize: 11, fontWeight: 900, color: 'var(--muted)', marginTop: 4 }}>4,250 arrêts indexés</div>
             </div>
          </div>
        </div>

      </div>

      <div style={{ background: '#fff', borderRadius: 32, padding: 32, boxShadow: '0 4px 20px rgba(0,0,0,0.02)' }}>
         <h3 style={{ fontSize: 16, fontWeight: 900, marginBottom: 24 }}>Derniers arrêts modifiés</h3>
         <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {stops.map(stop => (
               <div key={stop.id} style={{ display: 'flex', alignItems: 'center', gap: 16, padding: '16px', borderRadius: 20, background: 'var(--cream-2)' }}>
                  <div style={{ width: 40, height: 40, borderRadius: 12, background: 'var(--ink)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18 }}>🚏</div>
                  <div style={{ flex: 1 }}>
                     <div style={{ fontSize: 14, fontWeight: 800 }}>{stop.stop_name}</div>
                     <div style={{ fontSize: 10, fontWeight: 900, color: 'var(--muted)', textTransform: 'uppercase', marginTop: 4 }}>{stop.stop_id} • {stop.commune || 'Inconnue'}</div>
                  </div>
                  <div style={{ fontSize: 12, fontWeight: 900, color: 'var(--blue)' }}>VOIR</div>
               </div>
            ))}
         </div>
      </div>
    </AdminLayout>
  );
}
