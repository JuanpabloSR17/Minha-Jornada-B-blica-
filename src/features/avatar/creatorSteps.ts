import type { AvatarCrop } from './art/geometry';
import type { AppearanceCategory, AppearanceKey, EquipmentSlot } from './domain/avatar.types';

export type CreatorGroup =
  | { kind: 'appearance'; id: AppearanceCategory; key: AppearanceKey; display: 'swatch' | 'thumb'; crop: AvatarCrop }
  | { kind: 'item'; id: EquipmentSlot; slot: EquipmentSlot; crop: AvatarCrop; optional: boolean };

export type CreatorStep = { key: 'body' | 'face' | 'hair' | 'outfit'; groups: CreatorGroup[] };

/** Passos do criador: Corpo → Rosto → Cabelo → Visual (spec §4.1). */
export const CREATOR_STEPS: CreatorStep[] = [
  {
    key: 'body',
    groups: [
      { kind: 'appearance', id: 'body', key: 'bodyId', display: 'thumb', crop: 'full' },
      { kind: 'appearance', id: 'skin_tone', key: 'skinToneId', display: 'swatch', crop: 'bust' },
    ],
  },
  {
    key: 'face',
    groups: [
      { kind: 'appearance', id: 'eyes', key: 'eyesId', display: 'thumb', crop: 'bust' },
      { kind: 'appearance', id: 'brows', key: 'browsId', display: 'thumb', crop: 'bust' },
      { kind: 'appearance', id: 'expression', key: 'expressionId', display: 'thumb', crop: 'bust' },
      { kind: 'appearance', id: 'beard', key: 'beardId', display: 'thumb', crop: 'bust' },
    ],
  },
  {
    key: 'hair',
    groups: [
      { kind: 'appearance', id: 'hair_style', key: 'hairStyleId', display: 'thumb', crop: 'bust' },
      { kind: 'appearance', id: 'hair_color', key: 'hairColorId', display: 'swatch', crop: 'bust' },
    ],
  },
  {
    key: 'outfit',
    groups: [
      { kind: 'item', id: 'outfit', slot: 'outfit', crop: 'full', optional: false },
      { kind: 'item', id: 'back', slot: 'back', crop: 'full', optional: true },
      { kind: 'item', id: 'feet', slot: 'feet', crop: 'lower', optional: true },
      { kind: 'item', id: 'waist', slot: 'waist', crop: 'lower', optional: true },
      { kind: 'item', id: 'head', slot: 'head', crop: 'bust', optional: true },
      { kind: 'item', id: 'neck', slot: 'neck', crop: 'bust', optional: true },
      { kind: 'item', id: 'hands', slot: 'hands', crop: 'full', optional: true },
    ],
  },
];
