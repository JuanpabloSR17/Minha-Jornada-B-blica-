import type { ReactElement } from 'react';
import { ClipPath, Defs, G, LinearGradient, Path, Rect, Stop } from 'react-native-svg';
import { lineOf, mix, shade } from '../color';
import {
  CANVAS,
  GROUND_Y,
  P,
  anchors,
  f,
  lerpPt,
  limbPath,
  quadPt,
  sleevePath,
  sliver,
  type BodyGeometry,
  type Pt,
} from '../geometry';
import { VolumeGradient, url } from '../paint';
import { p, type ArtContext, type VectorArt } from '../types';

const CX = CANVAS.cx;
const SIDES = [-1, 1] as const;
const L = (x: number) => CX - x;
const R = (x: number) => CX + x;

// =============================================================== utilidades

/** Faixa reta (punhos e barras de manga). */
function band(a: Pt, b: Pt, wa: number, wb: number) {
  const dx = b.x - a.x;
  const dy = b.y - a.y;
  const l = Math.hypot(dx, dy) || 1;
  const n = { x: -dy / l, y: dx / l };
  return `M${P({ x: a.x + n.x * wa, y: a.y + n.y * wa })} L${P({ x: b.x + n.x * wb, y: b.y + n.y * wb })} L${P({ x: b.x - n.x * wb, y: b.y - n.y * wb })} L${P({ x: a.x - n.x * wa, y: a.y - n.y * wa })} Z`;
}

/** Sombra de volume em preto translúcido (para tecidos estampados). */
function ShadeOverlay({ id }: { id: string }) {
  return (
    <LinearGradient id={id} x1="0" y1="0" x2="1" y2="0">
      <Stop offset="0" stopColor="#1A0E06" stopOpacity={0.38} />
      <Stop offset="0.25" stopColor="#1A0E06" stopOpacity={0.04} />
      <Stop offset="0.45" stopColor="#FFF6E0" stopOpacity={0.1} />
      <Stop offset="0.75" stopColor="#1A0E06" stopOpacity={0.04} />
      <Stop offset="1" stopColor="#1A0E06" stopOpacity={0.42} />
    </LinearGradient>
  );
}

/** Pequeno arabesco (bordado) centrado em (x, y). */
const swirl = (x: number, y: number, s = 1, flip = 1) =>
  `M${f(x - 7 * s * flip)} ${f(y + 3 * s)} c0 ${f(-8 * s)} ${f(11 * s * flip)} ${f(-9 * s)} ${f(11 * s * flip)} ${f(-2 * s)} c0 ${f(5 * s)} ${f(-7 * s * flip)} ${f(5 * s)} ${f(-6 * s * flip)} 0`;

// =============================================================== túnicas

type Sleeve = 'elbow' | 'three' | 'long';
type Neck = 'placket' | 'round' | 'wrap';
type TunicSpec = { hemY: number; sleeve: Sleeve; neck: Neck };

function tunicGeo(g: BodyGeometry, hemY: number) {
  const nx = g.neck + 10;
  const sh = g.shoulder;
  const ax = g.chest + 8;
  const wx = Math.max(g.waist, g.chest - 12) + 18;
  const hx = g.hip + 26;
  const hem = g.hip + 54 + (hemY - 1130) * 0.08;
  /** meia-largura nas laterais entre o quadril e a barra */
  const sideAt = (y: number) => (y <= 810 ? hx : hx + ((hem - hx) * (y - 810)) / (hemY - 810));
  return { nx, sh, ax, wx, hx, hem, sideAt };
}

/** Barra levemente ondulada (tecido caindo), da esquerda para a direita. */
function hemWave(hem: number, hemY: number) {
  const y = (x: number) => hemY + 26 * (1 - (x / hem) ** 2);
  const n = 5;
  const seg = (hem * 2) / n;
  let d = '';
  for (let i = 0; i < n; i++) {
    const x0 = -hem + i * seg;
    const x1 = x0 + seg;
    const a = i % 2 ? 7 : -5;
    d += ` C${f(CX + x0 + seg / 3)} ${f(y(x0 + seg / 3) + a)} ${f(CX + x1 - seg / 3)} ${f(y(x1 - seg / 3) + a)} ${f(CX + x1)} ${f(y(x1))}`;
  }
  return d;
}

function tunicOutline(g: BodyGeometry, hemY: number, neck: Neck) {
  const { nx, sh, ax, wx, hx, hem } = tunicGeo(g, hemY);
  const dip = neck === 'wrap' ? 560 : neck === 'placket' ? 448 : 452;
  const neckClose = neck === 'wrap' ? `L${CX} ${dip} Z` : `Q${CX} ${dip} ${L(nx)} 426 Z`;
  return `M${L(nx)} 426 C${L(nx + 18)} 440 ${L(sh - 24)} 446 ${L(sh - 6)} 456 C${L(sh + 10)} 466 ${L(sh + 8)} 500 ${L(ax)} 580 C${L(ax + 4)} 640 ${L(wx)} 660 ${L(wx)} 700 C${L(wx + 2)} 750 ${L(hx)} 770 ${L(hx)} 810 L${L(hem)} ${hemY}${hemWave(hem, hemY)} L${R(hx)} 810 C${R(hx)} 770 ${R(wx + 2)} 750 ${R(wx)} 700 C${R(wx)} 660 ${R(ax + 4)} 640 ${R(ax)} 580 C${R(sh + 8)} 500 ${R(sh + 10)} 466 ${R(sh - 6)} 456 C${R(sh - 24)} 446 ${R(nx + 18)} 440 ${R(nx)} 426 ${neckClose}`;
}

