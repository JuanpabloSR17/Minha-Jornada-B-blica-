/**
 * Geometria de referência do avatar — canvas lógico 1024×1536 (proporção 2:3).
 *
 * Proporção humana estilizada: ~5,6 cabeças (cabeça 238 u, altura total ~1300 u).
 * Todos os assets (vetoriais ou PNG/WebP) usam o MESMO canvas e os MESMOS pontos
 * de ancoragem abaixo. Ver docs/ARTE.md para a especificação de exportação.
 */
export const CANVAS = { width: 1024, height: 1536, cx: 512 } as const;

export const HEAD = { top: 148, chin: 390, cx: 512, halfW: 88 } as const;
export const FACE = { eyeY: 278, eyeDX: 37, browY: 252, noseY: 318, mouthY: 350 } as const;
export const GROUND_Y = 1450;

export type BodyGeometry = {
  label: string;
  shoulder: number;
  chest: number;
  waist: number;
  hip: number;
  neck: number;
  upperArm: number;
  forearm: number;
  thigh: number;
  calf: number;
  ankle: number;
};

/** Medidas são meias-larguras em unidades do canvas. */
export const BODY_GEOMETRY: Record<string, BodyGeometry> = {
  'body-a': { label: 'Esguio', shoulder: 122, chest: 104, waist: 84, hip: 104, neck: 29, upperArm: 25, forearm: 21, thigh: 46, calf: 35, ankle: 16 },
  'body-b': { label: 'Atlético', shoulder: 154, chest: 134, waist: 106, hip: 114, neck: 36, upperArm: 33, forearm: 27, thigh: 54, calf: 42, ankle: 20 },
  'body-c': { label: 'Robusto', shoulder: 150, chest: 146, waist: 136, hip: 156, neck: 38, upperArm: 36, forearm: 30, thigh: 66, calf: 47, ankle: 22 },
};

export const DEFAULT_BODY_GEOMETRY = BODY_GEOMETRY['body-b']!;

export function geometryFor(bodyId: string): BodyGeometry {
  return BODY_GEOMETRY[bodyId] ?? DEFAULT_BODY_GEOMETRY;
}

export type Pt = { x: number; y: number };
type Side = -1 | 1;
const CX = CANVAS.cx;

/** Pontos de ancoragem fixos por corpo (usados por roupas, mantos e itens). */
export function anchors(g: BodyGeometry, side: Side) {
  const elbowOff = Math.max(g.shoulder + 4, g.waist + g.upperArm + 10);
  const wristOff = Math.max(g.shoulder - 8, g.hip + g.forearm + 6);
  return {
    shoulder: { x: CX + side * (g.shoulder - 24), y: 476 },
    elbow: { x: CX + side * elbowOff, y: 690 },
    wrist: { x: CX + side * wristOff, y: 884 },
    hip: { x: CX + side * g.hip * 0.48, y: 792 },
    knee: { x: CX + side * (g.hip * 0.42 + 4), y: 1078 },
    ankle: { x: CX + side * (g.hip * 0.36 + 6), y: 1386 },
  };
}

export const TUNIC_TOP_Y = 470;

/** Meia-largura da túnica numa altura y (cintos e bordados usam para encaixar). */
export function tunicHalfWidthAt(g: BodyGeometry, y: number, hemY = 1130) {
  const top = g.chest + 10;
  const bottom = g.hip + 52;
  const t = Math.min(1, Math.max(0, (y - 580) / (hemY - 580)));
  return top + (bottom - top) * t;
}

// ---------------------------------------------------------------- utilidades de forma

const sub = (a: Pt, b: Pt): Pt => ({ x: a.x - b.x, y: a.y - b.y });
const add = (a: Pt, b: Pt): Pt => ({ x: a.x + b.x, y: a.y + b.y });
const mul = (a: Pt, k: number): Pt => ({ x: a.x * k, y: a.y * k });
const unit = (a: Pt): Pt => {
  const l = Math.hypot(a.x, a.y) || 1;
  return { x: a.x / l, y: a.y / l };
};
const perp = (a: Pt): Pt => ({ x: -a.y, y: a.x });
export const f = (n: number) => Math.round(n * 10) / 10;
export const P = (p: Pt) => `${f(p.x)} ${f(p.y)}`;
export const lerpPt = (a: Pt, b: Pt, t: number): Pt => ({ x: a.x + (b.x - a.x) * t, y: a.y + (b.y - a.y) * t });

