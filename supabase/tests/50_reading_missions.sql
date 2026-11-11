-- Modo Missão: finalização de missões de leitura no servidor.

insert into auth.users (id, email) values
  ('b1111111-0000-0000-0000-000000000001', 'missao@teste.local'),
  ('b2222222-0000-0000-0000-000000000002', 'outro@teste.local');
do $$ begin
  perform set_config('request.jwt.claim.sub', 'b1111111-0000-0000-0000-000000000001', true);
  perform public.claim_profile('missao_1', 'Missão');
  perform set_config('request.jwt.claim.sub', 'b2222222-0000-0000-0000-000000000002', true);
  perform public.claim_profile('outro_2', 'Outro');
end $$;

-- finaliza como o jogador 1 (sessão = UUID determinístico a partir de um rótulo)
create function tests.sid(p_label text) returns uuid language sql as $$ select md5(p_label)::uuid $$;
create function tests.finish(p_label text, p_book text, p_chapter int, p_secs int default 300, p_mode text default 'physical', p_user uuid default 'b1111111-0000-0000-0000-000000000001')
returns jsonb language plpgsql as $$
begin
  perform set_config('request.jwt.claim.sub', p_user::text, true);
  return public.complete_reading_mission(tests.sid(p_label), p_book, p_chapter, p_mode, now() - interval '10 minutes', p_secs);
end $$;
create function tests.owns_m(p_item text) returns boolean language sql as $$
  select exists (select 1 from public.user_items where user_id = 'b1111111-0000-0000-0000-000000000001' and item_id = p_item)
$$;
create function tests.xp_m() returns int language sql as $$
  select coalesce(sum(amount), 0)::int from public.xp_ledger where user_id = 'b1111111-0000-0000-0000-000000000001'
$$;

-- ---------------------------------------------------------------- capítulo inédito, repetição e releitura
select tests.assert(
  (select (r ->> 'alreadyCompleted')::boolean = false and (r ->> 'xpAwarded')::int = 10 and r -> 'granted' = '["tunic-joseph"]'::jsonb
     and (r ->> 'chaptersCompleted')::int = 1 and (r -> 'book' ->> 'completed')::int = 1 and (r ->> 'duplicate')::boolean = false
   from tests.finish('gen37-a', 'GEN', 37) r),
  'capítulo inédito: registra, concede a Túnica de José e 10 XP (provisório)');
select tests.assert(
  (select (r ->> 'duplicate')::boolean and r -> 'granted' = '["tunic-joseph"]'::jsonb and (r ->> 'xpAwarded')::int = 10 from tests.finish('gen37-a', 'GEN', 37) r),
  'nova tentativa da mesma sessão devolve o mesmo resultado, marcado como repetido');
select tests.finish('gen37-a', 'GEN', 37);
select tests.assert(tests.xp_m() = 10, 'toques repetidos não duplicam XP');
select tests.assert((select count(*) from public.user_items where user_id = 'b1111111-0000-0000-0000-000000000001' and item_id = 'tunic-joseph') = 1, 'toques repetidos não duplicam item');
select tests.assert((select count(*) from public.reading_sessions where user_id = 'b1111111-0000-0000-0000-000000000001') = 1, 'uma sessão registrada');
select tests.assert(
  (select (r ->> 'alreadyCompleted')::boolean and (r ->> 'xpAwarded')::int = 0 and r -> 'granted' = '[]'::jsonb and (r ->> 'chaptersCompleted')::int = 1
   from tests.finish('gen37-b', 'GEN', 37) r),
  'releitura: informada como tal, sem XP, sem item e sem contar capítulo novo');
select tests.assert(tests.xp_m() = 10, 'releitura não soma XP');
select tests.assert_raises($$select tests.finish('gen37-a', 'GEN', 38)$$, 'invalid_session', 'mesma sessão com outro capítulo é recusada');

