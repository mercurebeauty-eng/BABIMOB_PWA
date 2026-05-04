'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { createClient } from '@/lib/supabase/client';
import { Ic } from '@/components/ui/Ic';

export default function AdminOverview() {
  const supabase = createClient();
  const [stats, setStats] = useState({
    users: 0,
    places: 0,
    checkins: 0,
    reviews: 0
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadStats() {
      const [
        { count: userCount },
        { count: placeCount },
        { count: checkinCount },
        { count: reviewCount }
      ] = await Promise.all([
        supabase.from('profiles').select('*', { count: 'exact', head: true }),
        supabase.from('places').select('*', { count: 'exact', head: true }),
        supabase.from('checkins').select('*', { count: 'exact', head: true }),
        supabase.from('place_advice').select('*', { count: 'exact', head: true })
      ]);

      setStats({
        users: userCount || 0,
        places: placeCount || 0,
        checkins: checkinCount || 0,
        reviews: reviewCount || 0
      });
      setLoading(false);
    }
    loadStats();
  }, [supabase]);

  const cards = [
    { label: 'Utilisateurs', value: stats.users, icon: '👥', color: 'var(--blue)', trend: '+12%', sub: 'Explorateurs actifs' },
    { label: 'Lieux', value: stats.places, icon: '🏢', color: 'var(--orange)', trend: '+5', sub: 'Établissements' },
    { label: 'Activités', value: stats.checkins, icon: '📍', color: 'var(--green)', trend: '+85', sub: 'Check-ins récents' },
    { label: 'Interactions', value: stats.reviews, icon: '💬', color: 'var(--gold)', trend: '+24', sub: 'Avis & Questions' },
  ];

  return (
    <div style={{ color: '#fff' }}>
      
      <div style={{ marginBottom: 50 }}>
        <h1 className="font-display" style={{ fontSize: 48, marginBottom: 12, letterSpacing: -1.5 }}>
          Dashboard <span style={{ color: 'var(--orange)' }}>Master</span>
        </h1>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#10b981', boxShadow: '0 0 10px #10b981' }} />
          <p style={{ fontSize: 15, color: 'rgba(255,255,255,0.4)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: 1.5 }}>Intelligence Center en temps réel</p>
        </div>
      </div>

      {/* STATS GRID */}
      <div style={{ 
        display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', 
        gap: 24, marginBottom: 50 
      }}>
        {cards.map((card, i) => (
          <motion.div
            key={card.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
            style={{
              background: 'linear-gradient(145deg, rgba(255,255,255,0.05), rgba(255,255,255,0.02))',
              padding: '32px', borderRadius: 32,
              border: '1px solid rgba(255,255,255,0.05)',
              position: 'relative', overflow: 'hidden'
            }}
          >
            <div style={{ 
              width: 52, height: 52, borderRadius: 16, background: `${card.color}20`,
              display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 24,
              marginBottom: 24, boxShadow: `0 8px 20px ${card.color}15`
            }}>
              {card.icon}
            </div>
            <div style={{ fontSize: 42, fontWeight: 900, marginBottom: 6, letterSpacing: -1 }}>{card.value}</div>
            <div style={{ fontSize: 12, fontWeight: 900, color: 'rgba(255,255,255,0.3)', textTransform: 'uppercase', letterSpacing: 1.5 }}>{card.label}</div>
            <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.5)', marginTop: 8 }}>{card.sub}</div>
            
            <div style={{ 
              position: 'absolute', top: 32, right: 32, 
              fontSize: 11, fontWeight: 900, color: '#10b981',
              background: 'rgba(16, 185, 129, 0.1)', padding: '6px 12px', borderRadius: 10
            }}>
              {card.trend}
            </div>
          </motion.div>
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1.6fr 1fr', gap: 32 }}>
        
        {/* NETWORK STATUS */}
        <div style={panelStyle}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 40 }}>
            <div>
              <h3 style={{ fontSize: 20, fontWeight: 900, margin: 0 }}>Statut du Réseau</h3>
              <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)', marginTop: 6 }}>Disponibilité des services de transport</p>
            </div>
            <button className="press" style={{ background: 'rgba(255,255,255,0.05)', border: 'none', color: '#fff', padding: '10px 20px', borderRadius: 12, fontSize: 11, fontWeight: 900 }}>DÉTAILS</button>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
            {[
              { label: 'GTFS SOTRA API', status: 'Optimal', load: '12ms' },
              { label: 'Mapbox Navigation', status: 'Optimal', load: '45ms' },
              { label: 'Supabase Realtime', status: 'Stable', load: '8ms' },
            ].map(item => (
              <div key={item.label} style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
                <div className="shimmer" style={{ width: 10, height: 10, borderRadius: '50%', background: '#10b981' }} />
                <div style={{ flex: 1, fontWeight: 800, fontSize: 15 }}>{item.label}</div>
                <div style={{ fontSize: 12, fontWeight: 900, color: 'rgba(255,255,255,0.3)' }}>{item.load}</div>
                <div style={{ fontSize: 11, fontWeight: 900, color: '#10b981', background: 'rgba(16, 185, 129, 0.1)', padding: '4px 10px', borderRadius: 8 }}>{item.status}</div>
              </div>
            ))}
          </div>
        </div>

        {/* RECENT FEED */}
        <div style={{ ...panelStyle, background: 'rgba(255,255,255,0.02)' }}>
          <h3 style={{ fontSize: 18, fontWeight: 900, marginBottom: 32 }}>Activités Live</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
            {[
              { text: 'Nouveau Babi : @Yoro_82', time: 'Il y a 2m' },
              { text: 'Check-in : Maquis Le Dôme', time: 'Il y a 15m' },
              { text: 'Alerte Trafic : Pont HKB', time: 'Il y a 24m' },
              { text: 'Promotion : -20% Cap Sud', time: 'Il y a 1h' },
            ].map((act, i) => (
              <div key={i} style={{ display: 'flex', gap: 16, alignItems: 'flex-start' }}>
                <div style={{ width: 4, height: 24, borderRadius: 2, background: 'var(--orange)' }} />
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 14, fontWeight: 800 }}>{act.text}</div>
                  <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.3)', fontWeight: 900, textTransform: 'uppercase', marginTop: 4 }}>{act.time}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

      </div>

    </div>
  );
}

const panelStyle = {
  background: 'rgba(255,255,255,0.03)',
  borderRadius: 40,
  padding: 40,
  border: '1px solid rgba(255,255,255,0.05)',
  backdropFilter: 'blur(20px)'
};
