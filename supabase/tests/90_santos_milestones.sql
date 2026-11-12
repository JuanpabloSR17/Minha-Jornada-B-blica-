-- Marcos dos 22 Santos (catálogo v8): sessão vinculada ao marco escolhido na aba Ler.

create function tests.mk_s(p_user uuid, p_name text, p_target int default null) returns void language plpgsql as $$
begin
  insert into auth.users (id, email) values (p_user, p_name || '@teste.local');
  insert into public.profiles (id, username, display_name) values (p_user, p_name, initcap(replace(p_name, '_', ' ')));
  if p_target is not null then
    insert into public.reading_preferences (user_id, plan_mode, target_chapters_per_day) values (p_user, 'daily_goal', p_target);
  end if;
end $$;
/** Finaliza uma sessão; p_milestone = marco escolhido (null = leitura comum). */
create function tests.sfin(p_user uuid, p_label text, p_book text, p_chapter int, p_milestone text default null) returns jsonb language plpgsql as $$
begin
  perform set_config('request.jwt.claim.sub', p_user::text, true);
  return public.complete_reading_mission(md5('santo' || p_user::text || p_label)::uuid, p_book, p_chapter, 'physical', now() - interval '5 minutes', 240, p_milestone);
end $$;
create function tests.gs(r jsonb) returns text[] language sql as $$
  select coalesce(array_agg(g order by g), '{}') from jsonb_array_elements_text(r -> 'granted') g
$$;
create function tests.marcos(p_user uuid, p_marco text) returns int language sql as $$
  select count(*)::int from private.domain_events where user_id = p_user and event_type = 'MILESTONE_REACHED' and source_event_id = 'milestone:' || p_marco
$$;

-- ---------------------------------------------------------------- catálogo
select tests.assert(
  (select count(*) from public.reward_triggers where kind = 'milestone' and is_active and book_code is not null) = 20,
  '20 marcos cadastrados para os 22 Santos');
select tests.assert(
  (select count(*) from public.cosmetic_items i where i.rarity = 'holy' and i.is_active
     and exists (select 1 from public.item_unlock_rules r join public.reward_triggers t on t.id = r.rule_payload ->> 'milestone'
                 where r.item_id = i.id and r.is_active and r.rule_type = 'milestone_reached' and t.is_active)) = 22,
  'os 22 Santos ligados a um marco ativo');
select tests.assert(
  (select array_agg(r.item_id order by r.item_id) from public.item_unlock_rules r where r.is_active and r.rule_payload ->> 'milestone' = 'marco_mobilia_do_tabernaculo')
  = array['holy_arca_da_alianca_representacao', 'holy_candelabro_do_tabernaculo', 'holy_mesa_dos_paes_da_presenca'],
  'um marco de Êxodo 25 para a Arca, a Mesa dos Pães e o Candelabro');
select tests.assert(
  not exists (select 1 from public.cosmetic_items where rarity = 'holy' and (shop_eligible or is_premium_cosmetic))
  and not exists (select 1 from public.item_unlock_rules r join public.cosmetic_items i on i.id = r.item_id where i.rarity = 'holy' and r.is_active and r.rule_type = 'mission_pool'),
  'Santos fora da loja, de sorteios e da escolha gratuita diária');
select tests.assert(
  (select bool_and(slot = 'relic') from public.cosmetic_items where rarity = 'holy' and is_active and holy_subtype = 'artefato')
  and (select count(*) from public.cosmetic_items where rarity = 'holy' and is_active and holy_subtype = 'artefato') = 7
  and (select array_agg(id order by id) from public.cosmetic_items where rarity = 'holy' and is_active and slot = 'relic' and holy_subtype <> 'artefato')
      = array['holy_agua_transformada_em_vinho', 'holy_paes_da_multiplicacao']
  and (select count(*) from public.cosmetic_items where rarity = 'holy' and is_active and slot in ('background', 'frame', 'effect')) = 13,
  'usos do catálogo preservados: 7 artefatos + 2 obras só em exposição; 13 Santos de personalização');
select tests.assert(
  (select meaning from public.cosmetic_items where id = 'holy_rolo_da_lei_encontrado') <> coalesce((select meaning from public.cosmetic_items where id = 'book_2ki'), '')
  and (select scripture_ref from public.cosmetic_items where id = 'holy_rolo_da_lei_encontrado') = '2 Reis 22:8-11'
  and (select scripture_ref from public.cosmetic_items where id = 'book_2ki') = '2 Reis 22:8',
  '2 Reis 22: significados diferentes para o Santo e o Lendário; IDs e referências preservados');

