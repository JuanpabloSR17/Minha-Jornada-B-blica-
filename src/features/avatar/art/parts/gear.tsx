import { ClipPath, Defs, Ellipse, G, LinearGradient, Path, Stop } from 'react-native-svg';
import { lineOf, mix, shade } from '../color';
import { CANVAS, GROUND_Y, HEAD_T, anchors, f, headPt, quadPt, sliver, tunicHalfWidthAt, type Pt } from '../geometry';
import { VolumeGradient, url } from '../paint';
import { p, type ArtContext, type VectorArt } from '../types';

/**
 * Peças de viagem vestidas (revisão visual v3: proporção adulta, pose do cajado e materiais).
 *
 * Camadas de encaixe:
 * - bolsa: alça em `chest` (curva que acompanha o volume do peito e da túnica, com sombra suave) e
 *   bolsa em `waist` (repousa no quadril oposto, sob o braço);
 * - cajado: haste em `cloak_front` e mão fechada em `hand_item`. O cajado põe o braço direito na
 *   pose `staff` (cotovelo dobrado, mão à altura do peito) — braço, manga e mão seguem as âncoras;
 * - coberturas de cabeça: `headwear` no espaço da cabeça (reduzida) + cabelo ajustado em `back_item`;
 * - manto drapeado: costas em `cloak_back` e frente em `chest`, abaixo dos braços.
 *
 * Ajustes por perfil de corpo: parâmetros `dx.<corpo>` e `dy.<corpo>` da peça.
 */

const CX = CANVAS.cx;

const num = (ctx: ArtContext, key: string) => {
  const v = ctx.params[key];
  return typeof v === 'number' ? v : 0;
};
/** Deslocamento específico do perfil de corpo (encaixe fino por peça). */
const adj = (ctx: ArtContext) => ({ dx: num(ctx, `dx.${ctx.bodyId}`), dy: num(ctx, `dy.${ctx.bodyId}`) });
const P = (pt: Pt) => `${f(pt.x)} ${f(pt.y)}`;

/** Ponto numa cúbica (para fivelas e costuras acompanharem a alça). */
function cubicPt(a: Pt, c1: Pt, c2: Pt, b: Pt, t: number): Pt {
  const u = 1 - t;
  return {
    x: u * u * u * a.x + 3 * u * u * t * c1.x + 3 * u * t * t * c2.x + t * t * t * b.x,
    y: u * u * u * a.y + 3 * u * u * t * c1.y + 3 * u * t * t * c2.y + t * t * t * b.y,
  };
}

/** Riscos curtos e claros: desgaste do couro. */
function scuffs(pts: [number, number, number][], color: string) {
  return pts.map(([x, y, a], i) => (
    <Path key={i} d={`M${f(x)} ${f(y)} l${f(Math.cos(a) * 10)} ${f(Math.sin(a) * 10)}`} stroke={color} strokeWidth={1.6} strokeLinecap="round" opacity={0.55} />
  ));
}

// ================================================================= bolsa a tiracolo

/** Encaixes da bolsa: alça do ombro direito do personagem até o quadril oposto, contornando o peito. */
function satchelFit(ctx: ArtContext) {
  const { g } = ctx;
  const { dx, dy } = adj(ctx);
  const shoulder = { x: CX + g.shoulder - 40, y: 452 };
  const hip = { x: CX - g.hip * 0.66 + dx, y: 884 + dy };
  const end = { x: hip.x + 20, y: hip.y - 44 };
  // controles: a alça desce pelo ombro, abraça o volume do peito e assenta na barriga
  const c1 = { x: CX + g.chest * 0.62, y: 560 };
  const c2 = { x: CX - g.chest * 0.18, y: 700 };
  return { shoulder, hip, end, c1, c2 };
}

export const satchelStrap: VectorArt = (ctx) => {
  const base = p(ctx, 'base', '#7B4F2A');
  const { shoulder, end, c1, c2 } = satchelFit(ctx);
  const d = `M${P(shoulder)} C${P(c1)} ${P(c2)} ${P(end)}`;
  const back = { x: shoulder.x + 26, y: shoulder.y - 10 };
  const buckle = cubicPt(shoulder, c1, c2, end, 0.42);
  return (
    <G>
      {/* sombra suave da alça sobre a túnica */}
      <Path d={d} stroke="#1A0E06" strokeWidth={26} strokeLinecap="round" fill="none" opacity={0.16} transform="translate(5 7)" />
      <Path d={`M${P(back)} L${P(shoulder)}`} stroke={shade(base, -0.3)} strokeWidth={20} strokeLinecap="round" />
      <Path d={d} stroke={lineOf(base)} strokeWidth={25} strokeLinecap="round" fill="none" />
      <Path d={d} stroke={base} strokeWidth={21} strokeLinecap="round" fill="none" />
      <Path d={d} stroke={shade(base, 0.22)} strokeWidth={5} strokeLinecap="round" fill="none" transform="translate(-4 -3)" opacity={0.6} />
      <Path d={d} stroke={shade(base, 0.38)} strokeWidth={1.6} strokeDasharray="6 6" fill="none" transform="translate(-7 -2)" opacity={0.8} />
      <Path d={d} stroke={shade(base, 0.38)} strokeWidth={1.6} strokeDasharray="6 6" fill="none" transform="translate(6 3)" opacity={0.6} />
      {/* fivela de bronze no peito */}
      <G transform={`translate(${f(buckle.x)} ${f(buckle.y)}) rotate(58)`}>
        <Path d="M-13 -11 h26 v22 h-26 Z" fill="none" stroke="#4A2E10" strokeWidth={8} />
        <Path d="M-13 -11 h26 v22 h-26 Z" fill="none" stroke="#C99A45" strokeWidth={4.5} />
        <Path d="M0 -11 v22" stroke="#E9C878" strokeWidth={2.4} />
      </G>
    </G>
  );
};

