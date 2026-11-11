-- Testes do Marco 2: guarda-roupa, visuais salvos, planos, motor de recompensas,
-- evolução de itens, coleções e perfil público. Usa as funções de tests.* do arquivo 10.

insert into auth.users (id, email) values
  ('a3333333-0000-0000-0000-000000000003', 'free@teste.local'),
  ('a4444444-0000-0000-0000-000000000004', 'premium@teste.local'),
  ('a6666666-0000-0000-0000-000000000006', 'leitor@teste.local');

-- cria perfil + avatar para cada um
do $$
declare u record;
begin
  for u in select * from (values
    ('a3333333-0000-0000-0000-000000000003'::uuid, 'gratis_3'),
    ('a4444444-0000-0000-0000-000000000004'::uuid, 'premium_4'),
    ('a6666666-0000-0000-0000-000000000006'::uuid, 'leitor_6')) v(id, name)
  loop
    perform set_config('request.jwt.claim.sub', u.id::text, true);
    perform public.claim_profile(u.name, initcap(u.name));
    perform public.save_avatar(
      '{"bodyId":"body-b","skinToneId":"skin-3","eyesId":"eyes-almond","browsId":"brows-soft","expressionId":"expr-smile","beardId":"beard-none","hairStyleId":"hair-short","hairColorId":"haircolor-darkbrown"}',
      '{"outfit":"tunic-linen","feet":"sandals-leather","background":"bg-parchment"}');
  end loop;
end $$;

create table tests.ids (k text primary key, v uuid);
grant select, insert, update on tests.ids to authenticated;

-- ===========================================================================
-- Plano gratuito: até 3 visuais
-- ===========================================================================
begin;
select set_config('request.jwt.claim.sub', 'a3333333-0000-0000-0000-000000000003', true);
set local role authenticated;
select tests.assert((public.get_wardrobe() -> 'plan' ->> 'loadoutLimit')::int = 3, 'gratuito: limite de 3 visuais');
select tests.assert((public.get_wardrobe() -> 'plan' ->> 'tier') = 'free', 'gratuito: tier free');
select tests.assert(jsonb_array_length(public.get_wardrobe() -> 'loadouts') = 1, 'começa com 1 visual');
select tests.assert_raises($$select public.create_loadout('   ')$$, 'invalid_name', 'nome vazio rejeitado');
select tests.assert(jsonb_array_length(public.create_loadout('Viagem') -> 'loadouts') = 2, 'cria 2º visual (copia o ativo)');
select tests.assert(jsonb_array_length(public.create_loadout('Festa') -> 'loadouts') = 3, 'cria 3º visual');
select tests.assert_raises($$select public.create_loadout('Quarto')$$, 'loadout_limit_reached', 'gratuito não cria 4º visual');
insert into tests.ids select 'free_second', (l ->> 'id')::uuid from jsonb_array_elements(public.get_wardrobe() -> 'loadouts') l where l ->> 'name' = 'Viagem';
insert into tests.ids select 'free_first', (public.get_wardrobe() ->> 'activeLoadoutId')::uuid;

-- equipar / remover
select tests.assert(
  (select l -> 'equipment' ->> 'back' from jsonb_array_elements(public.equip_item((select v from tests.ids where k='free_second'), 'cloak-wool') -> 'loadouts') l where l ->> 'name' = 'Viagem') = 'cloak-wool',
  'equipa manto em visual não ativo');
select tests.assert(
  (select (l ->> 'version')::int from jsonb_array_elements(public.get_wardrobe() -> 'loadouts') l where l ->> 'name' = 'Viagem') = 2,
  'equipar incrementa a versão do visual');
select tests.assert(
  (select l -> 'equipment' ? 'back' from jsonb_array_elements(public.unequip_slot((select v from tests.ids where k='free_second'), 'back', 2) -> 'loadouts') l where l ->> 'name' = 'Viagem') = false,
  'remove o manto');
select tests.assert_raises($$select public.unequip_slot((select v from tests.ids where k='free_second'), 'outfit')$$, 'outfit_required', 'não remove a túnica');
select tests.assert_raises($$select public.equip_item((select v from tests.ids where k='free_second'), 'tunic-joseph')$$, 'item_not_owned', 'não equipa item bloqueado');
select tests.assert_raises($$select public.equip_item((select v from tests.ids where k='free_second'), 'nao-existe')$$, 'item_not_found', 'não equipa item inexistente');
select tests.assert_raises(
  $$select public.save_wardrobe((select v from tests.ids where k='free_second'), '{"outfit":"tunic-indigo"}', 1)$$,
  'version_conflict', 'salvar com versão antiga do visual é rejeitado');

