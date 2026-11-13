import { getOption } from '@/features/avatar/domain/catalog';
import type { AvatarLook } from '@/features/avatar/domain/avatar.types';

/**
 * Peças e aparência que o modelo 3D da prova cobre (assets/models/viajante.glb). O resto do catálogo ainda
 * não tem modelo 3D: aparece na lista `missing` e a tela avisa, sem esconder o que o jogador equipou.
 */
export const MODEL3D = {
  outfit: { 'tunic-linen': 'outfit_tunic' },
  back: { 'cloak-night': 'cloak' },
  hands: { 'staff-shepherd': 'staff' },
  hairLong: ['hair-long-wavy', 'hair-long', 'hair-braids', 'hair-ponytail', 'hair-locs'],
} as const;

export type Look3D = {
  skin: string;
  hairColor: string;
  hair: 'short' | 'long';
  /** malhas visíveis (nomes do GLB) */
  meshes: { outfit_tunic: boolean; cloak: boolean; staff: boolean; hair_short: boolean; hair_long: boolean };
  /** peças equipadas sem modelo 3D (mostradas como aviso) */
  missing: string[];
};

export function look3d(look: AvatarLook): Look3D {
  const hair = (MODEL3D.hairLong as readonly string[]).includes(look.appearance.hairStyleId) ? 'long' : 'short';
  const eq = look.equipment;
  const missing: string[] = [];
  for (const [slot, id] of Object.entries(eq)) {
    if (!id || slot === 'background') continue;
    const map = (MODEL3D as unknown as Record<string, Record<string, string>>)[slot];
    if (!map || !map[id]) missing.push(id);
  }
  return {
    skin: getOption('skin_tone', look.appearance.skinToneId)?.color ?? '#AC764B',
    hairColor: getOption('hair_color', look.appearance.hairColorId)?.color ?? '#3A281D',
    hair,
    meshes: {
      // a túnica é obrigatória no visual; sem modelo da túnica escolhida, mostra a de linho (e avisa)
      outfit_tunic: true,
      cloak: eq.back === 'cloak-night',
      staff: eq.hands === 'staff-shepherd',
      hair_short: hair === 'short',
      hair_long: hair === 'long',
    },
    missing,
  };
}