export const satchelBag: VectorArt = (ctx) => {
  const base = p(ctx, 'base', '#7B4F2A');
  const trim = p(ctx, 'trim', '#C9A24A');
  const { hip } = satchelFit(ctx);
  const id = `${ctx.uid}-bag`;
  const w = 60;
  const top = hip.y - 48;
  const x = hip.x;
  const body = `M${f(x - w)} ${f(top + 12)} C${f(x - w - 8)} ${f(top + 72)} ${f(x - w + 4)} ${f(top + 106)} ${f(x - w + 22)} ${f(top + 114)} Q${f(x)} ${f(top + 122)} ${f(x + w - 18)} ${f(top + 116)} C${f(x + w + 4)} ${f(top + 106)} ${f(x + w + 10)} ${f(top + 72)} ${f(x + w)} ${f(top + 10)} Q${f(x)} ${f(top - 4)} ${f(x - w)} ${f(top + 12)} Z`;
  const flap = `M${f(x - w - 5)} ${f(top + 6)} Q${f(x)} ${f(top - 12)} ${f(x + w + 5)} ${f(top + 4)} L${f(x + w - 1)} ${f(top + 56)} Q${f(x)} ${f(top + 74)} ${f(x - w + 1)} ${f(top + 58)} Z`;
  return (
    <G>
      <Defs>
        <VolumeGradient id={id} base={base} edge={-0.34} light={0.14} />
      </Defs>
      {/* sombra de contato no quadril */}
      <Ellipse cx={x + 6} cy={top + 70} rx={w + 8} ry={52} fill="#1A0E06" opacity={0.16} />
      <Path d={body} fill={url(id)} stroke={lineOf(base)} strokeWidth={3} strokeLinejoin="round" />
      {/* couro gasto: bordas mais claras e marcas */}
      <Path d={body} fill="none" stroke={shade(base, 0.3)} strokeWidth={2} opacity={0.35} transform="translate(0 -2)" />
      <Path d={`M${f(x - w + 14)} ${f(top + 108)} Q${f(x)} ${f(top + 116)} ${f(x + w - 14)} ${f(top + 110)}`} stroke={shade(base, -0.35)} strokeWidth={3} fill="none" opacity={0.6} />
      {scuffs([[x - 38, top + 86, 0.3], [x + 24, top + 96, -0.4], [x - 10, top + 100, 0.1], [x + 40, top + 80, 1.2]], shade(base, 0.45))}
      <Path d={flap} fill={shade(base, 0.06)} stroke={lineOf(base)} strokeWidth={3} strokeLinejoin="round" />
      <Path d={`M${f(x - w + 6)} ${f(top + 8)} Q${f(x)} ${f(top - 6)} ${f(x + w - 6)} ${f(top + 6)}`} stroke={shade(base, 0.35)} strokeWidth={3} fill="none" opacity={0.5} />
      <Path d={`M${f(x - w + 8)} ${f(top + 48)} Q${f(x)} ${f(top + 64)} ${f(x + w - 8)} ${f(top + 46)}`} stroke={shade(base, 0.4)} strokeWidth={1.6} strokeDasharray="5 5" fill="none" />
      {scuffs([[x - 30, top + 22, 0.2], [x + 30, top + 30, -0.3]], shade(base, 0.5))}
      {/* tira de fecho com fivela */}
      <Path d={`M${f(x - 8)} ${f(top + 34)} h16 v56 h-16 Z`} fill={shade(base, -0.1)} stroke={lineOf(base)} strokeWidth={2.4} />
      <Path d={`M${f(x - 13)} ${f(top + 58)} h26 v16 h-26 Z`} fill="none" stroke="#4A2E10" strokeWidth={6} />
      <Path d={`M${f(x - 13)} ${f(top + 58)} h26 v16 h-26 Z`} fill="none" stroke={trim} strokeWidth={3.4} />
      <Path d={sliver({ x: x - w + 10, y: top + 70 }, { x: x - w + 26, y: top + 108 }, 5, -3)} fill={shade(base, -0.4)} opacity={0.5} />
    </G>
  );
};

