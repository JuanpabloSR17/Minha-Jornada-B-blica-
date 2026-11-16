/**
 * Nível de exibição do jogador, calculado só a partir do XP que o servidor já registrou.
 * Não concede nada: serve para o HUD mostrar progresso como num jogo.
 * Subir do nível n para n + 1 custa 200 + 100 × (n − 1) XP (200, 300, 400…).
 */
export type Level = { level: number; into: number; span: number; progress: number };

export function levelFromXp(xp: number): Level {
  let level = 1;
  let floor = 0;
  let span = 200;
  const total = Math.max(0, Math.floor(Number.isFinite(xp) ? xp : 0));
  while (total >= floor + span) {
    floor += span;
    level += 1;
    span = 200 + 100 * (level - 1);
  }
  const into = total - floor;
  return { level, into, span, progress: into / span };
}
