export default function GbairaiLoading() {
  return (
    <div style={{ minHeight: '100dvh', background: 'var(--cream)', color: 'var(--ink)', display: 'flex', flexDirection: 'column', padding: 20 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
        <div style={{ width: 40, height: 40, borderRadius: 12, background: 'var(--cream-2)', animation: 'pulse 1.5s infinite ease-in-out' }} />
        <div style={{ flex: 1 }}>
          <div style={{ width: 100, height: 24, borderRadius: 4, background: 'var(--cream-2)', animation: 'pulse 1.5s infinite ease-in-out' }} />
        </div>
      </div>
      
      <div style={{ height: 160, borderRadius: 24, background: 'var(--cream-2)', marginBottom: 20, animation: 'pulse 1.5s infinite ease-in-out' }} />
      
      <div style={{ display: 'flex', gap: 12, marginBottom: 20 }}>
        <div style={{ width: 80, height: 80, borderRadius: 20, background: 'var(--cream-2)', animation: 'pulse 1.5s infinite ease-in-out' }} />
        <div style={{ width: 80, height: 80, borderRadius: 20, background: 'var(--cream-2)', animation: 'pulse 1.5s infinite ease-in-out' }} />
        <div style={{ width: 80, height: 80, borderRadius: 20, background: 'var(--cream-2)', animation: 'pulse 1.5s infinite ease-in-out' }} />
      </div>

      <div style={{ flex: 1, borderRadius: 24, background: 'var(--cream-2)', animation: 'pulse 1.5s infinite ease-in-out' }} />

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
