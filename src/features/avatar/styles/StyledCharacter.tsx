import type { ReactElement } from 'react';
import Svg, { Circle, ClipPath, Defs, Ellipse, G, Line, LinearGradient, Path, Pattern, RadialGradient, Rect, Stop } from 'react-native-svg';
import type { Glyph, Wear } from './archetypes';
import { hairFamily } from './archetypes';

export type CharacterStyle = 'vitral' | 'gravura' | 'iluminura' | 'aventureiro';
export type StyleLook = { bodyId: string; skin: string; hair: string; hairStyle: string };

// ------------------------------------------------------------------ cores
const hex = (h: string) => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16));
const toHex = (c: number[]) => `#${c.map((v) => Math.max(0, Math.min(255, Math.round(v))).toString(16).padStart(2, '0')).join('')}`;
const mix = (a: string, b: string, t: number) => { const x = hex(a), y = hex(b); return toHex(x.map((v, i) => v + (y[i]! - v) * t)); };
const shade = (a: string, t: number) => (t < 0 ? mix(a, '#000000', -t) : mix(a, '#FFFFFF', t));
/** satura um pouco (vitral): afasta do cinza médio */
const jewel = (a: string) => { const c = hex(a); const m = (c[0]! + c[1]! + c[2]!) / 3; return toHex(c.map((v) => m + (v - m) * 1.35)); };

// ------------------------------------------------------------------ geometria do busto (viewBox 200 × 250)
const HALF = { 'body-a': 56, 'body-b': 68, 'body-c': 76 } as Record<string, number>;
const CX = 100;
const HEAD = { cx: 100, cy: 92, rx: 29, ry: 36 };

function bust(bodyId: string) {
  const w = HALF[bodyId] ?? 68;
  const nk = bodyId === 'body-c' ? 13 : bodyId === 'body-a' ? 10 : 12;
  return {
    w,
    neck: `M${CX - nk} 116 L${CX - nk} 150 Q${CX} 157 ${CX + nk} 150 L${CX + nk} 116 Z`,
    torso: `M${CX - w} 172 Q${CX - w + 6} 152 ${CX - w * 0.42} 146 L${CX - nk - 1} 142 Q${CX} 160 ${CX + nk + 1} 142 L${CX + w * 0.42} 146 Q${CX + w - 6} 152 ${CX + w} 172 L${CX + w + 8} 252 L${CX - w - 8} 252 Z`,
    neckline: `M${CX - nk - 1} 142 Q${CX} 160 ${CX + nk + 1} 142`,
    cloakBack: `M${CX - w - 4} 168 C${CX - w - 14} 200 ${CX - w - 18} 230 ${CX - w - 22} 252 L${CX + w + 22} 252 C${CX + w + 18} 230 ${CX + w + 14} 200 ${CX + w + 4} 168 Z`,
    cloakL: `M${CX - w - 6} 170 Q${CX - w * 0.7} 146 ${CX - nk - 4} 145 C${CX - 22} 175 ${CX - 26} 215 ${CX - 30} 252 L${CX - w - 14} 252 C${CX - w - 10} 220 ${CX - w - 8} 195 ${CX - w - 6} 170 Z`,
    cloakR: `M${CX + w + 6} 170 Q${CX + w * 0.7} 146 ${CX + nk + 4} 145 C${CX + 22} 175 ${CX + 26} 215 ${CX + 30} 252 L${CX + w + 14} 252 C${CX + w + 10} 220 ${CX + w + 8} 195 ${CX + w + 6} 170 Z`,
    shawl: `M${CX - w - 6} 172 Q${CX - w * 0.6} 140 ${CX} 144 Q${CX + w * 0.6} 140 ${CX + w + 6} 172 Q${CX + 10} 200 ${CX} 206 Q${CX - 10} 200 ${CX - w - 6} 172 Z`,
    hoodBack: `M${CX - 44} 120 C${CX - 50} 60 ${CX - 30} 40 ${CX} 40 C${CX + 30} 40 ${CX + 50} 60 ${CX + 44} 120 L${CX + 40} 150 L${CX - 40} 150 Z`,
  };
}

