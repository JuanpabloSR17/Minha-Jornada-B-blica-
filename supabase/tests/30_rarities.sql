-- Testes do sistema de itens e raridades (catálogo v4).

-- ---------------------------------------------------------------- catálogo
select tests.assert(
  (select jsonb_object_agg(rarity, n) from (select rarity, count(*) n from public.cosmetic_items where series = 'rarities-v1' group by rarity) t)
  = '{"common":22,"rare":18,"epic":16,"legendary":66,"holy":22}'::jsonb,
  'série de raridades: 22 comuns, 18 raros, 16 épicos, 66 lendários, 22 santos (144)');
select tests.assert((select count(*) from public.cosmetic_items where series in ('starter', 'rarities-v1') and id <> 'test-locked-robe') = 179, 'catálogo total: 144 da série + 35 peças iniciais');
select tests.assert(
  (select count(distinct book_code) from public.cosmetic_items where rarity = 'legendary') = 66
  and (select count(*) from public.bible_books b where not exists (select 1 from public.cosmetic_items i where i.rarity = 'legendary' and i.book_code = b.code)) = 0,
  'um lendário para cada um dos 66 livros');
select tests.assert(
  not exists (
    select 1 from public.cosmetic_items i
    where i.rarity = 'legendary' and not exists (
      select 1 from public.item_unlock_rules r where r.item_id = i.id and r.rule_type = 'book_completed' and r.rule_payload ->> 'book' = i.book_code)),
  'cada lendário é conquistado ao concluir o próprio livro');
select tests.assert((select bool_and(slot = 'relic') from public.cosmetic_items where rarity = 'holy'), 'itens santos são relíquias do Santuário (não equipáveis)');
select tests.assert((select bool_and(not is_premium_cosmetic) from public.cosmetic_items where series = 'rarities-v1'), 'nenhum item da série é Premium');
select tests.assert(
  (select count(distinct rarity) from public.cosmetic_items where slot = 'outfit') >= 3
  and (select count(distinct acquisition) from public.cosmetic_items where rarity = 'common') >= 2,
  'raridade, slot e obtenção são independentes');
select tests.assert(
  not exists (
    select 1 from public.item_unlock_rules r
    where r.rule_payload ? 'book' and not exists (select 1 from public.bible_books b where b.code = r.rule_payload ->> 'book')),
  'toda regra aponta para um livro existente');
select tests.assert(
  not exists (
    select 1 from public.item_unlock_rules r join public.bible_books b on b.code = r.rule_payload ->> 'book'
    where r.rule_payload ? 'chapter' and (r.rule_payload ->> 'chapter')::int > b.chapters),
  'toda regra aponta para um capítulo existente');
select tests.assert(
  (select count(*) from unnest(array['tunic-linen','tunic-joseph','cloak-elijah','cloak-succession','cloak-elijah-prophets','scroll-isaiah','crown-wisdom','frame-complete','bg-sinai','bg-bethlehem','sling-david','harp-psalmist','staff-moses','sandals-desert']) id
   where exists (select 1 from public.cosmetic_items i where i.id = id)) = 14,
  'IDs de versões anteriores preservados');
select tests.assert(
  (select count(*) from public.collection_items where collection_id in ('works-father','works-son','works-spirit')) = 22,
  'coleções das obras do Pai, de Jesus Cristo e do Espírito Santo reúnem as 22 relíquias');
select tests.assert_raises(
  $$insert into public.cosmetic_items (id, name, category, slot, rarity, asset_manifest_key) values ('teste-mitico', 'X', 'x', 'outfit', 'mythic', 'x')$$,
  '%cosmetic_items_rarity_fkey%', 'raridade inexistente é recusada pelo banco');
select tests.assert_raises(
  $$insert into public.cosmetic_items (id, name, category, slot, rarity, asset_manifest_key, book_code) values ('teste-lend-2', 'X', 'x', 'outfit', 'legendary', 'x', 'RUT')$$,
  '%cosmetic_items_one_legendary_per_book%', 'um livro não pode ter dois lendários');

-- ---------------------------------------------------------------- usuário de teste
insert into auth.users (id, email) values ('a8888888-0000-0000-0000-000000000008', 'raridades@teste.local');
do $$ begin
  perform set_config('request.jwt.claim.sub', 'a8888888-0000-0000-0000-000000000008', true);
  perform public.claim_profile('raridades_8', 'Raridades');
  perform public.save_avatar(
    '{"bodyId":"body-a","skinToneId":"skin-2","eyesId":"eyes-round","browsId":"brows-soft","expressionId":"expr-smile","beardId":"beard-none","hairStyleId":"hair-curly","hairColorId":"haircolor-black"}',
    '{"outfit":"tunic-linen"}');
end $$;
create function tests.ev8(p_type text, p_source text, p_payload jsonb) returns jsonb language sql as $$
  select private.record_event('a8888888-0000-0000-0000-000000000008', p_type, p_source, p_payload)
$$;
create function tests.owns8(p_item text) returns boolean language sql as $$
  select exists (select 1 from public.user_items where user_id = 'a8888888-0000-0000-0000-000000000008' and item_id = p_item)
