import { completedTrailSteps, RUTH_TRAIL, TABERNACLE_TRAIL } from './trails';

describe('trilhas guiadas', () => {
  it('reconhece capítulos de Rute registrados em qualquer ordem e sem duplicar releituras', () => {
    const done = completedTrailSteps(RUTH_TRAIL, [4, 2, 2, 8], new Set());
    expect(done.map((step) => step.chapter)).toEqual([2, 4]);
    expect(completedTrailSteps(RUTH_TRAIL, [4, 3, 2, 1], new Set())).toHaveLength(4);
  });

  it('distingue leitura de Êxodo 25 ou 30 de conclusão dos marcos do Tabernáculo', () => {
    const read = [25, 30, 40];
    const done = completedTrailSteps(TABERNACLE_TRAIL, read, new Set(['marco_mobilia_do_tabernaculo']));
    expect(done.map((step) => step.chapter)).toEqual([25, 40]);
    expect(completedTrailSteps(TABERNACLE_TRAIL, read, new Set(['holy_altar_do_incenso'])).map((step) => step.chapter)).toEqual([30, 40]);
  });
});

