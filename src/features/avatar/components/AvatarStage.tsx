import { useState, type ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';
import Svg, { Defs, Ellipse, RadialGradient, Stop } from 'react-native-svg';
import { useTheme } from '@/theme/ThemeProvider';
import { radius } from '@/theme/tokens';
import { AvatarRenderer } from './AvatarRenderer';
import type { AvatarLook } from '../domain/avatar.types';
import { describeLook } from '../domain/describe';
import { fmt, strings } from '@/i18n';

/** Palco da prévia: moldura de pergaminho com o personagem em destaque. */
export function AvatarStage({ look, height, children }: { look: AvatarLook; height: number; children?: ReactNode }) {
  const { colors } = useTheme();
  const [width, setWidth] = useState(0);
  return (
    <View onLayout={(e) => setWidth(e.nativeEvent.layout.width - 4)} style={[styles.stage, { height, backgroundColor: colors.stage, borderColor: colors.borderStrong }]}>
      <Svg style={StyleSheet.absoluteFill} viewBox="0 0 100 100" preserveAspectRatio="none" accessibilityElementsHidden importantForAccessibility="no">
        <Defs>
          <RadialGradient id="stageGlow" cx="50%" cy="45%" r="60%">
            <Stop offset="0" stopColor={colors.surfaceRaised} stopOpacity={0.9} />
            <Stop offset="1" stopColor={colors.surfaceRaised} stopOpacity={0} />
          </RadialGradient>
        </Defs>
        <Ellipse cx={50} cy={45} rx={60} ry={60} fill="url(#stageGlow)" />
      </Svg>
      <AvatarRenderer
        appearance={look.appearance}
        equippedItems={look.equipment}
        size={height - 4}
        fillWidth={width || undefined}
        accessibilityLabel={fmt(strings.creator.previewLabel, { summary: describeLook(look) })}
      />
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  stage: {
    borderRadius: radius.xl,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
});
