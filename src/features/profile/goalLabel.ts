import { fmt, strings } from '@/i18n';
import type { ReadingPreferences } from './profile.service';

export function goalLabel(p: ReadingPreferences | null): string {
  if (p?.plan_mode !== 'daily_goal' || !p.target_chapters_per_day) return strings.home.goalFree;
  return p.target_chapters_per_day === 1 ? strings.home.goalOne : fmt(strings.home.goal, { n: p.target_chapters_per_day });
}