-- salvar visual + aparência atomicamente
select tests.assert(
  (public.save_wardrobe((select v from tests.ids where k='free_second'), '{"outfit":"tunic-indigo","back":"cloak-desert"}', 3,
     '{"hairStyleId":"hair-curly"}', (public.get_wardrobe() ->> 'appearanceVersion')::int) -> 'appearance' ->> 'hairStyleId') = 'hair-curly',
  'salva visual e cabelo na mesma operação');
select tests.assert_raises(
  $$select public.save_wardrobe((select v from tests.ids where k='free_second'), '{"outfit":"tunic-indigo"}', 4, '{"hairStyleId":"hair-short"}', 1)$$,
  'version_conflict', 'aparência com versão antiga é rejeitada');
select tests.assert(
  (select l -> 'equipment' ->> 'back' from jsonb_array_elements(public.get_wardrobe() -> 'loadouts') l where l ->> 'name' = 'Viagem') = 'cloak-desert',
  'falha não alterou o visual');

-- ativar, renomear, excluir
select tests.assert((public.activate_loadout((select v from tests.ids where k='free_second')) ->> 'activeLoadoutId')::uuid = (select v from tests.ids where k='free_second'), 'ativa outro visual');
select tests.assert((public.get_my_avatar() -> 'equipment' ->> 'outfit') = 'tunic-indigo', 'avatar exibido segue o visual ativo');
select tests.assert((select count(*) from public.avatar_loadouts where is_active) = 1, 'só um visual ativo');
select tests.assert(
  (select l ->> 'name' from jsonb_array_elements(public.rename_loadout((select v from tests.ids where k='free_second'), 'Peregrino') -> 'loadouts') l where (l ->> 'id')::uuid = (select v from tests.ids where k='free_second')) = 'Peregrino',
  'renomeia visual');
select tests.assert(jsonb_array_length(public.delete_loadout((select v from tests.ids where k='free_second')) -> 'loadouts') = 2, 'exclui visual');
select tests.assert(public.get_wardrobe() ->> 'activeLoadoutId' is not null, 'excluir o ativo ativa outro');
commit;

-- isolamento entre usuários
begin;
select set_config('request.jwt.claim.sub', 'a4444444-0000-0000-0000-000000000004', true);
set local role authenticated;
select tests.assert_raises($$select public.equip_item((select v from tests.ids where k='free_first'), 'cloak-wool')$$, 'loadout_not_found', 'não edita visual de outro usuário');
select tests.assert_raises($$select public.delete_loadout((select v from tests.ids where k='free_first'))$$, 'loadout_not_found', 'não exclui visual de outro usuário');
select tests.assert((select count(*) from public.avatar_loadouts) = 1, 'só vê os próprios visuais');
select tests.assert((select count(*) from public.user_entitlements) = 0, 'não vê planos de outros');
select tests.assert_raises($$insert into public.user_entitlements (user_id, plan) values (auth.uid(), 'premium')$$, 'permission denied%', 'cliente não se declara Premium');
select tests.assert_raises($$update public.user_entitlements set plan = 'premium'$$, 'permission denied%', 'cliente não altera plano');
select tests.assert_raises($$update public.cosmetic_items set rarity = 'legendary'$$, 'permission denied%', 'cliente não altera raridade');
select tests.assert_raises($$insert into public.reward_events (user_id, rule_id, item_id, source_event_id) select auth.uid(), id, item_id, 'x' from public.item_unlock_rules limit 1$$, 'permission denied%', 'cliente não insere recompensas');
select tests.assert_raises($$select private.record_event(auth.uid(), 'CHAPTER_COMPLETED', 'x', '{"book":"GEN","chapter":37}')$$, 'permission denied%', 'cliente não registra eventos de leitura');
commit;

-- ===========================================================================
-- Premium (estado vindo do servidor/webhook): até 10 visuais; ao expirar, nada é apagado
-- ===========================================================================
insert into public.user_entitlements (user_id, plan, status, current_period_end, provider)
values ('a4444444-0000-0000-0000-000000000004', 'premium', 'active', now() + interval '30 days', 'teste');

begin;
select set_config('request.jwt.claim.sub', 'a4444444-0000-0000-0000-000000000004', true);
set local role authenticated;
select tests.assert((public.get_wardrobe() -> 'plan' ->> 'loadoutLimit')::int = 10, 'premium: limite de 10');
select public.create_loadout('Visual ' || g) from generate_series(2, 10) g;
select tests.assert(jsonb_array_length(public.get_wardrobe() -> 'loadouts') = 10, 'premium cria 10 visuais');
select tests.assert_raises($$select public.create_loadout('Onze')$$, 'loadout_limit_reached', 'premium não cria o 11º');
commit;