/** Curva paralela à barra, `off` unidades acima. */
function hemCurve(g: BodyGeometry, hemY: number, off: number) {
  const { sideAt } = tunicGeo(g, hemY);
  const y = hemY - off;
  const w = sideAt(y) - 2;
  return { p0: { x: L(w), y }, c: { x: CX, y: y + 26 }, p2: { x: R(w), y } };
}

function sleeveGeo(g: BodyGeometry, side: -1 | 1, kind: Sleeve) {
  const a = anchors(g, side);
  const t = kind === 'elbow' ? 0.2 : kind === 'three' ? 0.5 : 0.95;
  const end = lerpPt(a.elbow, a.wrist, t);
  const wEnd = kind === 'elbow' ? g.forearm + 22 : kind === 'three' ? g.forearm + 16 : g.forearm + 18;
  return { a, end, wEnd, d: sleevePath(a.shoulder, a.elbow, end, g.upperArm + 15, g.upperArm + 13, wEnd) };
}

function folds(g: BodyGeometry, hemY: number, base: string) {
  const { hem } = tunicGeo(g, hemY);
  const dark = shade(base, -0.28);
  const light = shade(base, 0.18);
  const out: ReactElement[] = [];
  [-0.62, -0.28, 0.12, 0.46].forEach((k, i) => {
    out.push(<Path key={`d${i}`} d={sliver({ x: CX + k * 70, y: 760 }, { x: CX + k * hem * 0.95, y: hemY + 8 }, 7, i % 2 ? 8 : -8)} fill={dark} opacity={0.34} />);
  });
  [-0.45, 0.3].forEach((k, i) => {
    out.push(<Path key={`l${i}`} d={sliver({ x: CX + k * 60, y: 800 }, { x: CX + k * hem * 0.85, y: hemY - 10 }, 4, 6)} fill={light} opacity={0.3} />);
  });
  return out;
}

function hemEmbroidery(g: BodyGeometry, hemY: number, trim: string, motif: 'swirl' | 'diamond') {
  const top = hemCurve(g, hemY, 40);
  const bot = hemCurve(g, hemY, 14);
  const mid = hemCurve(g, hemY, 27);
  const curve = (c: typeof top) => `M${P(c.p0)} Q${P(c.c)} ${P(c.p2)}`;
  const marks: ReactElement[] = [];
  for (let i = 1; i < 14; i++) {
    const pt = quadPt(mid.p0, mid.c, mid.p2, i / 14);
    marks.push(
      motif === 'swirl' ? (
        <Path key={i} d={swirl(pt.x, pt.y, 1.1, i % 2 ? 1 : -1)} stroke={trim} strokeWidth={2.4} fill="none" strokeLinecap="round" />
      ) : (
        <Path key={i} d={`M${f(pt.x)} ${f(pt.y - 7)} l7 7 l-7 7 l-7 -7 Z`} fill={trim} />
      ),
    );
  }
  return (
    <G>
      <Path d={curve(top)} stroke={trim} strokeWidth={3} fill="none" />
      <Path d={curve(bot)} stroke={trim} strokeWidth={3} fill="none" />
      {marks}
    </G>
  );
}

function neckTrim(g: BodyGeometry, neck: Neck, trim: string) {
  const nx = g.neck + 10;
  if (neck === 'wrap') {
    return (
      <G>
        <Path d={`M${L(nx)} 426 L${CX} 560`} stroke={trim} strokeWidth={10} strokeLinecap="round" />
        <Path d={`M${R(nx)} 426 L${CX} 560`} stroke={shade(trim, -0.1)} strokeWidth={10} strokeLinecap="round" />
      </G>
    );
  }
  if (neck === 'placket') {
    return (
      <G>
        <Path d={`M${L(nx)} 426 Q${CX} 452 ${R(nx)} 426`} stroke={trim} strokeWidth={7} fill="none" strokeLinecap="round" />
        <Path d={`M${CX} 446 L${CX} 540`} stroke={lineOf(trim)} strokeWidth={2.4} />
        <Path d={`M${CX - 16} 448 C${CX - 10} 490 ${CX - 6} 520 ${CX - 2} 548 M${CX + 16} 448 C${CX + 10} 490 ${CX + 6} 520 ${CX + 2} 548`} stroke={trim} strokeWidth={3} fill="none" />
        {[466, 492, 518].map((y, i) => (
          <G key={y}>
            <Path d={swirl(CX - 26 + i * 2, y, 1.2, -1)} stroke={trim} strokeWidth={2.4} fill="none" strokeLinecap="round" />
            <Path d={swirl(CX + 26 - i * 2, y, 1.2, 1)} stroke={trim} strokeWidth={2.4} fill="none" strokeLinecap="round" />
          </G>
        ))}
      </G>
    );
  }
  return <Path d={`M${L(nx)} 426 Q${CX} 454 ${R(nx)} 426`} stroke={trim} strokeWidth={9} fill="none" strokeLinecap="round" />;
}