// ================================================================= cinto com bolsa

export const beltPouch: VectorArt = (ctx) => {
  const { g } = ctx;
  const base = p(ctx, 'base', '#6A4428');
  const metal = p(ctx, 'metal', '#C9A24A');
  const { dx, dy } = adj(ctx);
  const y = 806 + dy;
  const hw = tunicHalfWidthAt(g, y) + 4;
  const px = CX + g.waist * 0.52 + dx;
  return (
    <G>
      <Path d={`M${f(CX - hw)} ${f(y + 4)} Q${CX} ${f(y + 22)} ${f(CX + hw)} ${f(y + 4)}`} stroke="#1A0E06" strokeWidth={20} opacity={0.14} fill="none" transform="translate(0 6)" />
      <Path d={`M${f(CX - hw)} ${f(y - 4)} Q${CX} ${f(y + 12)} ${f(CX + hw)} ${f(y - 4)} L${f(CX + hw)} ${f(y + 22)} Q${CX} ${f(y + 38)} ${f(CX - hw)} ${f(y + 22)} Z`} fill={base} stroke={lineOf(base)} strokeWidth={2.6} />
      <Path d={`M${f(CX - hw + 6)} ${f(y + 8)} Q${CX} ${f(y + 22)} ${f(CX + hw - 6)} ${f(y + 8)}`} stroke={shade(base, 0.35)} strokeWidth={1.6} strokeDasharray="6 6" fill="none" />
      {scuffs([[CX - hw + 20, y + 10, 0.1], [CX + 40, y + 16, -0.1]], shade(base, 0.45))}
      <Path d={`M${CX - 16} ${f(y)} h32 v28 h-32 Z`} fill="none" stroke="#4A2E10" strokeWidth={7} />
      <Path d={`M${CX - 16} ${f(y)} h32 v28 h-32 Z`} fill="none" stroke={metal} strokeWidth={4} />
      <Path d={`M${f(px - 30)} ${f(y + 24)} C${f(px - 34)} ${f(y + 70)} ${f(px - 20)} ${f(y + 92)} ${f(px)} ${f(y + 94)} C${f(px + 20)} ${f(y + 92)} ${f(px + 34)} ${f(y + 70)} ${f(px + 30)} ${f(y + 24)} Z`} fill={shade(base, 0.06)} stroke={lineOf(base)} strokeWidth={2.6} />
      <Path d={`M${f(px - 30)} ${f(y + 26)} Q${f(px)} ${f(y + 56)} ${f(px + 30)} ${f(y + 26)}`} fill={shade(base, -0.12)} stroke={lineOf(base)} strokeWidth={2.4} />
      <Path d={`M${f(px)} ${f(y + 42)} a5 5 0 1 0 0.1 0`} fill={metal} />
    </G>
  );
};

// ================================================================= cajados

/**
 * Encaixe do cajado: a haste passa pelo punho fechado da mão direita. Na pose `staff` o punho fica
 * acima do pulso (antebraço subindo); a haste corre à frente do corpo até o chão.
 */
function staffFit(ctx: ArtContext) {
  const pose = ctx.armPose ?? 'rest';
  const w = anchors(ctx.g, 1, pose).wrist;
  const { dx } = adj(ctx);
  const raised = pose === 'staff';
  return { x: w.x + dx + (raised ? 6 : 0), fistTop: raised ? w.y - 70 : w.y - 8, raised };
}

