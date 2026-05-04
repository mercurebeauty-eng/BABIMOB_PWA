'use client';

import { useState, useEffect, useMemo } from 'react';
import { createClient } from '@/lib/supabase/client';
import AdminLayout from '@/components/admin/AdminLayout';
import { motion, AnimatePresence } from 'framer-motion';
import { Ic } from '@/components/ui/Ic';

export default function AdminPlacesPage() {
  const supabase = createClient();
  const [places, setPlaces] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [offers, setOffers] = useState<any[]>([]);
  const [showOfferAdd, setShowOfferAdd] = useState(false);
  const [offerForm, setOfferForm] = useState({ title: '', description: '', discount_pct: 10, valid_until: '' });

  // Filter state
  const [search, setSearch] = useState('');
  const [filterCategory, setFilterCategory] = useState<string>('all');

  // Form state
  const [formData, setFormData] = useState({
    name: '', 
    category: 'shop', 
    logo_emoji: '🏪', 
    lat: 5.345, 
    lon: -4.020,
    commune: '', 
    description: '', 
    phone: '', 
    whatsapp: '', 
    sponsor_tier: 'standard', 
    is_sponsored: false,
    address: '',
    website: '',
    instagram: '',
    verified: false
  });

  const fetchData = async () => {
    setLoading(true);
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
    const payload = { 
      ...formData, 
      sponsor_tier: formData.sponsor_tier === 'standard' ? null : formData.sponsor_tier,
      is_sponsored: formData.sponsor_tier !== 'standard'
    };
    
    let error;
    if (editingId) {
      const { error: err } = await supabase.from('places').update(payload).eq('id', editingId);
      error = err;
    } else {
      const { error: err } = await supabase.from('places').insert(payload);
      error = err;
    }
    
    if (error) alert(error.message);
    else { 
      setShowAdd(false); 
      setEditingId(null); 
      fetchData(); 
      resetForm(); 
    }
  }

  const resetForm = () => {
    setFormData({
      name: '', category: 'shop', logo_emoji: '🏪', lat: 5.345, lon: -4.020,
      commune: '', description: '', phone: '', whatsapp: '', sponsor_tier: 'standard', is_sponsored: false,
      address: '', website: '', instagram: '', verified: false
    });
  };

  const startEdit = async (place: any) => {
    setEditingId(place.id);
    setFormData({
      name: place.name, 
      category: place.category, 
      logo_emoji: place.logo_emoji,
      lat: place.lat, 
      lon: place.lon, 
      commune: place.commune || '',
      description: place.description || '', 
      phone: place.phone || '',
      whatsapp: place.whatsapp || '', 
      sponsor_tier: place.sponsor_tier || 'standard',
      is_sponsored: !!place.sponsor_tier,
      address: place.address || '',
      website: place.website || '',
      instagram: place.instagram || '',
      verified: place.verified || false
    });
    
    // Fetch offers
    const { data: offerData } = await supabase.from('place_offers').select('*').eq('place_id', place.id).order('created_at', { ascending: false });
    setOffers(offerData || []);
    setShowAdd(true);
  };

  const handleAddOffer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingId) return;
    const { error } = await supabase.from('place_offers').insert({
      ...offerForm,
      place_id: editingId,
      valid_from: new Date().toISOString().split('T')[0]
    });
    if (error) alert(error.message);
    else {
      setOfferForm({ title: '', description: '', discount_pct: 10, valid_until: '' });
      setShowOfferAdd(false);
      // Refresh offers
      const { data } = await supabase.from('place_offers').select('*').eq('place_id', editingId).order('created_at', { ascending: false });
      setOffers(data || []);
    }
  };

  const deleteOffer = async (id: string) => {
    const { error } = await supabase.from('place_offers').delete().eq('id', id);
    if (error) alert(error.message);
    else setOffers(offers.filter(o => o.id !== id));
  };

  return (
    <AdminLayout>
      <div style={{ marginBottom: 40, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <h1 className="font-display" style={{ fontSize: 40, marginBottom: 8, letterSpacing: -1 }}>Lieux & Marketing</h1>
          <p style={{ fontSize: 16, color: 'rgba(255,255,255,0.5)', fontWeight: 600 }}>Gère les établissements, le sponsoring et les campagnes BABIMOB.</p>
        </div>
        <button 
          onClick={() => { setShowAdd(!showAdd); if (showAdd) { setEditingId(null); resetForm(); } }}
          className="press"
          style={{ 
            background: 'var(--orange)', color: '#fff', border: 'none',
            padding: '16px 28px', borderRadius: 20, fontSize: 13, fontWeight: 900,
            cursor: 'pointer', boxShadow: '0 10px 30px rgba(242,108,26,0.3)',
            display: 'flex', alignItems: 'center', gap: 10
          }}
        >
          {showAdd ? <Ic.X s={18} /> : <Ic.Plus s={18} />}
          {showAdd ? 'ANNULER' : 'AJOUTER UN LIEU'}
        </button>
      </div>

      <AnimatePresence>
        {showAdd && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            style={{ overflow: 'hidden' }}
          >
            <form 
              onSubmit={handleSubmit} 
              style={{ 
                background: 'rgba(255,255,255,0.03)', padding: 40, borderRadius: 32, marginBottom: 40,
                border: '1px solid rgba(255,255,255,0.05)', backdropFilter: 'blur(20px)'
              }}
            >
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: 32, marginBottom: 32 }}>
                
                {/* SECTION: IDENTITÉ */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
                  <h3 style={{ fontSize: 11, fontWeight: 900, color: 'var(--orange)', textTransform: 'uppercase', letterSpacing: 2 }}>Identity & Style</h3>
                  
                  <div>
                    <label style={{ fontSize: 10, fontWeight: 900, color: 'rgba(255,255,255,0.3)', textTransform: 'uppercase', marginBottom: 8, display: 'block' }}>Nom du lieu</label>
                    <input required placeholder="ex: Maquis Le Dôme" style={inputStyle} 
                      value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} />
                  </div>
192: 
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                    <div>
                      <label style={{ fontSize: 10, fontWeight: 900, color: 'rgba(255,255,255,0.3)', textTransform: 'uppercase', marginBottom: 8, display: 'block' }}>Logo Emoji</label>
                      <input style={{ ...inputStyle, textAlign: 'center', fontSize: 24 }} 
                        value={formData.logo_emoji} onChange={e => setFormData({...formData, logo_emoji: e.target.value})} />
                    </div>
                    <div>
                      <label style={{ fontSize: 10, fontWeight: 900, color: 'rgba(255,255,255,0.3)', textTransform: 'uppercase', marginBottom: 8, display: 'block' }}>Catégorie</label>
                      <select style={inputStyle} value={formData.category} onChange={e => setFormData({...formData, category: e.target.value})}>
                        <option value="food">🍽️ Food & Drink</option>
                        <option value="shop">🛍️ Shopping</option>
                        <option value="market">🏪 Marché</option>
                        <option value="fun">🎮 Loisirs</option>
                        <option value="health">🏥 Santé</option>
                        <option value="other">✨ Autre</option>
                      </select>
                    </div>
                  </div>
                </div>
212: 
                {/* SECTION: LOCATION */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
                  <h3 style={{ fontSize: 11, fontWeight: 900, color: 'var(--blue)', textTransform: 'uppercase', letterSpacing: 2 }}>Géolocalisation</h3>
                  
                  <div>
                    <label style={{ fontSize: 10, fontWeight: 900, color: 'rgba(255,255,255,0.3)', textTransform: 'uppercase', marginBottom: 8, display: 'block' }}>Commune</label>
                    <input placeholder="ex: Cocody" style={inputStyle} 
                      value={formData.commune} onChange={e => setFormData({...formData, commune: e.target.value})} />
                  </div>
222: 
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                    <div>
                      <label style={{ fontSize: 10, fontWeight: 900, color: 'rgba(255,255,255,0.3)', textTransform: 'uppercase', marginBottom: 8, display: 'block' }}>Latitude</label>
                      <input type="number" step="0.000001" style={inputStyle} 
                        value={formData.lat} onChange={e => setFormData({...formData, lat: parseFloat(e.target.value)})} />
                    </div>
                    <div>
                      <label style={{ fontSize: 10, fontWeight: 900, color: 'rgba(255,255,255,0.3)', textTransform: 'uppercase', marginBottom: 8, display: 'block' }}>Longitude</label>
                      <input type="number" step="0.000001" style={inputStyle} 
                        value={formData.lon} onChange={e => setFormData({...formData, lon: parseFloat(e.target.value)})} />
                    </div>
                  </div>
                </div>
236: 
                {/* SECTION: MARKETING */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
                  <h3 style={{ fontSize: 11, fontWeight: 900, color: 'var(--gold)', textTransform: 'uppercase', letterSpacing: 2 }}>Marketing & Sponsoring</h3>
                  
                  <div>
                    <label style={{ fontSize: 10, fontWeight: 900, color: 'rgba(255,255,255,0.3)', textTransform: 'uppercase', marginBottom: 8, display: 'block' }}>Niveau de Sponsoring</label>
                    <select style={{ ...inputStyle, border: formData.sponsor_tier !== 'standard' ? '1px solid var(--gold)' : '1px solid transparent' }} 
                      value={formData.sponsor_tier} onChange={e => setFormData({...formData, sponsor_tier: e.target.value})}>
                      <option value="standard">Standard (Gratuit)</option>
                      <option value="pro">Pro (Visibilité +)</option>
                      <option value="elite">Elite (Top Map + Shine)</option>
                    </select>
                  </div>
250: 
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12, background: 'rgba(255,255,255,0.02)', padding: 14, borderRadius: 16 }}>
                    <input type="checkbox" checked={formData.verified} onChange={e => setFormData({...formData, verified: e.target.checked})} style={{ width: 18, height: 18 }} />
                    <label style={{ fontSize: 13, fontWeight: 800 }}>Établissement vérifié ✅</label>
                  </div>
                </div>
256: 
              </div>
259: 
              <div style={{ height: 1, background: 'rgba(255,255,255,0.05)', marginBottom: 32 }} />
261: 
              {/* SECTION: OFFERS (ONLY IF EDITING) */}
              {editingId && (
                <div style={{ marginBottom: 40, background: 'rgba(0,0,0,0.2)', padding: 32, borderRadius: 24, border: '1px solid rgba(255,255,255,0.05)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
                    <h3 style={{ fontSize: 13, fontWeight: 900, color: 'var(--orange)', textTransform: 'uppercase', letterSpacing: 2 }}>Promotions & Bonus</h3>
                    <button type="button" onClick={() => setShowOfferAdd(!showOfferAdd)} style={{ background: 'var(--orange)', color: '#fff', border: 'none', padding: '8px 16px', borderRadius: 12, fontSize: 11, fontWeight: 900, cursor: 'pointer' }}>
                      {showOfferAdd ? 'ANNULER' : '+ AJOUTER'}
                    </button>
                  </div>
270: 
                  {showOfferAdd && (
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16, marginBottom: 24, paddingBottom: 24, borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                       <input placeholder="Titre (ex: -20% Menu Midi)" style={inputStyle} value={offerForm.title} onChange={e => setOfferForm({...offerForm, title: e.target.value})} />
                       <input type="number" placeholder="% de réduction" style={inputStyle} value={offerForm.discount_pct} onChange={e => setOfferForm({...offerForm, discount_pct: parseInt(e.target.value)})} />
                       <input type="date" style={inputStyle} value={offerForm.valid_until} onChange={e => setOfferForm({...offerForm, valid_until: e.target.value})} />
                       <button type="button" onClick={handleAddOffer} style={{ background: '#fff', color: '#000', border: 'none', borderRadius: 16, fontWeight: 900 }}>VALIDER OFFRE</button>
                    </div>
                  )}
279: 
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                    {offers.length > 0 ? offers.map(offer => (
                      <div key={offer.id} style={{ display: 'flex', alignItems: 'center', gap: 16, background: 'rgba(255,255,255,0.03)', padding: '12px 20px', borderRadius: 16 }}>
                        <div style={{ width: 40, height: 40, borderRadius: 10, background: 'var(--orange-pale)', color: 'var(--orange)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 900 }}>%{offer.discount_pct}</div>
                        <div style={{ flex: 1 }}>
                          <div style={{ fontSize: 14, fontWeight: 800 }}>{offer.title}</div>
                          <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.3)', fontWeight: 800 }}>Jusqu'au {offer.valid_until || 'Indéterminé'}</div>
                        </div>
                        <button type="button" onClick={() => deleteOffer(offer.id)} style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer' }}><Ic.X s={18} /></button>
                      </div>
                    )) : (
                      <div style={{ textAlign: 'center', opacity: 0.3, fontSize: 12, padding: 20 }}>Aucune promotion active.</div>
                    )}
                  </div>
                </div>
              )}
296: 
              <button type="submit" className="press" style={{ 
                width: '100%', background: '#fff', color: '#000', border: 'none', 
                padding: '20px', borderRadius: 20, fontWeight: 900, cursor: 'pointer',
                fontSize: 14, letterSpacing: 1
              }}>
                {editingId ? 'METTRE À JOUR LE LIEU' : 'CONFIRMER LA CRÉATION'}
              </button>
            </form>
          </motion.div>
        )}
      </AnimatePresence>
308: 
      {/* FILTERS BAR */}
      <div style={{ 
        background: 'rgba(255,255,255,0.02)', padding: 14, borderRadius: 24, marginBottom: 32,
        display: 'flex', gap: 12, border: '1px solid rgba(255,255,255,0.05)'
      }}>
        <div style={{ position: 'relative', flex: 1 }}>
          <div style={{ position: 'absolute', left: 16, top: '50%', transform: 'translateY(-50%)', opacity: 0.3 }}><Ic.Search s={18} /></div>
          <input 
            placeholder="Rechercher un établissement..." 
            style={{ ...inputStyle, paddingLeft: 44, background: 'transparent' }}
            value={search} onChange={e => setSearch(e.target.value)}
          />
        </div>
        <select 
          style={{ ...inputStyle, width: 200, background: 'rgba(255,255,255,0.03)' }}
          value={filterCategory} onChange={e => setFilterCategory(e.target.value)}
        >
          <option value="all">Toutes catégories</option>
          <option value="food">🍽️ Food</option>
          <option value="shop">🛍️ Shop</option>
          <option value="market">🏪 Marché</option>
          <option value="fun">🎮 Loisirs</option>
        </select>
      </div>
333: 
      {/* PLACES GRID */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: '100px 0', opacity: 0.5 }}>Chargement des données...</div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 24 }}>
          {filteredPlaces.map(p => (
            <motion.div 
              key={p.id}
              whileHover={{ y: -5, background: 'rgba(255,255,255,0.05)' }}
              style={{ 
                background: 'rgba(255,255,255,0.03)', padding: 24, borderRadius: 32,
                border: '1px solid rgba(255,255,255,0.05)',
                display: 'flex', alignItems: 'center', gap: 20, position: 'relative',
                overflow: 'hidden'
              }}
            >
              {p.sponsor_tier === 'elite' && <div style={{ position: 'absolute', top: 0, right: 0, width: 40, height: 40, background: 'var(--gold)', clipPath: 'polygon(100% 0, 0 0, 100% 100%)', display: 'flex', alignItems: 'flex-start', justifyContent: 'flex-end', padding: 6, fontSize: 10 }}>⭐</div>}
              
              <div style={{ 
                width: 64, height: 64, borderRadius: 20, 
                background: p.cover_color || 'var(--ink-2)', 
                display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 32,
                boxShadow: '0 8px 20px rgba(0,0,0,0.2)'
              }}>
                {p.logo_emoji}
              </div>
              
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontWeight: 900, fontSize: 16, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{p.name}</div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 4 }}>
                   <div style={{ fontSize: 10, fontWeight: 900, color: 'var(--orange)', textTransform: 'uppercase' }}>{p.commune || 'Abidjan'}</div>
                   {p.verified && <span style={{ fontSize: 10 }}>✅</span>}
                </div>
                <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.3)', marginTop: 8, fontWeight: 800 }}>
                  {p.category.toUpperCase()} • {p.lat.toFixed(4)}, {p.lon.toFixed(4)}
                </div>
              </div>
371: 
              <button 
                onClick={() => startEdit(p)} 
                className="press"
                style={{ 
                  background: 'rgba(255,255,255,0.05)', border: 'none', color: '#fff', 
                  padding: 12, borderRadius: 14, cursor: 'pointer' 
                }}
              >
                <Ic.Settings s={18} />
              </button>
            </motion.div>
          ))}
        </div>
      )}
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
