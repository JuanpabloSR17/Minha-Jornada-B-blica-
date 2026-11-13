import type { ReactElement } from 'react';
import Svg, { Circle, Defs, Ellipse, G, LinearGradient, Path, Rect, Stop } from 'react-native-svg';
import { lineOf, shade } from './color';

/**
 * Miniaturas de inventário por ID canônico (viewBox 100×100), desenhadas à parte da arte vestida: a peça
 * inteira, de frente, reconhecível pela silhueta e por detalhes próprios. A mesma arte aparece no Mercado,
 * na recompensa, no guarda-roupa e no detalhe (todas as telas usam ItemIcon). A raridade vai na moldura.
 */
type C = { base: string; trim: string; extra?: string };
type IconFn = (c: C) => ReactElement;
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

// ------------------------------------------------------------------ registro por ID canônico
const ICONS: Record<string, { fn: IconFn; base: string; trim: string }> = {
  // prova 3D e iniciais
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
};

export const ICON_IDS = Object.keys(ICONS);
export const hasItemIcon = (id: string) => id in ICONS;

/** Moldura do ícone: base índigo e borda na cor da raridade (ou bronze nas peças iniciais). */
export function IconFrame({ size, color, children }: { size: number; color: string; children: ReactElement }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 100 100">
      <Defs>
        <LinearGradient id="iconFrameFill" x1="0" y1="0" x2="0" y2="1">
          <Stop offset="0" stopColor="#2E2742" />
          <Stop offset="1" stopColor="#191427" />
        </LinearGradient>
      </Defs>
      <Rect x={2.5} y={2.5} width={95} height={95} rx={16} fill="url(#iconFrameFill)" stroke={color} strokeWidth={5} />
      <Rect x={7} y={7} width={86} height={86} rx={12} fill="none" stroke="#FFFFFF" strokeOpacity={0.08} strokeWidth={1.5} />
      <G transform="translate(12 12) scale(0.76)">{children}</G>
    </Svg>
  );
}

export function ItemThumbnail({ id, size, frame }: { id: string; size: number; frame?: string }) {
  const def = ICONS[id];
  if (!def) return null;
  const art = def.fn({ base: def.base, trim: def.trim });
  if (frame) return <IconFrame size={size} color={frame}>{art}</IconFrame>;
  return (
    <Svg width={size} height={size} viewBox="0 0 100 100">
      {art}
    </Svg>
  );
}
