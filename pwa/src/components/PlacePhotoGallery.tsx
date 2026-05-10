'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Ic } from './ui/Ic';

type Photo = {
  id: string;
  url: string;
  caption?: string;
  source: 'user' | 'partner' | 'pro';
  is_verified: boolean;
};

type Props = {
  photos: Photo[];
  onAddPhoto?: () => void;
};

export default function PlacePhotoGallery({ photos, onAddPhoto }: Props) {
  const [selectedIdx, setSelectedIdx] = useState<number | null>(null);

  const handlePrev = useCallback(() => {
    setSelectedIdx(prev => (prev !== null && prev > 0 ? prev - 1 : prev));
  }, []);

  const handleNext = useCallback(() => {
    setSelectedIdx(prev => (prev !== null && prev < photos.length - 1 ? prev + 1 : prev));
  }, [photos.length]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (selectedIdx === null) return;
      if (e.key === 'Escape') setSelectedIdx(null);
      if (e.key === 'ArrowLeft') handlePrev();
      if (e.key === 'ArrowRight') handleNext();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedIdx, handlePrev, handleNext]);

  useEffect(() => {
    if (selectedIdx !== null) {
      if (selectedIdx < photos.length - 1) {
        const img = new Image();
        img.src = photos[selectedIdx + 1].url;
      }
      if (selectedIdx > 0) {
        const img = new Image();
        img.src = photos[selectedIdx - 1].url;
      }
    }
  }, [selectedIdx, photos]);

  return (
    <div style={{ marginBottom: 28 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ width: 32, height: 32, borderRadius: 10, background: 'var(--orange-pale)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Ic.Camera s={18} color="var(--orange)" />
          </div>
          <h2 style={{ fontSize: 13, fontWeight: 900, letterSpacing: 1, margin: 0 }}>PHOTOS & AMBIANCE</h2>
        </div>
        {onAddPhoto && (
          <button 
            onClick={onAddPhoto}
            className="press"
            style={{ 
              fontSize: 11, fontWeight: 900, color: 'var(--orange)', 
              background: 'var(--orange-pale)', border: 'none', 
              padding: '6px 12px', borderRadius: 12, cursor: 'pointer' 
            }}
          >
            AJOUTER
          </button>
        )}
      </div>

      {photos.length === 0 ? (
        <div style={{ 
          padding: 32, borderRadius: 24, background: 'var(--cream-2)', 
          textAlign: 'center', fontSize: 13, color: 'var(--muted)', fontWeight: 700,
          border: '2px dashed rgba(0,0,0,0.06)'
        }}>
           Pas encore de photos. Sois le premier ! 📸
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8 }}>
          {photos.slice(0, 6).map((photo, i) => (
            <motion.div
              key={photo.id}
              whileTap={{ scale: 0.95 }}
              onClick={() => setSelectedIdx(i)}
              style={{ 
                aspectRatio: '1/1', borderRadius: 16, overflow: 'hidden', 
                background: 'var(--cream-2)', cursor: 'pointer', position: 'relative'
              }}
            >
              <img 
                src={photo.url} 
                alt={photo.caption || 'Photo du lieu'} 
                loading="lazy"
                decoding="async"
                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
              />
              {photo.is_verified && (
                <div style={{ position: 'absolute', top: 6, right: 6, background: '#fff', borderRadius: '50%', width: 18, height: 18, display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}>
                  <Ic.Check s={12} color="var(--orange)" />
                </div>
              )}
              {i === 5 && photos.length > 6 && (
                <div style={{ 
                  position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.4)', 
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  color: '#fff', fontSize: 14, fontWeight: 900
                }}>
                  +{photos.length - 6}
                </div>
              )}
            </motion.div>
          ))}
        </div>
      )}

      {/* FULL SCREEN VIEWER */}
      <AnimatePresence>
        {selectedIdx !== null && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            style={{ 
              position: 'fixed', inset: 0, zIndex: 2000, 
              background: '#000', display: 'flex', flexDirection: 'column'
            }}
          >
            <div style={{ 
              position: 'absolute', top: 'calc(env(safe-area-inset-top, 0px) + 20px)', 
              left: 20, right: 20, display: 'flex', justifyContent: 'space-between', zIndex: 10 
            }}>
              <div style={{ color: '#fff', fontSize: 14, fontWeight: 800 }}>
                {selectedIdx + 1} / {photos.length}
              </div>
              <button 
                onClick={() => setSelectedIdx(null)}
                style={{ background: 'rgba(255,255,255,0.2)', border: 'none', borderRadius: '50%', width: 40, height: 40, color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
              >
                <Ic.X s={24} />
              </button>
            </div>

            <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20, position: 'relative' }}>
              {selectedIdx > 0 && (
                <button 
                  onClick={(e) => { e.stopPropagation(); handlePrev(); }}
                  style={{ position: 'absolute', left: 20, zIndex: 10, background: 'rgba(255,255,255,0.2)', border: 'none', borderRadius: '50%', width: 44, height: 44, color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', backdropFilter: 'blur(4px)' }}
                >
                  <span style={{ fontSize: 24, fontWeight: 'bold' }}>‹</span>
                </button>
              )}

              <motion.img
                key={photos[selectedIdx].id}
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                src={photos[selectedIdx].url}
                style={{ maxWidth: '100%', maxHeight: '80vh', objectFit: 'contain', borderRadius: 12 }}
              />

              {selectedIdx < photos.length - 1 && (
                <button 
                  onClick={(e) => { e.stopPropagation(); handleNext(); }}
                  style={{ position: 'absolute', right: 20, zIndex: 10, background: 'rgba(255,255,255,0.2)', border: 'none', borderRadius: '50%', width: 44, height: 44, color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', backdropFilter: 'blur(4px)' }}
                >
                  <span style={{ fontSize: 24, fontWeight: 'bold' }}>›</span>
                </button>
              )}
            </div>

            {photos[selectedIdx].caption && (
              <div style={{ padding: '20px 20px calc(20px + env(safe-area-inset-bottom, 0px))', background: 'linear-gradient(to top, rgba(0,0,0,0.8), transparent)', color: '#fff' }}>
                <p style={{ fontSize: 15, fontWeight: 600, margin: 0 }}>{photos[selectedIdx].caption}</p>
                <div style={{ fontSize: 12, opacity: 0.7, marginTop: 8, textTransform: 'uppercase', fontWeight: 800, letterSpacing: 0.5 }}>
                   Posté par {photos[selectedIdx].source === 'pro' ? 'Babimob Studio' : 'Un voyageur'}
                </div>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
