import { COLLECTIONS, COSMETIC_ITEMS, RARITIES, RELICS, getItem, isEquippable } from '../domain/catalog';
import { listItems } from '../domain/wardrobe';
import { setEquipped, validateLook, defaultLook } from '../domain/avatar.rules';
import bible from '../../reading/bible-books.json';

const series = COSMETIC_ITEMS.filter((i) => i.series === 'rarities-v1');
const count = (r: string) => series.filter((i) => i.rarity === r).length;

describe('cinco raridades e catálogo de 144 itens', () => {
  it('tem as cinco raridades, em ordem, com nome e descrição', () => {
    expect(RARITIES.map((r) => r.name)).toEqual(['Comum', 'Raro', 'Épico', 'Lendário', 'Santo']);
    RARITIES.forEach((r) => expect(r.description.length).toBeGreaterThan(20));
  });

  it('22 comuns, 18 raros, 16 épicos, 66 lendários e 22 santos', () => {
    expect([count('common'), count('rare'), count('epic'), count('legendary'), count('holy')]).toEqual([22, 18, 16, 66, 22]);
    expect(series).toHaveLength(144);
  });

  it('todo item tem os campos obrigatórios', () => {
    for (const i of series) {
      expect(i.id).toMatch(/^[a-z0-9-]{3,64}$/);
      expect(i.name).toBeTruthy();
      expect(i.description).toBeTruthy();
      expect(i.category).toBeTruthy();
      expect(i.slot).toBeTruthy();
      expect(i.scriptureRef).toBeTruthy();
      expect(i.unlockLabel).toBeTruthy();
      expect(i.acquisition).toBeTruthy();
      expect(i.starter).toBe(false);
      expect(i.premium).toBe(false);
    }
  });

  it('IDs únicos e IDs das versões anteriores preservados', () => {
    const ids = COSMETIC_ITEMS.map((i) => i.id);
    expect(new Set(ids).size).toBe(ids.length);
    for (const id of ['tunic-joseph', 'cloak-elijah', 'cloak-succession', 'cloak-elijah-prophets', 'scroll-isaiah', 'crown-wisdom', 'frame-complete', 'bg-sinai', 'bg-bethlehem', 'sling-david', 'harp-psalmist', 'staff-moses', 'sandals-desert', 'tunic-linen', 'staff-shepherd']) {
      expect(getItem(id)).toBeDefined();
    }
  });

  it('um lendário por livro, conquistado ao concluir o próprio livro', () => {
    const legendary = series.filter((i) => i.rarity === 'legendary');
    const books = new Set(legendary.map((i) => i.book));
    expect(books.size).toBe(66);
    for (const b of bible as { code: string }[]) expect(books.has(b.code)).toBe(true);
    const raw = require('../catalog/catalog.json') as { items: { id: string; rarity?: string; book?: string; unlock?: { type: string; payload: { book?: string } } }[] };
    for (const it of raw.items.filter((i) => i.rarity === 'legendary')) {
      expect(it.unlock?.type).toBe('book_completed');
      expect(it.unlock?.payload.book).toBe(it.book);
    }
  });

  it('santos são relíquias do Santuário: não equipáveis e agrupadas nas obras', () => {
    expect(RELICS).toHaveLength(22);
    for (const r of RELICS) {
      expect(r.rarity).toBe('holy');
      expect(isEquippable(r)).toBe(false);
    }
    const works = COLLECTIONS.filter((c) => c.id.startsWith('works-'));
    expect(works.map((c) => c.name)).toEqual(['Obras do Pai', 'Obras de Jesus Cristo', 'Obras do Espírito Santo']);
    expect(new Set(works.flatMap((c) => c.items))).toEqual(new Set(RELICS.map((r) => r.id)));
  });

  it('pessoas divinas não são itens', () => {
    const forbidden = /^(deus|jesus|cristo|espírito santo|pai)$|pomba do espírito|corpo de cristo/i;
    for (const i of COSMETIC_ITEMS) expect(forbidden.test(i.name)).toBe(false);
  });

  it('raridade, slot e obtenção são independentes', () => {
    const outfitRarities = new Set(series.filter((i) => i.slot === 'outfit').map((i) => i.rarity));
    expect(outfitRarities.size).toBeGreaterThanOrEqual(3);
    const commonAcq = new Set(series.filter((i) => i.rarity === 'common').map((i) => i.acquisition));
    expect(commonAcq.has('reading') && commonAcq.has('mission')).toBe(true);
  });

  it('filtro por raridade no inventário', () => {
    const r = listItems('back', { owned: new Set(), equipment: {}, rarity: 'legendary' });
    expect(r.length).toBeGreaterThan(5);
    expect(r.every((v) => v.item.rarity === 'legendary')).toBe(true);
  });

  it('o cliente não deixa uma relíquia entrar no visual', () => {
    const eq = setEquipped(defaultLook().equipment, 'hands', 'relic-manna');
    expect(eq.hands).toBeUndefined();
    expect(validateLook({ ...defaultLook(), equipment: { ...defaultLook().equipment, hands: 'relic-manna' } }).length).toBeGreaterThan(0);
  });
});
