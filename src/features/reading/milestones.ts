import { CATALOG_MISSIONS, type CatalogMission } from '@/features/avatar/domain/catalog';

/** Estado de um marco dos Santos para a interface. */
export type MilestoneRow = {
  id: string;
  name: string;
  description: string;
  book: string;
  chapter: number;
  /** o servidor registrou o cumprimento do marco (evento MILESTONE_REACHED do jogador) */
  completed: boolean;
  /** Santos do marco, com a posse do jogador (pode já ter itens sem ter cumprido o marco) */
  items: { id: string; owned: boolean }[];
  ownedCount: number;
  /** itens que o marco ainda pode conceder (só se não foi cumprido) */
  grantable: string[];
};

export type MilestoneFilter = 'all' | 'todo' | 'done';

/**
 * Junta o catálogo vigente (marcos e seus itens) com o registro de conclusão vindo do servidor
 * (get_mission_overview) e com a posse do jogador.
 */
export function milestoneRows(
  completedIds: ReadonlySet<string>,
  owned: ReadonlySet<string>,
  missions: CatalogMission[] = CATALOG_MISSIONS,
): MilestoneRow[] {
  return missions
    .filter((m) => m.kind === 'milestone')
    .map((m) => {
      const completed = completedIds.has(m.id);
      const items = m.rewardItems.map((id) => ({ id, owned: owned.has(id) }));
      return {
        id: m.id, name: m.name, description: m.description, book: m.book, chapter: m.chapter, completed, items,
        ownedCount: items.filter((i) => i.owned).length,
        grantable: completed ? [] : items.filter((i) => !i.owned).map((i) => i.id),
      };
    });
}

export const filterMilestones = (rows: MilestoneRow[], f: MilestoneFilter) =>
  f === 'todo' ? rows.filter((r) => !r.completed) : f === 'done' ? rows.filter((r) => r.completed) : rows;

/** Resumo: marcos cumpridos (registro do servidor) e Santos possuídos (posse), medidos separadamente. */
export function milestoneSummary(rows: MilestoneRow[]) {
  const itemIds = new Set(rows.flatMap((r) => r.items.map((i) => i.id)));
  const ownedIds = new Set(rows.flatMap((r) => r.items.filter((i) => i.owned).map((i) => i.id)));
  return { milestonesDone: rows.filter((r) => r.completed).length, milestonesTotal: rows.length, saintsOwned: ownedIds.size, saintsTotal: itemIds.size };
}
