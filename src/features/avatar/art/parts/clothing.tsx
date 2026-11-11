import { Circle, Ellipse, G, Line, Path, Rect } from 'react-native-svg';
import { shade } from '../color';
import { CANVAS, footCenter, handPoint, hemHalfWidth, shoulderJoint, tunicHalfWidthAt, TUNIC_HEM_Y } from '../geometry';
import { p, type ArtContext, type VectorArt } from '../types';

const CX = CANVAS.cx;
const ink = (c: string) => shade(c, -0.45);
const SIDES = [-1, 1] as const;

// ---------------------------------------------------------------- túnicas
function tunicBody(ctx: ArtContext, base: string, trim: string, pattern: string) {
  const { g } = ctx;
  const s = g.shoulder;
  const n = g.neck;
  const hw = hemHalfWidth(g);
  const neckDip = pattern === 'vneck' ? 572 : 532;
  const d = `M${CX - n - 12} 494 Q${CX - s - 4} 498 ${CX - s - 10} 545 L${CX - hw} ${TUNIC_HEM_Y - 8} Q${CX} ${TUNIC_HEM_Y + 22} ${CX + hw} ${TUNIC_HEM_Y - 8} L${CX + s + 10} 545 Q${CX + s + 4} 498 ${CX + n + 12} 494 ${pattern === 'vneck' ? `L${CX} ${neckDip} Z` : `Q${CX} ${neckDip} ${CX - n - 12} 494 Z`}`;
  const neckTrim = pattern === 'vneck'
    ? `M${CX - n - 12} 494 L${CX} ${neckDip} L${CX + n + 12} 494`
    : `M${CX - n - 12} 494 Q${CX} ${neckDip} ${CX + n + 12} 494`;
  const hemY = TUNIC_HEM_Y - 30;
  const hemW = tunicHalfWidthAt(g, hemY);
  const hemBand = `M${CX - hemW + 2} ${hemY} Q${CX} ${hemY + 30} ${CX + hemW - 2} ${hemY}`;
  return (
    <G>
      <Path d={d} fill={base} stroke={ink(base)} strokeWidth={5} strokeLinejoin="round" />
      {/* dobras do tecido */}
      {SIDES.map((sd) => (
        <Path key={sd} d={`M${CX + sd * 34} 690 Q${CX + sd * 44} 780 ${CX + sd * 54} ${TUNIC_HEM_Y}`} stroke={shade(base, -0.16)} strokeWidth={5} fill="none" strokeLinecap="round" opacity={0.7} />
      ))}
      {pattern === 'clavi'
        ? SIDES.map((sd) => (
            <Line key={`c${sd}`} x1={CX + sd * (n + 22)} y1={504} x2={CX + sd * (n + 34)} y2={TUNIC_HEM_Y + 4} stroke={trim} strokeWidth={13} />
          ))
        : null}
      {pattern === 'hem' || pattern === 'embroidered' || pattern === 'collar' ? (
        <Path d={hemBand} stroke={trim} strokeWidth={14} fill="none" />
      ) : null}
      {pattern === 'embroidered'
        ? [-2, -1, 0, 1, 2].map((i) => <Circle key={`e${i}`} cx={CX + i * hemW * 0.36} cy={hemY + 12 - Math.abs(i) * 3} r={4} fill={shade(base, -0.3)} />)
        : null}
      <Path d={neckTrim} stroke={trim} strokeWidth={pattern === 'collar' || pattern === 'embroidered' ? 14 : 8} fill="none" strokeLinejoin="round" strokeLinecap="round" />
    </G>
  );
}

function tunicSleeves(ctx: ArtContext, base: string, trim: string) {
  const { g } = ctx;
  return (
    <G>
      {SIDES.map((sd) => {
        const s = shoulderJoint(g, sd);
        const h = handPoint(g, sd);
        const e = { x: s.x + (h.x - s.x) * 0.52, y: s.y + (h.y - s.y) * 0.52 };
        const c = { x: s.x + (h.x - s.x) * 0.46, y: s.y + (h.y - s.y) * 0.46 };
        return (
          <G key={sd}>
            <Line x1={s.x} y1={s.y} x2={e.x} y2={e.y} stroke={ink(base)} strokeWidth={g.arm * 2 + 22} strokeLinecap="round" />
            <Line x1={s.x} y1={s.y} x2={e.x} y2={e.y} stroke={base} strokeWidth={g.arm * 2 + 12} strokeLinecap="round" />
            <Line x1={c.x} y1={c.y} x2={e.x} y2={e.y} stroke={trim} strokeWidth={g.arm * 2 + 12} strokeLinecap="butt" opacity={0.9} />
          </G>
        );
      })}
    </G>
  );
}

