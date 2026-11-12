-- Meta diária v2: recompensa ao completar a meta pessoal do dia (snapshot por dia).
-- Usa as funções private.*_at com "agora" simulado para testar dias e fusos.

create function tests.mk(p_user uuid, p_name text) returns void language sql as $$
  insert into auth.users (id, email) values (p_user, p_name || '@teste.local');
  insert into public.profiles (id, username, display_name) values (p_user, p_name, initcap(replace(p_name, '_', ' ')));
$$;
create function tests.pref(p_user uuid, p_mode text, p_target int, p_at timestamptz) returns public.reading_preferences language sql as $$
  select private.set_reading_preferences_at(p_user, p_mode, p_target, p_at)
$$;
create function tests.gfin(p_user uuid, p_label text, p_book text, p_chapter int, p_at timestamptz) returns jsonb language sql as $$
  select private.complete_reading_mission_at(p_user, md5('goal' || p_user::text || p_label)::uuid, p_book, p_chapter, 'physical', p_at - interval '5 minutes', 120, p_at)
$$;
create function tests.siclos(p_user uuid) returns int language sql as $$ select private.siclos_balance(p_user) $$;
create function tests.xp(p_user uuid) returns int language sql as $$ select coalesce(sum(amount), 0)::int from public.xp_ledger where user_id = p_user $$;
create function tests.goals(p_user uuid) returns int language sql as $$ select count(*)::int from public.daily_goals where user_id = p_user $$;
create function tests.claim(p_user uuid, p_day date, p_item text) returns jsonb language plpgsql as $$
begin
  perform set_config('request.jwt.claim.sub', p_user::text, true);
  return public.claim_daily_goal_item(p_day, p_item);
end $$;

/** Lê N-1 capítulos inéditos sem recompensa; o N-ésimo cumpre a meta. */
create function tests.check_target(p_user uuid, p_target int) returns void language plpgsql as $$
declare
  r jsonb;
begin
  for n in 1 .. p_target loop
    r := tests.gfin(p_user, 'meta' || n, 'PSA', n, '2026-11-20 08:00-03'::timestamptz + n * interval '10 minutes');
    if n < p_target then
      perform tests.assert(not (r -> 'dailyGoal' ->> 'achievedNow')::boolean and (r -> 'dailyGoal' ->> 'remaining')::int = p_target - n,
        format('meta %s: capítulo %s ainda não recompensa (faltam %s)', p_target, n, p_target - n));
    else
      perform tests.assert((r -> 'dailyGoal' ->> 'achievedNow')::boolean and (r -> 'dailyGoal' ->> 'siclosAwarded')::int = 40
        and (r -> 'dailyGoal' ->> 'xpBonus')::int = 20 and (r -> 'dailyGoal' ->> 'remaining')::int = 0
        and jsonb_array_length(r -> 'dailyGoal' -> 'goal' -> 'options') = 3,
        format('meta %s: o %s.º capítulo inédito concede 40 Siclos, 20 XP de bônus e 3 Comuns à escolha', p_target, n));
    end if;
  end loop;
  perform tests.assert(tests.siclos(p_user) = 40 and tests.xp(p_user) = 40 * p_target + 20 and tests.goals(p_user) = 1,
    format('meta %s: 40 Siclos e %s XP (40 por capítulo + 20 de bônus)', p_target, 40 * p_target + 20));
end $$;

