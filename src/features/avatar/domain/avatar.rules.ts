import {
  APPEARANCE_KEY_CATEGORY,
  APPEARANCE_OPTIONS,
  DEFAULT_APPEARANCE,
  DEFAULT_EQUIPMENT,
  EQUIPMENT_SLOTS,
  REQUIRED_SLOTS,
  getItem,
  appearanceHasArt,
  getOption,
  isStarterFree,
  itemHasArt,
  itemsForSlot,
  resolveEquipmentIds,
} from './catalog';
import type { AppearanceKey, AvatarAppearance, AvatarLook, Equipment, EquipmentSlot } from './avatar.types';

export type LookIssue =
  | { kind: 'invalid_appearance'; key: AppearanceKey }
  | { kind: 'unknown_item'; slot: EquipmentSlot; itemId: string }
  | { kind: 'slot_mismatch'; slot: EquipmentSlot; itemId: string }
  | { kind: 'not_owned'; slot: EquipmentSlot; itemId: string }
  | { kind: 'missing_required'; slot: EquipmentSlot }
  | { kind: 'invalid_slot'; slot: string };

export function defaultLook(): AvatarLook {
  return { appearance: { ...DEFAULT_APPEARANCE }, equipment: { ...DEFAULT_EQUIPMENT } };
}

/**
 * Validação local (espelha o servidor). O servidor continua sendo a autoridade:
 * isto só evita enviar algo que certamente será rejeitado e dá feedback imediato.
 */
export function validateLook(look: AvatarLook, ownedItemIds?: ReadonlySet<string>): LookIssue[] {
  const issues: LookIssue[] = [];
  for (const key of Object.keys(APPEARANCE_KEY_CATEGORY) as AppearanceKey[]) {
    const value = look.appearance[key];
    if (typeof value !== 'string' || !getOption(APPEARANCE_KEY_CATEGORY[key], value)) {
      issues.push({ kind: 'invalid_appearance', key });
    }
  }
  for (const [slot, itemId] of Object.entries(look.equipment)) {
    if (!EQUIPMENT_SLOTS.includes(slot as EquipmentSlot)) {
      issues.push({ kind: 'invalid_slot', slot });
      continue;
    }
    if (!itemId) continue;
    const item = getItem(itemId);
    const s = slot as EquipmentSlot;
    if (!item) issues.push({ kind: 'unknown_item', slot: s, itemId });
    else if (item.slot !== s) issues.push({ kind: 'slot_mismatch', slot: s, itemId });
    else if (ownedItemIds && !ownedItemIds.has(itemId)) issues.push({ kind: 'not_owned', slot: s, itemId });
  }
  for (const slot of REQUIRED_SLOTS) {
    if (!look.equipment[slot]) issues.push({ kind: 'missing_required', slot });
  }
  return issues;
}

/** Remove slots vazios e itens que não pertencem ao slot. */
export function sanitizeEquipment(equipment: Equipment): Equipment {
  const out: Equipment = {};
  // IDs antigos (aliases) viram o ID canônico, no slot oficial do item
  const resolved = resolveEquipmentIds(equipment);
  for (const slot of EQUIPMENT_SLOTS) {
    const item = getItem(resolved[slot]);
    if (item && item.slot === slot) out[slot] = item.id;
  }
  return out;
}

/**
 * Normaliza um visual vindo de fonte não confiável (rascunho local, versão antiga do catálogo):
 * campos inválidos voltam ao padrão em vez de deixar o avatar quebrado.
 */
export function normalizeLook(input: Partial<AvatarLook> | null | undefined): AvatarLook {
  const base = defaultLook();
  const appearance = { ...base.appearance };
  const src = (input?.appearance ?? {}) as Partial<AvatarAppearance>;
  for (const key of Object.keys(APPEARANCE_KEY_CATEGORY) as AppearanceKey[]) {
    const v = src[key];
    if (typeof v === 'string' && getOption(APPEARANCE_KEY_CATEGORY[key], v)) appearance[key] = v;
  }
  const equipment = input?.equipment ? sanitizeEquipment(input.equipment) : base.equipment;
  for (const slot of REQUIRED_SLOTS) {
    if (!equipment[slot]) equipment[slot] = base.equipment[slot];
  }
  return { appearance, equipment };
}

export function setEquipped(equipment: Equipment, slot: EquipmentSlot, itemId: string | null): Equipment {
  const next = { ...equipment };
  if (itemId === null) {
    if (REQUIRED_SLOTS.includes(slot)) return equipment;
    delete next[slot];
    return next;
  }
  const item = getItem(itemId);
  if (!item || item.slot !== slot) return equipment; // nunca mistura slots
  next[slot] = itemId;
  return next;
}

export function looksEqual(a: AvatarLook, b: AvatarLook): boolean {
  const ka = Object.keys(APPEARANCE_KEY_CATEGORY) as AppearanceKey[];
  if (ka.some((k) => a.appearance[k] !== b.appearance[k])) return false;
  return EQUIPMENT_SLOTS.every((s) => (a.equipment[s] ?? null) === (b.equipment[s] ?? null));
}

type Rng = () => number;
const pick = <T,>(list: readonly T[], rng: Rng): T => list[Math.floor(rng() * list.length) % list.length] as T;

/**
 * Sorteia um visual usando apenas opções e peças iniciais gratuitas, compatíveis
 * e que já têm arte publicada na versão atual do manifest.
 */
export function randomLook(rng: Rng = Math.random, keepBackground?: string): AvatarLook {
  const appearance = {} as AvatarAppearance;
  for (const key of Object.keys(APPEARANCE_KEY_CATEGORY) as AppearanceKey[]) {
    const cat = APPEARANCE_KEY_CATEGORY[key];
    appearance[key] = pick(APPEARANCE_OPTIONS[cat].filter((o) => appearanceHasArt(cat, o.id)), rng).id;
  }
  const free = (slot: EquipmentSlot) => itemsForSlot(slot, (i) => isStarterFree(i) && itemHasArt(i));
  const equipment: Equipment = {
    outfit: pick(free('outfit'), rng).id,
    background: keepBackground ?? DEFAULT_EQUIPMENT.background,
  };
  const optional: [EquipmentSlot, number][] = [['feet', 0.9], ['back', 0.5], ['waist', 0.6], ['neck', 0.35], ['head', 0.3], ['hands', 0.3]];
  for (const [slot, chance] of optional) {
    const list = free(slot);
    if (list.length && rng() < chance) equipment[slot] = pick(list, rng).id;
  }
  return { appearance, equipment: sanitizeEquipment(equipment) };
}
