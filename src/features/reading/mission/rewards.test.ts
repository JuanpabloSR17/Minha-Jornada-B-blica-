import { readingRewards } from './rewards';
import type { MissionResult } from './mission.service';

const reading: MissionResult = {
  sessionId: 'session',
  chapter: 1,
  mode: 'physical',
  activeSeconds: 60,
  alreadyCompleted: false,
  duplicate: false,
  xpAwarded: 40,
  xpTotal: 60,
  granted: [],
  missions: [],
  bookJustCompleted: false,
  chaptersCompleted: 1,
  totalChapters: 1189,
  percent: 0.08,
  booksCompleted: 0,
  book: { code: 'RUT', name: 'Rute', total: 4, completed: 1, isComplete: false, legendaryItemId: 'book_rut' },
};

const goal: NonNullable<MissionResult['dailyGoal']> = {
  day: '2026-11-16', achievedNow: true, achievedToday: true, siclosAwarded: 40,
  siclosBalance: 120, xpBonus: 20, newChaptersToday: 1, goal: null,
};

describe('recibo da leitura', () => {
  it('soma XP de leitura e bônus da meta, e mostra os Siclos efetivamente concedidos', () => {
    expect(readingRewards({ ...reading, dailyGoal: goal })).toEqual([
      { kind: 'xp', amount: 60, chapterXp: 40, bonus: 20 },
      { kind: 'siclos', amount: 40 },
    ]);
    expect(readingRewards({ ...reading, dailyGoal: { ...goal, achievedNow: false } })).toEqual([
      { kind: 'xp', amount: 40, chapterXp: 40, bonus: 0 },
    ]);
  });

  it('exibe o recibo original depois de recuperar uma resposta, com IDs únicos e raridades em ordem', () => {
    const result = {
      ...reading,
      duplicate: true,
      granted: ['holy_arca_da_alianca_representacao', 'book_rut', 'rare_manto_do_profeta', 'cloak-elijah'],
    };
    expect(readingRewards(result).filter((r) => r.kind === 'item').map((r) => r.id)).toEqual([
      'cloak-elijah', 'book_rut', 'holy_arca_da_alianca_representacao',
    ]);
  });

  it('não gera bolsa para releitura vazia, mas mostra um Raro concedido na releitura', () => {
    const reread = { ...reading, alreadyCompleted: true, xpAwarded: 0 };
    expect(readingRewards(reread)).toEqual([]);
    expect(readingRewards({ ...reread, granted: ['cloak-elijah'] })).toMatchObject([
      { kind: 'item', id: 'cloak-elijah', item: { rarity: 'rare' } },
    ]);
  });

  it('adiciona a escolha da meta ao recibo depois que ela foi confirmada', () => {
    const chosenItem = 'common_bolsa_do_viajante';
    const state = {
      day: goal.day, timeZone: 'America/Sao_Paulo', siclosAwarded: 40, options: [chosenItem],
      available: [], chosenItem, choicePending: false, book: 'RUT', chapter: 1,
    };
    expect(readingRewards({ ...reading, dailyGoal: { ...goal, goal: state } })).toMatchObject([
      { kind: 'xp' }, { kind: 'siclos' }, { kind: 'item', id: chosenItem, item: { rarity: 'common' } },
    ]);
  });
});
