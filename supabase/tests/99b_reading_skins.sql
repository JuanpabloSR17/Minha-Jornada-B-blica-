-- Lendárias e Gloriosas conquistadas lendo: regra no servidor, concessão automática uma vez,
-- progresso visível e nada concedido antes da hora.
create function tests.read_all(p_user uuid, p_book text, p_upto int default null) returns void language plpgsql as $$
declare c int;
begin
  for c in 1 .. coalesce(p_upto, (select b.chapters from public.bible_books b where b.code = p_book)) loop
    perform private.record_event(p_user, 'CHAPTER_COMPLETED', 'chapter:' || p_book || '.' || c, jsonb_build_object('book', p_book, 'chapter', c));
  end loop;
end $$;
create function tests.has_skin(p_user uuid, p_skin text) returns boolean language sql as $$
  select exists (select 1 from public.user_skins where user_id = p_user and skin_id = p_skin)
$$;
create function tests.reading(p_skin text) returns jsonb language sql as $$
  select r from jsonb_array_elements(public.get_my_skins() -> 'reading') r where r ->> 'skinId' = p_skin
$$;

begin;
select tests.mk_m('ba000000-0000-0000-0000-0000000000ba', 'leitor_do_exodo', 0);
select set_config('request.jwt.claim.sub', 'ba000000-0000-0000-0000-0000000000ba', true);
select tests.read_all(auth.uid(), 'EXO', 39);
select tests.assert(not tests.has_skin(auth.uid(), 'lendario_moises'), 'com 39 de 40 capítulos de Êxodo, ainda não recebe o Manto de Moisés');
set local role authenticated;
select tests.assert(tests.reading('lendario_moises') @> '{"done": 39, "total": 40}', 'progresso visível: 39 de 40');
select tests.assert(jsonb_array_length(public.get_my_skins() -> 'reading') = 14, 'as 14 skins de leitura da Temporada 1 aparecem com regra e progresso');
reset role;
select tests.read_all(auth.uid(), 'EXO');
select tests.assert(tests.has_skin(auth.uid(), 'lendario_moises'), 'concluir Êxodo concede o Manto de Moisés');
select tests.assert((select source_event_id from public.user_skins where user_id = auth.uid() and skin_id = 'lendario_moises') = 'skin-reading:lendario_moises',
  'origem registrada: leitura');
select tests.assert(tests.has_skin(auth.uid(), 'lendario_arao'), 'Êx 25, 30 e 40 lidos concedem as Vestes de Arão (Trilha do Tabernáculo)');
select tests.assert(not tests.has_skin(auth.uid(), 'glorioso_moises_rosto_resplandecente'), 'a Gloriosa de Moisés ainda pede o Marco das Tábuas');
-- releitura do mesmo capítulo não duplica nada
select tests.read_all(auth.uid(), 'EXO', 3);
select tests.assert((select count(*) from public.user_skins where user_id = auth.uid() and skin_id = 'lendario_moises') = 1, 'concedida uma única vez');
select private.record_event(auth.uid(), 'MILESTONE_REACHED', 'milestone:holy_tabuas_da_alianca', '{"milestone": "holy_tabuas_da_alianca"}');
select tests.assert(tests.has_skin(auth.uid(), 'glorioso_moises_rosto_resplandecente'), 'Êxodo concluído + Marco das Tábuas concedem Moisés com o rosto resplandecente');
select tests.assert(not tests.has_skin(auth.uid(), 'glorioso_arao_vara_floresceu'), 'a Gloriosa de Arão pede Levítico e Números');
select tests.read_all(auth.uid(), 'LEV');
select tests.read_all(auth.uid(), 'NUM');
select tests.assert(tests.has_skin(auth.uid(), 'glorioso_arao_vara_floresceu'), 'concluir Êxodo, Levítico e Números concede Arão e a vara que floresceu');
set local role authenticated;
select tests.assert(public.equip_skin('glorioso_arao_vara_floresceu', 3) #>> '{skinId}' = 'glorioso_arao_vara_floresceu', 'a Gloriosa conquistada pode ser vestida');
select tests.assert((select r -> 'source' from jsonb_array_elements(public.get_my_skins() -> 'owned') r where r ->> 'skinId' = 'lendario_moises') = '"skin-reading"',
  'as skins da conta trazem a origem');
select tests.assert_raises($$insert into public.skin_unlock_rules (skin_id, rule, label) values ('raro_levita', '{"books":["GEN"]}', 'x')$$,
  'permission denied%', 'cliente não cria regras');
select tests.assert_raises($$select private.grant_reading_skins(auth.uid())$$, 'permission denied%', 'cliente não chama a concessão direto');
reset role;
-- outro jogador, sem leitura, não ganha nada; a Lendária nunca vai à loja
select tests.mk_m('bb000000-0000-0000-0000-0000000000bb', 'leitor_sem_leitura', 0);
select tests.assert(not exists (select 1 from public.user_skins where user_id = 'bb000000-0000-0000-0000-0000000000bb'), 'conta sem leitura não recebe skins de leitura');
select tests.assert(not exists (select 1 from public.skins s join public.skin_unlock_rules r on r.skin_id = s.id where s.in_shop), 'skins de leitura nunca estão na loja');
-- Raras de missão e Épicas da temporada: capítulos da história do personagem
select tests.mk_m('bd000000-0000-0000-0000-0000000000bd', 'leitor_missoes', 0);
select tests.read_all('bd000000-0000-0000-0000-0000000000bd', 'EXO', 2);
select tests.assert(tests.has_skin('bd000000-0000-0000-0000-0000000000bd', 'raro_parteiras')
  and tests.has_skin('bd000000-0000-0000-0000-0000000000bd', 'raro_joquebede')
  and tests.has_skin('bd000000-0000-0000-0000-0000000000bd', 'raro_filha_de_farao'), 'Êxodo 1–2 concedem as 3 Raras de missão');
select tests.assert(not tests.has_skin('bd000000-0000-0000-0000-0000000000bd', 'epico_zipora'), 'Zípora pede também Êxodo 4 e 18');
select private.record_event('bd000000-0000-0000-0000-0000000000bd', 'CHAPTER_COMPLETED', 'chapter:EXO.4', '{"book":"EXO","chapter":4}');
select private.record_event('bd000000-0000-0000-0000-0000000000bd', 'CHAPTER_COMPLETED', 'chapter:EXO.18', '{"book":"EXO","chapter":18}');
select tests.assert(tests.has_skin('bd000000-0000-0000-0000-0000000000bd', 'epico_zipora'), 'Êxodo 2, 4 e 18 concedem o Véu de Zípora');
rollback;
