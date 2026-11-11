import type { ReactElement } from 'react';
import { Circle, G, Line, Path } from 'react-native-svg';
import { shade } from '../color';
import { CANVAS } from '../geometry';
import type { ArtContext, VectorArt } from '../types';

const CX = CANVAS.cx;
const outline = (c: string) => shade(c, -0.42);
const shine = (c: string) => shade(c, 0.28);

const solid = (d: string, extra?: (c: string) => ReactElement | null) => (ctx: ArtContext) => (
  <G>
    <Path d={d} fill={ctx.hair} stroke={outline(ctx.hair)} strokeWidth={5} strokeLinejoin="round" />
    {extra ? extra(ctx.hair) : null}
  </G>
);

const topShine = (c: string) => (
  <Path d="M300 214 Q340 196 384 200" stroke={shine(c)} strokeWidth={9} fill="none" strokeLinecap="round" opacity={0.7} />
);

// ---------- formas reutilizadas ----------
const SHORT_FRONT = 'M234 350 C222 228 288 172 360 172 C432 172 498 228 486 350 C476 304 458 276 432 262 C408 288 352 292 318 270 C300 284 282 282 268 272 C252 292 240 318 234 350 Z';
const SHORT_BACK = 'M240 330 C236 230 292 186 360 186 C428 186 484 230 480 330 L476 404 C470 424 250 424 244 404 Z';
const SLICK_FRONT = 'M238 340 C230 232 292 182 360 182 C428 182 490 232 482 340 C470 290 430 248 360 246 C290 248 250 290 238 340 Z';
const LONG_FRONT = 'M230 384 C218 226 288 168 360 168 C432 168 502 226 490 384 C482 320 462 270 420 246 C396 236 372 236 360 252 C348 236 324 236 300 246 C258 270 238 320 230 384 Z';

function ring(cx: number, cy: number, rx: number, ry: number, fromDeg: number, toDeg: number, n: number) {
  const pts: { x: number; y: number }[] = [];
  for (let i = 0; i < n; i++) {
    const a = ((fromDeg + ((toDeg - fromDeg) * i) / (n - 1)) * Math.PI) / 180;
    pts.push({ x: cx + rx * Math.cos(a), y: cy + ry * Math.sin(a) });
  }
  return pts;
}

const curls = (pts: { x: number; y: number }[], r: number) => (c: string) => (
  <G>
    {pts.map((pt, i) => (
      <Circle key={i} cx={pt.x} cy={pt.y} r={r} fill={c} stroke={outline(c)} strokeWidth={4} />
    ))}
    {pts.map((pt, i) => (
      <Circle key={`f${i}`} cx={pt.x} cy={pt.y} r={r - 4} fill={c} />
    ))}
  </G>
);

const braid = (side: -1 | 1, c: string) => {
  const segs = Array.from({ length: 9 }, (_, i) => ({ x: CX + side * (112 + i * 1.6), y: 396 + i * 28 }));
  const seg = (s: { x: number; y: number }) => `M${s.x - 21} ${s.y} Q${s.x} ${s.y - 24} ${s.x + 21} ${s.y} Q${s.x} ${s.y + 24} ${s.x - 21} ${s.y} Z`;
  const bx = CX + side * 126;
  return (
    <G key={side}>
      {segs.map((s, i) => <Path key={`o${i}`} d={seg(s)} fill={outline(c)} stroke={outline(c)} strokeWidth={8} />)}
      {segs.map((s, i) => <Path key={`f${i}`} d={seg(s)} fill={c} />)}
      {segs.map((s, i) => (
        <Path key={`l${i}`} d={`M${s.x - 14} ${s.y + 4} Q${s.x} ${s.y - 8} ${s.x + 14} ${s.y + 4}`} stroke={outline(c)} strokeWidth={3} fill="none" opacity={0.6} />
      ))}
      <Line x1={bx} y1={640} x2={bx} y2={654} stroke="#B48C55" strokeWidth={14} strokeLinecap="round" />
      <Path d={`M${bx - 14} 656 Q${bx} 694 ${bx + 14} 656 Z`} fill={c} stroke={outline(c)} strokeWidth={4} />
    </G>
  );
};

const strand = (x1: number, y1: number, x2: number, y2: number, c: string, w: number, key: string | number) => (
  <G key={key}>
    <Line x1={x1} y1={y1} x2={x2} y2={y2} stroke={outline(c)} strokeWidth={w + 8} strokeLinecap="round" />
    <Line x1={x1} y1={y1} x2={x2} y2={y2} stroke={c} strokeWidth={w} strokeLinecap="round" />
  </G>
);