function staffShaft(ctx: ArtContext, top: number, crook: boolean) {
  const wood = p(ctx, 'wood', '#7A5230');
  const { x, fistTop } = staffFit(ctx);
  const id = `${ctx.uid}-wood`;
  const d = crook
    ? `M${f(x)} ${GROUND_Y + 6} L${f(x)} ${top + 70} C${f(x)} ${top - 4} ${f(x + 92)} ${top - 12} ${f(x + 98)} ${top + 46} C${f(x + 100)} ${top + 80} ${f(x + 78)} ${top + 94} ${f(x + 60)} ${top + 84}`
    : `M${f(x)} ${GROUND_Y + 6} L${f(x)} ${top}`;
  // veios da madeira: riscos finos e ondulados ao longo da haste
  const grain = [-4, 2, 6].map((o, i) => {
    let path = `M${f(x + o)} ${top + 110}`;
    for (let y = top + 110; y < GROUND_Y - 20; y += 60) path += ` q${i % 2 ? 2 : -2} 30 0 60`;
    return <Path key={o} d={path} stroke={shade(wood, i === 1 ? 0.25 : -0.35)} strokeWidth={1.4} fill="none" opacity={0.55} />;
  });
  return (
    <G>
      <Defs>
        <LinearGradient id={id} x1="0" y1="0" x2="1" y2="0">
          <Stop offset="0" stopColor={shade(wood, -0.3)} />
          <Stop offset="0.4" stopColor={shade(wood, 0.12)} />
          <Stop offset="1" stopColor={shade(wood, -0.38)} />
        </LinearGradient>
      </Defs>
      <Path d={d} stroke={lineOf(wood)} strokeWidth={22} strokeLinecap="round" strokeLinejoin="round" fill="none" />
      <Path d={d} stroke={wood} strokeWidth={17} strokeLinecap="round" strokeLinejoin="round" fill="none" />
      <Path d={`M${f(x - 8.5)} ${top + 70} H${f(x + 8.5)} V${GROUND_Y + 4} H${f(x - 8.5)} Z`} fill={url(id)} />
      {grain}
      <Path d={d} stroke={shade(wood, 0.32)} strokeWidth={3} strokeLinecap="round" fill="none" transform="translate(-4 0)" opacity={0.5} />
      {/* nós e marcas; madeira polida pelo uso perto da mão e escurecida no pé */}
      {[[0.32, 7], [0.58, 6], [0.8, 8]].map(([t, r], i) => {
        const y = top + 140 + (GROUND_Y - top - 200) * t!;
        return <Ellipse key={i} cx={x + (i % 2 ? 3 : -3)} cy={y} rx={r! * 0.6} ry={r!} fill={shade(wood, -0.4)} opacity={0.75} />;
      })}
      <Path d={`M${f(x - 7)} ${f(fistTop - 30)} V${f(fistTop + 110)}`} stroke={shade(wood, 0.45)} strokeWidth={3} opacity={0.35} strokeLinecap="round" />
      <Path d={`M${f(x)} ${GROUND_Y - 70} V${GROUND_Y + 4}`} stroke="#2A1A0E" strokeWidth={16} opacity={0.3} strokeLinecap="round" />
      {crook ? (
        <Path d={`M${f(x + 92)} ${top + 30} q4 12 2 24`} stroke={shade(wood, 0.35)} strokeWidth={2.4} fill="none" opacity={0.6} />
      ) : (
        <Ellipse cx={x} cy={top} rx={15} ry={13} fill={shade(wood, -0.08)} stroke={lineOf(wood)} strokeWidth={2.4} />
      )}
    </G>
  );
}

export const staffCrook: VectorArt = (ctx) => staffShaft(ctx, 236, true);
export const staffWalk: VectorArt = (ctx) => {
  const { x } = staffFit(ctx);
  return (
    <G>
      {staffShaft(ctx, 262, false)}
      {/* tira de couro amarrada abaixo do topo */}
      <Path d={`M${f(x - 12)} 300 l24 8 M${f(x - 12)} 314 l24 8`} stroke="#5A3A22" strokeWidth={6} strokeLinecap="round" />
    </G>
  );
};

/** Mão fechada em volta da haste: dedos dobrados à frente (nós visíveis) e polegar por cima. */
export const staffGrip: VectorArt = (ctx) => {
  const { g, skin } = ctx;
  const { x, fistTop } = staffFit(ctx);
  const hw = g.forearm * 0.8 + 7;
  const line = lineOf(skin);
  const fingers = [0, 1, 2, 3].map((i) => {
    const y = fistTop + 22 + i * 13;
    return `M${f(x - hw - 1)} ${f(y)} C${f(x - hw - 5)} ${f(y + 12)} ${f(x + hw + 2)} ${f(y + 14)} ${f(x + hw + 5)} ${f(y + 2)} C${f(x + hw + 3)} ${f(y - 6)} ${f(x - hw)} ${f(y - 8)} ${f(x - hw - 1)} ${f(y)} Z`;
  });
  const back = `M${f(x + hw - 6)} ${f(fistTop - 2)} C${f(x + hw + 8)} ${f(fistTop + 20)} ${f(x + hw + 10)} ${f(fistTop + 50)} ${f(x + hw + 4)} ${f(fistTop + 76)} L${f(x - hw + 4)} ${f(fistTop + 74)} C${f(x - hw - 2)} ${f(fistTop + 50)} ${f(x - hw)} ${f(fistTop + 20)} ${f(x - hw + 6)} ${f(fistTop)} Z`;
  const thumb = `M${f(x - hw + 2)} ${f(fistTop + 8)} C${f(x - 6)} ${f(fistTop + 2)} ${f(x + 12)} ${f(fistTop + 8)} ${f(x + 16)} ${f(fistTop + 18)} C${f(x + 12)} ${f(fistTop + 28)} ${f(x - 8)} ${f(fistTop + 26)} ${f(x - hw + 2)} ${f(fistTop + 22)} Z`;
  const parts = [back, ...fingers, thumb];
  return (
    <G>
      {parts.map((d, i) => <Path key={`o${i}`} d={d} fill={line} stroke={line} strokeWidth={4} strokeLinejoin="round" />)}
      {parts.map((d, i) => <Path key={`f${i}`} d={d} fill={i === 0 ? shade(skin, -0.12) : i === parts.length - 1 ? shade(skin, 0.04) : shade(skin, -0.02 - i * 0.02)} />)}
      {fingers.map((_, i) => (
        <Path key={`k${i}`} d={`M${f(x + hw - 4)} ${f(fistTop + 23 + i * 13)} q4 -4 6 0`} stroke={shade(skin, -0.32)} strokeWidth={1.4} fill="none" />
      ))}
      <Path d={`M${f(x - hw + 6)} ${f(fistTop + 12)} q10 -4 18 2`} stroke={shade(skin, 0.18)} strokeWidth={2} fill="none" opacity={0.7} />
    </G>
  );
};

