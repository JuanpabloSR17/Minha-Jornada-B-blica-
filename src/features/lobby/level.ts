import { readingLevel } from '@/features/journey/progression';

/**
 * Nível de exibição do jogador, calculado só a partir do XP que o servidor já registrou.
 * Não concede nada. É o mesmo nível do Perfil e do resultado da leitura (progression.readingLevel):
 * as etapas pedem 120, 200, 280 XP… e cada faixa de nível tem um título de viajante.
 */
export type Level = { level: number; into: number; span: number; progress: number; title: string };

export function levelFromXp(xp: number): Level {
  const r = readingLevel(Math.floor(Number.isFinite(xp) ? xp : 0));
  return { level: r.level, into: r.currentXp, span: r.xpForLevel, progress: r.currentXp / r.xpForLevel, title: r.title };
}
