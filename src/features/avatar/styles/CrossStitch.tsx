import { Circle, G, Line, Rect } from 'react-native-svg';
import type { Wear } from './archetypes';
import { shade } from './draw';
import { H, W, pixelCells } from './PixelCharacter';
import type { StyleLook } from './StyledCharacter';

/**
 * Ponto-cruz: a mesma grade do personagem em pixels, bordada em "X" sobre linho cru, dentro de um
 * bastidor de madeira. O fundo fica sem bordado (o tecido aparece).
 */
export function CrossStitch({ look, wear }: { look: StyleLook; wear: Wear }) {
  const cells = pixelCells(look, wear);
  const cell = 4.4;
  const ox = 100 - (W * cell) / 2;
  const oy = 128 - (H * cell) / 2;
  const stitches: { x: number; y: number; c: string }[] = [];
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) { const c = cells[y]![x]; if (c) stitches.push({ x, y, c }); }
  return (
    <G>
      <Rect x={0} y={0} width={200} height={250} fill="#3B2A1C" />
      <Circle cx={100} cy={128} r={98} fill="#B9874A" />
      <Circle cx={100} cy={128} r={92} fill="#EDE2C8" />
      <Circle cx={100} cy={128} r={92} fill="url(#linen)" />
      <Rect x={92} y={22} width={16} height={12} rx={2} fill="#9A6A34" stroke="#5A3A1C" strokeWidth={1} />
      <Circle cx={100} cy={128} r={92} fill="none" stroke="#8A5E2C" strokeWidth={2} />
      {stitches.map(({ x, y, c }) => {
        const x0 = ox + x * cell + 0.7;
        const y0 = oy + y * cell + 0.7;
        const x1 = x0 + cell - 1.4;
        const y1 = y0 + cell - 1.4;
        return (
          <G key={`${x}-${y}`}>
            <Line x1={x0} y1={y0} x2={x1} y2={y1} stroke={shade(c, -0.12)} strokeWidth={1.5} strokeLinecap="round" />
            <Line x1={x1} y1={y0} x2={x0} y2={y1} stroke={c} strokeWidth={1.5} strokeLinecap="round" />
          </G>
        );
      })}
    </G>
  );
}
