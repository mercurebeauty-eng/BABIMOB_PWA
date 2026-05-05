'use client';

import dynamic from 'next/dynamic';

const Map = dynamic(() => import('./MapModern'), { 
  ssr: false,
  loading: () => <div style={{ width: '100%', height: '100%', background: 'var(--line)', opacity: 0.1 }} />
});

export default Map;
