import { ImageBackground, StyleSheet, View } from 'react-native';
import Svg, { Circle, ClipPath, Defs, Ellipse, G, Line, LinearGradient, Path, RadialGradient, Rect, Stop, Text as SvgText, TextPath } from 'react-native-svg';
import type { Wear } from './archetypes';
import { hairFamily } from './archetypes';
import { glyph, mix, shade } from './draw';
import { CX, HAIR, HEAD, HEADWEAR, bust, wreathLeaves, type StyleLook } from './StyledCharacter';

const CAMP = require('../../../../assets/journey/camp-night.webp');
const FIRE = '#FFB868';
const NIGHT = '#0B0E22';

/** brasas sempre nas mesmas posições, subindo na direção do fogo (canto inferior direito) */
const EMBERS: [number, number, number][] = [
  [176, 214, 1.6], [168, 188, 1.1], [184, 170, 0.9], [158, 160, 1.3], [190, 140, 0.8], [172, 126, 1.0],
  [150, 120, 0.7], [186, 100, 1.2], [162, 84, 0.8], [178, 62, 0.6], [140, 96, 0.6], [194, 206, 1.0],
];

// ================================================================== 1. à luz da fogueira
/**
 * Retrato cinematográfico sobre a arte real do acampamento: fogo quente à direita, lua fria à
 * esquerda, contorno aceso só onde o fogo toca, brasas no ar e o objeto da mão entrando no quadro.
 */
export function FirelightPortrait({ look, wear, width }: { look: { bodyId: string; skin: string; hair: string; hairStyle: string }; wear: Wear; width: number }) {
  const h = Math.round(width * 1.25);
  return (
    <View style={{ width, height: h, overflow: 'hidden', borderRadius: 6, backgroundColor: NIGHT }}>
      <ImageBackground source={CAMP} resizeMode="cover" style={StyleSheet.absoluteFill} imageStyle={{ opacity: 0.9 }} />
      <Svg width={width} height={h} viewBox="0 0 200 250" style={StyleSheet.absoluteFill}>
        <FirelightFigure look={look} wear={wear} />
      </Svg>
    </View>
  );
}

