-- Reversão MANUAL da meta diária v2 (não é aplicada automaticamente).
-- Não apaga metas concedidas, Siclos, XP nem itens. Remove os snapshots diários (daily_targets)
-- e as mudanças de meta pendentes (a meta em vigor continua).
drop function if exists public.set_daily_mission_target(int);
drop function if exists public.set_time_zone(text);
drop function if exists private.set_daily_mission_target_at(uuid, int, timestamptz);
drop function if exists private.daily_status(uuid, timestamptz);
drop function if exists private.change_time_zone(uuid, text, text);
drop function if exists private.new_chapters_on(uuid, date);
drop function if exists private.day_target(uuid, date);
drop table if exists public.daily_targets;
alter table public.reading_preferences drop constraint if exists reading_preferences_pending_consistency;
alter table public.reading_preferences drop column if exists pending_effective_day;
alter table public.reading_preferences drop column if exists pending_target;
alter table public.reading_preferences drop column if exists pending_plan_mode;
update public.economy_rules set value = 10 where key = 'xp_new_chapter';
delete from public.economy_rules where key = 'xp_daily_goal_bonus';
-- Depois, reaplique de 20261117000100_daily_goal.sql: private.try_daily_goal,
-- private.daily_goal_state, private.complete_reading_mission_at, public.sync_time_zone (retorno texto)
-- e public.get_daily_goal_status; e de 20261111000100_marco1_core.sql: public.set_reading_preferences.
-- Colunas daily_goals.rule_version/target/xp_bonus e profiles.time_zone_source ficam (inofensivas).
drop function if exists public.sync_time_zone(text);
drop function if exists public.get_daily_goal_status();
drop function if exists private.effective_preferences(uuid, date);
drop function if exists private.set_reading_preferences_at(uuid, text, int, timestamptz);
