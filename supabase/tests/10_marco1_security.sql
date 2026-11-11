-- Testes do Marco 1: RLS, privilégios e regras das RPCs.
-- Executados por supabase/tests/run-local.sh num banco descartável.

create schema tests;
grant usage on schema tests to anon, authenticated;

-- Executa p_sql e exige que falhe com mensagem que case com p_pattern (LIKE).
create function tests.assert_raises(p_sql text, p_pattern text, p_label text)
returns void language plpgsql as $$
begin
  begin
    execute p_sql;
  exception when others then
    if sqlerrm like p_pattern then
      raise notice 'ok  %', p_label;
      return;
    end if;
    raise exception 'FALHOU %: esperado erro "%", veio "%"', p_label, p_pattern, sqlerrm;
  end;
  raise exception 'FALHOU %: esperado erro "%", mas executou sem erro', p_label, p_pattern;
end;
$$;

create function tests.assert(p_cond boolean, p_label text)
returns void language plpgsql as $$
begin
  if p_cond is distinct from true then
    raise exception 'FALHOU %', p_label;
  end if;
  raise notice 'ok  %', p_label;
end;
$$;

grant execute on all functions in schema tests to anon, authenticated;

insert into auth.users (id, email) values
  ('11111111-1111-1111-1111-111111111111', 'u1@teste.local'),
  ('22222222-2222-2222-2222-222222222222', 'u2@teste.local');

-- Item NÃO inicial, usado para testar posse.
insert into public.cosmetic_items (id, name, category, slot, asset_manifest_key, is_starter)
values ('test-locked-robe', 'Túnica de Teste', 'tunic', 'outfit', 'outfit/test-locked-robe', false);

-- Aparência padrão reutilizada
create table tests.fixtures (k text primary key, v jsonb);
insert into tests.fixtures values
  ('appearance', '{"bodyId":"body-b","skinToneId":"skin-3","eyesId":"eyes-round","browsId":"brows-soft","expressionId":"expr-smile","beardId":"beard-none","hairStyleId":"hair-short","hairColorId":"haircolor-darkbrown"}'),
  ('equipment', '{"outfit":"tunic-linen","feet":"sandals-leather","waist":"belt-rope","background":"bg-parchment"}');
grant select on tests.fixtures to authenticated;

-- ===========================================================================
-- Visitante (anon)
-- ===========================================================================
begin;
set local role anon;
select tests.assert((select count(*) from public.cosmetic_items) >= 35, 'anon lê catálogo cosmético');
select tests.assert((select count(*) from public.avatar_appearance_options) = 51, 'anon lê opções de aparência (51)');
select tests.assert_raises('select * from public.profiles', 'permission denied%', 'anon não lê perfis');
select tests.assert_raises('select * from public.user_items', 'permission denied%', 'anon não lê inventários');
select tests.assert_raises($$select public.claim_profile('anon_user','Anon')$$, 'permission denied%', 'anon não cria perfil');
select tests.assert_raises($$select public.save_avatar('{}','{}')$$, 'permission denied%', 'anon não salva avatar');
select tests.assert_raises($$select private.grant_starter_items(gen_random_uuid())$$, 'permission denied%', 'anon não acessa schema private');
commit;

-- ===========================================================================
-- Usuário 1: identidade
-- ===========================================================================
begin;
select set_config('request.jwt.claim.sub', '11111111-1111-1111-1111-111111111111', true);
set local role authenticated;

select tests.assert_raises(
  $$select public.save_avatar((select v from tests.fixtures where k='appearance'), (select v from tests.fixtures where k='equipment'))$$,
  'profile_required', 'avatar exige perfil');
select tests.assert_raises($$select public.claim_profile('ab','João')$$, 'username_invalid', 'username curto rejeitado');
select tests.assert_raises($$select public.claim_profile('joão!','João')$$, 'username_invalid', 'username com caracteres inválidos rejeitado');
select tests.assert_raises($$select public.claim_profile('Admin','João')$$, 'username_reserved', 'username reservado rejeitado');
select tests.assert_raises($$select public.claim_profile('joao_1','  ')$$, 'display_name_invalid', 'nome de exibição vazio rejeitado');