$$;

-- lendário por livro completo (Rute: 4 capítulos)
select tests.ev8('CHAPTER_COMPLETED', 'chapter:RUT.' || n, jsonb_build_object('book', 'RUT', 'chapter', n)) from generate_series(1, 3) n;
select tests.assert(not tests.owns8('legendary-rut'), 'livro incompleto não concede o lendário');
select tests.assert(tests.ev8('CHAPTER_COMPLETED', 'chapter:RUT.4', '{"book":"RUT","chapter":4}') -> 'granted' ? 'legendary-rut', 'concluir todos os capítulos de Rute concede o lendário de Rute');
select tests.assert((select count(*) from public.user_items where user_id = 'a8888888-0000-0000-0000-000000000008' and item_id = 'legendary-rut') = 1, 'lendário concedido uma única vez');

-- relíquia santa: concedida por leitura, exibida no Santuário, nunca equipada
select tests.assert(tests.ev8('CHAPTER_COMPLETED', 'chapter:ACT.2', '{"book":"ACT","chapter":2}') -> 'granted' ? 'relic-tongues-fire', 'Atos 2 concede a relíquia Línguas de Fogo de Pentecostes');
begin;
select set_config('request.jwt.claim.sub', 'a8888888-0000-0000-0000-000000000008', true);
set local role authenticated;
select tests.assert((select count(*) from public.user_items where item_id = 'relic-tongues-fire') = 1, 'relíquia aparece no inventário do dono');
select tests.assert_raises($$select public.equip_item((public.get_wardrobe() ->> 'activeLoadoutId')::uuid, 'relic-tongues-fire')$$, 'item_not_equippable', 'relíquia não pode ser equipada');
select tests.assert_raises(
  $$select public.save_wardrobe((public.get_wardrobe() ->> 'activeLoadoutId')::uuid, '{"outfit":"tunic-linen","hands":"relic-tongues-fire"}', null)$$,
  'item_not_equippable', 'relíquia não entra num visual nem por save_wardrobe');
select tests.assert_raises($$select public.equip_item((public.get_wardrobe() ->> 'activeLoadoutId')::uuid, 'legendary-gen')$$, 'item_not_owned', 'lendário não conquistado não pode ser equipado');
select tests.assert((public.equip_item((public.get_wardrobe() ->> 'activeLoadoutId')::uuid, 'legendary-rut') -> 'loadouts' -> 0 -> 'equipment' ->> 'hands') = 'legendary-rut', 'lendário conquistado é equipado');
select tests.assert((select count(*) from public.rarities) >= 5, 'raridades legíveis pelo app');
select tests.assert_raises($$update public.rarities set color = '#000000'$$, 'permission denied%', 'cliente não altera raridades');
select tests.assert_raises($$update public.cosmetic_items set rarity = 'holy' where id = 'tunic-linen'$$, 'permission denied%', 'cliente não altera a raridade de um item');
select tests.assert_raises($$insert into public.reward_triggers (id, kind, name) values ('hack-mission', 'mission', 'x')$$, 'permission denied%', 'cliente não cadastra missões');
select tests.assert((select count(*) from public.user_items where user_id <> auth.uid()) = 0, 'inventário de outras contas é invisível');
commit;

-- ---------------------------------------------------------------- contrato das missões e marcos
select tests.assert_raises($$select tests.ev8('MISSION_COMPLETED', 'mission:mission-lost-coin', '{"mission":"mission-lost-coin"}')$$, 'unknown_trigger', 'missão não cadastrada é recusada (sem eventos fictícios)');
select tests.assert_raises($$select tests.ev8('MILESTONE_REACHED', 'milestone:x', '{"milestone":"x"}')$$, 'unknown_trigger', 'marco não cadastrado é recusado');
select tests.assert_raises($$select tests.ev8('WORLD_COMPLETED', 'world:x', '{"world":"x"}')$$, 'unknown_trigger', 'mundo não cadastrado é recusado');
select tests.assert((select count(*) from public.reward_triggers) = 0, 'nenhuma missão cadastrada em produção nesta etapa');

-- cenário isolado: uma missão cadastrada só neste banco de teste
insert into public.reward_triggers (id, kind, name) values ('mission-lost-coin', 'mission', 'Missão de teste');
select tests.assert(tests.ev8('MISSION_COMPLETED', 'mission:mission-lost-coin', '{"mission":"mission-lost-coin"}') -> 'granted' = '["purse-coins"]'::jsonb, 'missão concluída concede a Bolsa de Moedas');
select tests.assert((tests.ev8('MISSION_COMPLETED', 'mission:mission-lost-coin', '{"mission":"mission-lost-coin"}') ->> 'duplicate')::boolean, 'missão repetida não duplica');
update public.reward_triggers set is_active = false where id = 'mission-lost-coin';
select tests.assert_raises($$select tests.ev8('MISSION_COMPLETED', 'mission:mission-lost-coin#2', '{"mission":"mission-lost-coin"}')$$, 'unknown_trigger', 'missão desativada é recusada');
delete from public.reward_triggers;