-- ---------------------------------------------------------------- metas 1, 2, 3, 5 e N (7)
select tests.mk('d1000000-0000-0000-0000-000000000001', 'meta_um');
select tests.mk('d2000000-0000-0000-0000-000000000002', 'meta_dois');
select tests.mk('d3000000-0000-0000-0000-000000000003', 'meta_tres');
select tests.mk('d5000000-0000-0000-0000-000000000005', 'meta_cinco');
select tests.mk('d7000000-0000-0000-0000-000000000007', 'meta_sete');
select tests.pref('d1000000-0000-0000-0000-000000000001', 'daily_goal', 1, '2026-11-19 12:00-03');
select tests.pref('d2000000-0000-0000-0000-000000000002', 'daily_goal', 2, '2026-11-19 12:00-03');
select tests.pref('d3000000-0000-0000-0000-000000000003', 'daily_goal', 3, '2026-11-19 12:00-03');
select tests.pref('d5000000-0000-0000-0000-000000000005', 'daily_goal', 5, '2026-11-19 12:00-03');
select tests.pref('d7000000-0000-0000-0000-000000000007', 'daily_goal', 7, '2026-11-19 12:00-03');
select tests.check_target('d1000000-0000-0000-0000-000000000001', 1);
select tests.check_target('d2000000-0000-0000-0000-000000000002', 2);
select tests.check_target('d3000000-0000-0000-0000-000000000003', 3);
select tests.check_target('d5000000-0000-0000-0000-000000000005', 5);
select tests.check_target('d7000000-0000-0000-0000-000000000007', 7);
select tests.assert((select target = 7 and rule_version = 2 and xp_bonus = 20 from public.daily_goals where user_id = 'd7000000-0000-0000-0000-000000000007'),
  'meta registrada com a meta do dia, regra v2 e bônus de XP');

-- capítulos adicionais depois da meta
select tests.assert(
  (select not (r -> 'dailyGoal' ->> 'achievedNow')::boolean and (r -> 'dailyGoal' ->> 'achievedToday')::boolean
     and (r ->> 'xpAwarded')::int = 40 and (r -> 'dailyGoal' ->> 'newChaptersToday')::int = 3 and (r -> 'dailyGoal' ->> 'siclosAwarded')::int = 0
   from tests.gfin('d2000000-0000-0000-0000-000000000002', 'extra', 'PSA', 3, '2026-11-20 20:00-03') r),
  'capítulo além da meta: 40 XP e progresso, sem nova recompensa diária');
select tests.assert(tests.siclos('d2000000-0000-0000-0000-000000000002') = 40 and tests.goals('d2000000-0000-0000-0000-000000000002') = 1, 'recompensa diária uma única vez');

-- reenvio da finalização que cumpriu a meta (queda de conexão depois do registro)
select tests.assert(
  (select (r ->> 'duplicate')::boolean and (r -> 'dailyGoal' ->> 'achievedNow')::boolean and (r -> 'dailyGoal' -> 'goal' ->> 'choicePending')::boolean
   from tests.gfin('d2000000-0000-0000-0000-000000000002', 'meta2', 'PSA', 2, '2026-11-20 21:00-03') r),
  'reenvio devolve o resultado registrado (meta cumprida, escolha pendente)');
select tests.assert((select count(*) from public.siclos_ledger where user_id = 'd2000000-0000-0000-0000-000000000002') = 1
  and (select count(*) from public.xp_ledger where user_id = 'd2000000-0000-0000-0000-000000000002' and event_type = 'DAILY_GOAL_BONUS') = 1,
  'reenvio não credita Siclos nem bônus de novo');

-- ---------------------------------------------------------------- releitura
select tests.mk('d8000000-0000-0000-0000-000000000008', 'meta_releitura');
select tests.pref('d8000000-0000-0000-0000-000000000008', 'daily_goal', 2, '2026-11-19 12:00-03');
select tests.gfin('d8000000-0000-0000-0000-000000000008', 'a', 'JHN', 1, '2026-11-20 08:00-03');
select tests.assert(
  (select not (r -> 'dailyGoal' ->> 'achievedNow')::boolean and (r -> 'dailyGoal' ->> 'newChaptersToday')::int = 1 and (r ->> 'xpAwarded')::int = 0
   from tests.gfin('d8000000-0000-0000-0000-000000000008', 'b', 'JHN', 1, '2026-11-20 08:30-03') r),
  'releitura não conta para a meta nem dá XP');
select tests.assert(
  (select (r -> 'dailyGoal' ->> 'achievedNow')::boolean from tests.gfin('d8000000-0000-0000-0000-000000000008', 'c', 'JHN', 2, '2026-11-20 09:00-03') r),
  'o segundo capítulo inédito cumpre a meta 2');