// ================================================================= coberturas de cabeça

/**
 * Cabelo sob a cobertura (espaço da cabeça): o manifest esconde as camadas originais de cabelo e esta
 * camada desenha só o que aparece por baixo do tecido, conforme o estilo e a cor do jogador.
 */
export const hairUnderCover: VectorArt = (ctx) => {
  const hair = ctx.hair;
  const line = lineOf(hair);
  const style = ctx.hairStyle ?? 'hair-short';
  let el;
  if (style === 'hair-long-wavy') {
    const d = 'M418 236 C404 320 424 380 404 452 C392 520 412 580 396 640 C428 664 462 650 486 664 L538 664 C562 650 596 664 628 640 C612 580 632 520 620 452 C600 380 620 320 606 236 Z';
    el = (
      <G>
        <Path d={d} fill={hair} stroke={line} strokeWidth={3} />
        <Path d="M420 300 C412 380 408 470 418 560 M604 300 C612 380 616 470 606 560" stroke={shade(hair, 0.25)} strokeWidth={3} fill="none" opacity={0.6} />
      </G>
    );
  } else if (style === 'hair-curly') {
    const puffs = [[426, 262, 26], [418, 300, 28], [430, 336, 24], [598, 262, 26], [606, 300, 28], [594, 336, 24], [470, 372, 22], [554, 372, 22], [512, 384, 24]] as const;
    el = (
      <G>
        {puffs.map(([x, y, r], i) => <Ellipse key={`o${i}`} cx={x} cy={y} rx={r + 3} ry={r + 3} fill={line} />)}
        {puffs.map(([x, y, r], i) => <Ellipse key={i} cx={x} cy={y} rx={r} ry={r} fill={i % 2 ? hair : shade(hair, 0.08)} />)}
      </G>
    );
  } else {
    // curto: só costeletas aparecem
    el = (
      <G>
        {[-1, 1].map((s) => (
          <Path key={s} d={`M${CX + s * 84} 236 C${CX + s * 92} 262 ${CX + s * 90} 292 ${CX + s * 84} 310 L${CX + s * 76} 300 C${CX + s * 78} 280 ${CX + s * 76} 258 ${CX + s * 72} 240 Z`} fill={hair} stroke={line} strokeWidth={2.4} />
        ))}
      </G>
    );
  }
  return <G transform={HEAD_T}>{el}</G>;
};

export const turban: VectorArt = (ctx) => {
  const base = p(ctx, 'base', '#D8BE8C');
  const trim = p(ctx, 'trim', '#9C3B2A');
  const id = `${ctx.uid}-turban`;
  const dome = 'M398 240 C392 170 432 96 512 92 C592 96 632 170 626 240 Q512 266 398 240 Z';
  const wraps = ['M402 226 C446 150 560 118 622 168', 'M404 196 C470 214 560 196 620 222', 'M418 150 C470 178 552 170 604 140', 'M410 176 C460 150 530 140 612 194'];
  return (
    <G transform={HEAD_T}>
      <Defs>
        <VolumeGradient id={id} base={base} edge={-0.3} light={0.14} />
      </Defs>
      <Path d={dome} fill={url(id)} stroke={lineOf(base)} strokeWidth={3} strokeLinejoin="round" />
      {wraps.map((d, i) => (
        <G key={i}>
          <Path d={d} stroke={shade(base, -0.24)} strokeWidth={8} fill="none" strokeLinecap="round" opacity={0.45} />
          <Path d={d} stroke={shade(base, 0.22)} strokeWidth={2.4} fill="none" strokeLinecap="round" transform="translate(0 -6)" opacity={0.7} />
        </G>
      ))}
      {/* trama do tecido */}
      <Path d="M420 120 L600 210 M440 104 L620 190 M410 150 L560 230 M480 96 L626 170" stroke={shade(base, -0.15)} strokeWidth={1} opacity={0.35} />
      <Path d="M400 238 Q512 262 624 238" stroke={shade(trim, -0.3)} strokeWidth={13} fill="none" strokeLinecap="round" />
      <Path d="M400 238 Q512 262 624 238" stroke={trim} strokeWidth={9} fill="none" strokeLinecap="round" />
      <Path d="M400 238 Q512 262 624 238" stroke={shade(trim, 0.45)} strokeWidth={2} fill="none" strokeDasharray="3 9" />
      {/* ponta solta do tecido caindo atrás da orelha até o ombro */}
      <Path d="M612 214 C640 240 650 300 640 380 C636 430 650 480 664 520 L636 526 C618 480 610 440 614 390 C622 320 612 260 596 230 Z" fill={shade(base, -0.08)} stroke={lineOf(base)} strokeWidth={3} strokeLinejoin="round" />
      <Path d="M622 260 C632 320 628 400 640 500" stroke={shade(base, -0.28)} strokeWidth={3} fill="none" opacity={0.5} />
    </G>
  );
};

