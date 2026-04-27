import React from 'react';

interface PillProps {
  color?: string;
  children: React.ReactNode;
  size?: 'sm' | 'md';
}

export function Pill({ color = 'var(--orange)', children, size = 'sm' }: PillProps) {
  const pad = size === 'sm' ? '2px 7px' : '4px 10px';
  const fs  = size === 'sm' ? 9 : 11;
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center',
      padding: pad, borderRadius: 999,
      background: `color-mix(in oklab, ${color} 15%, transparent)`,
      color, border: `1px solid color-mix(in oklab, ${color} 30%, transparent)`,
      fontSize: fs, fontWeight: 800, letterSpacing: 0.5, whiteSpace: 'nowrap',
      textTransform: 'uppercase',
    }}>
      {children}
    </span>
  );
}