type TunicParts = { body: VectorArt; sleeves: VectorArt };

function makeTunic(spec: TunicSpec, decorate: (ctx: ArtContext, g: BodyGeometry) => ReactElement | null, sleeveDecor?: (ctx: ArtContext, s: ReturnType<typeof sleeveGeo>) => ReactElement | null): TunicParts {
  return {
    body: (ctx) => {
      const base = p(ctx, 'base', '#E3C18A');
      const id = `${ctx.uid}-tunic`;
      return (
        <G>
          <Defs>
            <VolumeGradient id={id} base={base} />
          </Defs>
          <Path d={tunicOutline(ctx.g, spec.hemY, spec.neck)} fill={url(id)} stroke={lineOf(base)} strokeWidth={3} strokeLinejoin="round" />
          {folds(ctx.g, spec.hemY, base)}
          {decorate(ctx, ctx.g)}
          {neckTrim(ctx.g, spec.neck, p(ctx, 'trim', '#3E8E9A'))}
        </G>
      );
    },
    sleeves: (ctx) => {
      const base = p(ctx, 'base', '#E3C18A');
      const trim = p(ctx, 'trim', '#3E8E9A');
      const id = `${ctx.uid}-sleeve`;
      return (
        <G>
          <Defs>
            <VolumeGradient id={id} base={base} edge={-0.26} />
          </Defs>
          {SIDES.map((side) => {
            const s = sleeveGeo(ctx.g, side, spec.sleeve);
            const cuffA = lerpPt(s.a.elbow, s.end, 0.62);
            return (
              <G key={side}>
                <Path d={s.d} fill={url(id)} stroke={lineOf(base)} strokeWidth={3} strokeLinejoin="round" />
                <Path d={sliver(lerpPt(s.a.shoulder, s.a.elbow, 0.25), lerpPt(s.a.shoulder, s.a.elbow, 0.95), 5, side * 5)} fill={shade(base, -0.3)} opacity={0.35} />
                <Path d={`M${P(lerpPt(s.a.elbow, s.end, 0.1))} q${side * 8} 8 ${side * 2} 18`} stroke={shade(base, -0.32)} strokeWidth={2} fill="none" opacity={0.6} />
                {sleeveDecor ? sleeveDecor(ctx, s) : <Path d={band(cuffA, s.end, s.wEnd - 4, s.wEnd)} fill={trim} opacity={0.95} />}
              </G>
            );
          })}
        </G>
      );
    },
  };
}

// --- Túnica de Linho: areia com bordado turquesa, abertura no peito e fendas laterais
const linen = makeTunic(
  { hemY: 1120, sleeve: 'three', neck: 'placket' },
  (ctx, g) => {
    const trim = p(ctx, 'trim', '#3E8E9A');
    const { sideAt } = tunicGeo(g, 1120);
    return (
      <G>
        {hemEmbroidery(g, 1120, trim, 'swirl')}
        {SIDES.map((s) => (
          <Path key={s} d={`M${CX + s * (sideAt(1010) - 2)} 1010 L${CX + s * (sideAt(1112) - 10)} 1114`} stroke={lineOf(p(ctx, 'base', '#E3C18A'))} strokeWidth={2.6} />
        ))}
      </G>
    );
  },
  (ctx, s) => {
    const trim = p(ctx, 'trim', '#3E8E9A');
    const a = lerpPt(s.a.elbow, s.end, 0.68);
    return (
      <G>
        <Path d={band(a, lerpPt(a, s.end, 0.45), s.wEnd - 3, s.wEnd - 2)} fill="none" stroke={trim} strokeWidth={2.4} />
        <Path d={swirl(lerpPt(a, s.end, 0.6).x, lerpPt(a, s.end, 0.6).y + 4, 1)} stroke={trim} strokeWidth={2.2} fill="none" />
      </G>
    );
  },
);

