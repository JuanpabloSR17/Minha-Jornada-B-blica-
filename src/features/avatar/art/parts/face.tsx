import type { ReactElement } from 'react';
import { Circle, ClipPath, Defs, G, Path, RadialGradient, Stop } from 'react-native-svg';
import { lineOf, mix, shade } from '../color';
import { CANVAS, FACE, f } from '../geometry';
import type { ArtContext, VectorArt } from '../types';

const CX = CANVAS.cx;
const EX = CX + FACE.eyeDX; // olho direito (lado +x); o esquerdo é espelhado
const EY = FACE.eyeY;
const MIRROR = `translate(${CX * 2} 0) scale(-1 1)`;
const LASH = '#24160E';

/** Desenha o olho direito e o espelha, mantendo os dois idênticos. */
const pair = (draw: (ctx: ArtContext) => ReactElement) => (ctx: ArtContext) => {
  const el = draw(ctx);
  return (
    <G>
      <G>{el}</G>
      <G transform={MIRROR}>{el}</G>
    </G>
  );
};

type EyeShape = { sclera: string; lid: string; crease: string; lower: string; irisR: number; irisDy: number; heavyLid?: string };

const EYES: Record<string, EyeShape> = {
  almond: {
    sclera: `M${EX - 16} ${EY + 1} C${EX - 9} ${EY - 10} ${EX + 8} ${EY - 11} ${EX + 17} ${EY - 2} C${EX + 10} ${EY + 7} ${EX - 7} ${EY + 8} ${EX - 16} ${EY + 1} Z`,
    lid: `M${EX - 18} ${EY + 1} C${EX - 10} ${EY - 12} ${EX + 8} ${EY - 13} ${EX + 19} ${EY - 3} L${EX + 23} ${EY - 7}`,
    crease: `M${EX - 12} ${EY - 10} C${EX - 4} ${EY - 17} ${EX + 9} ${EY - 16} ${EX + 15} ${EY - 9}`,
    lower: `M${EX - 11} ${EY + 6} C${EX - 3} ${EY + 9} ${EX + 7} ${EY + 8} ${EX + 14} ${EY + 3}`,
    irisR: 7.6,
    irisDy: -1,
  },
  round: {
    sclera: `M${EX - 15} ${EY} C${EX - 13} ${EY - 12} ${EX + 12} ${EY - 13} ${EX + 16} ${EY - 1} C${EX + 12} ${EY + 9} ${EX - 11} ${EY + 10} ${EX - 15} ${EY} Z`,
    lid: `M${EX - 17} ${EY} C${EX - 14} ${EY - 14} ${EX + 12} ${EY - 15} ${EX + 18} ${EY - 2} L${EX + 22} ${EY - 5}`,
    crease: `M${EX - 13} ${EY - 13} C${EX - 6} ${EY - 20} ${EX + 8} ${EY - 20} ${EX + 15} ${EY - 12}`,
    lower: `M${EX - 11} ${EY + 7} C${EX - 3} ${EY + 11} ${EX + 7} ${EY + 10} ${EX + 13} ${EY + 5}`,
    irisR: 8.4,
    irisDy: 0,
  },
  soft: {
    sclera: `M${EX - 16} ${EY + 1} C${EX - 10} ${EY - 6} ${EX + 9} ${EY - 7} ${EX + 17} ${EY} C${EX + 10} ${EY + 7} ${EX - 7} ${EY + 8} ${EX - 16} ${EY + 1} Z`,
    lid: `M${EX - 18} ${EY + 1} C${EX - 10} ${EY - 8} ${EX + 9} ${EY - 9} ${EX + 19} ${EY - 1} L${EX + 22} ${EY - 3}`,
    crease: `M${EX - 14} ${EY - 7} C${EX - 4} ${EY - 14} ${EX + 10} ${EY - 13} ${EX + 17} ${EY - 5}`,
    lower: `M${EX - 11} ${EY + 6} C${EX - 3} ${EY + 9} ${EX + 7} ${EY + 8} ${EX + 14} ${EY + 4}`,
    irisR: 7.6,
    irisDy: 1.5,
    heavyLid: `M${EX - 17} ${EY + 1} C${EX - 10} ${EY - 8} ${EX + 9} ${EY - 9} ${EX + 18} ${EY - 1} C${EX + 8} ${EY - 4} ${EX - 8} ${EY - 3} ${EX - 17} ${EY + 1} Z`,
  },
};

