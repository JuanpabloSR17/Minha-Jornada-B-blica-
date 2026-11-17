import { G, Rect } from 'react-native-svg';
import type { Glyph, Wear } from './archetypes';
import { hairFamily } from './archetypes';
import { mix, shade } from './draw';
import type { StyleLook } from './StyledCharacter';

export const W = 32;
export const H = 40;
const CELL = 200 / W; // 6,25 (viewBox 200 × 250)
const OUTLINE = '#2A1A12';

/** Objetos em pixels: X = cor do item, D = escuro, L = claro, W = madeira, F = chama, . = vazio. */
const MASK: Partial<Record<Glyph, string[]>> = {
  harp: ['.XXXX.', 'X.LL.X', 'X.LL.X', 'X.LL.X', '.X..X.', '.XXXX.'],
  scroll: ['DLLLLD', 'XLDDLX', 'XLLLLX', 'XLDDLX', 'DLLLLD'],
  shield: ['XXXXX', 'XLLLX', 'XLDLX', 'XLLLX', '.XXX.', '..X..'],
  jar: ['.DD.', 'XXXX', 'XLXX', 'XXXX', '.XX.'],
  basket: ['.W..W.', 'WWWWWW', 'XDXDXX', '.XXXX.'],
  cup: ['XXXX', 'XLLX', '.XX.', '.XX.', 'XXXX'],
  horn: ['....XX', '...XX.', '..XX..', 'XXX...', 'XX....'],
  flute: ['XXXXXX', 'XDXDXD'],
  lamp: ['F.....', 'XXXXX.', '.XXXXX', '..XX..'],
  torch: ['.F.', 'FFF', '.W.', '.W.', '.W.', '.W.', '.W.'],
  plumb: ['.D.', '.D.', '.D.', 'XXX', '.X.'],
  sling: ['D...D', '.D.D.', '..X..'],
  mirror: ['.XXX.', 'XLLLX', 'XLLLX', '.XXX.', '..W..', '..W..'],
  tool: ['XXX.', '.W..', '.W..', '.W..'],
};