// --- Túnica Índigo: listras verticais douradas (clavi)
const indigo = makeTunic({ hemY: 1150, sleeve: 'elbow', neck: 'round' }, (ctx, g) => {
  const trim = p(ctx, 'trim', '#D9B45A');
  const { hem } = tunicGeo(g, 1150);
  return (
    <G>
      {SIDES.map((s) => (
        <G key={s}>
          <Path d={`M${CX + s * (g.neck + 26)} 440 L${CX + s * (g.neck + 34)} 600 L${CX + s * (hem * 0.42)} 1166`} stroke={lineOf(trim)} strokeWidth={17} fill="none" strokeLinejoin="round" />
          <Path d={`M${CX + s * (g.neck + 26)} 440 L${CX + s * (g.neck + 34)} 600 L${CX + s * (hem * 0.42)} 1166`} stroke={trim} strokeWidth={12} fill="none" strokeLinejoin="round" />
          <Path d={`M${CX + s * (g.neck + 26)} 440 L${CX + s * (g.neck + 34)} 600 L${CX + s * (hem * 0.42)} 1166`} stroke={shade(trim, -0.25)} strokeWidth={2} strokeDasharray="6 8" fill="none" />
        </G>
      ))}
      {hemEmbroidery(g, 1150, trim, 'diamond')}
    </G>
  );
});

// --- Túnica Terracota: transpassada, com faixa verde amarrada na cintura
const terracotta = makeTunic({ hemY: 1100, sleeve: 'three', neck: 'wrap' }, (ctx, g) => {
  const base = p(ctx, 'base', '#A9533A');
  const sash = p(ctx, 'sash', '#41604B');
  const { wx } = tunicGeo(g, 1100);
  const sid = `${ctx.uid}-sash`;
  const kx = CX + wx * 0.45;
  return (
    <G>
      <Defs>
        <VolumeGradient id={sid} base={sash} />
      </Defs>
      <Path d={`M${CX} 560 C${CX + 30} 640 ${CX + wx * 0.5} 690 ${CX + wx * 0.7} 700`} stroke={lineOf(base)} strokeWidth={3} fill="none" />
      <Path d={`M${CX + 4} 600 C${CX + 40} 700 ${CX + 50} 900 ${CX + 40} 1110`} stroke={lineOf(base)} strokeWidth={2.6} fill="none" />
      <Path d={`M${L(wx + 2)} 688 C${CX - 40} 700 ${CX + 40} 700 ${R(wx + 2)} 688 L${R(wx + 4)} 728 C${CX + 40} 740 ${CX - 40} 740 ${L(wx + 4)} 728 Z`} fill={url(sid)} stroke={lineOf(sash)} strokeWidth={3} />
      <Path d={`M${kx - 8} 724 C${kx - 22} 790 ${kx - 30} 840 ${kx - 20} 900 L${kx + 2} 896 C${kx - 4} 840 ${kx + 2} 790 ${kx + 6} 726 Z`} fill={shade(sash, -0.08)} stroke={lineOf(sash)} strokeWidth={2.6} />
      <Path d={`M${kx + 6} 724 C${kx + 16} 780 ${kx + 30} 830 ${kx + 34} 878 L${kx + 54} 870 C${kx + 44} 820 ${kx + 26} 770 ${kx + 18} 722 Z`} fill={sash} stroke={lineOf(sash)} strokeWidth={2.6} />
      <Path d={`M${kx - 16} 704 C${kx - 18} 726 ${kx + 18} 732 ${kx + 20} 708 C${kx + 14} 694 ${kx - 10} 692 ${kx - 16} 704 Z`} fill={shade(sash, 0.08)} stroke={lineOf(sash)} strokeWidth={2.6} />
      {hemEmbroidery(g, 1100, p(ctx, 'trim', '#E8C98E'), 'diamond')}
    </G>
  );
});

// --- Túnica de José (Gn 37:3): longa, mangas compridas, faixas de várias cores
const JOSEPH_COLORS = ['#8E2B2F', '#D79A2B', '#2F4C7E', '#4E7A43', '#6B3A6E', '#C4602E', '#2E6E73'];

function stripes(width = 40) {
  const out: ReactElement[] = [];
  for (let i = 0; i < 30; i++) {
    const x = 92 + i * width;
    const c = JOSEPH_COLORS[i % JOSEPH_COLORS.length]!;
    out.push(<Rect key={i} x={x} y={380} width={width} height={1100} fill={c} />);
    out.push(<Rect key={`g${i}`} x={x - 2} y={380} width={4} height={1100} fill="#E2B857" />);
    out.push(<Rect key={`p${i}`} x={x + width / 2 - 1} y={380} width={2} height={1100} fill="#F4E4B8" opacity={0.35} />);
  }
  return out;
}

