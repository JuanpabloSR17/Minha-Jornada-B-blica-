import { useId, type ReactElement } from 'react';
import Svg, { Circle, Defs, Ellipse, G, LinearGradient, Path, Rect, Stop, Text as SvgText } from 'react-native-svg';
import { lineOf, shade } from './color';

/**
 * Miniaturas de inventário por ID canônico (viewBox 100×100), desenhadas à parte da arte vestida: a peça
 * inteira, de frente, reconhecível pela silhueta e por detalhes próprios. A mesma arte aparece no Mercado,
 * na recompensa, no guarda-roupa e no detalhe (todas as telas usam ItemIcon). A raridade vai na moldura.
 */
type C = { base: string; trim: string };
type IconFn = (c: C) => ReactElement;
type IconDefinition = { fn: IconFn; base: string; trim: string; book?: string };
const L = (c: string) => lineOf(c);

// ------------------------------------------------------------------ roupas
const tunic = (opts: { sleeve?: 'short' | 'long'; neck?: 'round' | 'v' | 'slit'; sash?: string; stripes?: boolean; hem?: boolean } = {}): IconFn => ({ base, trim }) => {
  const long = opts.sleeve === 'long';
  const body = `M34 18 L22 24 L${long ? 8 : 12} ${long ? 62 : 42} L${long ? 18 : 22} ${long ? 64 : 46} L28 34 L26 90 Q50 94 74 90 L72 34 L${long ? 82 : 78} ${long ? 64 : 46} L${long ? 92 : 88} ${long ? 62 : 42} L78 24 L66 18 Q50 26 34 18 Z`;
  return (
    <G>
      <Path d={body} fill={base} stroke={L(base)} strokeWidth={2.4} strokeLinejoin="round" />
      <Path d="M30 40 L32 88 M70 40 L68 88" stroke={shade(base, -0.18)} strokeWidth={2} fill="none" opacity={0.6} />
      {opts.stripes ? <Path d="M42 24 L40 91 M58 24 L60 91" stroke={trim} strokeWidth={4} /> : null}
      {opts.neck === 'v' ? <Path d="M40 20 L50 34 L60 20" stroke={trim} strokeWidth={3} fill="none" /> : opts.neck === 'slit' ? <Path d="M42 20 Q50 26 58 20 M50 24 L50 36" stroke={trim} strokeWidth={3} fill="none" /> : <Path d="M36 19 Q50 28 64 19" stroke={trim} strokeWidth={3.5} fill="none" />}
      {opts.sash ? <Path d="M27 54 Q50 60 73 54 L73 61 Q50 67 27 61 Z" fill={opts.sash} stroke={L(opts.sash)} strokeWidth={1.6} /> : null}
      {opts.hem !== false ? <Path d="M27 84 Q50 89 73 84" stroke={trim} strokeWidth={3} fill="none" /> : null}
    </G>
  );
};
const cloakDrape: IconFn = ({ base, trim }) => (
  <G>
    <Path d="M14 14 Q50 4 86 14 L94 92 Q50 98 6 92 Z" fill={shade(base, -0.12)} stroke={L(base)} strokeWidth={2.4} />
    <Path d="M14 14 C40 20 60 40 80 70 C70 80 56 84 44 80 C40 60 26 40 14 14 Z" fill={base} stroke={L(base)} strokeWidth={2} />
    <Path d="M14 14 C26 40 40 60 44 80" stroke={trim} strokeWidth={3} fill="none" />
    <Circle cx={20} cy={20} r={6} fill={trim} stroke={L(trim)} strokeWidth={1.6} />
  </G>
);
const cape = (opts: { hood?: boolean; fringe?: boolean; fleece?: boolean } = {}): IconFn => ({ base, trim }) => (
  <G>
    {opts.hood ? <Path d="M36 22 Q50 2 64 22 Q50 30 36 22 Z" fill={shade(base, -0.15)} stroke={L(base)} strokeWidth={2} /> : null}
    <Path d="M32 18 Q50 26 68 18 L84 88 Q50 96 16 88 Z" fill={base} stroke={L(base)} strokeWidth={2.4} strokeLinejoin="round" />
    <Path d="M40 26 L34 88 M60 26 L66 88 M50 28 L50 92" stroke={shade(base, -0.22)} strokeWidth={2} opacity={0.5} />
    <Path d="M17 86 Q50 94 83 86" stroke={trim} strokeWidth={3.5} fill="none" />
    {opts.fringe ? <Path d="M20 89 v6 M28 90 v6 M36 91 v6 M44 92 v6 M52 92 v6 M60 91 v6 M68 90 v6 M76 89 v6" stroke={trim} strokeWidth={1.8} /> : null}
    {opts.fleece ? <G>{[30, 44, 58, 72].map((y) => <Path key={y} d={`M${24 + y * 0.12} ${y} q4 -4 8 0 q4 -4 8 0 q4 -4 8 0 q4 -4 8 0 q4 -4 8 0`} stroke={shade(base, 0.3)} strokeWidth={1.6} fill="none" />)}</G> : null}
    <Circle cx={50} cy={22} r={4.5} fill={trim} stroke={L(trim)} strokeWidth={1.4} />
  </G>
);

// ------------------------------------------------------------------ calçados
const sandal = (style: 'simple' | 'woven' | 'laced' | 'rope' | 'road' | 'pilgrim'): IconFn => ({ base, trim }) => {
  const one = (x: number) => (
    <G key={x} transform={`translate(${x} 0)`}>
      <Path d="M8 30 C2 50 4 80 14 90 C22 96 30 92 32 82 C36 60 34 40 26 28 C22 22 12 22 8 30 Z" fill={shade(base, -0.25)} stroke={L(base)} strokeWidth={2} />
      {style === 'woven' ? <Path d="M8 46 L30 54 M8 54 L30 46 M8 62 L30 70 M8 70 L30 62" stroke={base} strokeWidth={4} /> : null}
      {style === 'rope' ? <Path d="M8 48 Q20 42 30 48 M8 64 Q20 58 30 64" stroke={trim} strokeWidth={4} strokeDasharray="3 2" fill="none" /> : null}
      {style === 'simple' || style === 'road' || style === 'pilgrim' ? <Path d="M8 50 Q20 44 30 50 M10 66 L28 58" stroke={base} strokeWidth={5} fill="none" strokeLinecap="round" /> : null}
      {style === 'laced' ? <G><Path d="M8 50 Q20 44 30 50" stroke={base} strokeWidth={5} fill="none" /><Path d="M12 30 L28 20 M10 22 L28 12 M12 14 L26 6" stroke={base} strokeWidth={3.5} /></G> : null}
      {style === 'road' ? <Path d="M6 86 Q18 96 32 84" stroke={trim} strokeWidth={3} fill="none" /> : null}
      {style === 'pilgrim' ? <Circle cx={19} cy={56} r={4} fill={trim} /> : null}
    </G>
  );
  return <G>{[14, 52].map(one)}</G>;
};
const boots: IconFn = ({ base, trim }) => (
  <G>
    {[10, 52].map((x) => (
      <G key={x} transform={`translate(${x} 0)`}>
        <Path d="M6 12 L28 12 L28 64 C36 68 40 76 38 86 L4 88 C2 70 4 40 6 12 Z" fill={base} stroke={L(base)} strokeWidth={2.2} strokeLinejoin="round" />
        <Path d="M6 22 L28 26 M6 36 L28 40 M6 50 L28 54" stroke={trim} strokeWidth={3} />
        <Path d="M4 84 L38 82" stroke={shade(base, -0.4)} strokeWidth={5} />
      </G>
    ))}
  </G>
);
const shoesCloth: IconFn = ({ base, trim }) => (
  <G>
    {[8, 52].map((x) => (
      <G key={x} transform={`translate(${x} 0)`}>
        <Path d="M4 52 C4 36 18 32 26 40 C34 46 40 58 38 70 C36 80 6 82 4 72 Z" fill={base} stroke={L(base)} strokeWidth={2.2} />
        <Path d="M8 50 Q18 44 26 52" stroke={trim} strokeWidth={3} fill="none" />
      </G>
    ))}
  </G>
);

