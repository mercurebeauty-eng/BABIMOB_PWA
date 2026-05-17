'use client';

type Props = {
  avg: number | null;
  count: number;
  size?: 'sm' | 'md' | 'lg';
  showCount?: boolean;
};

export default function PlaceRatingStars({ avg, count, size = 'md', showCount = true }: Props) {
  if (!avg || count === 0) return null;

  const starSize = size === 'sm' ? 14 : size === 'lg' ? 24 : 18;
  const fontSize = size === 'sm' ? 11 : size === 'lg' ? 16 : 13;

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: size === 'sm' ? 4 : 6 }}>
      <div style={{ display: 'flex', gap: 2 }}>
        {[1, 2, 3, 4, 5].map((star) => {
          const filled = avg >= star;
          const half   = !filled && avg >= star - 0.5;
          return (
            <div
              key={star}
              style={{
                width: starSize,
                height: starSize,
                position: 'relative',
                display: 'inline-block',
              }}
            >
              {/* Background star (empty) */}
              <svg
                viewBox="0 0 24 24"
                style={{ position: 'absolute', inset: 0, width: '100%', height: '100%' }}
              >
                <path
                  d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"
                  fill="none"
                  stroke="rgba(0,0,0,0.12)"
                  strokeWidth="1.5"
                />
              </svg>

              {/* Filled portion */}
              <svg
                viewBox="0 0 24 24"
                style={{
                  position: 'absolute', inset: 0, width: '100%', height: '100%',
                  clipPath: half ? 'inset(0 50% 0 0)' : undefined,
                  opacity: filled || half ? 1 : 0,
                }}
              >
                <path
                  d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"
                  fill="#F26C1A"
                />
              </svg>
            </div>
          );
        })}
      </div>

      {showCount && (
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 4 }}>
          <span style={{ fontSize, fontWeight: 900, color: 'var(--ink)' }}>
            {avg.toFixed(1)}
          </span>
          <span style={{ fontSize: fontSize - 2, fontWeight: 700, color: 'var(--muted)' }}>
            ({count} avis)
          </span>
        </div>
      )}
    </div>
  );
}
