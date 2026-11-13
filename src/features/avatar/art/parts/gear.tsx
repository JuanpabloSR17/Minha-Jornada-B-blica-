import { Defs, Ellipse, G, Path } from 'react-native-svg';
import { lineOf, mix, shade } from '../color';
import { CANVAS, GROUND_Y, anchors, f, sliver, tunicHalfWidthAt, type Pt } from '../geometry';
import { VolumeGradient, url } from '../paint';
import { p, type ArtContext, type VectorArt } from '../types';

/**
 * Peças de viagem vestidas (protótipo vetorial, pose de repouso 1024×1536).
 *
 * Cada peça é dividida em camadas de encaixe:
 * - bolsa: alça na camada `chest` (cruza a túnica, passa sob o manto dianteiro) e bolsa na `waist`
 *   (repousa no quadril, sob o braço);
 * - cajado: haste em `cloak_front` (abaixo da mão) e dedos fechados em `hand_item` (acima da haste);
 * - coberturas de cabeça: `headwear` + cabelo ajustado em `back_item` (o manifest esconde o cabelo
 *   original e esta camada desenha só o que aparece sob o tecido, na cor do cabelo do jogador);
 * - manto drapeado: parte dianteira em `chest`, abaixo dos braços (o manto passa atrás do braço).
 *
 * Ajustes por perfil de corpo vêm dos parâmetros da peça: `dx.<corpo>` e `dy.<corpo>`.
 */

const CX = CANVAS.cx;

const num = (ctx: ArtContext, key: string) => {
  const v = ctx.params[key];
  return typeof v === 'number' ? v : 0;
};
/** Deslocamento específico do perfil de corpo (encaixe fino por peça). */
const adj = (ctx: ArtContext) => ({ dx: num(ctx, `dx.${ctx.bodyId}`), dy: num(ctx, `dy.${ctx.bodyId}`) });

function capsule(a: Pt, b: Pt, w: number, color: string, outline = true) {
  const d = `M${f(a.x)} ${f(a.y)} L${f(b.x)} ${f(b.y)}`;
  return (
    <G>
      {outline ? <Path d={d} stroke={lineOf(color)} strokeWidth={w + 6} strokeLinecap="round" fill="none" /> : null}
      <Path d={d} stroke={color} strokeWidth={w} strokeLinecap="round" fill="none" />
    </G>
  );
}

// ================================================================= bolsa a tiracolo

/** Encaixes da bolsa: alça do ombro direito do personagem até o quadril oposto. */
function satchelFit(ctx: ArtContext) {
  const { g } = ctx;
  const { dx, dy } = adj(ctx);
  const shoulder = { x: CX + g.shoulder - 40, y: 452 };
  const hip = { x: CX - g.hip * 0.66 + dx, y: 884 + dy };
  return { shoulder, hip };
}

export const satchelStrap: VectorArt = (ctx) => {
  const base = p(ctx, 'base', '#7B4F2A');
  const { shoulder, hip } = satchelFit(ctx);
  const back = { x: shoulder.x + 26, y: shoulder.y - 8 };
  return (
    <G>
      {capsule(back, shoulder, 20, shade(base, -0.25))}
      {capsule(shoulder, { x: hip.x + 18, y: hip.y - 40 }, 22, base)}
      <Path d={`M${f(shoulder.x - 6)} ${f(shoulder.y + 6)} L${f(hip.x + 12)} ${f(hip.y - 46)}`} stroke={shade(base, 0.25)} strokeWidth={3} strokeDasharray="8 7" fill="none" />
      {/* fivela no peito */}
      <Path d={`M${f(CX + 2)} 640 l26 -14 l10 18 l-26 14 Z`} fill="#C9A24A" stroke={lineOf('#C9A24A')} strokeWidth={3} />
    </G>
  );
};