const HAIR = {
  short: 'M71 90 C68 58 84 50 100 50 C116 50 132 58 129 90 C124 74 112 67 100 68 C88 67 76 74 71 90 Z',
  curly: 'M69 92 C62 80 66 66 74 62 C72 52 84 46 92 50 C96 42 108 42 112 50 C120 46 130 52 128 62 C136 66 138 80 131 92 C126 78 114 70 100 70 C86 70 74 78 69 92 Z',
  long: 'M70 92 C66 58 84 48 100 48 C116 48 134 58 130 92 C124 74 112 66 100 67 C88 66 76 74 70 92 Z',
  longBack: 'M66 90 C60 130 62 160 70 178 L130 178 C138 160 140 130 134 90 C128 70 72 70 66 90 Z',
  strandL: 'M71 88 C64 112 64 140 70 160 L80 158 C75 136 75 112 80 92 Z',
  strandR: 'M129 88 C136 112 136 140 130 160 L120 158 C125 136 125 112 120 92 Z',
};

const HEADWEAR = {
  turban: 'M67 88 C64 50 84 42 100 42 C116 42 136 50 133 88 C122 78 78 78 67 88 Z',
  turbanWraps: 'M70 74 C86 62 114 62 130 74 M72 62 C90 52 112 54 128 64 M80 52 C94 46 108 46 120 54',
  scarf: 'M58 104 C56 58 78 40 100 40 C122 40 144 58 142 104 C144 132 148 152 154 172 L130 164 C126 140 128 112 124 92 C120 70 110 62 100 62 C90 62 80 70 76 92 C72 112 74 140 70 164 L46 172 C52 152 56 132 58 104 Z',
  crown: 'M72 68 L128 68 L129 52 L120 60 L114 44 L107 58 L100 40 L93 58 L86 44 L80 60 L71 52 Z',
  band: 'M70 70 C86 62 114 62 130 70 L130 77 C114 69 86 69 70 77 Z',
};
/** folhas ao longo do topo da cabeça: ângulo (graus), tangentes ao contorno */
const WREATH_ANGLES = [-165, -145, -125, -105, -75, -55, -35, -15];
const wreathLeaves = (fill: string, ink: string, sw: number, flower: boolean) => (
  <G>
    {WREATH_ANGLES.map((deg) => {
      const t = (deg * Math.PI) / 180;
      const x = 100 + Math.cos(t) * 31;
      const y = 86 + Math.sin(t) * 34;
      return <Ellipse key={deg} cx={x} cy={y} rx={3.4} ry={7} fill={fill} stroke={ink} strokeWidth={sw} transform={`rotate(${deg + 90} ${x} ${y})`} />;
    })}
    {flower ? [-120, -90, -60].map((deg) => {
      const t = (deg * Math.PI) / 180;
      return <Circle key={deg} cx={100 + Math.cos(t) * 31} cy={86 + Math.sin(t) * 34} r={3.6} fill="#F2EEE4" stroke={ink} strokeWidth={sw} />;
    }) : null}
  </G>
);