update public.user_entitlements set status = 'canceled', current_period_end = now() - interval '1 day'
where user_id = 'a4444444-0000-0000-0000-000000000004';

begin;
select set_config('request.jwt.claim.sub', 'a4444444-0000-0000-0000-000000000004', true);
set local role authenticated;
select tests.assert((public.get_wardrobe() -> 'plan' ->> 'loadoutLimit')::int = 3, 'assinatura encerrada volta ao limite gratuito');
select tests.assert(jsonb_array_length(public.get_wardrobe() -> 'loadouts') = 10, 'nenhum visual é apagado ao cancelar');
select tests.assert((select count(*) from jsonb_array_elements(public.get_wardrobe() -> 'loadouts') l where (l ->> 'locked')::boolean) = 7, 'visuais 4 a 10 ficam só leitura');
insert into tests.ids select 'locked_one', (l ->> 'id')::uuid from jsonb_array_elements(public.get_wardrobe() -> 'loadouts') l where (l ->> 'position')::int = 5;
select tests.assert_raises($$select public.activate_loadout((select v from tests.ids where k='locked_one'))$$, 'loadout_locked', 'não ativa visual excedente');
select tests.assert_raises($$select public.rename_loadout((select v from tests.ids where k='locked_one'), 'X')$$, 'loadout_locked', 'não renomeia visual excedente');
select tests.assert_raises($$select public.equip_item((select v from tests.ids where k='locked_one'), 'cloak-wool')$$, 'loadout_locked', 'não edita visual excedente');
select tests.assert_raises($$select public.create_loadout('Novo')$$, 'loadout_limit_reached', 'não cria novos acima do limite gratuito');
select tests.assert(jsonb_array_length(public.delete_loadout((select v from tests.ids where k='locked_one')) -> 'loadouts') = 9, 'pode excluir visual excedente para liberar espaço');
commit;

-- past_due ainda dentro do período conta como Premium
update public.user_entitlements set status = 'past_due', current_period_end = now() + interval '2 days'
where user_id = 'a4444444-0000-0000-0000-000000000004';
select tests.assert(private.loadout_limit('a4444444-0000-0000-0000-000000000004') = 10, 'pagamento pendente dentro do período mantém Premium');

-- ===========================================================================
-- Compatibilidade de corpo
-- ===========================================================================
update public.cosmetic_items set body_compatibility = array['body-a'] where id = 'cloak-wool';
begin;
select set_config('request.jwt.claim.sub', 'a3333333-0000-0000-0000-000000000003', true);
set local role authenticated;
select tests.assert_raises($$select public.equip_item((public.get_wardrobe() ->> 'activeLoadoutId')::uuid, 'cloak-wool')$$, 'item_incompatible_body', 'peça sem versão para o corpo é recusada');
commit;
update public.cosmetic_items set body_compatibility = null where id = 'cloak-wool';

-- ===========================================================================
-- Motor de recompensas (cenários isolados de teste; leitura real chega no Marco 3)
-- ===========================================================================
create function tests.ev(p_type text, p_source text, p_payload jsonb) returns jsonb language sql as $$
  select private.record_event('a6666666-0000-0000-0000-000000000006', p_type, p_source, p_payload)
$$;
create function tests.owns(p_item text) returns boolean language sql as $$
  select exists (select 1 from public.user_items where user_id = 'a6666666-0000-0000-0000-000000000006' and item_id = p_item)
$$;

select tests.assert_raises($$select tests.ev('CHAPTER_COMPLETED', 'chapter:GEN.51', '{"book":"GEN","chapter":51}')$$, 'invalid_event_payload', 'capítulo inexistente rejeitado (Gênesis tem 50)');
select tests.assert_raises($$select tests.ev('CHAPTER_COMPLETED', 'chapter:XYZ.1', '{"book":"XYZ","chapter":1}')$$, 'invalid_event_payload', 'livro inexistente rejeitado');
select tests.assert_raises($$select tests.ev('CHAPTER_COMPLETED', 'chapter:GEN.1', '{"book":"GEN","chapter":"1"}')$$, 'invalid_event_payload', 'capítulo como texto rejeitado');
select tests.assert_raises($$select tests.ev('XP_HACK', 'x', '{}')$$, 'invalid_event_type', 'tipo de evento desconhecido rejeitado');
select tests.assert_raises($$select tests.ev('COLLECTION_COMPLETED', 'collection:moses', '{"collection":"moses"}')$$, 'collection_incomplete', 'coleção não pode ser declarada concluída sem os itens');

