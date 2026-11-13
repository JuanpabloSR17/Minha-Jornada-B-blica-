import { memo, useId } from 'react';
import Svg, { Defs, Ellipse, G, LinearGradient, Path, RadialGradient, Rect, Stop } from 'react-native-svg';

/**
 * Artefatos do Tabernáculo (Êxodo 25) em camadas reaproveitáveis: a mesma arte serve ao detalhe
 * do marco, à revelação, ao Santuário e à miniatura do inventário.
 *
 * Estados: `owned` (ouro pleno), `grantable` (silhueta com contorno dourado: pode ser recebido)
 * e `locked` (silhueta apagada). Representações simbólicas, sem poder nem vantagem.
 */
export type ArtifactState = 'owned' | 'grantable' | 'locked';
export type ArtifactId = 'holy_arca_da_alianca_representacao' | 'holy_mesa_dos_paes_da_presenca' | 'holy_candelabro_do_tabernaculo';

export const ARTIFACT_IDS: ArtifactId[] = ['holy_arca_da_alianca_representacao', 'holy_mesa_dos_paes_da_presenca', 'holy_candelabro_do_tabernaculo'];
export const isArtifact = (id: string): id is ArtifactId => (ARTIFACT_IDS as string[]).includes(id);

/** Proporção (largura/altura) de cada arte, para o layout reservar o espaço certo. */
export const ARTIFACT_RATIO: Record<ArtifactId, number> = {
  holy_arca_da_alianca_representacao: 240 / 190,
  holy_mesa_dos_paes_da_presenca: 240 / 190,
  holy_candelabro_do_tabernaculo: 200 / 230,
};

const LINE = '#5A3A10';

function Gold({ id, state }: { id: string; state: ArtifactState }) {
  if (state === 'owned') {
    return (
      <LinearGradient id={id} x1="0" y1="0" x2="0.35" y2="1">
        <Stop offset="0" stopColor="#FFF0B8" />
        <Stop offset="0.35" stopColor="#F1C55A" />
        <Stop offset="0.7" stopColor="#C88E2A" />
        <Stop offset="1" stopColor="#8A5A16" />
      </LinearGradient>
    );
  }
  const a = state === 'grantable' ? ['#4A3A22', '#2A2016'] : ['#2E2A26', '#1C1A18'];
  return (
    <LinearGradient id={id} x1="0" y1="0" x2="0" y2="1">
      <Stop offset="0" stopColor={a[0]} />
      <Stop offset="1" stopColor={a[1]} />
    </LinearGradient>
  );
}

const strokeOf = (s: ArtifactState) => (s === 'owned' ? LINE : s === 'grantable' ? '#E8B85A' : '#4A443C');
const detailOf = (s: ArtifactState) => (s === 'owned' ? '#7A4E12' : s === 'grantable' ? '#B88A3A' : '#3A3530');
const shineOf = (s: ArtifactState) => (s === 'owned' ? '#FFF6D6' : 'transparent');

// ------------------------------------------------------------------ Arca da Aliança

function Ark({ g, state }: { g: string; state: ArtifactState }) {
  const st = strokeOf(state);
  const dt = detailOf(state);
  const fill = `url(#${g})`;
  const sw = state === 'grantable' ? 2.4 : 2;
  const wing = (flip: 1 | -1) => (
    <G transform={flip === -1 ? 'translate(240 0) scale(-1 1)' : undefined}>
      {/* querubim ajoelhado: corpo, cabeça e asa que se estende sobre a tampa */}
      <Path d="M58 98 C56 84 62 74 72 72 C80 70 86 76 86 86 L88 98 Z" fill={fill} stroke={st} strokeWidth={sw} strokeLinejoin="round" />
      <Ellipse cx={74} cy={66} rx={8} ry={9} fill={fill} stroke={st} strokeWidth={sw} />
      <Path d="M70 76 C78 52 98 30 118 22 C112 34 108 44 106 54 C100 50 92 54 90 62 C96 62 100 66 100 70 C94 70 88 74 86 80 Z" fill={fill} stroke={st} strokeWidth={sw} strokeLinejoin="round" />
      <Path d="M80 66 C90 48 102 36 114 28 M84 72 C94 58 100 52 108 46" stroke={dt} strokeWidth={1.4} fill="none" />
    </G>
  );
  return (
    <G>
      {/* varas (à frente e atrás) */}
      <Rect x={6} y={128} width={228} height={8} rx={4} fill={fill} stroke={st} strokeWidth={sw} />
      {/* caixa */}
      <Path d="M44 100 H196 V168 H44 Z" fill={fill} stroke={st} strokeWidth={sw} strokeLinejoin="round" />
      <Path d="M52 112 H188 V156 H52 Z" fill="none" stroke={dt} strokeWidth={1.8} />
      <Path d="M120 118 C112 126 104 132 92 134 C104 136 112 142 120 150 C128 142 136 136 148 134 C136 132 128 126 120 118 Z" fill={dt} opacity={0.75} />
      <Path d="M66 134 h18 M156 134 h18" stroke={dt} strokeWidth={1.6} />
      {/* coroa e tampa (propiciatório) */}
      <Rect x={38} y={92} width={164} height={10} rx={2} fill={fill} stroke={st} strokeWidth={sw} />
      <Path d="M42 92 Q60 86 78 92 Q96 86 114 92 Q132 86 150 92 Q168 86 186 92 Q194 89 198 92" stroke={st} strokeWidth={1.2} fill="none" />
      {/* pés */}
      <Path d="M48 168 h16 v10 h-16 Z M176 168 h16 v10 h-16 Z" fill={fill} stroke={st} strokeWidth={sw} />
      {/* argolas */}
      <Ellipse cx={58} cy={132} rx={7} ry={8} fill="none" stroke={st} strokeWidth={2.2} />
      <Ellipse cx={182} cy={132} rx={7} ry={8} fill="none" stroke={st} strokeWidth={2.2} />
      {wing(1)}
      {wing(-1)}
      <Path d="M48 104 L190 104" stroke={shineOf(state)} strokeWidth={2} opacity={0.7} />
    </G>
  );
}

