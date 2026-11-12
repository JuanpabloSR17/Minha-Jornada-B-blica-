-- Testes do sistema de itens e raridades (catálogo oficial, v5).

-- ---------------------------------------------------------------- catálogo
select tests.assert(
  (select jsonb_object_agg(rarity, n) from (select rarity, count(*) n from public.cosmetic_items where series = 'oficial-v2' and is_active group by rarity) t)
  = '{"common":22,"rare":18,"epic":16,"legendary":66,"holy":22}'::jsonb,
  'catálogo oficial: 22 comuns, 18 raros, 16 épicos, 66 lendários, 22 santos (144)');
select tests.assert(
  (select count(*) from public.cosmetic_items where series = 'oficial-v2' and is_active)
  + (select count(*) from public.cosmetic_item_aliases a join public.cosmetic_items i on i.id = a.item_id where a.source = 'official' and i.series = 'oficial-v2') >= 144
  and (select count(*) from public.cosmetic_items where series = 'oficial-v2') = 144,
  'os 144 itens oficiais estão no banco (por ID oficial ou alias)');
select tests.assert(
  (select count(distinct book_code) from public.cosmetic_items where rarity = 'legendary' and is_active) = 66
  and (select count(*) from public.bible_books b where not exists (select 1 from public.cosmetic_items i where i.rarity = 'legendary' and i.is_active and i.book_code = b.code)) = 0
  and (select count(*) from public.cosmetic_items where rarity = 'legendary' and is_active) = 66,
  'exatamente um lendário ativo para cada um dos 66 livros');
select tests.assert(
  not exists (
    select 1 from public.cosmetic_items i
    where i.rarity = 'legendary' and i.is_active and not exists (
      select 1 from public.item_unlock_rules r where r.item_id = i.id and r.is_active and r.rule_type = 'book_completed' and r.rule_payload ->> 'book' = i.book_code)),
  'cada lendário é conquistado ao concluir o próprio livro');
select tests.assert((select bool_and(acquisition = 'reading' and not is_premium_cosmetic and not shop_eligible) from public.cosmetic_items where rarity = 'legendary' and is_active), 'lendários são gratuitos (leitura), nunca Premium nem loja');
select tests.assert((select bool_and(not shop_eligible and not is_premium_cosmetic) from public.cosmetic_items where rarity = 'holy'), 'itens santos nunca vendidos');
select tests.assert(
  (select bool_and(slot = 'relic') from public.cosmetic_items where rarity = 'holy' and is_active and holy_subtype = 'artefato'),
  'artefatos santos são relíquias de exposição (não equipáveis)');
select tests.assert(
  not exists (select 1 from public.cosmetic_items where rarity = 'holy' and is_active and referent is null),
  'todo item santo indica o referente (Pai, Filho, Espírito Santo ou Deus Triúno)');
select tests.assert(
  not exists (select 1 from public.cosmetic_items where rarity = 'holy' and is_active and representation = 'literal' and holy_subtype <> 'artefato'),
  'obras e sinais santos são representações simbólicas (sem personificação)');
select tests.assert_raises(
  $$update public.cosmetic_items set shop_eligible = true where id = 'holy_mana_do_deserto'$$,
  '%cosmetic_items_holy_not_for_sale%', 'banco recusa colocar item santo à venda');
select tests.assert((select bool_and(not is_premium_cosmetic) from public.cosmetic_items where series = 'oficial-v2'), 'nenhum item oficial é Premium');
select tests.assert(
  (select count(distinct rarity) from public.cosmetic_items where slot = 'outfit' and is_active) >= 3
  and (select count(distinct slot) from public.cosmetic_items where rarity = 'common' and is_active) >= 4,
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
  (select count(*) from unnest(array['tunic-linen','tunic-joseph','cloak-elijah','cloak-succession','cloak-elijah-prophets','scroll-isaiah','crown-wisdom','frame-complete','bg-sinai','bg-bethlehem','sling-david','harp-psalmist','staff-moses','sandals-desert','sandals-leather','belt-rope']) x
   where exists (select 1 from public.cosmetic_items i where i.id = x and i.is_active)) = 16,
  'IDs com histórico (v1–v3 e peças iniciais) preservados e ativos');
