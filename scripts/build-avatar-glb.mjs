// Gera assets/models/viajante.glb: viajante adulto para a PROVA 3D (geometria + esqueleto + pesos de pele +
// materiais PBR + animação de repouso), exportado com o GLTFExporter do three.js.
//
// É um modelo procedural de integração (não a arte final): valida o caminho completo do app — GLB, palco,
// rotação, luz por tela, troca de peças e aparência com os dados da conta. O modelo final deve seguir
// docs/MODELO-3D.md, com os MESMOS nomes de ossos, malhas e materiais, e substituir este arquivo.
//
// Uso: node scripts/build-avatar-glb.mjs [saída.glb]
import { writeFileSync, mkdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import * as THREE from 'three';
import { GLTFExporter } from 'three/examples/jsm/exporters/GLTFExporter.js';
import { mergeGeometries, mergeVertices } from 'three/examples/jsm/utils/BufferGeometryUtils.js';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const OUT = process.argv[2] ?? join(root, 'assets/models/viajante.glb');

// ------------------------------------------------------------------ esqueleto (humanoide VRM), metros, +Z = frente
const J = {
  hips: [0, 0.98, 0], spine: [0, 1.09, 0], chest: [0, 1.26, 0], neck: [0, 1.47, 0], head: [0, 1.56, 0],
  leftShoulder: [0.04, 1.43, 0], leftUpperArm: [0.185, 1.42, 0], leftLowerArm: [0.225, 1.15, -0.01], leftHand: [0.245, 0.9, 0],
  leftUpperLeg: [0.095, 0.95, 0], leftLowerLeg: [0.1, 0.52, 0.005], leftFoot: [0.1, 0.085, -0.01],
};
for (const k of Object.keys(J)) if (k.startsWith('left')) J[`right${k.slice(4)}`] = [-J[k][0], J[k][1], J[k][2]];
const PARENT = {
  hips: null, spine: 'hips', chest: 'spine', neck: 'chest', head: 'neck',
  leftShoulder: 'chest', leftUpperArm: 'leftShoulder', leftLowerArm: 'leftUpperArm', leftHand: 'leftLowerArm',
  rightShoulder: 'chest', rightUpperArm: 'rightShoulder', rightLowerArm: 'rightUpperArm', rightHand: 'rightLowerArm',
  leftUpperLeg: 'hips', leftLowerLeg: 'leftUpperLeg', leftFoot: 'leftLowerLeg',
  rightUpperLeg: 'hips', rightLowerLeg: 'rightUpperLeg', rightFoot: 'rightLowerLeg',
};
const NAMES = Object.keys(PARENT);
const bones = {};
for (const n of NAMES) {
  const b = new THREE.Bone();
  b.name = n;
  bones[n] = b;
}
for (const n of NAMES) {
  const p = PARENT[n];
  const w = new THREE.Vector3(...J[n]);
  if (p) {
    bones[p].add(bones[n]);
    bones[n].position.copy(w.sub(new THREE.Vector3(...J[p])));
  } else bones[n].position.copy(w);
}
const IDX = Object.fromEntries(NAMES.map((n, i) => [n, i]));
const skeleton = new THREE.Skeleton(NAMES.map((n) => bones[n]));

// ------------------------------------------------------------------ geometria com pesos
const V = (x, y, z) => new THREE.Vector3(x, y, z);

/** Anel elíptico perpendicular à direção dir. arc limita o ângulo (de trás: 0 = -Z). */
function ring(center, dir, rx, rz, n, arc = null) {
  const up = Math.abs(dir.y) > 0.7 ? V(0, 0, 1) : V(0, 1, 0);
  const a = new THREE.Vector3().crossVectors(dir, up).normalize(); // ~x
  const b = new THREE.Vector3().crossVectors(a, dir).normalize(); // ~z
  // eixo vertical (para cima ou para baixo): ângulo 0 sempre na frente (+Z), para manto e cabelo ficarem atrás
  if (Math.abs(dir.y) > 0.7) { a.set(1, 0, 0); b.set(0, 0, 1); }
  const pts = [];
  const count = arc ? n + 1 : n;
  for (let i = 0; i < count; i++) {
    const t = arc ? arc[0] + ((arc[1] - arc[0]) * i) / n : (i / n) * Math.PI * 2;
    // ângulo 0 = frente (+Z), anti-horário visto de cima
    pts.push(center.clone().addScaledVector(a, Math.sin(t) * rx).addScaledVector(b, Math.cos(t) * rz));
  }
  return pts;
}

/**
 * Varredura por anéis: pontos de controle {p, rx, rz, w:{osso:peso}} interpolados (sub passos).
 * open = sem tampas; arc = manto/cabelo (só parte do anel).
 */
function sweep(ctrl, { n = 24, sub = 4, arc = null, capStart = false, capEnd = false } = {}) {
  const rings = [];
  const weights = [];
  for (let i = 0; i < ctrl.length - 1; i++) {
    const A = ctrl[i];
    const B = ctrl[i + 1];
    for (let s = 0; s < sub + (i === ctrl.length - 2 ? 1 : 0); s++) {
      const t = s / sub;
      const e = t * t * (3 - 2 * t);
      const p = A.p.clone().lerp(B.p, t);
      const dir = B.p.clone().sub(A.p).normalize();
      rings.push(ring(p, dir, A.rx + (B.rx - A.rx) * t, A.rz + (B.rz - A.rz) * t, n, arc));
      const w = {};
      for (const [k, v] of Object.entries(A.w)) w[k] = (w[k] ?? 0) + v * (1 - e);
      for (const [k, v] of Object.entries(B.w)) w[k] = (w[k] ?? 0) + v * e;
      weights.push(w);
    }
  }
  const per = rings[0].length;
  const pos = [];
  const sk = [];
  const sw = [];
  const index = [];
  const pushW = (w) => {
    const ent = Object.entries(w).filter(([, v]) => v > 1e-4).sort((x, y) => y[1] - x[1]).slice(0, 4);
    const tot = ent.reduce((s, [, v]) => s + v, 0);
    const ids = [0, 0, 0, 0];
    const ws = [0, 0, 0, 0];
    ent.forEach(([k, v], j) => { ids[j] = IDX[k]; ws[j] = v / tot; });
    sk.push(...ids);
    sw.push(...ws);
  };
  rings.forEach((r, ri) => r.forEach((p) => { pos.push(p.x, p.y, p.z); pushW(weights[ri]); }));
  const closed = !arc;
  for (let ri = 0; ri < rings.length - 1; ri++) {
    for (let j = 0; j < (closed ? per : per - 1); j++) {
      const a = ri * per + j;
      const b = ri * per + ((j + 1) % per);
      const c = (ri + 1) * per + j;
      const d = (ri + 1) * per + ((j + 1) % per);
      index.push(a, c, b, b, c, d);
    }
  }
  // orientação: triângulos com a normal para FORA do eixo (testa no primeiro anel e inverte se preciso)
  {
    const c0 = rings[0].reduce((acc, p) => acc.add(p), V(0, 0, 0)).multiplyScalar(1 / per);
    const P0 = (i) => V(pos[i * 3], pos[i * 3 + 1], pos[i * 3 + 2]);
    const [ia, ic, ib] = [index[0], index[1], index[2]];
    const n = P0(ic).sub(P0(ia)).cross(P0(ib).sub(P0(ia)));
    if (n.dot(P0(ia).sub(c0)) < 0) for (let k = 0; k < index.length; k += 3) [index[k + 1], index[k + 2]] = [index[k + 2], index[k + 1]];
  }
  const addCap = (ri, flip) => {
    const center = rings[ri].reduce((s, p) => s.add(p), V(0, 0, 0)).multiplyScalar(1 / per);
    const ci = pos.length / 3;
    pos.push(center.x, center.y, center.z);
    pushW(weights[ri]);
    const outward = ri === 0 ? rings[0][0].clone().sub(rings[1][0]) : rings[ri][0].clone().sub(rings[ri - 1][0]);
    for (let j = 0; j < per; j++) {
      const a = ri * per + j;
      const b = ri * per + ((j + 1) % per);
      const pa = V(pos[a * 3], pos[a * 3 + 1], pos[a * 3 + 2]);
      const pb = V(pos[b * 3], pos[b * 3 + 1], pos[b * 3 + 2]);
      const n = pa.clone().sub(center).cross(pb.clone().sub(center));
      if (n.dot(outward) >= 0) index.push(ci, a, b); else index.push(ci, b, a);
    }
    void flip;
  };
  if (capStart) addCap(0, false);
  if (capEnd) addCap(rings.length - 1, true);
  return geo(pos, index, sk, sw);
}

function geo(pos, index, sk, sw) {
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  g.setAttribute('skinIndex', new THREE.Uint16BufferAttribute(sk, 4));
  g.setAttribute('skinWeight', new THREE.Float32BufferAttribute(sw, 4));
  g.setIndex(index);
  return g;
}

/** Elipsoide rígido preso a um osso (com recorte opcional dos vértices por um filtro). */
function ellipsoid(c, r, bone, { ws = 24, hs = 16, keep = null, w = null } = {}) {
  const s = new THREE.SphereGeometry(1, ws, hs);
  s.scale(r[0], r[1], r[2]);
  s.translate(c[0], c[1], c[2]);
  let g = s;
  if (keep) {
    const p = s.attributes.position;
    const idx = s.index.array;
    const kept = [];
    for (let i = 0; i < idx.length; i += 3) {
      const ok = [idx[i], idx[i + 1], idx[i + 2]].every((v) => keep(p.getX(v), p.getY(v), p.getZ(v)));
      if (ok) kept.push(idx[i], idx[i + 1], idx[i + 2]);
    }
    g = s.clone();
    g.setIndex(kept);
  }
  const n = g.attributes.position.count;
  const sk = [];
  const sw = [];
  for (let i = 0; i < n; i++) {
    const wt = w ? w(g.attributes.position.getY(i)) : { [bone]: 1 };
    const ent = Object.entries(wt).slice(0, 4);
    const tot = ent.reduce((s2, [, v]) => s2 + v, 0);
    const ids = [0, 0, 0, 0];
    const vs = [0, 0, 0, 0];
    ent.forEach(([k, v], j) => { ids[j] = IDX[k]; vs[j] = v / tot; });
    sk.push(...ids);
    sw.push(...vs);
  }
  g.setAttribute('skinIndex', new THREE.Uint16BufferAttribute(sk, 4));
  g.setAttribute('skinWeight', new THREE.Float32BufferAttribute(sw, 4));
  g.deleteAttribute('uv');
  g.deleteAttribute('normal');
  return g;
}

const C = (x, y, z, rx, rz, w) => ({ p: V(x, y, z), rx, rz, w });
const side = (s, f) => [f(1, 'left'), f(-1, 'right')];

// ---- corpo
const torso = sweep([
  C(0, 0.86, 0, 0.13, 0.1, { hips: 1 }),
  C(0, 0.96, 0, 0.165, 0.11, { hips: 1 }),
  C(0, 1.08, 0.005, 0.15, 0.105, { spine: 0.7, hips: 0.3 }),
  C(0, 1.2, 0.01, 0.148, 0.11, { spine: 0.5, chest: 0.5 }),
  C(0, 1.3, 0.012, 0.172, 0.12, { chest: 1 }),
  C(0, 1.39, 0.005, 0.19, 0.115, { chest: 1 }),
  C(0, 1.445, 0, 0.12, 0.09, { chest: 0.8, neck: 0.2 }),
  C(0, 1.48, 0, 0.055, 0.055, { neck: 1 }),
  C(0, 1.57, 0.005, 0.052, 0.052, { neck: 0.4, head: 0.6 }),
], { n: 28, capStart: true });
const head = ellipsoid([0, 1.655, 0.012], [0.083, 0.112, 0.098], 'head', { ws: 32, hs: 24 });
// mandíbula: estreita a parte de baixo da cabeça
{
  const p = head.attributes.position;
  for (let i = 0; i < p.count; i++) {
    const y = p.getY(i);
    if (y < 1.64) { const k = 1 - Math.min(1, (1.64 - y) / 0.1) * 0.18; p.setX(i, p.getX(i) * k); }
  }
}
const nose = ellipsoid([0, 1.645, 0.103], [0.014, 0.026, 0.02], 'head', { ws: 12, hs: 8 });
const ears = side(1, (s) => ellipsoid([s * 0.083, 1.652, 0.0], [0.012, 0.028, 0.02], 'head', { ws: 10, hs: 8 }));
const arms = side(1, (s, L) => sweep([
  C(s * 0.16, 1.425, 0, 0.056, 0.056, { chest: 0.6, [`${L}UpperArm`]: 0.4 }),
  C(s * 0.19, 1.39, 0, 0.052, 0.05, { [`${L}UpperArm`]: 1 }),
  C(s * 0.225, 1.15, -0.01, 0.041, 0.041, { [`${L}UpperArm`]: 0.5, [`${L}LowerArm`]: 0.5 }),
  C(s * 0.235, 1.03, -0.005, 0.039, 0.037, { [`${L}LowerArm`]: 1 }),
  C(s * 0.245, 0.91, 0, 0.03, 0.026, { [`${L}LowerArm`]: 0.6, [`${L}Hand`]: 0.4 }),
], { n: 18, capEnd: false }));
const shoulders = side(1, (s, L) => ellipsoid([s * 0.17, 1.415, 0], [0.055, 0.05, 0.052], `${L}UpperArm`, { w: () => ({ chest: 0.5, [`${L}UpperArm`]: 0.5 }) }));
const hands = side(1, (s, L) => ellipsoid([s * 0.25, 0.85, 0.008], [0.026, 0.065, 0.045], `${L}Hand`, { ws: 16, hs: 12 }));
const thumbs = side(1, (s, L) => ellipsoid([s * 0.237, 0.865, 0.04], [0.012, 0.03, 0.014], `${L}Hand`, { ws: 10, hs: 8 }));
const legs = side(1, (s, L) => sweep([
  C(s * 0.095, 0.95, 0, 0.088, 0.09, { hips: 0.5, [`${L}UpperLeg`]: 0.5 }),
  C(s * 0.098, 0.8, 0.005, 0.078, 0.08, { [`${L}UpperLeg`]: 1 }),
  C(s * 0.1, 0.52, 0.01, 0.052, 0.055, { [`${L}UpperLeg`]: 0.5, [`${L}LowerLeg`]: 0.5 }),
  C(s * 0.1, 0.36, -0.005, 0.05, 0.055, { [`${L}LowerLeg`]: 1 }),
  C(s * 0.1, 0.1, -0.01, 0.032, 0.035, { [`${L}LowerLeg`]: 0.6, [`${L}Foot`]: 0.4 }),
], { n: 18 }));
const feet = side(1, (s, L) => ellipsoid([s * 0.1, 0.045, 0.045], [0.045, 0.042, 0.115], `${L}Foot`, { ws: 16, hs: 10 }));
// olhos, íris, sobrancelhas e boca (materiais próprios)
const eyes = side(1, (s) => ellipsoid([s * 0.031, 1.675, 0.083], [0.016, 0.011, 0.012], 'head', { ws: 14, hs: 10 }));
const irises = side(1, (s) => ellipsoid([s * 0.031, 1.675, 0.093], [0.0075, 0.0075, 0.004], 'head', { ws: 10, hs: 8 }));
const brows = side(1, (s) => ellipsoid([s * 0.033, 1.699, 0.088], [0.02, 0.004, 0.006], 'head', { ws: 10, hs: 6 }));
const lips = ellipsoid([0, 1.598, 0.093], [0.021, 0.0065, 0.008], 'head', { ws: 14, hs: 8 });
// sandálias (sola e tiras) como parte do corpo
const soles = side(1, (s, L) => ellipsoid([s * 0.1, 0.008, 0.045], [0.05, 0.009, 0.125], `${L}Foot`, { ws: 16, hs: 6 }));
const straps = side(1, (s, L) => sweep([
  C(s * 0.1, 0.07, 0.07, 0.047, 0.03, { [`${L}Foot`]: 1 }),
  C(s * 0.1, 0.075, 0.095, 0.045, 0.028, { [`${L}Foot`]: 1 }),
], { n: 16, sub: 1 }));

// ---- túnica de linho (corpo, mangas e barra) — 1,5–3 cm além da pele, mesmos pesos
const tunicBody = sweep([
  C(0, 1.475, 0, 0.072, 0.07, { neck: 0.3, chest: 0.7 }),
  C(0, 1.45, 0, 0.15, 0.11, { chest: 1 }),
  C(0, 1.4, 0.006, 0.212, 0.135, { chest: 1 }),
  C(0, 1.3, 0.014, 0.19, 0.142, { chest: 1 }),
  C(0, 1.18, 0.012, 0.172, 0.134, { chest: 0.5, spine: 0.5 }),
  C(0, 1.06, 0.008, 0.172, 0.13, { spine: 0.7, hips: 0.3 }),
  C(0, 0.95, 0.004, 0.198, 0.142, { hips: 1 }),
  C(0, 0.75, 0.008, 0.222, 0.168, { hips: 1 }),
  C(0, 0.5, 0.01, 0.245, 0.195, { hips: 0.8, leftUpperLeg: 0.1, rightUpperLeg: 0.1 }),
], { n: 32 });
const sleeves = side(1, (s, L) => sweep([
  C(s * 0.155, 1.44, 0, 0.074, 0.074, { chest: 0.6, [`${L}UpperArm`]: 0.4 }),
  C(s * 0.19, 1.39, 0, 0.072, 0.07, { [`${L}UpperArm`]: 1 }),
  C(s * 0.225, 1.15, -0.01, 0.062, 0.06, { [`${L}UpperArm`]: 0.5, [`${L}LowerArm`]: 0.5 }),
  C(s * 0.231, 1.06, -0.007, 0.064, 0.062, { [`${L}LowerArm`]: 1 }),
], { n: 18 }));
const hemBand = sweep([
  C(0, 0.56, 0.01, 0.2425, 0.1925, { hips: 0.85, leftUpperLeg: 0.075, rightUpperLeg: 0.075 }),
  C(0, 0.53, 0.01, 0.2445, 0.1945, { hips: 0.8, leftUpperLeg: 0.1, rightUpperLeg: 0.1 }),
], { n: 32, sub: 1 });
const belt = sweep([
  C(0, 1.08, 0.008, 0.178, 0.136, { spine: 0.7, hips: 0.3 }),
  C(0, 1.03, 0.008, 0.182, 0.138, { spine: 0.5, hips: 0.5 }),
], { n: 28, sub: 1 });

// ---- manto de lã (só costas e lados), aberto na frente
const CLOAK_ARC = [Math.PI * 0.42, Math.PI * 1.58];
const cloak = sweep([
  C(0, 1.5, -0.005, 0.085, 0.075, { neck: 0.4, chest: 0.6 }),
  C(0, 1.455, -0.01, 0.235, 0.165, { chest: 1 }),
  C(0, 1.3, -0.02, 0.272, 0.19, { chest: 0.9, spine: 0.1 }),
  C(0, 1.05, -0.03, 0.29, 0.21, { spine: 0.6, hips: 0.4 }),
  C(0, 0.7, -0.035, 0.31, 0.235, { hips: 1 }),
  C(0, 0.24, -0.04, 0.335, 0.262, { hips: 1 }),
], { n: 30, arc: CLOAK_ARC });
const brooch = ellipsoid([0.15, 1.42, 0.11], [0.022, 0.022, 0.01], 'chest', { ws: 14, hs: 10 });

// ---- cabelos (curto e longo ondulado), um pouco além da cabeça
const HC = [0, 1.655, 0.012];
const hairShort = ellipsoid(HC, [0.091, 0.121, 0.107], 'head', {
  ws: 32, hs: 24,
  keep: (x, y, z) => y > 1.665 + (z > 0.04 ? 0.03 : 0) || (z < 0.02 && y > 1.6),
});
const hairLongCap = ellipsoid(HC, [0.094, 0.124, 0.11], 'head', {
  ws: 32, hs: 24,
  keep: (x, y, z) => y > 1.66 + (z > 0.05 ? 0.03 : 0) || (z < 0.03 && y > 1.58),
});
const hairLongBack = sweep([
  C(0, 1.69, 0.0, 0.098, 0.105, { head: 1 }),
  C(0, 1.58, -0.01, 0.112, 0.112, { head: 1 }),
  C(0, 1.46, -0.03, 0.145, 0.11, { head: 0.3, neck: 0.3, chest: 0.4 }),
  C(0, 1.32, -0.06, 0.165, 0.1, { chest: 1 }),
], { n: 24, arc: [Math.PI * 0.55, Math.PI * 1.45] });

// ------------------------------------------------------------------ materiais (nomes são contrato)
const mat = (name, color, roughness, extra = {}) => {
  const m = new THREE.MeshStandardMaterial({ name, color, roughness, metalness: 0, ...extra });
  return m;
};
const M = {
  skin: mat('skin', 0xac764b, 0.62),
  eye_white: mat('eye_white', 0xf2ece2, 0.35),
  iris: mat('iris', 0x2a1a10, 0.3),
  brows: mat('brows', 0x2a1d14, 0.9),
  lips: mat('lips', 0x9a4a40, 0.55),
  leather: mat('leather', 0x6a4428, 0.8),
  linen: mat('linen', 0xd8c49e, 0.95),
  trim: mat('trim', 0x2f8c96, 0.7),
  wool: mat('wool', 0x3e2c63, 0.97, { side: THREE.DoubleSide }),
  gold: mat('gold', 0xc9a24a, 0.35, { metalness: 0.85 }),
  hair: mat('hair', 0x2a1d14, 0.75, { side: THREE.DoubleSide }),
  wood: mat('wood', 0x7a5230, 0.85),
};

function skinned(name, parts) {
  const geoms = parts.map(([g]) => mergeVertices(g, 1e-6));
  geoms.forEach((g) => g.computeVertexNormals());
  const merged = mergeGeometries(geoms, true);
  const mats = parts.map(([, m]) => m);
  const mesh = new THREE.SkinnedMesh(merged, mats.length === 1 ? mats[0] : mats);
  mesh.name = name;
  return mesh;
}

const meshes = [
  skinned('body', [[torso, M.skin], [head, M.skin], [nose, M.skin], ...ears.map((g) => [g, M.skin]), ...arms.map((g) => [g, M.skin]),
    ...shoulders.map((g) => [g, M.skin]), ...hands.map((g) => [g, M.skin]), ...thumbs.map((g) => [g, M.skin]),
    ...legs.map((g) => [g, M.skin]), ...feet.map((g) => [g, M.skin]),
    ...eyes.map((g) => [g, M.eye_white]), ...irises.map((g) => [g, M.iris]), ...brows.map((g) => [g, M.brows]), [lips, M.lips],
    ...soles.map((g) => [g, M.leather]), ...straps.map((g) => [g, M.leather])]),
  skinned('outfit_tunic', [[tunicBody, M.linen], ...sleeves.map((g) => [g, M.linen]), [hemBand, M.trim], [belt, M.leather]]),
  skinned('cloak', [[cloak, M.wool], [brooch, M.gold]]),
  skinned('hair_short', [[hairShort, M.hair]]),
  skinned('hair_long', [[hairLongCap, M.hair], [hairLongBack, M.hair]]),
];

// ------------------------------------------------------------------ animação de repouso
const q = (x, y, z) => new THREE.Quaternion().setFromEuler(new THREE.Euler(x, y, z, 'XYZ'));
const restQ = Object.fromEntries(NAMES.map((n) => [n, bones[n].quaternion.clone()]));
const T = [0, 1.6, 3.2, 4.8];
function track(bone, frames) {
  const values = frames.flatMap((e) => q(...e).premultiply(restQ[bone]).toArray());
  return new THREE.QuaternionKeyframeTrack(`${bone}.quaternion`, T, values);
}
const breath = [[0, 0, 0], [-0.025, 0, 0.004], [-0.008, 0, -0.004], [0, 0, 0]];
const STAFF_ARM = {
  rightUpperArm: [-0.62, 0.0, -0.12],
  rightLowerArm: [-1.25, 0.18, 0.0],
  rightHand: [0.25, 0.0, 0.0],
};
function idle(withStaff) {
  const tr = [
    track('spine', [[0, 0, 0], [0.01, 0, 0.008], [0.004, 0, -0.008], [0, 0, 0]]),
    track('chest', breath),
    track('neck', [[0, 0, 0], [0.01, 0.02, 0], [0, -0.015, 0], [0, 0, 0]]),
    track('head', [[0, 0, 0], [0.015, 0.035, 0], [-0.005, -0.03, 0.01], [0, 0, 0]]),
    track('leftUpperArm', [[0, 0, 0.04], [0.02, 0, 0.055], [-0.01, 0, 0.045], [0, 0, 0.04]]),
    track('leftLowerArm', [[-0.05, 0, 0], [-0.08, 0, 0], [-0.06, 0, 0], [-0.05, 0, 0]]),
    new THREE.VectorKeyframeTrack('chest.scale', T, [1, 1, 1, 1.012, 1.008, 1.016, 1.004, 1.003, 1.006, 1, 1, 1]),
  ];
  if (withStaff) {
    const a = STAFF_ARM;
    tr.push(track('rightUpperArm', [a.rightUpperArm, [a.rightUpperArm[0] - 0.02, 0, a.rightUpperArm[2]], [a.rightUpperArm[0] + 0.01, 0, a.rightUpperArm[2]], a.rightUpperArm]));
    tr.push(track('rightLowerArm', [a.rightLowerArm, a.rightLowerArm, a.rightLowerArm, a.rightLowerArm]));
    tr.push(track('rightHand', [a.rightHand, a.rightHand, a.rightHand, a.rightHand]));
  } else {
    tr.push(track('rightUpperArm', [[0, 0, -0.04], [0.02, 0, -0.055], [-0.01, 0, -0.045], [0, 0, -0.04]]));
    tr.push(track('rightLowerArm', [[-0.05, 0, 0], [-0.08, 0, 0], [-0.06, 0, 0], [-0.05, 0, 0]]));
  }
  return new THREE.AnimationClip(withStaff ? 'idle_staff' : 'idle', 4.8, tr);
}
const clips = [idle(false), idle(true)];

// ------------------------------------------------------------------ cajado preso à mão direita (vertical na pose do cajado)
for (const [n, e] of Object.entries(STAFF_ARM)) bones[n].quaternion.copy(q(...e).premultiply(restQ[n]));
bones.hips.updateMatrixWorld(true);
const hand = bones.rightHand;
const grip = new THREE.Vector3(0, -0.055, 0.012).applyMatrix4(hand.matrixWorld);
const staffLen = 1.86;
const staffGeo = new THREE.CylinderGeometry(0.0155, 0.018, staffLen, 14);
staffGeo.translate(0, staffLen / 2 - grip.y, 0); // base no chão
const crook = new THREE.TorusGeometry(0.075, 0.0155, 10, 24, Math.PI * 1.25);
crook.rotateZ(-Math.PI * 0.08);
crook.translate(0.075, staffLen - grip.y, 0);
const knots = [0.35, 0.8, 1.2].map((h) => {
  const k = new THREE.SphereGeometry(0.021, 10, 8);
  k.scale(1, 0.6, 1);
  k.translate(0, h - grip.y, 0);
  return k;
});
const staff = new THREE.Mesh(mergeGeometries([staffGeo, crook, ...knots].map((g) => { g.deleteAttribute('uv'); return g; })), M.wood);
staff.name = 'staff';
// transforma do mundo (vertical, passando pela mão) para o espaço local do osso da mão
const local = new THREE.Matrix4().copy(hand.matrixWorld).invert().multiply(new THREE.Matrix4().makeTranslation(grip.x, grip.y, grip.z));
local.decompose(staff.position, staff.quaternion, staff.scale);
hand.add(staff);
// volta ao repouso para o bind das malhas
for (const n of NAMES) bones[n].quaternion.copy(restQ[n]);
bones.hips.updateMatrixWorld(true);

// ------------------------------------------------------------------ cena e exportação
const rig = new THREE.Group();
rig.name = 'viajante';
rig.add(bones.hips);
for (const m of meshes) {
  rig.add(m);
  m.bind(skeleton);
}
rig.updateMatrixWorld(true);
const scene = new THREE.Scene();
scene.add(rig);

// FileReader mínimo para o GLTFExporter no Node
globalThis.FileReader ??= class {
  readAsArrayBuffer(blob) { blob.arrayBuffer().then((b) => { this.result = b; this.onloadend?.(); }); }
  readAsDataURL(blob) { blob.arrayBuffer().then((b) => { this.result = `data:${blob.type};base64,${Buffer.from(b).toString('base64')}`; this.onloadend?.(); }); }
};

const glb = await new GLTFExporter().parseAsync(scene, { binary: true, animations: clips, onlyVisible: false });
mkdirSync(dirname(OUT), { recursive: true });
writeFileSync(OUT, Buffer.from(glb));
const verts = meshes.reduce((s, m) => s + m.geometry.attributes.position.count, 0) + staff.geometry.attributes.position.count;
console.log(`✔ ${OUT} — ${(glb.byteLength / 1024).toFixed(0)} KB, ${NAMES.length} ossos, ${meshes.length + 1} malhas, ${verts} vértices, clipes: ${clips.map((c) => c.name).join(', ')}`);