-- ---------------------------------------------------------------- ritmo livre
select tests.mk('d9000000-0000-0000-0000-000000000009', 'meta_livre');
select tests.pref('d9000000-0000-0000-0000-000000000009', 'free', null, '2026-11-19 12:00-03');
select tests.assert(
  (select (s ->> 'needsFreeChoice')::boolean and (s ->> 'canChooseFreeTarget')::boolean and s ->> 'target' is null
   from private.daily_status('d9000000-0000-0000-0000-000000000009', '2026-11-20 07:00-03') s),
  'ritmo livre: o dia começa pedindo a escolha da missão diária');
select tests.assert(
  (select not (r -> 'dailyGoal' ->> 'achievedNow')::boolean and r -> 'dailyGoal' ->> 'target' is null
   from tests.gfin('d9000000-0000-0000-0000-000000000009', 'a', 'ROM', 1, '2026-11-20 08:00-03') r),
  'ritmo livre sem missão escolhida: o capítulo conta no progresso, sem recompensa diária');
select tests.assert_raises($$select private.set_daily_mission_target_at('d9000000-0000-0000-0000-000000000009', 1, '2026-11-20 08:10-03')$$,
  'daily_target_after_start', 'missão do dia só pode ser escolhida antes do primeiro capítulo inédito');
select tests.assert_raises($$select private.set_daily_mission_target_at('d9000000-0000-0000-0000-000000000009', 0, '2026-11-21 07:00-03')$$,
  'invalid_goal', 'missão diária precisa de pelo menos 1 capítulo');
select tests.assert(
  (select (s ->> 'target')::int = 2 and not (s ->> 'needsFreeChoice')::boolean
   from private.set_daily_mission_target_at('d9000000-0000-0000-0000-000000000009', 2, '2026-11-21 07:00-03') s),
  'no dia seguinte, escolhe a missão de 2 capítulos antes de começar');
select tests.assert((private.set_daily_mission_target_at('d9000000-0000-0000-0000-000000000009', 2, '2026-11-21 07:01-03') ->> 'target')::int = 2, 'repetir a mesma escolha é idempotente');
select tests.assert_raises($$select private.set_daily_mission_target_at('d9000000-0000-0000-0000-000000000009', 1, '2026-11-21 07:02-03')$$,
  'daily_target_already_set', 'a missão do dia não pode ser trocada');
select tests.gfin('d9000000-0000-0000-0000-000000000009', 'b', 'ROM', 2, '2026-11-21 08:00-03');
select tests.assert(
  (select (r -> 'dailyGoal' ->> 'achievedNow')::boolean from tests.gfin('d9000000-0000-0000-0000-000000000009', 'c', 'ROM', 3, '2026-11-21 08:30-03') r),
  'ritmo livre: recompensa ao completar a missão escolhida');
select tests.assert_raises($$select private.set_daily_mission_target_at('d2000000-0000-0000-0000-000000000002', 1, '2026-11-21 07:00-03')$$,
  'daily_target_not_free', 'quem tem meta pessoal não escolhe missão livre');

-- ---------------------------------------------------------------- mudança de meta durante o dia
select tests.mk('da000000-0000-0000-0000-00000000000a', 'meta_muda');
select tests.pref('da000000-0000-0000-0000-00000000000a', 'daily_goal', 3, '2026-11-19 12:00-03');
select tests.gfin('da000000-0000-0000-0000-00000000000a', 'a', 'ACT', 1, '2026-11-20 08:00-03');
select tests.assert(
  (select r.target_chapters_per_day = 3 and r.pending_target = 1 and r.pending_effective_day = '2026-11-21'
   from tests.pref('da000000-0000-0000-0000-00000000000a', 'daily_goal', 1, '2026-11-20 09:00-03') r),
  'baixar a meta durante o dia: fica agendada para a próxima data civil');
