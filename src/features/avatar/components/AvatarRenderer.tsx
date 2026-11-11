import { memo, useId, useMemo } from 'react';
import { View, type StyleProp, type ViewStyle } from 'react-native';
import Svg, { G, Image as SvgImage } from 'react-native-svg';
import { ART_REGISTRY } from '../art/registry';
import { CROPS, geometryFor, type AvatarCrop } from '../art/geometry';
import type { ArtContext, ArtDefinition } from '../art/types';
import { getOption } from '../domain/catalog';
import { resolveLayers } from '../domain/avatar.layering';
import type { AvatarAppearance, Equipment } from '../domain/avatar.types';

export type AvatarRendererProps = {
  appearance: AvatarAppearance;
  equippedItems: Equipment;
  /** altura em px (largura proporcional ao recorte) */
  size: number;
  crop?: AvatarCrop;
  showBackground?: boolean;
  /** reservado para poses futuras; hoje só existe "idle" */
  pose?: 'idle';
  accessibilityLabel?: string;
  /**
   * Largura do contêiner: no recorte 'full', o canvas é estendido nas laterais
   * para o fundo preencher toda a área sem esticar o personagem.
   */
  fillWidth?: number;
  style?: StyleProp<ViewStyle>;
};

function renderArt(def: ArtDefinition | undefined, ctx: ArtContext) {
  if (!def) return null;
  if (typeof def === 'function') return def(ctx);
  const source =
    def.perBody && def.source && typeof def.source === 'object' && !('uri' in def.source) && !Array.isArray(def.source)
      ? (def.source as Record<string, unknown>)[ctx.bodyId]
      : def.source;
  if (!source) return null;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return <SvgImage href={source as any} x={0} y={0} width={720} height={1080} preserveAspectRatio="xMidYMid meet" />;
}

/**
 * Desenha o personagem por camadas sobre um canvas lógico fixo de 720×1080.
 * Aceita a aparência e o equipamento; a ordem das camadas vem do manifest.
 */
function AvatarRendererBase({
  appearance,
  equippedItems,
  size,
  crop = 'full',
  showBackground = true,
  accessibilityLabel,
  fillWidth,
  style,
}: AvatarRendererProps) {
  const rawId = useId();
  const uid = useMemo(() => `av${rawId.replace(/[^a-zA-Z0-9]/g, '')}`, [rawId]);
  const layers = useMemo(
    () => resolveLayers(appearance, equippedItems, { showBackground }),
    [appearance, equippedItems, showBackground],
  );
  const base = useMemo(
    () => ({
      g: geometryFor(appearance.bodyId),
      bodyId: appearance.bodyId,
      skin: getOption('skin_tone', appearance.skinToneId)?.color ?? '#CF9A6C',
      hair: getOption('hair_color', appearance.hairColorId)?.color ?? '#3A281D',
      uid,
    }),
    [appearance.bodyId, appearance.skinToneId, appearance.hairColorId, uid],
  );

  let viewBox: string = CROPS[crop];
  let [, , vw, vh] = viewBox.split(' ').map(Number) as [number, number, number, number];
  let width = (size * vw) / vh;
  if (crop === 'full' && fillWidth && fillWidth > width) {
    const extra = (fillWidth / size) * vh - vw;
    viewBox = `${-extra / 2} 0 ${vw + extra} ${vh}`;
    vw += extra;
    width = fillWidth;
  }

  return (
    <View
      style={[{ width, height: size }, style]}
      accessible
      accessibilityRole="image"
      accessibilityLabel={accessibilityLabel ?? 'Personagem'}
    >
      <Svg width={width} height={size} viewBox={viewBox}>
        {layers.map((layer) => (
          <G key={layer.id}>{renderArt(ART_REGISTRY[layer.assetKey], { ...base, params: layer.params })}</G>
        ))}
      </Svg>
    </View>
  );
}

export const AvatarRenderer = memo(AvatarRendererBase);