// ------------------------------------------------------------------ cintura
const belt = (style: 'leather' | 'woven' | 'rope' | 'sash' | 'cloth' | 'workrope'): IconFn => ({ base, trim }) => (
  <G>
    {style === 'rope' || style === 'workrope' ? (
      <G>
        <Path d="M8 44 Q50 58 92 44" stroke={base} strokeWidth={9} fill="none" strokeLinecap="round" />
        <Path d="M8 44 Q50 58 92 44" stroke={shade(base, -0.3)} strokeWidth={9} fill="none" strokeDasharray="3 4" />
        <Path d="M46 52 L40 82 M54 52 L60 82" stroke={base} strokeWidth={6} strokeLinecap="round" />
        {style === 'workrope' ? <Circle cx={50} cy={52} r={8} fill="none" stroke={shade(base, -0.3)} strokeWidth={4} /> : <Circle cx={50} cy={52} r={6} fill={shade(base, -0.2)} />}
      </G>
    ) : style === 'sash' || style === 'cloth' ? (
      <G>
        <Path d="M6 36 Q50 50 94 36 L94 52 Q50 66 6 52 Z" fill={base} stroke={L(base)} strokeWidth={2.2} />
        <Path d="M44 54 L34 90 L46 88 L50 58 L56 88 L68 90 L58 54 Z" fill={shade(base, -0.1)} stroke={L(base)} strokeWidth={2} />
        {style === 'sash' ? <Path d="M6 44 Q50 58 94 44" stroke={trim} strokeWidth={2} fill="none" /> : null}
      </G>
    ) : (
      <G>
        <Path d="M4 40 Q50 54 96 40 L96 56 Q50 70 4 56 Z" fill={base} stroke={L(base)} strokeWidth={2.2} />
        {style === 'woven' ? <Path d="M10 48 L18 52 L26 48 L34 52 L42 48 L50 52 L58 48 L66 52 L74 48 L82 52 L90 48" stroke={trim} strokeWidth={2.4} fill="none" /> : <Path d="M10 48 Q50 61 90 48" stroke={shade(base, 0.3)} strokeWidth={1.6} strokeDasharray="4 4" fill="none" />}
        <Rect x={41} y={44} width={18} height={18} fill="none" stroke={trim} strokeWidth={4} />
      </G>
    )}
  </G>
);
const satchel: IconFn = ({ base, trim }) => (
  <G>
    <Path d="M26 22 C40 10 64 10 76 30 L72 34 C62 18 42 18 32 28 Z" fill={shade(base, -0.15)} stroke={L(base)} strokeWidth={2} />
    <Path d="M22 42 C20 64 24 80 32 84 H70 C78 80 82 64 80 42 Q50 34 22 42 Z" fill={base} stroke={L(base)} strokeWidth={2.4} />
    <Path d="M20 40 Q50 30 82 40 L80 62 Q50 72 22 62 Z" fill={shade(base, 0.1)} stroke={L(base)} strokeWidth={2.4} />
    <Rect x={45} y={58} width={10} height={10} fill={trim} stroke={L(trim)} strokeWidth={1.6} />
  </G>
);
const messenger: IconFn = (c) => (
  <G>
    {satchel(c)}
    <Path d="M28 74 L72 74" stroke={c.trim} strokeWidth={2} strokeDasharray="3 3" />
    <Path d="M60 18 l10 -8 l4 6 l-10 8 Z" fill="#E9D3A0" stroke="#7A5418" strokeWidth={1.4} />
  </G>
);
const pouch: IconFn = ({ base, trim }) => (
  <G>
    <Path d="M6 36 Q50 48 94 36 V50 Q50 62 6 50 Z" fill={base} stroke={L(base)} strokeWidth={2.2} />
    <Rect x={42} y={38} width={16} height={16} fill="none" stroke={trim} strokeWidth={3} />
    <Path d="M56 52 C54 72 62 86 72 86 C82 86 90 72 88 52 Z" fill={shade(base, 0.08)} stroke={L(base)} strokeWidth={2.2} />
    <Path d="M56 54 Q72 70 88 54" fill={shade(base, -0.12)} stroke={L(base)} strokeWidth={2} />
  </G>
);
const flask: IconFn = ({ base, trim }) => (
  <G>
    <Path d="M20 14 C40 30 60 30 80 14" stroke={trim} strokeWidth={4} fill="none" />
    <Rect x={42} y={18} width={16} height={14} rx={3} fill={shade(base, -0.2)} stroke={L(base)} strokeWidth={2} />
    <Circle cx={50} cy={60} r={30} fill={base} stroke={L(base)} strokeWidth={2.4} />
    <Circle cx={50} cy={60} r={20} fill="none" stroke={shade(base, -0.25)} strokeWidth={2.4} />
    <Path d="M38 48 q8 -6 16 -2" stroke={shade(base, 0.35)} strokeWidth={3} fill="none" />
  </G>
);
const seedBag: IconFn = ({ base, trim }) => (
  <G>
    <Path d="M30 30 C14 50 16 86 50 90 C84 86 86 50 70 30 Z" fill={base} stroke={L(base)} strokeWidth={2.4} />
    <Path d="M34 30 Q50 20 66 30" stroke={trim} strokeWidth={5} fill="none" />
    <Path d="M42 18 Q50 26 58 18" stroke={shade(base, -0.2)} strokeWidth={3} fill="none" />
    {[[42, 60], [54, 66], [48, 74], [60, 56]].map(([x, y]) => <Ellipse key={`${x}${y}`} cx={x} cy={y} rx={3} ry={2} fill={trim} />)}
  </G>
);
const net: IconFn = ({ base, trim }) => (
  <G>
    <Path d="M14 18 Q50 8 86 18 L78 86 Q50 94 22 86 Z" fill="none" stroke={base} strokeWidth={3} />
    {[30, 42, 54, 66, 78].map((y) => <Path key={y} d={`M${16 + (y - 18) * 0.12} ${y} Q50 ${y + 6} ${84 - (y - 18) * 0.12} ${y}`} stroke={base} strokeWidth={2} fill="none" />)}
    {[28, 40, 50, 60, 72].map((x) => <Path key={x} d={`M${x} 14 L${50 + (x - 50) * 0.8} 90`} stroke={base} strokeWidth={2} />)}
    {[[22, 18], [50, 12], [78, 18]].map(([x, y]) => <Circle key={x} cx={x} cy={y} r={4} fill={trim} stroke={L(trim)} strokeWidth={1.4} />)}
  </G>
);

