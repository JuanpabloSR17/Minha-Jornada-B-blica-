/**
 * Geometria do canvas lógico do avatar (720×1080). Todas as peças usam a mesma
 * âncora (centro X = 360) e escala, variando apenas medidas por modelo de corpo.
 */
export const CANVAS = { width: 720, height: 1080, cx: 360 } as const;

export const HEAD = { cx: 360, cy: 330, rx: 118, ry: 128 } as const;
export const EYE_Y = 352;
export const EYE_DX = 46;
export const MOUTH_Y = 408;

export type BodyGeometry = {
  /** meia-largura dos ombros */
  shoulder: number;
  waist: number;
  hip: number;
  /** raio do braço */
  arm: number;
  /** raio da perna */
  leg: number;
  neck: number;
};

export const BODY_GEOMETRY: Record<string, BodyGeometry> = {
  'body-a': { shoulder: 88, waist: 70, hip: 78, arm: 27, leg: 30, neck: 28 },
  'body-b': { shoulder: 102, waist: 84, hip: 90, arm: 31, leg: 34, neck: 32 },
  'body-c': { shoulder: 118, waist: 108, hip: 114, arm: 37, leg: 40, neck: 37 },
};

export const DEFAULT_BODY_GEOMETRY = BODY_GEOMETRY['body-b']!;

export function geometryFor(bodyId: string): BodyGeometry {
  return BODY_GEOMETRY[bodyId] ?? DEFAULT_BODY_GEOMETRY;
}

const TUNIC_TOP_Y = 540;
export const TUNIC_HEM_Y = 880;

export function shoulderJoint(g: BodyGeometry, side: -1 | 1) {
  return { x: CANVAS.cx + side * (g.shoulder - 12), y: 545 };
}
export function handPoint(g: BodyGeometry, side: -1 | 1) {
  return { x: CANVAS.cx + side * (g.shoulder + 30), y: 765 };
}
export function hemHalfWidth(g: BodyGeometry) {
  return Math.max(g.hip, g.shoulder) + 34;
}
/** meia-largura da túnica numa altura y (usada por cintos para encaixar). */
export function tunicHalfWidthAt(g: BodyGeometry, y: number) {
  const top = g.shoulder + 8;
  const t = Math.min(1, Math.max(0, (y - TUNIC_TOP_Y) / (TUNIC_HEM_Y - TUNIC_TOP_Y)));
  return top + (hemHalfWidth(g) - top) * t;
}
export function footCenter(g: BodyGeometry, side: -1 | 1) {
  return { x: CANVAS.cx + side * (g.hip * 0.45 + 8), y: 962 };
}

/** Recortes de enquadramento (viewBox) para miniaturas. */
export const CROPS = {
  full: '0 0 720 1080',
  bust: '150 110 420 420',
  lower: '140 600 440 440',
} as const;
export type AvatarCrop = keyof typeof CROPS;