export const satchelBag: VectorArt = (ctx) => {
  const base = p(ctx, 'base', '#7B4F2A');
  const trim = p(ctx, 'trim', '#C9A24A');
  const { hip } = satchelFit(ctx);
  const id = `${ctx.uid}-bag`;
  const w = 58;
  const top = hip.y - 46;
  const body = `M${f(hip.x - w)} ${f(top + 10)} C${f(hip.x - w - 6)} ${f(top + 70)} ${f(hip.x - w + 6)} ${f(top + 104)} ${f(hip.x - w + 22)} ${f(top + 112)} L${f(hip.x + w - 18)} ${f(top + 114)} C${f(hip.x + w + 2)} ${f(top + 104)} ${f(hip.x + w + 8)} ${f(top + 70)} ${f(hip.x + w)} ${f(top + 8)} Q${f(hip.x)} ${f(top - 4)} ${f(hip.x - w)} ${f(top + 10)} Z`;
  const flap = `M${f(hip.x - w - 4)} ${f(top + 6)} Q${f(hip.x)} ${f(top - 10)} ${f(hip.x + w + 4)} ${f(top + 4)} L${f(hip.x + w - 2)} ${f(top + 52)} Q${f(hip.x)} ${f(top + 70)} ${f(hip.x - w + 2)} ${f(top + 54)} Z`;
  return (
    <G>
      <Defs>
        <VolumeGradient id={id} base={base} edge={-0.3} />
      </Defs>
      <Path d={body} fill={url(id)} stroke={lineOf(base)} strokeWidth={3.5} strokeLinejoin="round" />
      <Path d={flap} fill={shade(base, 0.08)} stroke={lineOf(base)} strokeWidth={3.5} strokeLinejoin="round" />
      <Path d={`M${f(hip.x - w + 8)} ${f(top + 46)} Q${f(hip.x)} ${f(top + 60)} ${f(hip.x + w - 8)} ${f(top + 44)}`} stroke={shade(base, 0.3)} strokeWidth={2.4} strokeDasharray="6 6" fill="none" />
      <Path d={`M${f(hip.x - 9)} ${f(top + 54)} h18 v18 h-18 Z`} fill={trim} stroke={lineOf(trim)} strokeWidth={2.4} />
      <Path d={sliver({ x: hip.x - w + 10, y: top + 70 }, { x: hip.x - w + 26, y: top + 108 }, 5, -3)} fill={shade(base, -0.35)} opacity={0.5} />
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
      <Path d={`M${f(CX - hw)} ${f(y - 4)} Q${CX} ${f(y + 12)} ${f(CX + hw)} ${f(y - 4)} L${f(CX + hw)} ${f(y + 22)} Q${CX} ${f(y + 38)} ${f(CX - hw)} ${f(y + 22)} Z`} fill={base} stroke={lineOf(base)} strokeWidth={3.2} />
      <Path d={`M${f(CX - hw + 6)} ${f(y + 8)} Q${CX} ${f(y + 22)} ${f(CX + hw - 6)} ${f(y + 8)}`} stroke={shade(base, 0.3)} strokeWidth={2} strokeDasharray="6 6" fill="none" />
      <Path d={`M${CX - 16} ${f(y)} h32 v28 h-32 Z`} fill="none" stroke={metal} strokeWidth={5} />
      <Path d={`M${f(px - 30)} ${f(y + 24)} C${f(px - 34)} ${f(y + 70)} ${f(px - 20)} ${f(y + 92)} ${f(px)} ${f(y + 94)} C${f(px + 20)} ${f(y + 92)} ${f(px + 34)} ${f(y + 70)} ${f(px + 30)} ${f(y + 24)} Z`} fill={shade(base, 0.06)} stroke={lineOf(base)} strokeWidth={3.2} />
      <Path d={`M${f(px - 30)} ${f(y + 26)} Q${f(px)} ${f(y + 56)} ${f(px + 30)} ${f(y + 26)}`} fill={shade(base, -0.12)} stroke={lineOf(base)} strokeWidth={3} />
      <Path d={`M${f(px)} ${f(y + 42)} a5 5 0 1 0 0.1 0`} fill={metal} />
    </G>
  );
};

