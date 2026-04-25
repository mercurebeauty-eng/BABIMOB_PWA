'use client';

import { useState } from 'react';
import { createClient } from '@/lib/supabase/client';

type Checkin = {
  id: string;
  created_at: string;
  display_name: string;
  avatar_emoji: string;
  is_public: boolean;
};

type Advice = {
  id: string;
  content: string;
  created_at: string;
  is_question: boolean;
  profiles: {
    display_name: string;
    avatar_emoji: string;
  } | null;
};

type Props = {
  placeId: string;
  initialCheckins: Checkin[];
  initialAdvice: Advice[];
  userId: string | null;
  isVerifiedExplorer: boolean;
};

function timeAgo(iso: string): string {
  const mins = Math.round((Date.now() - new Date(iso).getTime()) / 60000);
  if (mins < 1)  return "à l'instant";
  if (mins < 60) return `il y a ${mins} min`;
  if (mins < 1440) return `il y a ${Math.floor(mins / 60)} h`;
  return `il y a ${Math.floor(mins / 1440)} j`;
}

export default function PlaceSocialSections({ placeId, initialCheckins, initialAdvice, userId, isVerifiedExplorer }: Props) {
  const supabase = createClient();
  const [advice, setAdvice] = useState<Advice[]>(initialAdvice);
  const [newContent, setNewContent] = useState('');
  const [loading, setLoading] = useState(false);

  // Filter public checkins
  const publicCheckins = initialCheckins.filter(c => c.is_public);

  async function handlePostAdvice() {
    if (!newContent.trim() || !userId) return;
    setLoading(true);

    const { data: profile } = await supabase
      .from('profiles')
      .select('display_name, avatar_emoji')
      .eq('id', userId)
      .single();

    const { data, error } = await supabase
      .from('place_advice')
      .insert({
        place_id: placeId,
        user_id: userId,
        content: newContent,
        is_question: true
      })
      .select('id, content, created_at, is_question')
      .single();

    if (error) {
      alert(error.message);
    } else if (data) {
      const newEntry: Advice = {
        ...data,
        profiles: profile || null
      };
      setAdvice([newEntry, ...advice]);
      setNewContent('');
    }
    setLoading(false);
  }

  return (
    <div className="space-y-6">
      {/* 1. SOCIAL TRACES - Qui est passé par ici ? */}
      <div className="bg-white rounded-[2.5rem] border-2 border-beige-200 shadow-xl shadow-black/5 p-8">
         <div className="flex items-center justify-between mb-6">
            <h2 className="font-display font-black text-xl">Derniers explorateurs</h2>
            <div className="text-[10px] font-black uppercase tracking-widest px-3 py-1.5 bg-abidjan-blue/10 text-abidjan-blue rounded-full border border-abidjan-blue/20">
               {publicCheckins.length} traces visibles
            </div>
         </div>

         {publicCheckins.length === 0 ? (
           <p className="text-sm text-beige-muted font-medium bg-beige-50 rounded-2xl p-4 border border-beige-100 border-dashed text-center">
              Les traces sont privées par défaut. Sois le premier à partager ton passage ! 📍
           </p>
         ) : (
           <div className="space-y-4">
              {publicCheckins.map((c) => (
                <div key={c.id} className="flex items-center gap-3">
                   <div className="w-10 h-10 rounded-full bg-beige-50 flex items-center justify-center text-lg shadow-inner ring-2 ring-beige-100">
                      {c.avatar_emoji}
                   </div>
                   <div className="flex-1">
                      <div className="text-xs font-black text-beige-text">{c.display_name} était ici</div>
                      <div className="text-[10px] text-beige-muted font-bold">{timeAgo(c.created_at)}</div>
                   </div>
                </div>
              ))}
           </div>
         )}
      </div>

      {/* 2. QUI EST DÉJÀ ALLÉ ? (Q&A / Avis) */}
      <div className="bg-white rounded-[2.5rem] border-2 border-beige-200 shadow-xl shadow-black/5 p-8">
         <div className="flex items-center justify-between mb-6">
            <h2 className="font-display font-black text-xl">Qui est déjà allé ?</h2>
            <span className="text-xs font-black bg-beige-50 px-3 py-1 rounded-lg text-beige-muted border border-beige-100">COMMUNAUTÉ</span>
         </div>

         {/* Input simple pour poser une question / donner un avis */}
         {userId ? (
            <div className="mb-8 p-1 bg-beige-50 rounded-2xl border-2 border-beige-100 focus-within:border-abidjan-orange transition-all">
               <div className="flex items-center gap-2 px-3 py-3">
                  <textarea 
                    value={newContent}
                    onChange={(e) => setNewContent(e.target.value)}
                    placeholder="Pose une question ou demande un avis..."
                    className="flex-1 bg-transparent border-none outline-none text-sm placeholder:text-beige-muted/60 resize-none font-medium"
                    rows={2}
                  />
                  <button 
                    onClick={handlePostAdvice}
                    disabled={loading || !newContent.trim()}
                    className="p-3 bg-abidjan-orange text-white rounded-xl shadow-lg shadow-abidjan-orange/20 active:scale-95 disabled:opacity-50 transition-all"
                  >
                    {loading ? '...' : '✈️'}
                  </button>
               </div>
            </div>
         ) : (
            <div className="mb-8 p-4 bg-beige-50 rounded-2xl border border-beige-100 text-center">
               <p className="text-xs text-beige-muted font-bold">Connecte-toi pour interagir avec la communauté.</p>
            </div>
         )}

         {/* Liste des avis/questions */}
         <div className="space-y-6">
            {advice.map((item) => (
               <div key={item.id} className="relative group">
                  <div className="flex gap-4">
                     <div className="w-9 h-9 rounded-xl bg-beige-50 flex items-center justify-center text-base shadow-sm ring-1 ring-beige-100 flex-shrink-0">
                        {item.profiles?.avatar_emoji ?? '👤'}
                     </div>
                     <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                           <span className="text-xs font-black text-beige-text">{item.profiles?.display_name ?? 'Inconnu'}</span>
                           <span className="text-[10px] text-beige-muted font-bold">· {timeAgo(item.created_at)}</span>
                        </div>
                        <p className="text-sm text-beige-text/80 font-medium leading-relaxed bg-beige-50/50 p-3 rounded-2xl rounded-tl-none border border-beige-100/50">
                           {item.content}
                        </p>
                     </div>
                  </div>
               </div>
            ))}
            {advice.length === 0 && (
              <div className="text-center py-6">
                <span className="text-3xl block mb-2 opacity-30">💬</span>
                <p className="text-xs text-beige-muted font-bold italic">Aucune question pour le moment. Sois le premier !</p>
              </div>
            )}
         </div>
      </div>
    </div>
  );
}
