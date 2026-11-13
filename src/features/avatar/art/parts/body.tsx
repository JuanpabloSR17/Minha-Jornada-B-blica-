import { Defs, Ellipse, G, Path } from 'react-native-svg';
import { lineOf, mix, shade } from '../color';
import { CANVAS, FACE, GROUND_Y, HEAD_T, anchors, f, limbPath, type BodyGeometry, type Pt } from '../geometry';
import { SoftRadial, VolumeGradient, url } from '../paint';
import type { ArtContext, VectorArt } from '../types';

const CX = CANVAS.cx;
const SIDES = [-1, 1] as const;

export const HEAD_PATH = `M512 148 C568 148 602 190 602 252 C602 300 594 332 578 356 C558 380 536 390 512 391 C488 390 466 380 446 356 C430 332 422 300 422 252 C422 190 456 148 512 148 Z`;

/** Contorno do rosto por corpo (rostos distintos): queixo e mandíbula mais estreitos ou mais largos. */
const JAW: Record<string, { jaw: number; chin: number; cheek: number }> = {
  'body-a': { jaw: -8, chin: -4, cheek: -4 },
  'body-b': { jaw: 4, chin: 2, cheek: 0 },
  'body-c': { jaw: 12, chin: 8, cheek: 6 },
};
export function headPath(bodyId: string) {
  const j = JAW[bodyId] ?? { jaw: 0, chin: 0, cheek: 0 };
  const L = (x: number) => 512 - x;
  const R = (x: number) => 512 + x;
  return `M512 148 C568 148 602 190 ${R(90 + j.cheek)} 252 C${R(90 + j.cheek)} 300 ${R(82 + j.jaw)} 332 ${R(66 + j.jaw)} 356 C${R(46 + j.chin)} 380 ${R(24 + j.chin)} 390 512 391 C${L(24 + j.chin)} 390 ${L(46 + j.chin)} 380 ${L(66 + j.jaw)} 356 C${L(82 + j.jaw)} 332 ${L(90 + j.cheek)} 300 ${L(90 + j.cheek)} 252 C422 190 456 148 512 148 Z`;
}

function footPath(a: Pt, side: -1 | 1, ankle: number) {
  const s = side;
  const x = a.x;
  return `M${f(x - ankle)} 1380 C${f(x - ankle - 3)} 1408 ${f(x - 22 + s * 4)} 1436 ${f(x - 12 + s * 8)} ${GROUND_Y - 2} C${f(x + s * 10)} ${GROUND_Y + 4} ${f(x + 24 + s * 8)} ${GROUND_Y + 2} ${f(x + 26 + s * 10)} ${GROUND_Y - 10} C${f(x + 26 + s * 6)} 1420 ${f(x + ankle + 2)} 1404 ${f(x + ankle)} 1380 Z`;
}

type HandShapes = { palm: string; fingers: string[]; thumb: string; knuckles: string };

/** Mão relaxada vista de frente: dorso, quatro dedos levemente curvados e polegar à frente. */
function handShapes(w: Pt, g: BodyGeometry, side: -1 | 1): HandShapes {
  const hw = g.forearm * 0.8 + 4;
  const { x, y } = w;
  const palm = `M${f(x - hw)} ${f(y - 2)} C${f(x - hw - 2)} ${f(y + 18)} ${f(x - hw + 1)} ${f(y + 34)} ${f(x - hw * 0.7)} ${f(y + 42)} L${f(x + hw * 0.75)} ${f(y + 42)} C${f(x + hw)} ${f(y + 32)} ${f(x + hw + 2)} ${f(y + 16)} ${f(x + hw)} ${f(y - 2)} Z`;
  const fw = hw * 0.42;
  const fingers = [-0.66, -0.22, 0.22, 0.64].map((k, i) => {
    const fx = x + k * hw;
    const len = [22, 28, 27, 21][i]!;
    const curl = -side * 3;
    return `M${f(fx - fw / 2)} ${f(y + 36)} C${f(fx - fw / 2 + curl)} ${f(y + 36 + len * 0.6)} ${f(fx - fw / 2 + curl)} ${f(y + 36 + len)} ${f(fx + curl)} ${f(y + 38 + len)} C${f(fx + fw / 2 + curl)} ${f(y + 36 + len)} ${f(fx + fw / 2 + curl)} ${f(y + 36 + len * 0.6)} ${f(fx + fw / 2)} ${f(y + 36)} Z`;
  });
  const tx = x - side * hw * 0.85;
  const thumb = `M${f(tx)} ${f(y + 4)} C${f(tx - side * 14)} ${f(y + 14)} ${f(tx - side * 16)} ${f(y + 36)} ${f(tx - side * 6)} ${f(y + 46)} C${f(tx + side * 2)} ${f(y + 50)} ${f(tx + side * 8)} ${f(y + 42)} ${f(tx + side * 8)} ${f(y + 30)} Z`;
  const knuckles = `M${f(x - hw * 0.7)} ${f(y + 30)} Q${f(x)} ${f(y + 36)} ${f(x + hw * 0.7)} ${f(y + 30)}`;
  return { palm, fingers, thumb, knuckles };
}

