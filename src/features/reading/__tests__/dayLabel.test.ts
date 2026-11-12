import { dayLabel } from '../components/dayLabel';

describe('rótulo de dia da meta', () => {
  it('mostra dia/mês a partir da data civil do servidor (sem conversão de fuso no aparelho)', () => {
    expect(dayLabel('2026-11-21')).toBe('21/11');
    expect(dayLabel('2027-01-01')).toBe('01/01');
  });
});
