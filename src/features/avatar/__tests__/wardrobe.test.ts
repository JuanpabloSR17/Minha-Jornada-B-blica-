import { COLLECTIONS, COSMETIC_ITEMS, getItem } from '../domain/catalog';
import { defaultLook } from '../domain/avatar.rules';
import { resolveLayers } from '../domain/avatar.layering';
import { artStatus } from '../art/manifest';
import bible from '../../reading/bible-books.json';
import {
  INVENTORY_CATEGORIES,
  appearanceChanged,
  initialWardrobe,
  listItems,
  lockedInDraft,
  variantFamily,
  wardrobeDirty,
  wardrobeReducer,
} from '../domain/wardrobe';
import type { WardrobeState } from '../services/wardrobe.service';

const base = defaultLook();
const state: WardrobeState = {
  appearance: base.appearance,
  appearanceVersion: 4,
  activeLoadoutId: 'l1',
  plan: { tier: 'free', loadoutLimit: 3, status: 'active' },
  loadouts: [
    { id: 'l1', name: 'Visual 1', isActive: true, version: 2, position: 1, locked: false, updatedAt: null, equipment: base.equipment },
    { id: 'l2', name: 'Viagem', isActive: false, version: 1, position: 2, locked: false, updatedAt: null, equipment: { ...base.equipment, back: 'cloak-wool' } },
  ],
  owned: [{ itemId: 'tunic-joseph', unlockedAt: '2026-11-11', source: 'reward:x' }],
};

describe('inventário', () => {
  it('tem as dez categorias pedidas', () => {
    expect(INVENTORY_CATEGORIES.map((c) => c.label)).toEqual(['Túnicas', 'Mantos', 'Calçados', 'Cabelos', 'Cabeça e pescoço', 'Itens de mão', 'Cintura', 'Especiais', 'Fundos', 'Molduras']);
  });

  it('obtidos primeiro; bloqueados aparecem com objetivo; filtros funcionam', () => {
    const owned = new Set(['tunic-joseph']);
    const backs = listItems('back', { owned, equipment: base.equipment });
    const firstLocked = backs.findIndex((v) => v.locked);
    expect(backs.slice(0, firstLocked).every((v) => v.owned)).toBe(true);
    expect(backs.find((v) => v.item.id === 'cloak-elijah')!.locked).toBe(true);
    expect(listItems('back', { owned, equipment: base.equipment, filter: 'owned' }).every((v) => v.owned)).toBe(true);
    expect(listItems('outfit', { owned, equipment: base.equipment, filter: 'equipped' }).map((v) => v.item.id)).toEqual(['tunic-linen']);
    expect(listItems('special', { owned, equipment: base.equipment }).find((v) => v.item.id === 'tunic-joseph')!.owned).toBe(true);
  });

  it('busca por nome ou referência bíblica', () => {
    const r = listItems('special', { owned: new Set(), equipment: {}, search: '1 reis' }).map((v) => v.item.id);
    expect(r).toContain('cloak-elijah');
    expect(listItems('hands', { owned: new Set(), equipment: {}, search: 'funda' }).map((v) => v.item.id)).toEqual(['sling-david']);
  });

  it('itens bíblicos centrais são gratuitos e têm referência e objetivo', () => {
    for (const id of ['tunic-joseph', 'sandals-desert', 'sling-david', 'cloak-elijah', 'cloak-succession', 'crown-wisdom', 'harp-psalmist']) {
      const it = getItem(id)!;
      expect(it.premium).toBe(false);
      expect(it.scriptureRef).toBeTruthy();
      expect(it.unlockLabel).toBeTruthy();
    }
  });

  it('referências das regras apontam para livros e capítulos que existem', () => {
    const raw = require('../catalog/catalog.json') as { items: { unlock?: { payload?: { book?: string; chapter?: number } } }[] };
    const books = new Map((bible as { code: string; chapters: number }[]).map((b) => [b.code, b.chapters]));
    expect([...books.values()].reduce((a, b) => a + b, 0)).toBe(1189);
    for (const it of raw.items) {
      const p = it.unlock?.payload;
      if (p?.book) expect(books.has(p.book)).toBe(true);
      if (p?.book && p.chapter) expect(p.chapter).toBeLessThanOrEqual(books.get(p.book)!);
    }
  });
});

describe('evolução e coleções', () => {
  it('Manto de Elias tem a original e duas aparências evoluídas', () => {
    expect(variantFamily('cloak-succession').map((i) => i.id)).toEqual(['cloak-elijah', 'cloak-succession', 'cloak-elijah-prophets']);
    expect(variantFamily('cloak-elijah')).toHaveLength(3);
  });
  it('coleções de Moisés, Davi e Profetas têm itens e recompensa válidos', () => {
    expect(COLLECTIONS.map((c) => c.id).slice(0, 3)).toEqual(['moses', 'david', 'prophets']);
    for (const c of COLLECTIONS) {
      if (c.reward) expect(getItem(c.reward)).toBeDefined();
      c.items.forEach((id) => expect(getItem(id)).toBeDefined());
    }
  });
});

