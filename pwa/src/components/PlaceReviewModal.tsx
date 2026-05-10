'use client';

import { useState, useRef } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Ic } from '@/components/ui/Ic';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';
import { useXP } from '@/components/providers/XPProvider';
import imageCompression from 'browser-image-compression';

type ReviewTag = 'incroyable' | 'cosy' | 'bien' | 'moyen' | 'ennuyeux' | 'bruyant' | 'cher';

const TAGS: { id: ReviewTag; label: string; emoji: string; color: string }[] = [
  { id: 'incroyable', label: 'Incroyable', emoji: '✨', color: 'var(--orange-deep)' },
  { id: 'cosy',       label: 'Cosy',       emoji: '🕯️', color: 'var(--blue)' },
  { id: 'bien',       label: 'Bien',       emoji: '👍', color: 'var(--green)' },
  { id: 'moyen',      label: 'Moyen',      emoji: '😐', color: 'var(--gold)' },
  { id: 'ennuyeux',   label: 'Ennuyeux',   emoji: '😴', color: 'var(--muted)' },
  { id: 'bruyant',    label: 'Bruyant',    emoji: '🔊', color: '#94a3b8' },
];

type Props = {
  placeId: string;
  placeName: string;
  userId: string;
  onClose: () => void;
  onSuccess: (data: any) => void;
};

