import { Circle, Defs, G, Path } from 'react-native-svg';
import { lineOf, mix, shade } from '../color';
import { f } from '../geometry';
import { VerticalGradient, url } from '../paint';
import type { ArtContext, VectorArt } from '../types';

const MIRROR = 'translate(1024 0) scale(-1 1)';

function grad(ctx: ArtContext, key: string) {
  const id = `${ctx.uid}-hair-${key}`;
  return {
    id,
    def: <VerticalGradient id={id} top={shade(ctx.hair, 0.14)} bottom={shade(ctx.hair, -0.22)} />,
  };
}

/** Pseudo-aleatório determinístico: a mesma arte sempre sai igual. */
function rand(seed: number) {
  let s = seed;
  return () => ((s = (s * 16807) % 2147483647) / 2147483647);
}

/** Brilho visível mesmo em cabelos muito escuros. */
const shineOf = (c: string) => mix(shade(c, 0.28), '#C9A988', 0.28);

const strands = (ctx: ArtContext, paths: string[], tone: 'dark' | 'light', width = 2) => (
  <G>
    {paths.map((d, i) => (
      <Path
        key={i}
        d={d}
        stroke={tone === 'dark' ? shade(ctx.hair, -0.38) : shineOf(ctx.hair)}
        strokeWidth={width}
        fill="none"
        strokeLinecap="round"
        opacity={tone === 'dark' ? 0.7 : 0.55}
      />
    ))}
  </G>
);

// ------------------------------------------------------------- cacheado volumoso
type Blob = { x: number; y: number; r: number };

function cloud(cx: number, cy: number, rx: number, ry: number, from: number, to: number, n: number, r: number, seed: number): Blob[] {
  const rnd = rand(seed);
  return Array.from({ length: n }, (_, i) => {
    const a = ((from + ((to - from) * i) / (n - 1)) * Math.PI) / 180;
    return { x: cx + rx * Math.cos(a) + (rnd() - 0.5) * 10, y: cy + ry * Math.sin(a) + (rnd() - 0.5) * 10, r: r * (0.82 + rnd() * 0.36) };
  });
}

/** Cachos: contorno só na borda da massa; interior com muitos cachos pequenos e brilho. */
function curlMass(ctx: ArtContext, edge: Blob[], fillId: string, core?: string, inner: Blob[] = []) {
  const line = lineOf(ctx.hair);
  const rnd = rand(edge.length * 31 + inner.length);
  const tones = [ctx.hair, shade(ctx.hair, 0.1), shade(ctx.hair, -0.12), mix(ctx.hair, '#6B4A36', 0.18)];
  const all = [...edge, ...inner];
  return (
    <G>
      {edge.map((b, i) => <Circle key={`o${i}`} cx={f(b.x)} cy={f(b.y)} r={f(b.r + 2)} fill={line} />)}
      {core ? <Path d={core} fill={line} stroke={line} strokeWidth={4} /> : null}
      {core ? <Path d={core} fill={`url(#${fillId})`} /> : null}
      {all.map((b, i) => <Circle key={`f${i}`} cx={f(b.x)} cy={f(b.y)} r={f(b.r)} fill={i % 4 === 0 ? `url(#${fillId})` : tones[i % 4]} />)}
      {all.map((b, i) => {
        const rr = b.r * 0.7;
        const rot = Math.round(rnd() * 360);
        // espiral do cacho: anel escuro aberto + brilho curto
        return (
          <G key={`c${i}`} transform={`rotate(${rot} ${f(b.x)} ${f(b.y)})`}>
            <Path d={`M${f(b.x - rr)} ${f(b.y)} a${f(rr)} ${f(rr)} 0 1 1 ${f(rr * 1.4)} ${f(rr * 0.7)}`} stroke={shade(ctx.hair, -0.5)} strokeWidth={1.8} fill="none" strokeLinecap="round" opacity={0.75} />
            <Path d={`M${f(b.x - rr * 0.5)} ${f(b.y - rr * 0.55)} q${f(rr * 0.5)} ${f(-rr * 0.35)} ${f(rr)} 0`} stroke={shineOf(ctx.hair)} strokeWidth={2.2} fill="none" strokeLinecap="round" opacity={0.8} />
          </G>
        );
      })}
    </G>
  );
}

