import { Circle, Ellipse, G, Line, Path, Rect } from 'react-native-svg';
import { shade } from '../color';
import { CANVAS, HEAD, footCenter, handPoint, shoulderJoint } from '../geometry';
import type { ArtContext, VectorArt } from '../types';

const CX = CANVAS.cx;
export const ink = (c: string) => shade(c, -0.45);

export const shadow: VectorArt = () => (
  <Ellipse cx={CX} cy={984} rx={178} ry={24} fill="#2A1E12" opacity={0.18} />
);

const legX = (ctx: ArtContext, side: -1 | 1) => CX + side * ctx.g.hip * 0.45;

export const bodyBase: VectorArt = (ctx) => {
  const { g, skin } = ctx;
  const line = ink(skin);
  const torso = `M${CX - g.neck - 4} 500 Q${CX - g.shoulder} 504 ${CX - g.shoulder} 548 L${CX - g.waist} 660 Q${CX - g.hip - 4} 700 ${CX - g.hip} 760 L${CX + g.hip} 760 Q${CX + g.hip + 4} 700 ${CX + g.waist} 660 L${CX + g.shoulder} 548 Q${CX + g.shoulder} 504 ${CX + g.neck + 4} 500 Z`;
  return (
    <G>
      {([-1, 1] as const).map((side) => {
        const x = legX(ctx, side);
        const f = footCenter(g, side);
        return (
          <G key={side}>
            <Line x1={x} y1={740} x2={x} y2={950} stroke={line} strokeWidth={g.leg * 2 + 8} strokeLinecap="round" />
            <Line x1={x} y1={740} x2={x} y2={950} stroke={skin} strokeWidth={g.leg * 2} strokeLinecap="round" />
            <Ellipse cx={f.x + side * 6} cy={f.y} rx={g.leg + 12} ry={16} fill={skin} stroke={line} strokeWidth={4} />
          </G>
        );
      })}
      <Path d={torso} fill={skin} stroke={line} strokeWidth={4} strokeLinejoin="round" />
      <Rect x={CX - g.neck} y={420} width={g.neck * 2} height={100} rx={g.neck * 0.6} fill={skin} stroke={line} strokeWidth={4} />
      <Ellipse cx={CX} cy={466} rx={g.neck} ry={14} fill={shade(skin, -0.18)} opacity={0.7} />
      {([-1, 1] as const).map((side) => (
        <G key={`ear${side}`}>
          <Circle cx={CX + side * 114} cy={348} r={25} fill={skin} stroke={line} strokeWidth={4} />
          <Path d={`M${CX + side * 108} 336 Q${CX + side * 124} 348 ${CX + side * 110} 362`} stroke={shade(skin, -0.2)} strokeWidth={4} fill="none" strokeLinecap="round" />
        </G>
      ))}
      <Ellipse cx={HEAD.cx} cy={HEAD.cy} rx={HEAD.rx} ry={HEAD.ry} fill={skin} stroke={line} strokeWidth={5} />
    </G>
  );
};

export const faceBase: VectorArt = ({ skin }) => (
  <G>
    <Circle cx={CX - 76} cy={396} r={20} fill="#E0705A" opacity={0.22} />
    <Circle cx={CX + 76} cy={396} r={20} fill="#E0705A" opacity={0.22} />
    <Path d={`M${CX - 8} 372 Q${CX} 384 ${CX + 8} 372`} stroke={shade(skin, -0.35)} strokeWidth={5} fill="none" strokeLinecap="round" />
  </G>
);

export const arms: VectorArt = ({ g, skin }) => {
  const line = ink(skin);
  return (
    <G>
      {([-1, 1] as const).map((side) => {
        const s = shoulderJoint(g, side);
        const h = handPoint(g, side);
        return (
          <G key={side}>
            <Line x1={s.x} y1={s.y} x2={h.x} y2={h.y} stroke={line} strokeWidth={g.arm * 2 + 8} strokeLinecap="round" />
            <Line x1={s.x} y1={s.y} x2={h.x} y2={h.y} stroke={skin} strokeWidth={g.arm * 2} strokeLinecap="round" />
            <Circle cx={h.x} cy={h.y} r={g.arm * 1.05} fill={skin} stroke={line} strokeWidth={4} />
          </G>
        );
      })}
    </G>
  );
};
