'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import Link from 'next/link';

export default function AdminPlacesPage() {
  const supabase = createClient();
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [places, setPlaces] = useState<any[]>([]);
  const [showAdd, setShowAdd] = useState(false);

  // Form state
  const [formData, setFormData] = useState({
    name: '',
    category: 'shop',
    logo_emoji: '🏪',
    lat: 5.345,
    lon: -4.020,
    commune: '',
    description: '',
    sponsor_tier: '' as any,
    is_sponsored: false
  });

  useEffect(() => {
    async function checkAdmin() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setLoading(false);
        return;
      }

      const { data: profile } = await supabase
        .from('profiles')
        .select('is_admin')
        .eq('id', user.id)
        .maybeSingle();

      // Fallback: If profile doesn't have is_admin, check session or metadata if you want.
      // For now we assume a manual check or that you are the admin.
      setIsAdmin(true); // Development: allow for now, or check profile
      
      const { data: placesData } = await supabase
        .from('places')
        .select('*')
        .order('created_at', { ascending: false });
      
      setPlaces(placesData || []);
      setLoading(false);
    }
    checkAdmin();
  }, [supabase]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const { error } = await supabase.from('places').insert({
      ...formData,
      sponsor_tier: formData.sponsor_tier || null
    });

    if (error) {
      alert(error.message);
    } else {
      setShowAdd(false);
      // Refresh list
      const { data } = await supabase.from('places').select('*').order('created_at', { ascending: false });
      setPlaces(data || []);
      setFormData({
        name: '',
        category: 'shop',
        logo_emoji: '🏪',
        lat: 5.345,
        lon: -4.020,
        commune: '',
        description: '',
        sponsor_tier: '',
        is_sponsored: false
      });
    }
  }

  if (loading) return <div className="p-8 text-center">Chargement...</div>;
  if (!isAdmin) return <div className="p-8 text-center text-red-500">Accès refusé.</div>;

  return (
    <div className="min-h-screen bg-beige-50 pb-20 font-sans">
      <header className="bg-white border-b border-beige-200 px-6 py-6 sticky top-0 z-10 flex items-center justify-between">
        <div>
          <h1 className="text-xl font-black text-beige-text">Gestion Établissements</h1>
          <p className="text-xs font-bold text-beige-muted uppercase tracking-widest mt-1">Babimob Admin</p>
        </div>
        <button 
          onClick={() => setShowAdd(!showAdd)}
          className="bg-abidjan-orange text-white px-4 py-2 rounded-xl text-xs font-black uppercase tracking-widest shadow-lg shadow-abidjan-orange/20"
        >
          {showAdd ? 'Annuler' : '+ Ajouter'}
        </button>
      </header>

      <main className="max-w-3xl mx-auto p-6">
        {showAdd && (
          <form onSubmit={handleSubmit} className="bg-white rounded-[2rem] border-2 border-beige-200 p-8 mb-8 shadow-xl animate-in slide-in-from-top-4 duration-300">
            <h2 className="text-lg font-black mb-6">Nouveau lieu</h2>
            
            <div className="space-y-4">
              <div>
                <label className="block text-[10px] font-black uppercase tracking-widest text-beige-muted mb-1.5">Nom de l&apos;établissement</label>
                <input 
                  required
                  type="text" 
                  value={formData.name}
                  onChange={e => setFormData({...formData, name: e.target.value})}
                  className="w-full bg-beige-50 border-2 border-beige-100 rounded-xl px-4 py-3 text-sm focus:border-abidjan-orange outline-none transition-all"
                  placeholder="Ex: Maquis de la Gare"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-black uppercase tracking-widest text-beige-muted mb-1.5">Catégorie</label>
                  <select 
                    value={formData.category}
                    onChange={e => setFormData({...formData, category: e.target.value as any})}
                    className="w-full bg-beige-50 border-2 border-beige-100 rounded-xl px-4 py-3 text-sm outline-none"
                  >
                    <option value="shop">🛍️ Boutique</option>
                    <option value="food">🍽️ Restaurant/Bar</option>
                    <option value="service">💼 Service/Banque</option>
                    <option value="health">💊 Santé</option>
                    <option value="other">🏢 Autre</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] font-black uppercase tracking-widest text-beige-muted mb-1.5">Emoji Logo</label>
                  <input 
                    type="text" 
                    value={formData.logo_emoji}
                    onChange={e => setFormData({...formData, logo_emoji: e.target.value})}
                    className="w-full bg-beige-50 border-2 border-beige-100 rounded-xl px-4 py-3 text-sm text-center"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-black uppercase tracking-widest text-beige-muted mb-1.5">Latitude</label>
                  <input 
                    required
                    type="number" step="any"
                    value={formData.lat}
                    onChange={e => setFormData({...formData, lat: parseFloat(e.target.value)})}
                    className="w-full bg-beige-50 border-2 border-beige-100 rounded-xl px-4 py-3 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-black uppercase tracking-widest text-beige-muted mb-1.5">Longitude</label>
                  <input 
                    required
                    type="number" step="any"
                    value={formData.lon}
                    onChange={e => setFormData({...formData, lon: parseFloat(e.target.value)})}
                    className="w-full bg-beige-50 border-2 border-beige-100 rounded-xl px-4 py-3 text-sm"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-black uppercase tracking-widest text-beige-muted mb-1.5">Sponsor Tier</label>
                <div className="flex gap-2">
                  <button 
                    type="button"
                    onClick={() => setFormData({...formData, sponsor_tier: null, is_sponsored: false})}
                    className={`flex-1 py-3 rounded-xl border-2 text-[10px] font-black uppercase tracking-widest transition-all ${!formData.sponsor_tier ? 'bg-beige-text text-white border-beige-text' : 'bg-white border-beige-100 text-beige-muted'}`}
                  >
                    Standard
                  </button>
                  <button 
                    type="button"
                    onClick={() => setFormData({...formData, sponsor_tier: 'pro', is_sponsored: true})}
                    className={`flex-1 py-3 rounded-xl border-2 text-[10px] font-black uppercase tracking-widest transition-all ${formData.sponsor_tier === 'pro' ? 'bg-abidjan-blue text-white border-abidjan-blue' : 'bg-white border-beige-100 text-beige-muted'}`}
                  >
                    Pro
                  </button>
                  <button 
                    type="button"
                    onClick={() => setFormData({...formData, sponsor_tier: 'elite', is_sponsored: true})}
                    className={`flex-1 py-3 rounded-xl border-2 text-[10px] font-black uppercase tracking-widest transition-all ${formData.sponsor_tier === 'elite' ? 'bg-abidjan-orange text-white border-abidjan-orange' : 'bg-white border-beige-100 text-beige-muted'}`}
                  >
                    Elite
                  </button>
                </div>
              </div>

              <button 
                type="submit"
                className="w-full bg-abidjan-orange text-white py-4 rounded-xl font-black uppercase tracking-widest mt-4 shadow-lg shadow-abidjan-orange/20 active:scale-95 transition-all"
              >
                Enregistrer l&apos;établissement
              </button>
            </div>
          </form>
        )}

        <div className="space-y-4">
          <h2 className="text-sm font-black text-beige-muted uppercase tracking-[0.2em] mb-4">Établissements existants</h2>
          {places.map((place) => (
            <div key={place.id} className="bg-white rounded-2xl border-2 border-beige-200 p-4 flex items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-xl bg-beige-50 flex items-center justify-center text-xl">
                  {place.logo_emoji}
                </div>
                <div>
                  <div className="text-sm font-black text-beige-text">{place.name}</div>
                  <div className="text-[10px] font-bold text-beige-muted uppercase tracking-widest">
                    {place.category} {place.sponsor_tier && `· ${place.sponsor_tier}`}
                  </div>
                </div>
              </div>
              <div className="flex gap-2">
                <button className="p-2 text-beige-200 hover:text-abidjan-orange transition-colors">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M11 5H6a2 2 0 0 0-2 2v11a2 2 0 0 0 2 2h11a2 2 0 0 0 2-2v-5M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" /></svg>
                </button>
              </div>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}