/** Grade 32 × 40 do personagem (com contorno); serve à pixel art e ao ponto-cruz. */
export function pixelCells(look: StyleLook, wear: Wear): (string | null)[][] {
  const grid: (string | null)[][] = Array.from({ length: H }, () => Array<string | null>(W).fill(null));
  const put = (x: number, y: number, c: string, shadeRight = 0) => {
    if (x < 0 || y < 0 || x >= W || y >= H) return;
    grid[y]![x] = shadeRight && x > shadeRight ? shade(c, -0.16) : c;
  };
  const rect = (x0: number, y0: number, x1: number, y1: number, c: string, sr = 0) => { for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) put(x, y, c, sr); };
  const inEll = (x: number, y: number, cx: number, cy: number, rx: number, ry: number) => ((x + 0.5 - cx) / rx) ** 2 + ((y + 0.5 - cy) / ry) ** 2 <= 1;
  const ell = (cx: number, cy: number, rx: number, ry: number, c: string, keep: (x: number, y: number) => boolean = () => true, sr = 0) => {
    for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) if (inEll(x, y, cx, cy, rx, ry) && keep(x, y)) put(x, y, c, sr);
  };

  const w = { 'body-a': 5, 'body-b': 6, 'body-c': 7 }[look.bodyId] ?? 6;
  const half = (y: number) => w + Math.floor((y - 19) / 4);
  const fam = hairFamily(look.hairStyle);
  const covered = wear.head?.kind === 'scarf' || wear.head?.kind === 'turban';
  const tunic = wear.tunic!;
  const brown = '#6E4A2A';

  // manto de trás e cabelo longo
  if (wear.cloak) for (let y = 19; y <= 35; y++) { const h = half(Math.min(y, 31)) + 2; rect(16 - h, y, 15 + h, y, shade(wear.cloak.color, -0.18)); }
  if (fam === 'long' && !covered && wear.cloak?.kind !== 'hood') rect(9, 8, 22, 21, shade(look.hair, -0.12));
  if (wear.cloak?.kind === 'hood') ell(15.5, 11, 9, 10, shade(wear.cloak.color, -0.1));
  // pernas e pés
  rect(13, 32, 14, 36, look.skin); rect(17, 32, 18, 36, look.skin, 17);
  rect(12, 37, 14, 37, brown); rect(17, 37, 19, 37, brown);
  // braço esquerdo
  rect(16 - w - 2, 20, 16 - w - 1, 27, tunic.color); rect(16 - w - 2, 28, 16 - w - 1, 28, look.skin);
  // túnica (listras na Túnica de José)
  for (let y = 19; y <= 31; y++) {
    const h = half(y);
    const c = tunic.stripes ? tunic.stripes[Math.floor((y - 19) / 2) % tunic.stripes.length]! : tunic.color;
    rect(16 - h, y, 15 + h, y, c, 17);
  }
  put(15, 19, tunic.trim); put(16, 19, tunic.trim); put(15, 20, tunic.trim); put(16, 20, tunic.trim);
  rect(16 - half(26), 26, 15 + half(26), 26, brown);
  if (wear.chest) { rect(13, 21, 18, 24, wear.chest.color); if (wear.chest.stones) for (let y = 21; y <= 24; y++) for (let x = 13; x <= 18; x += 2) put(x + (y % 2), y, ['#B03D4E', '#3D8F6A', '#3D6FB0'][(x + y) % 3]!); }
  // manto da frente (laterais) e broche
  if (wear.cloak && wear.cloak.kind !== 'shawl') for (let y = 19; y <= 34; y++) { const h = half(Math.min(y, 31)); rect(16 - h - 1, y, 16 - h + 1, y, wear.cloak.color); rect(15 + h - 1, y, 15 + h + 1, y, wear.cloak.color, 17); }
  if (wear.cloak?.kind === 'shawl') for (let y = 19; y <= 24; y++) { const h = half(19) + 1 - (y - 19); rect(16 - h - (24 - y) / 2, y, 15 + h + (24 - y) / 2, y, wear.cloak.color, 17); }
  if (wear.cloak && wear.cloak.kind !== 'shawl') { put(15, 19, '#E8B830'); put(16, 19, '#E8B830'); }
  if (wear.cloak?.kind === 'hair' || wear.cloak?.kind === 'fleece') for (let y = 21; y <= 33; y += 3) { put(16 - half(Math.min(y, 31)), y, shade(wear.cloak.color, -0.35)); put(15 + half(Math.min(y, 31)), y + 1, shade(wear.cloak.color, -0.35)); }
  // pescoço
  rect(15, 18, 16, 18, look.skin);
  if (wear.neck) for (let x = 13; x <= 18; x += 1) if (x % 2) put(x, 19, wear.neck.color);
  // braço direito erguido, segurando o objeto
  const hx = 16 + w + 2;
  put(16 + w, 20, tunic.color); put(16 + w + 1, 21, tunic.color); put(16 + w + 1, 22, tunic.color); put(hx, 22, look.skin); put(hx, 23, look.skin);
  // cabeça
  put(8, 11, look.skin); put(8, 12, look.skin); put(23, 11, look.skin); put(23, 12, shade(look.skin, -0.16));
  ell(15.5, 11.5, 7, 7.5, look.skin, () => true, 18);
  put(12, 12, '#24170F'); put(12, 13, '#24170F'); put(19, 12, '#24170F'); put(19, 13, '#24170F');
  put(15, 16, '#8E2E2E'); put(16, 16, '#8E2E2E');
  put(10, 14, mix(look.skin, '#E07A6A', 0.5)); put(21, 14, mix(look.skin, '#E07A6A', 0.5));
  // cabelo
  if (!covered && wear.cloak?.kind !== 'hood' && fam !== 'none') {
    ell(15.5, 9, 7.6, 6, look.hair, (_x, y) => y <= 8, 18);
    put(9, 9, look.hair); put(22, 9, look.hair);
    if (fam === 'curly') for (let x = 8; x <= 23; x += 2) put(x, 3, look.hair);
    if (fam === 'long') { rect(8, 9, 9, 20, look.hair); rect(22, 9, 23, 20, look.hair); }
  }
  // cobertura de cabeça
  const hw = wear.head;
  if (hw?.kind === 'turban') { ell(15.5, 7, 8.4, 5.2, hw.color, (_x, y) => y <= 9, 18); rect(8, 6, 23, 6, shade(hw.color, -0.2)); }
  if (hw?.kind === 'scarf') {
    ell(15.5, 11.5, 9, 10, hw.color, (x, y) => !inEll(x, y, 15.5, 12.5, 6, 6.6), 18);
    rect(6, 15, 8, 22, hw.color); rect(23, 15, 25, 22, shade(hw.color, -0.16));
  }
  if (hw?.kind === 'band') rect(8, 7, 23, 7, hw.color);
  if (hw?.kind === 'crown') { rect(9, 3, 22, 5, '#E8B830'); for (let x = 9; x <= 22; x += 3) put(x, 2, '#E8B830'); put(15, 4, '#B03D4E'); put(16, 4, '#B03D4E'); }
  if (hw?.kind?.startsWith('wreath')) {
    const leaf = hw.kind === 'wreath-flower' ? '#6B8A3A' : '#E8B830';
    [[8, 7], [9, 5], [11, 3], [14, 2], [17, 2], [20, 3], [22, 5], [23, 7]].forEach(([x, y]) => put(x!, y!, leaf));
    if (hw.kind === 'wreath-flower') { put(12, 2, '#F2EEE4'); put(19, 2, '#F2EEE4'); put(15, 1, '#F2EEE4'); }
  }
  // objeto na mão
  const g = wear.hand?.glyph;
  if (wear.hand && g) {
    const c = wear.hand.color;
    if (g === 'staff' || g === 'scepter') {
      const col = g === 'staff' ? '#8A5E34' : c;
      rect(hx + 1, g === 'staff' ? 6 : 12, hx + 1, g === 'staff' ? 37 : 30, col);
      if (g === 'staff') { put(hx + 2, 5, col); put(hx + 3, 5, col); put(hx + 4, 6, col); put(hx + 4, 7, col); }
      else rect(hx, 9, hx + 2, 11, c);
    } else {
      const m = MASK[g] ?? MASK.tool!;
      const top = 23 - Math.floor(m.length / 2);
      m.forEach((row, dy) => [...row].forEach((ch, dx) => {
        const col = ch === 'X' ? c : ch === 'D' ? shade(c, -0.4) : ch === 'L' ? '#EFE0BE' : ch === 'W' ? '#8A5E34' : ch === 'F' ? '#F2B23A' : null;
        if (col) put(hx + 1 + dx, top + dy, col);
      }));
    }
  }

  // contorno: vazio vizinho de pixel cheio
  const out: (string | null)[][] = grid.map((r) => [...r]);
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
    if (grid[y]![x]) continue;
    if ([[1, 0], [-1, 0], [0, 1], [0, -1]].some(([dx, dy]) => grid[y + dy!]?.[x + dx!])) out[y]![x] = OUTLINE;
  }

  return out;
}

/** Personagem em pixel art (32 × 40), corpo inteiro, com contorno e sombra por pixel. */
export function PixelCharacter({ look, wear }: { look: StyleLook; wear: Wear }) {
  const out = pixelCells(look, wear);
  // fundo em faixas, também em pixels
  const bg = (y: number) => (y >= 38 ? '#B98A52' : y >= 36 ? '#D9B47A' : y >= 26 ? '#F4D9A0' : y >= 14 ? '#BFD7E6' : '#8FB7D9');
  const rects: { x: number; y: number; w: number; c: string }[] = [];
  for (let y = 0; y < H; y++) {
    let x = 0;
    while (x < W) {
      const c = out[y]![x] ?? bg(y);
      let e = x;
      while (e + 1 < W && (out[y]![e + 1] ?? bg(y)) === c) e++;
      rects.push({ x, y, w: e - x + 1, c });
      x = e + 1;
    }
  }
  return (
    <G>
      {rects.map((r, i) => <Rect key={i} x={r.x * CELL} y={r.y * CELL} width={r.w * CELL + 0.3} height={CELL + 0.3} fill={r.c} />)}
    </G>
  );
}