const josephSpec: TunicSpec = { hemY: 1360, sleeve: 'long', neck: 'round' };
const joseph: TunicParts = {
  body: (ctx) => {
    const clip = `${ctx.uid}-jclip`;
    const sh = `${ctx.uid}-jshade`;
    const outline = tunicOutline(ctx.g, josephSpec.hemY, 'round');
    return (
      <G>
        <Defs>
          <ClipPath id={clip}>
            <Path d={outline} />
          </ClipPath>
          <ShadeOverlay id={sh} />
        </Defs>
        <G clipPath={`url(#${clip})`}>{stripes()}</G>
        {folds(ctx.g, josephSpec.hemY, '#7A4A2A')}
        <Path d={outline} fill={url(sh)} stroke="#3A2414" strokeWidth={3} strokeLinejoin="round" />
        {hemEmbroidery(ctx.g, josephSpec.hemY, '#E2B857', 'diamond')}
        <Path d={`M${L(ctx.g.neck + 10)} 426 Q${CX} 454 ${R(ctx.g.neck + 10)} 426`} stroke="#E2B857" strokeWidth={12} fill="none" strokeLinecap="round" />
        <Path d={`M${L(ctx.g.neck + 10)} 426 Q${CX} 454 ${R(ctx.g.neck + 10)} 426`} stroke="#8E2B2F" strokeWidth={3} strokeDasharray="4 6" fill="none" />
      </G>
    );
  },
  sleeves: (ctx) => {
    const sh = `${ctx.uid}-jsshade`;
    return (
      <G>
        <Defs>
          <ShadeOverlay id={sh} />
          {SIDES.map((side) => (
            <ClipPath key={side} id={`${ctx.uid}-jsl${side}`}>
              <Path d={sleeveGeo(ctx.g, side, 'long').d} />
            </ClipPath>
          ))}
        </Defs>
        {SIDES.map((side) => {
          const s = sleeveGeo(ctx.g, side, 'long');
          const cuffA = lerpPt(s.a.elbow, s.end, 0.8);
          return (
            <G key={side}>
              <G clipPath={`url(#${ctx.uid}-jsl${side})`}>{stripes(28)}</G>
              <Path d={s.d} fill={url(sh)} stroke="#3A2414" strokeWidth={3} strokeLinejoin="round" />
              <Path d={band(cuffA, s.end, s.wEnd - 4, s.wEnd)} fill="#E2B857" stroke="#3A2414" strokeWidth={2} />
              <Path d={band(lerpPt(cuffA, s.end, 0.35), lerpPt(cuffA, s.end, 0.65), s.wEnd - 3, s.wEnd - 2)} fill="#8E2B2F" />
            </G>
          );
        })}
      </G>
    );
  },
};

export const tunic: Record<string, VectorArt> = {
  'linen.body': linen.body,
  'linen.sleeves': linen.sleeves,
  'indigo.body': indigo.body,
  'indigo.sleeves': indigo.sleeves,
  'terracotta.body': terracotta.body,
  'terracotta.sleeves': terracotta.sleeves,
  'joseph.body': joseph.body,
  'joseph.sleeves': joseph.sleeves,
};

/** Usado quando a peça não tem arte publicada para esta versão. */
const plain = makeTunic({ hemY: 1120, sleeve: 'elbow', neck: 'round' }, () => null);

export const fallback: Record<string, VectorArt> = {
  tunic: (ctx) => plain.body({ ...ctx, params: GRAY }),
  sleeves: (ctx) => plain.sleeves({ ...ctx, params: GRAY }),
  cloakBack: (ctx) => cloak['wool.back']!({ ...ctx, params: { base: '#8F877A', trim: '#B3AB9C' } }),
  cloakFront: (ctx) => cloak['wool.front']!({ ...ctx, params: { base: '#8F877A', trim: '#B3AB9C' } }),
  feet: (ctx) => feet.sandals!({ ...ctx, params: { base: '#8C8273' } }),
};

// =============================================================== mantos

function cloakFolds(g: BodyGeometry, base: string, spread: number) {
  const s = g.shoulder;
  return SIDES.map((side) => (
    <G key={side}>
      {[0.3, 0.62, 0.9].map((k, i) => (
        <Path key={i} d={sliver({ x: CX + side * (s + 20 * k), y: 560 + i * 30 }, { x: CX + side * (s + spread * k), y: 1390 }, 9, side * (i % 2 ? 10 : -6))} fill={shade(base, -0.3)} opacity={0.4} />
      ))}
      <Path d={sliver({ x: CX + side * (s + 30), y: 620 }, { x: CX + side * (s + spread * 0.75), y: 1370 }, 5, side * 8)} fill={shade(base, 0.2)} opacity={0.3} />
    </G>
  ));
}

