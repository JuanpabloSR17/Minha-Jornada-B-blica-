-- Integração do catálogo oficial: aliases, posse legada, equipamento, backfill e progresso bíblico.

insert into auth.users (id, email) values ('a9999999-0000-0000-0000-000000000009', 'oficial@teste.local');
do $$ begin
  perform set_config('request.jwt.claim.sub', 'a9999999-0000-0000-0000-000000000009', true);
  perform public.claim_profile('oficial_9', 'Oficial');
  perform public.save_avatar(
    '{"bodyId":"body-a","skinToneId":"skin-2","eyesId":"eyes-round","browsId":"brows-soft","expressionId":"expr-smile","beardId":"beard-none","hairStyleId":"hair-curly","hairColorId":"haircolor-black"}',
    '{"outfit":"tunic-linen"}');
end $$;
create function tests.owns9(p_item text) returns boolean language sql as $$
  select exists (select 1 from public.user_items where user_id = 'a9999999-0000-0000-0000-000000000009' and item_id = p_item)
$$;
create function tests.eq9(p_slot text) returns text language sql as $$
  select e.item_id from public.avatar_loadout_equipment e join public.avatar_loadouts l on l.id = e.loadout_id
  where l.user_id = 'a9999999-0000-0000-0000-000000000009' and l.is_active and e.slot = p_slot
$$;

-- ---------------------------------------------------------------- conflitos de ID
select tests.assert_raises($$insert into public.cosmetic_item_aliases (alias_id, item_id, source) values ('book_gen', 'book_gen', 'official')$$, '%check%', 'alias não pode apontar para si mesmo');
select tests.assert_raises($$insert into public.cosmetic_item_aliases (alias_id, item_id, source) values ('alias-fantasma', 'nao-existe', 'official')$$, '%foreign key%', 'alias para item inexistente é recusado');
select tests.assert_raises($$insert into public.cosmetic_item_aliases (alias_id, item_id, source) values ('legendary-gen', 'book_exo', 'draft')$$, '%duplicate key%', 'um ID antigo aponta para um único item');
select tests.assert(
  not exists (select 1 from public.cosmetic_item_aliases a join public.cosmetic_items i on i.id = a.alias_id and i.is_active),
  'nenhum alias colide com um item ativo');
select tests.assert(
  not exists (select 1 from public.cosmetic_item_aliases a join public.cosmetic_items i on i.id = a.item_id where not i.is_active),
  'todo alias aponta para um item ativo');
select tests.assert(private.resolve_item_id('common_sandalias_de_couro') = 'sandals-leather', 'ID oficial de peça inicial resolve para o ID histórico');
select tests.assert(private.resolve_item_id('chapter_gen_37') = 'tunic-joseph', 'ID oficial da Túnica de José resolve para o ID histórico');
select tests.assert(private.resolve_item_id('legendary-gen') = 'book_gen', 'ID do rascunho resolve para o ID oficial');
select tests.assert(private.resolve_item_id('book_gen') = 'book_gen', 'ID canônico resolve para si mesmo');

-- ---------------------------------------------------------------- posse e equipamento do rascunho
-- Simula um usuário que conquistou e equipou itens do rascunho antes da integração oficial.
insert into public.user_items (user_id, item_id, source_event_id) values
  ('a9999999-0000-0000-0000-000000000009', 'legendary-gen', 'legacy:draft'),
  ('a9999999-0000-0000-0000-000000000009', 'legendary-lev', 'legacy:draft'),
  ('a9999999-0000-0000-0000-000000000009', 'purse-coins', 'legacy:draft');
insert into public.avatar_loadout_equipment (loadout_id, slot, item_id)
select l.id, x.slot, x.item from public.avatar_loadouts l,
  (values ('hands', 'legendary-gen'), ('waist', 'purse-coins')) x(slot, item)
where l.user_id = 'a9999999-0000-0000-0000-000000000009' and l.is_active;
update public.avatar_loadout_equipment e set item_id = 'legendary-lev'
from public.avatar_loadouts l where l.id = e.loadout_id and l.user_id = 'a9999999-0000-0000-0000-000000000009' and l.is_active and e.slot = 'outfit';

select tests.assert(private.apply_item_aliases() > 0, 'migração por aliases aplica mudanças');
select tests.assert(tests.owns9('book_gen') and tests.owns9('book_lev'), 'posse do rascunho vira posse do item oficial');
select tests.assert(tests.owns9('legendary-gen') and tests.owns9('legendary-lev') and tests.owns9('purse-coins'), 'posse antiga nunca é apagada');
select tests.assert(tests.eq9('back') = 'book_gen' and tests.eq9('hands') is null, 'lendário que mudou de slot é re-equipado no slot oficial');
select tests.assert(tests.eq9('chest') = 'book_lev' and tests.eq9('outfit') = 'tunic-linen', 'túnica do rascunho que virou peitoral: peitoral equipado e túnica inicial de volta');
select tests.assert(tests.eq9('waist') is null, 'item desativado sem equivalente sai do visual (posse mantida)');
select tests.assert(private.apply_item_aliases() = 0, 'migração por aliases é idempotente');
select tests.assert((select count(*) from public.user_items where user_id = 'a9999999-0000-0000-0000-000000000009' and item_id = 'book_gen') = 1, 'sem posse duplicada');