select tests.assert(
  (select not (r -> 'dailyGoal' ->> 'achievedNow')::boolean and (r -> 'dailyGoal' ->> 'target')::int = 3
   from tests.gfin('da000000-0000-0000-0000-00000000000a', 'b', 'ACT', 2, '2026-11-20 10:00-03') r),
  'hoje continua valendo a meta 3 (snapshot do dia): sem recompensa retroativa');
select tests.assert(
  (select (r -> 'dailyGoal' ->> 'achievedNow')::boolean from tests.gfin('da000000-0000-0000-0000-00000000000a', 'c', 'ACT', 3, '2026-11-20 11:00-03') r),
  'a meta 3 de hoje é cumprida no 3.º capítulo');
select tests.assert(
  (select (r -> 'dailyGoal' ->> 'achievedNow')::boolean and (r -> 'dailyGoal' ->> 'target')::int = 1
   from tests.gfin('da000000-0000-0000-0000-00000000000a', 'd', 'ACT', 4, '2026-11-21 08:00-03') r),
  'no dia seguinte a meta nova (1) vale');
select tests.assert((select pending_target is null and target_chapters_per_day = 1 from public.reading_preferences where user_id = 'da000000-0000-0000-0000-00000000000a'),
  'mudança pendente promovida para a meta em vigor');
select tests.assert(
  (select r.pending_target = 5 from tests.pref('da000000-0000-0000-0000-00000000000a', 'daily_goal', 5, '2026-11-21 09:00-03') r)
  and (select r.pending_target is null and r.target_chapters_per_day = 1 from tests.pref('da000000-0000-0000-0000-00000000000a', 'daily_goal', 1, '2026-11-21 09:05-03') r),
  'voltar para a meta em vigor cancela a mudança pendente');
-- mudança feita antes de qualquer leitura do dia também só vale amanhã
select tests.mk('db000000-0000-0000-0000-00000000000b', 'meta_cedo');
select tests.pref('db000000-0000-0000-0000-00000000000b', 'daily_goal', 2, '2026-11-19 12:00-03');
select tests.pref('db000000-0000-0000-0000-00000000000b', 'daily_goal', 1, '2026-11-20 06:00-03');
select tests.assert(
  (select not (r -> 'dailyGoal' ->> 'achievedNow')::boolean and (r -> 'dailyGoal' ->> 'target')::int = 2
   from tests.gfin('db000000-0000-0000-0000-00000000000b', 'a', 'GAL', 1, '2026-11-20 08:00-03') r),
  'trocar a meta logo cedo não muda a meta de hoje');

-- ---------------------------------------------------------------- virada do dia e fusos
select tests.mk('dc000000-0000-0000-0000-00000000000c', 'meta_virada');
select tests.pref('dc000000-0000-0000-0000-00000000000c', 'daily_goal', 2, '2026-11-19 12:00-03');
select tests.gfin('dc000000-0000-0000-0000-00000000000c', 'a', 'EPH', 1, '2026-11-20 23:50-03');
select tests.assert(
  (select not (r -> 'dailyGoal' ->> 'achievedNow')::boolean and r -> 'dailyGoal' ->> 'day' = '2026-11-21' and (r -> 'dailyGoal' ->> 'newChaptersToday')::int = 1
   from tests.gfin('dc000000-0000-0000-0000-00000000000c', 'b', 'EPH', 2, '2026-11-21 00:10-03') r),
  'São Paulo: 23:50 e 00:10 contam em dias diferentes (1 + 1, meta 2 não cumprida)');
select tests.assert(
  (select (r -> 'dailyGoal' ->> 'achievedNow')::boolean and r -> 'dailyGoal' ->> 'day' = '2026-11-21'
   from tests.gfin('dc000000-0000-0000-0000-00000000000c', 'c', 'EPH', 3, '2026-11-21 00:20-03') r),
  'São Paulo: dois inéditos depois da meia-noite cumprem a meta do novo dia');
