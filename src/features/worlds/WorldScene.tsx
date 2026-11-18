import { memo, type ReactElement } from 'react';
import { Image, StyleSheet } from 'react-native';
import Svg, { Circle, Defs, Ellipse, G, LinearGradient, Path, RadialGradient, Rect, Stop } from 'react-native-svg';
import { WORLD_THEMES, type WorldId } from './worldThemes';

/** Pseudoaleatório estável (mesmas estrelas e brasas em todo render). */
function rand(seed: number) {
  let s = seed;
  return () => ((s = (s * 16807) % 2147483647) / 2147483647);
}
const stars = (n: number, seed: number, maxY: number) => {
  const r = rand(seed);
  return Array.from({ length: n }, () => ({ x: r() * 400, y: r() * maxY, s: 0.4 + r() * 1.3, o: 0.35 + r() * 0.65 }));
};

const Tent = ({ x, y, s = 1, c }: { x: number; y: number; s?: number; c: string }) => (
  <G transform={`translate(${x} ${y}) scale(${s})`}>
    <Path d="M0 0 L18 -24 L36 0 Z" fill={c} />
    <Path d="M18 -24 L22 0 L14 0 Z" fill="#000" opacity={0.35} />
    <Path d="M18 -24 L18 -30" stroke={c} strokeWidth={1.5} />
  </G>
);
const Palm = ({ x, y, s = 1, c }: { x: number; y: number; s?: number; c: string }) => (
  <G transform={`translate(${x} ${y}) scale(${s})`}>
    <Path d="M0 0 Q2 -18 1 -34" stroke={c} strokeWidth={2.6} fill="none" />
    <Path d="M1 -34 Q-12 -38 -18 -30 M1 -34 Q12 -40 19 -31 M1 -34 Q-6 -46 -14 -44 M1 -34 Q8 -47 16 -44 M1 -34 Q0 -44 1 -48" stroke={c} strokeWidth={2.2} fill="none" strokeLinecap="round" />
  </G>
);
const Olive = ({ x, y, s = 1, c }: { x: number; y: number; s?: number; c: string }) => (
  <G transform={`translate(${x} ${y}) scale(${s})`}>
    <Path d="M0 0 Q-2 -8 1 -14" stroke={c} strokeWidth={3} fill="none" />
    <Ellipse cx={0} cy={-20} rx={14} ry={9} fill={c} />
    <Ellipse cx={-9} cy={-16} rx={8} ry={6} fill={c} />
    <Ellipse cx={9} cy={-15} rx={8} ry={6} fill={c} />
  </G>
);
const Cypress = ({ x, y, h, c }: { x: number; y: number; h: number; c: string }) => (
  <Path d={`M${x} ${y} Q${x - 7} ${y - h * 0.5} ${x} ${y - h} Q${x + 7} ${y - h * 0.5} ${x} ${y} Z`} fill={c} />
);