select tests.assert((public.claim_profile('  Joao_1 ', '  João   da   Silva ')).username = 'joao_1', 'username normalizado para minúsculas');
select tests.assert((select display_name from public.profiles) = 'João da Silva', 'nome de exibição normalizado');
select tests.assert((select privacy_mode from public.profiles) = 'private', 'perfil nasce privado');
select tests.assert(public.is_username_available('joao_1'), 'próprio username aparece disponível para o dono');
-- editar identidade de novo é permitido (voltar no onboarding)
select tests.assert((public.claim_profile('joao_1', 'João')).display_name = 'João', 'perfil pode ser atualizado pelo dono');

-- escrita direta proibida
select tests.assert_raises($$update public.profiles set privacy_mode = 'public'$$, 'permission denied%', 'update direto em profiles bloqueado');
select tests.assert_raises($$insert into public.user_items (user_id,item_id,source_event_id) values (auth.uid(),'test-locked-robe','hack')$$, 'permission denied%', 'insert direto em user_items bloqueado');
select tests.assert_raises($$insert into public.cosmetic_items (id,name,category,slot,asset_manifest_key) values ('hack-item','x','x','outfit','x')$$, 'permission denied%', 'insert no catálogo bloqueado');
select tests.assert_raises($$delete from public.avatar_appearance_options$$, 'permission denied%', 'delete no catálogo bloqueado');
commit;

-- ===========================================================================
-- Usuário 2: unicidade de username
-- ===========================================================================
begin;
select set_config('request.jwt.claim.sub', '22222222-2222-2222-2222-222222222222', true);
set local role authenticated;
select tests.assert(not public.is_username_available('JOAO_1'), 'username de outro aparece indisponível (case-insensitive)');
select tests.assert_raises($$select public.claim_profile('JOAO_1','Outro')$$, 'username_taken', 'username duplicado rejeitado');
select tests.assert((public.claim_profile('maria_2', 'Maria')).username = 'maria_2', 'usuário 2 cria perfil');
commit;

-- ===========================================================================
-- Usuário 1: salvar avatar
-- ===========================================================================
begin;
select set_config('request.jwt.claim.sub', '11111111-1111-1111-1111-111111111111', true);
set local role authenticated;

select tests.assert(
  (public.save_avatar(
     (select v from tests.fixtures where k='appearance'),
     (select v from tests.fixtures where k='equipment'))
  ) ->> 'version' = '1',
  'primeiro salvamento cria versão 1');

select tests.assert((select count(*) from public.user_items) = (select count(*) from public.cosmetic_items where is_starter), 'itens iniciais concedidos pelo servidor');
select tests.assert((select avatar_onboarding_completed_at is not null from public.profiles), 'onboarding do avatar marcado');
select tests.assert((public.get_my_avatar() -> 'equipment' ->> 'outfit') = 'tunic-linen', 'get_my_avatar devolve equipamento salvo');
select tests.assert((public.get_my_avatar() -> 'appearance' ->> 'hairStyleId') = 'hair-short', 'get_my_avatar devolve aparência salva');

-- aparência inválida
select tests.assert_raises(
  $$select public.save_avatar((select v from tests.fixtures where k='appearance') || '{"skinToneId":"hair-short"}', (select v from tests.fixtures where k='equipment'), 1)$$,
  'invalid_appearance', 'opção de outra categoria rejeitada');
select tests.assert_raises(
  $$select public.save_avatar((select v from tests.fixtures where k='appearance') || '{"eyesId":"inexistente"}', (select v from tests.fixtures where k='equipment'), 1)$$,
  'invalid_appearance', 'opção inexistente rejeitada');
