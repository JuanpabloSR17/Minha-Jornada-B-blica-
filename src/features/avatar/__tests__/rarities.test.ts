import { COLLECTIONS, COSMETIC_ITEMS, HOLY_ITEMS, ID_ALIASES, RARITIES, RELICS, getItem, isEquippable, resolveEquipmentIds, resolveItemId } from '../domain/catalog';
import { itemView, listItems } from '../domain/wardrobe';
import { resolveLayers } from '../domain/avatar.layering';
import { setEquipped, validateLook, defaultLook, sanitizeEquipment } from '../domain/avatar.rules';
import bible from '../../reading/bible-books.json';

const official = COSMETIC_ITEMS.filter((i) => i.series === 'oficial-v2');
const count = (r: string) => official.filter((i) => i.rarity === r).length;
const raw = require('../catalog/catalog.json') as {
  items: { id: string; officialId?: string; rarity?: string; book?: string; unlock?: { type: string; payload: Record<string, unknown> } }[];
};

describe('catálogo oficial: cinco raridades e 144 itens', () => {
  it('tem as cinco raridades, em ordem, com nome e descrição', () => {
    expect(RARITIES.map((r) => r.name)).toEqual(['Comum', 'Raro', 'Épico', 'Lendário', 'Santo']);
    RARITIES.forEach((r) => expect(r.description.length).toBeGreaterThan(20));
  });

  it('22 comuns, 18 raros, 16 épicos, 66 lendários e 22 santos', () => {
    expect([count('common'), count('rare'), count('epic'), count('legendary'), count('holy')]).toEqual([22, 18, 16, 66, 22]);
    expect(official).toHaveLength(144);
  });

  it('todos os 144 IDs oficiais chegam a um item (pelo próprio ID ou por alias)', () => {
    const file = require('../../../../docs/catalogo-oficial/catalogo_raridades_144_itens_v2.json') as { items?: { id: string }[]; itens?: { id: string }[] };
    const ids = (file.items ?? file.itens)!.map((i) => i.id);
    expect(ids).toHaveLength(144);
    for (const id of ids) {
      const item = getItem(id);
      expect(item).toBeDefined();
      expect(item!.series).toBe('oficial-v2');
    }
  });

  it('todo item oficial tem os campos obrigatórios', () => {
    for (const i of official) {
      expect(i.id).toMatch(/^[a-z0-9_-]{3,64}$/);
      expect(i.name).toBeTruthy();
      expect(i.description).toBeTruthy();
      expect(i.slot).toBeTruthy();
      expect(i.scriptureRef).toBeTruthy();
      expect(i.acquisition).toBeTruthy();
      expect(i.representation).toBeTruthy();
      expect(i.premium).toBe(false);
      if (!i.starter) expect(i.unlockLabel).toBeTruthy();
    }
  });

  it('IDs únicos; IDs com histórico preservados; aliases não colidem com itens', () => {
    const ids = COSMETIC_ITEMS.map((i) => i.id);
    expect(new Set(ids).size).toBe(ids.length);
    for (const id of ['tunic-joseph', 'cloak-elijah', 'cloak-succession', 'cloak-elijah-prophets', 'scroll-isaiah', 'crown-wisdom', 'frame-complete', 'bg-sinai', 'bg-bethlehem', 'sling-david', 'harp-psalmist', 'staff-moses', 'sandals-desert', 'tunic-linen', 'staff-shepherd', 'sandals-leather', 'belt-rope']) {
      expect(getItem(id)?.id).toBe(id);
    }
    for (const [alias, target] of Object.entries(ID_ALIASES)) {
      expect(ids).not.toContain(alias);
      expect(ids).toContain(target);
    }
    expect(resolveItemId('chapter_gen_37')).toBe('tunic-joseph');
    expect(resolveItemId('book_1sa')).toBe('sling-david');
    expect(resolveItemId('legendary-gen')).toBe('book_gen');
  });

  it('um lendário por livro, conquistado gratuitamente ao concluir o próprio livro', () => {
    const legendary = COSMETIC_ITEMS.filter((i) => i.rarity === 'legendary');
    expect(legendary).toHaveLength(66);
    const books = new Set(legendary.map((i) => i.book));
    expect(books.size).toBe(66);
    for (const b of bible as { code: string }[]) expect(books.has(b.code)).toBe(true);
    for (const it of raw.items.filter((i) => i.rarity === 'legendary')) {
      expect(it.unlock?.type).toBe('book_completed');
      expect(it.unlock?.payload.book).toBe(it.book);
    }
    expect(legendary.every((i) => i.acquisition === 'reading' && !i.premium)).toBe(true);
  });

  it('santos: artefatos são relíquias não equipáveis; nenhum é vendido; agrupados nas obras', () => {
    expect(HOLY_ITEMS).toHaveLength(22);
    for (const h of HOLY_ITEMS) {
      expect(h.referent).toMatch(/^(Pai|Filho|Espírito Santo|Deus Triúno)$/);
      expect(h.representation).toBe('symbolic');
      if (h.holySubtype === 'artefato') expect(isEquippable(h)).toBe(false);
    }
    for (const r of RELICS) expect(r.rarity).toBe('holy');
    const rawHoly = (require('../catalog/catalog.json') as { items: { rarity?: string; shopEligible?: boolean }[] }).items.filter((i) => i.rarity === 'holy');
    expect(rawHoly.every((i) => !i.shopEligible)).toBe(true);
    const works = COLLECTIONS.filter((c) => c.id.startsWith('works-'));
    expect(works.map((c) => c.id)).toEqual(['works-father', 'works-son', 'works-spirit', 'works-triune']);
    expect(new Set(works.flatMap((c) => c.items))).toEqual(new Set(HOLY_ITEMS.map((r) => r.id)));
  });

  it('pessoas divinas não são itens', () => {
    const forbidden = /^(deus|jesus|cristo|espírito santo|pai)$|corpo de cristo/i;
    for (const i of COSMETIC_ITEMS) expect(forbidden.test(i.name)).toBe(false);
  });

  it('raridade, slot e obtenção são independentes', () => {
    const outfitRarities = new Set(official.filter((i) => i.slot === 'outfit').map((i) => i.rarity));
    expect(outfitRarities.size).toBeGreaterThanOrEqual(3);
    const commonSlots = new Set(official.filter((i) => i.rarity === 'common').map((i) => i.slot));
    expect(commonSlots.size).toBeGreaterThanOrEqual(4);
    const commonAcq = new Set(official.filter((i) => i.rarity === 'common').map((i) => i.acquisition));
    expect(commonAcq.has('mission') && commonAcq.has('starter')).toBe(true);
  });

  it('comuns e raros oficiais vêm do Modo Missão (nunca de uma leitura comum)', () => {
    const cat = require('../catalog/catalog.json') as { missions?: { id: string; rewardItems: string[] }[]; pendingEditorialReview?: string[] };
    const missions = cat.missions ?? [];
    for (const it of raw.items.filter((i) => i.officialId?.startsWith('common_') || i.officialId?.startsWith('rare_'))) {
      if (!it.unlock) continue;
      const curated = missions.find((m) => m.rewardItems.includes(it.id));
      if (curated) expect(it.unlock).toMatchObject({ type: 'mission_completed', payload: { mission: curated.id } });
      else expect(it.unlock.type).toBe('mission_pool');
    }
    // 18 Raros: 16 com missão (13 missões novas + Manto do Profeta), 2 pendentes de revisão editorial
    const rares = raw.items.filter((i) => i.rarity === 'rare' && i.officialId?.startsWith('rare_'));
    expect(rares).toHaveLength(18);
    expect(rares.filter((i) => i.unlock?.type === 'mission_completed')).toHaveLength(16);
    expect(rares.filter((i) => i.unlock?.type === 'mission_pool').map((i) => i.id).sort()).toEqual(['rare_bolsa_do_mensageiro', 'rare_calice_de_bronze']);
    expect(cat.pendingEditorialReview).toEqual(['rare_calice_de_bronze', 'rare_bolsa_do_mensageiro']);
    expect(missions).toHaveLength(14);
    expect(missions.find((m) => m.id === 'missao_vestes_do_sumo_sacerdote')!.rewardItems).toEqual(['rare_estola_sacerdotal', 'rare_peitoral_das_doze_pedras', 'rare_turbante_do_sacerdote']);
    expect(missions.find((m) => m.id === 'missao_manto_do_profeta')!.rewardItems).toEqual(['cloak-elijah']);
  });

  it('filtro por raridade e novas categorias no inventário', () => {
    const r = listItems('back', { owned: new Set(), equipment: {}, rarity: 'legendary' });
    expect(r.length).toBeGreaterThan(5);
    expect(r.every((v) => v.item.rarity === 'legendary')).toBe(true);
    for (const cat of ['chest', 'special', 'effect', 'back_item']) expect(listItems(cat, { owned: new Set(), equipment: {} }).length).toBeGreaterThan(0);
  });

  it('o cliente não deixa uma relíquia entrar no visual', () => {
    const eq = setEquipped(defaultLook().equipment, 'hands', 'holy_mana_do_deserto');
    expect(eq.hands).toBeUndefined();
    expect(validateLook({ ...defaultLook(), equipment: { ...defaultLook().equipment, hands: 'holy_mana_do_deserto' } }).length).toBeGreaterThan(0);
  });
});

