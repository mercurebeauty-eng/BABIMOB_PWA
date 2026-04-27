'use client';

import { useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Ic } from './ui/Ic';

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
  if (mins < 1)  return "À L'INSTANT";
  if (mins < 60) return `${mins} MIN`;
  if (mins < 1440) return `${Math.floor(mins / 60)}H`;
  return `${Math.floor(mins / 1440)} J`;
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
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      
      {/* 1. SOCIAL TRACES */}
      <div style={{ 
        background: '#fff', padding: 24, borderRadius: 28,
        boxShadow: '0 4px 20px rgba(0,0,0,0.03)'
      }}>
         <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <Ic.Pin s={18} color="var(--orange)" />
              <h2 style={{ fontSize: 12, fontWeight: 900, letterSpacing: 0.8, margin: 0 }}>DERNIERS PASSAGES</h2>
            </div>
            <div style={{ 
              fontSize: 10, fontWeight: 900, background: 'var(--cream-2)', 
              padding: '4px 10px', borderRadius: 12, color: 'var(--muted)'
            }}>
               {publicCheckins.length} VISIBLES
            </div>
         </div>

         {publicCheckins.length === 0 ? (
           <div style={{ 
             padding: 20, borderRadius: 20, background: 'var(--cream-2)', 
             textAlign: 'center', fontSize: 13, color: 'var(--muted)', fontWeight: 600,
             border: '1.5px dashed rgba(0,0,0,0.05)'
           }}>
              Sois le premier à partager ton passage ! 📍
           </div>
         ) : (
           <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {publicCheckins.map((c) => (
                <div key={c.id} className="press" style={{ 
                  display: 'flex', alignItems: 'center', gap: 12,
                  background: 'var(--cream-2)', padding: 12, borderRadius: 20
                }}>
                   <div style={{ 
                     width: 40, height: 40, borderRadius: '50%', background: '#fff', 
                     display: 'flex', alignItems: 'center', justifyContent: 'center', 
                     fontSize: 18, boxShadow: '0 2px 8px rgba(0,0,0,0.05)'
                   }}>
                      {c.avatar_emoji}
                   </div>
                   <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--ink)' }}>{c.display_name}</div>
                      <div style={{ fontSize: 10, fontWeight: 900, color: 'var(--orange)', marginTop: 2 }}>{timeAgo(c.created_at)}</div>
                   </div>
                </div>
              ))}
           </div>
         )}
      </div>

      {/* 2. COMMUNITY Q&A */}
      <div style={{ 
        background: '#fff', padding: 24, borderRadius: 28,
        boxShadow: '0 4px 20px rgba(0,0,0,0.03)'
      }}>
         <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 20 }}>
            <Ic.Chat s={18} color="var(--orange)" />
            <h2 style={{ fontSize: 12, fontWeight: 900, letterSpacing: 0.8, margin: 0 }}>C'EST COMMENT ?</h2>
         </div>

         {userId ? (
            <div style={{ 
              marginBottom: 24, padding: 4, borderRadius: 24, 
              background: 'var(--cream-2)', border: '1.5px solid rgba(0,0,0,0.05)'
            }}>
               <div style={{ display: 'flex', gap: 12, padding: 8 }}>
                  <textarea 
                    value={newContent}
                    onChange={(e) => setNewContent(e.target.value)}
                    placeholder="Une question ? Un avis sur le lieu ?"
                    style={{ 
                      flex: 1, background: 'transparent', border: 'none', outline: 'none',
                      padding: 12, fontSize: 14, fontWeight: 600, color: 'var(--ink)',
                      minHeight: 60, resize: 'none'
                    }}
                  />
                  <button 
                    onClick={handlePostAdvice}
                    disabled={loading || !newContent.trim()}
                    className="press"
                    style={{ 
                      width: 48, height: 48, borderRadius: 16, background: 'var(--orange)', 
                      color: '#fff', border: 'none', cursor: 'pointer',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      boxShadow: '0 4px 12px rgba(242,108,26,0.2)', fontSize: 20
                    }}
                  >
                    {loading ? '...' : '🚀'}
                  </button>
               </div>
            </div>
         ) : (
            <div style={{ 
              marginBottom: 24, padding: 20, borderRadius: 20, background: 'var(--cream-2)', 
              textAlign: 'center', border: '1.5px dashed rgba(0,0,0,0.05)'
            }}>
               <p style={{ fontSize: 12, fontWeight: 800, color: 'var(--muted)', margin: 0 }}>CONNECTE-TOI POUR INTERAGIR</p>
            </div>
         )}

         <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            {advice.map((item) => (
               <div key={item.id} style={{ display: 'flex', gap: 14 }}>
                  <div style={{ 
                    width: 36, height: 36, borderRadius: 12, background: 'var(--cream-2)', 
                    display: 'flex', alignItems: 'center', justifyContent: 'center', 
                    fontSize: 18, flexShrink: 0 
                  }}>
                     {item.profiles?.avatar_emoji ?? '👤'}
                  </div>
                  <div style={{ flex: 1 }}>
                     <div style={{ display: 'flex', alignItems: 'baseline', gap: 6, marginBottom: 4 }}>
                        <span style={{ fontSize: 13, fontWeight: 800, color: 'var(--ink)' }}>{item.profiles?.display_name ?? 'INCONNU'}</span>
                        <span style={{ fontSize: 9, fontWeight: 900, color: 'var(--muted)' }}>{timeAgo(item.created_at)}</span>
                     </div>
                     <div style={{ 
                       background: 'var(--cream-2)', padding: '12px 16px', borderRadius: 20,
                       borderTopLeftRadius: 4, fontSize: 14, fontWeight: 500, color: 'var(--ink)',
                       lineHeight: 1.5
                     }}>
                        {item.content}
                     </div>
                  </div>
               </div>
            ))}
            
            {advice.length === 0 && (
              <div style={{ textAlign: 'center', padding: '20px 0' }}>
                <div style={{ fontSize: 24, marginBottom: 8, opacity: 0.3 }}>💬</div>
                <p style={{ fontSize: 11, fontWeight: 800, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: 0.5 }}>Aucune discussion pour le moment</p>
              </div>
            )}
         </div>
      </div>
    </div>
  );
}