/** Cachos espalhados dentro de uma elipse (amostragem determinística). */
function scatter(cx: number, cy: number, rx: number, ry: number, n: number, r: number, seed: number, minY = -1e9, maxY = 1e9): Blob[] {
  const rnd = rand(seed);
  const out: Blob[] = [];
  let guard = 0;
  while (out.length < n && guard++ < n * 20) {
    const x = cx + (rnd() * 2 - 1) * rx;
    const y = cy + (rnd() * 2 - 1) * ry;
    if (((x - cx) / rx) ** 2 + ((y - cy) / ry) ** 2 > 1 || y < minY || y > maxY) continue;
    out.push({ x, y, r: r * (0.75 + rnd() * 0.5) });
  }
  return out;
}

const CURLY_BACK = [...cloud(512, 246, 140, 142, 0, 350, 40, 24, 7), ...cloud(512, 300, 122, 112, 20, 160, 12, 24, 11)];
const CURLY_BACK_INNER = scatter(512, 250, 124, 126, 60, 17, 19);
const CURLY_BACK_CORE = 'M384 246 C384 150 448 108 512 108 C576 108 640 150 640 246 C646 320 636 372 616 404 Q512 444 408 404 C388 372 378 320 384 246 Z';
const CURLY_FRONT = [
  ...cloud(512, 214, 98, 66, 186, 354, 16, 16, 3),
  { x: 428, y: 244, r: 15 },
  { x: 596, y: 244, r: 15 },
];
const CURLY_FRONT_INNER = scatter(512, 186, 84, 40, 22, 14, 23, -1e9, 214);

// ------------------------------------------------------------- formas por estilo
const SHORT_BACK = 'M418 270 C410 180 456 124 512 122 C568 124 614 180 606 270 L600 304 C592 262 584 238 572 230 L452 230 C440 238 432 262 424 304 Z';
const SHORT_FRONT =
  'M420 266 C412 184 452 128 512 126 C574 128 614 184 604 266 C598 240 592 220 580 206 C572 212 562 214 554 204 C546 216 532 216 522 206 C512 218 494 216 486 204 C476 214 462 214 454 206 C442 216 430 236 420 266 Z';
const SHORT_TUFTS = [
  'M440 196 C456 168 484 150 512 146',
  'M470 160 C498 140 538 140 562 156',
  'M548 150 C574 160 594 184 598 214',
  'M486 202 C494 184 506 172 520 166',
  'M530 204 C540 186 556 178 572 180',
];
const SHORT_SHINE = ['M468 172 C490 156 520 150 546 156', 'M560 176 C576 188 586 204 590 222'];

const LONG_BACK =
  'M416 262 C402 168 452 114 512 112 C572 114 622 168 608 262 C616 340 634 404 622 474 C642 526 618 586 636 648 C596 676 566 656 544 672 L480 672 C458 656 428 676 388 648 C406 586 382 526 402 474 C390 404 408 340 416 262 Z';
const LONG_LOCK =
  'M512 136 C468 136 428 166 420 228 C412 294 420 352 404 424 C396 466 410 506 396 552 C424 532 440 490 442 446 C448 384 446 322 456 272 C466 222 488 186 512 172 Z';
const LONG_STRANDS = [
  'M500 150 C470 170 446 220 440 300 C436 360 432 420 420 480',
  'M488 172 C466 210 456 270 452 340',
  'M412 300 C404 380 396 460 410 540',
  'M612 300 C620 380 628 460 614 540',
];

