-- Missões especiais dos Raros (catálogo v7).

create function tests.mk_r(p_user uuid, p_name text, p_target int default null) returns void language plpgsql as $$
begin
  insert into auth.users (id, email) values (p_user, p_name || '@teste.local');
  insert into public.profiles (id, username, display_name) values (p_user, p_name, initcap(replace(p_name, '_', ' ')));
  if p_target is not null then
    insert into public.reading_preferences (user_id, plan_mode, target_chapters_per_day) values (p_user, 'daily_goal', p_target);
  end if;
end $$;
create function tests.rfin(p_user uuid, p_label text, p_book text, p_chapter int) returns jsonb language plpgsql as $$
begin
  perform set_config('request.jwt.claim.sub', p_user::text, true);
  return public.complete_reading_mission(md5('rare' || p_user::text || p_label)::uuid, p_book, p_chapter, 'physical', now() - interval '5 minutes', 240);
end $$;
create function tests.n_items(p_user uuid, p_item text) returns int language sql as $$
  select count(*)::int from public.user_items where user_id = p_user and item_id = p_item
$$;
create function tests.granted_set(r jsonb) returns text[] language sql as $$
  select coalesce(array_agg(g order by g), '{}') from jsonb_array_elements_text(r -> 'granted') g
$$;

-- ---------------------------------------------------------------- catálogo
select tests.assert(
  (select count(*) from public.reward_triggers where kind = 'mission' and is_active and book_code is not null) = 14,
  '14 missões especiais ativas (13 novas + Manto do Profeta)');
select tests.assert(
  (select count(*) from public.cosmetic_items i where i.rarity = 'rare' and i.series = 'oficial-v2'
     and exists (select 1 from public.item_unlock_rules r where r.item_id = i.id and r.is_active and r.rule_type = 'mission_completed')) = 16,
  '16 dos 18 Raros oficiais concedidos por missão');
select tests.assert(
  (select array_agg(i.id order by i.id) from public.cosmetic_items i where i.rarity = 'rare' and i.series = 'oficial-v2'
     and not exists (select 1 from public.item_unlock_rules r where r.item_id = i.id and r.is_active and r.rule_type = 'mission_completed'))
  = array['rare_bolsa_do_mensageiro', 'rare_calice_de_bronze'],
  'Cálice de Bronze e Bolsa do Mensageiro ficam pendentes (sem missão)');
select tests.assert(
  (select count(*) from public.item_unlock_rules r join public.reward_triggers t on t.id = r.rule_payload ->> 'mission'
   where r.is_active and r.rule_type = 'mission_completed' and t.id = 'missao_vestes_do_sumo_sacerdote') = 3,
  'a missão de Êxodo 28 concede os três Raros');
select tests.assert(
  (select jsonb_object_agg(id, shop_price_suggested) from public.cosmetic_items where rarity = 'rare' and shop_eligible)
  = '{"rare_flauta_do_musico":400,"rare_manto_de_la_do_pastor":400,"rare_instrumento_de_cordas":450,"rare_bolsa_do_mensageiro":350,"rare_sandalias_do_peregrino":400}'::jsonb,
  'os cinco Raros continuam à venda com os mesmos preços');
select tests.assert(
  (select representation from public.cosmetic_items where id = 'rare_sandalias_do_peregrino') = 'metaphorical',
  'Sandálias do Peregrino marcadas como associação metafórica');
select tests.assert(
  (select count(*) from public.cosmetic_items where name = 'Rolo do Escriba') = 2
  and exists (select 1 from public.cosmetic_items where id = 'rare_rolo_do_escriba' and name = 'Rolo do Escriba')
  and exists (select 1 from public.cosmetic_items where id = 'book_ezr' and name = 'Rolo do Escriba'),
  'IDs e nomes oficiais dos dois Rolos do Escriba preservados');
select tests.assert(
  (select rule_payload ->> 'mission' from public.item_unlock_rules where item_id = 'cloak-elijah' and is_active and rule_type <> 'starter') = 'missao_manto_do_profeta'
  and (select array_agg(item_id order by item_id) from public.collection_items where collection_id = 'prophets') = array['cloak-elijah', 'cloak-succession', 'scroll-isaiah'],
  'Manto do Profeta e Coleção dos Profetas preservados');