// ------------------------------------------------------------------ objetos (em caixa 0..60)
function glyph(g: Glyph, c: string, ink: string, sw: number): ReactElement {
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

// ------------------------------------------------------------------ busto (vitral, gravura, iluminura)
type Treat = {
  ink: string; sw: number;
  fill: (c: string) => string;
  bg: (id: string) => ReactElement;
  face: (skin: string, ink: string) => ReactElement;
  hatch?: boolean;
  seams?: boolean;
  gold: string;
};

const TREAT: Record<Exclude<CharacterStyle, 'aventureiro'>, Treat> = {
  vitral: {
    ink: '#17110C', sw: 3.4, fill: jewel, gold: '#E8B830', seams: true,
    bg: () => (
      <G>
        <Rect x={0} y={0} width={200} height={250} fill="#1C2C5A" />
        {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11].map((i) => {
          const a = (i / 12) * Math.PI * 2;
          return <Path key={i} d={`M100 92 L${100 + Math.cos(a) * 260} ${92 + Math.sin(a) * 260}`} stroke="#17110C" strokeWidth={3} />;
        })}
        <Path d="M34 252 L34 96 Q34 26 100 14 Q166 26 166 96 L166 252 Z" fill="#8DB8D8" stroke="#17110C" strokeWidth={3.4} />
        <Path d="M34 96 Q100 70 166 96 M60 40 L60 252 M140 40 L140 252 M34 160 H166" stroke="#17110C" strokeWidth={2} fill="none" />
        {[[30, 40, '#3D6FB0'], [170, 40, '#B03D4E'], [26, 200, '#3D8F6A'], [174, 205, '#7B4FA8']].map(([x, y, c], i) => <Circle key={i} cx={x as number} cy={y as number} r={14} fill={c as string} stroke="#17110C" strokeWidth={3} />)}
      </G>
    ),
    face: (_skin, ink) => (
      <G>
        <Path d="M84 92 Q90 87 96 92 Q90 95 84 92 Z M104 92 Q110 87 116 92 Q110 95 104 92 Z" fill="#2A1C12" />
        <Path d="M82 84 Q90 80 97 83 M103 83 Q110 80 118 84" stroke={ink} strokeWidth={2.4} fill="none" strokeLinecap="round" />
        <Path d="M100 94 L97 108 L103 108" stroke={ink} strokeWidth={2} fill="none" strokeLinejoin="round" />
        <Path d="M92 116 Q100 120 108 116" stroke={ink} strokeWidth={2.4} fill="none" strokeLinecap="round" />
      </G>
    ),
  },
  gravura: {
    ink: '#2A211A', sw: 1.7, fill: (c) => mix(c, '#F3EAD7', 0.55), gold: '#C99A3A', hatch: true,
    bg: () => (
      <G>
        <Rect x={0} y={0} width={200} height={250} fill="#F3EAD7" />
        <Rect x={8} y={8} width={184} height={234} fill="none" stroke="#2A211A" strokeWidth={1.2} />
        <Rect x={0} y={0} width={200} height={250} fill="url(#hatchBg)" opacity={0.25} />
      </G>
    ),
    face: (_skin, ink) => (
      <G>
        <Path d="M85 92 Q90 88 95 92 M105 92 Q110 88 115 92" stroke={ink} strokeWidth={1.6} fill="none" />
        <Circle cx={90} cy={92} r={1.6} fill={ink} /><Circle cx={110} cy={92} r={1.6} fill={ink} />
        <Path d="M82 84 Q90 80 97 83 M103 83 Q110 80 118 84" stroke={ink} strokeWidth={1.8} fill="none" />
        <Path d="M100 94 C99 100 97 104 98 107 Q100 109 103 107" stroke={ink} strokeWidth={1.4} fill="none" />
        <Path d="M92 116 Q100 119 108 116 M95 121 Q100 122 105 121" stroke={ink} strokeWidth={1.4} fill="none" />
        <Path d="M114 100 L120 98 M114 104 L121 102 M113 108 L120 106 M112 112 L118 110" stroke={ink} strokeWidth={0.8} />
      </G>
    ),
  },
  iluminura: {
    ink: '#3B2414', sw: 1.3, fill: (c) => c, gold: '#D9A83A',
    bg: () => (
      <G>
        <Rect x={0} y={0} width={200} height={250} fill="#1F3A7A" />
        <Rect x={0} y={0} width={200} height={250} fill="url(#diaper)" />
        <Path d="M22 250 L22 70 C22 26 58 6 100 6 C142 6 178 26 178 70 L178 250" fill="#8C2F2F" stroke="url(#goldLeaf)" strokeWidth={6} />
        <Path d="M30 250 L30 72 C30 34 62 14 100 14 C138 14 170 34 170 72 L170 250" fill="none" stroke="#3B2414" strokeWidth={1} />
      </G>
    ),
    face: (_skin, ink) => (
      <G>
        <Path d="M86 92 Q90 89 94 92 Q90 94 86 92 Z M106 92 Q110 89 114 92 Q110 94 106 92 Z" fill="#2A1C12" />
        <Path d="M83 85 Q90 80 96 84 M104 84 Q110 80 117 85" stroke={ink} strokeWidth={1.3} fill="none" />
        <Path d="M100 93 L98 106 Q100 108 102 106" stroke={ink} strokeWidth={1.1} fill="none" />
        <Path d="M94 115 Q100 118 106 115" stroke="#9E2335" strokeWidth={2} fill="none" strokeLinecap="round" />
        <Circle cx={86} cy={104} r={4} fill="#D9706A" opacity={0.45} /><Circle cx={114} cy={104} r={4} fill="#D9706A" opacity={0.45} />
      </G>
    ),
  },
};

