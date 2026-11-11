import { useEffect, useRef, useState, type ReactNode } from 'react';
import { Animated, Platform, StyleSheet, View } from 'react-native';
import { useTheme } from '@/theme/ThemeProvider';
import { radius } from '@/theme/tokens';
import { fmt, strings } from '@/i18n';
import { AvatarRenderer } from './AvatarRenderer';
import type { AvatarCrop } from '../art/geometry';
import type { AvatarLook } from '../domain/avatar.types';
import { looksEqual } from '../domain/avatar.rules';
import { describeLook } from '../domain/describe';

type Shot = { look: AvatarLook; camera: AvatarCrop; key: number };

/**
 * Palco do personagem: ocupa a área principal, com transição suave (crossfade)
 * ao trocar peças e "zoom de câmera" entre corpo inteiro e retrato.
 * Respeita a preferência de movimento reduzido.
 */
export function AvatarStage({
  look,
  height,
  camera = 'full',
  children,
}: {
  look: AvatarLook;
  height: number;
  camera?: AvatarCrop;
  children?: ReactNode;
}) {
  const { colors, reduceMotion } = useTheme();
  const [width, setWidth] = useState(0);
  const [current, setCurrent] = useState<Shot>({ look, camera, key: 0 });
  const [previous, setPrevious] = useState<Shot | null>(null);
  const fade = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (looksEqual(current.look, look) && current.camera === camera) return;
    const next = { look, camera, key: current.key + 1 };
    if (reduceMotion) {
      setCurrent(next);
      return;
    }
    const cameraMove = camera !== current.camera;
    setPrevious(current);
    setCurrent(next);
    fade.setValue(1);
    Animated.timing(fade, { toValue: 0, duration: cameraMove ? 320 : 200, useNativeDriver: Platform.OS !== 'web' }).start(({ finished }) => {
      if (finished) setPrevious(null);
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [look, camera]);

  const render = (shot: Shot) => (
    <AvatarRenderer
      appearance={shot.look.appearance}
      equippedItems={shot.look.equipment}
      size={height - 4}
      crop={shot.camera}
      fillWidth={width ? width - 4 : undefined}
      accessibilityLabel={fmt(strings.creator.previewLabel, { summary: describeLook(shot.look) })}
    />
  );

  return (
    <View
      onLayout={(e) => setWidth(Math.round(e.nativeEvent.layout.width))}
      style={[styles.stage, { height, backgroundColor: colors.stage, borderColor: colors.borderStrong }]}
    >
      {width ? render(current) : null}
      {previous && width ? (
        <Animated.View pointerEvents="none" style={[styles.overlay, { opacity: fade }]}>
          {render(previous)}
        </Animated.View>
      ) : null}
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  stage: { overflow: 'hidden', alignItems: 'center', justifyContent: 'center', borderRadius: radius.xl, borderWidth: 2 },
  overlay: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, alignItems: 'center', justifyContent: 'center' },
});
