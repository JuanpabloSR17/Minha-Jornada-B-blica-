import { Circle, Ellipse, G, Line, Path, Rect } from 'react-native-svg';
import type { Wear } from './archetypes';
import { hairFamily } from './archetypes';
import { glyph } from './draw';
import type { StyleLook } from './StyledCharacter';

const INK = '#1C1214';
const LIGHT = '#FFE2A0';

/**
 * Teatro de sombras: o boneco é uma silhueta escura diante da lâmpada; as roupas aparecem como
 * janelas de couro colorido translúcido e rendado, e as varetas sustentam os braços.
 */
export function ShadowPuppet({ look, wear }: { look: StyleLook; wear: Wear }) {
  const sw = { 'body-a': 20, 'body-b': 25, 'body-c': 30 }[look.bodyId] ?? 25;
  const fam = hairFamily(look.hairStyle);
  const covered = wear.head?.kind === 'scarf' || wear.head?.kind === 'turban';
  const tunic = wear.tunic!;
  const rH = { x: 100 + sw + 22, y: 92 };
  const lH = { x: 100 - sw - 10, y: 150 };
  const dots = (pts: [number, number][], r = 2.2) => pts.map(([x, y], i) => <Circle key={i} cx={x} cy={y} r={r} fill={LIGHT} />);
  const hem = Array.from({ length: 9 }, (_, i) => [100 - sw - 6 + i * ((2 * sw + 12) / 8), 174] as [number, number]);
  return (
    <G>
      <Rect x={0} y={0} width={200} height={250} fill="url(#lampGlow)" />
      <Rect x={4} y={4} width={192} height={242} fill="none" stroke="#4A2A14" strokeWidth={8} />
      {/* manto atrás */}
      {wear.cloak ? (
        <G>
          <Path d={`M${100 - sw - 2} 76 L${100 - sw - 28} 204 L${100 + sw + 28} 204 L${100 + sw + 2} 76 Z`} fill={INK} />
          <Path d={`M${100 - sw - 6} 96 L${100 - sw - 22} 196 L${100 - sw + 4} 196 Z M${100 + sw + 6} 96 L${100 + sw + 22} 196 L${100 + sw - 4} 196 Z`} fill={wear.cloak.color} opacity={0.55} />
          {dots([[100 - sw - 20, 120], [100 - sw - 24, 150], [100 - sw - 27, 180], [100 + sw + 20, 120], [100 + sw + 24, 150], [100 + sw + 27, 180]])}
        </G>
      ) : null}
      {/* cabelo longo atrás */}
      {fam === 'long' && !covered ? <Path d="M84 46 C80 70 82 84 86 92 L114 92 C118 84 120 70 116 46 Z" fill={INK} /> : null}
      {/* pernas, corpo e pescoço */}
      <Path d="M90 178 L87 224 L97 224 L99 178 Z M110 178 L113 224 L103 224 L101 178 Z" fill={INK} />
      <Ellipse cx={90} cy={226} rx={8} ry={3.5} fill={INK} /><Ellipse cx={110} cy={226} rx={8} ry={3.5} fill={INK} />
      <Rect x={94} y={64} width={12} height={14} fill={INK} />
      <Path d={`M${100 - sw} 78 Q100 70 ${100 + sw} 78 L${100 + sw + 10} 180 L${100 - sw - 10} 180 Z`} fill={INK} />
      {/* janela colorida da túnica (listrada na Túnica de José) */}
      {tunic.stripes
        ? tunic.stripes.map((c, i) => <Path key={i} d={`M${100 - sw + 6 - i * 1.4} ${94 + i * 15} L${100 + sw - 6 + i * 1.4} ${94 + i * 15} L${100 + sw - 5 + i * 1.6} ${104 + i * 15} L${100 - sw + 5 - i * 1.6} ${104 + i * 15} Z`} fill={c} opacity={0.6} />)
        : <Path d={`M${100 - sw + 6} 94 L${100 + sw - 6} 94 L${100 + sw} 166 L${100 - sw} 166 Z`} fill={tunic.color} opacity={0.5} />}
      <Path d={`M${100 - 7} 80 L100 92 L${100 + 7} 80`} stroke={LIGHT} strokeWidth={1.6} fill="none" />
      {dots(hem, 2)}
      {wear.chest ? <G><Rect x={90} y={100} width={20} height={22} fill={INK} />{wear.chest.stones ? [0, 1, 2, 3].flatMap((r) => [0, 1, 2].map((c) => <Circle key={`${r}${c}`} cx={94 + c * 6} cy={104 + r * 5} r={1.8} fill={['#E05A5A', '#5AD08A', '#5A8AE0'][(r + c) % 3]} opacity={0.85} />)) : null}</G> : null}
      {wear.neck ? <Path d="M90 80 Q100 92 110 80" stroke={wear.neck.color} strokeWidth={2.4} fill="none" opacity={0.85} /> : null}
      {/* braços (articulados) */}
      <Path d={`M${100 - sw + 2} 82 L${100 - sw - 8} 118 L${lH.x} ${lH.y}`} stroke={INK} strokeWidth={9} strokeLinecap="round" strokeLinejoin="round" fill="none" />
      <Path d={`M${100 + sw - 2} 82 L${100 + sw + 16} 114 L${rH.x} ${rH.y}`} stroke={INK} strokeWidth={9} strokeLinecap="round" strokeLinejoin="round" fill="none" />
      <Circle cx={100 - sw - 8} cy={118} r={2} fill={LIGHT} /><Circle cx={100 + sw + 16} cy={114} r={2} fill={LIGHT} />
      {/* objeto na mão: silhueta com couro colorido */}
      {wear.hand ? (
        <G transform={`translate(${rH.x - 16} ${rH.y - 40}) scale(0.62)`}>
          {glyph(wear.hand.glyph, INK, INK, 4)}
          <G opacity={0.55}>{glyph(wear.hand.glyph, wear.hand.color, 'none', 0)}</G>
        </G>
      ) : null}
      {/* cabeça com olhos vazados */}
      <Ellipse cx={100} cy={48} rx={15} ry={18} fill={INK} />
      <Path d="M90 47 Q94 44 98 47 Q94 49 90 47 Z M102 47 Q106 44 110 47 Q106 49 102 47 Z" fill={LIGHT} />
      <Path d="M96 58 Q100 60 104 58" stroke={LIGHT} strokeWidth={1.2} fill="none" />
      {!covered && fam !== 'none' ? (
        fam === 'curly'
          ? [[86, 38], [92, 31], [100, 29], [108, 31], [114, 38]].map(([x, y], i) => <Circle key={i} cx={x} cy={y} r={6} fill={INK} />)
          : <Path d="M85 46 C84 30 92 26 100 26 C108 26 116 30 115 46 C110 38 90 38 85 46 Z" fill={INK} />
      ) : null}
      {wear.head?.kind === 'turban' ? <G><Path d="M83 44 C82 26 92 21 100 21 C108 21 118 26 117 44 C110 39 90 39 83 44 Z" fill={INK} /><Path d="M86 36 C94 31 106 31 114 36" stroke={wear.head.color} strokeWidth={3} opacity={0.7} fill="none" /></G> : null}
      {wear.head?.kind === 'scarf' ? <G><Path d="M80 52 C78 28 90 18 100 18 C110 18 122 28 120 52 C122 66 126 76 130 86 L112 80 C114 64 114 52 110 42 C106 34 94 34 90 42 C86 52 86 64 88 80 L70 86 C74 76 78 66 80 52 Z" fill={INK} /><Path d="M84 40 C90 26 110 26 116 40" stroke={wear.head.color} strokeWidth={3} opacity={0.75} fill="none" /></G> : null}
      {wear.head?.kind === 'band' ? <Path d="M85 38 Q100 33 115 38" stroke={wear.head.color} strokeWidth={3} fill="none" opacity={0.85} /> : null}
      {wear.head?.kind === 'crown' ? <G><Path d="M86 34 L114 34 L115 24 L109 29 L105 20 L100 27 L95 20 L91 29 L85 24 Z" fill={INK} /><Circle cx={100} cy={30} r={2.4} fill="#E05A5A" /><Path d="M88 32 H112" stroke="#F2C24A" strokeWidth={1.6} opacity={0.9} /></G> : null}
      {wear.head?.kind?.startsWith('wreath') ? (
        <G>
          {[-160, -135, -110, -70, -45, -20].map((deg) => {
            const t = (deg * Math.PI) / 180;
            const x = 100 + Math.cos(t) * 16;
            const y = 44 + Math.sin(t) * 18;
            return <Ellipse key={deg} cx={x} cy={y} rx={2.6} ry={5.4} fill={INK} transform={`rotate(${deg + 90} ${x} ${y})`} />;
          })}
          {wear.head.kind === 'wreath-flower' ? <G><Circle cx={92} cy={27} r={2.4} fill="#F2EEE4" opacity={0.85} /><Circle cx={100} cy={25} r={2.4} fill="#F2EEE4" opacity={0.85} /><Circle cx={108} cy={27} r={2.4} fill="#F2EEE4" opacity={0.85} /></G> : null}
        </G>
      ) : null}
      {/* varetas */}
      <Line x1={rH.x} y1={rH.y} x2={rH.x + 8} y2={250} stroke="#3A2A1A" strokeWidth={1.6} />
      <Line x1={lH.x} y1={lH.y} x2={lH.x - 6} y2={250} stroke="#3A2A1A" strokeWidth={1.6} />
      <Line x1={100} y1={78} x2={100} y2={250} stroke="#3A2A1A" strokeWidth={2.2} opacity={0.6} />
    </G>
  );
}