select tests.assert(
  (select count(*) from public.collection_items where collection_id in ('works-father','works-son','works-spirit','works-triune')) = 22,
  'coleções das obras do Pai, do Filho, do Espírito Santo e do Deus Triúno reúnem os 22 itens santos');
select tests.assert((select count(*) from public.collection_items where collection_id = 'legendary-library') = 66, 'Biblioteca dos Lendários com 66 itens');
select tests.assert_raises(
  $$insert into public.cosmetic_items (id, name, category, slot, rarity, asset_manifest_key) values ('teste-mitico', 'X', 'x', 'outfit', 'mythic', 'x')$$,
  '%cosmetic_items_rarity_fkey%', 'raridade inexistente é recusada pelo banco');
select tests.assert_raises(
  $$insert into public.cosmetic_items (id, name, category, slot, rarity, asset_manifest_key, book_code) values ('teste-lend-2', 'X', 'x', 'outfit', 'legendary', 'x', 'RUT')$$,
  '%cosmetic_items_one_legendary_per_book%', 'um livro não pode ter dois lendários ativos');

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

-- lendário por livro completo (Rute: 4 capítulos) + épico de capítulo (Rute 2 e 3)
select tests.ev8('CHAPTER_COMPLETED', 'chapter:RUT.' || n, jsonb_build_object('book', 'RUT', 'chapter', n)) from generate_series(1, 3) n;
select tests.assert(not tests.owns8('book_rut'), 'livro incompleto não concede o lendário');
select tests.assert(tests.owns8('epic_cajado_de_boaz') and tests.owns8('epic_capa_de_rute'), 'capítulos de Rute 2 e 3 concedem os épicos oficiais');
select tests.assert(tests.ev8('CHAPTER_COMPLETED', 'chapter:RUT.4', '{"book":"RUT","chapter":4}') -> 'granted' = '["book_rut"]'::jsonb, 'concluir todos os capítulos de Rute concede só o lendário de Rute');
select tests.assert((select count(*) from public.user_items where user_id = 'a8888888-0000-0000-0000-000000000008' and item_id = 'book_rut') = 1, 'lendário concedido uma única vez');
select tests.assert((tests.ev8('BOOK_COMPLETED', 'book:RUT', '{"book":"RUT"}') -> 'granted') = '[]'::jsonb, 'BOOK_COMPLETED depois dos capítulos não duplica o lendário');
select tests.assert(not tests.owns8('legendary-rut'), 'ID do rascunho (legendary-rut) não é concedido');

-- itens de missão e marcos santos não vêm da leitura
select tests.ev8('CHAPTER_COMPLETED', 'chapter:ACT.2', '{"book":"ACT","chapter":2}');
select tests.ev8('CHAPTER_COMPLETED', 'chapter:EXO.16', '{"book":"EXO","chapter":16}');
select tests.assert(not tests.owns8('holy_chamas_de_pentecostes') and not tests.owns8('holy_mana_do_deserto'), 'ler a passagem não concede item santo (marco curado validado pelo servidor)');
select tests.assert(
  (select count(*) from public.user_items ui join public.item_unlock_rules r on r.item_id = ui.item_id and r.rule_type = 'mission_pool'
   where ui.user_id = 'a8888888-0000-0000-0000-000000000008') = 0,
  'nenhum item de missão (mission_pool) concedido automaticamente');

-- relíquia santa: exibida no Santuário, nunca equipada (concessão isolada de teste)
insert into public.user_items (user_id, item_id, source_event_id) values ('a8888888-0000-0000-0000-000000000008', 'holy_mana_do_deserto', 'test:fixture');
begin;
select set_config('request.jwt.claim.sub', 'a8888888-0000-0000-0000-000000000008', true);
set local role authenticated;
select tests.assert((select count(*) from public.user_items where item_id = 'holy_mana_do_deserto') = 1, 'relíquia aparece no inventário do dono');
select tests.assert_raises($$select public.equip_item((public.get_wardrobe() ->> 'activeLoadoutId')::uuid, 'holy_mana_do_deserto')$$, 'item_not_equippable', 'relíquia não pode ser equipada');
select tests.assert_raises(
  $$select public.save_wardrobe((public.get_wardrobe() ->> 'activeLoadoutId')::uuid, '{"outfit":"tunic-linen","hands":"holy_mana_do_deserto"}', null)$$,
  'item_not_equippable', 'relíquia não entra num visual nem por save_wardrobe');