describe('compatibilidade com visuais e posse antigos', () => {
  it('posse registrada com ID antigo conta para o item oficial', () => {
    const v = itemView(getItem('book_gen')!, new Set(['legendary-gen']), {});
    expect(v.owned).toBe(true);
  });

  it('visual salvo com IDs do rascunho é normalizado para IDs e slots oficiais', () => {
    const eq = resolveEquipmentIds({ outfit: 'tunic-linen', hands: 'legendary-gen', feet: 'common_sandalias_de_couro' });
    expect(eq).toEqual({ outfit: 'tunic-linen', back: 'book_gen', feet: 'sandals-leather' });
    expect(sanitizeEquipment({ outfit: 'tunic-linen', hands: 'legendary-gen' })).toEqual({ outfit: 'tunic-linen', back: 'book_gen' });
  });

  it('AvatarRenderer: IDs antigos e slots novos não quebram o desenho', () => {
    const look = defaultLook();
    const layers = resolveLayers(look.appearance, { ...look.equipment, hands: 'legendary-gen', chest: 'book_lev', effect: 'holy_luz_da_criacao', special: 'book_zep', back_item: 'common_rede_de_pesca' });
    expect(layers.length).toBeGreaterThan(0);
    expect(layers.every((l) => Number.isFinite(l.zIndex))).toBe(true);
    // nenhum item é desenhado fora do próprio slot
    for (const l of layers) {
      const [slot, id] = l.source.split('/');
      const item = getItem(id);
      if (item) expect(item.slot).toBe(slot);
    }
  });
});

describe('nomes oficiais repetidos', () => {
  it('“Rolo do Escriba” mostra a raridade junto ao nome; IDs e nomes do catálogo preservados', () => {
    const { displayName, getItem } = require('../domain/catalog');
    expect(getItem('rare_rolo_do_escriba').name).toBe('Rolo do Escriba');
    expect(getItem('book_ezr').name).toBe('Rolo do Escriba');
    expect(displayName(getItem('rare_rolo_do_escriba'))).toBe('Rolo do Escriba (Raro)');
    expect(displayName(getItem('book_ezr'))).toBe('Rolo do Escriba (Lendário)');
    expect(displayName(getItem('rare_anel_de_selo'))).toBe('Anel de Selo');
  });
});