begin;
select set_config('request.jwt.claim.sub', 'a9999999-0000-0000-0000-000000000009', true);
set local role authenticated;
select tests.assert(
  (public.save_wardrobe((public.get_wardrobe() ->> 'activeLoadoutId')::uuid, public.get_wardrobe() -> 'loadouts' -> 0 -> 'equipment', null) -> 'loadouts' -> 0 -> 'equipment' ->> 'back') = 'book_gen',
  'visual migrado continua válido para salvar');
select tests.assert_raises($$select public.equip_item((public.get_wardrobe() ->> 'activeLoadoutId')::uuid, 'purse-coins')$$, 'item_not_found', 'item desativado não volta a ser equipado');
select tests.assert((public.equip_item((public.get_wardrobe() ->> 'activeLoadoutId')::uuid, 'common_sandalias_de_couro') -> 'loadouts' -> 0 -> 'equipment' ->> 'feet') = 'sandals-leather', 'equipar pelo ID oficial resolve para a peça inicial');
commit;

-- ---------------------------------------------------------------- backfill e progresso bíblico
-- Capítulos concluídos registrados antes do catálogo oficial (Jonas tem 4).
insert into private.domain_events (user_id, event_type, source_event_id, payload)
select 'a9999999-0000-0000-0000-000000000009', 'CHAPTER_COMPLETED', 'chapter:JON.' || n, jsonb_build_object('book', 'JON', 'chapter', n)
from generate_series(1, 4) n;
select tests.assert(not tests.owns9('book_jon'), 'sem avaliação, nada é concedido');
select tests.assert(private.evaluate_rewards('a9999999-0000-0000-0000-000000000009', 'backfill:catalog-v5') @> array['book_jon'], 'backfill concede o lendário de livro já concluído');
select tests.assert(cardinality(private.evaluate_rewards('a9999999-0000-0000-0000-000000000009', 'backfill:catalog-v5')) = 0, 'backfill repetido não concede de novo');
select tests.assert((select count(*) from public.user_items where user_id = 'a9999999-0000-0000-0000-000000000009' and item_id = 'book_jon') = 1, 'backfill sem duplicar');

begin;
select set_config('request.jwt.claim.sub', 'a9999999-0000-0000-0000-000000000009', true);
set local role authenticated;
select tests.assert((public.get_reading_progress() ->> 'chaptersCompleted')::int = 4, 'progresso: 4 capítulos distintos');
select tests.assert((public.get_reading_progress() ->> 'totalChapters')::int = 1189, 'progresso: 1.189 capítulos na Bíblia');
select tests.assert((public.get_reading_progress() ->> 'booksCompleted')::int = 1, 'progresso: 1 livro concluído');
select tests.assert(
  (select (b ->> 'isComplete')::boolean and (b ->> 'legendaryOwned')::boolean and b ->> 'legendaryItemId' = 'book_jon'
   from jsonb_array_elements(public.get_reading_progress() -> 'books') b where b ->> 'book' = 'JON'),
  'progresso: Jonas concluído com o lendário conquistado');
select tests.assert(jsonb_array_length(public.get_reading_progress() -> 'books') = 66, 'progresso lista os 66 livros');
select tests.assert(
  (select (x ->> 'remaining')::int from jsonb_array_elements(public.get_reading_progress() -> 'rewardsAvailable') x where x ->> 'itemId' = 'book_rut') = 4,
  'recompensas disponíveis mostram quanto falta (Rute: 4 capítulos)');
select tests.assert(
  not exists (select 1 from jsonb_array_elements(public.get_reading_progress() -> 'rewardsAvailable') x where x ->> 'itemId' = 'book_jon'),
  'recompensa já conquistada não aparece como disponível');
select tests.assert(
  not exists (select 1 from jsonb_array_elements(public.get_reading_progress() -> 'rewardsAvailable') x where x ->> 'rule' not in ('chapter_completed', 'book_completed', 'chapters_count')),
  'itens de missão e marcos santos não aparecem como recompensa de leitura');
commit;

begin;
set local role anon;
select tests.assert_raises($$select public.get_reading_progress()$$, 'permission denied%', 'anon não lê progresso');
commit;
