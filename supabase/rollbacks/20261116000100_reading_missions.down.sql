-- Reversão MANUAL do Modo Missão (não é aplicada automaticamente).
-- Não apaga capítulos concluídos nem itens: eles ficam em private.domain_events e public.user_items.
-- ATENÇÃO: remove o histórico de missões finalizadas (reading_sessions) e o XP (xp_ledger).
-- Exporte essas tabelas antes se precisar preservá-las.
drop function if exists public.get_mission_overview();
drop function if exists public.complete_reading_mission(uuid, text, int, text, timestamptz, int);
drop function if exists private.reading_snapshot(uuid, text);
drop table if exists public.reading_sessions;
drop table if exists public.xp_ledger;
drop function if exists private.economy(text);
drop table if exists public.economy_rules;
-- Missões curadas vinculadas a capítulo ficam inativas (a regra do item continua registrada).
update public.reward_triggers set is_active = false where book_code is not null;
alter table public.reward_triggers drop constraint if exists reward_triggers_chapter_check;
alter table public.reward_triggers drop column if exists chapter;
alter table public.reward_triggers drop column if exists book_code;
