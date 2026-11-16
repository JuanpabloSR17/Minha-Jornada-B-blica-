import type { ReactElement } from 'react';
import Svg, { Circle, Ellipse, Path } from 'react-native-svg';

export type IconName = 'home' | 'map' | 'book' | 'friends' | 'profile' | 'back' | 'dice' | 'undo' | 'check' | 'cloud' | 'cloudOff' | 'device' | 'lock' | 'none' | 'body' | 'face' | 'hair' | 'outfit' | 'sparkle' | 'search' | 'medal' | 'coin' | 'shop' | 'trophy' | 'flag' | 'chest' | 'play' | 'scroll' | 'compass'
  | 'lamp' | 'tabernacle' | 'stones' | 'manna';

/** Folhas de um ramo de louro (coroa), espelhadas para o lado direito. */
const LAUREL = [
  [8.4, 19.0, -62], [6.4, 16.6, -40], [5.3, 13.6, -16], [5.2, 10.4, 6], [6.0, 7.4, 28],
] as const;

/**
 * Ícones desenhados para o app (sem biblioteca externa). Os da jornada são em dois tons: traço
 * e um preenchimento suave da mesma cor, com referências bíblicas (tenda do acampamento, rolo,
 * lâmpada de azeite, pedras memoriais, vaso do maná, tabernáculo).
 */
