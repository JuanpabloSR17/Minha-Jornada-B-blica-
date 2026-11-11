-- Meta diária v1: primeiro capítulo inédito do dia → 40 Siclos + escolha de 1 Comum (até 3 opções).
-- Usa private.complete_reading_mission_at com "agora" simulado para testar dias e fusos.

insert into auth.users (id, email) values
  ('d1111111-0000-0000-0000-000000000001', 'meta1@teste.local'),
  ('d2222222-0000-0000-0000-000000000002', 'meta2@teste.local'),
  ('d3333333-0000-0000-0000-000000000003', 'meta3@teste.local'),
  ('d4444444-0000-0000-0000-000000000004', 'meta4@teste.local');
insert into public.profiles (id, username, display_name) values
  ('d1111111-0000-0000-0000-000000000001', 'meta_1', 'Meta Um'),
  ('d2222222-0000-0000-0000-000000000002', 'meta_2', 'Meta Dois'),
  ('d3333333-0000-0000-0000-000000000003', 'meta_3', 'Meta Três'),
  ('d4444444-0000-0000-0000-000000000004', 'meta_4', 'Meta Quatro');

create function tests.gfin(p_user uuid, p_label text, p_book text, p_chapter int, p_at timestamptz) returns jsonb language sql as $$
  select private.complete_reading_mission_at(p_user, md5('goal' || p_label)::uuid, p_book, p_chapter, 'physical', p_at - interval '5 minutes', 120, p_at)
$$;
create function tests.siclos(p_user uuid) returns int language sql as $$ select private.siclos_balance(p_user) $$;
create function tests.claim(p_user uuid, p_day date, p_item text) returns jsonb language plpgsql as $$
begin
  perform set_config('request.jwt.claim.sub', p_user::text, true);
  return public.claim_daily_goal_item(p_day, p_item);
end $$;

-- ---------------------------------------------------------------- primeiro capítulo inédito do dia
select tests.assert((select time_zone from public.profiles where id = 'd1111111-0000-0000-0000-000000000001') = 'America/Sao_Paulo', 'fuso padrão do perfil: America/Sao_Paulo');
create table tests.r1 as select tests.gfin('d1111111-0000-0000-0000-000000000001', 'u1-gen1', 'GEN', 1, '2026-11-20 09:00-03') r;
select tests.assert(
  (select (r -> 'dailyGoal' ->> 'achievedNow')::boolean and (r -> 'dailyGoal' ->> 'siclosAwarded')::int = 40
     and (r -> 'dailyGoal' ->> 'day') = '2026-11-20' and (r -> 'dailyGoal' ->> 'siclosBalance')::int = 40 from tests.r1),
  'primeiro capítulo inédito do dia cumpre a meta e credita 40 Siclos');
select tests.assert(
  (select jsonb_array_length(r -> 'dailyGoal' -> 'goal' -> 'options') = 3 and (r -> 'dailyGoal' -> 'goal' ->> 'choicePending')::boolean from tests.r1),
  'meta oferece 3 Comuns para escolha, pendente');
select tests.assert(
  not exists (select 1 from tests.r1, jsonb_array_elements_text(r -> 'dailyGoal' -> 'goal' -> 'options') o
    join public.cosmetic_items i on i.id = o
    where i.rarity <> 'common' or not i.is_active or not exists (select 1 from public.item_unlock_rules u where u.item_id = o and u.is_active and u.rule_type = 'mission_pool')),
  'opções são Comuns ativos do conjunto de missão do catálogo');
select tests.assert((select (r ->> 'xpAwarded')::int = 10 from tests.r1), 'XP continua 10 por capítulo inédito');

-- segundo capítulo inédito no mesmo dia
create table tests.r2 as select tests.gfin('d1111111-0000-0000-0000-000000000001', 'u1-gen2', 'GEN', 2, '2026-11-20 21:00-03') r;
select tests.assert(
  (select not (r -> 'dailyGoal' ->> 'achievedNow')::boolean and (r -> 'dailyGoal' ->> 'achievedToday')::boolean
     and (r -> 'dailyGoal' ->> 'siclosAwarded')::int = 0 and (r -> 'dailyGoal' ->> 'newChaptersToday')::int = 2 and (r ->> 'xpAwarded')::int = 10 from tests.r2),
  'segundo capítulo inédito: registra progresso e XP, sem nova meta nem Siclos');
select tests.assert(tests.siclos('d1111111-0000-0000-0000-000000000001') = 40, 'saldo continua 40');

-- reenvio da mesma finalização (queda de conexão depois de o servidor registrar a meta)
select tests.assert(
  (select (r ->> 'duplicate')::boolean and (r -> 'dailyGoal' ->> 'achievedNow')::boolean and (r -> 'dailyGoal' ->> 'siclosAwarded')::int = 40
     and (r -> 'dailyGoal' -> 'goal' ->> 'choicePending')::boolean
   from tests.gfin('d1111111-0000-0000-0000-000000000001', 'u1-gen1', 'GEN', 1, '2026-11-20 09:30-03') r),
  'reenvio devolve o resultado registrado (meta cumprida, escolha pendente), sem novo crédito');