/** Lenço que cobre a cabeça e cai nos ombros: parte de trás (atrás do corpo). */
export const scarfBack: VectorArt = (ctx) => {
  const base = p(ctx, 'base', '#C98B3A');
  const s = ctx.g.shoulder;
  const tl = headPt(374, 270);
  const tr = headPt(650, 270);
  const top = headPt(512, 104);
  const d = `M${P(top)} C${P(headPt(612, 104))} ${P(headPt(650, 180))} ${P(tr)} C${f(tr.x + 10)} 420 ${f(CX + s)} 470 ${f(CX + s + 6)} 530 C${f(CX + s + 16)} 600 ${f(CX + s - 10)} 660 ${f(CX + s - 40)} 690 L${f(CX - s + 40)} 690 C${f(CX - s + 10)} 660 ${f(CX - s - 16)} 600 ${f(CX - s - 6)} 530 C${f(CX - s)} 470 ${f(tl.x - 10)} 420 ${P(tl)} C${P(headPt(374, 180))} ${P(headPt(412, 104))} ${P(top)} Z`;
  return (
    <G>
      <Path d={d} fill={shade(base, -0.2)} stroke={lineOf(base)} strokeWidth={3} strokeLinejoin="round" />
      <Path d={`M${f(CX - s + 20)} 600 Q${CX} 640 ${f(CX + s - 20)} 600`} stroke={shade(base, -0.4)} strokeWidth={4} fill="none" opacity={0.4} />
    </G>
  );
};

/** Frente do lenço: capuz no espaço da cabeça (com abertura do rosto) e duas abas caindo nos ombros. */
export const scarfFront: VectorArt = (ctx) => {
  const base = p(ctx, 'base', '#C98B3A');
  const trim = p(ctx, 'trim', '#5A3A6E');
  const id = `${ctx.uid}-scarf`;
  const s = ctx.g.shoulder;
  const hood = 'M512 104 C600 104 646 176 646 262 C648 320 640 360 620 392 Q512 420 404 392 C384 360 376 320 378 262 C378 176 424 104 512 104 Z';
  const hole = 'M512 186 C566 186 600 222 604 270 C608 330 594 384 560 410 C540 424 524 428 512 428 C500 428 484 424 464 410 C430 384 416 330 420 270 C424 222 458 186 512 186 Z';
  // abas: do lado do capuz (espaço da cabeça convertido) até a frente dos ombros
  const flap = (side: -1 | 1) => {
    const a = headPt(512 + side * 132, 300);
    const b = headPt(512 + side * 96, 420);
    const sh = { x: CX + side * (s - 18), y: 520 };
    const tip = { x: CX + side * (s - 54), y: 610 };
    return `M${P(a)} C${f(a.x + side * 18)} ${f(a.y + 60)} ${f(sh.x + side * 10)} ${f(sh.y - 30)} ${P(sh)} C${f(sh.x)} ${f(sh.y + 40)} ${f(tip.x + side * 10)} ${f(tip.y)} ${P(tip)} C${f(tip.x - side * 30)} ${f(tip.y - 30)} ${f(b.x + side * 10)} ${f(b.y + 60)} ${P(b)} Z`;
  };
  return (
    <G>
      <Defs>
        <VolumeGradient id={id} base={base} edge={-0.32} light={0.12} />
      </Defs>
      {([-1, 1] as const).map((side) => (
        <G key={side}>
          <Path d={flap(side)} fill={url(id)} stroke={lineOf(base)} strokeWidth={3} strokeLinejoin="round" />
          <Path d={sliver(headPt(512 + side * 120, 360), { x: CX + side * (s - 40), y: 590 }, 6, side * 6)} fill={shade(base, -0.32)} opacity={0.45} />
        </G>
      ))}
      <G transform={HEAD_T}>
        {/* franja do cabelo do jogador aparecendo na abertura */}
        <Path d="M440 214 C470 192 554 192 584 214 C560 210 540 214 528 222 C516 212 496 212 484 222 C472 214 456 212 440 214 Z" fill={ctx.hair} stroke={lineOf(ctx.hair)} strokeWidth={2.4} />
        <Path d={`${hood} ${hole}`} fillRule="evenodd" fill={url(id)} stroke={lineOf(base)} strokeWidth={3.4} strokeLinejoin="round" />
        <Path d="M420 150 C460 130 560 130 604 150 M396 230 C380 300 392 360 410 390 M628 230 C644 300 632 360 614 390" stroke={shade(base, -0.28)} strokeWidth={5} fill="none" opacity={0.4} />
        <Path d={hole} fill="none" stroke={trim} strokeWidth={8} />
        <Path d={hole} fill="none" stroke={mix(trim, '#FFFFFF', 0.4)} strokeWidth={2} strokeDasharray="4 8" />
      </G>
    </G>
  );
};

