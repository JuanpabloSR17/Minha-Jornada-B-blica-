import { memo, useId, useMemo, type ReactElement } from 'react';
import { Image, StyleSheet, View, type ImageSourcePropType, type StyleProp, type ViewStyle } from 'react-native';
import Svg, { G } from 'react-native-svg';
import { ART_REGISTRY } from '../art/registry';
import { CANVAS, CROPS, geometryFor, type AvatarCrop } from '../art/geometry';
import type { ArtContext, ImageArt } from '../art/types';
import { getOption } from '../domain/catalog';
import { resolveLayers, type ResolvedLayer } from '../domain/avatar.layering';
import type { AvatarAppearance, Equipment } from '../domain/avatar.types';

export type AvatarRendererProps = {
  appearance: AvatarAppearance;
  equippedItems: Equipment;
  /** altura em px */
  size: number;
  crop?: AvatarCrop;
  showBackground?: boolean;
  /** largura do contêiner: o canvas é estendido nas laterais (o fundo preenche tudo) */
  fillWidth?: number;
  /** desenha só as camadas destas origens (ex.: ícone de um item isolado) */
  onlySources?: string[];
  /** reservado para poses futuras; hoje só existe "idle" */
  pose?: 'idle';
  accessibilityLabel?: string;
  style?: StyleProp<ViewStyle>;
};

function imageSource(def: ImageArt, bodyId: string): ImageSourcePropType | undefined {
  if (!def.perBody) return def.source as ImageSourcePropType;
  const map = def.source as Partial<Record<string, ImageSourcePropType>>;
  return map[bodyId] ?? map['body-b'];
}

/**
 * Desenha o personagem por camadas sobre o canvas lógico 1024×1536.
 * Camadas vetoriais consecutivas são agrupadas num único <Svg>; camadas de imagem
 * (ilustração final em PNG/WebP) entram como <Image> na posição exata da pilha.
 */
function AvatarRendererBase({
  appearance,
  equippedItems,
  size,
  crop = 'full',
  showBackground = true,
  fillWidth,
  onlySources,
  accessibilityLabel,
  style,
}: AvatarRendererProps) {
  const rawId = useId();
  const uid = useMemo(() => `av${rawId.replace(/[^a-zA-Z0-9]/g, '')}`, [rawId]);
  const layers = useMemo(() => {
    const all = resolveLayers(appearance, equippedItems, { showBackground });
    return onlySources ? all.filter((l) => onlySources.includes(l.source)) : all;
  }, [appearance, equippedItems, showBackground, onlySources]);

  const ctxBase = useMemo(
    () => ({
      g: geometryFor(appearance.bodyId),
      bodyId: appearance.bodyId,
      skin: getOption('skin_tone', appearance.skinToneId)?.color ?? '#AC764B',
      hair: getOption('hair_color', appearance.hairColorId)?.color ?? '#3A281D',
      uid,
    }),
    [appearance.bodyId, appearance.skinToneId, appearance.hairColorId, uid],
  );

  // enquadramento: viewBox do recorte, estendido na horizontal se pedido
  let [vx, vy, vw, vh] = CROPS[crop].split(' ').map(Number) as [number, number, number, number];
  let width = (size * vw) / vh;
  if (fillWidth && fillWidth > width) {
    const extra = (fillWidth / size) * vh - vw;
    vx -= extra / 2;
    vw += extra;
    width = fillWidth;
  }
  const scale = size / vh;
  const viewBox = `${vx} ${vy} ${vw} ${vh}`;
  const canvasStyle = { left: -vx * scale, top: -vy * scale, width: CANVAS.width * scale, height: CANVAS.height * scale };

  // agrupa camadas vetoriais consecutivas
  const chunks: ReactElement[] = [];
  let vectorRun: ResolvedLayer[] = [];
  const flush = () => {
    if (!vectorRun.length) return;
    const run = vectorRun;
    vectorRun = [];
    chunks.push(
      <Svg key={`v${run[0]!.id}`} width={width} height={size} viewBox={viewBox} style={StyleSheet.absoluteFill}>
        {run.map((layer) => {
          const def = ART_REGISTRY[layer.assetKey];
          if (typeof def !== 'function') return null;
          const ctx: ArtContext = { ...ctxBase, params: layer.params };
          return <G key={layer.id}>{def(ctx)}</G>;
        })}
      </Svg>,
    );
  };
  for (const layer of layers) {
    const def = ART_REGISTRY[layer.assetKey];
    if (!def) continue;
    if (typeof def === 'function') {
      vectorRun.push(layer);
      continue;
    }
    flush();
    const source = imageSource(def, appearance.bodyId);
    if (!source) continue;
    chunks.push(
      <Image
        key={layer.id}
        source={source}
        resizeMode="stretch"
        style={[styles.abs, canvasStyle, def.tint ? { tintColor: def.tint === 'skin' ? ctxBase.skin : ctxBase.hair } : null]}
      />,
    );
  }
  flush();

  return (
    <View
      style={[{ width, height: size, overflow: 'hidden' }, style]}
      accessible
      accessibilityRole="image"
      accessibilityLabel={accessibilityLabel ?? 'Personagem'}
    >
      {chunks}
    </View>
  );
}

const styles = StyleSheet.create({ abs: { position: 'absolute' } });

export const AvatarRenderer = memo(AvatarRendererBase);
