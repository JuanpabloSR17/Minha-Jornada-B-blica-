import { filterMilestones, milestoneRows, milestoneSummary } from '../milestones';

describe('marcos dos Santos na interface', () => {
  const ex25 = ['holy_arca_da_alianca_representacao', 'holy_mesa_dos_paes_da_presenca', 'holy_candelabro_do_tabernaculo'];

  it('20 marcos e 22 Santos do catálogo vigente', () => {
    const s = milestoneSummary(milestoneRows(new Set(), new Set()));
    expect(s).toEqual({ milestonesDone: 0, milestonesTotal: 20, saintsOwned: 0, saintsTotal: 22 });
  });

  it('Êxodo 25 com posse parcial: três itens, um já possuído, dois ainda concedíveis; marco a cumprir', () => {
    const row = milestoneRows(new Set(), new Set(['holy_mesa_dos_paes_da_presenca'])).find((r) => r.id === 'marco_mobilia_do_tabernaculo')!;
    expect(row.items.map((i) => i.id)).toEqual(ex25);
    expect(row.items.map((i) => i.owned)).toEqual([false, true, false]);
    expect(row.completed).toBe(false);
    expect(row.grantable).toEqual(['holy_arca_da_alianca_representacao', 'holy_candelabro_do_tabernaculo']);
  });

  it('estado vem do registro de conclusão, não da posse; filtros', () => {
    const owned = new Set(['holy_mana_do_deserto', 'holy_mesa_dos_paes_da_presenca']);
    const rows = milestoneRows(new Set(['holy_luz_da_criacao']), owned);
    const luz = rows.find((r) => r.id === 'holy_luz_da_criacao')!;
    const mana = rows.find((r) => r.id === 'holy_mana_do_deserto')!;
    expect(luz.completed).toBe(true); // cumprido, mesmo sem a posse informada aqui
    expect(luz.grantable).toEqual([]);
    expect(mana.completed).toBe(false); // possui o item, mas o marco não foi cumprido
    expect(filterMilestones(rows, 'done').map((r) => r.id)).toEqual(['holy_luz_da_criacao']);
    expect(filterMilestones(rows, 'todo')).toHaveLength(19);
    expect(filterMilestones(rows, 'all')).toHaveLength(20);
    expect(milestoneSummary(rows)).toMatchObject({ milestonesDone: 1, saintsOwned: 2 });
  });
});