// ================================================================= manto drapeado (lã)

/** Trama da lã: riscos diagonais finos recortados pela forma do tecido. */
function woolTexture(clipId: string, d: string, base: string, area: { x: number; y: number; w: number; h: number }) {
  let hatch = '';
  for (let i = -area.h; i < area.w; i += 11) hatch += `M${f(area.x + i)} ${f(area.y)} l${f(area.h * 0.5)} ${f(area.h)} `;
  let cross = '';
  for (let i = 0; i < area.w + area.h; i += 17) cross += `M${f(area.x + i)} ${f(area.y)} l${f(-area.h * 0.35)} ${f(area.h)} `;
  return (
    <G>
      <Defs>
        <ClipPath id={clipId}>
          <Path d={d} />
        </ClipPath>
      </Defs>
      <G clipPath={`url(#${clipId})`}>
        <Path d={hatch} stroke={shade(base, -0.4)} strokeWidth={1.4} opacity={0.22} />
        <Path d={cross} stroke={shade(base, 0.3)} strokeWidth={1} opacity={0.14} />
      </G>
    </G>
  );
}

/** Barra bordada: faixa dourada com losangos, acompanhando uma curva (quadrática). */
function embroidery(a: Pt, c: Pt, b: Pt, trim: string, n: number) {
  const d = `M${P(a)} Q${P(c)} ${P(b)}`;
  return (
    <G>
      <Path d={d} stroke={shade(trim, -0.45)} strokeWidth={11} fill="none" strokeLinecap="round" />
      <Path d={d} stroke={trim} strokeWidth={7} fill="none" strokeLinecap="round" />
      {Array.from({ length: n }, (_, i) => {
        const pt = quadPt(a, c, b, (i + 0.5) / n);
        return <Path key={i} d={`M${f(pt.x)} ${f(pt.y - 3.5)} l3.5 3.5 l-3.5 3.5 l-3.5 -3.5 Z`} fill={shade(trim, -0.5)} />;
      })}
    </G>
  );
}

/** Costas do manto: lã volumosa caindo até a canela, dobras profundas e barra bordada. */
export const drapeBack: VectorArt = (ctx) => {
  const { g } = ctx;
  const base = p(ctx, 'base', '#3E2C63');
  const trim = p(ctx, 'trim', '#C9A24A');
  const id = `${ctx.uid}-dbk`;
  const s = g.shoulder;
  const L = (x: number) => CX - x;
  const R = (x: number) => CX + x;
  const d = `M${L(g.neck + 20)} 426 C${L(s + 14)} 432 ${L(s + 48)} 472 ${L(s + 54)} 570 C${L(s + 84)} 830 ${L(s + 118)} 1110 ${L(s + 132)} 1396 C${L(s + 60)} 1420 ${R(s + 60)} 1420 ${R(s + 132)} 1396 C${R(s + 118)} 1110 ${R(s + 84)} 830 ${R(s + 54)} 570 C${R(s + 48)} 472 ${R(s + 14)} 432 ${R(g.neck + 20)} 426 Z`;
  return (
    <G>
      <Defs>
        <VolumeGradient id={id} base={shade(base, -0.16)} edge={-0.36} light={0.08} />
      </Defs>
      <Path d={d} fill={url(id)} stroke={lineOf(base)} strokeWidth={2.6} strokeLinejoin="round" />
      {woolTexture(`${id}-t`, d, base, { x: L(s + 140), y: 420, w: 2 * (s + 140), h: 1000 })}
      {([-1, 1] as const).map((side) => [0.25, 0.5, 0.75, 0.95].map((k, i) => (
        <Path key={`${side}${i}`} d={sliver({ x: CX + side * (s + 24 * k), y: 560 + i * 26 }, { x: CX + side * (s + 128 * k), y: 1384 }, 10 - i, side * (i % 2 ? 12 : -8))} fill={shade(base, i % 2 ? 0.2 : -0.4)} opacity={i % 2 ? 0.22 : 0.42} />
      )))}
      {embroidery({ x: L(s + 126), y: 1372 }, { x: CX, y: 1408 }, { x: R(s + 126), y: 1372 }, trim, 14)}
    </G>
  );
};

