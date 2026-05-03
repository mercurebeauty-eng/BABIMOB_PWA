'use client';

import { useState, useRef } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Ic } from '@/components/ui/Ic';
import { motion, AnimatePresence } from 'framer-motion';

type Props = {
  userId: string;
  onClose: () => void;
  onSuccess: () => void;
};

export default function StoryComposer({ userId, onClose, onSuccess }: Props) {
  const supabase = createClient();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [mediaType, setMediaType] = useState<'image' | 'video' | 'text'>('text');
  const [content, setContent] = useState('');
  const [loading, setLoading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files?.[0];
    if (!selected) return;

    // Validation taille (max 20MB pour les vidéos)
    if (selected.size > 20 * 1024 * 1024) {
      alert("Fichier trop lourd (max 20Mo).");
      return;
    }

    setFile(selected);
    setPreviewUrl(URL.createObjectURL(selected));
    setMediaType(selected.type.startsWith('video/') ? 'video' : 'image');
  };

  const handleUpload = async () => {
    if (!file && !content.trim()) return;
    setLoading(true);

    try {
      let mediaUrl = null;

      if (file) {
        const fileExt = file.name.split('.').pop();
        const fileName = `${userId}/${Date.now()}.${fileExt}`;
        
        const { data, error: uploadError } = await supabase.storage
          .from('stories')
          .upload(fileName, file, {
            cacheControl: '3600',
            upsert: false
          });

        if (uploadError) throw uploadError;

        // Récupérer l'URL publique
        const { data: { publicUrl } } = supabase.storage
          .from('stories')
          .getPublicUrl(fileName);
        
        mediaUrl = publicUrl;
      }

      // Insérer en DB
      const { error: dbError } = await supabase.from('gbairai_stories').insert({
        user_id: userId,
        media_url: mediaUrl,
        media_type: file ? mediaType : 'text',
        content: content.trim() || null,
        expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()
      });

      if (dbError) throw dbError;

      onSuccess();
      onClose();
    } catch (err: any) {
      console.error(err);
      alert("Erreur lors de la publication : " + err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 10002,
      background: 'var(--ink)', display: 'flex', flexDirection: 'column'
    }}>
      {/* Header */}
      <div style={{ padding: 'max(16px, env(safe-area-inset-top)) 20px 16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', zIndex: 10 }}>
        <button onClick={onClose} style={{ background: 'rgba(255,255,255,0.2)', border: 'none', color: '#fff', width: 40, height: 40, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Ic.X s={20} />
        </button>
        <div className="font-display" style={{ color: '#fff', fontSize: 18 }}>Nouvelle Story</div>
        <button 
          onClick={handleUpload}
          disabled={loading || (!file && !content.trim())}
          style={{ 
            background: 'var(--orange)', border: 'none', color: '#fff', 
            padding: '8px 20px', borderRadius: 20, fontSize: 13, fontWeight: 900,
            opacity: (loading || (!file && !content.trim())) ? 0.5 : 1
          }}
        >
          {loading ? '...' : 'PUBLIER'}
        </button>
      </div>

      {/* Editor Area */}
      <div style={{ flex: 1, position: 'relative', overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        
        {previewUrl ? (
          mediaType === 'video' ? (
            <video src={previewUrl} autoPlay loop muted style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          ) : (
            <img src={previewUrl} alt="preview" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          )
        ) : (
          <div style={{ textAlign: 'center', color: 'rgba(255,255,255,0.4)' }}>
            <div style={{ fontSize: 40, marginBottom: 12 }}>📸</div>
            <div style={{ fontSize: 13, fontWeight: 700 }}>Ajoute une photo ou vidéo</div>
          </div>
        )}

        {/* Text Overlay */}
        <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 40 }}>
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder={previewUrl ? "Ajoute une légende..." : "Écris quelque chose..."}
            style={{
              width: '100%', background: 'transparent', border: 'none',
              color: '#fff', fontSize: previewUrl ? 20 : 28, fontWeight: 900,
              textAlign: 'center', outline: 'none', textShadow: '0 2px 10px rgba(0,0,0,0.5)',
              fontFamily: 'inherit', resize: 'none'
            }}
          />
        </div>
      </div>

      {/* Footer Tools */}
      <div style={{ padding: '20px 20px max(20px, env(safe-area-inset-bottom))', display: 'flex', gap: 12, justifyContent: 'center' }}>
        <input 
          type="file" 
          ref={fileInputRef} 
          hidden 
          accept="image/*,video/*" 
          onChange={handleFileChange}
        />
        <button 
          onClick={() => fileInputRef.current?.click()}
          style={{ 
            background: 'rgba(255,255,255,0.15)', backdropFilter: 'blur(10px)',
            border: '1px solid rgba(255,255,255,0.2)', color: '#fff',
            padding: '12px 24px', borderRadius: 24, display: 'flex', alignItems: 'center', gap: 8,
            fontSize: 13, fontWeight: 800
          }}
        >
          <Ic.Plus s={18} /> {previewUrl ? 'Modifier' : 'Galerie / Caméra'}
        </button>
      </div>

      {loading && (
        <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: 12 }}>
          <div className="shimmer" style={{ width: 60, height: 60, borderRadius: '50%', background: 'var(--orange)' }} />
          <div style={{ color: '#fff', fontSize: 13, fontWeight: 900 }}>CHARGEMENT...</div>
        </div>
      )}
    </div>
  );
}
