'use client';

import { useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Ic } from './ui/Ic';
import { motion, AnimatePresence } from 'framer-motion';
import PlaceReviewModal from './PlaceReviewModal';
import PlacePhotoGallery from './PlacePhotoGallery';

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
  rating?: number;
  profiles: {
    display_name: string;
    avatar_emoji: string;
  } | null;
};

type Photo = {
  id: string;
  url: string;
  caption?: string;
  source: 'user' | 'partner' | 'pro';
  is_verified: boolean;
};

type Props = {
  placeId: string;
  placeName: string;
  initialCheckins: Checkin[];
  initialAdvice: Advice[];
  initialPhotos: Photo[];
  userId: string | null;
  userDisplayName: string;
  userAvatarEmoji: string;
  isVerifiedExplorer: boolean;
};

function timeAgo(iso: string): string {
  const mins = Math.round((Date.now() - new Date(iso).getTime()) / 60000);
  if (mins < 1)  return "À L'INSTANT";
  if (mins < 60) return `${mins} MIN`;
  if (mins < 1440) return `${Math.floor(mins / 60)}H`;
  return `${Math.floor(mins / 1440)} J`;
}

export default function PlaceSocialSections({ 
  placeId, 
  placeName, 
  initialCheckins, 
  initialAdvice, 
  initialPhotos,
  userId, 
  userDisplayName,
  userAvatarEmoji,
  isVerifiedExplorer 
}: Props) {
  const [advice, setAdvice] = useState<Advice[]>(initialAdvice);
  const [photos, setPhotos] = useState<Photo[]>(initialPhotos);
  const [modalOpen, setModalOpen] = useState(false);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(initialAdvice.length === 20);

  const supabase = createClient();

  const publicCheckins = initialCheckins.filter(c => c.is_public);

  async function loadMoreAdvice() {
    if (isLoadingMore || !hasMore || advice.length === 0) return;
    setIsLoadingMore(true);

    try {
      const lastAdvice = advice[advice.length - 1];
      
      const { data, error } = await supabase
        .from('place_advice')
        .select('id, content, created_at, is_question, rating, profiles(display_name, avatar_emoji)')
        .eq('place_id', placeId)
        .lt('created_at', lastAdvice.created_at)
        .order('created_at', { ascending: false })
        .limit(20);

      if (error) throw error;

      if (data && data.length > 0) {
        setAdvice(prev => [...prev, ...data as any]);
        setHasMore(data.length === 20);
      } else {
        setHasMore(false);
      }
    } catch (err) {
      console.error('Error loading more advice:', err);
    } finally {
      setIsLoadingMore(false);
    }
  }

  async function handleNewAdvice(newEntry: any) {
    if (!newEntry || !userId) return;

    const completeEntry: Advice = {
      ...newEntry,
      profiles: {
        display_name: userDisplayName,
        avatar_emoji: userAvatarEmoji
      }
    };

    setAdvice(prev => [completeEntry, ...prev]);
    
    // If a photo was added, we might want to refresh photos list or just wait for next load
    // For now, let's just keep it simple. If we want dynamic photos, we'd need more logic.
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 28 }}>
      
      {/* 1. PHOTO GALLERY SECTION */}
      <PlacePhotoGallery 
        photos={photos} 
        onAddPhoto={userId ? () => setModalOpen(true) : undefined} 
      />

      {/* 2. SOCIAL TRACES */}
      <div style={{ 
        background: '#fff', padding: 24, borderRadius: 32,
        boxShadow: '0 4px 24px rgba(0,0,0,0.03)',
        border: '1px solid rgba(0,0,0,0.02)'
      }}>
         <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div style={{ width: 32, height: 32, borderRadius: 10, background: 'var(--orange-pale)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Ic.Users s={18} color="var(--orange)" />
              </div>
              <h2 style={{ fontSize: 13, fontWeight: 900, letterSpacing: 1, margin: 0 }}>DERNIERS PASSAGES</h2>
            </div>
            <div style={{ 
              fontSize: 10, fontWeight: 900, background: 'var(--cream-2)', 
              padding: '6px 12px', borderRadius: 12, color: 'var(--muted)',
              border: '1px solid rgba(0,0,0,0.05)'
            }}>
               {publicCheckins.length} VISIBLES
            </div>
         </div>

         {publicCheckins.length === 0 ? (
           <div style={{ 
             padding: 32, borderRadius: 24, background: 'var(--cream-2)', 
             textAlign: 'center', fontSize: 14, color: 'var(--muted)', fontWeight: 600,
             border: '2px dashed rgba(0,0,0,0.06)'
           }}>
              Sois le premier à marquer ton passage ici ! 📍
           </div>
         ) : (
           <div style={{ display: 'flex', gap: 12, overflowX: 'auto', paddingBottom: 8 }} className="no-scrollbar">
              {publicCheckins.map((c) => (
                <motion.div 
                  key={c.id} 
                  whileTap={{ scale: 0.95 }}
                  style={{ 
                    display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10,
                    background: 'var(--cream-2)', padding: '16px', borderRadius: 24,
                    minWidth: 100, border: '1px solid rgba(0,0,0,0.02)'
                  }}
                >
                   <div style={{ 
                     width: 52, height: 52, borderRadius: '50%', background: '#fff', 
                     display: 'flex', alignItems: 'center', justifyContent: 'center', 
                     fontSize: 24, boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
                     border: '2px solid var(--cream)'
                   }}>
                      {c.avatar_emoji}
                   </div>
                   <div style={{ textAlign: 'center' }}>
                      <div style={{ fontSize: 12, fontWeight: 800, color: 'var(--ink)', maxWidth: 80, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{c.display_name}</div>
                      <div style={{ fontSize: 9, fontWeight: 900, color: 'var(--orange)', marginTop: 4 }}>{timeAgo(c.created_at)}</div>
                   </div>
                </motion.div>
              ))}
           </div>
         )}
      </div>

      {/* 3. REVIEWS & QUESTIONS */}
      <div style={{ 
        background: '#fff', padding: 24, borderRadius: 32,
        boxShadow: '0 4px 24px rgba(0,0,0,0.03)',
        border: '1px solid rgba(0,0,0,0.02)'
      }}>
         <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div style={{ width: 32, height: 32, borderRadius: 10, background: 'var(--blue-pale)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Ic.Chat s={18} color="var(--blue)" />
              </div>
              <h2 style={{ fontSize: 13, fontWeight: 900, letterSpacing: 1, margin: 0 }}>AVIS & QUESTIONS</h2>
            </div>
            
            {userId && (
              <button 
                onClick={() => setModalOpen(true)}
                className="press"
                style={{
                  background: 'var(--orange)', color: '#fff', border: 'none',
                  padding: '8px 16px', borderRadius: 16, fontSize: 11, fontWeight: 900,
                  cursor: 'pointer', boxShadow: '0 4px 12px rgba(242,108,26,0.2)'
                }}
              >
                NOTER CE LIEU
              </button>
            )}
         </div>

         {!userId && (
            <div style={{ 
              marginBottom: 24, padding: 24, borderRadius: 24, background: 'var(--cream-2)', 
              textAlign: 'center', border: '2px dashed rgba(0,0,0,0.06)'
            }}>
               <p style={{ fontSize: 13, fontWeight: 800, color: 'var(--muted)', margin: 0 }}>CONNECTE-TOI POUR PARTAGER TON AVIS</p>
            </div>
         )}

         <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
            <AnimatePresence initial={false}>
              {advice.map((item) => (
                <motion.div 
                  layout
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  key={item.id} 
                  style={{ display: 'flex', gap: 16 }}
                >
                    <div style={{ 
                      width: 44, height: 44, borderRadius: 14, background: 'var(--cream-2)', 
                      display: 'flex', alignItems: 'center', justifyContent: 'center', 
                      fontSize: 22, flexShrink: 0, border: '1px solid rgba(0,0,0,0.02)'
                    }}>
                      {item.profiles?.avatar_emoji ?? '👤'}
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
                          <div style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
                            <span style={{ fontSize: 14, fontWeight: 800, color: 'var(--ink)' }}>{item.profiles?.display_name ?? 'Anonyme'}</span>
                            <span style={{ fontSize: 10, fontWeight: 900, color: 'var(--muted)' }}>{timeAgo(item.created_at)}</span>
                          </div>
                          {item.rating && (
                            <div style={{ display: 'flex', gap: 2 }}>
                               {[1, 2, 3, 4, 5].map(s => (
                                 <Ic.Star key={s} s={10} fill={s <= item.rating!} color={s <= item.rating! ? 'var(--orange)' : 'var(--line-strong)'} />
                               ))}
                            </div>
                          )}
                      </div>
                      <div style={{ 
                        background: 'var(--cream-2)', padding: '16px 20px', borderRadius: 24,
                        borderTopLeftRadius: 4, fontSize: 15, fontWeight: 600, color: 'var(--ink)',
                        lineHeight: 1.5, border: '1px solid rgba(0,0,0,0.01)'
                      }}>
                          {item.content}
                      </div>
                    </div>
                </motion.div>
              ))}
            </AnimatePresence>
            
            {advice.length === 0 && (
              <div style={{ textAlign: 'center', padding: '32px 0', opacity: 0.5 }}>
                <div style={{ fontSize: 40, marginBottom: 12 }}>💬</div>
                <p style={{ fontSize: 12, fontWeight: 900, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: 1 }}>Aucun avis pour le moment</p>
              </div>
            )}

            {hasMore && advice.length > 0 && (
              <div style={{ display: 'flex', justifyContent: 'center', marginTop: 16 }}>
                <button
                  onClick={loadMoreAdvice}
                  disabled={isLoadingMore}
                  className="press"
                  style={{
                    background: 'var(--cream-2)', color: 'var(--ink)', border: '1px solid rgba(0,0,0,0.05)',
                    padding: '12px 24px', borderRadius: 20, fontSize: 12, fontWeight: 900,
                    cursor: isLoadingMore ? 'wait' : 'pointer', transition: 'all 0.2s',
                    boxShadow: '0 4px 12px rgba(0,0,0,0.02)'
                  }}
                >
                  {isLoadingMore ? 'CHARGEMENT...' : "VOIR PLUS D'AVIS"}
                </button>
              </div>
            )}
         </div>
      </div>

      <AnimatePresence>
        {modalOpen && userId && (
          <PlaceReviewModal 
            placeId={placeId}
            placeName={placeName}
            userId={userId}
            onClose={() => setModalOpen(false)}
            onSuccess={handleNewAdvice}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
