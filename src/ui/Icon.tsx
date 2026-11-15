import type { ReactElement } from 'react';
import Svg, { Circle, Path } from 'react-native-svg';

export type IconName =
  | 'home' | 'camp' | 'map' | 'compass' | 'book' | 'scroll' | 'friends' | 'profile'
  | 'back' | 'forward' | 'chevronUp' | 'chevronDown' | 'dice' | 'undo' | 'check'
  | 'cloud' | 'cloudOff' | 'device' | 'lock' | 'none' | 'body' | 'face' | 'hair'
  | 'outfit' | 'sparkle' | 'search' | 'medal' | 'flag' | 'chest' | 'sanctuary'
  | 'coin' | 'clock' | 'pause' | 'play' | 'bag' | 'mountain' | 'crown'
  | 'harp' | 'lamp' | 'cross' | 'ship' | 'sunrise';

/** Ícones de traço simples desenhados para o app (sem biblioteca externa). */
export function Icon({ name, size = 22, color }: { name: IconName; size?: number; color: string }) {
  const s = { stroke: color, strokeWidth: 2, fill: 'none', strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const };
  const paths: Record<IconName, ReactElement> = {
    home: <Path {...s} d="M3 11 12 4l9 7M5 10v10h5v-6h4v6h5V10" />,
    camp: <Path {...s} d="m2.5 19 9.5-15 9.5 15H2.5zm5 0L12 11l4.5 8M11 6l-2-3m4 3 2-3" />,
    map: <Path {...s} d="M9 4 3 6v14l6-2 6 2 6-2V4l-6 2-6-2zM9 4v14M15 6v14" />,
    compass: <><Circle {...s} cx={12} cy={12} r={9} /><Path {...s} d="m15.9 8.1-2 5.8-5.8 2 2-5.8 5.8-2z" /></>,
    book: <Path {...s} d="M4 5c3-1 6-1 8 1 2-2 5-2 8-1v14c-3-1-6-1-8 1-2-2-5-2-8-1V5zM12 6v14" />,
    scroll: <Path {...s} d="M5 4h13a3 3 0 0 1 3 3v2h-5m-8 7V7a3 3 0 0 0-6 0v2h6m0 7H3v1a3 3 0 0 0 3 3h9a3 3 0 0 0 3-3V9m-7 2h4m-4 4h3" />,
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
    forward: <Path {...s} d="m9 5 7 7-7 7" />,
    chevronUp: <Path {...s} d="m6 15 6-6 6 6" />,
    chevronDown: <Path {...s} d="m6 9 6 6 6-6" />,
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
    medal: <Path {...s} d="M7 3h4l3 6M13 3h4l-3 6M10 17l-1 4 3-1.5 3 1.5-1-4m3-4a5 5 0 1 1-10 0 5 5 0 0 1 10 0Zm-5-2v4m-2-2h4" />,
    flag: <Path {...s} d="M5 21V4m0 1c5-3 8 3 14 0v9c-6 3-9-3-14 0m-3 7h7" />,
    chest: <Path {...s} d="M3 10V8a3 3 0 0 1 3-3h12a3 3 0 0 1 3 3v11H3v-9zm0 1h7m4 0h7m-11-1h4v5h-4zM7 16v1m10-1v1" />,
    sanctuary: <Path {...s} d="m3 9 9-5 9 5H3zm2 3v7m5-7v7m4-7v7m5-7v7M3 20h18" />,
    coin: <><Circle {...s} cx={12} cy={12} r={9} /><Path {...s} d="M12 6v12m3-8c-1.5-2-5.4-1.8-5.4.2 0 2.4 5.2 1 5.2 3.5 0 2.1-4.2 2.6-5.8.4" /></>,
    clock: <><Circle {...s} cx={12} cy={12} r={8.5} /><Path {...s} d="M12 7v5l3 1.8" /></>,
    pause: <Path {...s} d="M8 5h2v14H8zM14 5h2v14h-2z" />,
    play: <Path {...s} d="m8 5 11 7-11 7V5z" />,
    bag: <Path {...s} d="M7 8V6a5 5 0 0 1 10 0v2M4 8h16l1 13H3L4 8zm5 5h6" />,
    mountain: <Path {...s} d="m2 19 8-14 5 8 2.5-4 4.5 10H2zm5-9 3 2 3-2" />,
    crown: <Path {...s} d="m3 7 4.5 4.5L12 5l4.5 6.5L21 7l-2 11H5L3 7zm2 14h14" />,
    harp: <Path {...s} d="M6 4v11a5 5 0 0 0 9 3l4-8c0-2-2-3-4-2l-9 4m3-1v7m3-8v7m3-8v5" />,
    lamp: <Path {...s} d="M4 16h15l-3 4H7l-3-4zm1.5 0c1-2.5 3-4 6-4h3a4 4 0 0 1 4 4m-5-6c-1.8-1.5-1.1-3.1.5-5 2 2.2 1.6 3.5-.5 5z" />,
    cross: <Path {...s} d="M10.5 3.5h3v5h5v3h-5v9h-3v-9h-5v-3h5v-5z" />,
    ship: <Path {...s} d="M4 15h16l-3 5H7l-3-5zm8 0V4l6 8h-6M6 12l3-5v5H6z" />,
    sunrise: <Path {...s} d="M4 18h16M7 15a5 5 0 0 1 10 0m-5-9V4m7 5 1.5-1.5M5 9 3.5 7.5M3 15h1m16 0h1" />,
    cloud: <Path {...s} d="M7 18h10a4 4 0 0 0 .5-8A6 6 0 0 0 6 9.5 4.3 4.3 0 0 0 7 18zM9.5 13.5l2 2 3.5-4" />,
    cloudOff: <Path {...s} d="M7 18h10a4 4 0 0 0 .5-8A6 6 0 0 0 6 9.5 4.3 4.3 0 0 0 7 18zM10 11l4 4M14 11l-4 4" />,
    device: <Path {...s} d="M8 3h8a1 1 0 0 1 1 1v16a1 1 0 0 1-1 1H8a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1zM11 18h2" />,
    lock: <Path {...s} d="M6 11h12v9H6zM8.5 11V8a3.5 3.5 0 0 1 7 0v3" />,
    none: (
      <>
        <Circle {...s} cx={12} cy={12} r={8} />
        <Path {...s} d="M6.5 17.5l11-11" />
      </>
    ),
    body: (
      <>
        <Circle {...s} cx={12} cy={4.5} r={2.2} />
        <Path {...s} d="M7 9.5c3-1.3 7-1.3 10 0M12 9v6M9.5 21l2.5-6 2.5 6M8 9.8 6.5 15M16 9.8l1.5 5.2" />
      </>
    ),
    face: (
      <>
        <Path {...s} d="M12 3c4 0 6.5 3 6.5 7.5S16 21 12 21s-6.5-6-6.5-10.5S8 3 12 3z" />
        <Path {...s} d="M9.5 10v.5M14.5 10v.5M10 15c1.2.8 2.8.8 4 0" />
      </>
    ),
    hair: <Path {...s} d="M5 14c-1-6 2.5-10 7-10s8 4 7 10M5 14c1 2 2 4 1 6M19 14c-1 2-2 4-1 6M8 8c2 2 6 2 8 0" />,
    outfit: <Path {...s} d="M9 3h6l4 3-2 4-2-1v12H9V9L7 10 5 6l4-3zM9 3c0 2 1.5 3 3 3s3-1 3-3" />,
    search: (
      <>
        <Circle {...s} cx={10.5} cy={10.5} r={6} />
        <Path {...s} d="M15 15l5 5" />
      </>
    ),
    sparkle: <Path {...s} d="M12 3l1.8 5.2L19 10l-5.2 1.8L12 17l-1.8-5.2L5 10l5.2-1.8zM19 16l.7 2 2 .7-2 .7-.7 2-.7-2-2-.7 2-.7z" />,
  };
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" aria-hidden accessibilityElementsHidden importantForAccessibility="no">
      {paths[name]}
    </Svg>
  );
}
