'use client';

import { useState, useRef } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Ic } from '@/components/ui/Ic';
import { motion } from 'framer-motion';
import { toast } from 'sonner';
import { useXP } from '@/components/providers/XPProvider';

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
  const [rating, setRating]           = useState<number>(0);
  const [hoverRating, setHoverRating] = useState<number>(0);
  const [content, setContent]         = useState('');
  const [photoFile, setPhotoFile]     = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [loading, setLoading]         = useState(false);
  const [success, setSuccess]         = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const { addXP } = useXP();

  const currentTag = TAGS.find(t => t.id === selectedTag)!;

  function handlePhotoChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      toast.error('Photo trop lourde', { description: 'Max 5 MB' });
      return;
    }
    setPhotoFile(file);
    setPhotoPreview(URL.createObjectURL(file));
  }

  async function uploadPhoto(): Promise<string | null> {
    if (!photoFile) return null;
    const ext  = photoFile.name.split('.').pop();
    const path = `community/${userId}/${Date.now()}.${ext}`;
    const { error } = await supabase.storage
      .from('place-photos')
      .upload(path, photoFile, { upsert: false, contentType: photoFile.type });
    if (error) { console.error('Upload photo:', error); return null; }
    const { data } = supabase.storage.from('place-photos').getPublicUrl(path);
    return data.publicUrl;
  }

  async function handleSubmit() {
    if (!content.trim() || loading) return;
    setLoading(true);

    const fullContent = `[${currentTag.label}] ${content.trim()}`;

    // Quota XP : 5 avis/mois max
    const startOfMonth = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString();
    const { count: monthlyCount } = await supabase
      .from('place_advice')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId)
      .gte('created_at', startOfMonth);

    // Upload photo si présente
    const photoUrl = await uploadPhoto();

    const { data, error } = await supabase
      .from('place_advice')
      .insert({
        place_id: placeId,
        user_id: userId,
        content: fullContent,
        is_question: false,
        rating: rating > 0 ? rating : null,
        photo_url: photoUrl,
        xp_earned: (monthlyCount ?? 0) < 5 ? 10 : 0,
      })
      .select('id, content, created_at, is_question, rating, photo_url')
      .single();

    if (!error && (monthlyCount ?? 0) < 5) {
      await supabase.rpc('award_xp', { p_xp: 10 });
    }

    setLoading(false);

    if (error) {
      console.error('Erreur Supabase place_advice:', error);
      toast.error('Impossible de publier ton avis', { description: error.message });
      return;
    }

    const xpEarned = (monthlyCount ?? 0) < 5 ? 10 : 0;
    if (xpEarned > 0) addXP(xpEarned);

    toast.success('Avis publié !', {
      description: xpEarned > 0 ? `+${xpEarned} XP gagnés` : 'Merci pour ton partage !',
    });

    setSuccess(true);
    setTimeout(() => { onSuccess(data); onClose(); }, 1500);
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
          maxHeight: '90dvh', overflowY: 'auto',
        }}
      >
        <div style={{ width: 40, height: 4, background: 'var(--line-strong)', borderRadius: 2, margin: '0 auto 24px', opacity: 0.3 }} />

        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 28 }}>
          <div style={{
            width: 52, height: 52, borderRadius: 16,
            background: 'var(--orange)', color: '#fff',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 24, boxShadow: '0 8px 20px rgba(242,108,26,0.2)',
          }}>
            💬
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 18, fontWeight: 900, color: 'var(--ink)' }}>C'est comment ?</div>
            <div style={{ fontSize: 13, color: 'var(--muted)', fontWeight: 600 }}>{placeName}</div>
          </div>
          <button
            onClick={onClose}
            className="press"
            style={{ width: 40, height: 40, background: 'var(--cream-2)', borderRadius: 12, border: 'none', cursor: 'pointer', color: 'var(--ink)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
          >
            <Ic.X s={20} />
          </button>
        </div>

        {success ? (
          <div style={{ textAlign: 'center', padding: '40px 0' }}>
            <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} style={{ fontSize: 64, marginBottom: 16 }}>✨</motion.div>
            <div style={{ fontSize: 20, fontWeight: 900, color: 'var(--green)' }}>AVIS PUBLIÉ !</div>
            <div style={{ fontSize: 14, color: 'var(--muted)', marginTop: 8, fontWeight: 600 }}>Tu as gagné des points d'XP bonus.</div>
          </div>
        ) : (
          <>
            {/* ── ÉTOILES ── */}
            <div style={{ marginBottom: 28 }}>
              <div style={{ fontSize: 11, fontWeight: 900, color: 'var(--muted)', letterSpacing: 1.2, textTransform: 'uppercase', marginBottom: 14 }}>
                Ta note (optionnel)
              </div>
              <div style={{ display: 'flex', gap: 8 }}>
                {[1, 2, 3, 4, 5].map(star => {
                  const active = (hoverRating || rating) >= star;
                  return (
                    <button
                      key={star}
                      onClick={() => setRating(prev => prev === star ? 0 : star)}
                      onMouseEnter={() => setHoverRating(star)}
                      onMouseLeave={() => setHoverRating(0)}
                      style={{
                        background: 'none', border: 'none', cursor: 'pointer',
                        padding: 4, fontSize: 32, lineHeight: 1,
                        transform: active ? 'scale(1.15)' : 'scale(1)',
                        transition: 'transform 0.15s',
                        filter: active ? 'none' : 'grayscale(1) opacity(0.3)',
                      }}
                    >
                      ⭐
                    </button>
                  );
                })}
              </div>
              {rating > 0 && (
                <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--orange)', marginTop: 8 }}>
                  {['', 'Mauvais', 'Passable', 'Bien', 'Très bien', 'Excellent !'][rating]}
                </div>
              )}
            </div>

            {/* ── TAGS AMBIANCE ── */}
            <div style={{ fontSize: 11, fontWeight: 900, color: 'var(--muted)', letterSpacing: 1.2, textTransform: 'uppercase', marginBottom: 16 }}>
              Quelle est l'ambiance ?
            </div>
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
                    transition: 'all 0.2s',
                  }}
                >
                  <span style={{ fontSize: 18 }}>{tag.emoji}</span> {tag.label}
                </button>
              ))}
            </div>

            {/* ── TEXTE ── */}
            <div style={{ marginBottom: 24 }}>
              <div style={{ fontSize: 11, fontWeight: 900, color: 'var(--muted)', letterSpacing: 1.2, textTransform: 'uppercase', marginBottom: 12 }}>
                Ton ressenti en quelques mots
              </div>
              <textarea
                value={content}
                onChange={e => setContent(e.target.value.slice(0, 140))}
                placeholder={`Pourquoi est-ce ${currentTag.label.toLowerCase()} ?`}
                rows={3}
                style={{
                  width: '100%', background: 'var(--cream-2)', border: '2px solid transparent',
                  borderRadius: 24, padding: '16px', fontSize: 16, fontWeight: 600,
                  color: 'var(--ink)', outline: 'none', resize: 'none', fontFamily: 'inherit',
                  boxSizing: 'border-box',
                }}
              />
              <div style={{ textAlign: 'right', marginTop: 6, fontSize: 11, fontWeight: 800, color: content.length > 130 ? 'var(--orange)' : 'var(--muted)' }}>
                {content.length}/140
              </div>
            </div>

            {/* ── PHOTO (optionnel) ── */}
            <div style={{ marginBottom: 28 }}>
              <div style={{ fontSize: 11, fontWeight: 900, color: 'var(--muted)', letterSpacing: 1.2, textTransform: 'uppercase', marginBottom: 12 }}>
                Ajouter une photo (optionnel)
              </div>

              {photoPreview ? (
                <div style={{ position: 'relative', borderRadius: 20, overflow: 'hidden', height: 160 }}>
                  <img src={photoPreview} alt="preview" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  <button
                    onClick={() => { setPhotoFile(null); setPhotoPreview(null); }}
                    style={{
                      position: 'absolute', top: 10, right: 10,
                      width: 36, height: 36, borderRadius: '50%',
                      background: 'rgba(0,0,0,0.6)', border: 'none',
                      color: '#fff', fontSize: 16, cursor: 'pointer',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                    }}
                  >
                    ✕
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => fileRef.current?.click()}
                  className="press"
                  style={{
                    width: '100%', height: 100, borderRadius: 20,
                    border: '2px dashed rgba(0,0,0,0.1)', background: 'var(--cream-2)',
                    display: 'flex', flexDirection: 'column', alignItems: 'center',
                    justifyContent: 'center', gap: 8, cursor: 'pointer',
                  }}
                >
                  <span style={{ fontSize: 28 }}>📷</span>
                  <span style={{ fontSize: 12, fontWeight: 800, color: 'var(--muted)' }}>
                    Tap pour ajouter une photo
                  </span>
                </button>
              )}
              <input
                ref={fileRef}
                type="file"
                accept="image/jpeg,image/png,image/webp"
                onChange={handlePhotoChange}
                style={{ display: 'none' }}
              />
            </div>

            {/* ── SUBMIT ── */}
            <button
              onClick={handleSubmit}
              disabled={!content.trim() || loading}
              className="press"
              style={{
                width: '100%', height: 64, borderRadius: 24, border: 'none',
                background: content.trim() && !loading ? 'var(--orange)' : 'var(--line-strong)',
                color: '#fff', fontSize: 16, fontWeight: 900,
                cursor: content.trim() && !loading ? 'pointer' : 'default',
                textTransform: 'uppercase', letterSpacing: 1,
                boxShadow: content.trim() && !loading ? '0 12px 30px rgba(242,108,26,0.3)' : 'none',
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