describe('estado de edição do guarda-roupa', () => {
  it('equipa no rascunho, descarta e troca de visual', () => {
    let s = wardrobeReducer(initialWardrobe, { type: 'hydrate', state });
    expect(s.loadoutId).toBe('l1');
    s = wardrobeReducer(s, { type: 'equip', slot: 'back', itemId: 'cloak-desert' });
    expect(wardrobeDirty(s)).toBe(true);
    s = wardrobeReducer(s, { type: 'discard' });
    expect(wardrobeDirty(s)).toBe(false);
    s = wardrobeReducer(s, { type: 'selectLoadout', loadoutId: 'l2' });
    expect(s.draft!.equipment.back).toBe('cloak-wool');
  });

  it('remover peça e não remover a túnica', () => {
    let s = wardrobeReducer(initialWardrobe, { type: 'hydrate', state, loadoutId: 'l2' });
    s = wardrobeReducer(s, { type: 'equip', slot: 'back', itemId: null });
    expect(s.draft!.equipment.back).toBeUndefined();
    s = wardrobeReducer(s, { type: 'equip', slot: 'outfit', itemId: null });
    expect(s.draft!.equipment.outfit).toBe('tunic-linen');
  });

  it('cabelo vai junto no salvamento só se mudou', () => {
    let s = wardrobeReducer(initialWardrobe, { type: 'hydrate', state });
    expect(appearanceChanged(s)).toBeNull();
    s = wardrobeReducer(s, { type: 'setHair', hairStyleId: 'hair-curly' });
    expect(appearanceChanged(s)).toEqual({ hairStyleId: 'hair-curly' });
  });

  it('prévia de item bloqueado é detectada (e não o item já conquistado)', () => {
    let s = wardrobeReducer(initialWardrobe, { type: 'hydrate', state });
    s = wardrobeReducer(s, { type: 'equip', slot: 'outfit', itemId: 'tunic-joseph' });
    expect(lockedInDraft(s)).toEqual([]);
    s = wardrobeReducer(s, { type: 'equip', slot: 'back', itemId: 'cloak-elijah' });
    expect(lockedInDraft(s)).toEqual(['cloak-elijah']);
  });

  it('erro ao salvar mantém o rascunho; sucesso adota o estado do servidor', () => {
    let s = wardrobeReducer(initialWardrobe, { type: 'hydrate', state });
    s = wardrobeReducer(s, { type: 'equip', slot: 'back', itemId: 'cloak-desert' });
    s = wardrobeReducer(s, { type: 'saveError', error: 'offline' });
    expect(s.draft!.equipment.back).toBe('cloak-desert');
    expect(wardrobeDirty(s)).toBe(true);
    const confirmed = { ...state, loadouts: state.loadouts.map((l) => (l.id === 'l1' ? { ...l, version: 3, equipment: { ...l.equipment, back: 'cloak-desert' } } : l)) };
    s = wardrobeReducer(s, { type: 'saveSuccess', state: confirmed });
    expect(wardrobeDirty(s)).toBe(false);
  });

  it('visual excluído no servidor volta para o visual ativo', () => {
    let s = wardrobeReducer(initialWardrobe, { type: 'hydrate', state, loadoutId: 'l2' });
    s = wardrobeReducer(s, { type: 'hydrate', state: { ...state, loadouts: [state.loadouts[0]!] } });
    expect(s.loadoutId).toBe('l1');
  });
});

describe('assets ausentes', () => {
  it('item bíblico sem arte usa substituto visível e é marcado como "em produção"', () => {
    expect(artStatus('back/cloak-elijah')).toBe('missing');
    const layers = resolveLayers(base.appearance, { ...base.equipment, back: 'cloak-elijah' }).filter((l) => l.source === 'back/cloak-elijah');
    expect(layers.map((l) => l.slot).sort()).toEqual(['cloak_back', 'cloak_front']);
    expect(layers.every((l) => l.isFallback)).toBe(true);
  });
  it('peça com arte provisória é marcada como provisória', () => {
    expect(artStatus('outfit/tunic-joseph')).toBe('provisional');
  });
  it('todo item do catálogo aparece em alguma categoria do inventário', () => {
    const shown = new Set(INVENTORY_CATEGORIES.flatMap((c) => listItems(c.id, { owned: new Set(), equipment: {} }).map((v) => v.item.id)));
    for (const it of COSMETIC_ITEMS.filter((i) => !i.premium && i.slot !== 'relic')) expect(shown.has(it.id)).toBe(true);
    for (const it of COSMETIC_ITEMS.filter((i) => i.slot === 'relic')) expect(shown.has(it.id)).toBe(false);
  });
});