-- ---------------------------------------------------------------- Êxodo 28 com um dos três Raros já obtido
select tests.mk_r('c4000000-0000-0000-0000-0000000000c4', 'raros_vestes');
insert into public.user_items (user_id, item_id, source_event_id) values ('c4000000-0000-0000-0000-0000000000c4', 'rare_peitoral_das_doze_pedras', 'test:obtido-antes');
create table tests.ex28 as select tests.rfin('c4000000-0000-0000-0000-0000000000c4', 'ex28', 'EXO', 28) r;
select tests.assert(
  (select tests.granted_set(r) = array['rare_estola_sacerdotal', 'rare_turbante_do_sacerdote'] and r -> 'missions' -> 0 ->> 'id' = 'missao_vestes_do_sumo_sacerdote' from tests.ex28),
  'Êxodo 28 concede só os Raros que faltam (Estola e Turbante), sem repetir o Peitoral');
select tests.assert(tests.n_items('c4000000-0000-0000-0000-0000000000c4', 'rare_peitoral_das_doze_pedras') = 1
  and tests.n_items('c4000000-0000-0000-0000-0000000000c4', 'rare_estola_sacerdotal') = 1
  and tests.n_items('c4000000-0000-0000-0000-0000000000c4', 'rare_turbante_do_sacerdote') = 1, 'cada item uma única vez');
select tests.assert(
  (select (r ->> 'duplicate')::boolean and tests.granted_set(r) = (select tests.granted_set(r) from tests.ex28)
   from tests.rfin('c4000000-0000-0000-0000-0000000000c4', 'ex28', 'EXO', 28) r),
  'reenviar a conclusão devolve o mesmo resultado');
select tests.assert(
  (select tests.granted_set(r) = '{}' and r -> 'missions' = '[]'::jsonb from tests.rfin('c4000000-0000-0000-0000-0000000000c4', 'ex28-de-novo', 'EXO', 28) r),
  'reler Êxodo 28 não repete a missão nem os itens');
select tests.assert((select count(*) from public.user_items where user_id = 'c4000000-0000-0000-0000-0000000000c4' and source_event_id like 'reward:%') = 2, 'sem itens duplicados');

-- ---------------------------------------------------------------- releitura cumpre a missão sem XP, progresso ou meta
select tests.mk_r('c5000000-0000-0000-0000-0000000000c5', 'raros_releitura', 2);
update public.reward_triggers set is_active = false where id = 'missao_consagracao_de_arao';
select tests.assert(
  (select (r ->> 'xpAwarded')::int = 40 and tests.granted_set(r) = '{}' and (r -> 'dailyGoal' ->> 'newChaptersToday')::int = 1
   from tests.rfin('c5000000-0000-0000-0000-0000000000c5', 'lv8-a', 'LEV', 8) r),
  'Levítico 8 lido antes de a missão existir: 40 XP, 1 capítulo da meta, sem item');
update public.reward_triggers set is_active = true where id = 'missao_consagracao_de_arao';
select tests.assert(
  (select (r ->> 'alreadyCompleted')::boolean and (r ->> 'xpAwarded')::int = 0 and tests.granted_set(r) = array['rare_tunica_cerimonial']
     and (r ->> 'chaptersCompleted')::int = 1 and (r -> 'dailyGoal' ->> 'newChaptersToday')::int = 1 and not (r -> 'dailyGoal' ->> 'achievedNow')::boolean
   from tests.rfin('c5000000-0000-0000-0000-0000000000c5', 'lv8-b', 'LEV', 8) r),
  'releitura cumpre a missão e concede a Túnica Cerimonial sem XP, sem capítulo novo e sem avançar a meta diária');
select tests.assert((select sum(amount) from public.xp_ledger where user_id = 'c5000000-0000-0000-0000-0000000000c5') = 40, 'XP total continua 40');

