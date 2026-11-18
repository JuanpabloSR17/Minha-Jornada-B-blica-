-- Vestiário de skins: o jogador veste só skins que tem, escolhe um dos 3 estilos, e o cartão
-- público mostra a skin vestida respeitando a privacidade.
begin;
select tests.mk_m('b9000000-0000-0000-0000-0000000000b9', 'vestiario_um', 0);
select tests.mk_m('b9100000-0000-0000-0000-0000000000b9', 'vestiario_dois', 0);
select set_config('request.jwt.claim.sub', 'b9000000-0000-0000-0000-0000000000b9', true);
set local role authenticated;
select tests.assert(public.get_my_skins() -> 'selected' = '{"skinId": "comum_peregrino_exodo", "style": 1}'::jsonb,
  'sem escolha, veste o Peregrino do Êxodo no estilo 1');
select tests.assert(jsonb_array_length(public.get_my_skins() -> 'owned') = 2, 'conta nova tem as 2 skins iniciais');
select tests.assert(public.equip_skin('comum_pastor', 3) = '{"skinId": "comum_pastor", "style": 3}'::jsonb, 'veste uma skin inicial no estilo 3');
select tests.assert(public.get_my_skins() #>> '{selected,skinId}' = 'comum_pastor', 'a escolha fica salva');
select tests.assert_raises($$select public.equip_skin('lendario_moises', 1)$$, 'skin_not_owned', 'não veste skin que não tem');
select tests.assert_raises($$select public.equip_skin('comum_pastor', 4)$$, 'invalid_style', 'só existem 3 estilos');
select tests.assert_raises($$select public.equip_skin('comum_pastor', null)$$, 'invalid_style', 'estilo é obrigatório');
select tests.assert_raises($$select public.equip_skin('skin_inexistente', 1)$$, 'skin_not_found', 'skin inexistente é recusada');
select tests.assert_raises($$insert into public.user_skin_selection (user_id, skin_id, style) values (auth.uid(), 'lendario_moises', 1)$$,
  'permission denied%', 'cliente não grava a escolha direto na tabela');
select tests.assert_raises($$update public.user_skin_selection set skin_id = 'lendario_moises'$$,
  'permission denied%', 'nem altera a escolha direto na tabela');
reset role;
insert into public.user_skins (user_id, skin_id, source_event_id) values ('b9000000-0000-0000-0000-0000000000b9', 'raro_levita', 'skin-purchase:teste');
set local role authenticated;
select tests.assert(public.equip_skin('raro_levita', 2) #>> '{skinId}' = 'raro_levita', 'veste uma skin comprada');
select tests.assert(jsonb_array_length(public.get_my_skins() -> 'owned') = 3, 'a comprada aparece entre as suas');
-- o outro jogador não vê a escolha deste pela tabela
select set_config('request.jwt.claim.sub', 'b9100000-0000-0000-0000-0000000000b9', true);
select tests.assert((select count(*) from public.user_skin_selection) = 0, 'RLS: cada um lê só a própria escolha');
select tests.assert(public.get_public_avatar('vestiario_um') -> 'skin' is null, 'perfil privado não mostra a skin');
reset role;
update public.profiles set privacy_mode = 'public' where id = 'b9000000-0000-0000-0000-0000000000b9';
set local role authenticated;
select tests.assert(public.get_public_avatar('vestiario_um') -> 'skin' = '{"skinId": "raro_levita", "style": 2}'::jsonb,
  'perfil público mostra a skin vestida');
reset role;
-- se a skin sair de circulação, volta para a inicial sem quebrar o cartão
update public.skins set is_active = false where id = 'raro_levita';
select tests.assert(private.skin_selection('b9000000-0000-0000-0000-0000000000b9') #>> '{skinId}' = 'comum_peregrino_exodo',
  'skin desativada cai para a inicial');
set local role anon;
select tests.assert_raises($$select public.get_my_skins()$$, 'permission denied%', 'visitante sem login não lê skins');
select tests.assert_raises($$select public.equip_skin('comum_pastor', 1)$$, 'permission denied%', 'visitante sem login não veste skins');
rollback;
