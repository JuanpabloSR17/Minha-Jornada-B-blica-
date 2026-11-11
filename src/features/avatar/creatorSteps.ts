import type { AvatarCrop } from './art/geometry';
import type { AppearanceCategory, AppearanceKey, EquipmentSlot } from './domain/avatar.types';

export type CreatorGroup =
  | { kind: 'appearance'; id: AppearanceCategory; key: AppearanceKey; display: 'swatch' | 'card'; crop: AvatarCrop }
  | { kind: 'item'; id: EquipmentSlot; slot: EquipmentSlot; crop: AvatarCrop; optional: boolean }
  | { kind: 'presets'; id: 'presets' };

export type CreatorStep = {
  key: 'body' | 'face' | 'hair' | 'outfit';
  /** enquadramento do palco nesta etapa (zoom de câmera no rosto) */
  camera: 'full' | 'portrait';
  groups: CreatorGroup[];
};

/** Passos do criador: Corpo → Rosto → Cabelo → Visual (spec §4.1). */
export const CREATOR_STEPS: CreatorStep[] = [
  {
    key: 'body',
    camera: 'full',
    groups: [
      { kind: 'presets', id: 'presets' },
      { kind: 'appearance', id: 'body', key: 'bodyId', display: 'card', crop: 'full' },
      { kind: 'appearance', id: 'skin_tone', key: 'skinToneId', display: 'swatch', crop: 'bust' },
    ],
  },
  {
    key: 'face',
    camera: 'portrait',
    groups: [
      { kind: 'appearance', id: 'eyes', key: 'eyesId', display: 'card', crop: 'eyes' },
      { kind: 'appearance', id: 'brows', key: 'browsId', display: 'card', crop: 'eyes' },
      { kind: 'appearance', id: 'expression', key: 'expressionId', display: 'card', crop: 'mouth' },
      { kind: 'appearance', id: 'beard', key: 'beardId', display: 'card', crop: 'bust' },
    ],
  },
  {
    key: 'hair',
    camera: 'portrait',
    groups: [
      { kind: 'appearance', id: 'hair_style', key: 'hairStyleId', display: 'card', crop: 'portrait' },
      { kind: 'appearance', id: 'hair_color', key: 'hairColorId', display: 'swatch', crop: 'bust' },
    ],
  },
  {
    key: 'outfit',
    camera: 'full',
    groups: [
      { kind: 'item', id: 'outfit', slot: 'outfit', crop: 'outfit', optional: false },
      { kind: 'item', id: 'back', slot: 'back', crop: 'back', optional: true },
      { kind: 'item', id: 'feet', slot: 'feet', crop: 'feet', optional: true },
      { kind: 'item', id: 'waist', slot: 'waist', crop: 'outfit', optional: true },
      { kind: 'item', id: 'head', slot: 'head', crop: 'bust', optional: true },
      { kind: 'item', id: 'neck', slot: 'neck', crop: 'bust', optional: true },
      { kind: 'item', id: 'hands', slot: 'hands', crop: 'full', optional: true },
    ],
  },
];
