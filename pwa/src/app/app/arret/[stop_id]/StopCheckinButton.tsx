'use client';

import { useState } from 'react';
import { Ic } from '@/components/ui/Ic';
import StopReportModal from '@/components/StopReportModal';

type Props = {
  stopId: string;
  stopName: string;
  userId: string;
  displayName: string | null;
};

export default function StopCheckinButton({ stopId, stopName, userId, displayName }: Props) {
  const [open, setOpen] = useState(false);
  const [done, setDone] = useState(false);

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        disabled={done}
        style={{
          flex: 1, height: 56, borderRadius: 18, border: done ? 'none' : '2px dashed var(--line)',
          background: done ? 'color-mix(in oklab, var(--green) 12%, transparent)' : 'transparent',
          color: done ? 'var(--green)' : 'var(--muted)',
          fontSize: 13, fontWeight: 900, cursor: done ? 'default' : 'pointer',
          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
          textTransform: 'uppercase', letterSpacing: 0.5,
        }}
      >
        <Ic.Pin s={18} fill={done} />
        {done ? 'Signalement envoyé ✓' : 'J\'étais ici'}
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