export function Icon({ name, size = 22, color }: { name: IconName; size?: number; color: string }) {
  const s = { stroke: color, strokeWidth: 1.8, fill: 'none', strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const };
  /** traço + preenchimento suave (segundo tom) */
  const t = { ...s, fill: color, fillOpacity: 0.22 };
  /** detalhe cheio */
  const d = { fill: color, stroke: 'none' };
  const paths: Record<IconName, ReactElement> = {
    home: (
      <>
        <Path {...t} d="M2.6 19.5 12 4.6l9.4 14.9z" />
        <Path {...d} fillOpacity={0.55} d="M12 10.6 8.9 19.5h6.2z" />
        <Path {...s} d="M12 4.6v14.9M1.5 19.5h21M12 4.6V2.4l2.6 1-2.6 1" />
      </>
    ),
    map: (
      <>
        <Path {...t} d="M5 5.5a2 2 0 0 1 2-2h11.5v14H7a2 2 0 0 0-2 2z" />
        <Path {...s} d="M5 19.5a2 2 0 0 0 2 2h12.5v-4" />
        <Path {...s} strokeDasharray="1.4 1.8" d="M8.4 14.8c1.4-1.9 2.9-.9 3.9-2.9s2.4-2.4 3.2-3.6" />
        <Path {...s} d="M14.8 5.8l2.2 2.2M17 5.8l-2.2 2.2" />
      </>
    ),
    book: (
      <>
        <Path {...t} d="M12 6.6C10 5 7 4.5 3.4 5v13.2c3.6-.5 6.6 0 8.6 1.6 2-1.6 5-2.1 8.6-1.6V5C17 4.5 14 5 12 6.6z" />
        <Path {...s} d="M12 6.6v13.2M6 9.2h3.6M6 12h3.6M6 14.8h2.4M14.4 9.2H18M14.4 12H18" />
        <Path {...d} d="M15.2 15.2h2.6v6l-1.3-1-1.3 1z" />
      </>
    ),
    friends: (
      <>
        <Circle {...t} cx={8} cy={6.2} r={2.3} />
        <Circle {...t} cx={15.2} cy={7.4} r={2} />
        <Path {...t} d="M3.6 20.5 5.2 12c.4-1.6 1.6-2.6 2.8-2.6s2.4 1 2.8 2.6l1.6 8.5z" />
        <Path {...t} d="M12.4 20.5l1.1-7.2c.3-1.4 1-2 1.7-2s1.4.6 1.7 2l1.1 7.2z" />
        <Path {...s} d="M20.6 20.5V5.2c0-1-1.6-1.3-2 0" />
      </>
    ),
    profile: (
      <>
        <Path {...t} d="M12 2.8c-4 0-6.6 3.3-6.6 7.6 0 1.6.4 3 1 4.2L5 21.2h14l-1.4-6.6c.6-1.2 1-2.6 1-4.2 0-4.3-2.6-7.6-6.6-7.6z" />
        <Path {...d} fillOpacity={0.6} d="M12 6.8c-2 0-3.2 1.7-3.2 3.7 0 2.1 1.4 3.7 3.2 3.7s3.2-1.6 3.2-3.7c0-2-1.2-3.7-3.2-3.7z" />
        <Path {...s} d="M9 21.2l1.4-4.4h3.2l1.4 4.4" />
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
    medal: <Path {...s} d="M7 3h4l3 6M13 3h4l-3 6M10 17l-1 4 3-1.5 3 1.5-1-4m3-4a5 5 0 1 1-10 0 5 5 0 0 1 10 0Zm-5-2v4m-2-2h4" />,
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
    outfit: (
      <>
        <Path {...t} d="M8.6 3.4h6.8l4.6 3.1-2 4.2-2-1.1v10.9H8V9.6l-2 1.1-2-4.2z" />
        <Path {...s} d="M10 3.4c.3 1.7 1 2.5 2 2.5s1.7-.8 2-2.5" />
        <Path {...s} strokeWidth={2.6} d="M8 13.2h8" />
        <Path {...s} strokeDasharray="1 1.4" d="M8.8 18h6.4M12 6.8v4.8" />
      </>
    ),
    search: (
      <>
        <Circle {...s} cx={10.5} cy={10.5} r={6} />
        <Path {...s} d="M15 15l5 5" />
      </>
    ),
    coin: (
      <>
        <Circle {...t} cx={12} cy={12} r={8.4} />
        <Circle {...s} cx={12} cy={12} r={6} strokeDasharray="1 1.6" />
        <Path {...d} d="M9.6 8.6h4.8c0 2.2-1 3.6-2.4 3.6s-2.4-1.4-2.4-3.6z" />
        <Path {...s} d="M12 12.2v2.6M10.2 15.2h3.6" />
      </>
    ),
    shop: (
      <>
        <Path {...t} d="M3 9.6 4.6 4h14.8L21 9.6a2.25 2 0 0 1-4.5 0 2.25 2 0 0 1-4.5 0 2.25 2 0 0 1-4.5 0A2.25 2 0 0 1 3 9.6z" />
        <Path {...s} d="M8.2 4l-.7 5.6M12 4v5.6M15.8 4l.7 5.6M4.6 11.4v9.1M19.4 11.4v9.1M3 15.6h18M2.4 20.5h19.2" />
        <Path {...t} d="M9.2 15.6v-2.3c0-.8.6-1.3 1.3-1.3h1.4c.7 0 1.3.5 1.3 1.3v2.3z" />
        <Circle {...d} cx={16} cy={14.4} r={1.2} />
      </>
    ),
    trophy: (
      <>
        {LAUREL.map(([x, y, a], i) => (
          <Ellipse key={`l${i}`} {...t} cx={x} cy={y} rx={1.05} ry={2.1} transform={`rotate(${a} ${x} ${y})`} />
        ))}
        {LAUREL.map(([x, y, a], i) => (
          <Ellipse key={`r${i}`} {...t} cx={24 - x} cy={y} rx={1.05} ry={2.1} transform={`rotate(${-a} ${24 - x} ${y})`} />
        ))}
        <Path {...s} d="M11.2 21C7.9 20.2 6.1 17 6.1 12.8c0-2.2.6-4.2 1.7-5.8M12.8 21c3.3-.8 5.1-4 5.1-8.2 0-2.2-.6-4.2-1.7-5.8" />
        <Path {...d} d="M12 4.2l1 2.1 2.3.3-1.7 1.6.4 2.3L12 9.4l-2 1.1.4-2.3-1.7-1.6 2.3-.3z" />
      </>
    ),
    flag: <Path {...s} d="M6 21V4M6 4h10l-2 3.5L16 11H6" />,
    chest: <Path {...s} d="M4 10c0-3 2.5-5 8-5s8 2 8 5v9H4v-9zM4 11h16M11 10.5h2V14h-2z" />,
    play: <Path d="M8 5.5v13l10.5-6.5z" fill={color} stroke={color} strokeWidth={1.5} strokeLinejoin="round" />,
    scroll: <Path {...s} d="M7 4h10a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H7M7 4a2 2 0 0 0-2 2v1h4V6a2 2 0 0 0-2-2zM7 20a2 2 0 0 1-2-2v-1h4v1a2 2 0 0 1-2 2zM11 9h5M11 12h5M11 15h3" />,
    compass: (
      <>
        <Circle {...s} cx={12} cy={12} r={8.5} />
        <Path {...s} d="M15.5 8.5 13.4 13.4 8.5 15.5 10.6 10.6z" />
      </>
    ),
    lamp: (
      <>
        <Path {...t} d="M3.4 13.6c2.6 2.4 6.2 3.2 9.8 2.6 3-.5 5.4-1.9 6.9-3.9-2.6.3-4.6-.3-6-1.4-2.8-.3-6.6.3-10.7 2.7z" />
        <Path {...d} d="M5.2 10.6c-1.4-1.3-1.1-3.1.6-4.7.2 1.4 1.4 1.9 1.4 3.2 0 1-.9 1.7-2 1.5z" />
        <Path {...s} d="M20.1 12.3c1-.2 1.6-1.2 1.1-2-.5-.8-1.7-.6-2.1.2M9.2 16.6 8.2 19h7.6l-1-2.8M12.6 11.6c.3-.8 1.2-1.2 2-1" />
      </>
    ),
    tabernacle: (
      <>
        <Path {...t} d="M2 20V14.6h20V20z" />
        <Path {...s} d="M5.6 14.6V20M9 14.6V20M15 14.6V20M18.4 14.6V20M1.4 20h21.2" />
        <Path {...t} d="M8 14.6V9.4l4-3.2 4 3.2v5.2z" />
        <Path {...d} fillOpacity={0.6} d="M10.9 14.6v-3h2.2v3z" />
        <Path {...t} d="M9.6 5.6a1.5 1.5 0 0 1 1.9-2.2 1.9 1.9 0 0 1 3.4.7 1.3 1.3 0 0 1-.2 2.6H10.3a1.2 1.2 0 0 1-.7-1.1z" />
      </>
    ),
    stones: (
      <>
        <Path {...t} d="M2.8 20.6c0-2.1 1.8-3.4 4.6-3.4h9.2c2.8 0 4.6 1.3 4.6 3.4z" />
        <Path {...t} d="M5.8 17.2c0-2 1.6-3.3 3.9-3.3h4.6c2.3 0 3.9 1.3 3.9 3.3z" />
        <Path {...t} d="M8.6 13.9c0-2.1 1.5-3.6 3.4-3.6s3.4 1.5 3.4 3.6z" />
        <Path {...d} d="M12 2.6l.8 2 2 .8-2 .8-.8 2-.8-2-2-.8 2-.8z" />
      </>
    ),
    manna: (
      <>
        <Path {...t} d="M9 6.6c0 1.3-3.1 2.9-3.1 7.1 0 3.6 2.7 6.6 6.1 6.6s6.1-3 6.1-6.6c0-4.2-3.1-5.8-3.1-7.1z" />
        <Path {...t} d="M8.4 3.8h7.2v2.8H8.4z" />
        <Circle {...d} cx={10.4} cy={13} r={1} />
        <Circle {...d} cx={13.4} cy={12.2} r={1} />
        <Circle {...d} cx={12} cy={15.4} r={1} />
        <Circle {...d} cx={14.4} cy={15.6} r={0.9} />
        <Circle {...d} cx={9.8} cy={16} r={0.8} />
      </>
    ),
    sparkle: <Path {...s} d="M12 3l1.8 5.2L19 10l-5.2 1.8L12 17l-1.8-5.2L5 10l5.2-1.8zM19 16l.7 2 2 .7-2 .7-.7 2-.7-2-2-.7 2-.7z" />,
  };
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" accessibilityElementsHidden importantForAccessibility="no">
      {paths[name]}
    </Svg>
  );
}