function Bust({ style, look, wear }: { style: Exclude<CharacterStyle, 'aventureiro'>; look: StyleLook; wear: Wear }) {
  const T = TREAT[style];
  const B = bust(look.bodyId);
  const p = (d: string, fill: string, extra?: object) => <Path d={d} fill={T.fill(fill)} stroke={T.ink} strokeWidth={T.sw} strokeLinejoin="round" {...extra} />;
  const skin = style === 'gravura' ? mix(look.skin, '#F3EAD7', 0.35) : look.skin;
  const hairC = style === 'gravura' ? mix(look.hair, '#F3EAD7', 0.2) : look.hair;
  const fam = hairFamily(look.hairStyle);
  const covered = wear.head?.kind === 'scarf' || wear.head?.kind === 'turban';
  const hood = wear.cloak?.kind === 'hood';
  const hatch = (d: string, k: string) => (T.hatch ? <Path key={k} d={d} fill="url(#hatch)" clipPath="url(#rightHalf)" opacity={0.85} /> : null);
  const tunic = wear.tunic!;
  return (
    <G>
      {T.bg(style)}
      {/* camada de trás: capuz, manto, cabelo longo */}
      {hood ? p(B.hoodBack, shade(wear.cloak!.color, -0.12)) : null}
      {wear.cloak && wear.cloak.kind !== 'shawl' ? p(B.cloakBack, shade(wear.cloak.color, -0.18)) : null}
      {fam === 'long' && !covered && !hood ? p(HAIR.longBack, shade(hairC, -0.1)) : null}
      {p(B.neck, skin)}
      {hatch(B.neck, 'hn')}
      {/* túnica (listrada na Túnica de José, Gn 37:3) */}
      {p(B.torso, tunic.color)}
      {tunic.stripes ? (
        <G clipPath="url(#torsoClip)">
          {tunic.stripes.map((c, i) => <Rect key={i} x={0} y={150 + i * 20} width={200} height={10} fill={T.fill(c)} />)}
        </G>
      ) : null}
      {hatch(B.torso, 'ht')}
      <Path d={B.neckline} fill="none" stroke={T.fill(tunic.trim)} strokeWidth={T.sw * 1.8} />
      {T.seams ? <Path d={`M${CX - B.w * 0.5} 190 L${CX - 8} 252 M${CX + B.w * 0.5} 190 L${CX + 8} 252 M${CX - B.w} 215 L${CX + B.w} 215`} stroke={T.ink} strokeWidth={2.2} /> : null}
      {wear.chest ? (
        <G>
          {p(`M${CX - 18} 168 H${CX + 18} V202 H${CX - 18} Z`, wear.chest.color)}
          {wear.chest.stones ? [0, 1, 2, 3].flatMap((r) => [0, 1, 2].map((c) => (
            <Circle key={`${r}${c}`} cx={CX - 10 + c * 10} cy={174 + r * 8} r={3} fill={T.fill(['#B03D4E', '#3D8F6A', '#3D6FB0', '#E8B830'][(r + c) % 4]!)} stroke={T.ink} strokeWidth={T.sw * 0.5} />
          ))) : null}
        </G>
      ) : null}
      {/* manto da frente */}
      {wear.cloak ? (
        wear.cloak.kind === 'shawl' ? p(B.shawl, wear.cloak.color) : (
          <G>
            {p(B.cloakL, wear.cloak.color)}
            {p(B.cloakR, wear.cloak.color)}
            {hatch(B.cloakR, 'hc')}
            {wear.cloak.kind === 'hair' || wear.cloak.kind === 'fleece' ? (
              <Path d={`M${CX - B.w} 180 l4 6 l4 -6 l4 6 M${CX - B.w + 4} 200 l4 6 l4 -6 l4 6 M${CX + B.w - 16} 185 l4 6 l4 -6 l4 6 M${CX + B.w - 12} 210 l4 6 l4 -6 l4 6`}
                stroke={T.ink} strokeWidth={T.sw * 0.6} fill="none" />
            ) : null}
            <Circle cx={CX} cy={150} r={6} fill={T.gold} stroke={T.ink} strokeWidth={T.sw * 0.8} />
          </G>
        )
      ) : null}
      {wear.neck ? (
        wear.neck.kind === 'beads'
          ? [-12, -6, 0, 6, 12].map((dx) => <Circle key={dx} cx={CX + dx} cy={152 + (12 - Math.abs(dx)) * 0.6} r={2.6} fill={T.fill(wear.neck!.color)} stroke={T.ink} strokeWidth={T.sw * 0.4} />)
          : <Path d={`M${CX - 14} 146 Q${CX} 166 ${CX + 14} 146`} fill="none" stroke={T.fill(wear.neck.color)} strokeWidth={T.sw * 1.6} />
      ) : null}
      {/* cabeça */}
      <Ellipse cx={71} cy={96} rx={5} ry={8} fill={skin} stroke={T.ink} strokeWidth={T.sw} />
      <Ellipse cx={129} cy={96} rx={5} ry={8} fill={skin} stroke={T.ink} strokeWidth={T.sw} />
      <Ellipse {...HEAD} fill={skin} stroke={T.ink} strokeWidth={T.sw} />
      {T.hatch ? <Path d="M108 60 C122 64 129 78 129 92 C129 110 120 124 108 127 C116 112 117 76 108 60 Z" fill="url(#hatch)" opacity={0.6} /> : null}
      {T.face(look.skin, T.ink)}
      {/* cabelo da frente (escondido sob lenço/turbante/capuz) */}
      {!covered && !hood && fam !== 'none' ? (
        <G>
          {p(HAIR[fam === 'curly' ? 'curly' : fam === 'long' ? 'long' : 'short'], hairC)}
          {fam === 'long' ? <>{p(HAIR.strandL, hairC)}{p(HAIR.strandR, hairC)}</> : null}
        </G>
      ) : null}
      {hood ? p(`M64 104 C62 62 80 46 100 46 C120 46 138 62 136 104 C130 80 116 66 100 66 C84 66 70 80 64 104 Z`, wear.cloak!.color) : null}
      {/* cobertura de cabeça */}
      {wear.head?.kind === 'turban' ? <G>{p(HEADWEAR.turban, wear.head.color)}<Path d={HEADWEAR.turbanWraps} stroke={T.ink} strokeWidth={T.sw * 0.7} fill="none" /></G> : null}
      {wear.head?.kind === 'scarf' ? p(HEADWEAR.scarf, wear.head.color) : null}
      {wear.head?.kind === 'band' ? p(HEADWEAR.band, wear.head.color) : null}
      {wear.head?.kind === 'crown' ? <G>{p(HEADWEAR.crown, T.gold)}<Circle cx={100} cy={61} r={4} fill={T.fill('#B03D4E')} stroke={T.ink} strokeWidth={T.sw * 0.6} /></G> : null}
      {wear.head?.kind?.startsWith('wreath')
        ? wreathLeaves(wear.head.kind === 'wreath-flower' ? T.fill('#6B7A3A') : T.gold, T.ink, T.sw * 0.6, wear.head.kind === 'wreath-flower')
        : null}
    </G>
  );
}