// ------------------------------------------------------------------ cabeça e pescoço
const turban: IconFn = ({ base, trim }) => (
  <G>
    <Path d="M18 66 C14 38 30 16 50 14 C70 16 86 38 82 66 Q50 76 18 66 Z" fill={base} stroke={L(base)} strokeWidth={2.4} />
    <Path d="M20 58 C34 34 64 28 80 44 M22 46 C40 52 62 48 80 56" stroke={shade(base, -0.25)} strokeWidth={3} fill="none" />
    <Path d="M18 66 Q50 76 82 66" stroke={trim} strokeWidth={5} fill="none" />
    <Path d="M78 56 C88 66 88 80 84 92 L76 92 C80 80 78 70 72 62 Z" fill={shade(base, -0.06)} stroke={L(base)} strokeWidth={2} />
  </G>
);
const scarfHood: IconFn = ({ base, trim }) => (
  <G>
    <Path d="M50 10 C74 10 84 30 84 52 C86 70 92 80 94 92 H6 C8 80 14 70 16 52 C16 30 26 10 50 10 Z M50 30 C38 30 32 40 32 52 C32 66 40 76 50 76 C60 76 68 66 68 52 C68 40 62 30 50 30 Z" fillRule="evenodd" fill={base} stroke={L(base)} strokeWidth={2.4} />
    <Path d="M50 30 C38 30 32 40 32 52 C32 66 40 76 50 76 C60 76 68 66 68 52 C68 40 62 30 50 30 Z" fill="none" stroke={trim} strokeWidth={3} />
  </G>
);
const headband: IconFn = ({ base, trim }) => (
  <G>
    <Ellipse cx={50} cy={50} rx={36} ry={16} fill="none" stroke={base} strokeWidth={10} />
    <Ellipse cx={50} cy={50} rx={36} ry={16} fill="none" stroke={trim} strokeWidth={2} strokeDasharray="4 5" />
    <Path d="M80 56 L90 82 L82 84 L76 60 Z M76 58 L80 86 L72 84 Z" fill={base} stroke={L(base)} strokeWidth={1.6} />
  </G>
);
const neckScarf: IconFn = ({ base, trim }) => (
  <G>
    <Path d="M14 28 Q50 52 86 28 L86 42 Q50 66 14 42 Z" fill={base} stroke={L(base)} strokeWidth={2.2} />
    <Path d="M54 50 L62 92 L74 86 L64 46 Z" fill={shade(base, -0.1)} stroke={L(base)} strokeWidth={2} />
    <Path d="M62 88 l4 6 M66 86 l4 6 M70 84 l4 6" stroke={trim} strokeWidth={2} />
  </G>
);
const necklace = (beads: boolean): IconFn => ({ base, trim }) => (
  <G>
    <Path d="M18 20 Q50 80 82 20" stroke={beads ? shade(base, -0.4) : base} strokeWidth={beads ? 1.6 : 4} fill="none" />
    {beads ? [0.1, 0.2, 0.3, 0.4, 0.5, 0.6, 0.7, 0.8, 0.9].map((t) => {
      const x = 18 + 64 * t;
      const y = 20 + 60 * 4 * t * (1 - t) * 0.84;
      return <Circle key={t} cx={x} cy={y} r={5} fill={t === 0.5 ? trim : base} stroke={L(base)} strokeWidth={1.2} />;
    }) : null}
    {!beads ? <Path d="M50 62 L58 74 L50 88 L42 74 Z" fill={trim} stroke={L(trim)} strokeWidth={1.6} /> : null}
  </G>
);

// ------------------------------------------------------------------ objetos de mão
const staff = (kind: 'crook' | 'walk' | 'rod'): IconFn => ({ base }) => {
  const d = kind === 'crook' ? 'M40 94 L40 30 C40 10 70 8 72 26 C73 36 66 42 60 40' : 'M50 94 L50 12';
  return (
    <G>
      <Path d={d} stroke={L(base)} strokeWidth={kind === 'rod' ? 8 : 11} strokeLinecap="round" fill="none" />
      <Path d={d} stroke={base} strokeWidth={kind === 'rod' ? 5 : 7} strokeLinecap="round" fill="none" />
      {kind === 'walk' ? <G><Ellipse cx={50} cy={12} rx={7} ry={6} fill={shade(base, -0.1)} stroke={L(base)} strokeWidth={2} /><Path d="M45 22 l10 4 M45 28 l10 4" stroke="#5A3A22" strokeWidth={3} strokeLinecap="round" /></G> : null}
      {kind === 'rod' ? <G><Circle cx={50} cy={14} r={6} fill={shade(base, -0.15)} stroke={L(base)} strokeWidth={1.8} /><Path d="M46 60 l8 0 M46 66 l8 0" stroke={shade(base, -0.4)} strokeWidth={2} /></G> : null}
    </G>
  );
};
const scroll: IconFn = ({ base, trim }) => (
  <G>
    <Rect x={22} y={24} width={56} height={52} fill={base} stroke={L(base)} strokeWidth={2} />
    <Path d="M30 36 h40 M30 46 h40 M30 56 h32 M30 66 h36" stroke={shade(base, -0.35)} strokeWidth={2} />
    <Rect x={14} y={18} width={12} height={64} rx={6} fill={trim} stroke={L(trim)} strokeWidth={2} />
    <Rect x={74} y={18} width={12} height={64} rx={6} fill={trim} stroke={L(trim)} strokeWidth={2} />
  </G>
);
const lamp = (clay: boolean): IconFn => ({ base, trim }) => (
  <G>
    <Ellipse cx={50} cy={34} rx={7} ry={12} fill="#FFC34D" opacity={0.9} />
    <Path d="M50 22 C54 30 54 38 50 42 C46 38 46 30 50 22 Z" fill="#FFF0B0" />
    <Path d={clay ? 'M14 62 C14 48 38 44 50 46 C60 44 84 46 90 54 L70 58 C78 70 64 82 46 82 C26 82 14 74 14 62 Z' : 'M18 60 C18 50 34 46 50 46 C66 46 82 50 82 60 C82 72 66 78 50 78 C34 78 18 72 18 60 Z'}
      fill={base} stroke={L(base)} strokeWidth={2.4} />
    <Ellipse cx={46} cy={58} rx={10} ry={4} fill={shade(base, -0.4)} />
    {!clay ? <Path d="M82 58 C92 56 94 66 86 68" stroke={trim} strokeWidth={3} fill="none" /> : <Path d="M22 68 Q46 76 70 66" stroke={trim} strokeWidth={2} fill="none" strokeDasharray="3 3" />}
  </G>
);
const basket = (bread: boolean): IconFn => ({ base, trim }) => (
  <G>
    <Path d="M20 30 Q50 6 80 30" stroke={shade(base, -0.2)} strokeWidth={4} fill="none" />
    {bread ? [[36, 40], [52, 36], [66, 42]].map(([x, y]) => <Ellipse key={x} cx={x} cy={y} rx={13} ry={9} fill={trim} stroke={L(trim)} strokeWidth={1.8} />) : null}
    <Path d="M12 44 L88 44 L78 86 L22 86 Z" fill={base} stroke={L(base)} strokeWidth={2.4} strokeLinejoin="round" />
    {[54, 64, 74].map((y) => <Path key={y} d={`M${14 + (y - 44) * 0.25} ${y} L${86 - (y - 44) * 0.25} ${y}`} stroke={shade(base, -0.3)} strokeWidth={2} />)}
    {[30, 42, 54, 66].map((x) => <Path key={x} d={`M${x} 46 L${x + (x - 50) * -0.1} 84`} stroke={shade(base, 0.25)} strokeWidth={2} />)}
  </G>
);
const pot: IconFn = ({ base, trim }) => (
  <G>
    <Path d="M38 14 H62 L60 24 C78 32 82 54 74 72 C68 84 58 90 50 90 C42 90 32 84 26 72 C18 54 22 32 40 24 Z" fill={base} stroke={L(base)} strokeWidth={2.4} />
    <Path d="M28 50 Q50 58 72 50" stroke={trim} strokeWidth={3} fill="none" />
    <Path d="M30 60 Q50 68 70 60" stroke={trim} strokeWidth={1.6} fill="none" strokeDasharray="3 3" />
    <Path d="M36 32 q6 -4 12 -2" stroke={shade(base, 0.35)} strokeWidth={3} fill="none" />
  </G>
);
const sickle: IconFn = ({ base, trim }) => (
  <G>
    <Path d="M60 18 C88 22 92 60 66 74 L62 66 C80 56 78 32 58 28 Z" fill="#B9B4AA" stroke="#5A5650" strokeWidth={2.2} />
    <Path d="M62 66 L34 92" stroke={L(base)} strokeWidth={12} strokeLinecap="round" />
    <Path d="M62 66 L34 92" stroke={base} strokeWidth={8} strokeLinecap="round" />
    <Path d="M52 74 l6 6" stroke={trim} strokeWidth={3} />
  </G>
);
const flute: IconFn = ({ base, trim }) => (
  <G>
    <Path d="M20 82 L82 20" stroke={L(base)} strokeWidth={14} strokeLinecap="round" />
    <Path d="M20 82 L82 20" stroke={base} strokeWidth={10} strokeLinecap="round" />
    {[0.3, 0.42, 0.54, 0.66].map((t) => <Circle key={t} cx={20 + 62 * t} cy={82 - 62 * t} r={2.6} fill={shade(base, -0.55)} />)}
    <Path d="M74 22 l8 8 M70 26 l8 8" stroke={trim} strokeWidth={2.4} />
  </G>
);
const lyre: IconFn = ({ base, trim }) => (
  <G>
    <Path d="M26 88 C14 60 16 30 26 12 L34 16 C28 34 30 56 38 80 Z M74 88 C86 60 84 30 74 12 L66 16 C72 34 70 56 62 80 Z" fill={base} stroke={L(base)} strokeWidth={2} />
    <Rect x={24} y={12} width={52} height={7} rx={3} fill={shade(base, -0.2)} stroke={L(base)} strokeWidth={1.6} />
    <Rect x={30} y={78} width={40} height={12} rx={4} fill={shade(base, -0.1)} stroke={L(base)} strokeWidth={2} />
    {[40, 46, 52, 58].map((x) => <Path key={x} d={`M${x} 19 L${x} 78`} stroke={trim} strokeWidth={1.4} />)}
  </G>
);
const parchment: IconFn = ({ base, trim }) => (
  <G>
    <Path d="M16 14 H84 V80 C70 72 60 92 46 84 C34 78 24 90 16 84 Z" fill={base} stroke={L(base)} strokeWidth={2.2} />
    <Path d="M26 30 Q50 22 74 34 M30 46 h40 M30 58 h34" stroke={trim} strokeWidth={2} fill="none" />
    <Circle cx={68} cy={66} r={6} fill="#9A3B2A" opacity={0.85} />
  </G>
);