select tests.assert_raises(
  $$select public.save_avatar((select v from tests.fixtures where k='appearance') - 'beardId', (select v from tests.fixtures where k='equipment'), 1)$$,
  'invalid_appearance', 'aparência incompleta rejeitada');

-- equipamento inválido
select tests.assert_raises(
  $$select public.save_avatar((select v from tests.fixtures where k='appearance'), '{"outfit":"test-locked-robe"}', 1)$$,
  'item_not_owned', 'item bloqueado não pode ser equipado');
select tests.assert_raises(
  $$select public.save_avatar((select v from tests.fixtures where k='appearance'), '{"outfit":"cloak-wool"}', 1)$$,
  'item_slot_mismatch', 'item no slot errado rejeitado');
select tests.assert_raises(
  $$select public.save_avatar((select v from tests.fixtures where k='appearance'), '{"outfit":"tunic-linen","wings":"tunic-olive"}', 1)$$,
  'invalid_slot', 'slot desconhecido rejeitado');
select tests.assert_raises(
  $$select public.save_avatar((select v from tests.fixtures where k='appearance'), '{"feet":"sandals-leather"}', 1)$$,
  'outfit_required', 'túnica obrigatória');
select tests.assert_raises(
  $$select public.save_avatar((select v from tests.fixtures where k='appearance'), '{"outfit":"nao-existe"}', 1)$$,
  'item_not_found', 'item inexistente rejeitado');

-- nada mudou depois das falhas
select tests.assert((public.get_my_avatar() ->> 'version') = '1', 'falhas não alteram a versão');
select tests.assert((public.get_my_avatar() -> 'equipment' ->> 'feet') = 'sandals-leather', 'falhas não alteram o equipamento');

-- edição com versão correta
select tests.assert(
  (public.save_avatar(
     (select v from tests.fixtures where k='appearance') || '{"hairStyleId":"hair-locs","beardId":"beard-full"}',
     '{"outfit":"tunic-indigo","back":"cloak-night","head":"headwrap-sand"}', 1)
  ) ->> 'version' = '2',
  'edição incrementa versão');
select tests.assert((public.get_my_avatar() -> 'equipment') = '{"outfit":"tunic-indigo","back":"cloak-night","head":"headwrap-sand"}'::jsonb, 'slots removidos ficam vazios');
select tests.assert((select count(*) from public.avatar_loadouts) = 1, 'apenas um visual ativo criado');

-- conflito de versão (outro aparelho salvou antes)
select tests.assert_raises(
  $$select public.save_avatar((select v from tests.fixtures where k='appearance'), (select v from tests.fixtures where k='equipment'), 1)$$,
  'version_conflict', 'versão desatualizada rejeitada');

-- itens iniciais não duplicam
select public.save_avatar((select v from tests.fixtures where k='appearance'), (select v from tests.fixtures where k='equipment'), 2);
select tests.assert((select count(*) from public.user_items) = (select count(*) from public.cosmetic_items where is_starter), 'concessão inicial é idempotente');

-- ritmo de leitura
select tests.assert_raises($$select public.set_reading_preferences('daily_goal', 0)$$, 'invalid_goal', 'meta 0 rejeitada');
select tests.assert_raises($$select public.set_reading_preferences('daily_goal', 51)$$, 'invalid_goal', 'meta acima de 50 rejeitada');
select tests.assert_raises($$select public.set_reading_preferences('daily_goal', null)$$, 'invalid_goal', 'meta diária sem número rejeitada');
select tests.assert_raises($$select public.set_reading_preferences('turbo', 3)$$, 'invalid_goal', 'modo desconhecido rejeitado');
select tests.assert((public.set_reading_preferences('daily_goal', 3)).target_chapters_per_day = 3, 'meta de 3 capítulos salva');
select tests.assert((select onboarding_completed_at is not null from public.profiles), 'onboarding concluído');
select tests.assert((public.set_reading_preferences('free', 9)).target_chapters_per_day is null, 'sem meta ignora número');
commit;

