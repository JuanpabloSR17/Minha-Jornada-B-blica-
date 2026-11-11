-- Reversão MANUAL da meta diária (não é aplicada automaticamente).
-- Itens já escolhidos continuam com o jogador (user_items). ATENÇÃO: remove o histórico de metas
-- (daily_goals) e o saldo de Siclos (siclos_ledger); exporte antes se precisar preservá-los.
drop function if exists public.get_daily_goal_status();
drop function if exists public.claim_daily_goal_item(date, text);
drop function if exists public.sync_time_zone(text);
drop function if exists private.try_daily_goal(uuid, date, uuid, text, int);
drop function if exists private.daily_goal_state(uuid, date);
drop function if exists private.eligible_commons(uuid);
drop function if exists private.siclos_balance(uuid);
drop table if exists public.daily_goals;
drop table if exists public.siclos_ledger;
delete from public.economy_rules where key in ('siclos_daily_goal', 'daily_goal_choices');
-- Depois, reaplique public.complete_reading_mission e public.get_mission_overview de
-- 20261116000100_reading_missions.sql (versões sem meta diária) e remova
-- private.complete_reading_mission_at e private.local_day.
-- profiles.time_zone fica (inofensivo).