function eyeArt(kind: keyof typeof EYES): VectorArt {
  const e = EYES[kind]!;
  return (ctx) => {
    const clip = `${ctx.uid}-eye-${kind}`;
    const iris = `${ctx.uid}-iris`;
    const lidShade = shade(ctx.skin, -0.32);
    const el = (
      <G>
        <Path d={e.sclera} fill="#F6EFE4" />
        <G clipPath={`url(#${clip})`}>
          <Circle cx={EX + 1} cy={EY + e.irisDy} r={e.irisR} fill={`url(#${iris})`} />
          <Circle cx={EX + 1} cy={EY + e.irisDy} r={e.irisR * 0.42} fill="#140C08" />
          <Path d={`M${EX - 16} ${EY - 12} L${EX + 18} ${EY - 12} L${EX + 18} ${EY - 4} C${EX + 6} ${EY - 7} ${EX - 6} ${EY - 7} ${EX - 16} ${EY - 3} Z`} fill={shade(ctx.skin, -0.45)} opacity={0.35} />
        </G>
        <Circle cx={EX + 4} cy={EY + e.irisDy - 3} r={2.3} fill="#FFFFFF" />
        <Circle cx={EX - 2} cy={EY + e.irisDy + 3} r={1} fill="#FFFFFF" opacity={0.8} />
        {e.heavyLid ? <Path d={e.heavyLid} fill={shade(ctx.skin, -0.12)} /> : null}
        <Path d={e.crease} stroke={lidShade} strokeWidth={1.8} fill="none" strokeLinecap="round" opacity={0.75} />
        <Path d={e.lid} stroke={LASH} strokeWidth={3.4} fill="none" strokeLinecap="round" strokeLinejoin="round" />
        <Path d={e.lower} stroke={shade(ctx.skin, -0.42)} strokeWidth={1.3} fill="none" strokeLinecap="round" opacity={0.7} />
      </G>
    );
    return (
      <G>
        <Defs>
          <ClipPath id={clip}>
            <Path d={e.sclera} />
          </ClipPath>
          <RadialGradient id={iris} cx="45%" cy="40%" r="60%">
            <Stop offset="0" stopColor="#9A6A3C" />
            <Stop offset="0.6" stopColor="#5A3518" />
            <Stop offset="1" stopColor="#2B180B" />
          </RadialGradient>
        </Defs>
        <G>{el}</G>
        <G transform={MIRROR}>{el}</G>
      </G>
    );
  };
}

export const eyes: Record<string, VectorArt> = {
  almond: eyeArt('almond'),
  round: eyeArt('round'),
  soft: eyeArt('soft'),
};

const browColor = (ctx: ArtContext) => mix(shade(ctx.hair, -0.15), lineOf(ctx.skin), 0.25);

export const brows: Record<string, VectorArt> = {
  soft: pair((ctx) => (
    <Path d={`M${EX - 18} ${EY - 22} C${EX - 8} ${EY - 31} ${EX + 8} ${EY - 32} ${EX + 21} ${EY - 26} C${EX + 8} ${EY - 28} ${EX - 6} ${EY - 26} ${EX - 17} ${EY - 18} Z`} fill={browColor(ctx)} />
  )),
  straight: pair((ctx) => (
    <Path d={`M${EX - 19} ${EY - 24} C${EX - 6} ${EY - 30} ${EX + 8} ${EY - 30} ${EX + 21} ${EY - 27} L${EX + 20} ${EY - 22} C${EX + 6} ${EY - 25} ${EX - 6} ${EY - 24} ${EX - 18} ${EY - 18} Z`} fill={browColor(ctx)} />
  )),
  thick: pair((ctx) => (
    <G>
      <Path d={`M${EX - 20} ${EY - 21} C${EX - 12} ${EY - 35} ${EX + 6} ${EY - 37} ${EX + 22} ${EY - 27} C${EX + 10} ${EY - 27} ${EX - 4} ${EY - 25} ${EX - 18} ${EY - 15} Z`} fill={browColor(ctx)} />
      {[0, 6, 12].map((dx) => (
        <Path key={dx} d={`M${EX - 12 + dx} ${EY - 22} l4 -9`} stroke={shade(browColor(ctx), -0.2)} strokeWidth={1.3} strokeLinecap="round" />
      ))}
    </G>
  )),
};

const lipColor = (skin: string) => mix(shade(skin, -0.12), '#B4524C', 0.38);
const MY = FACE.mouthY;

