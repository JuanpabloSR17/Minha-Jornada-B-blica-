import { ART_MANIFEST, FALLBACK_ART, LAYER_ORDER, type ManifestEntry } from '../art/manifest';
import { getItem } from './catalog';
import type { AvatarAppearance, AvatarLayer, Equipment, EquipmentSlot, LayerSlot } from './avatar.types';

export type ResolvedLayer = AvatarLayer & {
  params: Record<string, string | number | boolean>;
  /** true quando a arte original não existe e um substituto foi usado */
  isFallback: boolean;
  source: string;
};

const ITEM_SLOT_ORDER: EquipmentSlot[] = [
  'background', 'back', 'feet', 'outfit', 'waist', 'neck', 'head', 'hands', 'frame',
];

export function zIndexOf(slot: LayerSlot): number {
  const i = LAYER_ORDER.indexOf(slot);
  return (i < 0 ? LAYER_ORDER.length : i) * 10;
}

/**
 * Converte aparência + equipamento em uma lista ordenada de camadas para desenho.
 * Função pura: não depende de React, pode ser testada e reutilizada no servidor.
 */
export function resolveLayers(
  appearance: AvatarAppearance,
  equipment: Equipment,
  opts: { showBackground?: boolean; manifest?: Record<string, ManifestEntry> } = {},
): ResolvedLayer[] {
  const manifest = opts.manifest ?? ART_MANIFEST;
  const showBackground = opts.showBackground ?? true;
  const bodyId = appearance.bodyId;
  const layers: ResolvedLayer[] = [];
  const hidden = new Set<LayerSlot>();

  const push = (source: string, entry: ManifestEntry | undefined, fallbackSlots: LayerSlot[] = []) => {
    const compatible = !entry?.bodyCompatibility || entry.bodyCompatibility.includes(bodyId);
    if (entry && compatible) {
      for (const [slot, assetKey] of Object.entries(entry.layers) as [LayerSlot, string][]) {
        layers.push({
          id: `${source}#${slot}`,
          slot,
          assetKey,
          zIndex: zIndexOf(slot),
          bodyCompatibility: entry.bodyCompatibility ?? ['*'],
          variant: bodyId,
          params: entry.params ?? {},
          isFallback: false,
          source,
        });
      }
      return;
    }
    for (const slot of fallbackSlots) {
      const assetKey = FALLBACK_ART[slot];
      if (!assetKey) continue;
      layers.push({
        id: `${source}#${slot}#fallback`,
        slot,
        assetKey,
        zIndex: zIndexOf(slot),
        bodyCompatibility: ['*'],
        variant: bodyId,
        params: {},
        isFallback: true,
        source,
      });
    }
  };

  push(`body/${appearance.bodyId}`, manifest[`body/${appearance.bodyId}`] ?? manifest['body/body-b']);
  push(`eyes/${appearance.eyesId}`, manifest[`eyes/${appearance.eyesId}`]);
  push(`brows/${appearance.browsId}`, manifest[`brows/${appearance.browsId}`]);
  push(`expression/${appearance.expressionId}`, manifest[`expression/${appearance.expressionId}`]);
  push(`beard/${appearance.beardId}`, manifest[`beard/${appearance.beardId}`]);
  push(`hair/${appearance.hairStyleId}`, manifest[`hair/${appearance.hairStyleId}`]);

  for (const slot of ITEM_SLOT_ORDER) {
    const itemId = equipment[slot];
    if (!itemId) continue;
    if (slot === 'background' && !showBackground) continue;
    const item = getItem(itemId);
    // Nunca desenha um item fora do slot dele (camadas incompatíveis).
    if (item && item.slot !== slot) continue;
    item?.hides?.forEach((h) => hidden.add(h));
    const key = `${slot}/${itemId}`;
    push(key, manifest[key], slot === 'outfit' ? ['upper_outfit', 'sleeves'] : []);
  }

  return layers
    .filter((l) => !hidden.has(l.slot))
    .map((l, i) => ({ l, i }))
    .sort((a, b) => a.l.zIndex - b.l.zIndex || a.i - b.i)
    .map(({ l }) => l);
}