// ------------------------------------------------------------------ aventureiro (corpo inteiro, arredondado)
function Adventurer({ look, wear }: { look: StyleLook; wear: Wear }) {
  const ink = '#2B1E16';
  const sw = 3;
  const w = { 'body-a': 26, 'body-b': 32, 'body-c': 38 }[look.bodyId] ?? 32;
  const p = (d: string, fill: string) => <Path d={d} fill={fill} stroke={ink} strokeWidth={sw} strokeLinejoin="round" />;
  const shadow = (d: string) => <Path d={d} fill="#000" opacity={0.16} clipPath="url(#rightHalf)" />;
  const fam = hairFamily(look.hairStyle);
  const covered = wear.head?.kind === 'scarf' || wear.head?.kind === 'turban';
  const tunic = wear.tunic!;
  const body = `M${100 - w} 136 Q100 126 ${100 + w} 136 L${100 + w + 8} 206 Q100 214 ${100 - w - 8} 206 Z`;
  const headT = 'translate(100 84) scale(1.5 1.3) translate(-100 -92)';
  return (
    <G>
      <Rect x={0} y={0} width={200} height={250} fill="url(#advSky)" />
      <Ellipse cx={100} cy={232} rx={70} ry={10} fill="#000" opacity={0.18} />
      <Path d="M0 214 C50 204 150 204 200 214 L200 250 L0 250 Z" fill="#C9A46A" />
      {wear.cloak ? p(`M${100 - w - 4} 134 C${100 - w - 22} 170 ${100 - w - 24} 200 ${100 - w - 20} 222 L${100 + w + 20} 222 C${100 + w + 24} 200 ${100 + w + 22} 170 ${100 + w + 4} 134 Z`, shade(wear.cloak.color, -0.1)) : null}
      {/* pernas e pés */}
      {p(`M${100 - 16} 204 L${100 - 14} 226 L${100 - 4} 226 L${100 - 4} 204 Z`, look.skin)}
      {p(`M${100 + 4} 204 L${100 + 4} 226 L${100 + 14} 226 L${100 + 16} 204 Z`, look.skin)}
      {p('M78 224 Q86 220 98 226 L98 232 L78 232 Z', '#7A5A3A')}
      {p('M102 226 Q114 220 122 224 L122 232 L102 232 Z', '#7A5A3A')}
      {/* braço esquerdo */}
      {p(`M${100 - w + 2} 142 Q${100 - w - 14} 166 ${100 - w - 8} 190 L${100 - w + 2} 190 Q${100 - w} 166 ${100 - w + 10} 148 Z`, tunic.color)}
      <Circle cx={100 - w - 3} cy={193} r={6} fill={look.skin} stroke={ink} strokeWidth={sw} />
      {/* corpo */}
      {p(body, tunic.color)}
      {tunic.stripes ? (
        <G clipPath="url(#advBody)">{tunic.stripes.map((c, i) => <Rect key={i} x={0} y={140 + i * 14} width={200} height={7} fill={c} />)}</G>
      ) : null}
      {shadow(body)}
      <Path d={`M${100 - w - 6} 180 H${100 + w + 6}`} stroke="#7A5A3A" strokeWidth={6} />
      {wear.chest ? p('M88 146 H112 V172 H88 Z', '#D9A83A') : null}
      {wear.cloak ? (
        <G>
          {p(`M${100 - w - 2} 136 Q${100 - 14} 132 ${100 - 10} 140 L${100 - 18} 210 L${100 - w - 12} 210 Z`, wear.cloak.color)}
          {p(`M${100 + w + 2} 136 Q${100 + 14} 132 ${100 + 10} 140 L${100 + 18} 210 L${100 + w + 12} 210 Z`, wear.cloak.color)}
          <Circle cx={100} cy={140} r={5} fill="#E8B830" stroke={ink} strokeWidth={2} />
        </G>
      ) : null}
      {/* braço direito segurando o objeto */}
      <G transform={`translate(${100 + w + 2} 120) scale(0.9)`}>{wear.hand ? glyph(wear.hand.glyph, wear.hand.color, ink, 2.6) : null}</G>
      {p(`M${100 + w - 2} 142 Q${100 + w + 14} 160 ${100 + w + 18} 176 L${100 + w + 10} 180 Q${100 + w + 4} 166 ${100 + w - 8} 152 Z`, tunic.color)}
      <Circle cx={100 + w + 16} cy={176} r={6.5} fill={look.skin} stroke={ink} strokeWidth={sw} />
      {/* cabeça grande */}
      <G transform={headT}>
        {fam === 'long' && !covered ? p('M66 90 C62 112 64 128 70 136 L130 136 C136 128 138 112 134 90 C128 70 72 70 66 90 Z', shade(look.hair, -0.12)) : null}
        <Ellipse cx={71} cy={96} rx={5} ry={7} fill={look.skin} stroke={ink} strokeWidth={sw / 1.4} />
        <Ellipse cx={129} cy={96} rx={5} ry={7} fill={look.skin} stroke={ink} strokeWidth={sw / 1.4} />
        <Ellipse {...HEAD} fill={look.skin} stroke={ink} strokeWidth={sw / 1.4} />
        <Path d="M100 56 C120 56 129 75 129 92 C129 112 118 128 100 128 Z" fill="#000" opacity={0.12} />
        <Ellipse cx={89} cy={96} rx={4.5} ry={6} fill="#24170F" /><Ellipse cx={111} cy={96} rx={4.5} ry={6} fill="#24170F" />
        <Circle cx={90.6} cy={94} r={1.6} fill="#fff" /><Circle cx={112.6} cy={94} r={1.6} fill="#fff" />
        <Path d="M83 85 Q89 82 95 85 M105 85 Q111 82 117 85" stroke={ink} strokeWidth={1.8} fill="none" strokeLinecap="round" />
        <Path d="M94 112 Q100 117 106 112" stroke={ink} strokeWidth={1.8} fill="none" strokeLinecap="round" />
        <Ellipse cx={82} cy={106} rx={4} ry={2.5} fill="#E07A6A" opacity={0.5} /><Ellipse cx={118} cy={106} rx={4} ry={2.5} fill="#E07A6A" opacity={0.5} />
        {!covered && fam !== 'none' ? <G>
          <Path d={HAIR[fam === 'curly' ? 'curly' : fam === 'long' ? 'long' : 'short']} fill={look.hair} stroke={ink} strokeWidth={sw / 1.4} strokeLinejoin="round" />
          {fam === 'long' ? <><Path d="M71 88 C66 104 66 120 70 132 L79 130 C75 116 75 104 80 92 Z" fill={look.hair} stroke={ink} strokeWidth={sw / 1.4} /><Path d="M129 88 C134 104 134 120 130 132 L121 130 C125 116 125 104 120 92 Z" fill={look.hair} stroke={ink} strokeWidth={sw / 1.4} /></> : null}
        </G> : null}
        {wear.head?.kind === 'turban' ? <Path d={HEADWEAR.turban} fill={wear.head.color} stroke={ink} strokeWidth={sw / 1.4} /> : null}
        {wear.head?.kind === 'scarf' ? <Path d={HEADWEAR.scarf} fill={wear.head.color} stroke={ink} strokeWidth={sw / 1.4} /> : null}
        {wear.head?.kind === 'band' ? <Path d={HEADWEAR.band} fill={wear.head.color} stroke={ink} strokeWidth={sw / 1.4} /> : null}
        {wear.head?.kind === 'crown' ? <Path d={HEADWEAR.crown} fill="#E8B830" stroke={ink} strokeWidth={sw / 1.4} /> : null}
        {wear.head?.kind?.startsWith('wreath') ? wreathLeaves(wear.head.kind === 'wreath-flower' ? '#7C9A3A' : '#E8B830', ink, 1.4, wear.head.kind === 'wreath-flower') : null}
      </G>
    </G>
  );
}

