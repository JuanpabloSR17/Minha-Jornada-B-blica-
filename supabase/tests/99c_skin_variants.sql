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
select tests.assert_raises($$select public.equip_skin('comum_pastor', 1, 'feminino')$$, 'invalid_variant', 'skin sem pintura feminina recusa a apresentação');
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
rollback;