export const hair: Record<string, VectorArt> = {
  'curly.back': (ctx) => {
    const g = grad(ctx, 'cb');
    return (
      <G>
        <Defs>{g.def}</Defs>
        {curlMass(ctx, CURLY_BACK, g.id, CURLY_BACK_CORE, CURLY_BACK_INNER)}
      </G>
    );
  },
  'curly.front': (ctx) => {
    const g = grad(ctx, 'cf');
    return (
      <G>
        <Defs>{g.def}</Defs>
        {curlMass(ctx, CURLY_FRONT, g.id, undefined, CURLY_FRONT_INNER)}
        {/* cachos soltos nas têmporas */}
        <Path d="M428 252 C418 276 426 300 416 322 C412 334 420 344 428 338" stroke={lineOf(ctx.hair)} strokeWidth={7} fill="none" strokeLinecap="round" />
        <Path d="M428 252 C418 276 426 300 416 322 C412 334 420 344 428 338" stroke={ctx.hair} strokeWidth={4} fill="none" strokeLinecap="round" />
        <G transform={MIRROR}>
          <Path d="M428 252 C420 280 430 300 420 318" stroke={lineOf(ctx.hair)} strokeWidth={7} fill="none" strokeLinecap="round" />
          <Path d="M428 252 C420 280 430 300 420 318" stroke={ctx.hair} strokeWidth={4} fill="none" strokeLinecap="round" />
        </G>
      </G>
    );
  },

  'short.back': (ctx) => <Path d={SHORT_BACK} fill={shade(ctx.hair, -0.12)} stroke={lineOf(ctx.hair)} strokeWidth={3} />,
  'short.front': (ctx) => {
    const g = grad(ctx, 'sf');
    return (
      <G>
        <Defs>{g.def}</Defs>
        <Path d={SHORT_FRONT} fill={url(g.id)} stroke={lineOf(ctx.hair)} strokeWidth={3} strokeLinejoin="round" />
        {/* laterais mais curtas (degradê) */}
        <Path d="M422 252 L424 300 C428 286 432 268 440 258 Z" fill={ctx.hair} opacity={0.55} />
        <Path d="M602 252 L600 300 C596 286 592 268 584 258 Z" fill={ctx.hair} opacity={0.55} />
        {strands(ctx, SHORT_TUFTS, 'dark', 2.2)}
        {strands(ctx, SHORT_SHINE, 'light', 4)}
      </G>
    );
  },

  'longwavy.back': (ctx) => {
    const g = grad(ctx, 'lb');
    const waves = [440, 476, 512, 548, 584].map((x, i) => `M${x} 300 C${x + (i % 2 ? 10 : -10)} 400 ${x + (i % 2 ? -12 : 12)} 520 ${x + (i % 2 ? 6 : -6)} 650`);
    return (
      <G>
        <Defs>{g.def}</Defs>
        <Path d={LONG_BACK} fill={url(g.id)} stroke={lineOf(ctx.hair)} strokeWidth={3} strokeLinejoin="round" />
        {strands(ctx, waves, 'dark', 2.2)}
      </G>
    );
  },
  'longwavy.front': (ctx) => {
    const g = grad(ctx, 'lf');
    const lock = (
      <G>
        <Path d={LONG_LOCK} fill={url(g.id)} stroke={lineOf(ctx.hair)} strokeWidth={3} strokeLinejoin="round" />
        {strands(ctx, LONG_STRANDS.slice(0, 2), 'dark', 2)}
        <Path d="M498 156 C478 172 462 200 454 236" stroke={shade(ctx.hair, 0.3)} strokeWidth={5} fill="none" strokeLinecap="round" opacity={0.55} />
      </G>
    );
    return (
      <G>
        <Defs>{g.def}</Defs>
        <G>{lock}</G>
        <G transform={MIRROR}>{lock}</G>
        <Path d="M512 140 L512 178" stroke={shade(ctx.hair, -0.4)} strokeWidth={2.4} strokeLinecap="round" />
      </G>
    );
  },
};
