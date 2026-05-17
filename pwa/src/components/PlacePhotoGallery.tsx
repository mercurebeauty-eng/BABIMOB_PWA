'use client';

import { useRef, useState } from 'react';
import { motion } from 'framer-motion';

type Photo = {
  id: string;
  url: string;
  caption: string | null;
  sort_order: number;
};

type Props = {
  photos: Photo[];
  placeName: string;
};

export default function PlacePhotoGallery({ photos, placeName }: Props) {
  const [activeIdx, setActiveIdx] = useState(0);
  const [lightbox, setLightbox] = useState<Photo | null>(null);
  const stripRef = useRef<HTMLDivElement>(null);

  if (!photos || photos.length === 0) return null;

  const handleScroll = () => {
    if (!stripRef.current) return;
    const { scrollLeft, clientWidth } = stripRef.current;
    const idx = Math.round(scrollLeft / (clientWidth * 0.72));
    setActiveIdx(Math.min(idx, photos.length - 1));
  };

  return (
    <>
      <div style={{
        background: 'var(--cream-2)', padding: '20px 0 24px', borderRadius: 32,
        marginBottom: 20, overflow: 'hidden',
        border: '1px solid rgba(26,20,16,0.04)',
        boxShadow: '0 4px 24px rgba(0,0,0,0.03)',
      }}>
        {/* Header */}
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '0 24px', marginBottom: 16,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{
              width: 32, height: 32, borderRadius: 10,
              background: 'rgba(242,108,26,0.12)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <span style={{ fontSize: 16 }}>📸</span>
            </div>
            <h2 style={{ fontSize: 13, fontWeight: 900, letterSpacing: 1, margin: 0 }}>
              PHOTOS DU LIEU
            </h2>
          </div>
          <div style={{
            fontSize: 10, fontWeight: 900, background: 'var(--cream)',
            padding: '6px 12px', borderRadius: 12, color: 'var(--muted)',
            border: '1px solid rgba(0,0,0,0.05)',
          }}>
            {photos.length} PHOTO{photos.length > 1 ? 'S' : ''}
          </div>
        </div>

        {/* Scrollable strip */}
        <div
          ref={stripRef}
          onScroll={handleScroll}
          className="no-scrollbar"
          style={{
            display: 'flex', gap: 12, overflowX: 'auto',
            padding: '0 24px', scrollSnapType: 'x mandatory',
          }}
        >
          {photos.map((photo, i) => (
            <motion.div
              key={photo.id}
              whileTap={{ scale: 0.97 }}
              onClick={() => setLightbox(photo)}
              style={{
                flexShrink: 0,
                width: '70vw', maxWidth: 320,
                height: 220, borderRadius: 24,
                overflow: 'hidden', cursor: 'zoom-in',
                scrollSnapAlign: 'start',
                boxShadow: activeIdx === i
                  ? '0 12px 36px rgba(0,0,0,0.18)'
                  : '0 4px 16px rgba(0,0,0,0.08)',
                transition: 'box-shadow 0.3s',
                position: 'relative',
              }}
            >
              <img
                src={photo.url}
                alt={photo.caption || placeName}
                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                loading="lazy"
              />
              {photo.caption && (
                <div style={{
                  position: 'absolute', bottom: 0, left: 0, right: 0,
                  padding: '32px 16px 14px',
                  background: 'linear-gradient(to top, rgba(0,0,0,0.6), transparent)',
                }}>
                  <div style={{ color: '#fff', fontSize: 12, fontWeight: 700 }}>
                    {photo.caption}
                  </div>
                </div>
              )}
            </motion.div>
          ))}
        </div>

        {/* Dots indicator */}
        {photos.length > 1 && (
          <div style={{
            display: 'flex', justifyContent: 'center', gap: 6, marginTop: 16, padding: '0 24px',
          }}>
            {photos.map((_, i) => (
              <div
                key={i}
                style={{
                  width: activeIdx === i ? 20 : 6,
                  height: 6, borderRadius: 3,
                  background: activeIdx === i ? 'var(--orange)' : 'rgba(0,0,0,0.15)',
                  transition: 'all 0.3s',
                }}
              />
            ))}
          </div>
        )}
      </div>

      {/* Lightbox */}
      {lightbox && (
        <div
          onClick={() => setLightbox(null)}
          style={{
            position: 'fixed', inset: 0, zIndex: 2000,
            background: 'rgba(0,0,0,0.92)', backdropFilter: 'blur(20px)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            padding: 20,
          }}
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            onClick={e => e.stopPropagation()}
            style={{ maxWidth: 600, width: '100%', position: 'relative' }}
          >
            <img
              src={lightbox.url}
              alt={lightbox.caption || placeName}
              style={{ width: '100%', borderRadius: 24, maxHeight: '80vh', objectFit: 'contain' }}
            />
            {lightbox.caption && (
              <div style={{
                textAlign: 'center', color: 'rgba(255,255,255,0.7)',
                marginTop: 16, fontSize: 14, fontWeight: 600,
              }}>
                {lightbox.caption}
              </div>
            )}
            <button
              onClick={() => setLightbox(null)}
              style={{
                position: 'absolute', top: -16, right: -16,
                width: 44, height: 44, borderRadius: '50%',
                background: 'rgba(255,255,255,0.15)', border: 'none',
                color: '#fff', fontSize: 20, cursor: 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}
            >
              ✕
            </button>
          </motion.div>
        </div>
      )}
    </>
  );
}
