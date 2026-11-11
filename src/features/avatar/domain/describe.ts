import { APPEARANCE_KEY_CATEGORY, getItem, getOption } from './catalog';
import type { AppearanceKey, AvatarLook } from './avatar.types';

/** Descrição textual do visual, para leitores de tela. */
export function describeLook(look: AvatarLook): string {
  const parts: string[] = [];
  for (const key of ['bodyId', 'skinToneId', 'hairStyleId', 'hairColorId', 'expressionId', 'beardId'] as AppearanceKey[]) {
    const opt = getOption(APPEARANCE_KEY_CATEGORY[key], look.appearance[key]);
    if (opt && key !== 'beardId') parts.push(opt.name);
    if (opt && key === 'beardId' && opt.id !== 'beard-none') parts.push(`barba ${opt.name.toLowerCase()}`);
  }
  for (const id of Object.values(look.equipment)) {
    const item = getItem(id);
    if (item && item.slot !== 'background') parts.push(item.name);
  }
  return parts.join(', ');
}
