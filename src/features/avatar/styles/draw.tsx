import type { ReactElement } from 'react';
import { Circle, Ellipse, G, Line, Path, Rect } from 'react-native-svg';
import type { Glyph } from './archetypes';

// ------------------------------------------------------------------ cores
export const hex = (h: string) => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16));
export const toHex = (c: number[]) => `#${c.map((v) => Math.max(0, Math.min(255, Math.round(v))).toString(16).padStart(2, '0')).join('')}`;
export const mix = (a: string, b: string, t: number) => { const x = hex(a), y = hex(b); return toHex(x.map((v, i) => v + (y[i]! - v) * t)); };
export const shade = (a: string, t: number) => (t < 0 ? mix(a, '#000000', -t) : mix(a, '#FFFFFF', t));
/** satura um pouco (vitral): afasta do cinza médio */
export const jewel = (a: string) => { const c = hex(a); const m = (c[0]! + c[1]! + c[2]!) / 3; return toHex(c.map((v) => m + (v - m) * 1.35)); };

// ------------------------------------------------------------------ objetos (em caixa 0..60)
export function glyph(g: Glyph, c: string, ink: string, sw: number): ReactElement {
  const s = { stroke: ink, strokeWidth: sw, strokeLinejoin: 'round' as const, strokeLinecap: 'round' as const };
  const wood = '#8A5E34';
  switch (g) {
    case 'staff': return <G><Path {...s} fill="none" stroke={wood} strokeWidth={sw * 2.2} d="M30 58 L30 14 C30 4 44 4 44 14 C44 20 38 22 36 18" /><Path {...s} fill="none" d="M30 58 L30 14 C30 4 44 4 44 14 C44 20 38 22 36 18" strokeOpacity={0.5} /></G>;
    case 'scepter': return <G><Path {...s} fill={c} d="M28 58 L32 58 L32 18 L28 18 Z" /><Circle {...s} cx={30} cy={12} r={7} fill={c} /></G>;
    case 'scroll': return <G><Rect {...s} x={12} y={14} width={36} height={32} fill="#EFE0BE" /><Rect {...s} x={8} y={10} width={8} height={40} rx={4} fill={c} /><Rect {...s} x={44} y={10} width={8} height={40} rx={4} fill={c} /><Path {...s} fill="none" d="M20 22 H40 M20 29 H40 M20 36 H34" /></G>;
    case 'harp': return <G><Path {...s} fill={c} d="M14 52 C8 30 14 10 24 8 L28 14 C22 22 22 36 26 48 L44 48 C48 36 46 22 40 14 L44 8 C54 12 56 32 48 52 Z" /><Path {...s} fill="none" d="M24 14 H42 M28 18 V48 M33 16 V48 M38 18 V48" /></G>;
    case 'horn': return <Path {...s} fill={c} d="M8 40 C20 38 36 26 44 10 L54 14 C48 34 30 50 10 50 Z" />;
    case 'flute': return <G><Rect {...s} x={10} y={26} width={42} height={8} rx={4} fill={c} /><Circle cx={22} cy={30} r={1.6} fill={ink} /><Circle cx={30} cy={30} r={1.6} fill={ink} /><Circle cx={38} cy={30} r={1.6} fill={ink} /></G>;
    case 'jar': return <Path {...s} fill={c} d="M22 10 H38 V16 C46 22 48 36 44 46 C40 54 20 54 16 46 C12 36 14 22 22 16 Z" />;
    case 'basket': return <G><Path {...s} fill={c} d="M8 28 H52 L46 52 H14 Z" /><Path {...s} fill="none" d="M14 28 C14 10 46 10 46 28 M12 38 H48 M14 46 H46" /></G>;
    case 'cup': return <Path {...s} fill={c} d="M14 12 H46 C46 30 38 38 30 38 C22 38 14 30 14 12 Z M30 38 V48 M20 52 H40" />;
    case 'lamp': return <G><Path {...s} fill={c} d="M6 38 C16 48 40 48 52 34 C42 36 34 32 30 28 C20 28 12 32 6 38 Z" /><Path d="M10 30 C6 24 10 16 16 12 C16 20 20 22 18 28 Z" fill="#F2B23A" /></G>;
    case 'torch': return <G><Path {...s} fill={wood} d="M27 58 L33 58 L35 26 L25 26 Z" /><Path d="M30 4 C20 14 22 24 30 26 C38 24 40 14 30 4 Z" fill="#F2B23A" stroke={ink} strokeWidth={sw * 0.6} /></G>;
    case 'shield': return <G><Path {...s} fill={c} d="M30 6 L52 14 V30 C52 44 42 52 30 56 C18 52 8 44 8 30 V14 Z" /><Circle {...s} cx={30} cy={30} r={6} fill={shade(c, 0.35)} /></G>;
    case 'plumb': return <G><Line {...s} x1={30} y1={4} x2={30} y2={30} /><Path {...s} fill={c} d="M22 30 H38 L30 54 Z" /></G>;
    case 'sling': return <Path {...s} fill="none" d="M8 10 C20 30 26 40 30 46 C34 40 40 30 52 10 M24 44 C28 52 32 52 36 44" />;
    case 'mirror': return <G><Ellipse {...s} cx={30} cy={24} rx={16} ry={18} fill={shade(c, 0.4)} /><Path {...s} fill={c} d="M27 42 H33 V58 H27 Z" /></G>;
    default: return <Path {...s} fill={c} d="M10 46 L40 16 L48 24 L18 54 Z M38 10 L54 26" />;
  }
}

