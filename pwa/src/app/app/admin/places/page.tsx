'use client';

import { useState, useEffect, useMemo } from 'react';
import { createClient } from '@/lib/supabase/client';
import AdminLayout from '@/components/admin/AdminLayout';
import { motion } from 'framer-motion';
import { Ic } from '@/components/ui/Ic';

export default function AdminPlacesPage() {
  const supabase = createClient();
  const [places, setPlaces] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  // Filter state
  const [search, setSearch] = useState('');
  const [filterCategory, setFilterCategory] = useState<string>('all');

  // Form state
  const [formData, setFormData] = useState({
    name: '', category: 'shop', logo_emoji: '🏪', lat: 5.345, lon: -4.020,
    commune: '', description: '', phone: '', whatsapp: '', sponsor_tier: 'standard', is_sponsored: false
  });

  const fetchData = async () => {
    const { data } = await supabase.from('places').select('*').order('created_at', { ascending: false });
    setPlaces(data || []);
    setLoading(false);
  };

  useEffect(() => { fetchData(); }, [supabase]);

  const filteredPlaces = useMemo(() => {
    return places.filter(p => {
      const matchesSearch = p.name.toLowerCase().includes(search.toLowerCase()) || 
                           (p.commune && p.commune.toLowerCase().includes(search.toLowerCase()));
      const matchesCat = filterCategory === 'all' || p.category === filterCategory;
      return matchesSearch && matchesCat;
    });
  }, [places, search, filterCategory]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const payload = { ...formData, sponsor_tier: formData.sponsor_tier === 'standard' ? null : formData.sponsor_tier };
    let error;
    if (editingId) {
      const { error: err } = await supabase.from('places').update(payload).eq('id', editingId);
      error = err;
    } else {
      const { error: err } = await supabase.from('places').insert(payload);
      error = err;
    }
    if (error) alert(error.message);
    else { setShowAdd(false); setEditingId(null); fetchData(); resetForm(); }
  }

  const resetForm = () => {
    setFormData({
      name: '', category: 'shop', logo_emoji: '🏪', lat: 5.345, lon: -4.020,
      commune: '', description: '', phone: '', whatsapp: '', sponsor_tier: 'standard', is_sponsored: false
    });
  };

  const startEdit = (place: any) => {
    setEditingId(place.id);
    setFormData({
      name: place.name, category: place.category, logo_emoji: place.logo_emoji,
      lat: place.lat, lon: place.lon, commune: place.commune || '',
      description: place.description || '', phone: place.phone || '',
      whatsapp: place.whatsapp || '', sponsor_tier: place.sponsor_tier || 'standard',
      is_sponsored: !!place.sponsor_tier
    });
    setShowAdd(true);
  };

  return (
    <AdminLayout>
      <div style={{ marginBottom: 40, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
        <div>
          <h1 style={{ fontSize: 32, fontWeight: 900, marginBottom: 8 }}>Établissements</h1>
          <p style={{ fontSize: 16, color: 'var(--muted)', fontWeight: 600 }}>Gère les lieux et les partenaires de BABIMOB.</p>
        </div>
        <button 
          onClick={() => { setShowAdd(!showAdd); if (showAdd) { setEditingId(null); resetForm(); } }}
          className="press"
          style={{ 
            background: 'var(--orange)', color: '#fff', border: 'none',
            padding: '16px 24px', borderRadius: 20, fontSize: 14, fontWeight: 900,
            cursor: 'pointer', boxShadow: '0 12px 30px rgba(242,108,26,0.2)',
            textTransform: 'uppercase', letterSpacing: 1
          }}
        >
          {showAdd ? 'Fermer' : '+ Ajouter un lieu'}
        </button>
      </div>

      {showAdd && (
        <motion.form 
          initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}
          onSubmit={handleSubmit} 
          style={{ 
            background: '#fff', padding: 32, borderRadius: 32, marginBottom: 40,
            boxShadow: '0 20px 50px rgba(0,0,0,0.05)', border: '2px solid var(--orange-pale)'
          }}
        >
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24, marginBottom: 24 }}>
            <div>
              <label style={{ fontSize: 11, fontWeight: 900, color: 'var(--muted)', textTransform: 'uppercase', marginBottom: 8, display: 'block' }}>Nom</label>
              <input required style={{ width: '100%', background: 'var(--cream-2)', border: 'none', padding: '16px', borderRadius: 16, outline: 'none', fontWeight: 700 }} 
                value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} />
            </div>
            <div>
              <label style={{ fontSize: 11, fontWeight: 900, color: 'var(--muted)', textTransform: 'uppercase', marginBottom: 8, display: 'block' }}>Emoji Logo</label>
              <input style={{ width: '100%', background: 'var(--cream-2)', border: 'none', padding: '16px', borderRadius: 16, outline: 'none', fontWeight: 700, textAlign: 'center', fontSize: 24 }} 
                value={formData.logo_emoji} onChange={e => setFormData({...formData, logo_emoji: e.target.value})} />
            </div>
          </div>
          {/* Reste du formulaire simplifié... */}
          <button type="submit" style={{ width: '100%', background: 'var(--ink)', color: '#fff', border: 'none', padding: '20px', borderRadius: 20, fontWeight: 900, cursor: 'pointer' }}>
            {editingId ? 'METTRE À JOUR' : 'ENREGISTRER LE LIEU'}
          </button>
        </motion.form>
      )}

      {/* FILTERS */}
      <div style={{ 
        background: '#fff', padding: 12, borderRadius: 24, marginBottom: 24,
        display: 'flex', gap: 12, boxShadow: '0 4px 15px rgba(0,0,0,0.02)'
      }}>
        <input 
          placeholder="Rechercher..." 
          style={{ flex: 1, background: 'var(--cream-2)', border: 'none', padding: '12px 20px', borderRadius: 16, outline: 'none', fontWeight: 600 }}
          value={search} onChange={e => setSearch(e.target.value)}
        />
        <select 
          style={{ background: 'var(--cream-2)', border: 'none', padding: '0 20px', borderRadius: 16, outline: 'none', fontWeight: 800, fontSize: 12 }}
          value={filterCategory} onChange={e => setFilterCategory(e.target.value)}
        >
          <option value="all">Toutes catégories</option>
          <option value="food">🍽️ Food</option>
          <option value="shop">🛍️ Shop</option>
          <option value="market">🏪 Marché</option>
        </select>
      </div>

      {/* LIST */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 20 }}>
        {filteredPlaces.map(p => (
          <motion.div 
            key={p.id}
            whileHover={{ y: -5 }}
            style={{ 
              background: '#fff', padding: 24, borderRadius: 28,
              boxShadow: '0 8px 25px rgba(0,0,0,0.02)', border: '1px solid rgba(0,0,0,0.02)',
              display: 'flex', alignItems: 'center', gap: 16
            }}
          >
            <div style={{ width: 56, height: 56, borderRadius: 18, background: 'var(--cream-2)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 28 }}>
              {p.logo_emoji}
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: 900, fontSize: 15 }}>{p.name}</div>
              <div style={{ fontSize: 11, fontWeight: 800, color: 'var(--orange)', textTransform: 'uppercase', marginTop: 4 }}>{p.commune}</div>
            </div>
            <button onClick={() => startEdit(p)} style={{ background: 'none', border: 'none', color: 'var(--muted)', cursor: 'pointer' }}>
              <Ic.Settings s={20} />
            </button>
          </motion.div>
        ))}
      </div>
    </AdminLayout>
  );
}