select tests.mk('dd000000-0000-0000-0000-00000000000d', 'meta_toquio');
update public.profiles set time_zone = 'Asia/Tokyo', time_zone_source = 'user' where id = 'dd000000-0000-0000-0000-00000000000d';
select tests.pref('dd000000-0000-0000-0000-00000000000d', 'daily_goal', 2, '2026-11-19 12:00+09');
select tests.gfin('dd000000-0000-0000-0000-00000000000d', 'a', 'PHP', 1, '2026-11-20 14:50:00+00');
select tests.assert(
  (select not (r -> 'dailyGoal' ->> 'achievedNow')::boolean and r -> 'dailyGoal' ->> 'day' = '2026-11-21'
   from tests.gfin('dd000000-0000-0000-0000-00000000000d', 'b', 'PHP', 2, '2026-11-20 15:10:00+00') r),
  'Tóquio: 14:50 e 15:10 UTC atravessam a meia-noite local (sem meta)');
select tests.mk('de000000-0000-0000-0000-00000000000e', 'meta_sp_mesmo');
select tests.pref('de000000-0000-0000-0000-00000000000e', 'daily_goal', 2, '2026-11-19 12:00-03');
select tests.gfin('de000000-0000-0000-0000-00000000000e', 'a', 'PHP', 1, '2026-11-20 14:50:00+00');
select tests.assert(
  (select (r -> 'dailyGoal' ->> 'achievedNow')::boolean and r -> 'dailyGoal' ->> 'day' = '2026-11-20'
   from tests.gfin('de000000-0000-0000-0000-00000000000e', 'b', 'PHP', 2, '2026-11-20 15:10:00+00') r),
  'São Paulo: os mesmos instantes são o mesmo dia (meta cumprida)');
-- trocar de fuso para "voltar" a um dia sem meta não gera recompensa
select tests.mk('df000000-0000-0000-0000-00000000000f', 'meta_fuso');
select tests.pref('df000000-0000-0000-0000-00000000000f', 'daily_goal', 1, '2026-11-19 12:00-03');
update public.profiles set time_zone = 'Pacific/Kiritimati', time_zone_source = 'user' where id = 'df000000-0000-0000-0000-00000000000f';
select tests.assert((select (r -> 'dailyGoal' ->> 'achievedNow')::boolean and r -> 'dailyGoal' ->> 'day' = '2026-11-22'
  from tests.gfin('df000000-0000-0000-0000-00000000000f', 'a', 'COL', 1, '2026-11-21 11:00:00+00') r), 'fuso adiantado: meta do dia 22');
update public.profiles set time_zone = 'Pacific/Pago_Pago' where id = 'df000000-0000-0000-0000-00000000000f';
select tests.assert((select not (r -> 'dailyGoal' ->> 'achievedNow')::boolean and r -> 'dailyGoal' ->> 'day' = '2026-11-21'
  from tests.gfin('df000000-0000-0000-0000-00000000000f', 'b', 'COL', 2, '2026-11-22 10:10:00+00') r), 'voltar a um dia ainda sem meta (21) não recompensa');

-- ---------------------------------------------------------------- fuso: aparelho sugere, usuário decide
select tests.mk('e1000000-0000-0000-0000-000000000001', 'fuso_novo');
begin;
select set_config('request.jwt.claim.sub', 'e1000000-0000-0000-0000-000000000001', true);
select tests.assert_raises($$select public.sync_time_zone('Lua/Base')$$, 'invalid_time_zone', 'fuso inexistente recusado');
select tests.assert((public.sync_time_zone('America/Manaus') ->> 'timeZone') = 'America/Manaus', 'sem fuso definido pelo usuário, o do aparelho é adotado');
select tests.assert(
  (select s ->> 'timeZone' = 'America/Manaus' and s ->> 'suggestion' = 'Asia/Tokyo' from public.sync_time_zone('Asia/Tokyo') s),
  'depois disso, outro fuso do aparelho vira só sugestão');
