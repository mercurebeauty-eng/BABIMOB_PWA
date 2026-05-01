'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { createClient } from '@/lib/supabase/client';

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
    { label: 'Utilisateurs', value: stats.users, icon: '👥', color: 'var(--blue)', trend: '+12%' },
    { label: 'Établissements', value: stats.places, icon: '🏢', color: 'var(--orange)', trend: '+5' },
    { label: 'Check-ins', value: stats.checkins, icon: '📍', color: 'var(--green)', trend: '+85' },
    { label: 'Avis (C\'comment)', value: stats.reviews, icon: '💬', color: 'var(--gold)', trend: '+24' },
  ];

  // Dummy Chart Data for visual impact
  const points = "0,80 20,60 40,75 60,40 80,45 100,20 120,35 140,10 160,25 180,5 200,15";

  return (
    <div style={{ color: 'var(--ink)' }}>
      
      <div style={{ marginBottom: 40 }}>
        <h1 style={{ fontSize: 32, fontWeight: 900, marginBottom: 8 }}>Akaba ! 👋</h1>
        <p style={{ fontSize: 16, color: 'var(--muted)', fontWeight: 600 }}>Voici l'état de ton empire aujourd'hui.</p>
      </div>

      {/* STATS GRID */}
      <div style={{ 
        display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', 
        gap: 24, marginBottom: 40 
      }}>
        {cards.map((card, i) => (
          <motion.div
            key={card.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
            style={{
              background: '#fff', padding: 28, borderRadius: 32,
              boxShadow: '0 10px 30px rgba(0,0,0,0.03)',
              border: '1px solid rgba(0,0,0,0.02)',
              position: 'relative', overflow: 'hidden'
            }}
          >
            <div style={{ 
              width: 48, height: 48, borderRadius: 16, background: `${card.color}10`,
              display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 24,
              marginBottom: 20
            }}>
              {card.icon}
            </div>
            <div style={{ fontSize: 36, fontWeight: 900, marginBottom: 4 }}>{card.value}</div>
            <div style={{ fontSize: 13, fontWeight: 800, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: 1 }}>{card.label}</div>
            
            <div style={{ 
              position: 'absolute', top: 28, right: 28, 
              fontSize: 11, fontWeight: 900, color: '#10b981',
              background: '#10b98115', padding: '4px 8px', borderRadius: 8
            }}>
              {card.trend}
            </div>
          </motion.div>
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 24 }}>
        
        {/* CHART BOX */}
        <div style={{ 
          background: 'var(--ink)', borderRadius: 32, padding: 32, color: '#fff',
          boxShadow: '0 20px 40px rgba(26,20,16,0.2)', position: 'relative'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 40 }}>
            <div>
              <h3 style={{ fontSize: 18, fontWeight: 900, margin: 0 }}>Croissance Communauté</h3>
              <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.5)', marginTop: 4 }}>Derniers 30 jours</p>
            </div>
            <div style={{ fontSize: 24, fontWeight: 900, color: 'var(--orange)' }}>+142%</div>
          </div>

          <div style={{ height: 200, width: '100%', position: 'relative' }}>
            <svg viewBox="0 0 200 100" style={{ width: '100%', height: '100%', overflow: 'visible' }}>
              <defs>
                <linearGradient id="grad" x1="0%" y1="0%" x2="0%" y2="100%">
                  <stop offset="0%" style={{ stopColor: 'var(--orange)', stopOpacity: 0.5 }} />
                  <stop offset="100%" style={{ stopColor: 'var(--orange)', stopOpacity: 0 }} />
                </linearGradient>
              </defs>
              <path 
                d={`M ${points} L 200,100 L 0,100 Z`} 
                fill="url(#grad)" 
              />
              <motion.path
                initial={{ pathLength: 0 }}
                animate={{ pathLength: 1 }}
                transition={{ duration: 2, ease: "easeInOut" }}
                d={`M ${points}`}
                fill="none"
                stroke="var(--orange)"
                strokeWidth="4"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 20, opacity: 0.4, fontSize: 10, fontWeight: 900 }}>
             <span>01 AVR</span>
             <span>10 AVR</span>
             <span>20 AVR</span>
             <span>30 AVR</span>
          </div>
        </div>

        {/* RECENT ACTIVITY */}
        <div style={{ 
          background: '#fff', borderRadius: 32, padding: 32,
          boxShadow: '0 10px 30px rgba(0,0,0,0.03)',
          border: '1px solid rgba(0,0,0,0.02)'
        }}>
          <h3 style={{ fontSize: 16, fontWeight: 900, marginBottom: 24 }}>Activité Récente</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            {[
              { type: 'user', text: 'Nouveau Babi inscrit : "Yoro"', time: '2 min' },
              { type: 'place', text: 'Nouveau lieu : "Maquis Le Dôme"', time: '15 min' },
              { type: 'review', text: 'Nouvel avis sur "Cap Sud"', time: '1h' },
              { type: 'checkin', text: 'Check-in groupé à Cocody', time: '2h' },
            ].map((act, i) => (
              <div key={i} style={{ display: 'flex', gap: 14, alignItems: 'center' }}>
                <div style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--orange)' }} />
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 13, fontWeight: 800 }}>{act.text}</div>
                  <div style={{ fontSize: 10, color: 'var(--muted)', fontWeight: 900, textTransform: 'uppercase', marginTop: 2 }}>{act.time}</div>
                </div>
              </div>
            ))}
          </div>
          <button style={{ 
            width: '100%', marginTop: 24, padding: '14px', borderRadius: 16,
            background: 'var(--cream-2)', border: 'none', color: 'var(--ink)',
            fontSize: 12, fontWeight: 900, cursor: 'pointer'
          }}>VOIR TOUT</button>
        </div>

      </div>

    </div>
  );
}
