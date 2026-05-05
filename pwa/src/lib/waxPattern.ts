// Picks a deterministic "random" wax pattern + rotation per seed.
// Same seed → same pattern (no flicker on re-render). Different seeds →
// good visual variety across cards in a list.

const PATTERNS = [
  'wax-bg',
  'wax-stripe',
  'wax-zigzag',
  'wax-strip',
  'wax-dots-lg',
  'wax-cross',
  'wax-triangle',
  'wax-wave',
  'wax-diamond',
  'wax-checker',
  'wax-grid',
  'wax-hex',
  'wax-dash',
] as const;

const ROTATIONS = ['', 'wax-rot-15', 'wax-rot-30', 'wax-rot-45', 'wax-rot-60', 'wax-rot-90', 'wax-rot-n30', 'wax-rot-n45'] as const;

function hash(seed: string): number {
  let h = 2166136261 >>> 0;
  for (let i = 0; i < seed.length; i++) {
    h ^= seed.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

export function pickWax(seed: string | number | null | undefined, opts: { rotate?: boolean } = {}): string {
  const s = String(seed ?? Math.random());
  const h = hash(s);
  const p = PATTERNS[h % PATTERNS.length];
  if (!opts.rotate) return p;
  const r = ROTATIONS[(h >>> 8) % ROTATIONS.length];
  return r ? `${p} ${r}` : p;
}