export const shadow: VectorArt = (ctx) => {
  const id = `${ctx.uid}-shadow`;
  return (
    <G>
      <Defs>
        <SoftRadial id={id} color="#2A1A0E" opacity={0.42} />
      </Defs>
      <Ellipse cx={CX} cy={GROUND_Y + 2} rx={ctx.g.hip + 150} ry={34} fill={url(id)} />
    </G>
  );
};

export const bodyBase: VectorArt = (ctx) => {
  const { g, skin } = ctx;
  const line = lineOf(skin);
  const gid = `${ctx.uid}-skinV`;
  const hid = `${ctx.uid}-head`;
  const torso = `M${CX - g.neck - 6} 418 C${CX - g.neck - 10} 440 ${CX - g.shoulder + 30} 448 ${CX - g.shoulder + 4} 462 C${CX - g.shoulder - 14} 474 ${CX - g.chest - 6} 520 ${CX - g.chest} 580 C${CX - g.waist - 6} 640 ${CX - g.waist} 690 ${CX - g.waist - 4} 720 C${CX - g.hip - 4} 770 ${CX - g.hip} 800 ${CX - g.hip + 6} 820 L${CX + g.hip - 6} 820 C${CX + g.hip} 800 ${CX + g.hip + 4} 770 ${CX + g.waist + 4} 720 C${CX + g.waist} 690 ${CX + g.waist + 6} 640 ${CX + g.chest} 580 C${CX + g.chest + 6} 520 ${CX + g.shoulder + 14} 474 ${CX + g.shoulder - 4} 462 C${CX + g.shoulder - 30} 448 ${CX + g.neck + 10} 440 ${CX + g.neck + 6} 418 Z`;
  const neck = `M${CX - g.neck} 340 L${CX - g.neck - 2} 430 C${CX - g.neck + 8} 450 ${CX + g.neck - 8} 450 ${CX + g.neck + 2} 430 L${CX + g.neck} 340 Z`;
  return (
    <G>
      <Defs>
        <VolumeGradient id={gid} base={skin} edge={-0.2} light={0.06} />
        <VolumeGradient id={hid} base={skin} edge={-0.16} light={0.08} />
      </Defs>
      {SIDES.map((side) => {
        const a = anchors(g, side);
        return (
          <G key={side}>
            <Path d={limbPath(a.hip, a.knee, g.thigh, g.calf * 0.92, 0.05)} fill={url(gid)} stroke={line} strokeWidth={3} />
            <Path d={limbPath(a.knee, a.ankle, g.calf * 0.9, g.ankle, 0.3)} fill={url(gid)} stroke={line} strokeWidth={3} />
            <Path d={footPath(a.ankle, side, g.ankle)} fill={url(gid)} stroke={line} strokeWidth={3} strokeLinejoin="round" />
            <Path d={`M${f(a.knee.x - 10)} ${f(a.knee.y + 4)} q10 8 20 0`} stroke={shade(skin, -0.28)} strokeWidth={2} fill="none" opacity={0.6} />
          </G>
        );
      })}
      <Path d={torso} fill={url(gid)} stroke={line} strokeWidth={3} strokeLinejoin="round" />
      <Path d={neck} fill={url(gid)} stroke={line} strokeWidth={3} />
      <Path d={`M${CX - g.neck} 372 C${CX - 10} 404 ${CX + 10} 404 ${CX + g.neck} 372 L${CX + g.neck} 398 C${CX} 420 ${CX} 420 ${CX - g.neck} 398 Z`} fill={shade(skin, -0.28)} opacity={0.55} />
      {/* cabeça e orelhas no espaço da cabeça, reduzidas para a proporção adulta */}
      <G transform={HEAD_T}>
      {SIDES.map((side) => (
        <G key={`ear${side}`}>
          <Path d={`M${CX + side * 86} 262 C${CX + side * 104} 250 ${CX + side * 112} 276 ${CX + side * 104} 300 C${CX + side * 100} 318 ${CX + side * 90} 322 ${CX + side * 84} 316 Z`} fill={shade(skin, -0.06)} stroke={line} strokeWidth={3} strokeLinejoin="round" />
          <Path d={`M${CX + side * 92} 272 C${CX + side * 102} 274 ${CX + side * 102} 294 ${CX + side * 94} 304`} stroke={shade(skin, -0.32)} strokeWidth={2.4} fill="none" strokeLinecap="round" />
        </G>
      ))}
      <Path d={headPath(ctx.bodyId)} fill={url(hid)} stroke={line} strokeWidth={3.2} />
      </G>
    </G>
  );
};