-- ---------------------------------------------------------------- leitura comum × marco escolhido
select tests.mk_s('d9100000-0000-0000-0000-0000000000d1', 'santos_um', 2);
select tests.assert(
  (select tests.gs(r) = '{}' and r -> 'missions' = '[]'::jsonb and (r ->> 'xpAwarded')::int = 40 and (r -> 'dailyGoal' ->> 'newChaptersToday')::int = 1
   from tests.sfin('d9100000-0000-0000-0000-0000000000d1', 'ex16-comum', 'EXO', 16) r),
  'leitura comum de Êxodo 16: 40 XP e progresso, sem o Maná');
select tests.assert(
  (select (r ->> 'alreadyCompleted')::boolean and tests.gs(r) = array['holy_mana_do_deserto'] and r ->> 'milestone' = 'holy_mana_do_deserto'
     and r -> 'missions' -> 0 ->> 'kind' = 'milestone' and (r ->> 'xpAwarded')::int = 0 and (r ->> 'chaptersCompleted')::int = 1
     and (r -> 'dailyGoal' ->> 'newChaptersToday')::int = 1 and not (r -> 'dailyGoal' ->> 'achievedNow')::boolean
   from tests.sfin('d9100000-0000-0000-0000-0000000000d1', 'ex16-marco', 'EXO', 16, 'holy_mana_do_deserto') r),
  'releitura com o marco escolhido concede o Maná sem XP, sem capítulo novo e sem avançar a meta');
select tests.assert(
  (select tests.gs(r) = '{}' and r -> 'missions' = '[]'::jsonb from tests.sfin('d9100000-0000-0000-0000-0000000000d1', 'ex16-marco-2', 'EXO', 16, 'holy_mana_do_deserto') r)
  and tests.marcos('d9100000-0000-0000-0000-0000000000d1', 'holy_mana_do_deserto') = 1,
  'o marco é registrado uma única vez por jogador');

-- ---------------------------------------------------------------- vínculo marco ↔ sessão ↔ capítulo
select tests.assert_raises($$select tests.sfin('d9100000-0000-0000-0000-0000000000d1', 'errado', 'EXO', 17, 'holy_mana_do_deserto')$$, 'invalid_milestone', 'marco de outro capítulo é recusado');
select tests.assert_raises($$select tests.sfin('d9100000-0000-0000-0000-0000000000d1', 'inexistente', 'EXO', 16, 'marco_inexistente')$$, 'invalid_milestone', 'marco inexistente é recusado');
select tests.assert_raises($$select tests.sfin('d9100000-0000-0000-0000-0000000000d1', 'missao', 'EXO', 28, 'missao_vestes_do_sumo_sacerdote')$$, 'invalid_milestone', 'missão dos Raros não pode ser usada como marco');
update public.reward_triggers set is_active = false where id = 'holy_tabuas_da_alianca';
select tests.assert_raises($$select tests.sfin('d9100000-0000-0000-0000-0000000000d1', 'inativo', 'EXO', 31, 'holy_tabuas_da_alianca')$$, 'invalid_milestone', 'marco desativado é recusado');
update public.reward_triggers set is_active = true where id = 'holy_tabuas_da_alianca';
select tests.assert(not exists (select 1 from public.reading_sessions where user_id = 'd9100000-0000-0000-0000-0000000000d1' and book_code = 'EXO' and chapter in (17, 28, 31)),
  'tentativas recusadas não registram sessão nem capítulo');

-- ---------------------------------------------------------------- Êxodo 25: três Santos, posse parcial, perda da resposta
select tests.mk_s('d9200000-0000-0000-0000-0000000000d2', 'santos_tabernaculo');
insert into public.user_items (user_id, item_id, source_event_id) values ('d9200000-0000-0000-0000-0000000000d2', 'holy_mesa_dos_paes_da_presenca', 'test:obtido-antes');
create table tests.ex25 as select tests.sfin('d9200000-0000-0000-0000-0000000000d2', 'ex25', 'EXO', 25, 'marco_mobilia_do_tabernaculo') r;
select tests.assert(
  (select tests.gs(r) = array['holy_arca_da_alianca_representacao', 'holy_candelabro_do_tabernaculo'] and (r ->> 'xpAwarded')::int = 40 from tests.ex25),
  'posse parcial: o marco de Êxodo 25 concede só a Arca e o Candelabro (a Mesa já era do jogador)');
-- resposta perdida: o app reenvia a mesma sessão com o mesmo marco
select tests.assert(
  (select (r ->> 'duplicate')::boolean and tests.gs(r) = (select tests.gs(r) from tests.ex25) and r ->> 'milestone' = 'marco_mobilia_do_tabernaculo'
   from tests.sfin('d9200000-0000-0000-0000-0000000000d2', 'ex25', 'EXO', 25, 'marco_mobilia_do_tabernaculo') r),
  'reenvio após perder a resposta devolve o mesmo resultado');
