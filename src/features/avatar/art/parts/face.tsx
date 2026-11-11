import type { ReactElement } from 'react';
import { Circle, Ellipse, G, Path } from 'react-native-svg';
import { shade } from '../color';
import { CANVAS, EYE_DX, EYE_Y, MOUTH_Y } from '../geometry';
import type { ArtContext, VectorArt } from '../types';

const CX = CANVAS.cx;
const IRIS = '#2B1C13';
const LIP = '#6E2E2A';
const SIDES = [-1, 1] as const;
/** espelha o desenho do lado direito para o esquerdo */
const mirror = `translate(${CX * 2}, 0) scale(-1, 1)`;

const twoEyes = (draw: (x: number) => ReactElement) => <G>{SIDES.map((s) => <G key={s}>{draw(CX + s * EYE_DX)}</G>)}</G>;
const highlight = (x: number, dy = -6, r = 5) => <Circle cx={x + 5} cy={EYE_Y + dy} r={r} fill="#FFFFFF" />;

export const eyes: Record<string, VectorArt> = {
  round: () => twoEyes((x) => (<>
    <Ellipse cx={x} cy={EYE_Y} rx={15} ry={18} fill={IRIS} />
    {highlight(x)}
  </>)),
  almond: () => twoEyes((x) => (<>
    <Path d={`M${x - 19} ${EYE_Y} Q${x} ${EYE_Y - 20} ${x + 19} ${EYE_Y - 2} Q${x} ${EYE_Y + 16} ${x - 19} ${EYE_Y} Z`} fill={IRIS} />
    {highlight(x, -5, 4.5)}
  </>)),
  soft: ({ skin }: ArtContext) => twoEyes((x) => (<>
    <Path d={`M${x - 16} ${EYE_Y - 2} Q${x} ${EYE_Y + 22} ${x + 16} ${EYE_Y - 2} Z`} fill={IRIS} />
    <Path d={`M${x - 19} ${EYE_Y - 3} Q${x} ${EYE_Y - 10} ${x + 19} ${EYE_Y - 3}`} stroke={shade(skin, -0.5)} strokeWidth={5} fill="none" strokeLinecap="round" />
    <Circle cx={x + 4} cy={EYE_Y + 4} r={3.5} fill="#FFFFFF" />
  </>)),
  wide: () => twoEyes((x) => (<>
    <Ellipse cx={x} cy={EYE_Y} rx={20} ry={23} fill="#FFFDF7" stroke={IRIS} strokeWidth={4} />
    <Circle cx={x} cy={EYE_Y + 3} r={13} fill={IRIS} />
    {highlight(x, -3, 4.5)}
  </>)),
  narrow: () => twoEyes((x) => (<>
    <Ellipse cx={x} cy={EYE_Y + 2} rx={17} ry={9} fill={IRIS} />
    <Circle cx={x + 5} cy={EYE_Y} r={3} fill="#FFFFFF" />
  </>)),
  joy: () => twoEyes((x) => (
    <Path d={`M${x - 17} ${EYE_Y + 6} Q${x} ${EYE_Y - 16} ${x + 17} ${EYE_Y + 6}`} stroke={IRIS} strokeWidth={7} fill="none" strokeLinecap="round" />
  )),
};

const browColor = (ctx: ArtContext) => shade(ctx.hair, -0.25);
const browPair = (shape: (c: string) => ReactElement) => (ctx: ArtContext) => {
  const el = shape(browColor(ctx));
  return (<G><G>{el}</G><G transform={mirror}>{el}</G></G>);
};
const bx = CX + EYE_DX;

export const brows: Record<string, VectorArt> = {
  soft: browPair((c) => <Path d={`M${bx - 22} ${EYE_Y - 34} Q${bx} ${EYE_Y - 46} ${bx + 22} ${EYE_Y - 37}`} stroke={c} strokeWidth={7} fill="none" strokeLinecap="round" />),
  straight: browPair((c) => <Path d={`M${bx - 22} ${EYE_Y - 40} L${bx + 22} ${EYE_Y - 40}`} stroke={c} strokeWidth={8} fill="none" strokeLinecap="round" />),
  arched: browPair((c) => <Path d={`M${bx - 24} ${EYE_Y - 34} Q${bx - 2} ${EYE_Y - 60} ${bx + 24} ${EYE_Y - 38}`} stroke={c} strokeWidth={7} fill="none" strokeLinecap="round" />),
  thick: browPair((c) => <Path d={`M${bx - 24} ${EYE_Y - 36} Q${bx} ${EYE_Y - 52} ${bx + 24} ${EYE_Y - 40}`} stroke={c} strokeWidth={13} fill="none" strokeLinecap="round" />),
};