/**
 * Frente do manto drapeado: cai do ombro esquerdo do observador, cruza o peito até o quadril oposto e
 * fica ABAIXO da camada dos braços (o manto passa atrás do braço). Lã com trama, dobras e barra bordada.
 */
export const drapeFront: VectorArt = (ctx) => {
  const { g } = ctx;
  const base = p(ctx, 'base', '#3E2C63');
  const trim = p(ctx, 'trim', '#C9A24A');
  const id = `${ctx.uid}-drape`;
  const s = g.shoulder;
  const { dy } = adj(ctx);
  const hipR = { x: CX + g.hip * 0.9, y: 900 + dy };
  const d = `M${f(CX - s - 12)} 448 C${f(CX - s + 40)} 426 ${f(CX - 40)} 434 ${f(CX - 4)} 468 C${f(CX + 64)} 560 ${f(hipR.x - 30)} ${f(hipR.y - 160)} ${f(hipR.x + 16)} ${f(hipR.y - 40)} C${f(hipR.x + 6)} ${f(hipR.y + 12)} ${f(hipR.x - 50)} ${f(hipR.y + 34)} ${f(hipR.x - 92)} ${f(hipR.y + 12)} C${f(CX - 20)} 780 ${f(CX - s + 8)} 800 ${f(CX - s - 28)} 1110 C${f(CX - s - 46)} 900 ${f(CX - s - 44)} 600 ${f(CX - s - 12)} 448 Z`;
  return (
    <G>
      <Defs>
        <VolumeGradient id={id} base={base} edge={-0.36} light={0.16} />
      </Defs>
      {/* sombra suave do manto sobre a túnica */}
      <Path d={d} fill="#140A1E" opacity={0.22} transform="translate(8 10)" />
      <Path d={d} fill={url(id)} stroke={lineOf(base)} strokeWidth={2.6} strokeLinejoin="round" />
      {woolTexture(`${id}-t`, d, base, { x: CX - s - 60, y: 420, w: 2 * s + 120, h: 720 })}
      {/* dobras volumosas: sombra profunda + luz na crista */}
      {[0, 1, 2, 3].map((i) => (
        <G key={i}>
          <Path d={sliver({ x: CX - s + 20 + i * 40, y: 510 + i * 26 }, { x: hipR.x - 130 + i * 30, y: hipR.y - 10 - i * 36 }, 11, 12)} fill={shade(base, -0.45)} opacity={0.5} />
          <Path d={sliver({ x: CX - s + 36 + i * 40, y: 500 + i * 26 }, { x: hipR.x - 116 + i * 30, y: hipR.y - 24 - i * 36 }, 4, 10)} fill={shade(base, 0.35)} opacity={0.35} />
        </G>
      ))}
      <Path d={sliver({ x: CX - s - 8, y: 600 }, { x: CX - s - 20, y: 1080 }, 8, -8)} fill={shade(base, 0.3)} opacity={0.28} />
      <Path d={sliver({ x: CX - s + 10, y: 640 }, { x: CX - s - 4, y: 1060 }, 7, 6)} fill={shade(base, -0.45)} opacity={0.4} />
      {embroidery({ x: CX - s - 26, y: 1104 }, { x: CX - s + 30, y: 800 }, { x: hipR.x - 90, y: hipR.y + 10 }, trim, 10)}
      {/* broche de bronze no ombro */}
      <Ellipse cx={CX - s + 22} cy={468} rx={22} ry={22} fill="#4A2E10" />
      <Ellipse cx={CX - s + 22} cy={468} rx={19} ry={19} fill={trim} />
      <Ellipse cx={CX - s + 22} cy={468} rx={12} ry={12} fill="none" stroke={shade(trim, -0.4)} strokeWidth={1.6} />
      <Path d={`M${CX - s + 22} 454 l4 10 l10 4 l-10 4 l-4 10 l-4 -10 l-10 -4 l10 -4 Z`} fill={shade(trim, 0.45)} />
    </G>
  );
};

export const gear: Record<string, VectorArt> = {
  'satchel.strap': satchelStrap,
  'satchel.bag': satchelBag,
  'belt.pouch': beltPouch,
  'staff.crook': staffCrook,
  'staff.walk': staffWalk,
  grip: staffGrip,
  underhair: hairUnderCover,
  turban,
  'scarf.back': scarfBack,
  'scarf.front': scarfFront,
  drape: drapeFront,
  'drape.back': drapeBack,
};
