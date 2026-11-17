import { Circle, G, Path, Rect } from 'react-native-svg';
import type { Wear } from './archetypes';
import { hairFamily } from './archetypes';
import { glyph, mix } from './draw';
import type { StyleLook } from './StyledCharacter';

type P = [number, number];
const STAR = '#FFF6D8';

/** estrelas de fundo, sempre nas mesmas posições (sem sorteio a cada desenho) */
const SKY: P[] = Array.from({ length: 70 }, (_, i) => [((i * 73) % 197) + 1.5, ((i * 131) % 247) + 1.5]);

/**
 * Constelação: o personagem desenhado em estrelas ligadas por linhas no céu noturno ("conta as
 * estrelas", Gn 15:5). As peças tingem as estrelas de cada parte; o objeto da mão vira traço de luz.
 */
export function Constellation({ look, wear }: { look: StyleLook; wear: Wear }) {
  const sw = { 'body-a': 20, 'body-b': 25, 'body-c': 30 }[look.bodyId] ?? 25;
  const tint = (c: string) => mix(c, '#FFFFFF', 0.45);
  const fam = hairFamily(look.hairStyle);
  const covered = wear.head?.kind === 'scarf' || wear.head?.kind === 'turban';
  const ring = (cx: number, cy: number, rx: number, ry: number, from: number, to: number, n: number): P[] =>
    Array.from({ length: n }, (_, i) => { const t = ((from + ((to - from) * i) / (n - 1)) * Math.PI) / 180; return [cx + Math.cos(t) * rx, cy + Math.sin(t) * ry]; });

  const head = ring(100, 52, 16, 19, -90, 270, 11);
  const body: P[] = [[100 - sw, 82], [100 - sw - 6, 130], [100 - sw - 10, 178], [100 + sw + 10, 178], [100 + sw + 6, 130], [100 + sw, 82]];
  const groups: { pts: P[]; color: string; closed?: boolean; big?: number[] }[] = [
    { pts: head, color: tint(look.skin), closed: true },
    { pts: [[100, 71], [100, 80]], color: tint(look.skin) },
    { pts: body, color: tint(wear.tunic!.color), big: [0, 5] },
    { pts: [[100 - sw, 82], [100 - sw - 12, 120], [100 - sw - 14, 150]], color: tint(wear.tunic!.color) },
    { pts: [[100 + sw, 82], [100 + sw + 18, 112], [100 + sw + 24, 92]], color: tint(wear.tunic!.color) },
    { pts: [[92, 178], [90, 224]], color: STAR }, { pts: [[108, 178], [110, 224]], color: STAR },
  ];
  if (wear.tunic?.stripes) wear.tunic.stripes.forEach((c, i) => groups.push({ pts: [[100 - sw + 2 - i, 96 + i * 16], [100 + sw - 2 + i, 96 + i * 16]], color: tint(c) }));
  if (wear.cloak) groups.push({ pts: [[100 - sw - 2, 80], [100 - sw - 18, 140], [100 - sw - 26, 200], [100 + sw + 26, 200], [100 + sw + 18, 140], [100 + sw + 2, 80]], color: tint(wear.cloak.color) });
  if (wear.chest) groups.push({ pts: [[90, 100], [110, 100], [110, 122], [90, 122]], color: tint('#E8B830'), closed: true });
  if (!covered && fam !== 'none') groups.push({ pts: ring(100, 50, 19, fam === 'long' ? 30 : 22, fam === 'long' ? -200 : -170, fam === 'long' ? 20 : -10, fam === 'curly' ? 9 : 7), color: tint(look.hair) });
  const hw = wear.head;
  if (hw?.kind === 'crown') groups.push({ pts: [[86, 32], [89, 22], [94, 29], [100, 18], [106, 29], [111, 22], [114, 32], [86, 32]], color: tint('#E8B830'), big: [3] });
  if (hw?.kind?.startsWith('wreath')) groups.push({ pts: ring(100, 50, 21, 24, -170, -10, 9), color: tint(hw.kind === 'wreath-flower' ? '#9BC46A' : '#E8B830') });
  if (hw?.kind === 'turban') groups.push({ pts: ring(100, 42, 19, 16, -180, 0, 8), color: tint(hw.color), big: [4] });
  if (hw?.kind === 'scarf') groups.push({ pts: [[76, 90], ...ring(100, 52, 23, 30, -180, 0, 9), [124, 90]], color: tint(hw.color) });
  if (hw?.kind === 'band') groups.push({ pts: [[84, 40], [100, 36], [116, 40]], color: tint(hw.color) });

  const line = (pts: P[], closed?: boolean) => `M${pts.map(([x, y]) => `${x.toFixed(1)} ${y.toFixed(1)}`).join(' L')}${closed ? ' Z' : ''}`;
  return (
    <G>
      <Rect x={0} y={0} width={200} height={250} fill="url(#nightSky)" />
      {SKY.map(([x, y], i) => <Circle key={i} cx={x} cy={y} r={i % 7 === 0 ? 1.1 : 0.6} fill="#FFFFFF" opacity={i % 3 === 0 ? 0.8 : 0.4} />)}
      {groups.map((g, i) => <Path key={`l${i}`} d={line(g.pts, g.closed)} stroke={g.color} strokeWidth={0.9} opacity={0.55} fill="none" />)}
      {groups.flatMap((g, i) => g.pts.map(([x, y], j) => {
        const r = g.big?.includes(j) ? 3.4 : 2.1;
        return (
          <G key={`s${i}-${j}`}>
            <Circle cx={x} cy={y} r={r * 2.6} fill={g.color} opacity={0.12} />
            <Circle cx={x} cy={y} r={r} fill={g.color} />
          </G>
        );
      }))}
      {wear.hand ? (
        <G transform={`translate(${100 + sw + 6} 52) scale(0.6)`} opacity={0.95}>
          {glyph(wear.hand.glyph, 'none', tint(wear.hand.color), 2.4)}
        </G>
      ) : null}
    </G>
  );
}