select tests.assert_raises($$select public.set_time_zone('Asia/Tokyo')$$, 'time_zone_change_too_soon', 'troca explícita respeita o intervalo de 24 h');
update public.profiles set time_zone_changed_at = now() - interval '2 days' where id = 'e1000000-0000-0000-0000-000000000001';
select tests.assert((public.set_time_zone('Asia/Tokyo') ->> 'timeZone') = 'Asia/Tokyo', 'usuário define o fuso de leitura');
select tests.assert(
  (select s ->> 'timeZone' = 'Asia/Tokyo' and s ->> 'source' = 'user' and s ->> 'suggestion' = 'America/Sao_Paulo' from public.sync_time_zone('America/Sao_Paulo') s),
  'fuso escolhido pelo usuário nunca é trocado pelo aparelho');
commit;

-- ---------------------------------------------------------------- escolha do Comum (meta 1)
create table tests.opt as select options o from public.daily_goals where user_id = 'd1000000-0000-0000-0000-000000000001';
select tests.assert_raises($$select tests.claim('d1000000-0000-0000-0000-000000000001', '2026-11-20', 'book_gen')$$, 'invalid_goal_choice', 'item fora das opções é recusado');
select tests.assert_raises($$select tests.claim('d1000000-0000-0000-0000-000000000001', '2026-11-19', (select o[1] from tests.opt))$$, 'goal_not_found', 'dia sem meta não tem escolha');
select tests.assert_raises($$select tests.claim('d3000000-0000-0000-0000-000000000003', '2026-11-21', (select o[1] from tests.opt))$$, 'goal_not_found', 'meta alheia não pode ser resgatada');
select tests.assert(
  (select not (c ->> 'duplicate')::boolean and c -> 'granted' ? (select o[1] from tests.opt) from tests.claim('d1000000-0000-0000-0000-000000000001', '2026-11-20', (select o[1] from tests.opt)) c),
  'escolha válida concede o Comum');
select tests.assert(
  (select (c ->> 'duplicate')::boolean and c -> 'granted' = '[]'::jsonb from tests.claim('d1000000-0000-0000-0000-000000000001', '2026-11-20', (select o[1] from tests.opt)) c),
  'segundo resgate da mesma escolha não concede de novo');
select tests.assert_raises($$select tests.claim('d1000000-0000-0000-0000-000000000001', '2026-11-20', (select o[2] from tests.opt))$$, 'goal_choice_already_made', 'outra escolha na mesma meta é recusada');
select tests.assert(
  (select count(*) from public.user_items ui, tests.opt where ui.user_id = 'd1000000-0000-0000-0000-000000000001' and ui.item_id = any (o)) = 1,
  'no máximo um item por meta');

-- ---------------------------------------------------------------- status (outro dispositivo lê o mesmo estado)
begin;
select set_config('request.jwt.claim.sub', 'd3000000-0000-0000-0000-000000000003', true);
set local role authenticated;
select tests.assert((select count(*) from public.daily_targets) >= 1 and (select count(*) from public.daily_goals) = 1, 'jogador lê os próprios snapshots e metas');
select tests.assert_raises($$update public.daily_targets set target = 1$$, 'permission denied%', 'cliente não altera o snapshot do dia');
select tests.assert_raises($$update public.reading_preferences set pending_effective_day = '2000-01-01'$$, 'permission denied%', 'cliente não antecipa a mudança de meta');
select tests.assert_raises($$insert into public.siclos_ledger (user_id, event_type, source_event_id, amount) values (auth.uid(), 'HACK', 'x', 999)$$, 'permission denied%', 'cliente não credita Siclos');
commit;
select tests.assert(
  (select (s -> 'reward' ->> 'siclos')::int = 40 and (s -> 'reward' ->> 'xpBonus')::int = 20 and (s -> 'reward' ->> 'commonChoices')::int = 3
     and (s ->> 'target')::int = 3 and (s ->> 'remaining')::int = 3 and not (s ->> 'achievedToday')::boolean and s ->> 'today' = '2026-11-22'
   from private.daily_status('d3000000-0000-0000-0000-000000000003', '2026-11-22 09:00-03') s),
  'status: meta, capítulos que faltam e recompensa prevista do dia');