export const hair: Record<string, VectorArt> = {
  'shaved.front': ({ hair: c }) => (
    <Path d="M246 320 C244 236 294 202 360 202 C426 202 476 236 474 320 C460 284 430 262 360 258 C290 262 260 284 246 320 Z" fill={c} opacity={0.55} />
  ),

  'short.back': solid(SHORT_BACK),
  'short.front': solid(SHORT_FRONT, topShine),

  'sidepart.front': solid(
    'M234 352 C222 228 288 172 360 172 C432 172 498 228 486 352 C480 310 466 280 446 262 C400 262 330 250 292 290 C270 312 250 330 234 352 Z',
    (c) => (
      <G>
        <Path d="M394 182 Q406 214 422 250" stroke={outline(c)} strokeWidth={5} fill="none" strokeLinecap="round" />
        <Path d="M290 222 Q330 200 372 198" stroke={shine(c)} strokeWidth={9} fill="none" strokeLinecap="round" opacity={0.7} />
      </G>
    ),
  ),

  'curly.back': (ctx) => curls(ring(CX, 318, 138, 128, 150, 390, 14), 40)(ctx.hair),
  'curly.front': (ctx) => (
    <G>
      <Path d={SLICK_FRONT} fill={ctx.hair} />
      {curls([...ring(CX, 300, 124, 112, 190, 350, 9), ...[292, 334, 376, 418].map((x, i) => ({ x, y: 262 + (i % 2) * 6 }))], 30)(ctx.hair)}
    </G>
  ),

  'afro.back': (ctx) => (
    <G>
      {curls(ring(CX, 292, 168, 162, 0, 345, 24), 34)(ctx.hair)}
      <Circle cx={CX} cy={292} r={168} fill={ctx.hair} />
    </G>
  ),
  'afro.front': solid(
    'M234 334 C226 246 288 206 360 206 C432 206 494 246 486 334 C478 306 466 290 446 280 C430 296 404 284 392 270 C374 290 346 290 328 270 C314 284 290 296 274 280 C254 290 242 308 234 334 Z',
  ),

  'wavy.back': solid(
    'M226 300 C222 196 296 160 360 160 C424 160 498 196 494 300 C500 380 512 450 498 520 C486 540 470 520 462 540 C446 560 430 530 420 520 L300 520 C290 530 274 560 258 540 C250 520 234 540 222 520 C208 450 220 380 226 300 Z',
  ),
  'wavy.front': solid(
    'M232 356 C220 226 288 170 360 170 C432 170 500 226 488 356 C478 318 466 292 448 276 C430 296 400 300 384 276 C362 300 330 300 316 276 C296 296 270 300 256 290 C244 310 236 332 232 356 Z',
    topShine,
  ),

  'long.back': solid('M224 300 C220 196 296 160 360 160 C424 160 500 196 496 300 L512 664 C460 692 260 692 208 664 Z'),
  'long.front': solid(LONG_FRONT, (c) => (
    <Path d="M278 238 Q312 212 346 214" stroke={shine(c)} strokeWidth={8} fill="none" strokeLinecap="round" opacity={0.7} />
  )),
  'longwavy.back': solid(
    'M224 300 C220 196 296 160 360 160 C424 160 500 196 496 300 C506 400 524 480 510 560 C530 600 506 640 516 680 C470 700 430 680 400 690 L320 690 C290 680 250 700 204 680 C214 640 190 600 210 560 C196 480 214 400 224 300 Z',
  ),

  'braids.front': (ctx) => (
    <G>
      <Path d={LONG_FRONT} fill={ctx.hair} stroke={outline(ctx.hair)} strokeWidth={5} strokeLinejoin="round" />
      {braid(-1, ctx.hair)}
      {braid(1, ctx.hair)}
    </G>
  ),

  'slick.front': solid(SLICK_FRONT, (c) => (
    <G>
      <Path d="M300 222 Q330 206 360 204" stroke={shine(c)} strokeWidth={7} fill="none" strokeLinecap="round" opacity={0.7} />
      <Path d="M392 206 Q430 214 452 244" stroke={outline(c)} strokeWidth={3} fill="none" strokeLinecap="round" opacity={0.6} />
    </G>
  )),
  'bun.back': (ctx) => (
    <G>
      <Path d={SHORT_BACK} fill={ctx.hair} stroke={outline(ctx.hair)} strokeWidth={5} />
      <Circle cx={CX} cy={170} r={60} fill={ctx.hair} stroke={outline(ctx.hair)} strokeWidth={5} />
      <Path d={`M${CX - 40} 160 Q${CX} 140 ${CX + 40} 160`} stroke={shine(ctx.hair)} strokeWidth={6} fill="none" strokeLinecap="round" opacity={0.7} />
      <Path d={`M${CX - 46} 214 Q${CX} 232 ${CX + 46} 214`} stroke="#B48C55" strokeWidth={12} fill="none" strokeLinecap="round" />
    </G>
  ),
  'ponytail.back': (ctx) => (
    <G>
      <Path d={SHORT_BACK} fill={ctx.hair} stroke={outline(ctx.hair)} strokeWidth={5} />
      <Path d="M430 214 C526 226 548 380 506 528 C494 566 470 566 478 524 C500 404 476 300 418 258 Z" fill={ctx.hair} stroke={outline(ctx.hair)} strokeWidth={5} strokeLinejoin="round" />
      <Circle cx={440} cy={232} r={16} fill="#B48C55" stroke={shade('#B48C55', -0.4)} strokeWidth={4} />
    </G>
  ),

  'locs.back': (ctx) => (
    <G>
      <Path d={SHORT_BACK} fill={ctx.hair} />
      {Array.from({ length: 11 }, (_, i) => {
        const x = 232 + i * 25.6;
        const len = 610 - Math.abs(x - CX) * 0.5;
        return strand(x, 250, x + (x - CX) * 0.08, len, ctx.hair, 22, i);
      })}
    </G>
  ),
  'locs.front': (ctx) => (
    <G>
      <Path d={SLICK_FRONT} fill={ctx.hair} stroke={outline(ctx.hair)} strokeWidth={5} strokeLinejoin="round" />
      {strand(258, 300, 248, 470, ctx.hair, 20, 'l1')}
      {strand(282, 270, 276, 410, ctx.hair, 18, 'l2')}
      {strand(462, 300, 472, 470, ctx.hair, 20, 'r1')}
      {strand(438, 270, 444, 410, ctx.hair, 18, 'r2')}
    </G>
  ),
};
