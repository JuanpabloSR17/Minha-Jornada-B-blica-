import type { ReactElement } from 'react';
import Svg, { Circle, Path } from 'react-native-svg';

export type IconName = 'home' | 'map' | 'book' | 'friends' | 'profile' | 'back' | 'dice' | 'undo' | 'check' | 'cloud' | 'cloudOff' | 'device' | 'lock';

/** Ícones de traço simples desenhados para o app (sem biblioteca externa). */
export function Icon({ name, size = 22, color }: { name: IconName; size?: number; color: string }) {
  const s = { stroke: color, strokeWidth: 2, fill: 'none', strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const };
  const paths: Record<IconName, ReactElement> = {
    home: <Path {...s} d="M3 11 12 4l9 7M5 10v10h5v-6h4v6h5V10" />,
    map: <Path {...s} d="M9 4 3 6v14l6-2 6 2 6-2V4l-6 2-6-2zM9 4v14M15 6v14" />,
    book: <Path {...s} d="M4 5c3-1 6-1 8 1 2-2 5-2 8-1v14c-3-1-6-1-8 1-2-2-5-2-8-1V5zM12 6v14" />,
    friends: (
      <>
        <Circle {...s} cx={9} cy={8} r={3.2} />
        <Path {...s} d="M3 20c0-3.5 2.7-6 6-6s6 2.5 6 6M15.5 5.2a3 3 0 0 1 0 5.6M17 14.3c2.4.7 4 2.8 4 5.7" />
      </>
    ),
    profile: (
      <>
        <Circle {...s} cx={12} cy={8} r={4} />
        <Path {...s} d="M4 21c0-4.4 3.6-7 8-7s8 2.6 8 7" />
      </>
    ),
    back: <Path {...s} d="M15 5l-7 7 7 7" />,
    dice: (
      <>
        <Path {...s} d="M5 4h14a1 1 0 0 1 1 1v14a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V5a1 1 0 0 1 1-1z" />
        <Circle cx={8.5} cy={8.5} r={1.3} fill={color} />
        <Circle cx={15.5} cy={15.5} r={1.3} fill={color} />
        <Circle cx={12} cy={12} r={1.3} fill={color} />
      </>
    ),
    undo: <Path {...s} d="M9 7 4 12l5 5M4 12h11a5 5 0 0 1 0 10h-2" />,
    check: <Path {...s} d="M4 12.5 9.5 18 20 6" />,
    cloud: <Path {...s} d="M7 18h10a4 4 0 0 0 .5-8A6 6 0 0 0 6 9.5 4.3 4.3 0 0 0 7 18zM9.5 13.5l2 2 3.5-4" />,
    cloudOff: <Path {...s} d="M7 18h10a4 4 0 0 0 .5-8A6 6 0 0 0 6 9.5 4.3 4.3 0 0 0 7 18zM10 11l4 4M14 11l-4 4" />,
    device: <Path {...s} d="M8 3h8a1 1 0 0 1 1 1v16a1 1 0 0 1-1 1H8a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1zM11 18h2" />,
    lock: <Path {...s} d="M6 11h12v9H6zM8.5 11V8a3.5 3.5 0 0 1 7 0v3" />,
  };
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" accessibilityElementsHidden importantForAccessibility="no">
      {paths[name]}
    </Svg>
  );
}