export const tunic: Record<string, VectorArt> = {
  body: (ctx) => tunicBody(ctx, p(ctx, 'base', '#E9DDC3'), p(ctx, 'trim', '#B48C55'), p(ctx, 'pattern', 'plain')),
  sleeves: (ctx) => tunicSleeves(ctx, p(ctx, 'base', '#E9DDC3'), p(ctx, 'trim', '#B48C55')),
};

export const fallback: Record<string, VectorArt> = {
  tunic: (ctx) => tunicBody(ctx, '#A9A39A', '#8C867D', 'plain'),
  sleeves: (ctx) => tunicSleeves(ctx, '#A9A39A', '#8C867D'),
};

// ---------------------------------------------------------------- mantos
export const cloak: Record<string, VectorArt> = {
  back: (ctx) => {
    const { g } = ctx;
    const base = p(ctx, 'base', '#8C6B4A');
    const trim = p(ctx, 'trim', '#5E4630');
    const s = g.shoulder;
    const d = `M${CX - s - 26} 512 Q${CX - s - 74} 700 ${CX - s - 96} 946 Q${CX} 990 ${CX + s + 96} 946 Q${CX + s + 74} 700 ${CX + s + 26} 512 Q${CX} 486 ${CX - s - 26} 512 Z`;
    return (
      <G>
        <Path d={d} fill={shade(base, -0.12)} stroke={ink(base)} strokeWidth={5} strokeLinejoin="round" />
        {p(ctx, 'pattern', 'plain') === 'stripes'
          ? [-0.55, -0.2, 0.2, 0.55].map((f) => (
              <Line key={f} x1={CX + f * (s + 40)} y1={520} x2={CX + f * (s + 100)} y2={960} stroke={trim} strokeWidth={14} opacity={0.85} />
            ))
          : null}
        <Path d={`M${CX - s - 92} 930 Q${CX} 972 ${CX + s + 92} 930`} stroke={trim} strokeWidth={12} fill="none" strokeLinecap="round" />
      </G>
    );
  },
  front: (ctx) => {
    const { g } = ctx;
    const base = p(ctx, 'base', '#8C6B4A');
    const trim = p(ctx, 'trim', '#5E4630');
    const s = g.shoulder;
    const n = g.neck;
    const d = `M${CX - s - 36} 604 Q${CX - s - 38} 512 ${CX - n - 8} 494 Q${CX} 524 ${CX + n + 8} 494 Q${CX + s + 38} 512 ${CX + s + 36} 604 Q${CX + s + 10} 590 ${CX + s - 12} 610 Q${CX} 644 ${CX - s + 12} 610 Q${CX - s - 10} 590 ${CX - s - 36} 604 Z`;
    return (
      <G>
        <Path d={d} fill={base} stroke={ink(base)} strokeWidth={5} strokeLinejoin="round" />
        <Path d={`M${CX - s + 12} 610 Q${CX} 644 ${CX + s - 12} 610`} stroke={trim} strokeWidth={8} fill="none" strokeLinecap="round" />
        <Circle cx={CX} cy={548} r={14} fill="#D8B25A" stroke={ink('#D8B25A')} strokeWidth={4} />
      </G>
    );
  },
};

// ---------------------------------------------------------------- calçados
const sole = (ctx: ArtContext, base: string) =>
  SIDES.map((sd) => {
    const f = footCenter(ctx.g, sd);
    return <Ellipse key={`s${sd}`} cx={f.x + sd * 6} cy={f.y + 12} rx={ctx.g.leg + 20} ry={10} fill={base} stroke={ink(base)} strokeWidth={4} />;
  });

