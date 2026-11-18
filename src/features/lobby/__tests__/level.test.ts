import { levelFromXp } from '../level';
import { readingLevel } from '@/features/journey/progression';

describe('levelFromXp', () => {
  it('começa no nível 1, Viajante', () => {
    expect(levelFromXp(0)).toEqual({ level: 1, into: 0, span: 120, progress: 0, title: 'Viajante' });
  });
  it('é o mesmo nível do Perfil (etapas de 120, 200, 280 XP…)', () => {
    expect(levelFromXp(119).level).toBe(1);
    expect(levelFromXp(120)).toMatchObject({ level: 2, into: 0, span: 200 });
    expect(levelFromXp(320)).toMatchObject({ level: 3, into: 0, span: 280 });
    for (const xp of [0, 480, 960, 5000]) expect(levelFromXp(xp).level).toBe(readingLevel(xp).level);
  });
  it('trata valores inválidos como zero', () => {
    expect(levelFromXp(-40).level).toBe(1);
    expect(levelFromXp(Number.NaN).level).toBe(1);
  });
});
