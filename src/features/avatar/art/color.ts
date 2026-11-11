/** Escurece (amount < 0) ou clareia (amount > 0) uma cor hex. amount entre -1 e 1. */
export function shade(hex: string, amount: number): string {
  const m = /^#?([0-9a-f]{6})$/i.exec(hex);
  if (!m || !m[1]) return hex;
  const n = parseInt(m[1], 16);
  const channels = [(n >> 16) & 255, (n >> 8) & 255, n & 255].map((c) => {
    const target = amount < 0 ? 0 : 255;
    return Math.round(c + (target - c) * Math.abs(amount));
  });
  return `#${channels.map((c) => c.toString(16).padStart(2, '0')).join('')}`;
}
