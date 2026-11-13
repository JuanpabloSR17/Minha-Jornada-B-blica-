import { memo } from 'react';
import { Image } from 'react-native';
import Svg, { Circle, Defs, Ellipse, G, Image as SvgImage, LinearGradient, Path, RadialGradient, Rect, Stop } from 'react-native-svg';

/**
 * Cenários em camadas. Cada camada é um componente próprio para poder ser animada ou
 * reaproveitada: fundo estático, fogo/luz (animável) e efeitos. As camadas SVG usam o mesmo viewBox
 * e `preserveAspectRatio="xMidYMid slice"`, então se sobrepõem alinhadas em qualquer tamanho.
 */

export const CAMP_VIEWBOX = '0 0 360 480';
/** Posição da fogueira no viewBox do acampamento (a luz animada e o avatar usam a mesma). */
const CAMP_FIRE = { x: 264, y: 282 };

type LayerProps = { width: number; height: number };
const svgProps = (vb: string, { width, height }: LayerProps) => ({ width, height, viewBox: vb, preserveAspectRatio: 'xMidYMid slice' as const });

const campNight = require('../../../../assets/journey/camp-night.webp');
const campFlame = require('../../../../assets/journey/camp-flame.webp');

/** Ilustração em 3:4, com o mesmo recorte central das camadas de fogo. */
export const CampBackdrop = memo(function CampBackdrop({ width, height }: LayerProps) {
  return (
    <Image
      source={campNight}
      style={{ width, height }}
      resizeMode="cover"
      accessible={false}
    />
  );
});

/** Luz da fogueira no chão e nas tendas (camada animável: opacidade pulsa). */
export const CampFireGlow = memo(function CampFireGlow(p: LayerProps) {
  return (
    <Svg {...svgProps(CAMP_VIEWBOX, p)}>
      <Defs>
        <RadialGradient id="fireGlow" cx="50%" cy="50%" r="50%">
          <Stop offset="0" stopColor="#FF9A3C" stopOpacity={0.55} />
          <Stop offset="0.5" stopColor="#E86A2A" stopOpacity={0.18} />
          <Stop offset="1" stopColor="#E86A2A" stopOpacity={0} />
        </RadialGradient>
      </Defs>
      <Ellipse cx={CAMP_FIRE.x} cy={CAMP_FIRE.y - 10} rx={150} ry={120} fill="url(#fireGlow)" />
    </Svg>
  );
});

/** A chama pintada usa as mesmas coordenadas da luz e da lenha no cenário. */
export const CampFlames = memo(function CampFlames(p: LayerProps) {
  return (
    <Svg {...svgProps(CAMP_VIEWBOX, p)}>
      <SvgImage href={campFlame} x={CAMP_FIRE.x - 25} y={CAMP_FIRE.y - 50} width={50} height={55} />
    </Svg>
  );
});

/** Luz quente da fogueira sobre o personagem (camada animável, acompanha o brilho do fogo). */
export const RimLight = memo(function RimLight(p: LayerProps) {
  return (
    <Svg width={p.width} height={p.height} viewBox="0 0 100 100" preserveAspectRatio="none">
      <Defs>
        <LinearGradient id="rim" x1="1" y1="0.4" x2="0" y2="0.6">
          <Stop offset="0" stopColor="#FF9A3C" stopOpacity={0.4} />
          <Stop offset="0.45" stopColor="#FF9A3C" stopOpacity={0.08} />
          <Stop offset="1" stopColor="#1A1440" stopOpacity={0.25} />
        </LinearGradient>
      </Defs>
      <Rect x={0} y={0} width={100} height={100} fill="url(#rim)" />
    </Svg>
  );
});

// ------------------------------------------------------------------ Tabernáculo

export const TABERNACLE_VIEWBOX = '0 0 360 300';

