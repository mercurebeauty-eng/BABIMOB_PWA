export const metadata = {
  title: 'Hors-ligne — BABIMOB',
  robots: { index: false },
};

export default function OfflinePage() {
  return (
    <main
      role="main"
      aria-label="Page hors-ligne BABIMOB"
      style={{
        minHeight:      '100dvh',
        display:        'flex',
        flexDirection:  'column',
        alignItems:     'center',
        justifyContent: 'center',
        background:     '#F7F1E6',
        color:          '#1A1410',
        padding:        '40px 20px',
        textAlign:      'center',
        fontFamily:     'system-ui, -apple-system, sans-serif',
      }}
    >
      <div style={{ fontSize: 72, marginBottom: 24 }}>🗺️</div>

      <h1 style={{ fontSize: 26, fontWeight: 900, marginBottom: 12, lineHeight: 1.1 }}>
        Tu es hors-ligne
      </h1>
      <p style={{ fontSize: 15, color: '#8B7E6E', maxWidth: 280, lineHeight: 1.6, marginBottom: 32 }}>
        Reconnecte-toi pour voir la carte en temps réel.
        Les données précédentes restent disponibles en cache.
      </p>

      <button
        onClick={() => window.location.reload()}
        style={{
          padding:       '14px 28px',
          borderRadius:  16,
          border:        'none',
          background:    '#F26C1A',
          color:         '#fff',
          fontSize:      15,
          fontWeight:    800,
          cursor:        'pointer',
          boxShadow:     '0 4px 20px rgba(242,108,26,0.35)',
        }}
      >
        Réessayer
      </button>
    </main>
  );
}
