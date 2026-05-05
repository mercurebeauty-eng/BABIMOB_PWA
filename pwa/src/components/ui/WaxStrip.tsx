interface WaxStripProps {
  color?: string;
  height?: number;
}

export function WaxStrip({ color = 'var(--orange)', height = 6 }: WaxStripProps) {
  return (
    <div
      aria-hidden="true"
      style={{
        height, width: '100%', color,
        backgroundImage: `repeating-linear-gradient(
          90deg,
          currentColor 0, currentColor 4px,
          transparent 4px, transparent 18px,
          currentColor 18px, currentColor 20px,
          transparent 20px, transparent 28px
        )`,
        flexShrink: 0,
      }}
    />
  );
}
