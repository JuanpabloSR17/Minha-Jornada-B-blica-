import { Circle, Defs, Ellipse, G, Line, LinearGradient, Path, RadialGradient, Rect, Stop } from 'react-native-svg';
import { shade } from '../color';
import { CANVAS, handPoint } from '../geometry';
import { p, type ArtContext, type VectorArt } from '../types';

const CX = CANVAS.cx;
const ink = (c: string) => shade(c, -0.45);

const regrip = (ctx: ArtContext) => {
  const h = handPoint(ctx.g, 1);
  return <Circle cx={h.x} cy={h.y} r={ctx.g.arm * 1.05} fill={ctx.skin} stroke={ink(ctx.skin)} strokeWidth={4} />;
};

export const head: Record<string, VectorArt> = {
  band: (ctx) => {
    const base = p(ctx, 'base', '#EFE3C8');
    const accent = p(ctx, 'accent', '#B48C55');
    return (
      <G>
        <Path d="M236 290 Q360 236 484 290" stroke={ink(base)} strokeWidth={30} fill="none" strokeLinecap="round" />
        <Path d="M236 290 Q360 236 484 290" stroke={base} strokeWidth={22} fill="none" strokeLinecap="round" />
        <Path d="M240 288 Q360 238 480 288" stroke={accent} strokeWidth={4} fill="none" strokeDasharray="10 10" />
        <Path d="M482 296 L506 352 L490 356 Z" fill={base} stroke={ink(base)} strokeWidth={4} strokeLinejoin="round" />
        <Path d="M482 296 L520 336 L506 344 Z" fill={base} stroke={ink(base)} strokeWidth={4} strokeLinejoin="round" />
        <Circle cx={482} cy={294} r={12} fill={base} stroke={ink(base)} strokeWidth={4} />
      </G>
    );
  },
  wrap: (ctx) => {
    const base = p(ctx, 'base', '#D9C39A');
    const accent = p(ctx, 'accent', '#B39A6C');
    return (
      <G>
        <Path d="M226 322 C210 190 298 124 360 124 C422 124 510 190 494 322 C470 290 420 268 360 268 C300 268 250 290 226 322 Z" fill={base} stroke={ink(base)} strokeWidth={5} strokeLinejoin="round" />
        <Path d="M240 270 Q340 190 478 236" stroke={accent} strokeWidth={6} fill="none" strokeLinecap="round" />
        <Path d="M232 228 Q350 150 462 178" stroke={accent} strokeWidth={6} fill="none" strokeLinecap="round" />
        <Path d="M296 152 Q380 200 470 284" stroke={accent} strokeWidth={5} fill="none" strokeLinecap="round" opacity={0.8} />
      </G>
    );
  },
  scarf: (ctx) => {
    const base = p(ctx, 'base', '#C99B3C');
    const accent = p(ctx, 'accent', '#A47A28');
    // contorno externo + abertura do rosto (evenodd)
    const d = 'M196 590 C182 300 226 150 360 150 C494 150 538 300 524 590 Q360 620 196 590 Z M360 222 C292 222 252 262 252 340 C252 420 300 470 360 470 C420 470 468 420 468 340 C468 262 428 222 360 222 Z';
    return (
      <G>
        <Path d={d} fill={base} fillRule="evenodd" stroke={ink(base)} strokeWidth={5} strokeLinejoin="round" />
        <Path d="M252 340 C252 262 292 222 360 222 C428 222 468 262 468 340" stroke={accent} strokeWidth={8} fill="none" />
        <Path d="M222 470 Q236 540 228 590" stroke={accent} strokeWidth={5} fill="none" opacity={0.8} />
        <Path d="M498 470 Q484 540 492 590" stroke={accent} strokeWidth={5} fill="none" opacity={0.8} />
      </G>
    );
  },
};

export const neck: Record<string, VectorArt> = {
  cord: (ctx) => {
    const base = p(ctx, 'base', '#6B4A2E');
    const accent = p(ctx, 'accent', '#7D8B4A');
    return (
      <G>
        <Path d={`M${CX - 48} 500 Q${CX} 590 ${CX + 48} 500`} stroke={base} strokeWidth={5} fill="none" />
        <Path d={`M${CX} 560 Q${CX + 18} 586 ${CX} 612 Q${CX - 18} 586 ${CX} 560 Z`} fill={accent} stroke={ink(accent)} strokeWidth={4} />
        <Line x1={CX} y1={566} x2={CX} y2={606} stroke={ink(accent)} strokeWidth={2} />
      </G>
    );
  },
  beads: (ctx) => {
    const base = p(ctx, 'base', '#B4603C');
    const accent = p(ctx, 'accent', '#E2C27A');
    const pts = Array.from({ length: 11 }, (_, i) => {
      const t = i / 10;
      const x = CX - 56 + 112 * t;
      const y = 500 + 4 * 76 * t * (1 - t);
      return { x, y };
    });
    return (
      <G>
        {pts.map((pt, i) => (
          <Circle key={i} cx={pt.x} cy={pt.y} r={i === 5 ? 12 : 8} fill={i % 2 ? accent : base} stroke={ink(base)} strokeWidth={3} />
        ))}
      </G>
    );
  },
  scarf: (ctx) => {
    const base = p(ctx, 'base', '#5E7FA3');
    const accent = p(ctx, 'accent', '#43607F');
    const n = ctx.g.neck;
    return (
      <G>
        <Path d={`M${CX - n - 22} 486 Q${CX} 528 ${CX + n + 22} 486 L${CX + n + 30} 522 Q${CX} 572 ${CX - n - 30} 522 Z`} fill={base} stroke={ink(base)} strokeWidth={5} strokeLinejoin="round" />
        <Path d={`M${CX + 18} 540 L${CX + 40} 650 L${CX + 6} 646 L${CX - 2} 548 Z`} fill={accent} stroke={ink(base)} strokeWidth={4} strokeLinejoin="round" />
        <Path d={`M${CX - n - 14} 506 Q${CX} 540 ${CX + n + 14} 506`} stroke={accent} strokeWidth={4} fill="none" opacity={0.8} />
      </G>
    );
  },
};

