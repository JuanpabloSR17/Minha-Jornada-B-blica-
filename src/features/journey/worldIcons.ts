import type { IconName } from '@/ui';
import type { WORLDS } from './worlds';

type WorldId = typeof WORLDS[number]['id'];

export const worldIcons: Record<WorldId, IconName> = {
  origens: 'mountain',
  reinos: 'crown',
  sabedoria: 'harp',
  profetas: 'lamp',
  evangelhos: 'cross',
  igreja: 'ship',
  'nova-criacao': 'sunrise',
};
