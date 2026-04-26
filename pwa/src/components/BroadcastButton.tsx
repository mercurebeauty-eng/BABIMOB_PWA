'use client';

import { useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import PremiumWall from './PremiumWall';
import { motion, AnimatePresence } from 'framer-motion';

type Props = {
  userId: string;
  currentTier: 'free' | 'messenger' | 'social' | 'pro';
};

export default function BroadcastButton({ userId, currentTier }: Props) {
  const supabase = createClient();
  const [showWall, setShowWall] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [text, setText] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [geoError, setGeoError] = useState<string | null>(null);
  const isPro = currentTier === 'pro';

  function open() {
    if (!isPro) { setShowWall(true); return; }
    setText('');
    setGeoError(null);
    setSuccess(false);
    setShowModal(true);
  }

  async function handleSend() {
    if (!text.trim() || loading) return;
    setLoading(true);
    setGeoError(null);

    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        await supabase.from('profiles').update({
          last_broadcast_at: new Date().toISOString(),
          broadcast_text: text.trim(),
          broadcast_lat: pos.coords.latitude,
          broadcast_lon: pos.coords.longitude,
        }).eq('id', userId);
        setLoading(false);
        setSuccess(true);
        setTimeout(() => setShowModal(false), 1800);
      },
      () => {
        setLoading(false);
        setGeoError('GPS désactivé. Active-le pour diffuser !');
      }
    );
  }

  return (
    <>
      <button
        onClick={open}
        className={`bm-fab relative ${isPro ? 'bg-bm-orange text-white shadow-[0_0_20px_rgba(255,107,0,0.4)] animate-pulse' : 'bg-white/5 border border-white/10 text-white/40'}`}
        title="Diffuser (Pro)"
      >
        <span className="text-2xl">📢</span>
        {!isPro && (
           <span className="absolute -top-1 -right-1 text-[8px] font-black bg-bm-orange text-white px-1.5 py-0.5 rounded-full border border-bm-obsidian">PRO</span>
        )}
      </button>

      <AnimatePresence>
        {showModal && (
          <div className="fixed inset-0 z-[700] flex items-end sm:items-center justify-center p-0 sm:p-5">
            {/* Backdrop */}
            <motion.div 
               initial={{ opacity: 0 }} 
               animate={{ opacity: 1 }} 
               exit={{ opacity: 0 }}
               onClick={() => !loading && setShowModal(false)}
               className="absolute inset-0 bg-bm-obsidian/60 backdrop-blur-md"
            />
            
            {/* Modal Content */}
            <motion.div 
               initial={{ y: '100%', opacity: 0 }} 
               animate={{ y: 0, opacity: 1 }} 
               exit={{ y: '100%', opacity: 0 }}
               transition={{ type: 'spring', damping: 25, stiffness: 200 }}
               className="w-full max-w-sm bg-bm-obsidian border-t sm:border border-white/10 rounded-t-[3rem] sm:rounded-[3rem] p-8 pb-12 sm:pb-8 shadow-2xl relative z-10 space-y-6"
               onClick={e => e.stopPropagation()}
            >
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-2xl bg-bm-orange/20 flex items-center justify-center text-3xl">📢</div>
                <div>
                   <h3 className="text-xl font-black italic uppercase tracking-tight text-white mb-0.5">Diffusion Live</h3>
                   <div className="text-[9px] font-black text-white/30 uppercase tracking-[0.2em] italic">Visible par tous à Abidjan</div>
                </div>
              </div>

              <div className="relative group">
                 <textarea
                   autoFocus
                   value={text}
                   onChange={e => setText(e.target.value.slice(0, 80))}
                   placeholder="Que se passe-t-il ici ?"
                   rows={3}
                   className="w-full bg-white/5 border border-white/10 focus:border-bm-orange/50 rounded-[2rem] px-6 py-5 text-sm font-medium text-white outline-none resize-none transition-all placeholder:text-white/20"
                 />
                 <div className="absolute bottom-4 right-6 text-[10px] font-black text-white/20 italic tracking-widest">{text.length}/80</div>
              </div>

              {geoError && (
                 <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="p-4 rounded-2xl bg-red-500/10 border border-red-500/30 text-[10px] font-black uppercase text-red-500 tracking-widest text-center">
                    ⚠️ {geoError}
                 </motion.div>
              )}

              {success ? (
                 <motion.div initial={{ scale: 0.9 }} animate={{ scale: 1 }} className="py-5 text-center text-sm font-black text-bm-green uppercase tracking-widest bg-bm-green/10 rounded-[2rem] border border-bm-green/20">
                    🚀 C'est en ligne !
                 </motion.div>
              ) : (
                 <div className="grid grid-cols-2 gap-4 pt-2">
                    <button
                       onClick={() => setShowModal(false)}
                       disabled={loading}
                       className="py-5 rounded-[2rem] border border-white/10 text-[10px] font-black uppercase tracking-widest text-white/40 hover:bg-white/5 transition-all"
                    >
                       Annuler
                    </button>
                    <button
                       onClick={handleSend}
                       disabled={!text.trim() || loading}
                       className="py-5 rounded-[2rem] bg-bm-orange text-white text-[10px] font-black uppercase tracking-widest shadow-2xl shadow-bm-orange/20 active:scale-95 transition-all disabled:opacity-30"
                    >
                       {loading ? (
                          <div className="flex items-center justify-center gap-2">
                             <div className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                             GPS...
                          </div>
                       ) : 'Diffuser'}
                    </button>
                 </div>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <PremiumWall isOpen={showWall} onClose={() => setShowWall(false)} requiredTier="pro" />
    </>
  );
}