function FirelightFigure({ look, wear }: { look: StyleLook; wear: Wear }) {
  const B = bust(look.bodyId);
  const fam = hairFamily(look.hairStyle);
  const covered = wear.head?.kind === 'scarf' || wear.head?.kind === 'turban';
  const hood = wear.cloak?.kind === 'hood';
  const tunic = wear.tunic!;
  /** cada peça: cor do material + luz dos dois lados + contorno aceso só do lado do fogo */
  const lit = (d: string, color: string, key: string, rim = true) => (
    <G key={key}>
      <Path d={d} fill={color} />
      <Path d={d} fill="url(#flCool)" />
      <Path d={d} fill="url(#flWarm)" />
      {rim ? <Path d={d} fill="none" stroke={FIRE} strokeWidth={1.8} clipPath="url(#flRight)" opacity={0.9} /> : null}
      <Path d={d} fill="none" stroke={NIGHT} strokeWidth={0.9} opacity={0.55} />
    </G>
  );
  const folds = (x: number, k: string) => (
    <Path key={k} d={`M${x} 176 C${x - 4} 200 ${x + 2} 224 ${x - 2} 252`} stroke={NIGHT} strokeWidth={1.4} opacity={0.35} fill="none" />
  );
  return (
    <G>
      <Defs>
        <LinearGradient id="flVeil" x1="0" y1="0" x2="0" y2="1">
          <Stop offset="0" stopColor={NIGHT} stopOpacity={0.4} />
          <Stop offset="0.5" stopColor={NIGHT} stopOpacity={0.08} />
          <Stop offset="1" stopColor={NIGHT} stopOpacity={0.72} />
        </LinearGradient>
        <RadialGradient id="flFire" cx="1.05" cy="0.92" r="0.95">
          <Stop offset="0" stopColor="#FF8A2A" stopOpacity={0.6} />
          <Stop offset="0.5" stopColor="#FF8A2A" stopOpacity={0.12} />
          <Stop offset="1" stopColor="#FF8A2A" stopOpacity={0} />
        </RadialGradient>
        <LinearGradient id="flCool" x1="0" y1="0" x2="1" y2="0">
          <Stop offset="0" stopColor="#141A3A" stopOpacity={0.62} />
          <Stop offset="1" stopColor="#141A3A" stopOpacity={0} />
        </LinearGradient>
        <LinearGradient id="flWarm" x1="0" y1="0" x2="1" y2="0">
          <Stop offset="0" stopColor="#FFB060" stopOpacity={0} />
          <Stop offset="1" stopColor="#FFB060" stopOpacity={0.45} />
        </LinearGradient>
        <LinearGradient id="flGold" x1="0" y1="0" x2="0" y2="1">
          <Stop offset="0" stopColor="#FFE7A3" /><Stop offset="0.5" stopColor="#D9A441" /><Stop offset="1" stopColor="#7A5418" />
        </LinearGradient>
        <RadialGradient id="flVignette" cx="0.5" cy="0.45" r="0.75">
          <Stop offset="0.65" stopColor={NIGHT} stopOpacity={0} /><Stop offset="1" stopColor={NIGHT} stopOpacity={0.6} />
        </RadialGradient>
        <ClipPath id="flRight"><Rect x={106} y={0} width={94} height={250} /></ClipPath>
        <ClipPath id={`flTorso-${look.bodyId}`}><Path d={B.torso} /></ClipPath>
      </Defs>
      <Rect x={0} y={0} width={200} height={250} fill="url(#flVeil)" />
      <Rect x={0} y={0} width={200} height={250} fill="url(#flFire)" />

      {/* atrás: capuz, manto, cabelo longo */}
      {hood ? lit(B.hoodBack, shade(wear.cloak!.color, -0.25), 'hb', false) : null}
      {wear.cloak && wear.cloak.kind !== 'shawl' ? lit(B.cloakBack, shade(wear.cloak.color, -0.3), 'cb') : null}
      {fam === 'long' && !covered && !hood ? lit(HAIR.longBack, shade(look.hair, -0.15), 'lb') : null}
      {lit(B.neck, look.skin, 'nk')}
      <Ellipse cx={CX} cy={132} rx={16} ry={7} fill={NIGHT} opacity={0.4} />

      {/* túnica (listras da Túnica de José, Gn 37:3) */}
      {lit(B.torso, tunic.color, 'to')}
      {tunic.stripes ? (
        <G clipPath={`url(#flTorso-${look.bodyId})`} opacity={0.85}>
          {tunic.stripes.map((c, i) => <Rect key={i} x={0} y={150 + i * 20} width={200} height={10} fill={c} />)}
          <Rect x={0} y={140} width={200} height={120} fill="url(#flCool)" />
          <Rect x={0} y={140} width={200} height={120} fill="url(#flWarm)" />
        </G>
      ) : null}
      <Path d={B.neckline} fill="none" stroke={tunic.trim} strokeWidth={2.6} />
      <Path d={B.neckline} fill="none" stroke={FIRE} strokeWidth={0.8} opacity={0.5} transform="translate(0 1.4)" />
      {[CX - 22, CX + 6, CX + 26].map((x, i) => folds(x, `tf${i}`))}
      {wear.chest ? (
        <G>
          <Rect x={CX - 18} y={166} width={36} height={36} rx={2} fill="url(#flGold)" stroke={NIGHT} strokeWidth={0.8} />
          {wear.chest.stones ? [0, 1, 2, 3].flatMap((r) => [0, 1, 2].map((c) => (
            <G key={`${r}${c}`}>
              <Circle cx={CX - 10 + c * 10} cy={172 + r * 8} r={3} fill={['#9E2335', '#2F7A5A', '#2E5A9E', '#D9A441'][(r + c) % 4]} />
              <Circle cx={CX - 9 + c * 10} cy={171 + r * 8} r={0.9} fill="#FFFFFF" opacity={0.7} />
            </G>
          ))) : null}
        </G>
      ) : null}

      {/* manto da frente, com dobras e textura de pelo/lã quando houver */}
      {wear.cloak ? (
        wear.cloak.kind === 'shawl' ? lit(B.shawl, wear.cloak.color, 'sh') : (
          <G>
            {lit(B.cloakL, wear.cloak.color, 'cl')}
            {lit(B.cloakR, wear.cloak.color, 'cr')}
            {[CX - B.w + 6, CX - B.w + 18, CX + B.w - 10].map((x, i) => folds(x, `cf${i}`))}
            {wear.cloak.kind === 'hair' || wear.cloak.kind === 'fleece'
              ? Array.from({ length: 14 }, (_, i) => {
                const left = i % 2 === 0;
                const x = left ? CX - B.w + 2 + (i % 4) * 4 : CX + B.w - 14 + (i % 4) * 3;
                const y = 178 + i * 5;
                return <Path key={i} d={`M${x} ${y} q2 4 0 8`} stroke={shade(wear.cloak!.color, 0.25)} strokeWidth={1} opacity={0.5} fill="none" />;
              })
              : null}
            <Circle cx={CX} cy={150} r={5.5} fill="url(#flGold)" stroke={NIGHT} strokeWidth={0.8} />
            <Circle cx={CX + 1.5} cy={148.5} r={1.4} fill="#FFF4C8" />
          </G>
        )
      ) : null}
      {wear.neck ? (
        wear.neck.kind === 'beads'
          ? [-12, -6, 0, 6, 12].map((dx) => <Circle key={dx} cx={CX + dx} cy={152 + (12 - Math.abs(dx)) * 0.6} r={2.4} fill={wear.neck!.color} stroke={NIGHT} strokeWidth={0.5} />)
          : <Path d={`M${CX - 14} 146 Q${CX} 166 ${CX + 14} 146`} fill="none" stroke={wear.neck.color} strokeWidth={2.4} />
      ) : null}

      {/* cabeça */}
      {lit('M66 96 a5 8 0 1 0 10 0 a5 8 0 1 0 -10 0', look.skin, 'el', false)}
      {lit('M124 96 a5 8 0 1 0 10 0 a5 8 0 1 0 -10 0', look.skin, 'er')}
      {lit(`M${HEAD.cx - HEAD.rx} ${HEAD.cy} a${HEAD.rx} ${HEAD.ry} 0 1 0 ${HEAD.rx * 2} 0 a${HEAD.rx} ${HEAD.ry} 0 1 0 ${-HEAD.rx * 2} 0`, look.skin, 'hd')}
      {/* rosto: pálpebras, íris com reflexo do fogo, nariz em sombra, lábios em dois tons */}
      <G>
        <Path d="M84 93 Q90 88.5 96 93 Q90 96 84 93 Z M104 93 Q110 88.5 116 93 Q110 96 104 93 Z" fill="#EDE3D3" opacity={0.85} />
        <Circle cx={90.5} cy={92.6} r={2.7} fill="#2A1A10" /><Circle cx={110.5} cy={92.6} r={2.7} fill="#2A1A10" />
        <Circle cx={91.6} cy={91.8} r={0.8} fill="#FFD9A0" /><Circle cx={111.6} cy={91.8} r={0.8} fill="#FFD9A0" />
        <Path d="M83 92.5 Q90 87 97 92 M103 92 Q110 87 117 92.5" stroke={NIGHT} strokeWidth={1.4} fill="none" strokeLinecap="round" />
        <Path d="M82 85 Q89 81 97 84 M103 84 Q111 81 118 85" stroke={shade(look.hair, -0.2)} strokeWidth={2.4} fill="none" strokeLinecap="round" />
        <Path d="M99 95 C97 101 95 105 97 107 Q100 108.5 103 107" fill="none" stroke={NIGHT} strokeWidth={1} opacity={0.6} />
        <Path d="M97 95 C95 101 94 104 95.5 106.5 L99 104 Z" fill={NIGHT} opacity={0.22} />
        <Path d="M93 115.5 Q97 113.5 100 114.6 Q103 113.5 107 115.5 Q100 116.6 93 115.5 Z" fill={mix(look.skin, '#7A2A2A', 0.55)} />
        <Path d="M94 115.8 Q100 120 106 115.8 Q100 117.4 94 115.8 Z" fill={mix(look.skin, '#B0524A', 0.45)} />
        <Ellipse cx={114} cy={104} rx={5} ry={3} fill="#FF8A5A" opacity={0.18} />
        <Path d="M86 122 Q100 132 114 122" stroke={NIGHT} strokeWidth={1} opacity={0.25} fill="none" />
      </G>

      {/* cabelo */}
      {!covered && !hood && fam !== 'none' ? (
        <G>
          {lit(HAIR[fam === 'curly' ? 'curly' : fam === 'long' ? 'long' : 'short'], look.hair, 'hf')}
          {fam === 'long' ? <>{lit(HAIR.strandL, look.hair, 'hl', false)}{lit(HAIR.strandR, look.hair, 'hr')}</> : null}
          <Path d="M110 56 C118 60 124 68 126 80 M104 54 C112 58 116 64 119 72" stroke={shade(look.hair, 0.35)} strokeWidth={0.9} opacity={0.55} fill="none" />
        </G>
      ) : null}
      {hood ? lit('M64 104 C62 62 80 46 100 46 C120 46 138 62 136 104 C130 80 116 66 100 66 C84 66 70 80 64 104 Z', wear.cloak!.color, 'hf2') : null}

      {/* cobertura de cabeça: ouro sempre como metal */}
      {wear.head?.kind === 'turban' ? <G>{lit(HEADWEAR.turban, wear.head.color, 'tu')}<Path d={HEADWEAR.turbanWraps} stroke={shade(wear.head.color, -0.35)} strokeWidth={1} fill="none" /></G> : null}
      {wear.head?.kind === 'scarf' ? lit(HEADWEAR.scarf, wear.head.color, 'sc') : null}
      {wear.head?.kind === 'band' ? lit(HEADWEAR.band, wear.head.color, 'bd') : null}
      {wear.head?.kind === 'crown' ? (
        <G>
          <Path d={HEADWEAR.crown} fill="url(#flGold)" stroke={NIGHT} strokeWidth={0.9} />
          <Path d={HEADWEAR.crown} fill="none" stroke="#FFF2C0" strokeWidth={0.8} clipPath="url(#flRight)" />
          <Circle cx={100} cy={61} r={3.8} fill="#9E2335" stroke={NIGHT} strokeWidth={0.6} />
          <Circle cx={101.2} cy={59.8} r={1.1} fill="#FFFFFF" opacity={0.8} />
        </G>
      ) : null}
      {wear.head?.kind?.startsWith('wreath') ? wreathLeaves(wear.head.kind === 'wreath-flower' ? '#5E7A34' : 'url(#flGold)', NIGHT, 0.7, wear.head.kind === 'wreath-flower') : null}

      {/* objeto da mão entrando pela direita, à luz do fogo */}
      {wear.hand ? (
        <G transform="translate(132 132) scale(1.15)">
          {glyph(wear.hand.glyph, wear.hand.color, NIGHT, 1.6)}
          <G opacity={0.35}>{glyph(wear.hand.glyph, FIRE, 'none', 0)}</G>
        </G>
      ) : null}

      {EMBERS.map(([x, y, r], i) => (
        <G key={i}>
          <Circle cx={x} cy={y} r={r * 3} fill="#FF9A3A" opacity={0.12} />
          <Circle cx={x} cy={y} r={r} fill={i % 3 ? '#FFC36A' : '#FFE7A3'} />
        </G>
      ))}
      <Rect x={0} y={0} width={200} height={250} fill="url(#flVignette)" />
    </G>
  );
}

