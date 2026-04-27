'use client';

export default function OfflineReloadButton() {
  return (
    <button
      onClick={() => window.location.reload()}
      style={{
        padding:      '14px 28px',
        borderRadius: 16,
        border:       'none',
        background:   '#F26C1A',
        color:        '#fff',
        fontSize:     15,
        fontWeight:   800,
        cursor:       'pointer',
        boxShadow:    '0 4px 20px rgba(242,108,26,0.35)',
      }}
    >
      Réessayer
    </button>
  );
}