// ------------------------------------------------------------------ Mesa dos Pães

function Table({ g, state }: { g: string; state: ArtifactState }) {
  const st = strokeOf(state);
  const dt = detailOf(state);
  const fill = `url(#${g})`;
  const sw = state === 'grantable' ? 2.4 : 2;
  const bread = state === 'owned' ? '#D9A45E' : state === 'grantable' ? '#3E3224' : '#2A2622';
  const breadLine = state === 'owned' ? '#7A4A1E' : st;
  // duas fileiras de seis pães (Levítico 24:6), vistas de frente como duas pilhas
  const stack = (cx: number) =>
    [0, 1, 2, 3, 4, 5].map((i) => (
      <Ellipse key={`${cx}${i}`} cx={cx} cy={98 - i * 9} rx={22 - i * 0.6} ry={7} fill={bread} stroke={breadLine} strokeWidth={1.4} />
    ));
  return (
    <G>
      {/* pernas de trás */}
      <Path d="M66 108 v66 M174 108 v66" stroke={st} strokeWidth={9} strokeLinecap="round" opacity={0.6} />
      {stack(90)}
      {stack(150)}
      {/* tampo com moldura (coroa) */}
      <Path d="M30 104 H210 L204 118 H36 Z" fill={fill} stroke={st} strokeWidth={sw} strokeLinejoin="round" />
      <Path d="M30 104 Q48 98 66 104 Q84 98 102 104 Q120 98 138 104 Q156 98 174 104 Q192 98 210 104" stroke={st} strokeWidth={1.4} fill="none" />
      <Path d="M44 118 H196 V130 H44 Z" fill={fill} stroke={st} strokeWidth={sw} />
      <Path d="M52 124 H188" stroke={dt} strokeWidth={1.4} strokeDasharray="4 5" />
      {/* pernas da frente com argolas e varas */}
      <Path d="M48 130 L50 182 H60 L62 130 Z M178 130 L180 182 H190 L192 130 Z" fill={fill} stroke={st} strokeWidth={sw} strokeLinejoin="round" />
      <Ellipse cx={55} cy={146} rx={6} ry={5} fill="none" stroke={st} strokeWidth={2} />
      <Ellipse cx={185} cy={146} rx={6} ry={5} fill="none" stroke={st} strokeWidth={2} />
      <Path d="M44 166 H196" stroke={dt} strokeWidth={2} />
      <Path d="M34 106 H206" stroke={shineOf(state)} strokeWidth={1.6} opacity={0.7} />
    </G>
  );
}

// ------------------------------------------------------------------ Candelabro (menorá)

export const MENORAH_FLAMES = [-72, -48, -24, 0, 24, 48, 72].map((dx) => ({ x: 100 + dx, y: 44 }));