/** Segmento de membro afunilado com pontas arredondadas e leve volume muscular. */
export function limbPath(a: Pt, b: Pt, wa: number, wb: number, bulge = 0.12) {
  const d = unit(sub(b, a));
  const n = perp(d);
  const a1 = add(a, mul(n, wa));
  const a2 = add(a, mul(n, -wa));
  const b1 = add(b, mul(n, wb));
  const b2 = add(b, mul(n, -wb));
  const mid = lerpPt(a, b, 0.4);
  const wm = (wa + wb) / 2;
  const c1 = add(mid, mul(n, wm * (1 + bulge)));
  const c2 = add(mid, mul(n, -wm * (1 + bulge)));
  const capB = add(b, mul(d, wb * 1.25));
  const capA = add(a, mul(d, -wa * 1.25));
  return `M${P(a1)} Q${P(c1)} ${P(b1)} Q${P(capB)} ${P(b2)} Q${P(c2)} ${P(a2)} Q${P(capA)} ${P(a1)} Z`;
}

/** Contorno de manga: do ombro até `end`, passando pelo cotovelo, com boca alargada. */
export function sleevePath(sh: Pt, el: Pt, end: Pt, wSh: number, wEl: number, wEnd: number) {
  const d1 = unit(sub(el, sh));
  const d2 = unit(sub(end, el));
  const n1 = perp(d1);
  const n2 = perp(d2);
  const nm = unit(add(n1, n2));
  const s1 = add(sh, mul(n1, wSh));
  const s2 = add(sh, mul(n1, -wSh));
  const e1 = add(el, mul(nm, wEl));
  const e2 = add(el, mul(nm, -wEl));
  const t1 = add(end, mul(n2, wEnd));
  const t2 = add(end, mul(n2, -wEnd));
  const cap = add(sh, mul(d1, -wSh * 1.35));
  const hem = add(end, mul(d2, 6));
  return `M${P(s1)} Q${P(lerpPt(s1, e1, 0.5))} ${P(e1)} L${P(t1)} Q${P(hem)} ${P(t2)} L${P(e2)} Q${P(lerpPt(s2, e2, 0.5))} ${P(s2)} Q${P(cap)} ${P(s1)} Z`;
}

/** Ponto numa curva quadrática (para bordados acompanharem barras curvas). */
export function quadPt(p0: Pt, c: Pt, p2: Pt, t: number): Pt {
  const u = 1 - t;
  return { x: u * u * p0.x + 2 * u * t * c.x + t * t * p2.x, y: u * u * p0.y + 2 * u * t * c.y + t * t * p2.y };
}

/** Faixa estreita afunilada (dobras de tecido e mechas de cabelo). */
export function sliver(a: Pt, b: Pt, w: number, bend = 0) {
  const d = unit(sub(b, a));
  const n = perp(d);
  const m = add(lerpPt(a, b, 0.5), mul(n, bend));
  return `M${P(a)} Q${P(add(m, mul(n, w)))} ${P(b)} Q${P(add(m, mul(n, -w)))} ${P(a)} Z`;
}

/** Recortes de enquadramento (viewBox). */
export const CROPS = {
  full: '0 0 1024 1536',
  portrait: '292 70 440 600',
  eyes: '432 214 160 160',
  mouth: '442 286 140 140',
  bust: '352 110 320 320',
  outfit: '232 400 560 1000',
  back: '172 400 680 1080',
  feet: '352 1300 320 180',
  hand: '520 600 400 520',
  head: '352 60 320 320',
} as const;
export type AvatarCrop = keyof typeof CROPS;