select tests.assert(tests.ev('CHAPTER_COMPLETED', 'chapter:GEN.37', '{"book":"GEN","chapter":37}') -> 'granted' = '["tunic-joseph"]'::jsonb, 'Gênesis 37 concede a Túnica de José');
select tests.assert((tests.ev('CHAPTER_COMPLETED', 'chapter:GEN.37', '{"book":"GEN","chapter":37}') ->> 'duplicate')::boolean, 'mesmo evento repetido é idempotente');
select tests.assert(tests.ev('CHAPTER_COMPLETED', 'chapter:GEN.37#releitura', '{"book":"GEN","chapter":37}') -> 'granted' = '[]'::jsonb, 'releitura não concede o item de novo');
select tests.assert((select count(*) from public.reward_events where user_id = 'a6666666-0000-0000-0000-000000000006') = 1, 'uma única recompensa registrada');
select tests.assert((select count(*) from public.user_items where user_id = 'a6666666-0000-0000-0000-000000000006' and item_id = 'tunic-joseph') = 1, 'item não duplicado no inventário');

-- evolução: 2 Reis 2 antes de ter o Manto de Elias não concede; depois concede os dois
select tests.assert(tests.ev('CHAPTER_COMPLETED', 'chapter:2KI.2', '{"book":"2KI","chapter":2}') -> 'granted' = '[]'::jsonb, 'Manto da Sucessão exige o Manto de Elias');
select tests.assert(tests.ev('CHAPTER_COMPLETED', 'chapter:1KI.19', '{"book":"1KI","chapter":19}') -> 'granted' = '["cloak-elijah", "cloak-succession"]'::jsonb, '1 Reis 19 concede Elias e libera a Sucessão pendente');
select tests.assert(tests.owns('cloak-elijah') and tests.owns('cloak-succession'), 'evolução mantém a versão original');
select tests.assert((select variant_of from public.cosmetic_items where id = 'cloak-succession') = 'cloak-elijah', 'Sucessão é variante do Manto de Elias');

-- contagem de capítulos distintos: 29 salmos não bastam, o 30º concede a harpa
select tests.ev('CHAPTER_COMPLETED', 'chapter:PSA.' || n, jsonb_build_object('book', 'PSA', 'chapter', n)) from generate_series(1, 29) n;
select tests.assert(not tests.owns('harp-psalmist'), '29 salmos ainda não concedem a harpa');
select tests.ev('CHAPTER_COMPLETED', 'chapter:PSA.1#de-novo', '{"book":"PSA","chapter":1}');
select tests.assert(not tests.owns('harp-psalmist'), 'reler um salmo não conta como novo');
select tests.assert(tests.ev('CHAPTER_COMPLETED', 'chapter:PSA.30', '{"book":"PSA","chapter":30}') -> 'granted' = '["harp-psalmist"]'::jsonb, 'o 30º salmo distinto concede a harpa');

-- livro completo derivado dos capítulos + coleção dos profetas
select tests.ev('CHAPTER_COMPLETED', 'chapter:ISA.' || n, jsonb_build_object('book', 'ISA', 'chapter', n)) from generate_series(1, 65) n;
select tests.assert(not tests.owns('scroll-isaiah'), '65 de 66 capítulos de Isaías não concluem o livro');
select tests.assert(tests.ev('CHAPTER_COMPLETED', 'chapter:ISA.66', '{"book":"ISA","chapter":66}') -> 'granted' = '["scroll-isaiah", "cloak-elijah-prophets"]'::jsonb, 'Isaías completo concede o rolo e completa a Coleção dos Profetas');
select tests.assert(exists (select 1 from private.domain_events where user_id = 'a6666666-0000-0000-0000-000000000006' and event_type = 'COLLECTION_COMPLETED' and source_event_id = 'collection:prophets'), 'conclusão de coleção registrada como evento');
select tests.assert_raises($$select tests.ev('BOOK_COMPLETED', 'book:PRO', '{"book":"PRO"}')$$, 'book_incomplete', 'BOOK_COMPLETED sem todos os capítulos é recusado');
select tests.ev('CHAPTER_COMPLETED', 'chapter:PRO.' || n, jsonb_build_object('book', 'PRO', 'chapter', n)) from generate_series(1, 30) n;
select tests.assert(not tests.owns('crown-wisdom'), '30 de 31 capítulos não concedem o lendário de Provérbios');
select tests.assert(tests.ev('CHAPTER_COMPLETED', 'chapter:PRO.31', '{"book":"PRO","chapter":31}') -> 'granted' ? 'crown-wisdom', 'o 31º capítulo concede a Coroa da Sabedoria (lendário de Provérbios)');
select tests.assert((tests.ev('BOOK_COMPLETED', 'book:PRO', '{"book":"PRO"}') -> 'granted') = '[]'::jsonb, 'BOOK_COMPLETED aceito depois dos capítulos, sem duplicar o lendário');
select tests.assert(tests.ev('READING_STREAK_REACHED', 'streak:7', '{"days":7}') -> 'granted' = '[]'::jsonb, 'evento de sequência aceito (sem regra associada ainda)');