function Menorah({ g, state, flames }: { g: string; state: ArtifactState; flames: boolean }) {
  const st = strokeOf(state);
  const dt = detailOf(state);
  const fill = `url(#${g})`;
  const sw = state === 'grantable' ? 2.4 : 2;
  const arm = (r: number) => `M${100 - r} 52 C${100 - r} ${120 + r * 0.25} ${100 + r} ${120 + r * 0.25} ${100 + r} 52`;
  return (
    <G>
      {[72, 48, 24].map((r) => (
        <G key={r}>
          <Path d={arm(r)} stroke={st} strokeWidth={11} fill="none" strokeLinecap="round" />
          <Path d={arm(r)} stroke={fill} strokeWidth={7} fill="none" strokeLinecap="round" />
        </G>
      ))}
      {/* haste central */}
      <Path d="M95 50 H105 V190 H95 Z" fill={fill} stroke={st} strokeWidth={sw} />
      {/* botões de amêndoa ao longo dos braços e da haste */}
      {[[28, 82], [172, 82], [52, 98], [148, 98], [76, 108], [124, 108], [100, 90], [100, 130], [100, 160]].map(([x, y], i) => (
        <Ellipse key={i} cx={x} cy={y} rx={6} ry={4.5} fill={fill} stroke={st} strokeWidth={1.6} />
      ))}
      {/* copos */}
      {MENORAH_FLAMES.map((p, i) => (
        <Path key={i} d={`M${p.x - 9} 46 L${p.x + 9} 46 L${p.x + 5} 56 L${p.x - 5} 56 Z`} fill={fill} stroke={st} strokeWidth={1.6} strokeLinejoin="round" />
      ))}
      {/* base em degraus */}
      <Path d="M80 188 H120 L128 200 H72 Z" fill={fill} stroke={st} strokeWidth={sw} strokeLinejoin="round" />
      <Path d="M62 200 H138 L146 214 H54 Z" fill={fill} stroke={st} strokeWidth={sw} strokeLinejoin="round" />
      <Path d="M70 207 H130" stroke={dt} strokeWidth={1.4} />
      {flames && state === 'owned'
        ? MENORAH_FLAMES.map((p, i) => (
            <G key={`f${i}`}>
              <Ellipse cx={p.x} cy={p.y - 10} rx={9} ry={13} fill="#FFB547" opacity={0.35} />
              <Path d={`M${p.x} ${p.y - 22} C${p.x + 6} ${p.y - 12} ${p.x + 5} ${p.y - 4} ${p.x} ${p.y - 1} C${p.x - 5} ${p.y - 4} ${p.x - 6} ${p.y - 12} ${p.x} ${p.y - 22} Z`} fill="#FFE08A" />
              <Path d={`M${p.x} ${p.y - 14} C${p.x + 3} ${p.y - 8} ${p.x + 2} ${p.y - 4} ${p.x} ${p.y - 2} C${p.x - 2} ${p.y - 4} ${p.x - 3} ${p.y - 8} ${p.x} ${p.y - 14} Z`} fill="#FFFFFF" opacity={0.85} />
            </G>
          ))
        : null}
    </G>
  );
}

/**
 * Arte de um artefato. `glow` acrescenta o halo dourado de fundo (camada separada, pode ser
 * animada por quem usa). `flames` acende as lâmpadas do candelabro.
 */
export const ArtifactArt = memo(function ArtifactArt({
  id,
  width,
  state = 'owned',
  glow = false,
  flames = true,
}: {
  id: ArtifactId;
  width: number;
  state?: ArtifactState;
  glow?: boolean;
  flames?: boolean;
}) {
  const raw = useId();
  const g = `gold${raw.replace(/[^a-zA-Z0-9]/g, '')}`;
  const halo = `${g}h`;
  const menorah = id === 'holy_candelabro_do_tabernaculo';
  const vb = menorah ? '0 0 200 230' : '0 0 240 190';
  const height = width / ARTIFACT_RATIO[id];
  return (
    <Svg width={width} height={height} viewBox={vb}>
      <Defs>
        <Gold id={g} state={state} />
        <RadialGradient id={halo} cx="50%" cy="55%" r="50%">
          <Stop offset="0" stopColor="#FFD777" stopOpacity={state === 'owned' ? 0.55 : 0.22} />
          <Stop offset="1" stopColor="#FFD777" stopOpacity={0} />
        </RadialGradient>
      </Defs>
      {glow ? <Ellipse cx={menorah ? 100 : 120} cy={menorah ? 120 : 110} rx={menorah ? 100 : 120} ry={menorah ? 115 : 90} fill={`url(#${halo})`} /> : null}
      {id === 'holy_arca_da_alianca_representacao' ? <Ark g={g} state={state} /> : null}
      {id === 'holy_mesa_dos_paes_da_presenca' ? <Table g={g} state={state} /> : null}
      {menorah ? <Menorah g={g} state={state} flames={flames} /> : null}
    </Svg>
  );
});