// ================================================================= cajados

/** Encaixe do cajado: a haste passa pelo centro da mão direita do personagem (lado do observador à direita). */
function staffFit(ctx: ArtContext) {
  const w = anchors(ctx.g, 1).wrist;
  const { dx } = adj(ctx);
  return { x: w.x + dx, hand: w.y - 8 };
}

function staffShaft(ctx: ArtContext, top: number, crook: boolean) {
  const wood = p(ctx, 'wood', '#7A5230');
  const { x } = staffFit(ctx);
  const d = crook
    ? `M${f(x)} ${GROUND_Y + 6} L${f(x)} ${top + 70} C${f(x)} ${top - 4} ${f(x + 96)} ${top - 10} ${f(x + 100)} ${top + 50} C${f(x + 102)} ${top + 82} ${f(x + 80)} ${top + 96} ${f(x + 62)} ${top + 86}`
    : `M${f(x)} ${GROUND_Y + 6} L${f(x)} ${top}`;
  return (
    <G>
      <Path d={d} stroke={lineOf(wood)} strokeWidth={24} strokeLinecap="round" strokeLinejoin="round" fill="none" />
      <Path d={d} stroke={wood} strokeWidth={17} strokeLinecap="round" strokeLinejoin="round" fill="none" />
      <Path d={d} stroke={shade(wood, 0.3)} strokeWidth={4} strokeLinecap="round" fill="none" transform="translate(-4 0)" opacity={0.7} />
      {[0.22, 0.48, 0.74].map((t) => {
        const y = top + 120 + (GROUND_Y - top - 160) * t;
        return <Path key={t} d={`M${f(x - 8)} ${f(y)} q8 6 16 0`} stroke={shade(wood, -0.35)} strokeWidth={2.4} fill="none" />;
      })}
      {crook ? null : <Ellipse cx={x} cy={top} rx={16} ry={14} fill={shade(wood, -0.08)} stroke={lineOf(wood)} strokeWidth={3} />}
    </G>
  );
}

export const staffCrook: VectorArt = (ctx) => staffShaft(ctx, 300, true);
export const staffWalk: VectorArt = (ctx) => (
  <G>
    {staffShaft(ctx, 330, false)}
    {/* tira de couro amarrada abaixo do topo */}
    <Path d={`M${f(staffFit(ctx).x - 12)} 372 l24 8 M${f(staffFit(ctx).x - 12)} 386 l24 8`} stroke="#5A3A22" strokeWidth={6} strokeLinecap="round" />
  </G>
);