-- ---------------------------------------------------------------- tempo, validações e acesso
select tests.assert((tests.finish('gen1', 'GEN', 1, 0) ->> 'activeSeconds')::int = 0, 'sem tempo mínimo: conclusão com 0 s aceita');
select tests.assert((tests.finish('gen2', 'GEN', 2, 999999) ->> 'activeSeconds')::int <= 10 * 60 + 61, 'tempo informado é limitado ao tempo decorrido');
select tests.assert((select reported_seconds from public.reading_sessions where id = tests.sid('gen2')) = 999999, 'tempo informado original fica registrado para auditoria');
select tests.assert((tests.finish('gen3', 'GEN', 3, 120, 'digital') ->> 'mode') = 'digital', 'modo digital aceito pelo servidor');
select tests.assert_raises($$select tests.finish('x1', 'GEN', 51)$$, 'invalid_chapter', 'capítulo inexistente recusado');
select tests.assert_raises($$select tests.finish('x2', 'XYZ', 1)$$, 'invalid_chapter', 'livro inexistente recusado');
select tests.assert_raises($$select tests.finish('x3', 'GEN', 4, 10, 'audio')$$, 'invalid_mode', 'modo desconhecido recusado');
select tests.assert_raises($$select tests.finish('x4', 'GEN', 4, -1)$$, 'invalid_session', 'tempo negativo recusado');
select tests.assert_raises(
  $$select set_config('request.jwt.claim.sub', 'b1111111-0000-0000-0000-000000000001', true), public.complete_reading_mission(gen_random_uuid(), 'GEN', 4, 'physical', now() + interval '1 day', 10)$$,
  'invalid_session', 'início no futuro recusado');
select tests.assert_raises($$select tests.finish('gen37-a', 'GEN', 37, 300, 'physical', 'b2222222-0000-0000-0000-000000000002')$$, 'invalid_session', 'outro jogador não reaproveita a sessão alheia');
select tests.assert((select count(*) from public.user_items where user_id = 'b2222222-0000-0000-0000-000000000002' and item_id = 'tunic-joseph') = 0, 'tentativa com sessão alheia não concede nada');

update public.economy_rules set value = 2 where key = 'max_missions_per_10min';
select tests.assert_raises($$select tests.finish('limite', 'GEN', 5)$$, 'too_many_missions', 'limite anti-abuso configurável');
-- os cenários abaixo leem livros inteiros de uma vez: limite alto só neste banco de teste
update public.economy_rules set value = 1000 where key = 'max_missions_per_10min';

begin;
select set_config('request.jwt.claim.sub', 'b2222222-0000-0000-0000-000000000002', true);
set local role authenticated;
select tests.assert((select count(*) from public.reading_sessions) = 0, 'jogador não vê missões de outra conta');
select tests.assert((select count(*) from public.xp_ledger) = 0, 'jogador não vê XP de outra conta');
select tests.assert_raises($$insert into public.xp_ledger (user_id, event_type, source_event_id, amount) values (auth.uid(), 'HACK', 'x', 1000)$$, 'permission denied%', 'cliente não grava XP');
select tests.assert_raises($$insert into public.reading_sessions (id, user_id, book_code, chapter, mode, started_at, active_seconds, reported_seconds, is_reread, result) values (gen_random_uuid(), auth.uid(), 'GEN', 1, 'physical', now(), 1, 1, false, '{}')$$, 'permission denied%', 'cliente não grava sessão');
select tests.assert_raises($$update public.economy_rules set value = 9999$$, 'permission denied%', 'cliente não altera regras de XP');
select tests.assert((public.get_mission_overview() ->> 'chaptersCompleted')::int = 0, 'resumo começa zerado para outro jogador');
commit;
begin;
set local role anon;
select tests.assert_raises($$select public.complete_reading_mission(gen_random_uuid(), 'GEN', 1, 'physical', now(), 1)$$, 'permission denied%', 'visitante não finaliza missão');
commit;

-- ---------------------------------------------------------------- lendário ao concluir o último capítulo
select tests.finish('rut' || n, 'RUT', n) from generate_series(1, 3) n;
select tests.assert(not tests.owns_m('book_rut'), 'livro incompleto não concede o lendário');
select tests.assert(
  (select r -> 'granted' ? 'book_rut' and (r ->> 'bookJustCompleted')::boolean and (r -> 'book' ->> 'isComplete')::boolean from tests.finish('rut4', 'RUT', 4) r),
  'último capítulo de Rute concede o Lendário e marca o livro como concluído');