// ================================================================== 2. siclo de ouro
/**
 * O personagem cunhado num siclo de ouro em relevo: borda de contas, nome gravado no arco e a
 * gema da maior raridade equipada. O manto deixa só um esmalte da cor do item.
 */
export function CoinRelief({ look, wear, width, name, caption, gem }: { look: StyleLook; wear: Wear; width: number; name: string; caption: string; gem: string }) {
  const B = bust(look.bodyId);
  const fam = hairFamily(look.hairStyle);
  const covered = wear.head?.kind === 'scarf' || wear.head?.kind === 'turban';
  /** relevo: sombra embaixo/direita, brilho em cima/esquerda, metal no meio */
  const relief = (d: string, key: string, enamel?: string) => (
    <G key={key}>
      <Path d={d} fill="#4A2E08" opacity={0.6} transform="translate(2.6 3)" />
      <Path d={d} fill="#FFF4C8" opacity={0.75} transform="translate(-1.6 -1.8)" />
      <Path d={d} fill="url(#cnRelief)" />
      {enamel ? <Path d={d} fill={enamel} opacity={0.3} /> : null}
    </G>
  );
  const beads = Array.from({ length: 72 }, (_, i) => { const t = (i / 72) * Math.PI * 2; return [100 + Math.cos(t) * 88, 100 + Math.sin(t) * 88]; });
  return (
    <Svg width={width} height={width} viewBox="0 0 200 200">
      <Defs>
        <RadialGradient id="cnField" cx="0.38" cy="0.32" r="0.8">
          <Stop offset="0" stopColor="#F8DE90" /><Stop offset="0.55" stopColor="#D6A43A" /><Stop offset="1" stopColor="#8E5E18" />
        </RadialGradient>
        <LinearGradient id="cnRim" x1="0" y1="0" x2="1" y2="1">
          <Stop offset="0" stopColor="#FFE9A8" /><Stop offset="0.45" stopColor="#B8862E" /><Stop offset="0.7" stopColor="#7A5418" /><Stop offset="1" stopColor="#E3B85A" />
        </LinearGradient>
        <LinearGradient id="cnRelief" x1="0" y1="0" x2="0" y2="1">
          <Stop offset="0" stopColor="#F6D684" /><Stop offset="1" stopColor="#C08A2C" />
        </LinearGradient>
        <ClipPath id="cnClip"><Circle cx={100} cy={100} r={78} /></ClipPath>
        <ClipPath id="cnBust"><Rect x={0} y={0} width={200} height={158} /></ClipPath>
        <Path id="cnTop" d="M30 100 A70 70 0 0 1 170 100" />
      </Defs>
      <Circle cx={100} cy={102} r={97} fill="#000" opacity={0.35} />
      <Circle cx={100} cy={100} r={97} fill="#6A4612" />
      <Circle cx={100} cy={100} r={94} fill="url(#cnRim)" />
      {beads.map(([x, y], i) => <Circle key={i} cx={x} cy={y} r={2.1} fill={i % 2 ? '#F3D27A' : '#E2B85A'} stroke="#7A5418" strokeWidth={0.4} />)}
      <Circle cx={100} cy={100} r={80} fill="url(#cnField)" stroke="#7A5418" strokeWidth={1.2} />
      <Path d="M44 158 H156" stroke="#7A5418" strokeWidth={1.2} />
      <Path d="M48 161 H152" stroke="#FFF4C8" strokeWidth={0.6} opacity={0.6} />
      <SvgText fill="#6A4612" fontSize={12} fontFamily="Cinzel_700Bold" letterSpacing={2} textAnchor="middle">
        <TextPath href="#cnTop" startOffset="50%">{name.toUpperCase()}</TextPath>
      </SvgText>
      <G clipPath="url(#cnBust)">
        <G transform="translate(100 100) scale(0.44) translate(-100 -132)">
          {wear.cloak && wear.cloak.kind !== 'shawl' ? relief(B.cloakBack, 'cb', wear.cloak.color) : null}
          {fam === 'long' && !covered ? relief(HAIR.longBack, 'lb') : null}
          {relief(B.neck, 'nk')}
          {relief(B.torso, 'to', wear.tunic?.stripes ? undefined : wear.tunic?.color)}
          {wear.tunic?.stripes ? wear.tunic.stripes.map((c, i) => <Rect key={i} x={30} y={150 + i * 20} width={140} height={10} fill={c} opacity={0.25} clipPath="url(#cnClip)" />) : null}
          {wear.cloak ? (wear.cloak.kind === 'shawl' ? relief(B.shawl, 'sh', wear.cloak.color) : <>{relief(B.cloakL, 'cl', wear.cloak.color)}{relief(B.cloakR, 'cr', wear.cloak.color)}</>) : null}
          {relief(`M${HEAD.cx - HEAD.rx} ${HEAD.cy} a${HEAD.rx} ${HEAD.ry} 0 1 0 ${HEAD.rx * 2} 0 a${HEAD.rx} ${HEAD.ry} 0 1 0 ${-HEAD.rx * 2} 0`, 'hd')}
          <Path d="M84 93 Q90 88 96 93 Q90 96 84 93 M104 93 Q110 88 116 93 Q110 96 104 93 M82 85 Q90 81 97 84 M103 84 Q110 81 118 85 M99 95 C97 101 95 105 97 107 Q100 108 103 107 M93 116 Q100 120 107 116" stroke="#7A5418" strokeWidth={1.8} fill="none" strokeLinecap="round" />
          {!covered && fam !== 'none' ? relief(HAIR[fam === 'curly' ? 'curly' : fam === 'long' ? 'long' : 'short'], 'hf') : null}
          {wear.head?.kind === 'turban' ? relief(HEADWEAR.turban, 'tu') : null}
          {wear.head?.kind === 'scarf' ? relief(HEADWEAR.scarf, 'sc') : null}
          {wear.head?.kind === 'band' ? relief(HEADWEAR.band, 'bd') : null}
          {wear.head?.kind === 'crown' ? relief(HEADWEAR.crown, 'cr2') : null}
          {wear.head?.kind?.startsWith('wreath') ? wreathLeaves('#E2B85A', '#7A5418', 1, wear.head.kind === 'wreath-flower') : null}
        </G>
      </G>
      <SvgText x={100} y={171} fill="#6A4612" fontSize={9.5} fontFamily="Cinzel_700Bold" letterSpacing={2.2} textAnchor="middle">{caption.toUpperCase()}</SvgText>
      <Circle cx={100} cy={186} r={6} fill={gem} stroke="#6A4612" strokeWidth={1.4} />
      <Circle cx={98.2} cy={184.2} r={1.8} fill="#FFFFFF" opacity={0.7} />
    </Svg>
  );
}

