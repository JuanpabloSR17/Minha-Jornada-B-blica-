-- Lote S20 (Personagens · Evangelhos e Igreja): skins principais conquistadas lendo. Aditiva, só dados.
-- Gerada por scripts/skins-add-lot.mjs a partir de docs/skins/plano-lotes.json.
insert into public.skins (id, name, rarity, origin, scripture_ref, season, in_shop, sort_order, variants, character_sex) values
  ('raro_cleopas', 'Traje de Cleopas', 'rare', 'leitura', 'Lc 24:18', 'enciclopedia', false, 273, '{padrao}', 'masculino'),
  ('raro_a_crianca_no_colo_de_jesus', 'A criança no colo de Jesus', 'rare', 'leitura', 'Mc 9:36', 'enciclopedia', false, 274, '{padrao,feminino}', null),
  ('epico_barnabe', 'Traje de Barnabé', 'epic', 'leitura', 'At 4:36-37; 11:24', 'enciclopedia', false, 275, '{padrao}', 'masculino'),
  ('epico_estevao', 'Traje de Estêvão', 'epic', 'leitura', 'At 6:5-8', 'enciclopedia', false, 276, '{padrao}', 'masculino'),
  ('epico_tiago_irmao_do_senhor', 'Traje de Tiago, irmão do Senhor', 'epic', 'leitura', 'At 15:13; Tg 1:1', 'enciclopedia', false, 277, '{padrao}', 'masculino'),
  ('epico_lucas', 'Traje de Lucas', 'epic', 'leitura', 'Cl 4:14; Lc 1:3', 'enciclopedia', false, 278, '{padrao}', 'masculino');

insert into public.skin_unlock_rules (skin_id, rule, label, sort_order) values
  ('raro_cleopas', '{"chapters":[["LUK",24]]}', 'Ler a história de Cleopas (Lc 24:18)', 273),
  ('raro_a_crianca_no_colo_de_jesus', '{"chapters":[["MRK",9]]}', 'Ler Mc 9:36', 274),
  ('epico_barnabe', '{"chapters":[["ACT",4],["ACT",11]]}', 'Ler a história de Barnabé (At 4:36-37; 11:24)', 275),
  ('epico_estevao', '{"chapters":[["ACT",6]]}', 'Ler a história de Estêvão (At 6:5-8)', 276),
  ('epico_tiago_irmao_do_senhor', '{"chapters":[["ACT",15],["JAS",1]]}', 'Ler a história de Tiago, irmão do Senhor (At 15:13; Tg 1:1)', 277),
  ('epico_lucas', '{"chapters":[["COL",4],["LUK",1]]}', 'Ler a história de Lucas (Cl 4:14; Lc 1:3)', 278);

-- concede na hora a quem já cumpriu as regras
do $$
declare r record;
begin
  for r in select distinct d.user_id from private.domain_events d where d.event_type in ('CHAPTER_COMPLETED', 'MILESTONE_REACHED') loop
    perform private.grant_reading_skins(r.user_id);
  end loop;
end $$;