-- ---------------------------------------------------------------- raridades diferentes numa conclusão
select tests.mk_r('c6000000-0000-0000-0000-0000000000c6', 'raros_mistos');
select tests.assert(
  (select tests.granted_set(r) = array['epic_jarro_de_rebeca', 'rare_bracelete_da_corte'] from tests.rfin('c6000000-0000-0000-0000-0000000000c6', 'gn24', 'GEN', 24) r),
  'Gênesis 24: Raro (Bracelete da Corte) e Épico (Jarro de Rebeca) na mesma leitura');
select tests.rfin('c6000000-0000-0000-0000-0000000000c6', 'ezr' || n, 'EZR', n) from generate_series(1, 10) n where n <> 7;
select tests.assert(not exists (select 1 from public.user_items where user_id = 'c6000000-0000-0000-0000-0000000000c6' and item_id in ('book_ezr', 'rare_rolo_do_escriba')),
  'Esdras sem o capítulo 7: nem o Lendário nem o Raro');
create table tests.ezr7 as select tests.rfin('c6000000-0000-0000-0000-0000000000c6', 'ezr7', 'EZR', 7) r;
select tests.assert(
  (select tests.granted_set(r) = array['book_ezr', 'epic_pergaminho_de_esdras', 'rare_rolo_do_escriba'] and (r ->> 'bookJustCompleted')::boolean from tests.ezr7),
  'Esdras 7 por último: Raro, Épico e o Lendário do livro na mesma conclusão');

-- ---------------------------------------------------------------- item já comprado no Mercado
select tests.mk_r('c7000000-0000-0000-0000-0000000000c7', 'raros_compra');
insert into public.siclos_ledger (user_id, event_type, source_event_id, amount) values ('c7000000-0000-0000-0000-0000000000c7', 'TEST_GRANT', 'fixture', 500);
select set_config('request.jwt.claim.sub', 'c7000000-0000-0000-0000-0000000000c7', false);
select public.purchase_market_item(md5('raro-flauta')::uuid, 'rare_flauta_do_musico');
select tests.assert(
  (select tests.granted_set(r) = '{}' and r -> 'missions' -> 0 ->> 'id' = 'missao_uncao_de_salomao' from tests.rfin('c7000000-0000-0000-0000-0000000000c7', '1ki1', '1KI', 1) r),
  'quem comprou a Flauta conclui a missão de 1 Reis 1 sem receber o item de novo');
select tests.assert(private.siclos_balance('c7000000-0000-0000-0000-0000000000c7') = 100 and tests.n_items('c7000000-0000-0000-0000-0000000000c7', 'rare_flauta_do_musico') = 1,
  'sem compensação: saldo e posse inalterados');

-- ---------------------------------------------------------------- Coleção dos Profetas
select tests.mk_r('c8000000-0000-0000-0000-0000000000c8', 'raros_profetas');
select tests.rfin('c8000000-0000-0000-0000-0000000000c8', '2ki2', '2KI', 2);
select tests.assert(
  (select tests.granted_set(r) = array['cloak-elijah', 'cloak-succession'] from tests.rfin('c8000000-0000-0000-0000-0000000000c8', '1ki19', '1KI', 19) r),
  'Profetas: a missão de 1 Reis 19 concede o manto e libera a Sucessão');
-- um livro inteiro de uma vez: limite anti-abuso alto só neste banco de teste
update public.economy_rules set value = 1000 where key = 'max_missions_per_10min';
select tests.rfin('c8000000-0000-0000-0000-0000000000c8', 'isa' || n, 'ISA', n) from generate_series(1, 66) n where n <> 52;
create table tests.isa52 as select tests.rfin('c8000000-0000-0000-0000-0000000000c8', 'isa52', 'ISA', 52) r;
select tests.assert(
  (select tests.granted_set(r) = array['book_isa', 'cloak-elijah-prophets', 'rare_sandalias_do_peregrino', 'scroll-isaiah'] from tests.isa52),
  'Isaías 52 por último: Raro da missão, Lendário, Rolo de Isaías e a recompensa da Coleção dos Profetas');
select tests.assert(exists (select 1 from private.domain_events where user_id = 'c8000000-0000-0000-0000-0000000000c8' and event_type = 'COLLECTION_COMPLETED' and source_event_id = 'collection:prophets'),
  'Coleção dos Profetas registrada como concluída');
update public.economy_rules set value = 60 where key = 'max_missions_per_10min';
