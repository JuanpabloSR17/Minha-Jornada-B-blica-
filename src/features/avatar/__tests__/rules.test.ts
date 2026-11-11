import { APPEARANCE_OPTIONS, COSMETIC_ITEMS, LOOK_PRESETS, appearanceHasArt, getItem, itemHasArt } from '../domain/catalog';
import { defaultLook, looksEqual, normalizeLook, randomLook, sanitizeEquipment, setEquipped, validateLook } from '../domain/avatar.rules';

describe('catálogo inicial (metas do MVP)', () => {
  it('tem as quantidades da especificação', () => {
    expect(APPEARANCE_OPTIONS.body).toHaveLength(3);
    expect(APPEARANCE_OPTIONS.skin_tone).toHaveLength(6);
    expect(APPEARANCE_OPTIONS.eyes).toHaveLength(6);
    expect(APPEARANCE_OPTIONS.expression).toHaveLength(5);
    expect(APPEARANCE_OPTIONS.beard.filter((b) => b.id !== 'beard-none')).toHaveLength(6);
    expect(APPEARANCE_OPTIONS.hair_style).toHaveLength(12);
    expect(APPEARANCE_OPTIONS.hair_color).toHaveLength(8);
    const count = (slot: string) => COSMETIC_ITEMS.filter((i) => i.slot === slot && i.starter).length;
    expect(count('outfit')).toBe(8);
    expect(count('back')).toBe(5);
    expect(count('feet')).toBe(6);
    expect(count('waist')).toBe(6);
    expect(count('head') + count('neck') + count('hands')).toBe(9);
  });

  it('não limita roupas por modelo de corpo', () => {
    for (const item of COSMETIC_ITEMS) expect(item).not.toHaveProperty('bodyCompatibility');
  });

  it('itens iniciais são gratuitos; itens bíblicos têm referência e objetivo de desbloqueio', () => {
    expect(COSMETIC_ITEMS.filter((i) => i.starter).every((i) => !i.premium)).toBe(true);
    const joseph = getItem('tunic-joseph')!;
    expect(joseph.starter).toBe(false);
    expect(joseph.scriptureRef).toBe('Gênesis 37:3');
    expect(joseph.unlockLabel).toMatch(/Gênesis 37/);
  });

  it('conjunto de validação da nova arte está completo', () => {
    const art = (cat: keyof typeof APPEARANCE_OPTIONS) => APPEARANCE_OPTIONS[cat].filter((o) => appearanceHasArt(cat, o.id)).length;
    const items = (slot: string, starter = true) => COSMETIC_ITEMS.filter((i) => i.slot === slot && i.starter === starter && itemHasArt(i)).length;
    expect(art('body')).toBeGreaterThanOrEqual(2);
    expect(art('hair_style')).toBeGreaterThanOrEqual(3);
    expect(items('outfit')).toBeGreaterThanOrEqual(3);
    expect(items('back')).toBeGreaterThanOrEqual(2);
    expect(items('feet')).toBeGreaterThanOrEqual(2);
    expect(items('outfit', false)).toBeGreaterThanOrEqual(1);
  });

  it('visuais sugeridos são válidos e só usam peças ilustradas', () => {
    expect(LOOK_PRESETS.length).toBeGreaterThanOrEqual(2);
    for (const p of LOOK_PRESETS) {
      expect(validateLook(p.look)).toEqual([]);
      for (const id of Object.values(p.look.equipment)) expect(itemHasArt(getItem(id)!)).toBe(true);
    }
    const bodies = new Set(LOOK_PRESETS.map((p) => p.look.appearance.bodyId));
    expect(bodies.size).toBeGreaterThanOrEqual(2);
  });
});

describe('validação de visual', () => {
  it('padrão é válido', () => {
    expect(validateLook(defaultLook())).toEqual([]);
  });

  it('rejeita opção de outra categoria', () => {
    const look = defaultLook();
    look.appearance.skinToneId = 'hair-short';
    expect(validateLook(look)).toContainEqual({ kind: 'invalid_appearance', key: 'skinToneId' });
  });

  it('rejeita item no slot errado e item não possuído', () => {
    const look = defaultLook();
    look.equipment.outfit = 'cloak-wool';
    expect(validateLook(look)).toContainEqual({ kind: 'slot_mismatch', slot: 'outfit', itemId: 'cloak-wool' });
    expect(validateLook(defaultLook(), new Set(['tunic-linen']))).toContainEqual(
      expect.objectContaining({ kind: 'not_owned', itemId: 'sandals-leather' }),
    );
  });

  it('exige túnica', () => {
    const look = defaultLook();
    delete look.equipment.outfit;
    expect(validateLook(look)).toContainEqual({ kind: 'missing_required', slot: 'outfit' });
  });
});

describe('equipar', () => {
  it('uma peça por slot e nunca mistura slots', () => {
    const eq = setEquipped({ outfit: 'tunic-linen' }, 'outfit', 'tunic-olive');
    expect(eq.outfit).toBe('tunic-olive');
    expect(setEquipped(eq, 'outfit', 'cloak-wool')).toBe(eq);
    expect(setEquipped(eq, 'feet', 'tunic-linen')).toBe(eq);
  });

  it('não permite remover a túnica, mas permite remover acessórios', () => {
    const eq = { outfit: 'tunic-linen', head: 'headband-linen' } as const;
    expect(setEquipped(eq, 'outfit', null)).toBe(eq);
    expect(setEquipped(eq, 'head', null)).toEqual({ outfit: 'tunic-linen' });
  });

  it('sanitize descarta itens desconhecidos e fora do slot', () => {
    expect(sanitizeEquipment({ outfit: 'tunic-linen', feet: 'x', back: 'tunic-olive' })).toEqual({ outfit: 'tunic-linen' });
  });
});

describe('normalização de rascunho não confiável', () => {
  it('campos inválidos voltam ao padrão sem quebrar o avatar', () => {
    const n = normalizeLook({ appearance: { bodyId: 'body-z', hairStyleId: 'hair-curly' } as never, equipment: { feet: 'boots-travel' } });
    expect(n.appearance.bodyId).toBe(defaultLook().appearance.bodyId);
    expect(n.appearance.hairStyleId).toBe('hair-curly');
    expect(n.equipment.outfit).toBe('tunic-linen');
    expect(n.equipment.feet).toBe('boots-travel');
    expect(validateLook(n)).toEqual([]);
  });
  it('null vira padrão', () => {
    expect(looksEqual(normalizeLook(null), defaultLook())).toBe(true);
  });
});

describe('aleatório', () => {
  it('sempre gera visual válido só com peças iniciais gratuitas e ilustradas', () => {
    let seed = 7;
    const rng = () => ((seed = (seed * 16807) % 2147483647) / 2147483647);
    for (let i = 0; i < 300; i++) {
      const look = randomLook(rng);
      expect(validateLook(look)).toEqual([]);
      for (const id of Object.values(look.equipment)) {
        const item = getItem(id)!;
        expect(item.starter && !item.premium && itemHasArt(item)).toBe(true);
      }
    }
  });
});