// ------------------------------------------------------------------ insígnias, objetos e cenários de recompensa
const SYMBOLS = {
  star: 'M50 19L57 40 80 40 62 54 69 77 50 63 31 77 38 54 20 40 43 40Z',
  flame: 'M51 13C51 34 75 39 75 65A25 25 0 0 1 25 65C25 52 32 43 39 37C37 51 45 51 47 47C54 38 50 23 51 13Z',
  pillar: 'M14 51Q9 40 21 34Q17 20 35 22Q46 10 58 22Q77 19 78 35Q91 36 85 50Q79 60 63 57H34Q20 62 14 51ZM51 61Q51 70 65 78Q67 93 51 95Q36 95 36 82Q38 74 43 70Q43 75 48 75Z',
  suns: 'M50 36A13 13 0 1 1 50 62A13 13 0 1 1 50 36ZM46 8H54V29H46ZM46 69H54V90H46ZM9 45H30V53H9ZM70 45H91V53H70ZM21 17L35 31 30 37 15 22ZM69 62L85 78 79 84 63 68ZM16 78L31 62 37 68 22 84ZM64 31L79 16 85 22 70 37Z',
  night: 'M54 15C29 22 30 61 65 64Q46 86 25 71Q10 59 15 39Q22 14 54 15ZM69 18L72 30 83 34 72 38 68 50 65 38 54 34 65 30Z',
  wave: 'M13 59C26 38 37 37 49 53C63 71 76 62 87 44V63C76 80 60 85 48 70C32 51 29 69 13 76Z',
  dove: 'M15 21Q38 41 52 43Q49 27 56 17Q64 27 66 40Q77 35 86 45L77 50Q73 65 59 68Q45 80 18 83L30 66L20 68L38 58Q22 46 15 21Z',
  anchor: 'M45 31A10 10 0 1 1 55 31V67Q68 66 73 58L64 55L84 43V66L79 62Q70 80 50 84Q30 80 21 62L16 66V43L36 55L27 58Q32 67 45 67ZM50 17A4 4 0 1 0 50 25A4 4 0 1 0 50 17Z',
  heart: 'M50 78L23 53C5 35 29 13 50 34C71 13 95 35 77 53Z',
  branch: 'M22 78Q43 50 77 20M48 49Q43 28 55 24Q62 41 48 49M55 44Q69 51 79 38Q64 34 55 44M32 64Q22 49 30 42Q42 49 32 64M37 60Q45 74 61 60Q51 54 37 60',
  lion: 'M50 16L78 24 87 43 80 68 66 83H34L20 68 13 43 22 24ZM29 43L43 46 39 51ZM71 43L57 46 61 51ZM40 61H60L50 70Z',
  lamb: 'M18 53Q13 42 24 37Q29 27 42 31Q55 24 66 37Q72 26 82 29Q92 31 88 43L77 54L74 78H66L63 63H40L37 78H28L25 62Z',
  sword: 'M76 17L74 37 43 68 34 59 65 28ZM23 50L51 78 45 83 34 73 20 87 13 80 27 66 17 56Z',
  seal: 'M50 18L60 31 77 32 76 50 84 64 68 70 59 84 50 74 41 84 32 70 16 64 24 50 23 32 40 31Z',
  music: 'M43 27L74 19V62Q74 73 62 73Q51 73 51 66Q51 55 67 55V34L50 39V72Q50 83 38 83Q27 83 27 76Q27 65 43 65Z',
  candle: 'M50 15C40 29 44 39 50 41C56 39 60 30 50 15ZM46 44H54V74L67 78V84H33V78L46 74Z',
  path: 'M16 80L30 67 24 57 45 47 47 37 73 23 84 28 56 43 55 54 36 63 44 73 32 84Z',
  tents: 'M16 78L49 24 84 78ZM35 78L49 52 65 78Z',
  crown: 'M19 40L34 53 50 28 66 53 81 40 73 76H27Z',
} as const;
type SymbolName = keyof typeof SYMBOLS;

const badge = (symbol: SymbolName, shape: 'shield' | 'seal' | 'frame'): IconFn => ({ base, trim }) => (
  <G>
    <Path d={{ shield: 'M13 22Q50 5 87 22V49Q84 76 50 94Q16 76 13 49Z', seal: 'M50 7A43 43 0 1 1 50 93A43 43 0 1 1 50 7Z', frame: 'M18 10H82L91 19V81L82 90H18L9 81V19Z' }[shape]}
      fill={base} stroke={trim} strokeWidth={4} />
    <Path d={SYMBOLS[symbol]} transform="translate(12 12) scale(.76)" fill={trim} fillRule="evenodd" stroke={L(trim)} strokeWidth={2} strokeLinejoin="round" />
  </G>
);

const scene = (symbol: SymbolName, land: 'mountains' | 'city' | 'sea' | 'cave'): IconFn => ({ base, trim }) => (
  <G>
    <Rect x={5} y={12} width={90} height={74} rx={10} fill={shade(base, -0.38)} stroke={trim} strokeWidth={2} />
    <Path d={SYMBOLS[symbol]} fill={trim} fillRule="evenodd" transform="translate(28 8) scale(.44)" />
    <Path d={{
      mountains: 'M6 70L31 43 52 66 67 53 94 73V77Q94 85 86 85H14Q6 85 6 77Z',
      city: 'M6 74V67H22V59H35V53H44V44H56V53H70V62H84V68H94V77Q94 85 86 85H14Q6 85 6 77Z',
      sea: 'M6 65Q17 54 29 64Q42 74 52 62Q66 50 78 63Q87 68 94 59V77Q94 85 86 85H14Q6 85 6 77Z',
      cave: 'M6 74Q19 39 51 43Q76 44 94 72V77Q94 85 86 85H14Q6 85 6 77ZM42 81H65V69Q65 57 54 57Q42 57 42 69Z',
    }[land]} fill={base} fillRule="evenodd" />
    <Path d="M13 77Q50 67 87 77" stroke={trim} strokeWidth={2} opacity={0.72} fill="none" />
  </G>
);

