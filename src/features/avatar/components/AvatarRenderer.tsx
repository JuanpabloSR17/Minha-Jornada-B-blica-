import { memo, useId, useMemo, type ReactElement } from 'react';
import { Image, StyleSheet, View, type ImageSourcePropType, type StyleProp, type ViewStyle } from 'react-native';
import Svg, { G } from 'react-native-svg';
import { ART_REGISTRY } from '../art/registry';
import { CANVAS, CROPS, geometryFor, type AvatarCrop } from '../art/geometry';
import type { ArtContext, VectorArt } from '../art/types';
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
  /** desenha só estas camadas (ferramentas internas de exportação) */
  onlyLayers?: string[];
  /** reservado para poses futuras; hoje só existe "idle" */
  pose?: 'idle';
  accessibilityLabel?: string;
  style?: StyleProp<ViewStyle>;
};

type Resolved =
  | { type: 'vector'; fn: VectorArt }
  | { type: 'image'; parts: { source: ImageSourcePropType; tint?: 'skin' | 'hair' }[] };

/**
 * Resolve a arte de uma camada para um corpo. Política de variantes:
 * versão do corpo → versão "all" → arte provisória (vetor) da mesma camada → nada.
 */
export function resolveArt(key: string, bodyId: string): Resolved | null {
  const def = ART_REGISTRY[key];
  if (!def) return null;
  if (typeof def === 'function') return { type: 'vector', fn: def };
  const parts = def.parts
    .map((pt) => ({ source: pt.sources[bodyId] ?? pt.sources.all, tint: pt.tint }))
    .filter((pt): pt is { source: ImageSourcePropType; tint: 'skin' | 'hair' | undefined } => !!pt.source);
  if (parts.length) return { type: 'image', parts };
  const fb = def.fallback ? ART_REGISTRY[def.fallback] : undefined;
  return typeof fb === 'function' ? { type: 'vector', fn: fb } : null;
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
  onlyLayers,
  accessibilityLabel,
  style,
}: AvatarRendererProps) {
  const rawId = useId();
  const uid = useMemo(() => `av${rawId.replace(/[^a-zA-Z0-9]/g, '')}`, [rawId]);
  const layers = useMemo(() => {
    const all = resolveLayers(appearance, equippedItems, { showBackground });
    return all.filter((l) => (!onlySources || onlySources.includes(l.source)) && (!onlyLayers || onlyLayers.includes(l.slot)));
  }, [appearance, equippedItems, showBackground, onlySources, onlyLayers]);

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

  // agrupa camadas vetoriais consecutivas num único <Svg>; imagens entram na posição exata da pilha
  const chunks: ReactElement[] = [];
  let vectorRun: { layer: ResolvedLayer; fn: VectorArt }[] = [];
  const flush = () => {
    if (!vectorRun.length) return;
    const run = vectorRun;
    vectorRun = [];
    chunks.push(
      <Svg key={`v${run[0]!.layer.id}`} width={width} height={size} viewBox={viewBox} style={StyleSheet.absoluteFill}>
        {run.map(({ layer, fn }) => {
          const ctx: ArtContext = { ...ctxBase, params: layer.params };
          return <G key={layer.id}>{fn(ctx)}</G>;
        })}
      </Svg>,
    );
  };
  for (const layer of layers) {
    const art = resolveArt(layer.assetKey, appearance.bodyId);
    if (!art) continue;
    if (art.type === 'vector') {
      vectorRun.push({ layer, fn: art.fn });
      continue;
    }
    flush();
    art.parts.forEach((pt, i) =>
      chunks.push(
        <Image
          key={`${layer.id}#${i}`}
          source={pt.source}
          resizeMode="stretch"
          style={[styles.abs, canvasStyle, pt.tint ? { tintColor: pt.tint === 'skin' ? ctxBase.skin : ctxBase.hair } : null]}
        />,
      ),
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
