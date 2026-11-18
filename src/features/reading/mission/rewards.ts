import { getItem, getRarity } from '@/features/avatar/domain/catalog';
import type { CosmeticItem } from '@/features/avatar/domain/avatar.types';
import type { MissionResult } from './mission.service';

export type ItemReward = { kind: 'item'; id: string; item: CosmeticItem | null };
export type ReadingReward =
  | { kind: 'xp'; amount: number; chapterXp: number; bonus: number }
  | { kind: 'siclos'; amount: number }
  | ItemReward;

const rarityOrder = (reward: ItemReward) => getRarity(reward.item?.rarity ?? 'common')?.order ?? 0;

export function itemReward(id: string): ItemReward {
  const item = getItem(id) ?? null;
  return { kind: 'item', id: item?.id ?? id, item };
}

export function readingRewards(result: MissionResult): ReadingReward[] {
  const rewards: ReadingReward[] = [];
  const goal = result.dailyGoal?.achievedNow ? result.dailyGoal : undefined;
  const chapterXp = result.xpAwarded;
  const bonus = goal?.xpBonus ?? 0;
  if (chapterXp + bonus > 0) rewards.push({ kind: 'xp', amount: chapterXp + bonus, chapterXp, bonus });
  if (goal && goal.siclosAwarded > 0) rewards.push({ kind: 'siclos', amount: goal.siclosAwarded });

  // Even on a retry, the server returns the confirmed receipt for this exact session.
  const chosen = goal?.goal?.chosenItem;
  const items = (chosen ? [...result.granted, chosen] : result.granted).map(itemReward);
  const unique = [...new Map(items.map((item) => [item.id, item])).values()];
  unique.sort((a, b) => rarityOrder(a) - rarityOrder(b));
  return [...rewards, ...unique];
}
