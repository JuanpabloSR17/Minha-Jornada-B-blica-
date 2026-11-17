import { getItem } from '../domain/catalog';

/**
 * Arquétipos de desenho: cada item do catálogo vira um tipo + uma cor, lidos do nome e da
 * categoria. Assim qualquer item vestível aparece em qualquer estilo de personagem, sem uma
 * pintura própria por item e por corpo.
 */
export type HeadKind = 'band' | 'turban' | 'scarf' | 'crown' | 'wreath-flower' | 'wreath-laurel';
export type CloakKind = 'open' | 'hood' | 'hair' | 'fleece' | 'shawl';
export type NeckKind = 'beads' | 'cord' | 'scarf' | 'ribbon';
export type Glyph = 'staff' | 'scepter' | 'scroll' | 'harp' | 'horn' | 'flute' | 'jar' | 'basket' | 'cup' | 'lamp' | 'torch' | 'shield' | 'plumb' | 'sling' | 'mirror' | 'tool';

export type Wear = {
  tunic: { color: string; trim: string; stripes?: string[] } | null;
  cloak: { kind: CloakKind; color: string } | null;
  head: { kind: HeadKind; color: string } | null;
  neck: { kind: NeckKind; color: string } | null;
  chest: { stones: boolean; color: string } | null;
  hand: { glyph: Glyph; color: string; name: string } | null;
};

const RARITY: Record<string, string> = { common: '#9C8667', rare: '#4C6FA8', epic: '#7B4FA8', legendary: '#C77A2A', holy: '#D8B24A' };
const has = (s: string, ...k: string[]) => k.some((x) => s.includes(x));

/** Cor pelo nome (cores citadas) e, sem pista, pela raridade. */
export function colorOf(name: string, rarity?: string | null): string {
  const n = name.toLowerCase();
  const table: [string[], string][] = [
    [['noturno', 'mardoqueu'], '#4B2A7B'], [['carmim', 'romã', 'cordão vermelho'], '#9E2335'], [['deserto', 'areia'], '#C9A46A'],
    [['lã', 'linho', 'faixa'], '#E6D6B2'], [['cru'], '#D6C49A'], [['pastor', 'trabalhador', 'bastão'], '#7A5A3A'], [['viagem'], '#6B5B4B'],
    [['profeta', 'elias', 'sucessão', 'perseverança'], '#5A4632'], [['rute', 'resgate'], '#B9774A'], [['oliveira'], '#6B7A3A'],
    [['terracota', 'barro', 'oleiro'], '#B5583A'], [['índigo', 'noite'], '#2E3A6E'], [['ocre', 'lenço'], '#C8922E'], [['céu', 'galileia'], '#6FA3C8'],
    [['pedra'], '#8A8580'], [['sacerdo', 'estola', 'cerimonial'], '#F2EEE4'], [['ester', 'reais'], '#3F5FA8'], [['ouro', 'coroa', 'cetro', 'glória'], '#D9A83A'],
    [['bronze', 'cálice', 'trombeta'], '#B07A3A'], [['promessa', 'chamado', 'caminho'], '#2F6E6A'], [['servo', 'boas obras'], '#8C6A4A'], [['compaixão'], '#B85C7A'],
  ];
  for (const [keys, hex] of table) if (has(n, ...keys)) return hex;
  return RARITY[rarity ?? 'common'] ?? RARITY.common!;
}

export function headKind(name: string): HeadKind {
  const n = name.toLowerCase();
  if (has(n, 'aliança davídica', 'coroa da aliança')) return 'crown';
  if (has(n, 'sabedoria')) return 'wreath-flower';
  if (has(n, 'coroa')) return 'wreath-laurel';
  if (has(n, 'turbante')) return 'turban';
  if (has(n, 'lenço', 'pano')) return 'scarf';
  return 'band';
}

export function cloakKind(name: string): CloakKind {
  const n = name.toLowerCase();
  if (has(n, 'profeta', 'elias', 'sucessão')) return 'hair';
  if (has(n, 'lã')) return 'fleece';
  if (has(n, 'viagem', 'deserto', 'caminho')) return 'hood';
  if (has(n, 'capa')) return 'shawl';
  return 'open';
}

export function glyphOf(name: string): Glyph {
  const n = name.toLowerCase();
  const table: [string[], Glyph][] = [
    [['cetro'], 'scepter'], [['cajado', 'vara', 'bastão'], 'staff'], [['harpa', 'cordas'], 'harp'], [['trombeta'], 'horn'], [['flauta'], 'flute'],
    [['escudo'], 'shield'], [['tocha'], 'torch'], [['lamparina', 'lâmpada', 'lanterna'], 'lamp'], [['cesto', 'cesta'], 'basket'], [['cálice'], 'cup'],
    [['jarro', 'pote', 'vaso', 'ampola'], 'jar'], [['prumo'], 'plumb'], [['funda'], 'sling'], [['espelho'], 'mirror'],
    [['pergaminho', 'rolo', 'livro', 'tábua'], 'scroll'],
  ];
  for (const [keys, g] of table) if (has(n, ...keys)) return g;
  return 'tool';
}

/** Lê o equipamento (IDs do catálogo) e devolve o que cada estilo precisa desenhar. */
export function wearFrom(equipment: Record<string, string | undefined | null>): Wear {
  const it = (slot: string) => getItem(equipment[slot] ?? undefined);
  const tunic = it('outfit');
  const cloak = it('back');
  const head = it('head');
  const neck = it('neck');
  const chest = it('chest');
  const hand = it('hands');
  return {
    tunic: tunic
      ? { color: colorOf(tunic.name, tunic.rarity), trim: '#3E8C8A', stripes: tunic.name.includes('José') ? ['#B5583A', '#C8922E', '#3F5FA8', '#6B7A3A', '#9E2335'] : undefined }
      : { color: '#E6D6B2', trim: '#3E8C8A' },
    cloak: cloak ? { kind: cloakKind(cloak.name), color: colorOf(cloak.name, cloak.rarity) } : null,
    head: head ? { kind: headKind(head.name), color: colorOf(head.name, head.rarity) } : null,
    neck: neck ? { kind: neck.name.toLowerCase().includes('contas') ? 'beads' : neck.name.toLowerCase().includes('lenço') ? 'scarf' : neck.name.toLowerCase().includes('laço') ? 'ribbon' : 'cord', color: colorOf(neck.name, neck.rarity) } : null,
    chest: chest ? { stones: /doze|sacerdote/i.test(chest.name), color: '#D9A83A' } : null,
    hand: hand ? { glyph: glyphOf(hand.name), color: colorOf(hand.name, hand.rarity), name: hand.name } : null,
  };
}

/** Cabelo em três famílias de silhueta. */
export function hairFamily(styleId: string): 'short' | 'curly' | 'long' | 'none' {
  if (styleId === 'hair-shaved') return 'none';
  if (/curly|afro|braids/.test(styleId)) return 'curly';
  if (/long|wavy/.test(styleId)) return 'long';
  return 'short';
}