export default function PlaceReviewModal({ placeId, placeName, userId, onClose, onSuccess }: Props) {
  const supabase = createClient();
  const [selectedTag, setSelectedTag] = useState<ReviewTag>('bien');
  const [rating, setRating] = useState(5);
  const [content, setContent] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const { addXP } = useXP();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const currentTag = TAGS.find(t => t.id === selectedTag)!;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (f) {
      if (f.size > 5 * 1024 * 1024) {
        toast.error("Fichier trop lourd", { description: "Max 5MB" });
        return;
      }
      setFile(f);
      const reader = new FileReader();
      reader.onloadend = () => setPreview(reader.result as string);
      reader.readAsDataURL(f);
    }
  };

  async function handleSubmit() {
    if (!content.trim() || loading) return;
    setLoading(true);

    try {
      let mediaUrl = null;

      // 1. Upload photo if exists
      if (file) {
        // Compression
        const options = {
          maxSizeMB: 1,
          maxWidthOrHeight: 1920,
          useWebWorker: true,
        };
        const compressedFile = await imageCompression(file, options);

        const fileExt = file.name.split('.').pop() || 'jpg';
        const fileName = `${placeId}/${userId}-${Date.now()}.${fileExt}`;
        
        const { data: uploadData, error: uploadError } = await supabase.storage
          .from('stories') // Reusing stories bucket
          .upload(fileName, compressedFile, { cacheControl: '3600', upsert: false });

        if (uploadError) throw uploadError;

        const { data: { publicUrl } } = supabase.storage
          .from('stories')
          .getPublicUrl(fileName);
        
        mediaUrl = publicUrl;
      }

      // 2. Insert Review
      const fullContent = `[${currentTag.label}] ${content.trim()}`;
      const startOfMonth = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString();
      const { count: monthlyCount } = await supabase
        .from('place_advice')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', userId)
        .gte('created_at', startOfMonth);

      const { data: adviceData, error: dbError } = await supabase
        .from('place_advice')
        .insert({
          place_id: placeId,
          user_id: userId,
          content: fullContent,
          rating: rating,
          is_question: false,
          xp_earned: (monthlyCount ?? 0) < 5 ? 15 : 0
        })
        .select('id, content, created_at, is_question, rating')
        .single();

      if (dbError) throw dbError;

      // 3. Insert Photo Record if exists
      if (mediaUrl) {
        await supabase.from('place_photos').insert({
          place_id: placeId,
          user_id: userId,
          url: mediaUrl,
          caption: content.trim().slice(0, 50),
          source: 'user'
        });
      }

      // 4. Award XP
      const xpEarned = (monthlyCount ?? 0) < 5 ? 15 : 0;
      if (xpEarned > 0) {
        await supabase.rpc('award_xp', { p_xp: xpEarned });
        addXP(xpEarned);
      }

      toast.success("Avis publié !", {
        description: xpEarned > 0 ? `+${xpEarned} XP gagnés` : "Merci pour ton partage !"
      });

      setSuccess(true);
      setTimeout(() => { 
        onSuccess(adviceData); 
        onClose(); 
      }, 1500);

    } catch (err: any) {
      console.error('Error submitting review:', err);
      toast.error("Erreur lors de la publication", { description: err.message });
    } finally {
      setLoading(false);
    }
  }

  return (
    <div
      onClick={() => !loading && onClose()}
      style={{ 
        position: 'fixed', inset: 0, zIndex: 1000, 
        background: 'rgba(26,20,16,0.6)', backdropFilter: 'blur(10px)', 
        display: 'flex', alignItems: 'flex-end',
      }}
    >
      <motion.div
        initial={{ y: '100%' }}
        animate={{ y: 0 }}
        exit={{ y: '100%' }}
        onClick={e => e.stopPropagation()}
        style={{ 
          width: '100%', maxWidth: 500, margin: '0 auto', 
          background: 'var(--cream)', borderRadius: '32px 32px 0 0', 
          padding: '24px 20px calc(32px + env(safe-area-inset-bottom, 0px))', 
          boxShadow: '0 -10px 40px rgba(0,0,0,0.2)',
          maxHeight: '90vh', overflowY: 'auto'
        }}
        className="no-scrollbar"
      >
        <div style={{ width: 40, height: 4, background: 'var(--line-strong)', borderRadius: 2, margin: '0 auto 24px', opacity: 0.3 }} />

        <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 28 }}>
          <div style={{ 
            width: 52, height: 52, borderRadius: 16, 
            background: 'var(--orange)', color: '#fff', 
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 24, boxShadow: '0 8px 20px rgba(242,108,26,0.2)'
          }}>
            💬
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 18, fontWeight: 900, color: 'var(--ink)' }}>C'est comment ?</div>
            <div style={{ fontSize: 13, color: 'var(--muted)', fontWeight: 600 }}>{placeName}</div>
          </div>
          <button onClick={onClose} className="press" style={{ width: 40, height: 40, background: 'var(--cream-2)', borderRadius: 12, border: 'none', color: 'var(--ink)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Ic.X s={20} />
          </button>
        </div>

        {success ? (
          <div style={{ textAlign: 'center', padding: '40px 0' }}>
            <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} style={{ fontSize: 64, marginBottom: 16 }}>✨</motion.div>
            <div style={{ fontSize: 20, fontWeight: 900, color: 'var(--green)' }}>AVIS PUBLIÉ !</div>
            <div style={{ fontSize: 14, color: 'var(--muted)', marginTop: 8, fontWeight: 600 }}>Merci pour ta contribution à la communauté.</div>
          </div>
        ) : (
          <>
            <div style={{ textAlign: 'center', marginBottom: 28 }}>
              <div style={{ fontSize: 11, fontWeight: 900, color: 'var(--muted)', letterSpacing: 1.2, textTransform: 'uppercase', marginBottom: 12 }}>Ta note</div>
              <div style={{ display: 'flex', justifyContent: 'center', gap: 8 }}>
                {[1, 2, 3, 4, 5].map(s => (
                  <button key={s} onClick={() => setRating(s)} className="press" style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 4 }}>
                    <Ic.Star s={32} fill={s <= rating} color={s <= rating ? 'var(--orange)' : 'var(--line-strong)'} />
                  </button>
                ))}
              </div>
            </div>

            <div style={{ fontSize: 11, fontWeight: 900, color: 'var(--muted)', letterSpacing: 1.2, textTransform: 'uppercase', marginBottom: 16 }}>Quelle est l'ambiance ?</div>
            <div style={{ display: 'flex', gap: 10, marginBottom: 28, overflowX: 'auto', paddingBottom: 8 }} className="no-scrollbar">
              {TAGS.map(tag => (
                <button
                  key={tag.id}
                  onClick={() => setSelectedTag(tag.id)}
                  className="press"
                  style={{
                    display: 'flex', alignItems: 'center', gap: 8, padding: '12px 18px', borderRadius: 18,
                    border: 'none', whiteSpace: 'nowrap',
                    background: selectedTag === tag.id ? tag.color : 'var(--cream-2)',
                    color: selectedTag === tag.id ? '#fff' : 'var(--ink)',
                    fontSize: 14, fontWeight: 800, cursor: 'pointer',
                    boxShadow: selectedTag === tag.id ? `0 8px 20px ${tag.color}40` : 'none',
                    transition: 'all 0.2s'
                  }}
                >
                  <span style={{ fontSize: 18 }}>{tag.emoji}</span> {tag.label}
                </button>
              ))}
            </div>

            <div style={{ marginBottom: 24 }}>
              <div style={{ fontSize: 11, fontWeight: 900, color: 'var(--muted)', letterSpacing: 1.2, textTransform: 'uppercase', marginBottom: 12 }}>Ton avis</div>
              <textarea
                value={content}
                onChange={e => setContent(e.target.value.slice(0, 280))}
                placeholder={`Détaille un peu ton expérience...`}
                rows={4}
                style={{ 
                  width: '100%', background: 'var(--cream-2)', border: '2px solid transparent', 
                  borderRadius: 24, padding: '20px', fontSize: 16, fontWeight: 600, 
                  color: 'var(--ink)', outline: 'none', resize: 'none', fontFamily: 'inherit', 
                  boxSizing: 'border-box'
                }}
              />
            </div>

            <div style={{ marginBottom: 28 }}>
              <div style={{ fontSize: 11, fontWeight: 900, color: 'var(--muted)', letterSpacing: 1.2, textTransform: 'uppercase', marginBottom: 12 }}>Ajouter une photo (optionnel)</div>
              <input type="file" ref={fileInputRef} hidden accept="image/*" onChange={handleFileChange} />
              
              {preview ? (
                <div style={{ position: 'relative', width: 100, height: 100, borderRadius: 20, overflow: 'hidden' }}>
                  <img src={preview} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  <button 
                    onClick={() => { setFile(null); setPreview(null); }}
                    style={{ position: 'absolute', top: 4, right: 4, background: 'rgba(0,0,0,0.5)', border: 'none', borderRadius: '50%', width: 24, height: 24, color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                  >
                    <Ic.X s={14} />
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="press"
                  style={{ 
                    width: 100, height: 100, borderRadius: 20, background: 'var(--cream-2)', 
                    border: '2px dashed var(--line-strong)', display: 'flex', flexDirection: 'column',
                    alignItems: 'center', justifyContent: 'center', gap: 8, color: 'var(--muted)',
                    cursor: 'pointer'
                  }}
                >
                  <Ic.Camera s={24} />
                  <span style={{ fontSize: 10, fontWeight: 800 }}>AJOUTER</span>
                </button>
              )}
            </div>

            <button
              onClick={handleSubmit}
              disabled={!content.trim() || loading}
              className="press"
              style={{
                width: '100%', height: 64, borderRadius: 24, border: 'none',
                background: content.trim() && !loading ? 'var(--orange)' : 'var(--line-strong)',
                color: '#fff',
                fontSize: 16, fontWeight: 900, cursor: content.trim() && !loading ? 'pointer' : 'default',
                textTransform: 'uppercase', letterSpacing: 1,
                boxShadow: content.trim() && !loading ? '0 12px 30px rgba(242,108,26,0.3)' : 'none'
              }}
            >
              {loading ? 'Publication...' : 'Publier mon avis'}
            </button>
          </>
        )}
      </motion.div>
    </div>
  );
}
