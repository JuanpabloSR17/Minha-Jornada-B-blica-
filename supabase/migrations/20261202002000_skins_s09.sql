-- Lote S09 (Personagens · Terra e Reinos): skins principais conquistadas lendo. Aditiva, só dados.
-- Gerada por scripts/skins-add-lot.mjs a partir de docs/skins/plano-lotes.json.
insert into public.skins (id, name, rarity, origin, scripture_ref, season, in_shop, sort_order, variants, character_sex) values
  ('raro_asafe', 'Traje de Asafe', 'rare', 'leitura', '1 Cr 16:5', 'enciclopedia', false, 207, '{padrao}', 'masculino'),
  ('raro_hema_e_jedutum', 'Traje de Hemã e Jedutum', 'rare', 'leitura', '1 Cr 25:1', 'enciclopedia', false, 208, '{padrao}', 'masculino'),
  ('raro_obede_edom', 'Traje de Obede-Edom', 'rare', 'leitura', '2 Sm 6:11', 'enciclopedia', false, 209, '{padrao}', 'masculino'),
  ('raro_ciro', 'Traje de Ciro', 'rare', 'leitura', 'Ed 1:1-3', 'enciclopedia', false, 210, '{padrao}', 'masculino'),
  ('raro_josue_o_sumo_sacerdote', 'Traje de Josué, o sumo sacerdote', 'rare', 'leitura', 'Ed 3:2; Zc 3:5', 'enciclopedia', false, 211, '{padrao}', 'masculino'),
  ('raro_elcana', 'Traje de Elcana', 'rare', 'leitura', '1 Sm 1:1-3', 'enciclopedia', false, 212, '{padrao}', 'masculino');

insert into public.skin_unlock_rules (skin_id, rule, label, sort_order) values
  ('raro_asafe', '{"chapters":[["1CH",16]]}', 'Ler a história de Asafe (1 Cr 16:5)', 207),
  ('raro_hema_e_jedutum', '{"chapters":[["1CH",25]]}', 'Ler a história de Hemã e Jedutum (1 Cr 25:1)', 208),
  ('raro_obede_edom', '{"chapters":[["2SA",6]]}', 'Ler a história de Obede-Edom (2 Sm 6:11)', 209),
  ('raro_ciro', '{"chapters":[["EZR",1]]}', 'Ler a história de Ciro (Ed 1:1-3)', 210),
  ('raro_josue_o_sumo_sacerdote', '{"chapters":[["EZR",3],["ZEC",3]]}', 'Ler a história de Josué, o sumo sacerdote (Ed 3:2; Zc 3:5)', 211),
  ('raro_elcana', '{"chapters":[["1SA",1]]}', 'Ler a história de Elcana (1 Sm 1:1-3)', 212);

-- concede na hora a quem já cumpriu as regras
do $$
declare r record;
begin
  for r in select distinct d.user_id from private.domain_events d where d.event_type in ('CHAPTER_COMPLETED', 'MILESTONE_REACHED') loop
    perform private.grant_reading_skins(r.user_id);
  end loop;
end $$;