export const mouths: Record<string, VectorArt> = {
  smile: () => <Path d={`M${CX - 20} ${MOUTH_Y - 4} Q${CX} ${MOUTH_Y + 16} ${CX + 20} ${MOUTH_Y - 4}`} stroke={LIP} strokeWidth={6} fill="none" strokeLinecap="round" />,
  joy: () => (
    <G>
      <Path d={`M${CX - 24} ${MOUTH_Y - 8} Q${CX} ${MOUTH_Y + 32} ${CX + 24} ${MOUTH_Y - 8} Z`} fill={LIP} stroke={LIP} strokeWidth={4} strokeLinejoin="round" />
      <Ellipse cx={CX} cy={MOUTH_Y + 10} rx={11} ry={6} fill="#D9776E" />
    </G>
  ),
  calm: () => <Path d={`M${CX - 13} ${MOUTH_Y + 2} Q${CX} ${MOUTH_Y + 8} ${CX + 13} ${MOUTH_Y + 2}`} stroke={LIP} strokeWidth={5} fill="none" strokeLinecap="round" />,
  determined: () => <Path d={`M${CX - 18} ${MOUTH_Y + 4} L${CX + 14} ${MOUTH_Y + 2} Q${CX + 19} ${MOUTH_Y + 1} ${CX + 20} ${MOUTH_Y - 3}`} stroke={LIP} strokeWidth={6} fill="none" strokeLinecap="round" strokeLinejoin="round" />,
  wonder: () => <Ellipse cx={CX} cy={MOUTH_Y + 4} rx={9} ry={12} fill={LIP} />,
};

const MUSTACHE = `M${CX - 34} 398 Q${CX - 16} 382 ${CX} 393 Q${CX + 16} 382 ${CX + 34} 398 Q${CX + 16} 405 ${CX} 400 Q${CX - 16} 405 ${CX - 34} 398 Z`;
const beardShape = (d: string, withMustache = true, opacity = 1) => (ctx: ArtContext) => (
  <G opacity={opacity}>
    <Path d={d} fill={ctx.hair} stroke={shade(ctx.hair, -0.4)} strokeWidth={opacity < 1 ? 0 : 4} strokeLinejoin="round" />
    {withMustache ? <Path d={MUSTACHE} fill={ctx.hair} stroke={shade(ctx.hair, -0.4)} strokeWidth={3} /> : null}
  </G>
);

export const beards: Record<string, VectorArt> = {
  stubble: beardShape(`M244 352 Q246 470 ${CX} 462 Q474 470 476 352 Q466 420 420 432 Q${CX} 440 300 432 Q254 420 244 352 Z`, false, 0.32),
  mustache: (ctx) => <Path d={MUSTACHE} fill={ctx.hair} stroke={shade(ctx.hair, -0.4)} strokeWidth={3} />,
  goatee: beardShape(`M${CX - 26} 428 Q${CX} 486 ${CX + 26} 428 Q${CX} 438 ${CX - 26} 428 Z`),
  short: beardShape(`M258 372 Q266 474 ${CX} 484 Q454 474 462 372 Q446 424 400 426 Q${CX} 414 320 426 Q274 424 258 372 Z`),
  full: beardShape(`M244 340 Q240 480 ${CX} 502 Q480 480 476 340 Q464 410 418 418 Q${CX} 400 302 418 Q256 410 244 340 Z`),
  long: beardShape(`M244 340 Q236 470 300 520 Q330 560 ${CX} 590 Q390 560 420 520 Q484 470 476 340 Q464 410 418 418 Q${CX} 400 302 418 Q256 410 244 340 Z`),
};
