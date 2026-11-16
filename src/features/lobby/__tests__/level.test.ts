import { levelFromXp } from '../level';

describe('levelFromXp', () => {
  it('começa no nível 1', () => {
    expect(levelFromXp(0)).toEqual({ level: 1, into: 0, span: 200, progress: 0 });
  });
  it('sobe com custos crescentes (200, 300, 400…)', () => {
    expect(levelFromXp(199).level).toBe(1);
    expect(levelFromXp(200)).toMatchObject({ level: 2, into: 0, span: 300 });
    expect(levelFromXp(499).level).toBe(2);
    expect(levelFromXp(500)).toMatchObject({ level: 3, into: 0, span: 400 });
    expect(levelFromXp(960)).toMatchObject({ level: 4, into: 60, span: 500 });
  });
  it('trata valores inválidos como zero', () => {
    expect(levelFromXp(-40).level).toBe(1);
    expect(levelFromXp(Number.NaN).level).toBe(1);
  });
});
