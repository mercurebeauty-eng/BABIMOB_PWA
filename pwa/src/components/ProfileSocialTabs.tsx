'use client';

import { useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import Link from 'next/link';
import dynamic from 'next/dynamic';
import PremiumWall from './PremiumWall';

const PersonalHeatmap = dynamic(() => import('./PersonalHeatmap'), { ssr: false });

type Visit = {
  id: string;
  created_at: string;
  stop_name: string;
  commune: string | null;
  place_id: string | null;
  notes: string | null;
};

type FollowEntry = {
  id: string;
  profiles: {
    id: string;
    display_name: string;
    avatar_emoji: string;
    is_verified_explorer: boolean;
  } | null;
};

type Props = {
  userId: string;
  initialVisits: Visit[];
  initialFollowing: FollowEntry[];
  heatmapData: { lat: number; lon: number }[];
  currentTier: 'free' | 'messenger' | 'social' | 'pro';
};

export default function ProfileSocialTabs({ userId, initialVisits, initialFollowing, heatmapData, currentTier }: Props) {
  const supabase = createClient();
  const [activeTab, setActiveTab] = useState<'visites' | 'reseau'>('visites');
  const [visits, setVisits] = useState(initialVisits);
  const [following, setFollowing] = useState(initialFollowing);
  
  // Networking state
  const [phoneSearch, setPhoneSearch] = useState('');
  const [searchLoading, setSearchLoading] = useState(false);
  const [foundUser, setFoundUser] = useState<any>(null);

  // Paywall state
  const [showWall, setShowWall] = useState(false);
  const [requiredTier, setRequiredTier] = useState<'messenger' | 'social' | 'pro'>('messenger');

  const hasSocial = currentTier === 'social' || currentTier === 'pro';
  const hasMessenger = currentTier === 'messenger' || currentTier === 'social' || currentTier === 'pro';

  async function handleSearch() {
    if (!hasSocial) {
      setRequiredTier('social');
      setShowWall(true);
      return;
    }
    if (!phoneSearch.trim()) return;
    setSearchLoading(true);
    setFoundUser(null);

    const { data, error } = await supabase
      .from('profiles')
      .select('id, display_name, avatar_emoji, is_verified_explorer')
      .eq('phone_number', phoneSearch.trim())
      .single();

    if (data) setFoundUser(data);
    else if (error) console.log("User not found or privacy restricted");
    
    setSearchLoading(false);
  }

  async function handleFollow(targetId: string) {
    const { error } = await supabase
      .from('follows')
      .insert({ follower_id: userId, following_id: targetId });

    if (!error) {
      alert("Vous suivez maintenant cet explorateur !");
      setFoundUser(null);
      setPhoneSearch('');
      // Refresh logic would go here
    }
  }

  return (
    <div className="md:col-span-2 space-y-6">
      {/* Tab Switcher */}
      <div className="flex p-1.5 bg-white border-2 border-beige-200 rounded-3xl shadow-sm">
        <button 
          onClick={() => setActiveTab('visites')}
          className={`flex-1 py-3 px-4 rounded-2xl text-xs font-black uppercase tracking-widest transition-all ${activeTab === 'visites' ? 'bg-abidjan-orange text-white shadow-lg' : 'text-beige-muted hover:bg-beige-50'}`}
        >
          📍 Mes Visites
        </button>
        <button 
          onClick={() => setActiveTab('reseau')}
          className={`flex-1 py-3 px-4 rounded-2xl text-xs font-black uppercase tracking-widest transition-all ${activeTab === 'reseau' ? 'bg-abidjan-blue text-white shadow-lg' : 'text-beige-muted hover:bg-beige-50'}`}
        >
          👥 Réseautage
        </button>
      </div>

      {activeTab === 'visites' && (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
           {/* HEATMAP */}
           <div className="bg-white rounded-[2.5rem] border-2 border-beige-200 p-2 shadow-xl shadow-black/5 h-64 overflow-hidden relative group">
              <PersonalHeatmap data={heatmapData} />
              <div className="absolute top-6 left-6 z-10 bg-white/90 backdrop-blur-md px-4 py-2 rounded-2xl border border-beige-200 shadow-xl">
                 <div className="text-[10px] font-black uppercase tracking-widest text-abidjan-orange">Carte de chaleur</div>
                 <div className="text-sm font-black text-beige-text">Ton territoire d&apos;exploration</div>
              </div>
              <div className="absolute bottom-6 right-6 z-10">
                 <div className="w-10 h-10 bg-white/90 backdrop-blur-md rounded-xl flex items-center justify-center text-xl shadow-lg border border-beige-200 group-hover:scale-110 transition-transform">🔥</div>
              </div>
           </div>

           <div className="bg-white rounded-[2.5rem] border-2 border-beige-200 p-8 shadow-xl shadow-black/5">
              <div className="flex items-center justify-between mb-8">
                 <h3 className="text-sm font-black uppercase tracking-[0.2em] text-beige-muted">Historique chronologique</h3>
                 <span className="text-[10px] font-black bg-beige-50 px-3 py-1.5 rounded-full border border-beige-200">{visits.length} visites</span>
              </div>

           <div className="space-y-4">
              {visits.map((v) => (
                <div key={v.id} className="flex gap-4 p-4 rounded-2xl bg-beige-50/50 border border-beige-100 hover:border-abidjan-orange/30 transition-all">
                   <div className="w-12 h-12 rounded-xl bg-white shadow-sm flex items-center justify-center text-2xl">
                      {v.place_id ? '🏢' : '🚐'}
                   </div>
                   <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-sm font-black text-beige-text truncate">{v.stop_name}</span>
                        <span className="text-[10px] font-bold text-beige-muted whitespace-nowrap">
                           {new Date(v.created_at).toLocaleDateString('fr-FR')}
                        </span>
                      </div>
                      <div className="text-[10px] text-beige-muted font-bold uppercase tracking-widest mt-0.5">{v.commune}</div>
                      {v.notes && (
                         <div className="mt-2 text-xs text-beige-text/70 italic bg-white/50 p-2 rounded-lg border border-beige-100">
                            &quot;{v.notes}&quot;
                         </div>
                      )}
                   </div>
                </div>
              ))}
              {visits.length === 0 && (
                <div className="text-center py-12">
                   <span className="text-4xl block mb-4 grayscale">🏜️</span>
                   <p className="text-sm font-bold text-beige-muted">Aucune visite enregistrée encore. Sors explorer Abidjan !</p>
                </div>
              )}
           </div>
           </div>
        </div>
      )}

      {activeTab === 'reseau' && (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
           {/* RECHERCHE AMIS */}
           <div className="bg-white rounded-[2.5rem] border-2 border-abidjan-blue/30 p-8 shadow-xl shadow-black/5">
              <h3 className="text-sm font-black uppercase tracking-[0.2em] text-abidjan-blue mb-6">Ajouter un explorateur</h3>
              <div className="flex flex-col sm:flex-row gap-3">
                 <input 
                   type="tel" 
                   value={phoneSearch}
                   onChange={e => setPhoneSearch(e.target.value)}
                   placeholder="Numéro de téléphone (ex: 07...)"
                   className="flex-1 bg-beige-50 border-2 border-beige-100 rounded-2xl px-5 py-4 text-sm font-black outline-none focus:border-abidjan-blue transition-all"
                 />
                 <button 
                   onClick={handleSearch}
                   disabled={searchLoading}
                   className="bg-abidjan-blue text-white px-8 py-4 rounded-2xl text-xs font-black uppercase tracking-widest shadow-lg shadow-abidjan-blue/20 active:scale-95 transition-all disabled:opacity-50"
                 >
                   {searchLoading ? 'Recherche...' : 'Rechercher'}
                 </button>
              </div>

              {foundUser && (
                <div className="mt-6 p-4 bg-abidjan-blue/5 border-2 border-abidjan-blue/20 rounded-2xl flex items-center justify-between animate-in zoom-in-95 duration-200">
                   <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-xl bg-white shadow-sm flex items-center justify-center text-2xl border border-beige-100">
                         {foundUser.avatar_emoji}
                      </div>
                      <div>
                         <div className="text-sm font-black text-beige-text">
                            {foundUser.display_name} {foundUser.is_verified_explorer && '✅'}
                         </div>
                         <div className="text-[10px] text-beige-muted font-bold uppercase tracking-widest">Explorateur Babimob</div>
                      </div>
                   </div>
                   <button 
                     onClick={() => handleFollow(foundUser.id)}
                     className="bg-abidjan-orange text-white px-4 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-tight shadow-md active:scale-95"
                   >
                     + Suivre
                   </button>
                </div>
              )}
           </div>

           {/* MES ABONNEMENTS */}
           <div className="bg-white rounded-[2.5rem] border-2 border-beige-200 p-8 shadow-xl shadow-black/5">
              <h3 className="text-sm font-black uppercase tracking-[0.2em] text-beige-muted mb-8">Mes explorateurs favoris</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                 {following.map((f) => (
                   <div key={f.id} className="flex items-center gap-3 p-4 rounded-2xl bg-beige-50/50 border border-beige-100">
                      <div className="w-10 h-10 rounded-xl bg-white shadow-sm flex items-center justify-center text-xl border border-beige-100">
                         {f.profiles?.avatar_emoji}
                      </div>
                      <div className="flex-1 min-w-0">
                         <div className="text-xs font-black text-beige-text truncate">
                            {f.profiles?.display_name} {f.profiles?.is_verified_explorer && '✅'}
                         </div>
                         <div className="text-[10px] text-beige-muted font-bold uppercase tracking-widest">Explorateur</div>
                      </div>
                      <Link 
                        href={hasMessenger ? `/app/chat/${f.profiles?.id}` : '#'} 
                        onClick={(e) => {
                          if (!hasMessenger) {
                            e.preventDefault();
                            setRequiredTier('messenger');
                            setShowWall(true);
                          }
                        }}
                        className="p-2 bg-white rounded-lg border border-beige-200 text-beige-muted hover:text-abidjan-blue hover:bg-abidjan-blue/5 transition-all"
                      >
                         <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
                      </Link>
                   </div>
                 ))}
              </div>
              {following.length === 0 && (
                <div className="text-center py-8">
                   <p className="text-xs font-bold text-beige-muted italic">Ajoute tes proches pour voir leurs explorations et discuter.</p>
                </div>
              )}
           </div>
        </div>
      )}

      <PremiumWall 
        isOpen={showWall} 
        onClose={() => setShowWall(false)} 
        requiredTier={requiredTier} 
      />
    </div>
  );
}