export const faceBase: VectorArt = ({ skin, uid }) => {
  const blush = `${uid}-blush`;
  const tip = shade(skin, 0.12);
  return (
    <G>
      <Defs>
        <SoftRadial id={blush} color={mix(skin, '#C0504A', 0.55)} opacity={0.38} />
      </Defs>
      <Ellipse cx={466} cy={322} rx={24} ry={15} fill={url(blush)} />
      <Ellipse cx={558} cy={322} rx={24} ry={15} fill={url(blush)} />
      {/* sombra lateral do nariz e base */}
      <Path d={`M506 ${FACE.eyeY + 6} C503 296 499 308 497 316`} stroke={shade(skin, -0.3)} strokeWidth={2.2} fill="none" strokeLinecap="round" opacity={0.6} />
      <Path d="M497 316 C496 323 502 327 507 324 C509 327 515 327 517 324 C522 327 528 323 527 316" stroke={shade(skin, -0.48)} strokeWidth={2.2} fill="none" strokeLinecap="round" strokeLinejoin="round" />
      <Ellipse cx={512} cy={312} rx={6} ry={4} fill={tip} opacity={0.5} />
      {/* sombra sob o lábio e queixo */}
      <Path d="M496 372 C506 378 518 378 528 372" stroke={shade(skin, -0.22)} strokeWidth={3} fill="none" strokeLinecap="round" opacity={0.45} />
    </G>
  );
};

/** Braços (sem as mãos): ficam acima da túnica e abaixo das mangas. */
export const arms: VectorArt = (ctx) => {
  const { g, skin } = ctx;
  const line = lineOf(skin);
  const gid = `${ctx.uid}-armG`;
  return (
    <G>
      <Defs>
        <VolumeGradient id={gid} base={skin} edge={-0.22} light={0.06} />
      </Defs>
      {SIDES.map((side) => {
        const a = anchors(g, side, ctx.armPose);
        return (
          <G key={side}>
            <Path d={limbPath(a.shoulder, a.elbow, g.upperArm, g.forearm + 2, 0.14)} fill={url(gid)} stroke={line} strokeWidth={3} />
            <Path d={limbPath(a.elbow, a.wrist, g.forearm + 1, g.forearm * 0.72, 0.18)} fill={url(gid)} stroke={line} strokeWidth={3} />
          </G>
        );
      })}
    </G>
  );
};

/** Mãos: camada própria acima do manto dianteiro (as mãos "saem" do manto). */
export const hands: VectorArt = (ctx) => {
  const { g, skin } = ctx;
  const line = lineOf(skin);
  const fill = shade(skin, -0.02);
  return (
    <G>
      {SIDES.map((side) => {
        // com o cajado, a mão direita fechada é desenhada pela própria peça (camada hand_item)
        if (side === 1 && ctx.armPose === 'staff') return null;
        const a = anchors(g, side);
        const h = handShapes({ x: a.wrist.x, y: a.wrist.y - 8 }, g, side);
        const parts = [...h.fingers, h.thumb, h.palm];
        return (
          <G key={side}>
            {parts.map((d, i) => <Path key={`o${i}`} d={d} fill={line} stroke={line} strokeWidth={5.5} strokeLinejoin="round" />)}
            {parts.map((d, i) => <Path key={`f${i}`} d={d} fill={i === parts.length - 1 ? fill : shade(skin, -0.06)} />)}
            <Path d={h.knuckles} stroke={shade(skin, -0.3)} strokeWidth={1.6} fill="none" opacity={0.6} />
          </G>
        );
      })}
    </G>
  );
};
