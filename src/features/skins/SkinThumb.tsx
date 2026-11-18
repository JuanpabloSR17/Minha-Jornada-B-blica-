import { View } from 'react-native';
import { AvatarRenderer } from '@/features/avatar/components/AvatarRenderer';
import { FirelightPortrait } from '@/features/avatar/styles/cinematic';
import { wearFrom } from '@/features/avatar/styles/archetypes';
import { paintedBody, skinLook, styleLook, type Skin, type SkinVariant } from './catalog';

/**
 * Miniatura (busto) de uma skin no estilo escolhido: o recorte da pintura 2.5D entregue, quando
 * existe; senão, o busto provisório à luz da fogueira com o traje de prévia.
 */
export function SkinThumb({ skin, size, variant = 'padrao', style = 1 }: { skin: Skin; size: number; variant?: SkinVariant; style?: number }) {
  if (paintedBody(skin.id, style, variant)) {
    const look = skinLook(null, { skinId: skin.id, style, variant });
    return (
      <View style={{ width: size, height: size, overflow: 'hidden', alignItems: 'center' }} testID={`thumb-painted-${skin.id}`}>
        <AvatarRenderer appearance={look.appearance} equippedItems={{}} painted={look.painted} size={size} fillWidth={size}
          crop="bust" showBackground={false} accessibilityLabel="" />
      </View>
    );
  }
  return <FirelightPortrait look={styleLook(skin.styles[style - 1] ?? skin.styles[0]!)} wear={wearFrom(skin.preview)} width={size} />;
}
