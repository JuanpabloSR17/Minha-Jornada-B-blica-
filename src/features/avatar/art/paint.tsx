import { LinearGradient, RadialGradient, Stop } from 'react-native-svg';
import { shade } from './color';

/** Gradiente horizontal de volume: bordas mais escuras, luz levemente à esquerda. */
export function VolumeGradient({ id, base, edge = -0.24, light = 0.1 }: { id: string; base: string; edge?: number; light?: number }) {
  return (
    <LinearGradient id={id} x1="0" y1="0" x2="1" y2="0">
      <Stop offset="0" stopColor={shade(base, edge)} />
      <Stop offset="0.22" stopColor={base} />
      <Stop offset="0.42" stopColor={shade(base, light)} />
      <Stop offset="0.7" stopColor={base} />
      <Stop offset="1" stopColor={shade(base, edge * 1.15)} />
    </LinearGradient>
  );
}

export function VerticalGradient({ id, top, bottom }: { id: string; top: string; bottom: string }) {
  return (
    <LinearGradient id={id} x1="0" y1="0" x2="0" y2="1">
      <Stop offset="0" stopColor={top} />
      <Stop offset="1" stopColor={bottom} />
    </LinearGradient>
  );
}

export function SoftRadial({ id, color, opacity = 1 }: { id: string; color: string; opacity?: number }) {
  return (
    <RadialGradient id={id} cx="50%" cy="50%" r="50%">
      <Stop offset="0" stopColor={color} stopOpacity={opacity} />
      <Stop offset="1" stopColor={color} stopOpacity={0} />
    </RadialGradient>
  );
}

export const url = (id: string) => `url(#${id})`;