/** Mão fechada em volta da haste: dedos dobrados à frente e polegar por cima. */
export const staffGrip: VectorArt = (ctx) => {
  const { g, skin } = ctx;
  const { x, hand } = staffFit(ctx);
  const hw = g.forearm * 0.8 + 6;
  const line = lineOf(skin);
  const fingers = [0, 1, 2, 3].map((i) => {
    const y = hand + 30 + i * 13;
    return `M${f(x - hw)} ${f(y)} C${f(x - hw - 4)} ${f(y + 12)} ${f(x + hw + 2)} ${f(y + 14)} ${f(x + hw + 4)} ${f(y + 2)} C${f(x + hw + 2)} ${f(y - 6)} ${f(x - hw)} ${f(y - 8)} ${f(x - hw)} ${f(y)} Z`;
  });
  const palm = `M${f(x - hw)} ${f(hand - 4)} C${f(x - hw - 4)} ${f(hand + 20)} ${f(x - hw)} ${f(hand + 40)} ${f(x - hw + 4)} ${f(hand + 70)} L${f(x + hw)} ${f(hand + 70)} C${f(x + hw + 4)} ${f(hand + 40)} ${f(x + hw + 4)} ${f(hand + 18)} ${f(x + hw)} ${f(hand - 4)} Z`;
  const thumb = `M${f(x - hw + 2)} ${f(hand + 14)} C${f(x - 6)} ${f(hand + 10)} ${f(x + 10)} ${f(hand + 18)} ${f(x + 14)} ${f(hand + 28)} C${f(x + 10)} ${f(hand + 36)} ${f(x - 8)} ${f(hand + 34)} ${f(x - hw + 2)} ${f(hand + 30)} Z`;
  const parts = [palm, ...fingers, thumb];
  return (
    <G>
      {parts.map((d, i) => <Path key={`o${i}`} d={d} fill={line} stroke={line} strokeWidth={5} strokeLinejoin="round" />)}
      {parts.map((d, i) => <Path key={`f${i}`} d={d} fill={i === 0 ? shade(skin, -0.04) : i === parts.length - 1 ? skin : shade(skin, -0.02 - i * 0.015)} />)}
      {fingers.map((_, i) => (
        <Path key={`k${i}`} d={`M${f(x + hw - 6)} ${f(hand + 31 + i * 13)} q4 -4 6 0`} stroke={shade(skin, -0.32)} strokeWidth={1.6} fill="none" />
      ))}
    </G>
  );
};

// ================================================================= coberturas de cabeça

/**
 * Cabelo sob a cobertura: o manifest esconde as camadas originais de cabelo e esta camada
 * desenha só o que aparece por baixo do tecido, conforme o estilo e a cor do jogador.
 */
export const hairUnderCover: VectorArt = (ctx) => {
  const hair = ctx.hair;
  const line = lineOf(hair);
  const style = ctx.hairStyle ?? 'hair-short';
  if (style === 'hair-long-wavy') {
    const d = 'M418 236 C404 320 424 380 404 452 C392 520 412 580 396 640 C428 664 462 650 486 664 L538 664 C562 650 596 664 628 640 C612 580 632 520 620 452 C600 380 620 320 606 236 Z';
    return (
      <G>
        <Path d={d} fill={hair} stroke={line} strokeWidth={3} />
        <Path d="M420 300 C412 380 408 470 418 560 M604 300 C612 380 616 470 606 560" stroke={shade(hair, 0.25)} strokeWidth={3} fill="none" opacity={0.6} />
      </G>
    );
  }
  if (style === 'hair-curly') {
    const puffs = [[426, 262, 26], [418, 300, 28], [430, 336, 24], [598, 262, 26], [606, 300, 28], [594, 336, 24], [470, 372, 22], [554, 372, 22], [512, 384, 24]] as const;
    return (
      <G>
        {puffs.map(([x, y, r], i) => <Ellipse key={`o${i}`} cx={x} cy={y} rx={r + 3} ry={r + 3} fill={line} />)}
        {puffs.map(([x, y, r], i) => <Ellipse key={i} cx={x} cy={y} rx={r} ry={r} fill={i % 2 ? hair : shade(hair, 0.08)} />)}
      </G>
    );
  }
  // curto: só costeletas aparecem
  return (
    <G>
      {[-1, 1].map((s) => (
        <Path key={s} d={`M${CX + s * 84} 236 C${CX + s * 92} 262 ${CX + s * 90} 292 ${CX + s * 84} 310 L${CX + s * 76} 300 C${CX + s * 78} 280 ${CX + s * 76} 258 ${CX + s * 72} 240 Z`} fill={hair} stroke={line} strokeWidth={2.4} />
      ))}
    </G>
  );
};