select tests.assert(exists (select 1 from private.domain_events where user_id = 'b1111111-0000-0000-0000-000000000001' and event_type = 'BOOK_COMPLETED' and source_event_id = 'book:RUT'), 'conclusão do livro registrada no histórico');
select tests.assert(
  (select r -> 'granted' = '[]'::jsonb and not (r ->> 'bookJustCompleted')::boolean from tests.finish('rut4-de-novo', 'RUT', 4) r),
  'reler o último capítulo não concede o Lendário de novo');
select tests.assert((select count(*) from public.user_items where user_id = 'b1111111-0000-0000-0000-000000000001' and item_id = 'book_rut') = 1, 'Lendário uma única vez');

-- ---------------------------------------------------------------- Manto do Profeta → Sucessão → Coleção dos Profetas
select tests.assert((select rule_type from public.item_unlock_rules where item_id = 'cloak-elijah' and is_active and rule_type <> 'starter') = 'mission_completed', 'Manto do Profeta: regra ativa é a missão curada');
select tests.assert(
  (select r -> 'granted' = '[]'::jsonb from tests.finish('2ki2', '2KI', 2) r),
  'jogador novo: 2 Reis 2 antes do Manto do Profeta não concede a Sucessão');
select tests.assert(
  (select r -> 'granted' @> '["cloak-elijah", "cloak-succession"]'::jsonb and r -> 'missions' -> 0 ->> 'id' = 'missao_manto_do_profeta' from tests.finish('1ki19', '1KI', 19) r),
  'missão de 1 Reis 19 concede o Manto do Profeta e libera a Sucessão pendente');
select tests.assert(
  (select r -> 'granted' = '[]'::jsonb and r -> 'missions' = '[]'::jsonb from tests.finish('1ki19-de-novo', '1KI', 19) r),
  'releitura de 1 Reis 19 não repete a missão nem o manto');
select tests.finish('isa' || n, 'ISA', n) from generate_series(1, 65) n;
select tests.assert(
  (select r -> 'granted' @> '["book_isa", "scroll-isaiah", "cloak-elijah-prophets"]'::jsonb from tests.finish('isa66', 'ISA', 66) r),
  'concluir Isaías completa a Coleção dos Profetas para um jogador novo');
select tests.assert(tests.owns_m('cloak-elijah') and tests.owns_m('cloak-succession') and tests.owns_m('scroll-isaiah') and tests.owns_m('cloak-elijah-prophets'), 'progressão completa até a Coleção dos Profetas');

-- ---------------------------------------------------------------- itens Santos
select tests.assert(
  not exists (select 1 from public.user_items ui join public.cosmetic_items i on i.id = ui.item_id where ui.user_id = 'b1111111-0000-0000-0000-000000000001' and i.rarity = 'holy'),
  'missões de leitura não concedem itens Santos sem marco curado');
insert into public.reward_triggers (id, kind, name, book_code, chapter) values ('holy_mana_do_deserto', 'milestone', 'Marco de teste', 'EXO', 16);
select tests.assert(
  (select r -> 'granted' = '["holy_mana_do_deserto"]'::jsonb and r -> 'missions' -> 0 ->> 'kind' = 'milestone' from tests.finish('exo16', 'EXO', 16) r),
  'marco curado vinculado a capítulo concede o item Santo pelo servidor');
delete from public.reward_triggers where id = 'holy_mana_do_deserto';

-- ---------------------------------------------------------------- resumo
begin;
select set_config('request.jwt.claim.sub', 'b1111111-0000-0000-0000-000000000001', true);
set local role authenticated;
select tests.assert(
  (select (o ->> 'booksCompleted')::int = 2 and (o -> 'chaptersByBook' -> 'RUT') @> '[1,2,3,4]'::jsonb and (o ->> 'xpTotal')::int = tests_xp.v
   from public.get_mission_overview() o, (select coalesce(sum(amount), 0)::int v from public.xp_ledger) tests_xp),
  'resumo: livros concluídos, capítulos por livro e XP total');
select tests.assert(
  (select (m ->> 'completed')::boolean from jsonb_array_elements(public.get_mission_overview() -> 'missions') m where m ->> 'id' = 'missao_manto_do_profeta'),
  'resumo mostra a missão curada concluída');
commit;

update public.economy_rules set value = 60 where key = 'max_missions_per_10min';