const straps = (ctx: ArtContext, base: string) =>
  SIDES.map((sd) => {
    const f = footCenter(ctx.g, sd);
    const w = ctx.g.leg + 8;
    return (
      <G key={`t${sd}`}>
        <Line x1={f.x - w} y1={f.y - 2} x2={f.x + w} y2={f.y - 8} stroke={base} strokeWidth={9} strokeLinecap="round" />
        <Line x1={f.x + sd * 4} y1={f.y - 8} x2={f.x + sd * 18} y2={f.y + 8} stroke={base} strokeWidth={8} strokeLinecap="round" />
      </G>
    );
  });

export const feet: Record<string, VectorArt> = {
  sandals: (ctx) => {
    const base = p(ctx, 'base', '#7A4E2C');
    return <G>{sole(ctx, shade(base, -0.15))}{straps(ctx, base)}</G>;
  },
  woven: (ctx) => {
    const base = p(ctx, 'base', '#C8A15E');
    const accent = p(ctx, 'accent', '#9A773C');
    return (
      <G>
        {sole(ctx, accent)}
        {SIDES.map((sd) => {
          const f = footCenter(ctx.g, sd);
          const w = ctx.g.leg + 8;
          return (
            <G key={sd}>
              <Line x1={f.x - w} y1={f.y - 10} x2={f.x + w} y2={f.y + 2} stroke={base} strokeWidth={8} strokeLinecap="round" />
              <Line x1={f.x - w} y1={f.y + 2} x2={f.x + w} y2={f.y - 10} stroke={base} strokeWidth={8} strokeLinecap="round" />
            </G>
          );
        })}
      </G>
    );
  },
  laced: (ctx) => {
    const base = p(ctx, 'base', '#6B4428');
    return (
      <G>
        {sole(ctx, shade(base, -0.1))}
        {straps(ctx, base)}
        {SIDES.map((sd) => {
          const x = CX + sd * ctx.g.hip * 0.45;
          const w = ctx.g.leg;
          return (
            <G key={`l${sd}`}>
              {[0, 1, 2].map((i) => (
                <G key={i}>
                  <Line x1={x - w} y1={940 - i * 26} x2={x + w} y2={922 - i * 26} stroke={base} strokeWidth={7} strokeLinecap="round" />
                  <Line x1={x + w} y1={940 - i * 26} x2={x - w} y2={922 - i * 26} stroke={base} strokeWidth={7} strokeLinecap="round" />
                </G>
              ))}
            </G>
          );
        })}
      </G>
    );
  },
  boots: (ctx) => {
    const base = p(ctx, 'base', '#5C3E28');
    const accent = p(ctx, 'accent', '#3F2A1B');
    return (
      <G>
        {SIDES.map((sd) => {
          const x = CX + sd * ctx.g.hip * 0.45;
          const f = footCenter(ctx.g, sd);
          const w = ctx.g.leg + 6;
          return (
            <G key={sd}>
              <Rect x={x - w} y={884} width={w * 2} height={80} rx={12} fill={base} stroke={ink(base)} strokeWidth={4} />
              <Ellipse cx={f.x + sd * 10} cy={f.y + 2} rx={ctx.g.leg + 20} ry={20} fill={base} stroke={ink(base)} strokeWidth={4} />
              <Rect x={x - w - 2} y={880} width={w * 2 + 4} height={16} rx={6} fill={accent} />
            </G>
          );
        })}
      </G>
    );
  },
  cloth: (ctx) => {
    const base = p(ctx, 'base', '#8E8778');
    const accent = p(ctx, 'accent', '#6F695C');
    return (
      <G>
        {SIDES.map((sd) => {
          const f = footCenter(ctx.g, sd);
          return (
            <G key={sd}>
              <Ellipse cx={f.x + sd * 6} cy={f.y + 2} rx={ctx.g.leg + 16} ry={19} fill={base} stroke={ink(base)} strokeWidth={4} />
              <Path d={`M${f.x - 14} ${f.y - 10} Q${f.x} ${f.y - 2} ${f.x + 14} ${f.y - 10}`} stroke={accent} strokeWidth={4} fill="none" />
            </G>
          );
        })}
      </G>
    );
  },
};

// ---------------------------------------------------------------- cintos
const BELT_Y = 665;
const band = (ctx: ArtContext, base: string, h = 24) => {
  const w = tunicHalfWidthAt(ctx.g, BELT_Y) + 3;
  return { w, el: <Rect x={CX - w} y={BELT_Y - h / 2} width={w * 2} height={h} rx={8} fill={base} stroke={ink(base)} strokeWidth={4} /> };
};