export const turban: VectorArt = (ctx) => {
  const base = p(ctx, 'base', '#D8BE8C');
  const trim = p(ctx, 'trim', '#9C3B2A');
  const id = `${ctx.uid}-turban`;
  const dome = 'M398 240 C392 170 432 96 512 92 C592 96 632 170 626 240 Q512 266 398 240 Z';
  const wraps = [
    'M402 226 C446 150 560 118 622 168',
    'M404 196 C470 214 560 196 620 222',
    'M418 150 C470 178 552 170 604 140',
  ];
  return (
    <G>
      <Defs>
        <VolumeGradient id={id} base={base} edge={-0.28} light={0.12} />
      </Defs>
      <Path d={dome} fill={url(id)} stroke={lineOf(base)} strokeWidth={3.5} strokeLinejoin="round" />
      {wraps.map((d, i) => (
        <G key={i}>
          <Path d={d} stroke={shade(base, -0.22)} strokeWidth={7} fill="none" strokeLinecap="round" opacity={0.55} />
          <Path d={d} stroke={shade(base, 0.2)} strokeWidth={2.4} fill="none" strokeLinecap="round" transform="translate(0 -6)" opacity={0.7} />
        </G>
      ))}
      <Path d="M400 238 Q512 262 624 238" stroke={trim} strokeWidth={10} fill="none" strokeLinecap="round" />
      <Path d="M400 238 Q512 262 624 238" stroke={shade(trim, 0.35)} strokeWidth={2.4} fill="none" strokeDasharray="3 9" />
      {/* ponta solta do tecido sobre o ombro */}
      <Path d="M612 214 C640 240 646 300 632 360 C626 390 640 420 650 440 L626 446 C610 410 604 380 610 350 C620 300 612 256 596 230 Z" fill={shade(base, -0.06)} stroke={lineOf(base)} strokeWidth={3} strokeLinejoin="round" />
    </G>
  );
};

/** Lenço que cobre a cabeça e cai nos ombros: parte de trás (atrás do corpo). */
export const scarfBack: VectorArt = (ctx) => {
  const base = p(ctx, 'base', '#C98B3A');
  const s = ctx.g.shoulder;
  const d = `M512 106 C602 106 650 180 650 270 C652 360 660 420 ${f(CX + s + 6)} 520 C${f(CX + s + 20)} 600 ${f(CX + s - 10)} 660 ${f(CX + s - 40)} 690 L${f(CX - s + 40)} 690 C${f(CX - s + 10)} 660 ${f(CX - s - 20)} 600 ${f(CX - s - 6)} 520 C364 420 372 360 374 270 C374 180 422 106 512 106 Z`;
  return <Path d={d} fill={shade(base, -0.18)} stroke={lineOf(base)} strokeWidth={3.5} strokeLinejoin="round" />;
};

export const scarfFront: VectorArt = (ctx) => {
  const base = p(ctx, 'base', '#C98B3A');
  const trim = p(ctx, 'trim', '#5A3A6E');
  const id = `${ctx.uid}-scarf`;
  const s = ctx.g.shoulder;
  const outer = `M512 104 C600 104 646 176 646 262 C648 340 640 400 ${f(CX + s - 20)} 470 C${f(CX + s - 8)} 520 ${f(CX + s - 30)} 560 ${f(CX + s - 60)} 580 Q512 610 ${f(CX - s + 60)} 580 C${f(CX - s + 30)} 560 ${f(CX - s + 8)} 520 ${f(CX - s + 20)} 470 C384 400 376 340 378 262 C378 176 424 104 512 104 Z`;
  // abertura do rosto (preenchimento par-ímpar)
  const hole = 'M512 186 C566 186 600 222 604 270 C608 330 594 384 560 410 C540 424 524 428 512 428 C500 428 484 424 464 410 C430 384 416 330 420 270 C424 222 458 186 512 186 Z';
  return (
    <G>
      <Defs>
        <VolumeGradient id={id} base={base} edge={-0.3} light={0.1} />
      </Defs>
      {/* franja do cabelo do jogador aparecendo na abertura */}
      <Path d="M440 214 C470 192 554 192 584 214 C560 210 540 214 528 222 C516 212 496 212 484 222 C472 214 456 212 440 214 Z" fill={ctx.hair} stroke={lineOf(ctx.hair)} strokeWidth={2.4} />
      <Path d={`${outer} ${hole}`} fillRule="evenodd" fill={url(id)} stroke={lineOf(base)} strokeWidth={3.5} strokeLinejoin="round" />
      <Path d={hole} fill="none" stroke={trim} strokeWidth={7} />
      <Path d={hole} fill="none" stroke={mix(trim, '#FFFFFF', 0.4)} strokeWidth={2} strokeDasharray="4 8" />
      <Path d={sliver({ x: 404, y: 300 }, { x: 420, y: 470 }, 6, -6)} fill={shade(base, -0.3)} opacity={0.45} />
      <Path d={sliver({ x: 620, y: 300 }, { x: 604, y: 470 }, 6, 6)} fill={shade(base, -0.3)} opacity={0.45} />
    </G>
  );
};