/** Interior do Tabernáculo: cortinas roxas e azuis, colunas de acácia com ouro, chão de pedra. */
export const TabernacleBackdrop = memo(function TabernacleBackdrop(p: LayerProps) {
  return (
    <Svg {...svgProps(TABERNACLE_VIEWBOX, p)}>
      <Defs>
        <LinearGradient id="tabWall" x1="0" y1="0" x2="0" y2="1">
          <Stop offset="0" stopColor="#1A1230" />
          <Stop offset="1" stopColor="#2A1838" />
        </LinearGradient>
        <LinearGradient id="tabCurtain" x1="0" y1="0" x2="1" y2="0">
          <Stop offset="0" stopColor="#2C1A48" />
          <Stop offset="0.5" stopColor="#5A3482" />
          <Stop offset="1" stopColor="#2C1A48" />
        </LinearGradient>
        <LinearGradient id="tabFloor" x1="0" y1="0" x2="0" y2="1">
          <Stop offset="0" stopColor="#5A4636" />
          <Stop offset="1" stopColor="#2A1E16" />
        </LinearGradient>
        <LinearGradient id="tabPillar" x1="0" y1="0" x2="1" y2="0">
          <Stop offset="0" stopColor="#7A5420" />
          <Stop offset="0.45" stopColor="#E3B65A" />
          <Stop offset="1" stopColor="#6A4418" />
        </LinearGradient>
        <RadialGradient id="tabLight" cx="50%" cy="40%" r="60%">
          <Stop offset="0" stopColor="#FFD777" stopOpacity={0.35} />
          <Stop offset="1" stopColor="#FFD777" stopOpacity={0} />
        </RadialGradient>
      </Defs>
      <Rect x={0} y={0} width={360} height={300} fill="url(#tabWall)" />
      {/* véu ao fundo: azul, púrpura e carmesim (Êxodo 26:31) */}
      <Path d="M60 20 H300 V210 H60 Z" fill="url(#tabCurtain)" />
      {[80, 110, 140, 170, 200, 230, 260, 290].map((x) => <Path key={x} d={`M${x} 20 C${x - 6} 90 ${x + 6} 150 ${x} 210`} stroke="#1E1236" strokeWidth={3} opacity={0.5} fill="none" />)}
      <Path d="M60 26 H300" stroke="#9C2F3A" strokeWidth={5} />
      <Path d="M60 34 H300" stroke="#2F4C8A" strokeWidth={3} />
      {/* querubins bordados no véu (silhueta discreta) */}
      <Path d="M150 110 C160 80 176 70 180 66 C184 70 200 80 210 110 C196 96 186 92 180 92 C174 92 164 96 150 110 Z" fill="#C9A24A" opacity={0.28} />
      <Rect x={0} y={0} width={360} height={300} fill="url(#tabLight)" />
      {/* colunas */}
      {[34, 326].map((x) => (
        <G key={x}>
          <Rect x={x - 12} y={10} width={24} height={210} fill="url(#tabPillar)" />
          <Rect x={x - 16} y={6} width={32} height={10} fill="#C9A24A" />
          <Rect x={x - 16} y={214} width={32} height={10} fill="#8A6A3A" />
        </G>
      ))}
      {/* cortinas laterais em primeiro plano */}
      <Path d="M0 0 H54 C40 80 46 160 28 300 H0 Z" fill="#3A2160" />
      <Path d="M360 0 H306 C320 80 314 160 332 300 H360 Z" fill="#3A2160" />
      <Path d="M54 0 C40 80 46 160 28 300" stroke="#C9A24A" strokeWidth={3} fill="none" />
      <Path d="M306 0 C320 80 314 160 332 300" stroke="#C9A24A" strokeWidth={3} fill="none" />
      {/* chão de pedra */}
      <Path d="M0 214 H360 V300 H0 Z" fill="url(#tabFloor)" />
      {[236, 262, 290].map((y) => <Path key={y} d={`M0 ${y} H360`} stroke="#22180F" strokeWidth={1} opacity={0.6} />)}
      {[40, 100, 160, 220, 280, 340].map((x, i) => <Path key={x} d={`M${x + (i % 2) * 20} 214 V300`} stroke="#22180F" strokeWidth={1} opacity={0.4} />)}
    </Svg>
  );
});

// ------------------------------------------------------------------ Santuário

export const HALL_VIEWBOX = '0 0 360 360';

