-- Conclusão dos sete mundos pelo servidor (uma vez por conta, derivada dos capítulos registrados).

create function tests.mk_w(p_user uuid, p_name text) returns void language plpgsql as $$
begin
  insert into auth.users (id, email) values (p_user, p_name || '@teste.local');
  insert into public.profiles (id, username, display_name) values (p_user, p_name, initcap(p_name));
end $$;
create function tests.read_book(p_user uuid, p_book text, p_upto int default null) returns void language plpgsql as $$
declare n int;
begin
  select coalesce(p_upto, chapters) into n from public.bible_books where code = p_book;
  for c in 1..n loop
    perform private.record_event(p_user, 'CHAPTER_COMPLETED', 'chapter:' || p_book || '.' || c, jsonb_build_object('book', p_book, 'chapter', c));
  end loop;
end $$;
create function tests.worlds_done(p_user uuid) returns text[] language sql as $$
  select coalesce(array_agg(source_event_id order by source_event_id), '{}') from private.domain_events where user_id = p_user and event_type = 'WORLD_COMPLETED'
$$;

select tests.assert((select count(*) from public.bible_worlds) = 7, 'sete mundos cadastrados');
select tests.assert((select count(*) from public.bible_world_books) = 66 and (select count(distinct book_code) from public.bible_world_books) = 66, 'os 66 livros em exatamente um mundo');
select tests.assert((select count(*) from public.reward_triggers where kind = 'world' and is_active) = 7, 'um gatilho de conclusão por mundo');
select tests.assert(not exists (select 1 from public.item_unlock_rules r join public.reward_triggers t on t.id = r.rule_payload ->> 'world' where t.kind = 'world'),
  'nenhum item ligado aos mundos antes da decisão editorial');

select tests.mk_w('00000000-0000-0000-0000-00000000b601', 'leitor_apocalipse');
-- quase completo: nada registrado
select tests.read_book('00000000-0000-0000-0000-00000000b601', 'REV', 21);
select tests.assert(tests.worlds_done('00000000-0000-0000-0000-00000000b601') = '{}', 'Apocalipse sem o capítulo 22: mundo não concluído');
-- último capítulo: concluído uma vez
select tests.read_book('00000000-0000-0000-0000-00000000b601', 'REV');
select tests.assert(tests.worlds_done('00000000-0000-0000-0000-00000000b601') = array['world:nova-criacao'], 'último capítulo conclui o mundo da Nova Criação');
-- releitura e repetição não duplicam
select tests.read_book('00000000-0000-0000-0000-00000000b601', 'REV');
select private.check_world_for_book('00000000-0000-0000-0000-00000000b601', 'REV');
select tests.assert((select count(*) from private.domain_events where user_id = '00000000-0000-0000-0000-00000000b601' and event_type = 'WORLD_COMPLETED') = 1, 'uma vez por conta');
select tests.assert(not exists (select 1 from public.user_items where user_id = '00000000-0000-0000-0000-00000000b601' and source_event_id like 'WORLD_COMPLETED%'), 'nenhum item concedido pelo mundo');

-- mundo com vários livros: só ao completar todos
select tests.read_book('00000000-0000-0000-0000-00000000b601', 'MAT');
select tests.read_book('00000000-0000-0000-0000-00000000b601', 'MRK');
select tests.read_book('00000000-0000-0000-0000-00000000b601', 'LUK');
select tests.assert(not ('world:evangelhos' = any (tests.worlds_done('00000000-0000-0000-0000-00000000b601'))), 'Evangelhos sem João: não concluído');
select tests.read_book('00000000-0000-0000-0000-00000000b601', 'JHN');
select tests.assert('world:evangelhos' = any (tests.worlds_done('00000000-0000-0000-0000-00000000b601')), 'Evangelhos concluídos com os quatro livros');

-- progresso pelo servidor
select set_config('request.jwt.claim.sub', '00000000-0000-0000-0000-00000000b601', false);
select tests.assert(jsonb_array_length(public.get_world_progress()) = 7, 'progresso dos sete mundos');
select tests.assert((select (e ->> 'done')::int = 22 and (e ->> 'chapters')::int = 22 and e ->> 'completedAt' is not null from jsonb_array_elements(public.get_world_progress()) e where e ->> 'id' = 'nova-criacao'), 'Nova Criação: 22 de 22, concluída');
select tests.assert((select (e ->> 'done')::int = 0 and e ->> 'completedAt' is null from jsonb_array_elements(public.get_world_progress()) e where e ->> 'id' = 'origens'), 'Origens: 0, não concluída');

-- isolamento
select tests.mk_w('00000000-0000-0000-0000-00000000b602', 'leitor_outro');
select tests.assert(tests.worlds_done('00000000-0000-0000-0000-00000000b602') = '{}', 'outra conta não herda a conclusão');
select tests.assert(not has_function_privilege('authenticated', 'private.check_world_for_book(uuid, text)', 'execute'), 'conta comum não registra mundo diretamente');
select tests.assert(not has_function_privilege('anon', 'public.get_world_progress()', 'execute'), 'visitante sem login não consulta');
select set_config('request.jwt.claim.sub', '', false);