/**
 * Personagem desenhado por código em quatro estilos de traço. Qualquer item do catálogo aparece,
 * pelo arquétipo (tipo + cor), sem depender de pintura por item e por corpo.
 */
export function StyledCharacter({ style, look, wear, width, label }: { style: CharacterStyle; look: StyleLook; wear: Wear; width: number; label?: string }) {
  const tunicPath = bust(look.bodyId).torso;
  const aw = { 'body-a': 26, 'body-b': 32, 'body-c': 38 }[look.bodyId] ?? 32;
  return (
    <Svg width={width} height={width * 1.25} viewBox="0 0 200 250" accessibilityRole="image" accessibilityLabel={label}>
      <Defs>
        <Pattern id="hatch" width={4} height={4} patternUnits="userSpaceOnUse" patternTransform="rotate(35)">
          <Line x1={0} y1={0} x2={0} y2={4} stroke="#2A211A" strokeWidth={0.9} />
        </Pattern>
        <Pattern id="hatchBg" width={6} height={6} patternUnits="userSpaceOnUse" patternTransform="rotate(-20)">
          <Line x1={0} y1={0} x2={0} y2={6} stroke="#2A211A" strokeWidth={0.5} />
        </Pattern>
        <Pattern id="diaper" width={20} height={20} patternUnits="userSpaceOnUse">
          <Path d="M10 4 L14 10 L10 16 L6 10 Z" fill="#D9A83A" opacity={0.55} />
          <Circle cx={0} cy={0} r={1.6} fill="#D9A83A" opacity={0.55} /><Circle cx={20} cy={20} r={1.6} fill="#D9A83A" opacity={0.55} />
        </Pattern>
        <LinearGradient id="goldLeaf" x1="0" y1="0" x2="1" y2="1">
          <Stop offset="0" stopColor="#FFE7A3" /><Stop offset="0.5" stopColor="#D9A83A" /><Stop offset="1" stopColor="#8A5A16" />
        </LinearGradient>
        <RadialGradient id="advSky" cx="0.5" cy="0.3" r="0.8">
          <Stop offset="0" stopColor="#FCE7B8" /><Stop offset="1" stopColor="#8FB7D9" />
        </RadialGradient>
        <ClipPath id="rightHalf"><Rect x={100} y={0} width={100} height={250} /></ClipPath>
        <ClipPath id="torsoClip"><Path d={tunicPath} /></ClipPath>
        <ClipPath id="advBody"><Path d={`M${100 - aw} 136 Q100 126 ${100 + aw} 136 L${100 + aw + 8} 206 Q100 214 ${100 - aw - 8} 206 Z`} /></ClipPath>
      </Defs>
      {style === 'aventureiro' ? <Adventurer look={look} wear={wear} /> : <Bust style={style} look={look} wear={wear} />}
    </Svg>
  );
}

/** Emblema do item de mão no traço do estilo (para os estilos de busto). */
export function StyledEmblem({ style, wear, size }: { style: CharacterStyle; wear: Wear; size: number }) {
  if (!wear.hand) return null;
  const T = style === 'aventureiro' ? { ink: '#2B1E16', sw: 2.6, fill: (c: string) => c } : TREAT[style];
  const bg = style === 'vitral' ? '#1C2C5A' : style === 'gravura' ? '#F3EAD7' : style === 'iluminura' ? '#1F3A7A' : '#FCE7B8';
  return (
    <Svg width={size} height={size} viewBox="-8 -8 76 76" accessibilityElementsHidden importantForAccessibility="no">
      <Circle cx={30} cy={30} r={36} fill={bg} stroke={style === 'iluminura' ? '#D9A83A' : T.ink} strokeWidth={style === 'vitral' ? 4 : 2.4} />
      {glyph(wear.hand.glyph, T.fill(wear.hand.color), T.ink, T.sw * (style === 'vitral' ? 0.8 : 1))}
    </Svg>
  );
}