const ceremonialChest = (stones: boolean): IconFn => ({ base, trim }) => (
  <G>
    <Path d="M19 19L35 13 42 26H58L65 13 81 19 91 81 70 92H30L9 81Z" fill={base} stroke={L(base)} strokeWidth={3} />
    <Rect x={26} y={33} width={48} height={45} rx={5} fill={shade(base, -0.38)} stroke={trim} strokeWidth={4} />
    {stones ? Array.from({ length: 12 }, (_, i) => <Circle key={i} cx={34 + 16 * (i % 3)} cy={40 + 10 * Math.floor(i / 3)} r={3.8} fill={['#CB6A51', '#64B89E', '#83ABE1', '#D2AC65'][i % 4]} />)
      : <Path d="M50 39L56 49 68 55 56 61 50 72 44 61 32 55 44 49Z" fill={trim} />}
  </G>
);

const vessel = (kind: 'cup' | 'jar' | 'flask' | 'urn'): IconFn => ({ base, trim }) => (
  <G>
    <Path d={{
      cup: 'M24 22H76C76 41 70 55 55 56V75L72 80V87H28V80L45 75V56C30 55 24 41 24 22Z',
      jar: 'M42 15H58V29Q78 39 78 65Q76 85 50 90Q24 85 22 65Q22 39 42 29Z',
      flask: 'M43 13H57V43Q73 57 73 73Q69 89 50 89Q31 89 27 73Q27 57 43 43Z',
      urn: 'M30 22H70L65 33Q82 47 78 65Q75 78 62 81L66 88H34L38 81Q25 78 22 65Q18 47 35 33Z',
    }[kind]} fill={base} stroke={L(base)} strokeWidth={3} />
    <Path d="M35 51Q50 57 65 51M37 66Q50 71 63 66" stroke={trim} strokeWidth={3} fill="none" />
    {kind === 'jar' ? <Path d="M65 34Q92 28 88 53Q85 62 75 58" stroke={trim} strokeWidth={5} fill="none" /> : null}
  </G>
);

const horn = (double = false): IconFn => ({ base, trim }) => (
  <G transform={double ? 'rotate(-12 50 50)' : undefined}>
    <Path d="M13 72C43 78 61 57 67 34L92 15 84 49 71 49C58 80 40 86 13 80Z" fill={base} stroke={L(base)} strokeWidth={3} strokeLinejoin="round" />
    <Path d="M20 76Q53 82 72 41M70 34L84 46" fill="none" stroke={trim} strokeWidth={3} />
    {double ? <Path d="M10 59Q42 61 60 28L77 17 70 35Q48 69 10 67Z" fill={trim} stroke={L(trim)} strokeWidth={2} /> : null}
  </G>
);

const rod = (kind: 'scepter' | 'stake' | 'plumb' | 'hammer' | 'timber'): IconFn => ({ base, trim }) => (
  <G transform="rotate(32 50 50)">
    <Rect x={45} y={kind === 'timber' ? 15 : 23} width={kind === 'timber' ? 17 : 10} height={66} rx={3} fill={base} stroke={L(base)} strokeWidth={3} />
    <Path d={{
      scepter: 'M50 7L62 18 56 32H44L38 18Z',
      stake: 'M44 30L50 8L56 30Z',
      plumb: 'M46 18H54V54L62 72L50 84 38 72 46 54Z',
      hammer: 'M31 15H63L70 24 65 34H31Z',
      timber: 'M49 24V69M58 32V74',
    }[kind]} fill={trim} stroke={L(base)} strokeWidth={2.4} />
  </G>
);

const jewel = (kind: 'ring' | 'bracelet' | 'mirror' | 'loop'): IconFn => ({ base, trim }) => (
  <G>
    <Ellipse cx={50} cy={kind === 'mirror' ? 38 : 56} rx={kind === 'bracelet' ? 34 : 24} ry={kind === 'bracelet' ? 24 : 28}
      fill={kind === 'mirror' ? '#AFC3CA' : 'none'} stroke={base} strokeWidth={8} />
    <Path d={{
      ring: 'M35 30L41 16H59L65 30L50 40Z',
      bracelet: 'M28 76L35 65 49 66 55 77 44 85Z M57 73L68 62 77 65 77 75 67 83Z',
      mirror: 'M45 66H55V94H45Z M40 36L53 24 56 27 43 42Z',
      loop: 'M48 30Q65 32 62 50L74 82 65 85 54 58 44 87 34 84 46 52Q37 48 39 39Z',
    }[kind]} fill={trim} stroke={L(base)} strokeWidth={2} />
  </G>
);

const tablet = (pair = false): IconFn => ({ base, trim }) => (
  <G>
    {pair ? <Path d="M7 28Q7 15 23 14Q38 15 42 28V84H7Z" fill={shade(base, -0.16)} stroke={L(base)} strokeWidth={3} /> : null}
    <Path d={pair ? 'M39 26Q42 10 65 10Q87 10 91 24V85H39Z' : 'M19 24Q50 8 81 24V87H19Z'} fill={base} stroke={L(base)} strokeWidth={3} />
    <Path d={pair ? 'M49 32H81M49 46H75M49 61H81M49 73H72M13 38H29M13 55H28' : 'M30 36H70M30 48H65M30 60H70M30 72H62'} stroke={trim} strokeWidth={3} fill="none" />
  </G>
);

const crown: IconFn = ({ base, trim }) => <G><Path d={SYMBOLS.crown} fill={base} stroke={L(base)} strokeWidth={3} />
  <Path d="M27 69H73" stroke={trim} strokeWidth={5} /><Circle cx={50} cy={57} r={5} fill={trim} /></G>;
const banner: IconFn = ({ base, trim }) => <G><Path d="M49 8V94M18 24H84" stroke={trim} strokeWidth={5} strokeLinecap="round" />
  <Path d="M22 28H78V77L50 65 22 77Z" fill={base} stroke={L(base)} strokeWidth={3} /><Path d="M33 35V60M50 33V55M67 35V60" stroke={trim} strokeWidth={3} /></G>;
const flameStand: IconFn = ({ base, trim }) => <G><Path d="M50 96V54" stroke={base} strokeWidth={11} strokeLinecap="round" />
  <Path d={SYMBOLS.flame} fill={trim} stroke={L(trim)} strokeWidth={2} transform="translate(20 -3) scale(.60)" /><Path d="M30 46Q50 57 70 46L61 62H39Z" fill={base} stroke={L(base)} strokeWidth={2} /></G>;
const incense: IconFn = ({ base, trim }) => <G><Path d="M26 44H74V80H26ZM18 80H82V87H18Z" fill={base} stroke={L(base)} strokeWidth={3} />
  <Path d="M23 49H77M36 72H64M48 40Q33 27 48 23Q60 19 52 11M60 38Q71 31 63 23" fill="none" stroke={trim} strokeWidth={3} strokeLinecap="round" /></G>;
const manna: IconFn = ({ base, trim }) => <G><Path d="M22 47Q50 31 78 47L87 61Q81 80 50 85Q19 80 13 61Z" fill={base} stroke={L(base)} strokeWidth={3} />
  <Ellipse cx={50} cy={52} rx={29} ry={10} fill={trim} />{[[37,49],[51,54],[63,49],[48,46],[57,48]].map(([x,y]) => <Circle key={x} cx={x} cy={y} r={2.6} fill={shade(base, -0.35)} />)}</G>;
const sling: IconFn = ({ base, trim }) => <G><Path d="M19 17Q31 77 51 73Q74 69 81 19" fill="none" stroke={base} strokeWidth={7} strokeLinecap="round" />
  <Path d="M34 61Q50 69 66 61L63 78Q50 89 37 78Z" fill={trim} stroke={L(base)} strokeWidth={2} /><Circle cx={50} cy={62} r={8} fill="#9B9997" /></G>;
const harp: IconFn = ({ base, trim }) => <G><Path d="M21 19Q41 5 77 14L74 68Q71 84 47 92Q27 82 21 19ZM30 24Q33 62 48 77Q62 70 64 61L67 24Z" fill={base} fillRule="evenodd" stroke={L(base)} strokeWidth={3} />
  <Path d="M38 24V65M46 25V75M54 25V74M62 24V66" stroke={trim} strokeWidth={2} /></G>;

