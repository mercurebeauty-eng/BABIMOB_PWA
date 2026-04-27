'use client';

import { useEffect, useState } from 'react';

export default function OfflineBanner() {
  const [online, setOnline] = useState(true);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    setOnline(navigator.onLine);

    const handleOnline  = () => { setOnline(true);  setTimeout(() => setVisible(false), 2000); };
    const handleOffline = () => { setOnline(false); setVisible(true); };

    window.addEventListener('online',  handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online',  handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  if (!visible && online) return null;

  return (
    <div
      role="status"
      aria-live="polite"
      aria-atomic="true"
      className="bm-toast"
      style={{
        position:   'fixed',
        top:        0,
        left:       0,
        right:      0,
        zIndex:     9998,
        padding:    '10px 20px',
        display:    'flex',
        alignItems: 'center',
        gap:        10,
        fontSize:   13,
        fontWeight: 700,
        letterSpacing: '0.02em',
        background: online ? '#0EA85B' : '#1A1410',
        color:      '#F7F1E6',
        borderBottom: `2px solid ${online ? '#0A8A4A' : '#F26C1A'}`,
        transition: 'background 0.3s',
      }}
    >
      <span style={{ fontSize: 18 }}>{online ? '✅' : '📡'}</span>
      {online
        ? 'Connexion rétablie — données en temps réel.'
        : 'Mode hors-ligne — données en cache affichées.'}
    </div>
  );
}