// ================================================================== 3. peregrino nas dunas
/**
 * Corpo inteiro de perfil, caminhando na crista da duna ao entardecer, contra o sol: a figura fica
 * na contraluz, com borda acesa do lado do sol; manto e lenço voam com o vento.
 */
export function Pilgrim({ look, wear, width }: { look: StyleLook; wear: Wear; width: number }) {
  const dark = (c: string) => mix(c, '#1A0E18', 0.5);
  const fam = hairFamily(look.hairStyle);
  const covered = wear.head?.kind === 'scarf' || wear.head?.kind === 'turban';
  const tunic = wear.tunic!;
  const k = { 'body-a': 0.9, 'body-b': 1, 'body-c': 1.14 }[look.bodyId] ?? 1;
  const part = (d: string, c: string, key: string) => (
    <G key={key}>
      <Path d={d} fill={dark(c)} />
      <Path d={d} fill="none" stroke="#FFC07A" strokeWidth={1.3} clipPath="url(#pgSun)" opacity={0.95} />
    </G>
  );
  const staff = wear.hand?.glyph === 'staff';
  return (
    <Svg width={width} height={width * 1.25} viewBox="0 0 200 250">
      <Defs>
        <LinearGradient id="pgSky" x1="0" y1="0" x2="0" y2="1">
          <Stop offset="0" stopColor="#1E1840" /><Stop offset="0.42" stopColor="#6E3A5E" /><Stop offset="0.66" stopColor="#D8724A" /><Stop offset="0.8" stopColor="#F6C27A" />
        </LinearGradient>
        <RadialGradient id="pgHalo" cx="0.3" cy="0.6" r="0.5">
          <Stop offset="0" stopColor="#FFE2A0" stopOpacity={0.75} /><Stop offset="1" stopColor="#FFE2A0" stopOpacity={0} />
        </RadialGradient>
        {/* borda acesa só no lado do sol (esquerda da figura) */}
        <ClipPath id="pgSun"><Rect x={0} y={0} width={104} height={250} /></ClipPath>
      </Defs>
      <Rect x={0} y={0} width={200} height={250} fill="url(#pgSky)" />
      {[[30, 24], [150, 18], [176, 40], [92, 14], [124, 34]].map(([x, y], i) => <Circle key={i} cx={x} cy={y} r={0.8} fill="#FFFFFF" opacity={0.7} />)}
      <Rect x={0} y={0} width={200} height={250} fill="url(#pgHalo)" />
      <Circle cx={60} cy={152} r={30} fill="#FFE2A0" opacity={0.95} />
      <Path d="M0 168 C40 150 80 160 120 152 C150 146 180 154 200 150 L200 250 L0 250 Z" fill="#9A5048" opacity={0.75} />
      <Path d="M0 182 C30 172 70 178 100 172 C140 166 170 176 200 172 L200 250 L0 250 Z" fill="#5E2C38" />
      <Path d="M0 200 C40 186 90 184 120 190 C150 196 180 192 200 196 L200 250 L0 250 Z" fill="#2A1626" />
      <Path d="M150 104 l4 -3 l4 3 M164 92 l3 -2 l3 2" stroke="#2A1626" strokeWidth={1} fill="none" opacity={0.7} />
      {/* sombra longa na duna */}
      <Path d="M96 190 C130 194 170 200 200 204 L200 210 C170 206 130 200 100 194 Z" fill="#12080F" opacity={0.45} />

      <G transform={`translate(108 192) scale(${k * 1.25} 1.25) translate(-108 -190)`}>
        {/* manto e lenço ao vento */}
        {wear.cloak ? part('M100 94 C86 104 70 118 50 128 C58 132 62 138 58 146 C72 144 84 150 92 158 L100 124 Z', wear.cloak.color, 'cl') : null}
        {/* pernas em passada */}
        {part('M100 150 L93 186 L99 188 L106 152 Z', look.skin, 'lb')}
        {part('M108 150 L118 184 L124 184 L114 150 Z', look.skin, 'lf')}
        <Path d="M90 187 L101 187 L101 190 L88 190 Z M117 184 L128 184 L128 187 L116 187 Z" fill="#1A0E18" />
        {/* túnica */}
        {part('M98 96 C94 120 92 140 91 158 L119 158 C119 140 117 118 112 96 Z', tunic.color, 'tu')}
        {tunic.stripes ? tunic.stripes.map((c, i) => <Rect key={i} x={93} y={106 + i * 10} width={25} height={4} fill={dark(c)} />) : null}
        <Path d="M93 128 L118 128" stroke="#1A0E18" strokeWidth={2.4} />
        {wear.chest ? <Rect x={104} y={104} width={10} height={12} fill={dark('#D9A441')} /> : null}
        {/* braço da frente e objeto */}
        <Path d="M110 100 L120 114 L125 121" stroke={dark(tunic.color)} strokeWidth={6} strokeLinecap="round" strokeLinejoin="round" fill="none" />
        <Circle cx={126} cy={122} r={3.2} fill={dark(look.skin)} />
        {staff ? (
          <G>
            <Line x1={127} y1={64} x2={131} y2={190} stroke="#2A1810" strokeWidth={2.4} strokeLinecap="round" />
            <Path d="M127 64 C127 54 138 54 138 62 C138 67 133 68 132 65" stroke="#2A1810" strokeWidth={2.4} fill="none" strokeLinecap="round" />
          </G>
        ) : wear.hand ? (
          <G transform="translate(118 96) scale(0.42)">{glyph(wear.hand.glyph, dark(wear.hand.color), '#1A0E18', 3)}</G>
        ) : null}
        {/* cabeça de perfil, olhando para a direita */}
        <Rect x={104} y={90} width={6} height={8} fill={dark(look.skin)} />
        {part('M98 82 C98 72 104 68 109 68 C115 68 118 73 118 79 L121 84 L118 85.5 C118 91 114 95 108 95 C102 95 98 90 98 82 Z', look.skin, 'hd')}
        <Circle cx={113.5} cy={79.5} r={0.9} fill="#FFE2A0" opacity={0.8} />
        {!covered && fam !== 'none' ? part(fam === 'long'
          ? 'M98 82 C96 68 106 63 113 65 C117 66 118 70 117 73 C110 71 104 74 102 82 C102 92 100 100 96 106 C94 98 96 90 98 82 Z'
          : 'M98 81 C97 68 106 63 113 65 C117 66 118 70 117 73 C110 71 104 74 101 82 Z', look.hair, 'hr') : null}
        {wear.head?.kind === 'turban' ? part('M97 80 C96 64 108 59 116 65 C119 68 119 72 118 76 C110 72 102 74 97 80 Z', wear.head.color, 'tb') : null}
        {wear.head?.kind === 'scarf' ? part('M96 84 C94 66 108 60 117 66 C120 70 120 76 118 80 C112 74 104 76 100 86 C96 96 92 100 80 104 C70 108 62 104 52 108 C62 98 78 96 86 92 Z', wear.head.color, 'sc') : null}
        {wear.head?.kind === 'band' ? <Path d="M98 76 Q107 71 117 74" stroke={dark(wear.head.color)} strokeWidth={2.2} fill="none" /> : null}
        {wear.head?.kind === 'crown' ? <Path d="M100 69 L116 69 L117 61 L113 65 L110 58 L108 64 L105 58 L103 65 L99 61 Z" fill={dark('#E8B830')} stroke="#FFC07A" strokeWidth={0.8} /> : null}
        {wear.head?.kind?.startsWith('wreath') ? [[99, 72], [101, 67], [105, 64], [110, 63], [115, 65]].map(([x, y], i) => (
          <Ellipse key={i} cx={x} cy={y} rx={1.6} ry={3.2} fill={dark(wear.head!.kind === 'wreath-flower' ? '#6B8A3A' : '#E8B830')} transform={`rotate(${-60 + i * 30} ${x} ${y})`} />
        )) : null}
      </G>
    </Svg>
  );
}
