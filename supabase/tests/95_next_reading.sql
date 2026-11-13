-- Próxima leitura pelo progresso da conta (aparelho novo).

create function tests.mk_n(p_user uuid, p_name text) returns void language plpgsql as $$
begin
  insert into auth.users (id, email) values (p_user, p_name || '@teste.local');
  insert into public.profiles (id, username, display_name) values (p_user, p_name, initcap(p_name));
end $$;
create function tests.nfin(p_user uuid, p_book text, p_chapter int) returns void language plpgsql as $$
begin
  perform set_config('request.jwt.claim.sub', p_user::text, true);
  perform public.complete_reading_mission(md5('next' || p_user::text || p_book || p_chapter)::uuid, p_book, p_chapter, 'physical', now() - interval '5 minutes', 240);
end $$;
create function tests.nxt(p_user uuid) returns jsonb language plpgsql as $$
begin
  perform set_config('request.jwt.claim.sub', p_user::text, true);
  return public.get_next_reading();
end $$;

select tests.mk_n('00000000-0000-0000-0000-00000000a501', 'leitor_novo');
select tests.assert(tests.nxt('00000000-0000-0000-0000-00000000a501') = '{"last": null, "next": {"book": "GEN", "chapter": 1}, "allDone": false}'::jsonb,
  'conta sem leituras: começa em Gênesis 1');

select tests.mk_n('00000000-0000-0000-0000-00000000a502', 'leitor_genesis');
select tests.nfin('00000000-0000-0000-0000-00000000a502', 'GEN', 1);
select tests.nfin('00000000-0000-0000-0000-00000000a502', 'GEN', 2);
select tests.nfin('00000000-0000-0000-0000-00000000a502', 'GEN', 4);
select tests.assert(tests.nxt('00000000-0000-0000-0000-00000000a502') -> 'next' = '{"book": "GEN", "chapter": 5}'::jsonb,
  'depois de Gênesis 4: o próximo inédito é Gênesis 5 (não volta para Gênesis 1)');
select tests.assert(tests.nxt('00000000-0000-0000-0000-00000000a502') -> 'last' = '{"book": "GEN", "chapter": 4}'::jsonb,
  'a última leitura vem do servidor');

-- releitura no fim do livro: o próximo inédito depois dela
select tests.nfin('00000000-0000-0000-0000-00000000a502', 'EXO', 40);
select tests.assert(tests.nxt('00000000-0000-0000-0000-00000000a502') -> 'next' = '{"book": "LEV", "chapter": 1}'::jsonb,
  'depois de Êxodo 40: Levítico 1 (passa para o livro seguinte)');

-- última leitura no Apocalipse: volta ao início e pula o que já foi lido
select tests.nfin('00000000-0000-0000-0000-00000000a502', 'REV', 22);
select tests.assert(tests.nxt('00000000-0000-0000-0000-00000000a502') -> 'next' = '{"book": "GEN", "chapter": 3}'::jsonb,
  'depois de Apocalipse 22: volta ao início no primeiro inédito (Gênesis 3)');

-- isolamento: a sugestão de uma conta não usa leituras de outra
select tests.assert(tests.nxt('00000000-0000-0000-0000-00000000a501') -> 'next' = '{"book": "GEN", "chapter": 1}'::jsonb,
  'outra conta continua em Gênesis 1');
select tests.assert(not has_function_privilege('anon', 'public.get_next_reading()', 'execute'), 'visitante sem login não consulta');