// ------------------------------------------------------------------ registro por ID canônico
const ICONS: Record<string, IconDefinition> = {
  // Peças iniciais e itens do Mercado
  'tunic-linen': { fn: tunic({ neck: 'slit' }), base: '#E2BE84', trim: '#3C8C98' },
  'tunic-olive': { fn: tunic(), base: '#7C8A4A', trim: '#E2C98E' },
  'tunic-terracotta': { fn: tunic({ neck: 'v', sash: '#41604B' }), base: '#A9533A', trim: '#E8C98E' },
  'tunic-indigo': { fn: tunic({ stripes: true }), base: '#33466E', trim: '#D9B45A' },
  'tunic-ochre': { fn: tunic({ neck: 'v' }), base: '#C8902E', trim: '#6A3E1A' },
  'tunic-sky': { fn: tunic({ sleeve: 'long' }), base: '#7FA9C9', trim: '#F2EAD6' },
  'tunic-pomegranate': { fn: tunic({ sash: '#E2B857' }), base: '#8E2B3A', trim: '#E2B857' },
  'tunic-stone': { fn: tunic({ hem: false }), base: '#9A9286', trim: '#5E574C' },
  common_tunica_de_linho_cru: { fn: tunic({ neck: 'round', hem: false }), base: '#EADBC0', trim: '#B9A07A' },
  common_tunica_de_trabalhador: { fn: tunic({ sash: '#6A4428' }), base: '#8A6A48', trim: '#C9B48A' },
  'cloak-night': { fn: cloakDrape, base: '#3E2C63', trim: '#C9A24A' },
  common_manto_de_viagem: { fn: cloakDrape, base: '#6B5A3A', trim: '#C9B48A' },
  'cloak-wool': { fn: cape(), base: '#6E5038', trim: '#C9B48A' },
  'cloak-desert': { fn: cape({ fringe: true }), base: '#D9A75E', trim: '#3E8E9A' },
  'cloak-shepherd': { fn: cape({ hood: true }), base: '#8A7A5E', trim: '#4E3A26' },
  'cloak-crimson': { fn: cape(), base: '#8E2B2F', trim: '#E2B857' },
  rare_manto_de_la_do_pastor: { fn: cape({ fleece: true, hood: true }), base: '#E8DCC4', trim: '#7A5A3A' },
  'staff-shepherd': { fn: staff('crook'), base: '#7A5230', trim: '#000000' },
  common_cajado_de_caminhada: { fn: staff('walk'), base: '#8A6038', trim: '#000000' },
  common_vara_de_pastor: { fn: staff('rod'), base: '#6A4A2A', trim: '#000000' },
  'sandals-leather': { fn: sandal('simple'), base: '#7A4E2C', trim: '#C9A24A' },
  'sandals-woven': { fn: sandal('woven'), base: '#B08A5A', trim: '#6A4428' },
  'sandals-laced': { fn: sandal('laced'), base: '#6A4428', trim: '#C9A24A' },
  'sandals-red': { fn: sandal('simple'), base: '#9A2E2A', trim: '#E2B857' },
  common_sandalias_de_corda: { fn: sandal('rope'), base: '#8A6A48', trim: '#D9C49A' },
  common_sandalias_de_estrada: { fn: sandal('road'), base: '#5C3E28', trim: '#C9B48A' },
  rare_sandalias_do_peregrino: { fn: sandal('pilgrim'), base: '#7A4E2C', trim: '#2F6FA8' },
  'boots-travel': { fn: boots, base: '#5C3E28', trim: '#C9B48A' },
  'shoes-cloth': { fn: shoesCloth, base: '#B9A784', trim: '#6A5A3A' },
  'belt-leather': { fn: belt('leather'), base: '#6A4428', trim: '#C9A24A' },
  'belt-woven': { fn: belt('woven'), base: '#A0784A', trim: '#3E8E9A' },
  'belt-rope': { fn: belt('rope'), base: '#B8A07A', trim: '#6A5A3A' },
  'sash-blue': { fn: belt('sash'), base: '#2F5A9A', trim: '#E2C98E' },
  'sash-scarlet': { fn: belt('sash'), base: '#A12E2E', trim: '#E2B857' },
  common_faixa_de_tecido: { fn: belt('cloth'), base: '#C9B08A', trim: '#6A5A3A' },
  common_corda_de_trabalho: { fn: belt('workrope'), base: '#9A8460', trim: '#5A4A30' },
  'belt-pouch': { fn: pouch, base: '#6A4428', trim: '#C9A24A' },
  common_bolsa_do_viajante: { fn: satchel, base: '#7B4F2A', trim: '#C9A24A' },
  rare_bolsa_do_mensageiro: { fn: messenger, base: '#4E3A5E', trim: '#C9A24A' },
  common_cantil_de_agua: { fn: flask, base: '#8A6A48', trim: '#5A3A22' },
  common_bolsa_de_sementes: { fn: seedBag, base: '#C9B08A', trim: '#7A5A2A' },
  common_rede_de_pesca: { fn: net, base: '#9A8A6A', trim: '#C9A24A' },
  'headwrap-sand': { fn: turban, base: '#D8BE8C', trim: '#9C3B2A' },
  'headscarf-ochre': { fn: scarfHood, base: '#C98B3A', trim: '#5A3A6E' },
  common_pano_de_cabeca: { fn: scarfHood, base: '#E6D8BC', trim: '#3C6E8C' },
  'headband-linen': { fn: headband, base: '#E2D2B0', trim: '#3C8C98' },
  'scarf-neck': { fn: neckScarf, base: '#3C8C98', trim: '#E2C98E' },
  'necklace-cord': { fn: necklace(false), base: '#6A4428', trim: '#3C8C98' },
  'necklace-beads': { fn: necklace(true), base: '#C9A24A', trim: '#A12E2E' },
  'scroll-simple': { fn: scroll, base: '#E9D3A0', trim: '#8A5A2A' },
  common_pergaminho_simples: { fn: scroll, base: '#EFE0BC', trim: '#6A4428' },
  'oil-lamp': { fn: lamp(false), base: '#B8862B', trim: '#7A5418' },
  common_lamparina_de_barro: { fn: lamp(true), base: '#A8673E', trim: '#6A3E22' },
  common_cesto_de_junco: { fn: basket(false), base: '#C9A86A', trim: '#000000' },
  common_cesta_de_paes: { fn: basket(true), base: '#B08A5A', trim: '#D9A45E' },
  common_pote_de_barro: { fn: pot, base: '#B06A42', trim: '#5A2E1A' },
  common_ferramenta_da_colheita: { fn: sickle, base: '#7A5230', trim: '#C9A24A' },
  rare_flauta_do_musico: { fn: flute, base: '#B88A52', trim: '#2F6FA8' },
  rare_instrumento_de_cordas: { fn: lyre, base: '#8A5A2A', trim: '#E9D3A0' },
  'bg-parchment': { fn: parchment, base: '#EBDDBF', trim: '#9A7A4A' },

  'rare_estola_sacerdotal': { fn: tunic({ sleeve: 'long', stripes: true }), base: '#71397C', trim: '#DFAD58' },
  'rare_peitoral_das_doze_pedras': { fn: ceremonialChest(true), base: '#95612E', trim: '#F4CD77' },
  'rare_turbante_do_sacerdote': { fn: turban, base: '#EBDEC4', trim: '#BD9829' },
  'rare_faixa_dos_levitas': { fn: belt('sash'), base: '#425294', trim: '#D2A967' },
  'cloak-elijah': { fn: cape({ fringe: true, fleece: true }), base: '#7F543D', trim: '#E7B750' },
  'rare_cinto_de_couro_de_joao': { fn: belt('leather'), base: '#533329', trim: '#AD6B40' },
  'rare_trombeta_do_atalaia': { fn: horn(), base: '#B98B3C', trim: '#F4E0B0' },
  'rare_rolo_do_escriba': { fn: scroll, base: '#E0C68D', trim: '#8B4035' },
  'rare_bracelete_da_corte': { fn: jewel('bracelet'), base: '#BC8141', trim: '#DA5D51' },
  'rare_anel_de_selo': { fn: jewel('ring'), base: '#E3B74F', trim: '#934E51' },
  'rare_calice_de_bronze': { fn: vessel('cup'), base: '#92572A', trim: '#D99854' },
  'rare_tunica_cerimonial': { fn: tunic({ sleeve: 'long', neck: 'v', sash: '#6A3279' }), base: '#E4D1A6', trim: '#C19847' },
  'rare_cinto_da_verdade': { fn: belt('woven'), base: '#806C55', trim: '#96B7FF' },
  'epic_vestes_reais_de_ester': { fn: tunic({ sleeve: 'long', neck: 'round', sash: '#D4AF61' }), base: '#903F6D', trim: '#D4AF61' },
  'chapter_1sa_17': { fn: pouch, base: '#6E4A32', trim: '#AAA7B2' },
  'epic_capa_de_rute': { fn: cape({ hood: true, fringe: true }), base: '#91715A', trim: '#C9AF83' },
  'tunic-joseph': { fn: tunic({ sleeve: 'long', stripes: true, sash: '#22A4A0' }), base: '#AF483B', trim: '#EDC665' },
  'epic_cetro_do_rei_assuero': { fn: rod('scepter'), base: '#C59940', trim: '#C9675C' },
  'harp-psalmist': { fn: harp, base: '#A97547', trim: '#EAB75C' },
  'epic_cordao_vermelho_de_raabe': { fn: jewel('loop'), base: '#D95146', trim: '#B73835' },
  'epic_estaca_de_jael': { fn: rod('stake'), base: '#6B4630', trim: '#CDAA7A' },
  'epic_jarro_de_rebeca': { fn: vessel('jar'), base: '#A66049', trim: '#E9BA8A' },
  'epic_manto_de_mardoqueu': { fn: cloakDrape, base: '#375489', trim: '#E9C37B' },
  'epic_espada_de_gideao_emblema': { fn: badge('sword', 'frame'), base: '#353A5E', trim: '#E3C16E' },
  'epic_pergaminho_de_esdras': { fn: parchment, base: '#EDD3A0', trim: '#7B5B88' },
  'epic_tenda_de_priscila': { fn: scene('tents', 'mountains'), base: '#95675A', trim: '#F3BC79' },
  'epic_faixa_de_timoteo': { fn: belt('cloth'), base: '#8B719E', trim: '#E2BC82' },
  'epic_cajado_de_boaz': { fn: staff('walk'), base: '#9D7146', trim: '#E9B676' },
  'epic_ampola_de_perfume_de_maria': { fn: vessel('flask'), base: '#B295B5', trim: '#E5C184' },
  'book_gen': { fn: cape({ fringe: true }), base: '#59408E', trim: '#F2D48C', book: 'GEN' },
  'book_exo': { fn: staff('walk'), base: '#704725', trim: '#EDAA45', book: 'EXO' },
  'book_lev': { fn: ceremonialChest(true), base: '#663B82', trim: '#E6B650', book: 'LEV' },
  'book_num': { fn: banner, base: '#456254', trim: '#E1BE77', book: 'NUM' },
  'book_deu': { fn: scroll, base: '#DDC592', trim: '#68736F', book: 'DEU' },
  'book_jos': { fn: horn(), base: '#CB8C3E', trim: '#E2D193', book: 'JOS' },
  'book_jdg': { fn: flameStand, base: '#865834', trim: '#FFBB65', book: 'JDG' },
  'book_rut': { fn: cloakDrape, base: '#82704F', trim: '#DACC9B', book: 'RUT' },
  'sling-david': { fn: sling, base: '#875138', trim: '#D5B48D', book: '1SA' },
  'book_2sa': { fn: crown, base: '#C3933A', trim: '#A2414C', book: '2SA' },
  'book_1ki': { fn: badge('flame', 'frame'), base: '#613B41', trim: '#F9BC69', book: '1KI' },
  'book_2ki': { fn: parchment, base: '#DAC58C', trim: '#77594A', book: '2KI' },
  'book_1ch': { fn: harp, base: '#855C43', trim: '#DDCD95', book: '1CH' },
  'book_2ch': { fn: horn(true), base: '#D1AB6C', trim: '#FFE9B4', book: '2CH' },
  'book_ezr': { fn: scroll, base: '#ECD49F', trim: '#583E77', book: 'EZR' },
  'book_neh': { fn: rod('hammer'), base: '#9E724E', trim: '#DDC7AF', book: 'NEH' },
  'book_est': { fn: rod('scepter'), base: '#D4A54D', trim: '#ECCB75', book: 'EST' },
  'book_job': { fn: cape({ hood: true, fleece: true }), base: '#5E5C7F', trim: '#CFC0AA', book: 'JOB' },
  'book_psa': { fn: harp, base: '#946B3F', trim: '#E2B965', book: 'PSA' },
  'crown-wisdom': { fn: crown, base: '#B6924F', trim: '#5A8F9A', book: 'PRO' },
  'book_ecc': { fn: scroll, base: '#C5BD9A', trim: '#B07848', book: 'ECC' },
  'book_sng': { fn: necklace(true), base: '#CA817B', trim: '#E9BE86', book: 'SNG' },
  'book_isa': { fn: cape({ hood: true }), base: '#625B9E', trim: '#CEB97D', book: 'ISA' },
  'book_jer': { fn: vessel('jar'), base: '#A46A50', trim: '#DEBD91', book: 'JER' },
  'book_lam': { fn: lamp(false), base: '#C68348', trim: '#EEC068', book: 'LAM' },
  'book_ezk': { fn: scroll, base: '#D8B478', trim: '#6F477F', book: 'EZK' },
  'book_dan': { fn: badge('lion', 'frame'), base: '#56558D', trim: '#E9B969', book: 'DAN' },
  'book_hos': { fn: jewel('loop'), base: '#9D5453', trim: '#DF9A8A', book: 'HOS' },
  'book_jol': { fn: horn(), base: '#866846', trim: '#E1B46F', book: 'JOL' },
  'book_amo': { fn: rod('plumb'), base: '#987459', trim: '#C7B5A1', book: 'AMO' },
  'book_oba': { fn: badge('star', 'frame'), base: '#68747F', trim: '#D5AD66', book: 'OBA' },
  'book_jon': { fn: parchment, base: '#B4BEC4', trim: '#647C97', book: 'JON' },
  'book_mic': { fn: staff('crook'), base: '#7A5D3B', trim: '#CBAF7A', book: 'MIC' },
  'book_nam': { fn: sandal('laced'), base: '#997158', trim: '#D2AC7B', book: 'NAM' },
  'book_hab': { fn: tablet(), base: '#9D8B7C', trim: '#F0CD9F', book: 'HAB' },
  'book_zep': { fn: badge('music', 'seal'), base: '#66528B', trim: '#E5C489', book: 'ZEP' },
  'book_hag': { fn: rod('timber'), base: '#A78153', trim: '#DEB989', book: 'HAG' },
  'book_zec': { fn: badge('candle', 'seal'), base: '#4C6473', trim: '#EDBC6D', book: 'ZEC' },
  'book_mal': { fn: tablet(), base: '#B09265', trim: '#EEE0B9', book: 'MAL' },
  'book_mat': { fn: scene('star', 'city'), base: '#524B82', trim: '#EED68E', book: 'MAT' },
  'book_mrk': { fn: cloakDrape, base: '#566875', trim: '#CDC596', book: 'MRK' },
  'book_luk': { fn: scene('tents', 'city'), base: '#767098', trim: '#DDAF72', book: 'LUK' },
  'book_jhn': { fn: scroll, base: '#D4C4A1', trim: '#9D585E', book: 'JHN' },
  'book_act': { fn: cape({ fringe: true }), base: '#52686C', trim: '#DCAB63', book: 'ACT' },
  'book_rom': { fn: badge('star', 'frame'), base: '#394A81', trim: '#F4CB83', book: 'ROM' },
  'book_1co': { fn: belt('sash'), base: '#AB505F', trim: '#ECCA80', book: '1CO' },
  'book_2co': { fn: vessel('urn'), base: '#966951', trim: '#E2B992', book: '2CO' },
  'book_gal': { fn: badge('branch', 'seal'), base: '#536C61', trim: '#F7D999', book: 'GAL' },
  'book_eph': { fn: badge('star', 'shield'), base: '#434F7A', trim: '#D4BB77', book: 'EPH' },
  'book_php': { fn: belt('cloth'), base: '#A57D49', trim: '#ECCC8C', book: 'PHP' },
  'book_col': { fn: cape(), base: '#8B5A72', trim: '#D7A674', book: 'COL' },
  'book_1th': { fn: ceremonialChest(false), base: '#596D73', trim: '#E5C274', book: '1TH' },
  'book_2th': { fn: badge('path', 'frame'), base: '#71618A', trim: '#E0BD72', book: '2TH' },
  'book_1ti': { fn: badge('sword', 'seal'), base: '#715041', trim: '#EAC67D', book: '1TI' },
  'book_2ti': { fn: flameStand, base: '#744B45', trim: '#FFC271', book: '2TI' },
  'book_tit': { fn: cloakDrape, base: '#547A66', trim: '#D0BA86', book: 'TIT' },
  'book_phm': { fn: badge('dove', 'seal'), base: '#66587F', trim: '#D5B371', book: 'PHM' },
  'book_heb': { fn: badge('anchor', 'seal'), base: '#375E80', trim: '#EDC570', book: 'HEB' },
  'book_jas': { fn: jewel('mirror'), base: '#8E8183', trim: '#E8C389', book: 'JAS' },
  'book_1pe': { fn: crown, base: '#D7AA4D', trim: '#9CA8C9', book: '1PE' },
  'book_2pe': { fn: lamp(true), base: '#978C6E', trim: '#ECD297', book: '2PE' },
  'book_1jn': { fn: badge('heart', 'seal'), base: '#843F5A', trim: '#F3C17C', book: '1JN' },
  'book_2jn': { fn: scroll, base: '#DFC79B', trim: '#516A86', book: '2JN' },
  'book_3jn': { fn: satchel, base: '#833E45', trim: '#D4A76A', book: '3JN' },
  'book_jud': { fn: badge('path', 'shield'), base: '#63577B', trim: '#E7C689', book: 'JUD' },
  'book_rev': { fn: scene('crown', 'city'), base: '#6B58A5', trim: '#FFE2A3', book: 'REV' },
  'holy_luz_da_criacao': { fn: badge('star', 'seal'), base: '#836758', trim: '#FFE8A1' },
  'holy_coluna_de_nuvem_e_fogo': { fn: scene('pillar', 'mountains'), base: '#464A70', trim: '#F6B766' },
  'holy_travessia_do_mar': { fn: scene('wave', 'sea'), base: '#41839F', trim: '#B9DCF4' },
  'holy_mana_do_deserto': { fn: manna, base: '#B59961', trim: '#F7DEAA' },
  'holy_tabuas_da_alianca': { fn: tablet(true), base: '#AB8E65', trim: '#F0D097' },
  'holy_altar_do_incenso': { fn: incense, base: '#A97837', trim: '#ECCA7F' },
  'holy_fogo_no_carmelo': { fn: scene('flame', 'mountains'), base: '#79514D', trim: '#FFD197' },
  'holy_fogo_da_dedicacao_do_templo': { fn: scene('flame', 'city'), base: '#8A6D59', trim: '#FFD99A' },
  'holy_rolo_da_lei_encontrado': { fn: scroll, base: '#F3DCA7', trim: '#95633F' },
  'holy_livramento_na_fornalha': { fn: scene('flame', 'cave'), base: '#B26B4F', trim: '#FBD37D' },
  'holy_sinal_do_cordeiro_de_deus': { fn: badge('lamb', 'frame'), base: '#887249', trim: '#FFE7B2' },
  'holy_agua_transformada_em_vinho': { fn: vessel('urn'), base: '#773F63', trim: '#E4C17A' },
  'holy_paes_da_multiplicacao': { fn: basket(true), base: '#A57C47', trim: '#FFE0A2' },
  'holy_tumulo_vazio': { fn: scene('star', 'cave'), base: '#807055', trim: '#F1DBAB' },
  'holy_cenario_do_monte_da_transfiguracao': { fn: scene('suns', 'mountains'), base: '#4D779B', trim: '#FBE7B1' },
  'holy_sinal_da_pomba': { fn: badge('dove', 'frame'), base: '#4A687D', trim: '#E3D1AB' },
  'holy_chamas_de_pentecostes': { fn: badge('flame', 'seal'), base: '#7E3E5A', trim: '#FFE4B4' },
  'holy_selo_da_promessa': { fn: badge('seal', 'frame'), base: '#694870', trim: '#F7DEA7' },
  'holy_cenario_da_nova_criacao': { fn: scene('suns', 'city'), base: '#A3774A', trim: '#FFF1B9' },
  'sandals-desert': { fn: sandal('road'), base: '#B29370', trim: '#D8BD86' },
  'staff-moses': { fn: staff('rod'), base: '#A16C42', trim: '#C09C6A' },
  'cloak-succession': { fn: cape({ hood: true, fringe: true }), base: '#744049', trim: '#E0A765' },
  'cloak-elijah-prophets': { fn: cape({ fleece: true, fringe: true }), base: '#523C6E', trim: '#EDC46D' },
  'scroll-isaiah': { fn: parchment, base: '#E4C48E', trim: '#764D8B' },
  'frame-complete': { fn: badge('crown', 'frame'), base: '#6C4D7B', trim: '#F0CD83' },
  'bg-sinai': { fn: scene('flame', 'mountains'), base: '#565275', trim: '#D68961' },
  'bg-bethlehem': { fn: scene('night', 'mountains'), base: '#334F75', trim: '#E8C597' },
};

