import type { ReactElement } from 'react';
import Svg, { Circle, Ellipse, G, Path, Rect } from 'react-native-svg';
import { lineOf, shade } from './color';

/**
 * Miniaturas de inventário desenhadas à parte da arte vestida (viewBox 100×100): a peça
 * inteira, de frente, sem depender do encaixe no corpo (alça, mão, cabeça).
 */
type IconFn = (c: { base: string; trim: string }) => ReactElement;

const satchel: IconFn = ({ base, trim }) => (
  <G>
    <Path d="M26 22 C40 10 64 10 76 30 L72 34 C62 18 42 18 32 28 Z" fill={shade(base, -0.15)} stroke={lineOf(base)} strokeWidth={2} />
    <Path d="M22 42 C20 64 24 80 32 84 H70 C78 80 82 64 80 42 Q50 34 22 42 Z" fill={base} stroke={lineOf(base)} strokeWidth={2.4} />
    <Path d="M20 40 Q50 30 82 40 L80 62 Q50 72 22 62 Z" fill={shade(base, 0.1)} stroke={lineOf(base)} strokeWidth={2.4} />
    <Rect x={45} y={58} width={10} height={10} fill={trim} stroke={lineOf(trim)} strokeWidth={1.6} />
  </G>
);
const pouch: IconFn = ({ base, trim }) => (
  <G>
    <Path d="M6 36 Q50 48 94 36 V50 Q50 62 6 50 Z" fill={base} stroke={lineOf(base)} strokeWidth={2.2} />
    <Rect x={42} y={38} width={16} height={16} fill="none" stroke={trim} strokeWidth={3} />
    <Path d="M56 52 C54 72 62 86 72 86 C82 86 90 72 88 52 Z" fill={shade(base, 0.08)} stroke={lineOf(base)} strokeWidth={2.2} />
    <Path d="M56 54 Q72 70 88 54" fill={shade(base, -0.12)} stroke={lineOf(base)} strokeWidth={2} />
  </G>
);
const staff = (crook: boolean): IconFn => ({ base }) => (
  <G>
    <Path d={crook ? 'M40 94 L40 30 C40 10 70 8 72 26 C73 36 66 42 60 40' : 'M50 94 L50 12'} stroke={lineOf(base)} strokeWidth={11} strokeLinecap="round" fill="none" />
    <Path d={crook ? 'M40 94 L40 30 C40 10 70 8 72 26 C73 36 66 42 60 40' : 'M50 94 L50 12'} stroke={base} strokeWidth={7} strokeLinecap="round" fill="none" />
    {crook ? null : <Ellipse cx={50} cy={12} rx={7} ry={6} fill={shade(base, -0.1)} stroke={lineOf(base)} strokeWidth={2} />}
    {crook ? null : <Path d="M45 22 l10 4 M45 28 l10 4" stroke="#5A3A22" strokeWidth={3} strokeLinecap="round" />}
  </G>
);
const turban: IconFn = ({ base, trim }) => (
  <G>
    <Path d="M18 66 C14 38 30 16 50 14 C70 16 86 38 82 66 Q50 76 18 66 Z" fill={base} stroke={lineOf(base)} strokeWidth={2.4} />
    <Path d="M20 58 C34 34 64 28 80 44 M22 46 C40 52 62 48 80 56" stroke={shade(base, -0.25)} strokeWidth={3} fill="none" />
    <Path d="M18 66 Q50 76 82 66" stroke={trim} strokeWidth={5} fill="none" />
    <Path d="M78 56 C88 66 88 80 84 92 L76 92 C80 80 78 70 72 62 Z" fill={shade(base, -0.06)} stroke={lineOf(base)} strokeWidth={2} />
  </G>
);
const scarf: IconFn = ({ base, trim }) => (
  <G>
    <Path d="M50 10 C74 10 84 30 84 52 C86 70 92 80 94 92 H6 C8 80 14 70 16 52 C16 30 26 10 50 10 Z M50 30 C38 30 32 40 32 52 C32 66 40 76 50 76 C60 76 68 66 68 52 C68 40 62 30 50 30 Z" fillRule="evenodd" fill={base} stroke={lineOf(base)} strokeWidth={2.4} />
    <Path d="M50 30 C38 30 32 40 32 52 C32 66 40 76 50 76 C60 76 68 66 68 52 C68 40 62 30 50 30 Z" fill="none" stroke={trim} strokeWidth={3} />
  </G>
);
const drape: IconFn = ({ base, trim }) => (
  <G>
    <Path d="M14 14 Q50 4 86 14 L94 92 Q50 98 6 92 Z" fill={shade(base, -0.12)} stroke={lineOf(base)} strokeWidth={2.4} />
    <Path d="M14 14 C40 20 60 40 80 70 C70 80 56 84 44 80 C40 60 26 40 14 14 Z" fill={base} stroke={lineOf(base)} strokeWidth={2} />
    <Path d="M14 14 C26 40 40 60 44 80" stroke={trim} strokeWidth={3} fill="none" />
    <Circle cx={20} cy={20} r={6} fill={trim} stroke={lineOf(trim)} strokeWidth={1.6} />
  </G>
);

const ICONS: Record<string, { fn: IconFn; base: string; trim: string }> = {
  common_bolsa_do_viajante: { fn: satchel, base: '#7B4F2A', trim: '#C9A24A' },
  'belt-pouch': { fn: pouch, base: '#6A4428', trim: '#C9A24A' },
  'staff-shepherd': { fn: staff(true), base: '#7A5230', trim: '#000000' },
  common_cajado_de_caminhada: { fn: staff(false), base: '#8A6038', trim: '#000000' },
  'headwrap-sand': { fn: turban, base: '#D8BE8C', trim: '#9C3B2A' },
  'headscarf-ochre': { fn: scarf, base: '#C98B3A', trim: '#5A3A6E' },
  common_pano_de_cabeca: { fn: scarf, base: '#E6D8BC', trim: '#3C6E8C' },
  'cloak-night': { fn: drape, base: '#3E2C63', trim: '#C9A24A' },
  common_manto_de_viagem: { fn: drape, base: '#6B5A3A', trim: '#C9B48A' },
};

export const hasItemIcon = (id: string) => id in ICONS;

export function ItemThumbnail({ id, size }: { id: string; size: number }) {
  const def = ICONS[id];
  if (!def) return null;
  return (
    <Svg width={size} height={size} viewBox="0 0 100 100">
      {def.fn({ base: def.base, trim: def.trim })}
    </Svg>
  );
}