export const belt: Record<string, VectorArt> = {
  rope: (ctx) => {
    const base = p(ctx, 'base', '#C2A26A');
    const accent = p(ctx, 'accent', '#8F7244');
    const { w, el } = band(ctx, base, 20);
    const kx = CX + w * 0.4;
    return (
      <G>
        {el}
        {Array.from({ length: Math.floor((w * 2) / 16) }, (_, i) => (
          <Line key={i} x1={CX - w + 8 + i * 16} y1={BELT_Y - 8} x2={CX - w + 16 + i * 16} y2={BELT_Y + 8} stroke={accent} strokeWidth={3} />
        ))}
        <Line x1={kx - 6} y1={BELT_Y} x2={kx - 14} y2={BELT_Y + 76} stroke={base} strokeWidth={9} strokeLinecap="round" />
        <Line x1={kx + 6} y1={BELT_Y} x2={kx + 12} y2={BELT_Y + 64} stroke={base} strokeWidth={9} strokeLinecap="round" />
        <Circle cx={kx} cy={BELT_Y} r={13} fill={base} stroke={ink(base)} strokeWidth={4} />
      </G>
    );
  },
  leather: (ctx) => {
    const base = p(ctx, 'base', '#6E4527');
    const accent = p(ctx, 'accent', '#C99A45');
    const { el } = band(ctx, base);
    return (
      <G>
        {el}
        <Rect x={CX - 18} y={BELT_Y - 17} width={36} height={34} rx={6} fill="none" stroke={accent} strokeWidth={7} />
        <Line x1={CX} y1={BELT_Y - 10} x2={CX} y2={BELT_Y + 10} stroke={accent} strokeWidth={5} />
      </G>
    );
  },
  sash: (ctx) => {
    const base = p(ctx, 'base', '#3F6A9A');
    const accent = p(ctx, 'accent', '#2C4C70');
    const { w, el } = band(ctx, base, 32);
    const x = CX - w * 0.45;
    return (
      <G>
        {el}
        <Path d={`M${x - 10} ${BELT_Y + 6} L${x - 30} ${BELT_Y + 108} L${x - 6} ${BELT_Y + 100} Z`} fill={accent} stroke={ink(base)} strokeWidth={4} strokeLinejoin="round" />
        <Path d={`M${x + 4} ${BELT_Y + 6} L${x + 2} ${BELT_Y + 120} L${x + 26} ${BELT_Y + 110} Z`} fill={base} stroke={ink(base)} strokeWidth={4} strokeLinejoin="round" />
        <Ellipse cx={x} cy={BELT_Y} rx={16} ry={14} fill={accent} stroke={ink(base)} strokeWidth={4} />
      </G>
    );
  },
  woven: (ctx) => {
    const base = p(ctx, 'base', '#7C5A3A');
    const accent = p(ctx, 'accent', '#E3C47E');
    const { w, el } = band(ctx, base, 26);
    const n = Math.floor((w * 2 - 16) / 24);
    return (
      <G>
        {el}
        {Array.from({ length: n }, (_, i) => {
          const x = CX - w + 20 + i * 24;
          return <Path key={i} d={`M${x} ${BELT_Y - 8} L${x + 8} ${BELT_Y} L${x} ${BELT_Y + 8} L${x - 8} ${BELT_Y} Z`} fill={accent} />;
        })}
      </G>
    );
  },
  pouch: (ctx) => {
    const base = p(ctx, 'base', '#6A4630');
    const accent = p(ctx, 'accent', '#9A6D46');
    const { w, el } = band(ctx, base);
    const x = CX + w * 0.5;
    return (
      <G>
        {el}
        <Rect x={x - 24} y={BELT_Y + 2} width={48} height={52} rx={14} fill={accent} stroke={ink(accent)} strokeWidth={4} />
        <Path d={`M${x - 24} ${BELT_Y + 16} Q${x} ${BELT_Y + 36} ${x + 24} ${BELT_Y + 16}`} stroke={ink(accent)} strokeWidth={4} fill="none" />
        <Circle cx={x} cy={BELT_Y + 28} r={4} fill="#D8B25A" />
      </G>
    );
  },
};
