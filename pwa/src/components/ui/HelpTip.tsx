'use client';

import { useHelp } from '@/components/providers/HelpProvider';
import { Ic } from './Ic';

interface HelpTipProps {
  title: string;
  content: string;
}

export function HelpTip({ title, content }: HelpTipProps) {
  const { showHelp } = useHelp();

  return (
    <button
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
        showHelp(title, content);
      }}
      className="press"
      aria-label={`Aide pour ${title}`}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        verticalAlign: 'middle',
        marginLeft: 6,
        border: 'none',
        background: 'rgba(0,0,0,0.05)',
        color: 'var(--muted)',
        cursor: 'pointer',
        width: 22,
        height: 22,
        borderRadius: '50%',
        transition: 'all 0.2s ease',
      }}
    >
      <Ic.Info s={14} strokeWidth="3" />
    </button>
  );
}