select tests.assert((select count(*) from public.siclos_ledger where user_id = 'd1111111-0000-0000-0000-000000000001') = 1, 'um único crédito de Siclos');

-- ---------------------------------------------------------------- releitura e virada do dia
select tests.assert(
  (select not (r -> 'dailyGoal' ->> 'achievedNow')::boolean and not (r -> 'dailyGoal' ->> 'achievedToday')::boolean
   from tests.gfin('d1111111-0000-0000-0000-000000000001', 'u1-gen1-releitura', 'GEN', 1, '2026-11-21 08:00-03') r),
  'releitura no dia seguinte não cumpre a meta');
select tests.assert(
  (select (r -> 'dailyGoal' ->> 'achievedNow')::boolean and r -> 'dailyGoal' ->> 'day' = '2026-11-21'
   from tests.gfin('d1111111-0000-0000-0000-000000000001', 'u1-gen3', 'GEN', 3, '2026-11-21 08:10-03') r),
  'primeiro inédito do dia seguinte cumpre a nova meta');
select tests.assert(tests.siclos('d1111111-0000-0000-0000-000000000001') = 80, 'dois dias, 80 Siclos');

-- virada exatamente à meia-noite no fuso do perfil (não à meia-noite UTC)
select tests.assert(
  (select r -> 'dailyGoal' ->> 'day' = '2026-11-20' and (r -> 'dailyGoal' ->> 'achievedNow')::boolean
   from tests.gfin('d2222222-0000-0000-0000-000000000002', 'u2-a', 'EXO', 1, '2026-11-20 23:59:30-03') r),
  '23:59:30 em São Paulo ainda é o dia 20');
select tests.assert(
  (select r -> 'dailyGoal' ->> 'day' = '2026-11-20' and not (r -> 'dailyGoal' ->> 'achievedNow')::boolean
   from tests.gfin('d2222222-0000-0000-0000-000000000002', 'u2-b', 'EXO', 2, '2026-11-21 02:30:00+00') r),
  'meia-noite UTC (23:30 em São Paulo) não vira o dia');
select tests.assert(
  (select r -> 'dailyGoal' ->> 'day' = '2026-11-21' and (r -> 'dailyGoal' ->> 'achievedNow')::boolean
   from tests.gfin('d2222222-0000-0000-0000-000000000002', 'u2-c', 'EXO', 3, '2026-11-21 00:00:30-03') r),
  '00:00:30 em São Paulo já é o dia 21: nova meta');

-- ---------------------------------------------------------------- fuso
select tests.assert_raises($$select set_config('request.jwt.claim.sub', 'd3333333-0000-0000-0000-000000000003', true), public.sync_time_zone('Lua/Base')$$, 'invalid_time_zone', 'fuso inexistente recusado');
select set_config('request.jwt.claim.sub', 'd3333333-0000-0000-0000-000000000003', false);
select tests.assert(public.sync_time_zone('America/Manaus') = 'America/Manaus', 'primeiro ajuste de fuso pelo aparelho é aceito');
select tests.assert(public.sync_time_zone('Asia/Tokyo') = 'America/Manaus', 'nova troca em menos de 24 h é ignorada');
select tests.assert(
  (select r -> 'dailyGoal' ->> 'day' = '2026-11-20' and (r -> 'dailyGoal' ->> 'achievedNow')::boolean
   from tests.gfin('d3333333-0000-0000-0000-000000000003', 'u3-a', 'LEV', 1, '2026-11-21 03:30:00+00') r),
  'dia vem do fuso do perfil: 03:30 UTC é dia 20 em Manaus (já seria dia 21 em São Paulo)');
update public.profiles set time_zone = 'Pacific/Kiritimati', time_zone_changed_at = null where id = 'd3333333-0000-0000-0000-000000000003';
select tests.assert(
  (select r -> 'dailyGoal' ->> 'day' = '2026-11-22' and (r -> 'dailyGoal' ->> 'achievedNow')::boolean
   from tests.gfin('d3333333-0000-0000-0000-000000000003', 'u3-b', 'LEV', 2, '2026-11-21 11:00:00+00') r),
  'fuso adiantado (UTC+14): dia 22 local é um dia novo');
update public.profiles set time_zone = 'Pacific/Pago_Pago', time_zone_changed_at = null where id = 'd3333333-0000-0000-0000-000000000003';
select tests.assert(
  (select r -> 'dailyGoal' ->> 'day' = '2026-11-21' and not (r -> 'dailyGoal' ->> 'achievedNow')::boolean
   from tests.gfin('d3333333-0000-0000-0000-000000000003', 'u3-c', 'LEV', 3, '2026-11-22 10:10:00+00') r),
  'trocar de fuso para voltar a um dia ainda sem meta (21) não gera meta extra');
select tests.assert(tests.siclos('d3333333-0000-0000-0000-000000000003') = 80, 'trocas de fuso não geram Siclos extras');