function Origens() {
  return (
    <>
      <Defs>
        <LinearGradient id="wsFire" x1="0" y1="0" x2="0" y2="1">
          <Stop offset="0" stopColor="#FFE7A3" stopOpacity={0} />
          <Stop offset="0.35" stopColor="#FFB347" stopOpacity={0.85} />
          <Stop offset="1" stopColor="#FF6A2B" stopOpacity={0.95} />
        </LinearGradient>
        <RadialGradient id="wsSinai" cx="270" cy="70" r="90" gradientUnits="userSpaceOnUse">
          <Stop offset="0" stopColor="#FFD58A" stopOpacity={0.6} />
          <Stop offset="1" stopColor="#FFD58A" stopOpacity={0} />
        </RadialGradient>
      </Defs>
      {stars(26, 7, 70).map((s, i) => <Circle key={i} cx={s.x} cy={s.y} r={s.s * 0.7} fill="#FFF3D6" opacity={s.o * 0.7} />)}
      <Rect width={400} height={240} fill="url(#wsSinai)" />
      {/* nuvem sobre o Sinai e relâmpago */}
      <Path d="M210 70 Q230 52 252 62 Q268 44 292 58 Q314 50 326 68 Q300 80 260 78 Q232 82 210 70 Z" fill="#3D2A44" opacity={0.95} />
      <Path d="M268 76 L262 92 L270 92 L263 110" stroke="#FFE7A3" strokeWidth={2} fill="none" strokeLinejoin="round" />
      <Path d="M150 190 L240 82 Q262 66 284 82 L380 190 Z" fill="#6B3A3A" />
      <Path d="M240 82 Q262 66 284 82 L300 104 Q270 96 250 108 Z" fill="#8F4E44" />
      <Path d="M0 176 Q70 150 150 170 T300 166 T400 170 V240 H0 Z" fill="#B5683D" />
      {/* coluna de fogo */}
      <Path d="M58 60 Q50 120 54 176 L84 176 Q88 120 80 60 Q70 40 58 60 Z" fill="url(#wsFire)" />
      <Path d="M0 200 Q100 182 200 198 T400 194 V240 H0 Z" fill="#7A4128" />
      <Tent x={110} y={204} c="#3A2218" />
      <Tent x={150} y={208} s={0.8} c="#4A2C1E" />
      <Tent x={300} y={210} s={1.1} c="#3A2218" />
      <Tent x={344} y={206} s={0.7} c="#4A2C1E" />
      <Palm x={30} y={214} c="#2A1810" />
      <Path d="M0 222 Q200 210 400 224 V240 H0 Z" fill="#4A2618" />
    </>
  );
}

function Reinos() {
  const wall = '#3E3354';
  return (
    <>
      <Defs>
        <RadialGradient id="wsDawn" cx="200" cy="150" r="170" gradientUnits="userSpaceOnUse">
          <Stop offset="0" stopColor="#FFE2A8" stopOpacity={0.75} />
          <Stop offset="1" stopColor="#FFE2A8" stopOpacity={0} />
        </RadialGradient>
      </Defs>
      <Rect width={400} height={240} fill="url(#wsDawn)" />
      <Circle cx={200} cy={150} r={26} fill="#FFE9B8" opacity={0.9} />
      <Path d="M0 170 Q90 120 190 150 T400 140 V240 H0 Z" fill="#6E5A7E" />
      {/* muralha com torres e o templo no alto */}
      <G>
        <Path d="M96 150 h208 v40 h-208 Z" fill={wall} />
        {Array.from({ length: 18 }, (_, i) => <Rect key={i} x={98 + i * 11.4} y={144} width={6} height={7} fill={wall} />)}
        {[96, 160, 236, 296].map((x) => <G key={x}><Rect x={x - 6} y={126} width={20} height={64} fill="#352B48" /><Path d={`M${x - 8} 126 h24 l-4 -6 h-16 Z`} fill="#2E2640" /></G>)}
        <Path d="M190 190 v-22 a10 10 0 0 1 20 0 v22 Z" fill="#1E1830" />
        <Rect x={176} y={110} width={48} height={40} fill="#4A3D62" />
        <Path d="M170 110 h60 l-6 -10 h-48 Z" fill="#5A4B74" />
        <Rect x={186} y={118} width={6} height={18} fill="#FFD58A" opacity={0.8} />
        <Rect x={208} y={118} width={6} height={18} fill="#FFD58A" opacity={0.8} />
      </G>
      <Path d="M0 196 Q120 176 220 192 T400 186 V240 H0 Z" fill="#4C5A3A" />
      <Olive x={40} y={208} c="#2E3A22" />
      <Olive x={76} y={214} s={0.8} c="#36442A" />
      <Olive x={346} y={210} s={1.1} c="#2E3A22" />
      <Path d="M0 222 Q200 208 400 224 V240 H0 Z" fill="#26301C" />
    </>
  );
}

