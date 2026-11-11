import { Circle, Defs, G, LinearGradient, Path, Rect, Stop } from 'react-native-svg';
import { SoftRadial, url } from '../paint';
import type { VectorArt } from '../types';

/** Fundo: paisagem suave do deserto da Judeia ao entardecer (estende-se além do canvas). */
export const background: Record<string, VectorArt> = {
  parchment: (ctx) => {
    const sky = `${ctx.uid}-bgsky`;
    const sun = `${ctx.uid}-bgsun`;
    const ground = `${ctx.uid}-bgground`;
    return (
      <G>
        <Defs>
          <LinearGradient id={sky} x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0" stopColor="#C9D8DA" />
            <Stop offset="0.45" stopColor="#F2E6CB" />
            <Stop offset="1" stopColor="#EBCF9C" />
          </LinearGradient>
          <LinearGradient id={ground} x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0" stopColor="#D8B57C" />
            <Stop offset="1" stopColor="#B88E57" />
          </LinearGradient>
          <SoftRadial id={sun} color="#FFF4D6" opacity={0.95} />
        </Defs>
        <Rect x={-2400} y={0} width={5824} height={1536} fill={url(sky)} />
        <Circle cx={700} cy={520} r={420} fill={url(sun)} />
        <Path d="M-2400 980 L-200 980 C0 930 140 900 300 930 C420 860 560 840 700 900 C840 870 980 880 1140 940 C1300 920 1500 950 1700 960 L3424 960 L3424 1536 L-2400 1536 Z" fill="#B9C3BC" opacity={0.75} />
        <Path d="M-2400 1060 L-120 1060 C80 1010 240 1040 400 1010 C560 980 720 1030 880 1000 C1040 980 1200 1030 1400 1020 L3424 1030 L3424 1536 L-2400 1536 Z" fill="#C7B48C" />
        <Path d="M-2400 1180 C-400 1150 200 1170 512 1160 C860 1150 1400 1170 3424 1160 L3424 1536 L-2400 1536 Z" fill={url(ground)} />
        {([
          [130, 1080, 1],
          [210, 1095, 0.8],
          [880, 1070, 1.1],
        ] as const).map(([x, y, s], i) => (
          <G key={i}>
            <Path d={`M${x} ${y} C${x - 14 * s} ${y - 60 * s} ${x - 10 * s} ${y - 150 * s} ${x} ${y - 190 * s} C${x + 10 * s} ${y - 150 * s} ${x + 14 * s} ${y - 60 * s} ${x} ${y} Z`} fill="#6E7A5A" opacity={0.85} />
          </G>
        ))}
        <Path d="M120 300 q20 -10 40 0 q20 -10 40 0 M780 220 q16 -8 32 0 q16 -8 32 0" stroke="#8C8A7A" strokeWidth={4} fill="none" strokeLinecap="round" opacity={0.6} />
      </G>
    );
  },
};
