'use client';

import { motion } from 'framer-motion';

type Props = {
  title: string;
  description: string;
  emoji?: string;
  action?: {
    label: string;
    onClick: () => void;
  };
};

export default function EmptyState({ title, description, emoji = '📭', action }: Props) {
  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      style={{
        padding: '60px 20px',
        textAlign: 'center',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: 12,
        background: 'rgba(255, 255, 255, 0.4)',
        backdropFilter: 'blur(10px)',
        borderRadius: 24,
        margin: '20px 0',
        border: '1px solid var(--line)',
      }}
    >
      <div style={{ fontSize: 48, marginBottom: 8 }}>{emoji}</div>
      <h3 className="font-display" style={{ fontSize: 20, color: 'var(--ink)', margin: 0 }}>{title}</h3>
      <p style={{ fontSize: 14, color: 'var(--muted)', maxWidth: 240, margin: '0 auto', lineHeight: 1.5 }}>
        {description}
      </p>
      {action && (
        <button 
          onClick={action.onClick}
          className="press"
          style={{
            marginTop: 12,
            padding: '10px 24px',
            borderRadius: 16,
            background: 'var(--ink)',
            color: '#fff',
            border: 'none',
            fontSize: 13,
            fontWeight: 800,
            cursor: 'pointer'
          }}
        >
          {action.label}
        </button>
      )}
    </motion.div>
  );
}