export const mouths: Record<string, VectorArt> = {
  smile: ({ skin }) => (
    <G>
      <Path d={`M495 ${MY - 2} C503 ${MY + 4} 521 ${MY + 4} 529 ${MY - 2}`} stroke={shade(lipColor(skin), -0.45)} strokeWidth={2.6} fill="none" strokeLinecap="round" />
      <Path d={`M499 ${MY + 4} C507 ${MY + 12} 517 ${MY + 12} 525 ${MY + 4} C517 ${MY + 7} 507 ${MY + 7} 499 ${MY + 4} Z`} fill={lipColor(skin)} />
      <Path d={`M492 ${MY - 4} q3 2 4 4 M532 ${MY - 4} q-3 2 -4 4`} stroke={shade(skin, -0.4)} strokeWidth={1.8} fill="none" strokeLinecap="round" />
    </G>
  ),
  calm: ({ skin }) => (
    <G>
      <Path d={`M499 ${MY - 3} C505 ${MY - 6} 510 ${MY - 4} 512 ${MY - 3} C514 ${MY - 4} 519 ${MY - 6} 525 ${MY - 3} C519 ${MY} 505 ${MY} 499 ${MY - 3} Z`} fill={shade(lipColor(skin), -0.1)} />
      <Path d={`M498 ${MY} C506 ${MY + 2} 518 ${MY + 2} 526 ${MY}`} stroke={shade(lipColor(skin), -0.45)} strokeWidth={2.4} fill="none" strokeLinecap="round" />
      <Path d={`M501 ${MY + 3} C508 ${MY + 10} 516 ${MY + 10} 523 ${MY + 3} C516 ${MY + 5} 508 ${MY + 5} 501 ${MY + 3} Z`} fill={lipColor(skin)} />
    </G>
  ),
  joy: ({ skin }) => (
    <G>
      <Path d={`M492 ${MY - 4} C502 ${MY - 1} 522 ${MY - 1} 532 ${MY - 4} C527 ${MY + 16} 497 ${MY + 16} 492 ${MY - 4} Z`} fill="#5A2622" stroke={shade(lipColor(skin), -0.4)} strokeWidth={2.2} strokeLinejoin="round" />
      <Path d={`M496 ${MY - 2} C506 ${MY + 1} 518 ${MY + 1} 528 ${MY - 2} L526 ${MY + 3} C516 ${MY + 5} 508 ${MY + 5} 498 ${MY + 3} Z`} fill="#FBF5EC" />
      <Path d={`M502 ${MY + 9} C508 ${MY + 12} 516 ${MY + 12} 522 ${MY + 9}`} stroke="#C86B60" strokeWidth={3} fill="none" strokeLinecap="round" opacity={0.8} />
    </G>
  ),
};

const MUSTACHE = `M490 ${MY - 9} C498 ${MY - 16} 507 ${MY - 15} 512 ${MY - 11} C517 ${MY - 15} 526 ${MY - 16} 534 ${MY - 9} C530 ${MY - 4} 522 ${MY - 6} 512 ${MY - 6} C502 ${MY - 6} 494 ${MY - 4} 490 ${MY - 9} Z`;
const BEARD = `M436 300 C436 336 452 372 478 388 C492 398 504 402 512 402 C520 402 532 398 546 388 C572 372 588 336 588 300 C584 328 570 352 552 362 C540 368 532 364 528 ${MY + 8} C520 ${MY + 14} 504 ${MY + 14} 496 ${MY + 8} C492 364 484 368 472 362 C454 352 440 328 436 300 Z`;

const hairStrokes = (c: string, n: number, seed: number) =>
  Array.from({ length: n }, (_, i) => {
    const t = (i + 0.5) / n;
    const x = 452 + t * 120;
    const y = 332 + Math.sin(t * Math.PI) * 44 + ((i * seed) % 5);
    return <Path key={i} d={`M${f(x)} ${f(y)} q${f((t - 0.5) * 5)} 6 ${f((t - 0.5) * 3)} 11`} stroke={c} strokeWidth={1.6} strokeLinecap="round" opacity={0.6} />;
  });

export const beards: Record<string, VectorArt> = {
  stubble: ({ hair }) => (
    <G opacity={0.3}>
      <Path d={BEARD} fill={hair} />
      <Path d={MUSTACHE} fill={hair} />
    </G>
  ),
  short: ({ hair }) => (
    <G>
      <Path d={BEARD} fill={hair} stroke={shade(hair, -0.4)} strokeWidth={2.2} strokeLinejoin="round" />
      <Path d="M450 330 C460 356 480 376 500 384" stroke={shade(hair, 0.22)} strokeWidth={3} fill="none" strokeLinecap="round" opacity={0.55} />
      {hairStrokes(shade(hair, -0.35), 14, 3)}
      <Path d={MUSTACHE} fill={hair} stroke={shade(hair, -0.4)} strokeWidth={1.8} />
    </G>
  ),
};
