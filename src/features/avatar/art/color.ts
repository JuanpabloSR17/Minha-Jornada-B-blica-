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

/** Mistura duas cores hex (t = 0 → a, t = 1 → b). */
export function mix(a: string, b: string, t: number): string {
  const pa = /^#?([0-9a-f]{6})$/i.exec(a)?.[1];
  const pb = /^#?([0-9a-f]{6})$/i.exec(b)?.[1];
  if (!pa || !pb) return a;
  const na = parseInt(pa, 16);
  const nb = parseInt(pb, 16);
  const out = [16, 8, 0].map((s) => Math.round(((na >> s) & 255) * (1 - t) + ((nb >> s) & 255) * t));
  return `#${out.map((c) => c.toString(16).padStart(2, '0')).join('')}`;
}

/** Cor de contorno: tom escuro e quente derivado da cor base (evita preto chapado). */
/** Contorno discreto (revisão v3): mais claro e mais quente, perto do tom do material. */
export const lineOf = (c: string) => mix(shade(c, -0.52), '#2A1A10', 0.25);