select tests.assert_raises($$select public.equip_item((public.get_wardrobe() ->> 'activeLoadoutId')::uuid, 'book_gen')$$, 'item_not_owned', 'lendário não conquistado não pode ser equipado');
select tests.assert((public.equip_item((public.get_wardrobe() ->> 'activeLoadoutId')::uuid, 'book_rut') -> 'loadouts' -> 0 -> 'equipment' ->> 'back') = 'book_rut', 'lendário conquistado é equipado no slot oficial');
select tests.assert((public.equip_item((public.get_wardrobe() ->> 'activeLoadoutId')::uuid, 'legendary-rut') -> 'loadouts' -> 0 -> 'equipment' ->> 'back') = 'book_rut', 'equipar pelo ID antigo resolve o alias');
select tests.assert((public.equip_item((public.get_wardrobe() ->> 'activeLoadoutId')::uuid, 'epic_cajado_de_boaz') -> 'loadouts' -> 0 -> 'equipment' ->> 'hands') = 'epic_cajado_de_boaz', 'épico oficial equipado');
select tests.assert((select count(*) from public.rarities) >= 5, 'raridades legíveis pelo app');
select tests.assert((select count(*) from public.cosmetic_item_aliases) > 0, 'aliases legíveis pelo app');
select tests.assert_raises($$update public.rarities set color = '#000000'$$, 'permission denied%', 'cliente não altera raridades');
select tests.assert_raises($$update public.cosmetic_items set rarity = 'holy' where id = 'tunic-linen'$$, 'permission denied%', 'cliente não altera a raridade de um item');
select tests.assert_raises($$insert into public.cosmetic_item_aliases (alias_id, item_id, source) values ('hack-alias', 'book_gen', 'draft')$$, 'permission denied%', 'cliente não cria aliases');
select tests.assert_raises($$insert into public.reward_triggers (id, kind, name) values ('hack-mission', 'mission', 'x')$$, 'permission denied%', 'cliente não cadastra missões');
select tests.assert((select count(*) from public.user_items where user_id <> auth.uid()) = 0, 'inventário de outras contas é invisível');
commit;

-- ---------------------------------------------------------------- contrato das missões e marcos
select tests.assert_raises($$select tests.ev8('MISSION_COMPLETED', 'mission:mission-lost-coin', '{"mission":"mission-lost-coin"}')$$, 'unknown_trigger', 'missão não cadastrada é recusada (sem eventos fictícios)');
select tests.assert_raises($$select tests.ev8('MILESTONE_REACHED', 'milestone:holy_mana_do_deserto', '{"milestone":"holy_mana_do_deserto"}')$$, 'unknown_trigger', 'marco santo não cadastrado é recusado');
select tests.assert_raises($$select tests.ev8('WORLD_COMPLETED', 'world:x', '{"world":"x"}')$$, 'unknown_trigger', 'mundo não cadastrado é recusado');
select tests.assert(
  (select count(*) from public.reward_triggers where kind = 'mission' and is_active and book_code is not null) = 14
  and not exists (select 1 from public.reward_triggers where kind = 'milestone'),
  'missões especiais dos Raros cadastradas (14, incluindo o Manto do Profeta); nenhum marco santo');

-- cenário isolado: um marco curado cadastrado só neste banco de teste
insert into public.reward_triggers (id, kind, name) values ('holy_selo_da_promessa', 'milestone', 'Marco de teste');
select tests.assert(tests.ev8('MILESTONE_REACHED', 'milestone:holy_selo_da_promessa', '{"milestone":"holy_selo_da_promessa"}') -> 'granted' = '["holy_selo_da_promessa"]'::jsonb, 'marco curado concede o item santo correspondente');
select tests.assert((tests.ev8('MILESTONE_REACHED', 'milestone:holy_selo_da_promessa', '{"milestone":"holy_selo_da_promessa"}') ->> 'duplicate')::boolean, 'marco repetido não duplica');
update public.reward_triggers set is_active = false where id = 'holy_selo_da_promessa';
select tests.assert_raises($$select tests.ev8('MILESTONE_REACHED', 'milestone:holy_selo_da_promessa#2', '{"milestone":"holy_selo_da_promessa"}')$$, 'unknown_trigger', 'marco desativado é recusado');
delete from public.reward_triggers where id = 'holy_selo_da_promessa';