export const cloak: Record<string, VectorArt> = {
  'wool.back': (ctx) => {
    const { g } = ctx;
    const base = p(ctx, 'base', '#6E5038');
    const trim = p(ctx, 'trim', '#C9B48A');
    const id = `${ctx.uid}-cbk`;
    const s = g.shoulder;
    const d = `M${L(g.neck + 18)} 428 C${L(s + 10)} 436 ${L(s + 40)} 470 ${L(s + 46)} 560 C${L(s + 70)} 820 ${L(s + 108)} 1120 ${L(s + 122)} 1404 Q${CX} 1436 ${R(s + 122)} 1404 C${R(s + 108)} 1120 ${R(s + 70)} 820 ${R(s + 46)} 560 C${R(s + 40)} 470 ${R(s + 10)} 436 ${R(g.neck + 18)} 428 Z`;
    return (
      <G>
        <Defs>
          <VolumeGradient id={id} base={shade(base, -0.12)} edge={-0.3} />
        </Defs>
        <Path d={d} fill={url(id)} stroke={lineOf(base)} strokeWidth={3} strokeLinejoin="round" />
        {cloakFolds(g, base, 118)}
        <Path d={`M${L(s + 118)} 1372 Q${CX} 1404 ${R(s + 118)} 1372`} stroke={trim} strokeWidth={8} fill="none" />
        <Path d={`M${L(s + 116)} 1352 Q${CX} 1384 ${R(s + 116)} 1352`} stroke={trim} strokeWidth={3} fill="none" />
      </G>
    );
  },
  'wool.front': (ctx) => {
    const { g } = ctx;
    const base = p(ctx, 'base', '#6E5038');
    const trim = p(ctx, 'trim', '#C9B48A');
    const id = `${ctx.uid}-cfr`;
    const s = g.shoulder;
    const panel = `M${L(g.neck + 6)} 428 C${L(g.neck + 34)} 432 ${L(s + 8)} 442 ${L(s + 30)} 478 C${L(s + 42)} 560 ${L(s + 38)} 820 ${L(s + 30)} 1060 C${L(s + 6)} 1074 ${L(g.chest - 4)} 1070 ${L(g.chest - 14)} 1050 C${L(g.chest - 18)} 820 ${L(g.chest - 26)} 620 ${L(g.neck + 22)} 472 Z`;
    const el = (
      <G>
        <Path d={panel} fill={url(id)} stroke={lineOf(base)} strokeWidth={3} strokeLinejoin="round" />
        <Path d={`M${L(g.chest - 8)} 1046 C${L(g.chest - 12)} 820 ${L(g.chest - 20)} 620 ${L(g.neck + 16)} 470`} stroke={trim} strokeWidth={6} fill="none" />
        <Path d={sliver({ x: L(s + 6), y: 520 }, { x: L(s + 14), y: 1040 }, 7, -6)} fill={shade(base, -0.3)} opacity={0.4} />
        <Path d={sliver({ x: L(s - 18), y: 560 }, { x: L(g.chest + 8), y: 1030 }, 5, 6)} fill={shade(base, 0.22)} opacity={0.3} />
      </G>
    );
    return (
      <G>
        <Defs>
          <VolumeGradient id={id} base={base} edge={-0.28} />
        </Defs>
        <G>{el}</G>
        <G transform="translate(1024 0) scale(-1 1)">{el}</G>
        <Path d={`M${L(g.neck + 30)} 470 C${CX - 10} 500 ${CX + 10} 500 ${R(g.neck + 30)} 470`} stroke={shade(trim, -0.3)} strokeWidth={3} fill="none" />
        <Path d={`M${CX - 12} 494 a12 12 0 1 0 24 0 a12 12 0 1 0 -24 0`} fill="#C99A45" stroke={lineOf('#C99A45')} strokeWidth={2.4} />
      </G>
    );
  },

  'desert.back': (ctx) => {
    const { g } = ctx;
    const base = p(ctx, 'base', '#D9A75E');
    const trim = p(ctx, 'trim', '#3E8E9A');
    const id = `${ctx.uid}-dbk`;
    const s = g.shoulder;
    const d = `M${L(g.neck + 20)} 426 C${L(s + 14)} 434 ${L(s + 44)} 480 ${L(s + 50)} 580 C${L(s + 80)} 860 ${L(s + 110)} 1120 ${L(s + 116)} 1330 C${L(s + 40)} 1360 ${CX} 1350 ${R(s + 60)} 1340 C${R(s + 120)} 1336 ${R(s + 168)} 1320 ${R(s + 196)} 1290 C${R(s + 150)} 1080 ${R(s + 80)} 820 ${R(s + 52)} 580 C${R(s + 44)} 480 ${R(s + 14)} 434 ${R(g.neck + 20)} 426 Z`;
    const fringe = Array.from({ length: 9 }, (_, i) => {
      const x = CX + s + 70 + i * 14;
      const y = 1336 - i * 5.5;
      return <Path key={i} d={`M${f(x)} ${f(y)} q${i % 2 ? 4 : -3} 14 ${i % 2 ? 1 : 3} 26`} stroke={shade(base, -0.25)} strokeWidth={2.4} strokeLinecap="round" fill="none" />;
    });
    return (
      <G>
        <Defs>
          <VolumeGradient id={id} base={shade(base, -0.1)} edge={-0.3} />
        </Defs>
        <Path d={d} fill={url(id)} stroke={lineOf(base)} strokeWidth={3} strokeLinejoin="round" />
        {cloakFolds(g, base, 150)}
        {[0.15, 0.3, 0.45, 0.6, 0.75, 0.9].map((t, i) => {
          const pt = quadPt({ x: L(s + 100), y: 1300 }, { x: CX, y: 1340 }, { x: R(s + 180), y: 1270 }, t);
          return <Path key={i} d={swirl(pt.x, pt.y, 1.6, i % 2 ? 1 : -1)} stroke={trim} strokeWidth={3} fill="none" strokeLinecap="round" />;
        })}
        {fringe}
      </G>
    );
  },
  'desert.front': (ctx) => {
    const { g } = ctx;
    const base = p(ctx, 'base', '#D9A75E');
    const trim = p(ctx, 'trim', '#3E8E9A');
    const id = `${ctx.uid}-dfr`;
    const s = g.shoulder;
    const n = g.neck;
    // capuz enrolado no pescoço (como um lenço) + painéis caindo à frente
    const left = `M${L(n + 40)} 460 C${L(s + 10)} 452 ${L(s + 34)} 480 ${L(s + 36)} 560 C${L(s + 34)} 700 ${L(s + 26)} 820 ${L(s + 18)} 940 Q${L(s - 10)} 960 ${L(g.chest - 12)} 920 C${L(g.chest - 20)} 760 ${L(g.chest - 24)} 600 ${L(n + 20)} 500 Z`;
    const right = `M${R(n + 40)} 460 C${R(s + 10)} 452 ${R(s + 34)} 480 ${R(s + 38)} 560 C${R(s + 40)} 760 ${R(s + 34)} 920 ${R(s + 24)} 1080 Q${R(s - 4)} 1096 ${R(g.chest - 8)} 1060 C${R(g.chest - 18)} 860 ${R(g.chest - 24)} 640 ${R(n + 20)} 500 Z`;
    return (
      <G>
        <Defs>
          <VolumeGradient id={id} base={base} edge={-0.26} />
        </Defs>
        <Path d={left} fill={url(id)} stroke={lineOf(base)} strokeWidth={3} strokeLinejoin="round" />
        <Path d={right} fill={url(id)} stroke={lineOf(base)} strokeWidth={3} strokeLinejoin="round" />
        <Path d={sliver({ x: L(s + 10), y: 540 }, { x: L(s + 14), y: 920 }, 6, -6)} fill={shade(base, -0.3)} opacity={0.38} />
        <Path d={sliver({ x: R(s + 12), y: 540 }, { x: R(s + 20), y: 1060 }, 6, 6)} fill={shade(base, -0.3)} opacity={0.38} />
        {[880, 1020].map((y, i) => (
          <Path key={y} d={swirl(i ? R(s + 4) : L(s - 4), y, 1.6, i ? 1 : -1)} stroke={trim} strokeWidth={3} fill="none" strokeLinecap="round" />
        ))}
        {/* lenço enrolado no pescoço: três voltas de tecido */}
        {[
          { d: `M${L(n + 58)} 452 C${L(n + 20)} 520 ${R(n + 20)} 520 ${R(n + 58)} 452`, w: 30, c: shade(base, -0.08) },
          { d: `M${L(n + 50)} 432 C${L(n + 10)} 488 ${R(n + 16)} 492 ${R(n + 52)} 436`, w: 26, c: base },
          { d: `M${L(n + 36)} 418 C${L(n)} 450 ${R(n + 4)} 452 ${R(n + 40)} 420`, w: 20, c: shade(base, 0.08) },
        ].map((r, i) => (
          <G key={i}>
            <Path d={r.d} stroke={lineOf(base)} strokeWidth={r.w + 6} fill="none" strokeLinecap="round" />
            <Path d={r.d} stroke={r.c} strokeWidth={r.w} fill="none" strokeLinecap="round" />
            <Path d={r.d} stroke={shade(base, 0.22)} strokeWidth={3} fill="none" strokeLinecap="round" opacity={0.5} transform={`translate(0 ${-r.w / 3})`} />
          </G>
        ))}
        <Path d={`M${CX + 18} 500 C${CX + 30} 540 ${CX + 22} 590 ${CX + 34} 640 L${CX + 56} 632 C${CX + 46} 580 ${CX + 50} 536 ${CX + 40} 498 Z`} fill={shade(base, -0.04)} stroke={lineOf(base)} strokeWidth={3} strokeLinejoin="round" />
        {[0, 1].map((i) => (
          <Path key={i} d={swirl(CX + 40 + i * 6, 560 + i * 40, 1.1, 1)} stroke={trim} strokeWidth={2.2} fill="none" strokeLinecap="round" />
        ))}
        <Path d={`M${L(n + 40)} 494 C${L(n + 6)} 512 ${R(n + 6)} 512 ${R(n + 40)} 494`} stroke={trim} strokeWidth={3} fill="none" opacity={0.85} />
      </G>
    );
  },
};

