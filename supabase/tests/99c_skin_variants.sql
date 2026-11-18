-- Apresentações da skin (padrão e feminina): o servidor guarda a escolha e só aceita as que a skin tem.
begin;
select tests.mk_m('bc000000-0000-0000-0000-0000000000bc', 'apresentacao_um', 0);
select set_config('request.jwt.claim.sub', 'bc000000-0000-0000-0000-0000000000bc', true);
set local role authenticated;
select tests.assert(public.get_my_skins() #>> '{selected,variant}' = 'padrao', 'sem escolha, apresentação padrão');
select tests.assert(public.equip_skin('comum_peregrino_exodo', 2, 'feminino') = '{"skinId": "comum_peregrino_exodo", "style": 2, "variant": "feminino"}'::jsonb,
  'veste a Peregrina do Êxodo (apresentação feminina), estilo 2');
select tests.assert(public.get_my_skins() #>> '{selected,variant}' = 'feminino', 'a apresentação fica salva');
select tests.assert(public.equip_skin('comum_pastor', 1) #>> '{variant}' = 'padrao', 'sem informar, vale a padrão');
select tests.assert_raises($$select public.equip_skin('raro_hur', 1, 'feminino')$$, 'invalid_variant', 'skin sem pintura feminina recusa a apresentação');
select tests.assert_raises($$select public.equip_skin('comum_peregrino_exodo', 1, 'outra')$$, 'invalid_variant', 'apresentação inexistente é recusada');
select tests.assert_raises($$select public.equip_skin('raro_levita', 1, 'feminino')$$, 'skin_not_owned', 'apresentação feminina não dá posse da skin');
reset role;
update public.profiles set privacy_mode = 'public' where id = 'bc000000-0000-0000-0000-0000000000bc';
set local role authenticated;
select public.equip_skin('comum_peregrino_exodo', 3, 'feminino');
select tests.assert(public.get_public_avatar('apresentacao_um') -> 'skin' = '{"skinId": "comum_peregrino_exodo", "style": 3, "variant": "feminino"}'::jsonb,
  'o cartão público mostra a apresentação escolhida');
reset role;
select tests.assert_raises($$update public.skins set variants = '{feminino}' where id = 'comum_pastor'$$, '%check%', 'toda skin mantém a apresentação padrão');
select tests.assert((select count(*) from public.skins where season = 't1-exodo' and 'feminino' = any(variants)) = 9,
  'ofícios e figuras genéricas: 9 skins com apresentação feminina pintada');
select tests.assert(not exists (select 1 from public.skins where (character_sex is not null or rarity in ('legendary', 'glorious')) and variants <> '{padrao}'),
  'personagens bíblicos (principais e secundários): só a apresentação do sexo do personagem');
select tests.assert((select count(*) from public.skins where season = 't1-exodo' and character_sex is not null) = 13, 'Temporada 1: 13 personagens bíblicos marcados com o sexo');
select tests.assert_raises($$update public.skins set variants = '{padrao,feminino}' where id = 'epico_bezalel'$$, '%skins_character_single_presentation%',
  'o banco recusa apresentação do outro sexo para personagem secundário (Bezalel)');
select tests.assert((select variants from public.skins where id = 'raro_shofar') = '{padrao,feminino}'::text[], 'figura genérica (Tocador de shofar) mantém a feminina');
select tests.assert_raises($$update public.skins set variants = '{padrao,feminino}' where id = 'lendario_moises'$$, '%skins_character_single_presentation%',
  'o banco recusa apresentação do outro sexo para personagem principal');
select tests.assert((select variants from public.skins where id = 'raro_sacerdote') = '{padrao}'::text[], 'o Sacerdote segue só com a padrão');
rollback;

-- seleção antiga de apresentação feminina de um personagem principal: vale a padrão, com o mesmo estilo
begin;
select tests.mk_m('be000000-0000-0000-0000-0000000000be', 'selecao_antiga', 0);
insert into public.user_skins (user_id, skin_id, source_event_id) values ('be000000-0000-0000-0000-0000000000be', 'lendario_moises', 'skin-reading:lendario_moises');
insert into public.user_skin_selection (user_id, skin_id, style, variant) values ('be000000-0000-0000-0000-0000000000be', 'lendario_moises', 3, 'feminino');
select set_config('request.jwt.claim.sub', 'be000000-0000-0000-0000-0000000000be', true);
set local role authenticated;
select tests.assert(public.get_my_skins() -> 'selected' = '{"skinId": "lendario_moises", "style": 3, "variant": "padrao"}'::jsonb,
  'seleção antiga do Manto de Moisés feminino vira a padrão, com a mesma skin e o estilo 3');
select tests.assert_raises($$select public.equip_skin('lendario_moises', 2, 'feminino')$$, 'invalid_variant', 'não se veste mais a apresentação feminina de Moisés');
select tests.assert(public.equip_skin('lendario_moises', 2) #>> '{variant}' = 'padrao', 'a padrão continua disponível nos 3 estilos');
rollback;
