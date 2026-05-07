'use client';
import { Ic } from '@/components/ui/Ic';

export default function BackButton() {
  return (
    <button
      onClick={() => window.history.back()}
      style={{
        width: 40, height: 40, borderRadius: 12, border: 'none', flexShrink: 0,
        background: 'rgba(0,0,0,0.05)', color: 'var(--ink)', cursor: 'pointer',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}
    >
      <Ic.Back s={20} />
    </button>
  );
}