// =============================================================== calçados

function strap(d: string, color: string, w = 7) {
  return (
    <G>
      <Path d={d} stroke={lineOf(color)} strokeWidth={w + 4} fill="none" strokeLinecap="round" />
      <Path d={d} stroke={color} strokeWidth={w} fill="none" strokeLinecap="round" />
    </G>
  );
}

export const feet: Record<string, VectorArt> = {
  sandals: (ctx) => {
    const base = p(ctx, 'base', '#7A4E2C');
    const sole = shade(base, -0.3);
    return (
      <G>
        {SIDES.map((side) => {
          const a = anchors(ctx.g, side).ankle;
          const x = a.x;
          const s = side;
          return (
            <G key={side}>
              <Path d={`M${f(x - 28 + s * 4)} ${GROUND_Y - 4} C${f(x - 30)} ${GROUND_Y + 10} ${f(x + 34 + s * 10)} ${GROUND_Y + 12} ${f(x + 34 + s * 10)} ${GROUND_Y - 4} C${f(x + 30 + s * 10)} ${GROUND_Y + 2} ${f(x - 22)} ${GROUND_Y + 2} ${f(x - 28 + s * 4)} ${GROUND_Y - 4} Z`} fill={sole} stroke={lineOf(base)} strokeWidth={2.6} />
              {strap(`M${f(x - 16 + s * 6)} 1432 Q${f(x + 4 + s * 8)} 1422 ${f(x + 24 + s * 9)} 1432`, base, 6)}
              {strap(`M${f(x - ctx.g.ankle - 2)} 1404 L${f(x + 18 + s * 6)} 1428`, base, 6)}
              {strap(`M${f(x + ctx.g.ankle + 2)} 1404 L${f(x - 12 + s * 4)} 1428`, base, 6)}
              {strap(`M${f(x - ctx.g.ankle - 3)} 1384 Q${f(x)} 1394 ${f(x + ctx.g.ankle + 3)} 1384`, base, 6)}
            </G>
          );
        })}
      </G>
    );
  },
  boots: (ctx) => {
    const base = p(ctx, 'base', '#5C3E28');
    const accent = p(ctx, 'accent', '#C9B48A');
    const id = `${ctx.uid}-boot`;
    return (
      <G>
        <Defs>
          <VolumeGradient id={id} base={base} edge={-0.3} />
        </Defs>
        {SIDES.map((side) => {
          const a = anchors(ctx.g, side);
          const top = lerpPt(a.knee, a.ankle, 0.42);
          const wTop = ctx.g.calf + 8;
          const x = a.ankle.x;
          const s = side;
          const foot = `M${f(x - ctx.g.ankle - 8)} 1372 C${f(x - ctx.g.ankle - 12)} 1410 ${f(x - 28 + s * 4)} 1436 ${f(x - 16 + s * 8)} ${GROUND_Y} C${f(x + s * 10)} ${GROUND_Y + 8} ${f(x + 30 + s * 8)} ${GROUND_Y + 6} ${f(x + 32 + s * 10)} ${GROUND_Y - 10} C${f(x + 32 + s * 6)} 1418 ${f(x + ctx.g.ankle + 10)} 1404 ${f(x + ctx.g.ankle + 8)} 1372 Z`;
          return (
            <G key={side}>
              <Path d={foot} fill={url(id)} stroke={lineOf(base)} strokeWidth={3} strokeLinejoin="round" />
              <Path d={limbPath(top, { x: a.ankle.x, y: a.ankle.y - 6 }, wTop, ctx.g.ankle + 10, 0.15)} fill={url(id)} stroke={lineOf(base)} strokeWidth={3} />
              <Path d={`M${f(x - 14 + s * 6)} 1420 Q${f(x + 2 + s * 8)} 1412 ${f(x + 20 + s * 8)} 1422`} stroke={shade(base, -0.35)} strokeWidth={2} fill="none" />
              <Path d={`M${f(x - 30 + s * 4)} ${GROUND_Y + 2} C${f(x)} ${GROUND_Y + 12} ${f(x + 30 + s * 10)} ${GROUND_Y + 8} ${f(x + 34 + s * 10)} ${GROUND_Y - 2}`} stroke={shade(base, -0.5)} strokeWidth={7} fill="none" strokeLinecap="round" />
              {[0.15, 0.4, 0.65].map((t, i) => {
                const c = lerpPt(top, a.ankle, t);
                const w = wTop + (ctx.g.ankle + 9 - wTop) * t;
                return <Path key={i} d={`M${f(c.x - w)} ${f(c.y + 8)} L${f(c.x + w)} ${f(c.y - 8)}`} stroke={accent} strokeWidth={6} strokeLinecap="round" opacity={0.9} />;
              })}
              <Path d={`M${f(top.x - wTop - 6)} ${f(top.y - 4)} Q${f(top.x)} ${f(top.y - 18)} ${f(top.x + wTop + 6)} ${f(top.y - 4)} L${f(top.x + wTop + 3)} ${f(top.y + 20)} Q${f(top.x)} ${f(top.y + 10)} ${f(top.x - wTop - 3)} ${f(top.y + 20)} Z`} fill={shade(base, 0.14)} stroke={lineOf(base)} strokeWidth={2.6} strokeLinejoin="round" />
              <Path d={`M${f(top.x - wTop)} ${f(top.y + 10)} L${f(top.x + wTop)} ${f(top.y + 10)}`} stroke={mix(accent, base, 0.4)} strokeWidth={1.6} strokeDasharray="5 5" />
            </G>
          );
        })}
      </G>
    );
  },
};

const GRAY = { base: '#B9AE9C', trim: '#9A8F7E' };
