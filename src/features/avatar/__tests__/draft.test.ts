import { draftReducer, initialDraftState, isDirty } from '../state/avatarDraft';
import { defaultLook } from '../domain/avatar.rules';
import type { AvatarState } from '../domain/avatar.types';

const server: AvatarState = { ...defaultLook(), version: 3, loadoutId: 'l1', updatedAt: '2026-11-11T10:00:00Z' };

describe('store de edição (draft/saved)', () => {
  it('hydrate usa o visual salvo como rascunho', () => {
    const s = draftReducer(initialDraftState(), { type: 'hydrate', saved: server });
    expect(s.savedVersion).toBe(3);
    expect(isDirty(s)).toBe(false);
  });

  it('applyPreview altera só o rascunho; discard restaura o salvo', () => {
    let s = draftReducer(initialDraftState(), { type: 'hydrate', saved: server });
    s = draftReducer(s, { type: 'applyPreview', patch: { hairStyleId: 'hair-afro' } });
    expect(s.draft.appearance.hairStyleId).toBe('hair-afro');
    expect(s.saved!.appearance.hairStyleId).toBe('hair-short');
    expect(isDirty(s)).toBe(true);
    s = draftReducer(s, { type: 'discard' });
    expect(s.draft.appearance.hairStyleId).toBe('hair-short');
    expect(isDirty(s)).toBe(false);
  });

  it('erro ao salvar não marca como salvo e mantém o rascunho', () => {
    let s = draftReducer(initialDraftState(), { type: 'hydrate', saved: server });
    s = draftReducer(s, { type: 'equip', slot: 'back', itemId: 'cloak-night' });
    s = draftReducer(s, { type: 'saveStart' });
    s = draftReducer(s, { type: 'saveError', error: 'offline' });
    expect(s.status).toBe('error');
    expect(s.draft.equipment.back).toBe('cloak-night');
    expect(s.saved!.equipment.back).toBeUndefined();
    expect(isDirty(s)).toBe(true);
  });

  it('sucesso adota o estado devolvido pelo servidor', () => {
    let s = draftReducer(initialDraftState(), { type: 'equip', slot: 'back', itemId: 'cloak-night' });
    const confirmed: AvatarState = { ...server, version: 4, equipment: { ...server.equipment, back: 'cloak-night' } };
    s = draftReducer(s, { type: 'saveSuccess', state: confirmed });
    expect(s.savedVersion).toBe(4);
    expect(s.status).toBe('saved');
    expect(isDirty(s)).toBe(false);
  });

  it('equip ignora item de outro slot', () => {
    const s0 = initialDraftState();
    const s = draftReducer(s0, { type: 'equip', slot: 'feet', itemId: 'tunic-olive' });
    expect(s.draft.equipment).toEqual(s0.draft.equipment);
  });

  it('reset volta ao padrão mantendo o fundo', () => {
    let s = draftReducer(initialDraftState(), { type: 'applyPreview', patch: { bodyId: 'body-c' } });
    s = draftReducer(s, { type: 'reset' });
    expect(s.draft).toEqual(defaultLook());
  });
});