function Sabedoria() {
  // a lira desenhada em constelação
  const lyre = [[200, 40], [176, 58], [170, 92], [184, 120], [216, 120], [230, 92], [224, 58]] as const;
  return (
    <>
      {stars(90, 3, 170).map((s, i) => <Circle key={i} cx={s.x} cy={s.y} r={s.s * 0.8} fill="#EAF2FF" opacity={s.o} />)}
      <Path d="M318 40 a22 22 0 1 0 18 34 a18 18 0 1 1 -18 -34 Z" fill="#F4EEDB" />
      <Path d={`M${lyre.map(([x, y]) => `${x} ${y}`).join(' L')} Z M184 120 L184 70 M200 120 L200 62 M216 120 L216 70`} stroke="#92D6AC" strokeOpacity={0.55} strokeWidth={1} fill="none" />
      {lyre.map(([x, y], i) => <Circle key={i} cx={x} cy={y} r={2.4} fill="#D8FFE6" />)}
      <Path d="M0 176 Q110 150 210 168 T400 160 V240 H0 Z" fill="#1B2A4A" />
      <Path d="M0 200 Q200 186 400 202 V214 Q200 200 0 214 Z" fill="#3A5A8C" opacity={0.7} />
      {[60, 80, 110, 300, 330, 356].map((x, i) => <Cypress key={x} x={x} y={200} h={50 + (i % 3) * 14} c="#0F1A30" />)}
      <Path d="M0 214 Q200 204 400 216 V240 H0 Z" fill="#0B1426" />
      {Array.from({ length: 12 }, (_, i) => <Rect key={i} x={40 + i * 28} y={205 + (i % 2) * 3} width={10} height={1.2} fill="#CFE3FF" opacity={0.45} />)}
    </>
  );
}

function Profetas() {
  const r = rand(11);
  return (
    <>
      <Path d="M20 50 Q90 20 160 44 Q230 18 300 40 Q360 26 400 46 V80 Q300 70 200 84 Q90 72 0 86 Z" fill="#2A161A" />
      <Path d="M122 70 L112 100 L124 100 L108 138" stroke="#FFD9B0" strokeWidth={2.2} fill="none" strokeLinejoin="round" />
      {/* ruínas de zigurate */}
      <Path d="M220 188 h150 v-18 h-14 v-18 h-16 v-18 h-16 v-18 h-46 v18 h-16 v18 h-16 v18 h-26 Z" fill="#3A1E1C" />
      <Path d="M300 116 l10 -10 l6 10" stroke="#3A1E1C" strokeWidth={4} />
      <Path d="M0 186 Q120 168 230 184 T400 180 V240 H0 Z" fill="#4A2620" />
      {/* lâmpada acesa em primeiro plano */}
      <Defs>
        <RadialGradient id="wsLamp" cx="96" cy="196" r="60" gradientUnits="userSpaceOnUse">
          <Stop offset="0" stopColor="#FFB86B" stopOpacity={0.75} />
          <Stop offset="1" stopColor="#FFB86B" stopOpacity={0} />
        </RadialGradient>
      </Defs>
      <Rect width={400} height={240} fill="url(#wsLamp)" />
      <Path d="M70 208 Q96 196 124 208 L116 216 Q96 222 78 216 Z" fill="#8A4A28" />
      <Path d="M96 196 Q90 186 96 176 Q102 186 96 196 Z" fill="#FFE2A0" />
      {Array.from({ length: 16 }, (_, i) => <Circle key={i} cx={60 + r() * 90} cy={120 + r() * 70} r={0.8 + r()} fill="#FFB070" opacity={0.4 + r() * 0.5} />)}
      <Path d="M0 222 Q200 210 400 224 V240 H0 Z" fill="#2A1412" />
    </>
  );
}

