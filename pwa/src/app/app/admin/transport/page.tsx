'use client';

export const dynamic = 'force-dynamic';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import AdminLayout from '@/components/admin/AdminLayout';
import { motion, AnimatePresence } from 'framer-motion';
import { Ic } from '@/components/ui/Ic';

export default function AdminTransportPage() {
  const supabase = createClient();
  const [activeTab, setActiveTab] = useState<'lines' | 'stops' | 'agencies'>('lines');
  const [routes, setRoutes] = useState<any[]>([]);
  const [stops, setStops] = useState<any[]>([]);
  const [agencies, setAgencies] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [showAdd, setShowAdd] = useState(false);
  const [editingItem, setEditingItem] = useState<any>(null);
  
  // Form states
  const [routeForm, setRouteForm] = useState({ route_id: '', agency_id: '', route_short_name: '', route_long_name: '', route_color: 'F26C1A', route_text_color: 'FFFFFF', route_type: 3 });
  const [agencyForm, setAgencyForm] = useState({ agency_id: '', agency_name: '', agency_url: '', agency_timezone: 'Africa/Abidjan' });

  const fetchData = async () => {
    setLoading(true);
    const [rData, sData, aData] = await Promise.all([
      supabase.from('gtfs_routes').select('*').order('route_short_name'),
      supabase.from('gtfs_stops').select('*').order('stop_name').limit(100),
      supabase.from('gtfs_agencies').select('*').order('agency_name')
    ]);
    setRoutes(rData.data || []);
    setStops(sData.data || []);
    setAgencies(aData.data || []);
    setLoading(false);
  };

  useEffect(() => { fetchData(); }, [supabase]);

  const handleRouteSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const { error } = editingItem 
      ? await supabase.from('gtfs_routes').update(routeForm).eq('route_id', editingItem.route_id)
      : await supabase.from('gtfs_routes').insert(routeForm);
    
    if (error) alert(error.message);
    else { setShowAdd(false); fetchData(); }
  };

  const handleAgencySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const { error } = await supabase.from('gtfs_agencies').insert(agencyForm);
    if (error) alert(error.message);
    else { setShowAdd(false); fetchData(); }
  };

  const startEditRoute = (route: any) => {
    setEditingItem(route);
    setRouteForm({
      route_id: route.route_id,
      agency_id: route.agency_id || '',
      route_short_name: route.route_short_name || '',
      route_long_name: route.route_long_name || '',
      route_color: route.route_color || 'F26C1A',
      route_text_color: route.route_text_color || 'FFFFFF',
      route_type: route.route_type || 3
    });
    setShowAdd(true);
  };

  const filteredRoutes = routes.filter(r => 
    r.route_short_name?.toLowerCase().includes(search.toLowerCase()) ||
    r.route_long_name?.toLowerCase().includes(search.toLowerCase())
  );

  const filteredStops = stops.filter(s => 
    s.stop_name?.toLowerCase().includes(search.toLowerCase()) ||
    s.stop_id?.toLowerCase().includes(search.toLowerCase()) ||
    s.commune?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <AdminLayout>
      <div style={{ marginBottom: 40, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <h1 className="font-display" style={{ fontSize: 40, marginBottom: 8, letterSpacing: -1 }}>Réseau Transport</h1>
          <p style={{ fontSize: 16, color: 'rgba(255,255,255,0.5)', fontWeight: 600 }}>Contrôle total des agences, lignes et arrêts du réseau BABIMOB.</p>
        </div>
        <div style={{ display: 'flex', gap: 12 }}>
           <button className="press" style={tabBtnStyle(activeTab === 'agencies')} onClick={() => { setActiveTab('agencies'); setShowAdd(false); }}>AGENCES</button>
           <button className="press" style={tabBtnStyle(activeTab === 'lines')} onClick={() => { setActiveTab('lines'); setShowAdd(false); }}>LIGNES</button>
           <button className="press" style={tabBtnStyle(activeTab === 'stops')} onClick={() => { setActiveTab('stops'); setShowAdd(false); }}>ARRÊTS</button>
        </div>
      </div>

      {/* ADD ACTION */}
      <div style={{ marginBottom: 32 }}>
        <button 
          onClick={() => { setShowAdd(!showAdd); setEditingItem(null); }}
          className="press"
          style={{ background: 'rgba(255,255,255,0.05)', color: '#fff', border: '1px solid rgba(255,255,255,0.1)', padding: '14px 24px', borderRadius: 16, fontSize: 12, fontWeight: 900, cursor: 'pointer' }}
        >
          {showAdd ? 'ANNULER' : activeTab === 'lines' ? '+ CRÉER UNE LIGNE' : activeTab === 'agencies' ? '+ AJOUTER UNE AGENCE' : 'GÉRER ARRÊTS'}
        </button>
      </div>

      <AnimatePresence>
        {showAdd && (
          <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} style={{ background: 'rgba(255,255,255,0.03)', padding: 32, borderRadius: 28, marginBottom: 40, border: '1px solid rgba(255,255,255,0.05)' }}>
            {activeTab === 'lines' ? (
              <form onSubmit={handleRouteSubmit} style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 20 }}>
                <input placeholder="ID Ligne (ex: L82)" style={inputStyle} value={routeForm.route_id} onChange={e => setRouteForm({...routeForm, route_id: e.target.value})} disabled={!!editingItem} />
                <input placeholder="Code (ex: 82)" style={inputStyle} value={routeForm.route_short_name} onChange={e => setRouteForm({...routeForm, route_short_name: e.target.value})} />
                <select style={inputStyle} value={routeForm.agency_id} onChange={e => setRouteForm({...routeForm, agency_id: e.target.value})}>
                  <option value="">Choisir Agence</option>
                  {agencies.map(a => <option key={a.agency_id} value={a.agency_id}>{a.agency_name}</option>)}
                </select>
                <input placeholder="Couleur (HEX)" style={inputStyle} value={routeForm.route_color} onChange={e => setRouteForm({...routeForm, route_color: e.target.value})} />
                <button type="submit" style={{ background: 'var(--orange)', color: '#fff', border: 'none', borderRadius: 16, fontWeight: 900 }}>{editingItem ? 'MODIFIER' : 'CRÉER'}</button>
              </form>
            ) : activeTab === 'agencies' ? (
              <form onSubmit={handleAgencySubmit} style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 20 }}>
                <input placeholder="ID Agence (ex: SOTRA)" style={inputStyle} value={agencyForm.agency_id} onChange={e => setAgencyForm({...agencyForm, agency_id: e.target.value})} />
                <input placeholder="Nom Agence" style={inputStyle} value={agencyForm.agency_name} onChange={e => setAgencyForm({...agencyForm, agency_name: e.target.value})} />
                <button type="submit" style={{ background: 'var(--blue)', color: '#fff', border: 'none', borderRadius: 16, fontWeight: 900 }}>CRÉER AGENCE</button>
              </form>
            ) : null}
          </motion.div>
        )}
      </AnimatePresence>

      {/* QUICK STATS / INFO */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 24, marginBottom: 40 }}>
        <div style={cardStyle}>
          <div style={{ fontSize: 11, fontWeight: 900, color: 'rgba(255,255,255,0.3)', textTransform: 'uppercase', marginBottom: 12 }}>Intégrité du Réseau</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <div style={{ fontSize: 24 }}>🛡️</div>
            <div>
              <div style={{ fontSize: 18, fontWeight: 900 }}>Standard GTFS v2</div>
              <div style={{ fontSize: 11, color: '#10b981', fontWeight: 800, marginTop: 2 }}>{routes.length} lignes actives indexées</div>
            </div>
          </div>
        </div>
        <div style={cardStyle}>
          <div style={{ fontSize: 11, fontWeight: 900, color: 'rgba(255,255,255,0.3)', textTransform: 'uppercase', marginBottom: 12 }}>Dernière Mise à jour</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <div style={{ fontSize: 24 }}>🔄</div>
            <div>
              <div style={{ fontSize: 18, fontWeight: 900 }}>Automatique</div>
              <div style={{ fontSize: 11, color: 'var(--blue)', fontWeight: 800, marginTop: 2 }}>Synchronisé avec le feed national</div>
            </div>
          </div>
        </div>
      </div>

      {/* SEARCH & FILTERS */}
      <div style={{ position: 'relative', marginBottom: 32 }}>
        <div style={{ position: 'absolute', left: 16, top: '50%', transform: 'translateY(-50%)', opacity: 0.3 }}><Ic.Search s={20} /></div>
        <input 
          placeholder={`Rechercher ${activeTab === 'lines' ? 'une ligne (ex: 82)' : 'un arrêt'}...`} 
          style={{ ...inputStyle, paddingLeft: 48 }}
          value={search} onChange={e => setSearch(e.target.value)}
        />
      </div>

      {/* CONTENT AREA */}
      <div style={{ minHeight: 400 }}>
        {loading ? (
          <div style={{ textAlign: 'center', padding: '100px 0', opacity: 0.5 }}>Interrogation du réseau...</div>
        ) : (
          <>
            {activeTab === 'agencies' && (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 20 }}>
                {agencies.map(a => (
                  <motion.div key={a.agency_id} whileHover={{ scale: 1.02 }} style={itemCardStyle}>
                    <div style={{ width: 44, height: 44, borderRadius: 12, background: 'var(--blue)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20 }}>🏢</div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: 900, fontSize: 15 }}>{a.agency_name}</div>
                      <div style={{ fontSize: 10, fontWeight: 900, color: 'rgba(255,255,255,0.3)', textTransform: 'uppercase', marginTop: 4 }}>ID: {a.agency_id} • {a.agency_timezone}</div>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}

            {activeTab === 'lines' && (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 20 }}>
                {filteredRoutes.map(r => (
                  <motion.div key={r.route_id} whileHover={{ scale: 1.02 }} style={itemCardStyle}>
                    <div style={{ 
                      width: 50, height: 50, borderRadius: 12, 
                      background: `#${r.route_color || '1A1410'}`, 
                      color: `#${r.route_text_color || 'FFFFFF'}`,
                      display: 'flex', alignItems: 'center', justifyContent: 'center', 
                      fontSize: 18, fontWeight: 900, fontFamily: 'Archivo Black, sans-serif'
                    }}>
                      {r.route_short_name}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontWeight: 900, fontSize: 14, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{r.route_long_name || 'Ligne sans nom'}</div>
                      <div style={{ fontSize: 10, fontWeight: 900, color: 'rgba(255,255,255,0.3)', textTransform: 'uppercase', marginTop: 4 }}>{r.agency_id || 'SOTRA'} • {r.route_type === 3 ? 'BUS' : 'AUTRE'}</div>
                    </div>
                    <button className="press" onClick={() => startEditRoute(r)} style={actionBtnStyle}><Ic.Settings s={16} /></button>
                  </motion.div>
                ))}
              </div>
            )}

            {activeTab === 'stops' && (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 16 }}>
                {filteredStops.map(s => (
                  <div key={s.stop_id} style={{ ...itemCardStyle, padding: '16px 20px' }}>
                    <div style={{ width: 36, height: 36, borderRadius: 10, background: 'rgba(255,255,255,0.05)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18 }}>🚏</div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: 800, fontSize: 13 }}>{s.stop_name}</div>
                      <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.3)', fontWeight: 800, marginTop: 2 }}>{s.stop_id} • {s.commune || 'Abidjan'}</div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                       <div style={{ fontSize: 9, fontWeight: 900, color: 'var(--blue)' }}>LOC CODE</div>
                       <div style={{ fontSize: 11, fontWeight: 900 }}>{s.stop_code || '---'}</div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </AdminLayout>
  );
}

const tabBtnStyle = (active: boolean) => ({
  background: active ? 'var(--orange)' : 'rgba(255,255,255,0.03)',
  color: active ? '#fff' : 'rgba(255,255,255,0.4)',
  border: 'none',
  padding: '12px 24px',
  borderRadius: 14,
  fontSize: 11,
  fontWeight: 900,
  cursor: 'pointer',
  letterSpacing: 1,
  transition: 'all 0.2s'
});

const cardStyle = {
  background: 'rgba(255,255,255,0.03)',
  padding: 28,
  borderRadius: 32,
  border: '1px solid rgba(255,255,255,0.05)',
  backdropFilter: 'blur(10px)'
};

const itemCardStyle = {
  background: 'rgba(255,255,255,0.02)',
  padding: '20px',
  borderRadius: 24,
  border: '1px solid rgba(255,255,255,0.05)',
  display: 'flex',
  alignItems: 'center',
  gap: 16
};

const inputStyle = {
  width: '100%',
  background: 'rgba(255,255,255,0.03)',
  border: '1px solid rgba(255,255,255,0.05)',
  padding: '18px',
  borderRadius: 20,
  outline: 'none',
  fontWeight: 700,
  color: '#fff',
  fontSize: 15,
  transition: 'all 0.2s'
};

const actionBtnStyle = {
  background: 'rgba(255,255,255,0.05)',
  border: 'none',
  color: 'rgba(255,255,255,0.5)',
  padding: 10,
  borderRadius: 12,
  cursor: 'pointer'
};