-- ---------------------------------------------------------------- escolha do Comum
create table tests.opt as select (r -> 'dailyGoal' -> 'goal' -> 'options') o from tests.r1;
select tests.assert_raises($$select tests.claim('d1111111-0000-0000-0000-000000000001', '2026-11-20', 'book_gen')$$, 'invalid_goal_choice', 'item fora das opções apresentadas é recusado');
select tests.assert_raises($$select tests.claim('d1111111-0000-0000-0000-000000000001', '2026-11-19', (select o ->> 0 from tests.opt))$$, 'goal_not_found', 'dia sem meta não tem escolha');
select tests.assert_raises($$select tests.claim('d4444444-0000-0000-0000-000000000004', '2026-11-20', (select o ->> 0 from tests.opt))$$, 'goal_not_found', 'outro jogador não resgata a meta alheia');
select tests.assert(
  (select not (c ->> 'duplicate')::boolean and c -> 'granted' ? (select o ->> 0 from tests.opt) and not (c -> 'goal' ->> 'choicePending')::boolean
   from tests.claim('d1111111-0000-0000-0000-000000000001', '2026-11-20', (select o ->> 0 from tests.opt)) c),
  'escolha válida concede o Comum e encerra a pendência');
select tests.assert(
  (select (c ->> 'duplicate')::boolean and c -> 'granted' = '[]'::jsonb
   from tests.claim('d1111111-0000-0000-0000-000000000001', '2026-11-20', (select o ->> 0 from tests.opt)) c),
  'repetir a mesma confirmação devolve o resultado, sem conceder de novo');
select tests.assert_raises($$select tests.claim('d1111111-0000-0000-0000-000000000001', '2026-11-20', (select o ->> 1 from tests.opt))$$, 'goal_choice_already_made', 'segunda escolha na mesma meta é recusada');
select tests.assert(
  (select count(*) from public.user_items ui, tests.opt where ui.user_id = 'd1111111-0000-0000-0000-000000000001' and ui.item_id in (select jsonb_array_elements_text(o))) = 1,
  'no máximo um item por meta');
select tests.assert(tests.siclos('d1111111-0000-0000-0000-000000000001') = 80, 'escolher o item não mexe nos Siclos');
select tests.assert(
  not exists (select 1 from public.daily_goals g, unnest(g.options) o where g.user_id = 'd1111111-0000-0000-0000-000000000001' and g.day = '2026-11-21'
              and o = (select o ->> 0 from tests.opt)),
  'a meta seguinte não oferece o Comum já obtido');

begin;
select set_config('request.jwt.claim.sub', 'd1111111-0000-0000-0000-000000000001', true);
set local role authenticated;
select tests.assert(
  (select (s ->> 'siclosBalance')::int = 80 and jsonb_array_length(s -> 'pending') = 1 and s -> 'pending' -> 0 ->> 'day' = '2026-11-21' from public.get_daily_goal_status() s),
  'status: saldo e a escolha ainda pendente (dia 21) ficam disponíveis ao reabrir o app');
select tests.assert((select count(*) from public.daily_goals) = 2 and (select count(*) from public.siclos_ledger) = 2, 'jogador lê as próprias metas e Siclos');
select tests.assert_raises($$insert into public.siclos_ledger (user_id, event_type, source_event_id, amount) values (auth.uid(), 'HACK', 'x', 9999)$$, 'permission denied%', 'cliente não credita Siclos');
select tests.assert_raises($$update public.daily_goals set chosen_item = null$$, 'permission denied%', 'cliente não reabre a escolha');
select tests.assert_raises($$update public.profiles set time_zone = 'Asia/Tokyo'$$, 'permission denied%', 'cliente não troca o fuso direto na tabela');
commit;
begin;
select set_config('request.jwt.claim.sub', 'd2222222-0000-0000-0000-000000000002', true);
set local role authenticated;
select tests.assert((select count(*) from public.siclos_ledger where user_id = 'd1111111-0000-0000-0000-000000000001') = 0, 'Siclos de outra conta são invisíveis');
commit;
begin;
set local role anon;
select tests.assert_raises($$select public.claim_daily_goal_item('2026-11-20', 'x')$$, 'permission denied%', 'visitante não resgata escolha');
commit;

-- ---------------------------------------------------------------- todos os Comuns elegíveis já obtidos
insert into public.user_items (user_id, item_id, source_event_id)
select 'd4444444-0000-0000-0000-000000000004', e, 'test:fixture' from private.eligible_commons('d4444444-0000-0000-0000-000000000004') e;
select tests.assert(
  (select (r -> 'dailyGoal' ->> 'achievedNow')::boolean and (r -> 'dailyGoal' ->> 'siclosAwarded')::int = 40
     and r -> 'dailyGoal' -> 'goal' -> 'options' = '[]'::jsonb and not (r -> 'dailyGoal' -> 'goal' ->> 'choicePending')::boolean
   from tests.gfin('d4444444-0000-0000-0000-000000000004', 'u4-a', 'NUM', 1, '2026-11-20 10:00-03') r),
  'sem Comuns elegíveis: meta cumprida, 40 Siclos creditados, sem escolha pendente');