function Evangelhos() {
  return (
    <>
      <Defs>
        <RadialGradient id="wsSun" cx="300" cy="150" r="140" gradientUnits="userSpaceOnUse">
          <Stop offset="0" stopColor="#FFF1C8" stopOpacity={0.9} />
          <Stop offset="1" stopColor="#FFF1C8" stopOpacity={0} />
        </RadialGradient>
      </Defs>
      <Rect width={400} height={240} fill="url(#wsSun)" />
      <Circle cx={300} cy={150} r={22} fill="#FFF6DC" />
      {Array.from({ length: 9 }, (_, i) => {
        const a = (-160 + i * 17) * (Math.PI / 180);
        return <Path key={i} d={`M300 150 L${300 + Math.cos(a) * 200} ${150 + Math.sin(a) * 200}`} stroke="#FFF1C8" strokeOpacity={0.18} strokeWidth={6} />;
      })}
      <Path d="M0 150 Q80 120 160 146 T300 140 T400 146 V170 H0 Z" fill="#7C9A6A" />
      <Rect y={158} width={400} height={50} fill="#4F86B4" />
      {Array.from({ length: 14 }, (_, i) => <Rect key={i} x={20 + i * 27} y={166 + (i % 3) * 10} width={14} height={1.4} fill="#FFF6DC" opacity={0.6} />)}
      {/* barco de pesca */}
      <G transform="translate(150 178)">
        <Path d="M-26 0 Q0 12 26 0 L20 8 Q0 14 -20 8 Z" fill="#5A3A24" />
        <Path d="M0 0 V-34" stroke="#3A2618" strokeWidth={2} />
        <Path d="M1 -32 Q18 -18 16 -2 L1 -2 Z" fill="#F6ECD6" />
      </G>
      <Path d="M0 206 Q120 194 240 206 T400 202 V240 H0 Z" fill="#6E8A54" />
      <Olive x={330} y={220} c="#3E5A30" />
      <Path d="M0 226 Q200 216 400 228 V240 H0 Z" fill="#4A6436" />
    </>
  );
}

function Igreja() {
  return (
    <>
      <Circle cx={90} cy={60} r={18} fill="#FFF4D6" opacity={0.9} />
      <Path d="M0 120 Q60 112 120 118 T260 116 T400 120 V150 H0 Z" fill="#9AB8C8" opacity={0.6} />
      <Rect y={130} width={400} height={80} fill="#2E6A96" />
      {Array.from({ length: 18 }, (_, i) => <Path key={i} d={`M${10 + i * 22} ${146 + (i % 4) * 12} q6 -4 12 0`} stroke="#DDF0FF" strokeOpacity={0.55} strokeWidth={1.4} fill="none" />)}
      {/* navio com vela */}
      <G transform="translate(240 168)">
        <Path d="M-46 0 Q0 18 46 0 L38 12 Q0 22 -38 12 Z" fill="#4A2E1C" />
        <Path d="M0 0 V-70" stroke="#2E1C12" strokeWidth={3} />
        <Path d="M2 -66 Q34 -40 30 -6 L2 -6 Z" fill="#F4E6CC" />
        <Path d="M-2 -60 Q-26 -36 -22 -8 L-2 -8 Z" fill="#E6D4B4" />
        <Path d="M0 -70 l12 4 l-12 4 Z" fill="#C24A3A" />
      </G>
      {/* aqueduto romano na costa */}
      <Path d="M0 210 V176 h150 v34" fill="#B98A62" />
      {[0, 30, 60, 90, 120].map((x) => <Path key={x} d={`M${x + 6} 210 v-18 a9 9 0 0 1 18 0 v18 Z`} fill="#2E6A96" opacity={0.85} />)}
      <Rect y={170} width={150} height={7} fill="#A3774F" />
      <Path d="M0 210 Q200 200 400 214 V240 H0 Z" fill="#C79A6A" />
      <Path d="M0 226 Q200 218 400 230 V240 H0 Z" fill="#9C7450" />
    </>
  );
}