-- o leitor vê e equipa o que conquistou
begin;
select set_config('request.jwt.claim.sub', 'a6666666-0000-0000-0000-000000000006', true);
set local role authenticated;
select tests.assert((select count(*) from public.reward_events) = (select count(*) from public.user_items ui where ui.source_event_id like 'reward:%'), 'leitor vê as próprias recompensas (uma por item conquistado)');
select tests.assert((public.equip_item((public.get_wardrobe() ->> 'activeLoadoutId')::uuid, 'tunic-joseph') -> 'loadouts' -> 0 -> 'equipment' ->> 'outfit') = 'tunic-joseph', 'equipa a Túnica de José conquistada');
select tests.assert((public.equip_item((public.get_wardrobe() ->> 'activeLoadoutId')::uuid, 'cloak-succession') -> 'loadouts' -> 0 -> 'equipment' ->> 'back') = 'cloak-succession', 'escolhe a aparência evoluída');
select tests.assert((public.equip_item((public.get_wardrobe() ->> 'activeLoadoutId')::uuid, 'cloak-elijah') -> 'loadouts' -> 0 -> 'equipment' ->> 'back') = 'cloak-elijah', 'pode voltar à aparência original');
select tests.assert(
  (select (c ->> 'completed')::boolean and (c ->> 'rewardOwned')::boolean from jsonb_array_elements(public.get_collections()) c where c ->> 'id' = 'prophets'),
  'coleção dos profetas aparece concluída com recompensa');
select tests.assert(
  (select (c ->> 'completed')::boolean from jsonb_array_elements(public.get_collections()) c where c ->> 'id' = 'moses') = false,
  'coleção de Moisés aparece incompleta');
commit;

begin;
select set_config('request.jwt.claim.sub', 'a3333333-0000-0000-0000-000000000003', true);
set local role authenticated;
select tests.assert((select count(*) from public.reward_events) = 0, 'outro usuário não vê recompensas alheias');
select tests.assert(
  (select count(*) from jsonb_array_elements(public.get_collections()) c where (c ->> 'completed')::boolean) = 0,
  'progresso de coleção é individual');
commit;

-- ===========================================================================
-- Perfil público
-- ===========================================================================
begin;
select set_config('request.jwt.claim.sub', 'a6666666-0000-0000-0000-000000000006', true);
set local role authenticated;
select tests.assert((public.get_public_avatar('gratis_3') ->> 'visible')::boolean = false, 'perfil privado não mostra o avatar');
select tests.assert(public.get_public_avatar('gratis_3') ? 'appearance' = false, 'perfil privado não vaza aparência');
select tests.assert(public.get_public_avatar('ninguem') is null, 'username inexistente retorna nulo');
select tests.assert((public.get_public_avatar('leitor_6') ->> 'isSelf')::boolean, 'dono vê o próprio perfil');
commit;

begin;
select set_config('request.jwt.claim.sub', 'a3333333-0000-0000-0000-000000000003', true);
set local role authenticated;
select tests.assert_raises($$select public.set_privacy_mode('todos')$$, 'invalid_privacy_mode', 'modo de privacidade inválido rejeitado');
select tests.assert((public.set_privacy_mode('public')).privacy_mode = 'public', 'usuário torna o perfil público');
commit;

begin;
select set_config('request.jwt.claim.sub', 'a6666666-0000-0000-0000-000000000006', true);
set local role authenticated;
select tests.assert((public.get_public_avatar('gratis_3') ->> 'visible')::boolean, 'perfil público mostra o avatar');
select tests.assert(
  (select array_agg(k order by k) from jsonb_object_keys(public.get_public_avatar('gratis_3')) k) = array['appearance', 'displayName', 'equipment', 'isSelf', 'username', 'visible'],
  'perfil público só expõe campos consentidos (sem id, e-mail ou leitura)');
commit;