export const ICON_IDS = Object.keys(ICONS);
export const hasItemIcon = (id: string) => id in ICONS;

/** Moldura do ícone: base índigo e borda na cor da raridade (ou bronze nas peças iniciais). */
export function IconFrame({ size, color, children }: { size: number; color: string; children: ReactElement }) {
  const gradientId = `iconFrame${useId().replace(/[^a-z0-9]/gi, '')}`;
  return (
    <Svg width={size} height={size} viewBox="0 0 100 100">
      <Defs>
        <LinearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
          <Stop offset="0" stopColor="#2E2742" />
          <Stop offset="1" stopColor="#191427" />
        </LinearGradient>
      </Defs>
      <Rect x={2.5} y={2.5} width={95} height={95} rx={16} fill={`url(#${gradientId})`} stroke={color} strokeWidth={5} />
      <Rect x={7} y={7} width={86} height={86} rx={12} fill="none" stroke="#FFFFFF" strokeOpacity={0.08} strokeWidth={1.5} />
      <G transform="translate(12 12) scale(0.76)">{children}</G>
    </Svg>
  );
}

export function ItemThumbnail({ id, size, frame }: { id: string; size: number; frame?: string }) {
  const def = ICONS[id];
  if (!def) return null;
  const art = (
    <G>
      <G transform={def.book ? 'translate(8 0) scale(.84)' : undefined}>
        {def.fn({ base: def.base, trim: def.trim })}
      </G>
      {def.book ? (
        <G>
          <Rect x={27} y={83} width={46} height={16} rx={5} fill="#281C29" stroke="#E7B56D" strokeWidth={1.7} />
          <SvgText x={50} y={95} textAnchor="middle" fontSize={12} fontWeight="bold" fill="#FFF0CD">{def.book}</SvgText>
        </G>
      ) : null}
    </G>
  );
  if (frame) return <IconFrame size={size} color={frame}>{art}</IconFrame>;
  return (
    <Svg width={size} height={size} viewBox="0 0 100 100">
      {art}
    </Svg>
  );
}