-- ===========================================================================
-- Usuário 2: isolamento (RLS)
-- ===========================================================================
begin;
select set_config('request.jwt.claim.sub', '22222222-2222-2222-2222-222222222222', true);
set local role authenticated;
select tests.assert((select count(*) from public.profiles) = 1, 'u2 só vê o próprio perfil');
select tests.assert((select count(*) from public.avatar_appearances) = 0, 'u2 não vê aparência de u1');
select tests.assert((select count(*) from public.user_items) = 0, 'u2 não vê inventário de u1');
select tests.assert((select count(*) from public.avatar_loadouts) = 0, 'u2 não vê visuais de u1');
select tests.assert((select count(*) from public.avatar_loadout_equipment) = 0, 'u2 não vê equipamento de u1');
select tests.assert((select count(*) from public.reading_preferences) = 0, 'u2 não vê preferências de u1');
select tests.assert((public.get_my_avatar() -> 'appearance') = 'null'::jsonb, 'u2 ainda não tem avatar');
select tests.assert((public.set_reading_preferences('free')).plan_mode = 'free', 'u2 define ritmo');
select tests.assert((select onboarding_completed_at is null from public.profiles), 'onboarding de u2 não conclui sem avatar');
commit;

-- ===========================================================================
-- Defesa em profundidade: gatilhos valem mesmo para escrita privilegiada
-- ===========================================================================
select tests.assert_raises(
  $$insert into public.avatar_loadout_equipment (loadout_id, slot, item_id)
    select id, 'hands', 'test-locked-robe' from public.avatar_loadouts limit 1$$,
  'item_slot_mismatch', 'gatilho bloqueia slot errado');
select tests.assert_raises(
  $$insert into public.avatar_loadout_equipment (loadout_id, slot, item_id)
    select id, 'outfit', 'test-locked-robe' from public.avatar_loadouts limit 1 on conflict (loadout_id, slot) do update set item_id = excluded.item_id$$,
  'item_not_owned', 'gatilho bloqueia item não possuído');
select tests.assert_raises(
  $$update public.avatar_appearances set hair_color_id = 'skin-1'$$,
  'invalid_appearance', 'gatilho bloqueia aparência inválida');

-- Item que sai do catálogo: posse é mantida
update public.cosmetic_items set is_active = false where id = 'oil-lamp';
select tests.assert((select count(*) from public.user_items where item_id = 'oil-lamp') = 1, 'posse mantida quando item é desativado');

-- ===========================================================================
-- Item bíblico (catálogo v2): Túnica de José
-- ===========================================================================
select tests.assert((select not is_starter and rarity = 'epic' and scripture_ref = 'Gênesis 37:3' from public.cosmetic_items where id = 'tunic-joseph'), 'Túnica de José cadastrada como épica, não inicial, com referência');
select tests.assert((select rule_payload ->> 'book' = 'GEN' and (rule_payload ->> 'chapter')::int = 37 from public.item_unlock_rules where item_id = 'tunic-joseph' and rule_type = 'chapter_completed'), 'regra de desbloqueio: Gênesis 37');
begin;
select set_config('request.jwt.claim.sub', '11111111-1111-1111-1111-111111111111', true);
set local role authenticated;
select tests.assert((select count(*) from public.item_unlock_rules where item_id = 'tunic-joseph') = 1, 'usuário autenticado lê a regra (para mostrar o objetivo)');
select tests.assert_raises(
  $$select public.save_avatar((select v from tests.fixtures where k='appearance'), '{"outfit":"tunic-joseph"}', (public.get_my_avatar() ->> 'version')::int)$$,
  'item_not_owned', 'Túnica de José não pode ser equipada sem desbloqueio');
select tests.assert((select count(*) from public.user_items where item_id = 'tunic-joseph') = 0, 'item bíblico não é concedido como inicial');
commit;