function NovaCriacao() {
  return (
    <>
      <Defs>
        <RadialGradient id="wsGlory" cx="200" cy="120" r="180" gradientUnits="userSpaceOnUse">
          <Stop offset="0" stopColor="#FFFFFF" stopOpacity={0.95} />
          <Stop offset="0.45" stopColor="#FFE9B8" stopOpacity={0.5} />
          <Stop offset="1" stopColor="#FFE9B8" stopOpacity={0} />
        </RadialGradient>
        <LinearGradient id="wsRiver" x1="0" y1="0" x2="0" y2="1">
          <Stop offset="0" stopColor="#E6FBFF" />
          <Stop offset="1" stopColor="#7FD2E8" />
        </LinearGradient>
      </Defs>
      {Array.from({ length: 16 }, (_, i) => {
        const a = (i / 16) * Math.PI * 2;
        return <Path key={i} d={`M200 120 L${200 + Math.cos(a) * 260} ${120 + Math.sin(a) * 260}`} stroke="#FFF6DC" strokeOpacity={0.16} strokeWidth={10} />;
      })}
      <Rect width={400} height={240} fill="url(#wsGlory)" />
      {/* cidade de luz com doze portas (as da frente) */}
      <Path d="M110 150 V96 h180 v54 Z" fill="#F6E6B8" opacity={0.95} />
      {[118, 150, 182, 214, 246].map((x) => <Path key={x} d={`M${x} 150 v-24 a12 12 0 0 1 24 0 v24 Z`} fill="#FFFDF5" stroke="#E6C77A" strokeWidth={1.2} />)}
      {[110, 170, 230, 290].map((x) => <Rect key={x} x={x - 8} y={80} width={16} height={70} fill="#EED7A0" />)}
      <Path d="M0 170 Q100 150 200 160 T400 166 V240 H0 Z" fill="#7FBF8E" />
      <Path d="M186 150 Q170 196 140 240 H260 Q230 196 214 150 Z" fill="url(#wsRiver)" />
      {/* árvore da vida dos dois lados do rio */}
      {([[96, 212], [304, 212]] as const).map(([x, y]) => (
        <G key={x}>
          <Path d={`M${x} ${y} v-26`} stroke="#5A3E2A" strokeWidth={4} />
          <Circle cx={x} cy={y - 36} r={20} fill="#3E9A5E" />
          <Circle cx={x - 12} cy={y - 30} r={12} fill="#4CAF6E" />
          <Circle cx={x + 12} cy={y - 30} r={12} fill="#4CAF6E" />
          {[-8, 6, 0, 12, -14].map((dx, i) => <Circle key={i} cx={x + dx} cy={y - 40 + (i % 3) * 8} r={2.4} fill="#FFB0C8" />)}
        </G>
      ))}
      <Path d="M0 226 Q200 216 400 228 V240 H0 Z" fill="#5E9E6E" />
    </>
  );
}

const SCENES: Record<WorldId, () => ReactElement> = {
  origens: Origens, reinos: Reinos, sabedoria: Sabedoria, profetas: Profetas,
  evangelhos: Evangelhos, igreja: Igreja, 'nova-criacao': NovaCriacao,
};

/** Cenas pintadas em 2.5D (1600×960), entregues pelo Codex. Sem pintura, vale a cena vetorial. */
export const WORLD_ART: Partial<Record<WorldId, number>> = {
  origens: require('../../../assets/worlds/origens.webp'),
  reinos: require('../../../assets/worlds/reinos.webp'),
  sabedoria: require('../../../assets/worlds/sabedoria.webp'),
  profetas: require('../../../assets/worlds/profetas.webp'),
  evangelhos: require('../../../assets/worlds/evangelhos.webp'),
  igreja: require('../../../assets/worlds/igreja.webp'),
  'nova-criacao': require('../../../assets/worlds/nova-criacao.webp'),
};

/**
 * Paisagem própria de cada mundo: a pintura 2.5D (assunto no alto e no centro, base calma para o
 * painel), cortada pelas laterais em telas estreitas; sem pintura, a cena vetorial de mesma paleta.
 */
export const WorldScene = memo(function WorldScene({ id, vectorOnly = false }: { id: WorldId; vectorOnly?: boolean }) {
  const art = vectorOnly ? undefined : WORLD_ART[id];
  if (art) {
    return (
      <Image source={art} resizeMode="cover" style={[StyleSheet.absoluteFill, { width: '100%', height: '100%' }]} testID={`world-art-${id}`}
        accessibilityElementsHidden importantForAccessibility="no-hide-descendants" />
    );
  }
  const theme = WORLD_THEMES[id];
  const Scene = SCENES[id];
  return (
    <Svg style={StyleSheet.absoluteFill} width="100%" height="100%" viewBox="0 0 400 240" preserveAspectRatio="xMidYMax slice"
      accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
      <Defs>
        <LinearGradient id={`wsSky-${id}`} x1="0" y1="0" x2="0" y2="1">
          <Stop offset="0" stopColor={theme.sky[0]} />
          <Stop offset="1" stopColor={theme.sky[1]} />
        </LinearGradient>
      </Defs>
      <Rect width={400} height={240} fill={`url(#wsSky-${id})`} />
      <Scene />
    </Svg>
  );
});