// ================================================================= manto drapeado

/**
 * Parte dianteira do manto drapeado: cai do ombro esquerdo do observador, cruza o peito até o
 * quadril oposto e fica ABAIXO da camada dos braços (o manto passa atrás do braço).
 */
export const drapeFront: VectorArt = (ctx) => {
  const { g } = ctx;
  const base = p(ctx, 'base', '#3E2C63');
  const trim = p(ctx, 'trim', '#C9A24A');
  const id = `${ctx.uid}-drape`;
  const s = g.shoulder;
  const { dy } = adj(ctx);
  const hipR = { x: CX + g.hip * 0.9, y: 900 + dy };
  const d = `M${f(CX - s - 8)} 450 C${f(CX - s + 40)} 432 ${f(CX - 40)} 438 ${f(CX - 6)} 470 C${f(CX + 60)} 560 ${f(hipR.x - 30)} ${f(hipR.y - 160)} ${f(hipR.x + 14)} ${f(hipR.y - 40)} C${f(hipR.x + 4)} ${f(hipR.y + 10)} ${f(hipR.x - 50)} ${f(hipR.y + 30)} ${f(hipR.x - 90)} ${f(hipR.y + 10)} C${f(CX - 20)} 760 ${f(CX - s + 10)} 760 ${f(CX - s - 24)} 1080 C${f(CX - s - 40)} 900 ${f(CX - s - 40)} 600 ${f(CX - s - 8)} 450 Z`;
  return (
    <G>
      <Defs>
        <VolumeGradient id={id} base={base} edge={-0.32} light={0.14} />
      </Defs>
      <Path d={d} fill={url(id)} stroke={lineOf(base)} strokeWidth={3.5} strokeLinejoin="round" />
      {[0, 1, 2].map((i) => (
        <Path key={i} d={sliver({ x: CX - s + 30 + i * 46, y: 520 + i * 30 }, { x: hipR.x - 120 + i * 30, y: hipR.y - 20 - i * 30 }, 8, 10)} fill={shade(base, -0.35)} opacity={0.45} />
      ))}
      <Path d={sliver({ x: CX - s - 6, y: 600 }, { x: CX - s - 18, y: 1040 }, 7, -8)} fill={shade(base, 0.25)} opacity={0.3} />
      <Path d={`M${f(CX - s - 24)} 1076 C${f(CX - s + 10)} 760 ${f(CX - 20)} 760 ${f(hipR.x - 90)} ${f(hipR.y + 10)}`} stroke={trim} strokeWidth={6} fill="none" />
      {/* broche no ombro */}
      <Ellipse cx={CX - s + 22} cy={470} rx={20} ry={20} fill={trim} stroke={lineOf(trim)} strokeWidth={3} />
      <Path d={`M${CX - s + 22} 456 l4 10 l10 4 l-10 4 l-4 10 l-4 -10 l-10 -4 l10 -4 Z`} fill={shade(trim, 0.4)} />
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
};