select tests.assert_raises($$select tests.sfin('d9200000-0000-0000-0000-0000000000d2', 'ex25', 'EXO', 25)$$, 'invalid_session', 'reenviar a sessão sem o marco é recusado (vínculo preservado)');
select tests.assert_raises($$select tests.sfin('d9200000-0000-0000-0000-0000000000d2', 'ex25', 'EXO', 25, 'holy_mana_do_deserto')$$, 'invalid_session', 'reenviar a sessão com outro marco é recusado');
select tests.assert(
  (select count(*) from public.user_items where user_id = 'd9200000-0000-0000-0000-0000000000d2' and item_id like 'holy_%') = 3
  and (select count(*) from public.reward_events where user_id = 'd9200000-0000-0000-0000-0000000000d2') = 2
  and tests.marcos('d9200000-0000-0000-0000-0000000000d2', 'marco_mobilia_do_tabernaculo') = 1
  and (select count(*) from public.reading_sessions where user_id = 'd9200000-0000-0000-0000-0000000000d2' and milestone_id = 'marco_mobilia_do_tabernaculo') = 1,
  'sem duplicação: 3 Santos, 2 recompensas, 1 marco e 1 sessão vinculada');
select tests.mk_s('d9300000-0000-0000-0000-0000000000d3', 'santos_tres');
select tests.assert(
  (select tests.gs(r) = array['holy_arca_da_alianca_representacao', 'holy_candelabro_do_tabernaculo', 'holy_mesa_dos_paes_da_presenca']
   from tests.sfin('d9300000-0000-0000-0000-0000000000d3', 'ex25', 'EXO', 25, 'marco_mobilia_do_tabernaculo') r),
  'sem posse anterior, o marco de Êxodo 25 concede os três Santos');

-- ---------------------------------------------------------------- recompensas combinadas
select tests.mk_s('d9400000-0000-0000-0000-0000000000d4', 'santos_combinados');
select tests.assert(
  (select tests.gs(r) = array['holy_sinal_da_pomba', 'rare_cinto_de_couro_de_joao'] and jsonb_array_length(r -> 'missions') = 2
   from tests.sfin('d9400000-0000-0000-0000-0000000000d4', 'mt3', 'MAT', 3, 'holy_sinal_da_pomba') r),
  'Mateus 3 com o marco: Santo (Sinal da Pomba) e Raro da missão (Cinto de Couro de João)');
select tests.assert(
  (select tests.gs(r) = array['holy_travessia_do_mar', 'staff-moses'] from tests.sfin('d9400000-0000-0000-0000-0000000000d4', 'ex14', 'EXO', 14, 'holy_travessia_do_mar') r),
  'Êxodo 14 na primeira leitura com o marco: Travessia do Mar e Vara de Moisés');
update public.economy_rules set value = 1000 where key = 'max_missions_per_10min';
select tests.sfin('d9400000-0000-0000-0000-0000000000d4', '2ki' || n, '2KI', n) from generate_series(1, 25) n where n <> 22;
select tests.assert(
  (select tests.gs(r) = array['book_2ki', 'holy_rolo_da_lei_encontrado'] and (r ->> 'bookJustCompleted')::boolean
   from tests.sfin('d9400000-0000-0000-0000-0000000000d4', '2ki22', '2KI', 22, 'holy_rolo_da_lei_encontrado') r),
  '2 Reis 22 por último com o marco: Santo e Lendário do livro na mesma conclusão');

-- ---------------------------------------------------------------- coleção do Deus Triúno, sem prêmio adicional
select tests.mk_s('d9500000-0000-0000-0000-0000000000d5', 'santos_triuno');
select tests.assert(
  (select tests.gs(r) = array['holy_cenario_da_nova_criacao'] from tests.sfin('d9500000-0000-0000-0000-0000000000d5', 'ap21', 'REV', 21, 'holy_cenario_da_nova_criacao') r),
  'o marco da Nova Criação concede só o Cenário da Nova Criação');
select tests.assert(private.collection_complete('d9500000-0000-0000-0000-0000000000d5', 'works-triune'), 'coleção do Deus Triúno completa');
select tests.assert(exists (select 1 from private.domain_events where user_id = 'd9500000-0000-0000-0000-0000000000d5' and event_type = 'COLLECTION_COMPLETED' and source_event_id = 'collection:works-triune'),
  'conclusão da coleção do Deus Triúno registrada');
select tests.assert((select reward_item_id from public.item_collections where id = 'works-triune') is null, 'coleção do Deus Triúno sem prêmio adicional');
update public.economy_rules set value = 60 where key = 'max_missions_per_10min';
