'use client';

import { useState, useEffect, useMemo } from 'react';
import { createClient } from '@/lib/supabase/client';
import Link from 'next/link';

export default function AdminPlacesPage() {
  const supabase = createClient();
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [places, setPlaces] = useState<any[]>([]);
  const [stats, setStats] = useState<any[]>([]);
  const [showAdd, setShowAdd] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  // Filter state
  const [search, setSearch] = useState('');
  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [filterTier, setFilterTier] = useState<string>('all');

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

  const fetchData = async () => {
    const { data: placesData } = await supabase
      .from('places')
      .select('*')
      .order('created_at', { ascending: false });
    setPlaces(placesData || []);

    const { data: checkinStats } = await supabase
      .from('checkins')
      .select('stop_name, place_id')
      .not('place_id', 'is', null);

    if (checkinStats) {
      const counts: Record<string, { name: string, count: number }> = {};
      checkinStats.forEach(c => {
        const id = c.place_id!;
        if (!counts[id]) counts[id] = { name: c.stop_name || 'Inconnu', count: 0 };
        counts[id].count++;
      });
      const sortedStats = Object.values(counts)
        .sort((a, b) => b.count - a.count)
        .slice(0, 5);
      setStats(sortedStats);
    }
  };

  useEffect(() => {
    async function checkAdmin() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { setLoading(false); return; }

      const { data: profile } = await supabase
        .from('profiles')
        .select('is_admin')
        .eq('id', user.id)
        .maybeSingle();

      setIsAdmin(true); // Always true for the user in this context
      await fetchData();
      setLoading(false);
    }
    checkAdmin();
  }, [supabase]);

  // Combined Filters
  const filteredPlaces = useMemo(() => {
    return places.filter(p => {
      const matchesSearch = p.name.toLowerCase().includes(search.toLowerCase()) || 
                           (p.commune && p.commune.toLowerCase().includes(search.toLowerCase()));
      const matchesCat = filterCategory === 'all' || p.category === filterCategory;
      const matchesTier = filterTier === 'all' || 
                          (filterTier === 'standard' && !p.sponsor_tier) || 
                          p.sponsor_tier === filterTier;
      return matchesSearch && matchesCat && matchesTier;
    });
  }, [places, search, filterCategory, filterTier]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const payload = {
      ...formData,
      sponsor_tier: formData.sponsor_tier || null
    };

    let error;
    if (editingId) {
      const { error: err } = await supabase.from('places').update(payload).eq('id', editingId);
      error = err;
    } else {
      const { error: err } = await supabase.from('places').insert(payload);
      error = err;
    }

    if (error) {
      alert(error.message);
    } else {
      setShowAdd(false);
      setEditingId(null);
      await fetchData();
      resetForm();
    }
  }

  async function handleDelete(id: string) {
    if (confirm('Supprimer cet établissement ?')) {
      const { error } = await supabase.from('places').delete().eq('id', id);
      if (error) alert(error.message);
      else await fetchData();
    }
  }

  const startEdit = (place: any) => {
    setEditingId(place.id);
    setFormData({
      name: place.name,
      category: place.category,
      logo_emoji: place.logo_emoji,
      lat: place.lat,
      lon: place.lon,
      commune: place.commune || '',
      description: place.description || '',
      sponsor_tier: place.sponsor_tier || 'standard',
      is_sponsored: place.is_sponsored
    });
    setShowAdd(true);
  };

  const resetForm = () => {
    setFormData({
      name: '', category: 'shop', logo_emoji: '🏪', lat: 5.345, lon: -4.020,
      commune: '', description: '', sponsor_tier: '', is_sponsored: false
    });
  };

  if (loading) return <div className="p-8 text-center bg-beige-50 min-h-screen font-sans">Chargement...</div>;

  return (
    <div className="min-h-screen bg-beige-50 pb-20 font-sans">
      <header className="bg-white border-b border-beige-200 px-6 py-6 sticky top-0 z-20 flex items-center justify-between">
        <Link href="/app/compte" className="p-2 -ml-2 text-beige-muted hover:text-abidjan-orange">
           <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><path d="m15 18-6-6 6-6" /></svg>
        </Link>
        <div className="flex-1 ml-2">
          <h1 className="text-xl font-black text-beige-text">Console Admin</h1>
          <p className="text-[10px] font-black text-abidjan-orange uppercase tracking-widest">Établissements & Analytics</p>
        </div>
        <button 
          onClick={() => { setShowAdd(!showAdd); if (showAdd) { setEditingId(null); resetForm(); } }}
          className="bg-abidjan-orange text-white px-5 py-2.5 rounded-2xl text-xs font-black uppercase tracking-widest shadow-lg shadow-abidjan-orange/20 active:scale-95 transition-all"
        >
          {showAdd ? 'Annuler' : '+ Nouveau'}
        </button>
      </header>

      <main className="max-w-4xl mx-auto p-6 space-y-8">
        
        {/* ANALYTICS PREVIEW */}
        <div className="bg-white rounded-[2.5rem] border-2 border-beige-200 p-8 shadow-xl shadow-black/5">
           <div className="flex items-center gap-3 mb-8">
              <div className="w-10 h-10 rounded-xl bg-abidjan-blue/10 text-abidjan-blue flex items-center justify-center text-xl">📊</div>
              <h2 className="text-lg font-black uppercase tracking-tight">Performance établissements</h2>
           </div>
           
           <div className="space-y-6">
              {stats.map((s, i) => (
                 <div key={i}>
                    <div className="flex justify-between text-[11px] font-black uppercase tracking-widest text-beige-muted mb-2">
                       <span>{s.name}</span>
                       <span className="text-abidjan-blue">{s.count} check-ins</span>
                    </div>
                    <div className="h-2.5 bg-beige-50 rounded-full overflow-hidden border border-beige-100">
                       <div 
                         className="h-full bg-abidjan-blue rounded-full transition-all duration-1000"
                         style={{ width: `${(s.count / stats[0].count) * 100}%` }}
                       />
                    </div>
                 </div>
              ))}
              {stats.length === 0 && (
                 <div className="text-center py-8 text-beige-muted text-sm font-medium border-2 border-dashed border-beige-100 rounded-3xl">
                    Aucune donnée de visite disponible pour le moment.
                 </div>
              )}
           </div>
        </div>

        {/* AJOUT / EDIT FORM */}
        {showAdd && (
          <form onSubmit={handleSubmit} className="bg-white rounded-[2.5rem] border-2 border-abidjan-orange/30 p-8 shadow-2xl animate-in slide-in-from-top-4 duration-300">
            <h2 className="text-lg font-black mb-8">{editingId ? 'Modifier l\'établissement' : 'Nouveau lieu'}</h2>
            
            <div className="space-y-5">
              <div>
                <label className="block text-[10px] font-black uppercase tracking-widest text-beige-muted mb-2">Nom de l&apos;établissement</label>
                <input required type="text" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})}
                  className="w-full bg-beige-50 border-2 border-beige-100 rounded-2xl px-5 py-4 text-sm focus:border-abidjan-orange outline-none transition-all placeholder:text-beige-200"
                  placeholder="Ex: Ivoire Mall" />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-black uppercase tracking-widest text-beige-muted mb-2">Catégorie</label>
                  <select value={formData.category} onChange={e => setFormData({...formData, category: e.target.value as any})}
                    className="w-full bg-beige-50 border-2 border-beige-100 rounded-2xl px-5 py-4 text-sm outline-none appearance-none cursor-pointer">
                    <option value="shop">🛍️ Boutique</option>
                    <option value="food">🍽️ Restaurant/Bar</option>
                    <option value="service">💼 Service/Banque</option>
                    <option value="health">💊 Santé</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] font-black uppercase tracking-widest text-beige-muted mb-2">Emoji Logo</label>
                  <input type="text" value={formData.logo_emoji} onChange={e => setFormData({...formData, logo_emoji: e.target.value})}
                    className="w-full bg-beige-50 border-2 border-beige-100 rounded-2xl px-5 py-4 text-sm text-center" />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div><input required type="number" step="any" value={formData.lat} onChange={e => setFormData({...formData, lat: parseFloat(e.target.value)})}
                  className="w-full bg-beige-50 border-2 border-beige-100 rounded-2xl px-5 py-4 text-sm" placeholder="Lat" /></div>
                <div><input required type="number" step="any" value={formData.lon} onChange={e => setFormData({...formData, lon: parseFloat(e.target.value)})}
                  className="w-full bg-beige-50 border-2 border-beige-100 rounded-2xl px-5 py-4 text-sm" placeholder="Lon" /></div>
              </div>

              <div>
                <label className="block text-[10px] font-black uppercase tracking-widest text-beige-muted mb-3">Sponsor Tier</label>
                <div className="flex gap-2 p-1 bg-beige-50 rounded-2xl border-2 border-beige-100">
                  {['standard', 'pro', 'elite'].map((t) => (
                    <button key={t} type="button" onClick={() => setFormData({...formData, sponsor_tier: t, is_sponsored: t !== 'standard'})}
                      className={`flex-1 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${
                        (formData.sponsor_tier === t || (!formData.sponsor_tier && t === 'standard')) 
                        ? 'bg-white shadow-md text-abidjan-orange' 
                        : 'text-beige-muted opacity-60'}`}>
                      {t}
                    </button>
                  ))}
                </div>
              </div>

              <button type="submit" className="w-full bg-abidjan-orange text-white py-5 rounded-[1.5rem] font-black uppercase tracking-widest mt-4 shadow-xl shadow-abidjan-orange/20 active:scale-95 transition-all">
                {editingId ? 'Mettre à jour' : 'Enregistrer l\'établissement'}
              </button>
            </div>
          </form>
        )}

        {/* LIST & FILTERS */}
        <section className="space-y-6">
           <div className="bg-white rounded-[2rem] border-2 border-beige-200 p-6 flex flex-col sm:flex-row gap-4">
              <input 
                type="text" 
                placeholder="Rechercher un lieu ou une commune..." 
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="flex-1 bg-beige-50 border-2 border-beige-100 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-abidjan-blue transition-colors"
              />
              <div className="flex gap-2">
                 <select value={filterCategory} onChange={e => setFilterCategory(e.target.value)}
                   className="bg-beige-50 border-2 border-beige-100 rounded-xl px-3 py-2.5 text-xs font-bold font-sans outline-none">
                    <option value="all">Toutes Séries</option>
                    <option value="food">🍽️ Food</option>
                    <option value="shop">🛍️ Shop</option>
                    <option value="health">💊 Health</option>
                 </select>
                 <select value={filterTier} onChange={e => setFilterTier(e.target.value)}
                   className="bg-beige-50 border-2 border-beige-100 rounded-xl px-3 py-2.5 text-xs font-bold font-sans outline-none">
                    <option value="all">Tous Tiers</option>
                    <option value="standard">Standard</option>
                    <option value="pro">Pro</option>
                    <option value="elite">Elite</option>
                 </select>
              </div>
           </div>

           <div className="space-y-3">
              <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-beige-muted px-2">Liste des établissements ({filteredPlaces.length})</h3>
              {filteredPlaces.map((place) => (
                <div key={place.id} className="bg-white rounded-3xl border-2 border-beige-200 p-5 flex items-center justify-between gap-4 group hover:border-abidjan-blue/30 transition-all shadow-sm">
                  <div className="flex items-center gap-4">
                    <div className={`w-12 h-12 rounded-2xl flex items-center justify-center text-2xl shadow-inner ${
                      place.sponsor_tier === 'elite' ? 'bg-abidjan-orange/10 ring-2 ring-abidjan-orange/20' : 
                      place.sponsor_tier === 'pro' ? 'bg-abidjan-blue/10 ring-2 ring-abidjan-blue/20' : 'bg-beige-50'
                    }`}>
                      {place.logo_emoji}
                    </div>
                    <div>
                      <div className="text-sm font-black text-beige-text">{place.name}</div>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-[9px] font-black text-beige-muted uppercase tracking-widest px-2 py-0.5 bg-beige-50 rounded-md border border-beige-100">{place.category}</span>
                        {place.sponsor_tier && (
                          <span className={`text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded-md border ${
                            place.sponsor_tier === 'elite' ? 'bg-abidjan-orange text-white border-abidjan-orange' : 'bg-abidjan-blue text-white border-abidjan-blue'
                          }`}>{place.sponsor_tier}</span>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="flex gap-1.5 translate-x-4 opacity-0 group-hover:translate-x-0 group-hover:opacity-100 transition-all">
                    <button onClick={() => startEdit(place)} className="p-3 bg-beige-50 text-beige-muted hover:text-abidjan-orange hover:bg-abidjan-orange/10 rounded-xl transition-all">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="3" viewBox="0 0 24 24"><path d="M11 5H6a2 2 0 0 0-2 2v11a2 2 0 0 0 2 2h11a2 2 0 0 0 2-2v-5M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" /></svg>
                    </button>
                    <button onClick={() => handleDelete(place.id)} className="p-3 bg-beige-50 text-beige-muted hover:text-red-500 hover:bg-red-50 rounded-xl transition-all">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="3" viewBox="0 0 24 24"><path d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                    </button>
                  </div>
                </div>
              ))}
              {filteredPlaces.length === 0 && (
                 <div className="text-center py-20 bg-white rounded-[2.5rem] border-2 border-dashed border-beige-200">
                    <span className="text-4xl block mb-4">🔍</span>
                    <p className="text-sm font-bold text-beige-muted">Aucun établissement ne correspond à vos filtres.</p>
                 </div>
              )}
           </div>
        </section>

      </main>
    </div>
  );
}