/** Sala de exposição: pedra, colunas, cortinas roxas com franja dourada. */
export const SanctuaryHall = memo(function SanctuaryHall(p: LayerProps) {
  return (
    <Svg {...svgProps(HALL_VIEWBOX, p)}>
      <Defs>
        <LinearGradient id="hallWall" x1="0" y1="0" x2="0" y2="1">
          <Stop offset="0" stopColor="#2A1F1A" />
          <Stop offset="0.7" stopColor="#4A3A2C" />
          <Stop offset="1" stopColor="#2A1F18" />
        </LinearGradient>
        <LinearGradient id="hallStone" x1="0" y1="0" x2="1" y2="0">
          <Stop offset="0" stopColor="#4A3C30" />
          <Stop offset="0.5" stopColor="#7A6450" />
          <Stop offset="1" stopColor="#3E3228" />
        </LinearGradient>
        <LinearGradient id="hallDrape" x1="0" y1="0" x2="1" y2="0">
          <Stop offset="0" stopColor="#2A1446" />
          <Stop offset="0.5" stopColor="#4E2A74" />
          <Stop offset="1" stopColor="#2A1446" />
        </LinearGradient>
        <RadialGradient id="hallLight" cx="50%" cy="45%" r="55%">
          <Stop offset="0" stopColor="#FFC870" stopOpacity={0.35} />
          <Stop offset="1" stopColor="#FFC870" stopOpacity={0} />
        </RadialGradient>
      </Defs>
      <Rect x={0} y={0} width={360} height={360} fill="url(#hallWall)" />
      {[0, 1, 2, 3, 4, 5, 6].map((r) => (
        <Path key={r} d={`M48 ${40 + r * 36} H312`} stroke="#22180F" strokeWidth={1} opacity={0.5} />
      ))}
      <Rect x={0} y={0} width={360} height={360} fill="url(#hallLight)" />
      {[24, 336].map((x) => (
        <G key={x}>
          <Rect x={x - 18} y={0} width={36} height={300} fill="url(#hallStone)" />
          {[60, 120, 180, 240].map((y) => <Path key={y} d={`M${x - 18} ${y} H${x + 18}`} stroke="#22180F" strokeWidth={1} opacity={0.5} />)}
        </G>
      ))}
      {/* cortinas no alto */}
      <Path d="M0 0 H150 C120 20 90 40 60 46 C40 50 20 60 0 80 Z" fill="url(#hallDrape)" />
      <Path d="M360 0 H210 C240 20 270 40 300 46 C320 50 340 60 360 80 Z" fill="url(#hallDrape)" />
      <Path d="M0 80 C20 60 40 50 60 46 C90 40 120 20 150 0" stroke="#D9A441" strokeWidth={3} fill="none" />
      <Path d="M360 80 C340 60 320 50 300 46 C270 40 240 20 210 0" stroke="#D9A441" strokeWidth={3} fill="none" />
      {/* plataforma de pedra */}
      <Path d="M0 300 H360 V360 H0 Z" fill="#2A2018" />
      <Path d="M20 296 H340 V312 H20 Z" fill="#5A4838" />
      <Path d="M20 296 H340" stroke="#8A6E54" strokeWidth={2} />
    </Svg>
  );
});

/** Raios dourados (revelação e destaque). Camada animável por rotação/opacidade. */
export const GoldRays = memo(function GoldRays({ size, opacity = 1 }: { size: number; opacity?: number }) {
  const rays = Array.from({ length: 16 }, (_, i) => i * 22.5);
  return (
    <Svg width={size} height={size} viewBox="-100 -100 200 200" opacity={opacity}>
      <Defs>
        <RadialGradient id="rayFade" cx="50%" cy="50%" r="50%">
          <Stop offset="0" stopColor="#FFE7A0" stopOpacity={0.9} />
          <Stop offset="0.6" stopColor="#F1B840" stopOpacity={0.25} />
          <Stop offset="1" stopColor="#F1B840" stopOpacity={0} />
        </RadialGradient>
      </Defs>
      {rays.map((a) => (
        <Path key={a} d="M0 0 L-7 -100 L7 -100 Z" fill="url(#rayFade)" transform={`rotate(${a})`} opacity={a % 45 === 0 ? 0.9 : 0.5} />
      ))}
      <Circle cx={0} cy={0} r={40} fill="url(#rayFade)" />
    </Svg>
  );
});

/** Suporte iluminado (pedestal) para expor um artefato. */
export const Pedestal = memo(function Pedestal({ width, lit }: { width: number; lit: boolean }) {
  return (
    <Svg width={width} height={width * 0.42} viewBox="0 0 200 84">
      <Defs>
        <LinearGradient id="pedTop" x1="0" y1="0" x2="1" y2="0">
          <Stop offset="0" stopColor="#5A4636" />
          <Stop offset="0.5" stopColor="#8A7058" />
          <Stop offset="1" stopColor="#4A3A2C" />
        </LinearGradient>
        <RadialGradient id={`pedLight${lit ? 1 : 0}`} cx="50%" cy="20%" r="60%">
          <Stop offset="0" stopColor="#FFD777" stopOpacity={lit ? 0.55 : 0} />
          <Stop offset="1" stopColor="#FFD777" stopOpacity={0} />
        </RadialGradient>
      </Defs>
      <Ellipse cx={100} cy={14} rx={96} ry={14} fill={`url(#pedLight${lit ? 1 : 0})`} />
      <Path d="M8 14 H192 L184 34 H16 Z" fill="url(#pedTop)" stroke="#22180F" strokeWidth={1.4} />
      <Path d="M22 34 H178 V70 H22 Z" fill="#4E2A74" />
      <Path d="M22 34 H178" stroke="#D9A441" strokeWidth={3} />
      <Path d="M22 66 H178" stroke="#D9A441" strokeWidth={2} strokeDasharray="3 4" />
      <Path d="M100 42 c-6 6 -10 10 -16 12 c6 2 10 6 16 12 c6 -6 10 -10 16 -12 c-6 -2 -10 -6 -16 -12 Z" fill="#D9A441" opacity={0.8} />
      <Path d="M12 70 H188 V84 H12 Z" fill="#3A2C22" />
    </Svg>
  );
});