export const hand: Record<string, VectorArt> = {
  staff: (ctx) => {
    const base = p(ctx, 'base', '#8A6038');
    const h = handPoint(ctx.g, 1);
    const x = h.x + 2;
    return (
      <G>
        <Path d={`M${x} 1000 L${x} 420 C${x} 340 ${x + 84} 340 ${x + 78} 412`} stroke={ink(base)} strokeWidth={24} fill="none" strokeLinecap="round" />
        <Path d={`M${x} 1000 L${x} 420 C${x} 340 ${x + 84} 340 ${x + 78} 412`} stroke={base} strokeWidth={15} fill="none" strokeLinecap="round" />
        {regrip(ctx)}
      </G>
    );
  },
  scroll: (ctx) => {
    const base = p(ctx, 'base', '#EFE2C0');
    const h = handPoint(ctx.g, 1);
    return (
      <G>
        <G transform={`translate(${h.x} ${h.y}) scale(1.35) translate(${-h.x} ${-h.y})`}>
        <Rect x={h.x - 58} y={h.y - 20} width={116} height={40} rx={12} fill={base} stroke={ink(base)} strokeWidth={4} />
        <Rect x={h.x - 68} y={h.y - 26} width={16} height={52} rx={6} fill="#8A6038" stroke={ink('#8A6038')} strokeWidth={3} />
        <Rect x={h.x + 52} y={h.y - 26} width={16} height={52} rx={6} fill="#8A6038" stroke={ink('#8A6038')} strokeWidth={3} />
        <Line x1={h.x - 40} y1={h.y - 6} x2={h.x + 40} y2={h.y - 6} stroke={shade(base, -0.3)} strokeWidth={3} />
        </G>
        {regrip(ctx)}
      </G>
    );
  },
  lamp: (ctx) => {
    const base = p(ctx, 'base', '#B66B3F');
    const h = handPoint(ctx.g, 1);
    const fx = h.x + 58;
    const fy = h.y - 58;
    const gid = `${ctx.uid}-lampglow`;
    return (
      <G transform={`translate(${h.x} ${h.y}) scale(1.4) translate(${-h.x} ${-h.y})`}>
        <Defs>
          <RadialGradient id={gid} cx="50%" cy="50%" r="50%">
            <Stop offset="0" stopColor="#FFE9A8" stopOpacity={0.75} />
            <Stop offset="1" stopColor="#FFE9A8" stopOpacity={0} />
          </RadialGradient>
        </Defs>
        <Circle cx={fx} cy={fy} r={60} fill={`url(#${gid})`} />
        <Path d={`M${h.x - 42} ${h.y - 26} Q${h.x} ${h.y + 4} ${h.x + 40} ${h.y - 26} L${h.x + 64} ${h.y - 40} L${h.x + 40} ${h.y - 18} Q${h.x} ${h.y + 12} ${h.x - 42} ${h.y - 26} Z`} fill={base} stroke={ink(base)} strokeWidth={4} strokeLinejoin="round" />
        <Ellipse cx={h.x} cy={h.y - 27} rx={42} ry={10} fill={shade(base, 0.15)} stroke={ink(base)} strokeWidth={4} />
        <Path d={`M${fx} ${fy - 30} Q${fx + 14} ${fy} ${fx} ${fy + 12} Q${fx - 14} ${fy} ${fx} ${fy - 30} Z`} fill="#F2A93B" />
        <Path d={`M${fx} ${fy - 12} Q${fx + 6} ${fy + 2} ${fx} ${fy + 8} Q${fx - 6} ${fy + 2} ${fx} ${fy - 12} Z`} fill="#FCE38A" />
      </G>
    );
  },
};

export const background: Record<string, VectorArt> = {
  parchment: (ctx) => {
    const sky = `${ctx.uid}-bgsky`;
    const sun = `${ctx.uid}-bgsun`;
    return (
      <G>
        <Defs>
          <LinearGradient id={sky} x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0" stopColor="#F7EDD4" />
            <Stop offset="1" stopColor="#E6CFA0" />
          </LinearGradient>
          <RadialGradient id={sun} cx="50%" cy="50%" r="50%">
            <Stop offset="0" stopColor="#FFF8E4" stopOpacity={0.95} />
            <Stop offset="1" stopColor="#FFF8E4" stopOpacity={0} />
          </RadialGradient>
        </Defs>
        <Rect x={-2000} y={0} width={4720} height={1080} fill={`url(#${sky})`} />
        <Circle cx={360} cy={360} r={300} fill={`url(#${sun})`} />
        <Path d="M-2000 800 L-240 800 C-120 830 -60 840 0 820 C120 760 240 792 360 772 C480 752 600 792 720 762 C800 744 880 790 960 800 L2720 800 L2720 1080 L-2000 1080 Z" fill="#D9C18E" />
        <Path d="M-2000 890 L-300 890 C-160 870 -80 910 0 900 C150 862 262 902 382 882 C520 858 620 902 720 882 C820 866 900 900 1020 890 L2720 890 L2720 1080 L-2000 1080 Z" fill="#C8AD75" />
        <Path d="M60 150 Q90 140 120 150 M560 210 Q585 200 610 210" stroke="#C8AD75" strokeWidth={5} fill="none" strokeLinecap="round" />
      </G>
    );
  },
};