select tests.assert(
  (select (s ->> 'achievedToday')::boolean and jsonb_array_length(s -> 'pending') = 1 and s -> 'pending' -> 0 ->> 'day' = '2026-11-20'
   from private.daily_status('d3000000-0000-0000-0000-000000000003', '2026-11-20 22:00-03') s),
  'status: escolha pendente fica no servidor (continua em outro aparelho)');
select tests.assert(
  (select s -> 'pendingChange' ->> 'target' = '5' and s -> 'pendingChange' ->> 'effectiveDay' = '2026-11-23'
   from (select tests.pref('d3000000-0000-0000-0000-000000000003', 'daily_goal', 5, '2026-11-22 10:00-03')) x,
        private.daily_status('d3000000-0000-0000-0000-000000000003', '2026-11-22 10:01-03') s),
  'status mostra a mudança de meta agendada');

-- ---------------------------------------------------------------- regra anterior (v1) preservada
select tests.mk('e2000000-0000-0000-0000-000000000002', 'meta_legado');
select tests.pref('e2000000-0000-0000-0000-000000000002', 'daily_goal', 3, '2026-11-19 12:00-03');
-- meta concedida pela regra v1 (primeiro capítulo) no dia 20
insert into public.daily_goals (user_id, day, time_zone, session_id, book_code, chapter, siclos, options, rule_version, target)
values ('e2000000-0000-0000-0000-000000000002', '2026-11-20', 'America/Sao_Paulo', gen_random_uuid(), 'GEN', 1, 40, '{}', 1, 1);
insert into public.siclos_ledger (user_id, event_type, source_event_id, amount) values ('e2000000-0000-0000-0000-000000000002', 'DAILY_GOAL', 'goal:2026-11-20', 40);
select tests.gfin('e2000000-0000-0000-0000-000000000002', 'l' || n, 'LUK', n, '2026-11-20 10:00-03'::timestamptz + n * interval '5 minutes') from generate_series(1, 3) n;
select tests.assert(tests.siclos('e2000000-0000-0000-0000-000000000002') = 40 and tests.goals('e2000000-0000-0000-0000-000000000002') = 1
  and (select rule_version from public.daily_goals where user_id = 'e2000000-0000-0000-0000-000000000002') = 1,
  'dia já recompensado pela regra v1: mantido, sem recompensa duplicada');
select tests.assert(
  (select (r -> 'dailyGoal' ->> 'achievedNow')::boolean
   from (select tests.gfin('e2000000-0000-0000-0000-000000000002', 'm' || n, 'LUK', 10 + n, '2026-11-21 10:00-03'::timestamptz + n * interval '5 minutes') r
         from generate_series(1, 3) n) t order by (r -> 'dailyGoal' ->> 'newChaptersToday')::int desc limit 1),
  'no dia seguinte vale a regra v2 (meta 3)');

-- ---------------------------------------------------------------- todos os Comuns elegíveis já obtidos
select tests.mk('e3000000-0000-0000-0000-000000000003', 'meta_completa');
select tests.pref('e3000000-0000-0000-0000-000000000003', 'daily_goal', 1, '2026-11-19 12:00-03');
insert into public.user_items (user_id, item_id, source_event_id)
select 'e3000000-0000-0000-0000-000000000003', e, 'test:fixture' from private.eligible_commons('e3000000-0000-0000-0000-000000000003') e;
select tests.assert(
  (select (r -> 'dailyGoal' ->> 'achievedNow')::boolean and (r -> 'dailyGoal' ->> 'siclosAwarded')::int = 40
     and r -> 'dailyGoal' -> 'goal' -> 'options' = '[]'::jsonb and not (r -> 'dailyGoal' -> 'goal' ->> 'choicePending')::boolean
   from tests.gfin('e3000000-0000-0000-0000-000000000003', 'a', 'NUM', 1, '2026-11-20 10:00-03') r),
  'sem Comuns elegíveis: meta cumprida, 40 Siclos creditados, sem escolha pendente');
