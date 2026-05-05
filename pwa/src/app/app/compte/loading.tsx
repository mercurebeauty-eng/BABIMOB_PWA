export default function CompteLoading() {
  return (
    <div style={{ minHeight: '100dvh', background: 'var(--cream)', color: 'var(--ink)', display: 'flex', flexDirection: 'column', padding: '24px 20px' }}>
      {/* Header Skeleton */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 32 }}>
        <div style={{ width: 64, height: 64, borderRadius: 24, background: 'var(--cream-2)', animation: 'pulse 1.5s infinite ease-in-out' }} />
        <div style={{ flex: 1 }}>
          <div style={{ width: 140, height: 24, borderRadius: 6, background: 'var(--cream-2)', animation: 'pulse 1.5s infinite ease-in-out', marginBottom: 8 }} />
          <div style={{ width: 80, height: 16, borderRadius: 4, background: 'var(--cream-2)', animation: 'pulse 1.5s infinite ease-in-out', opacity: 0.6 }} />
        </div>
      </div>
      
      {/* Stats Cards Skeleton */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 32 }}>
        <div style={{ height: 80, borderRadius: 24, background: 'var(--cream-2)', animation: 'pulse 1.5s infinite ease-in-out' }} />
        <div style={{ height: 80, borderRadius: 24, background: 'var(--cream-2)', animation: 'pulse 1.5s infinite ease-in-out' }} />
      </div>
      
      {/* Menu List Skeleton */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {[...Array(5)].map((_, i) => (
          <div key={i} style={{ height: 64, borderRadius: 20, background: 'var(--cream-2)', animation: 'pulse 1.5s infinite ease-in-out' }} />
        ))}
      </div>

      <style>{`
        @keyframes pulse {
          0% { opacity: 1; }
          50% { opacity: 0.5; }
          100% { opacity: 1; }
        }
      `}</style>
    </div>
  );
}
