'use client';

import { useState } from 'react';
import { Ic } from '@/components/ui/Ic';
import StopReportModal from './StopReportModal';

type Props = {
  stopId: string;
  stopName: string;
  userId: string;
  displayName: string | null;
};

export default function CcommentButton({ stopId, stopName, userId, displayName }: Props) {
  const [open, setOpen] = useState(false);
  const [done, setDone] = useState(false);

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        disabled={done}
        className="press"
        style={{
          flex: 1, height: 56, borderRadius: 18, 
          border: done ? 'none' : '2px dashed var(--line-strong)',
          background: done ? 'color-mix(in oklab, var(--green) 12%, transparent)' : 'transparent',
          color: done ? 'var(--green)' : 'var(--ink)',
          fontSize: 14, fontWeight: 900, cursor: done ? 'default' : 'pointer',
          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10,
          textTransform: 'uppercase', letterSpacing: 0.5,
        }}
      >
        <Ic.Pin s={20} fill={done} />
        {done ? 'Signalé ✓' : 'C\'comment ?'}
      </button>

      {open && (
        <StopReportModal
          stopId={stopId}
          stopName={stopName}
          userId={userId}
          displayName={displayName}
          onClose={() => setOpen(false)}
          onSuccess={() => setDone(true)}
        />
      )}
    </>
  );
}
