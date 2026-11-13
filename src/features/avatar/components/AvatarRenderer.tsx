import { memo, useId, useMemo, type ReactElement } from 'react';
import { Image, StyleSheet, View, type ImageSourcePropType, type StyleProp, type ViewStyle } from 'react-native';
import Svg, { Defs, G, Image as SvgImage, LinearGradient, Mask, RadialGradient, Rect, Stop } from 'react-native-svg';
import { ART_REGISTRY } from '../art/registry';
import { CANVAS, CROPS, geometryFor, type ArmPose, type AvatarCrop } from '../art/geometry';
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
  /**
   * Luz da cena sobre o personagem, recortada pela silhueta: `camp` = noite azulada com reflexo quente
   * da fogueira à direita; `neutral` (padrão) = luz neutra, para comparar peças no guarda-roupa.
   */
  lighting?: 'neutral' | 'camp';
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
/** Camadas cuja arte muda com a pose do braço (variante `.staff` dos arquivos pintados). */
const POSE_LAYERS = ['arms', 'hands', 'sleeves', 'cloak_front'];

export function resolveArt(key: string, bodyId: string, armPose: ArmPose = 'rest'): Resolved | null {
  const def = ART_REGISTRY[key];
  if (!def) return null;
  if (typeof def === 'function') return { type: 'vector', fn: def };
  // pose: usa a variante da pose; numa camada que depende da pose e não tem a variante, cai no vetor
  const layer = key.split('#')[1] ?? '';
  const posed = def.parts.filter((pt) => (pt.pose ?? 'rest') === armPose);
  const candidates = armPose !== 'rest' && POSE_LAYERS.includes(layer) ? posed : posed.length ? posed : def.parts.filter((pt) => !pt.pose);
  const parts = candidates
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
  lighting = 'neutral',
}: AvatarRendererProps) {
  const rawId = useId();
  const uid = useMemo(() => `av${rawId.replace(/[^a-zA-Z0-9]/g, '')}`, [rawId]);
  const { layers, armPose } = useMemo(() => {
    const all = resolveLayers(appearance, equippedItems, { showBackground });
    // a pose dos braços depende do conjunto equipado (ex.: o cajado dobra o braço direito)
    const pose = all.some((l) => l.params.armPose === 'staff') ? ('staff' as const) : ('rest' as const);
    return {
      layers: all.filter((l) => (!onlySources || onlySources.includes(l.source)) && (!onlyLayers || onlyLayers.includes(l.slot))),
      armPose: pose,
    };
  }, [appearance, equippedItems, showBackground, onlySources, onlyLayers]);

  const ctxBase = useMemo(
    () => ({
      g: geometryFor(appearance.bodyId),
      bodyId: appearance.bodyId,
      skin: getOption('skin_tone', appearance.skinToneId)?.color ?? '#AC764B',
      hair: getOption('hair_color', appearance.hairColorId)?.color ?? '#3A281D',
      hairStyle: appearance.hairStyleId,
      armPose,
      uid,
    }),
    [appearance.bodyId, appearance.skinToneId, appearance.hairColorId, appearance.hairStyleId, armPose, uid],
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
  /** silhueta de todas as camadas (vetor e imagem), usada como máscara da luz da cena */
  const silhouette: ReactElement[] = [];
  let vectorRun: { layer: ResolvedLayer; fn: VectorArt }[] = [];
  const flush = () => {
    if (!vectorRun.length) return;
    const run = vectorRun;
    vectorRun = [];
    const draw = (suffix: string) =>
      run.map(({ layer, fn }) => {
        const ctx: ArtContext = { ...ctxBase, params: layer.params };
        return <G key={`${layer.id}${suffix}`}>{fn(ctx)}</G>;
      });
    chunks.push(
      <Svg key={`v${run[0]!.layer.id}`} width={width} height={size} viewBox={viewBox} style={StyleSheet.absoluteFill}>
        {draw('')}
      </Svg>,
    );
    if (lighting === 'camp') silhouette.push(...draw('#m'));
  };
  for (const layer of layers) {
    const art = resolveArt(layer.assetKey, appearance.bodyId, armPose);
    if (!art) continue;
    if (art.type === 'vector') {
      vectorRun.push({ layer, fn: art.fn });
      continue;
    }
    flush();
    art.parts.forEach((pt, i) => {
      chunks.push(
        <Image
          key={`${layer.id}#${i}`}
          source={pt.source}
          resizeMode="stretch"
          style={[styles.abs, canvasStyle, pt.tint ? { tintColor: pt.tint === 'skin' ? ctxBase.skin : ctxBase.hair } : null]}
        />,
      );
      if (lighting === 'camp') {
        silhouette.push(<SvgImage key={`${layer.id}#${i}#m`} href={pt.source} x={0} y={0} width={CANVAS.width} height={CANVAS.height} preserveAspectRatio="none" />);
      }
    });
  }
  flush();
  // luz da cena por cima de tudo, recortada pela silhueta (vale para arte vetorial e pintada)
  if (lighting === 'camp' && silhouette.length) {
    chunks.push(
      <Svg key="light" width={width} height={size} viewBox={viewBox} style={StyleSheet.absoluteFill} pointerEvents="none">
        <CampLight id={`${uid}l`}>{silhouette}</CampLight>
      </Svg>,
    );
  }

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

/**
 * Luz do acampamento sobre o personagem: as próprias camadas viram uma máscara (alfa) e só a
 * silhueta recebe o tom azul da noite (esquerda/alto) e o reflexo quente da fogueira (direita/baixo).
 */
function CampLight({ id, children }: { id: string; children: ReactElement[] }) {
  return (
    <>
      <Defs>
        <Mask id={`${id}-m`} maskType="alpha" maskUnits="userSpaceOnUse" x={-400} y={0} width={1824} height={1536}>
          <G>{children}</G>
        </Mask>
        <LinearGradient id={`${id}-n`} gradientUnits="userSpaceOnUse" x1={300} y1={300} x2={780} y2={700}>
          <Stop offset="0" stopColor="#16245C" stopOpacity={0.42} />
          <Stop offset="0.5" stopColor="#16245C" stopOpacity={0.14} />
          <Stop offset="1" stopColor="#16245C" stopOpacity={0.02} />
        </LinearGradient>
        <RadialGradient id={`${id}-f`} gradientUnits="userSpaceOnUse" cx={980} cy={1050} r={620}>
          <Stop offset="0" stopColor="#FF9440" stopOpacity={0.5} />
          <Stop offset="0.55" stopColor="#FF8A3A" stopOpacity={0.18} />
          <Stop offset="1" stopColor="#FF8A3A" stopOpacity={0} />
        </RadialGradient>
      </Defs>
      <G mask={`url(#${id}-m)`}>
        <Rect x={-400} y={0} width={1824} height={1536} fill={`url(#${id}-n)`} />
        <Rect x={-400} y={0} width={1824} height={1536} fill={`url(#${id}-f)`} />
      </G>
    </>
  );
}

const styles = StyleSheet.create({ abs: { position: 'absolute' } });

export const AvatarRenderer = memo(AvatarRendererBase);
