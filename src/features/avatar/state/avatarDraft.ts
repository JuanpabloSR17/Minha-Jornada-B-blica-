import { useMemo, useReducer } from 'react';
import { defaultLook, looksEqual, setEquipped } from '../domain/avatar.rules';
import type { AvatarAppearance, AvatarLook, AvatarState, EquipmentSlot } from '../domain/avatar.types';

export type SaveStatus = 'idle' | 'saving' | 'saved' | 'error';

export type DraftState = {
  /** último visual confirmado pelo servidor (null = ainda não existe) */
  saved: AvatarLook | null;
  savedVersion: number | null;
  /** visual em edição, mostrado na prévia */
  draft: AvatarLook;
  status: SaveStatus;
  error: string | null;
};

export type DraftAction =
  | { type: 'hydrate'; saved: AvatarState | null; draft?: AvatarLook }
  | { type: 'applyPreview'; patch: Partial<AvatarAppearance> }
  | { type: 'equip'; slot: EquipmentSlot; itemId: string | null }
  | { type: 'replace'; look: AvatarLook }
  | { type: 'reset' }
  | { type: 'discard' }
  | { type: 'saveStart' }
  | { type: 'saveSuccess'; state: AvatarState }
  | { type: 'saveError'; error: string };

export const initialDraftState = (look: AvatarLook = defaultLook()): DraftState => ({
  saved: null,
  savedVersion: null,
  draft: look,
  status: 'idle',
  error: null,
});

const asLook = (s: AvatarState): AvatarLook => ({ appearance: s.appearance, equipment: s.equipment });

export function draftReducer(state: DraftState, action: DraftAction): DraftState {
  switch (action.type) {
    case 'hydrate': {
      const saved = action.saved ? asLook(action.saved) : null;
      return {
        saved,
        savedVersion: action.saved?.version ?? null,
        draft: action.draft ?? saved ?? state.draft,
        status: 'idle',
        error: null,
      };
    }
    case 'applyPreview':
      return { ...state, draft: { ...state.draft, appearance: { ...state.draft.appearance, ...action.patch } }, error: null };
    case 'equip':
      return { ...state, draft: { ...state.draft, equipment: setEquipped(state.draft.equipment, action.slot, action.itemId) }, error: null };
    case 'replace':
      return { ...state, draft: action.look, error: null };
    case 'reset': {
      const background = state.draft.equipment.background;
      const base = defaultLook();
      return { ...state, draft: { ...base, equipment: { ...base.equipment, ...(background ? { background } : {}) } }, error: null };
    }
    case 'discard':
      return state.saved ? { ...state, draft: state.saved, status: 'idle', error: null } : state;
    case 'saveStart':
      return { ...state, status: 'saving', error: null };
    case 'saveSuccess':
      // O visual confirmado é o que o servidor devolveu, não o que o cliente supôs.
      return { saved: asLook(action.state), savedVersion: action.state.version, draft: asLook(action.state), status: 'saved', error: null };
    case 'saveError':
      // Rollback de status: o rascunho fica intacto, mas nada é dado como salvo.
      return { ...state, status: 'error', error: action.error };
    default:
      return state;
  }
}

export function isDirty(state: DraftState) {
  return !state.saved || !looksEqual(state.draft, state.saved);
}

export function useAvatarDraft(initial?: AvatarLook) {
  const [state, dispatch] = useReducer(draftReducer, initial, initialDraftState);
  const dirty = useMemo(() => isDirty(state), [state]);
  return { state, dispatch, dirty };
}
