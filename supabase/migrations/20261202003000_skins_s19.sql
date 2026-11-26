-- Lote S19 (Personagens · Evangelhos): skins principais conquistadas lendo. Aditiva, só dados.
-- Gerada por scripts/skins-add-lot.mjs a partir de docs/skins/plano-lotes.json.
insert into public.skins (id, name, rarity, origin, scripture_ref, season, in_shop, sort_order, variants, character_sex) values
  ('raro_jairo', 'Traje de Jairo', 'rare', 'leitura', 'Mc 5:22-23', 'enciclopedia', false, 267, '{padrao}', 'masculino'),
  ('raro_a_mulher_que_tocou_o_manto', 'A mulher que tocou o manto', 'rare', 'leitura', 'Mc 5:27-29', 'enciclopedia', false, 268, '{padrao}', 'feminino'),
  ('raro_o_semeador', 'O semeador (parábola)', 'rare', 'leitura', 'Mt 13:3', 'enciclopedia', false, 269, '{padrao}', 'masculino'),
  ('raro_simao_de_cirene', 'Traje de Simão de Cirene', 'rare', 'leitura', 'Mc 15:21', 'enciclopedia', false, 270, '{padrao}', 'masculino'),
  ('raro_joana_e_susana', 'Traje de Joana e Susana', 'rare', 'leitura', 'Lc 8:3', 'enciclopedia', false, 271, '{padrao}', 'feminino'),
  ('raro_salome', 'Traje de Salomé', 'rare', 'leitura', 'Mc 16:1', 'enciclopedia', false, 272, '{padrao}', 'feminino');

insert into public.skin_unlock_rules (skin_id, rule, label, sort_order) values
  ('raro_jairo', '{"chapters":[["MRK",5]]}', 'Ler a história de Jairo (Mc 5:22-23)', 267),
  ('raro_a_mulher_que_tocou_o_manto', '{"chapters":[["MRK",5]]}', 'Ler a história da mulher que tocou o manto (Mc 5:27-29)', 268),
  ('raro_o_semeador', '{"chapters":[["MAT",13]]}', 'Ler a história do semeador (Mt 13:3)', 269),
  ('raro_simao_de_cirene', '{"chapters":[["MRK",15]]}', 'Ler a história de Simão de Cirene (Mc 15:21)', 270),
  ('raro_joana_e_susana', '{"chapters":[["LUK",8]]}', 'Ler a história de Joana e Susana (Lc 8:3)', 271),
  ('raro_salome', '{"chapters":[["MRK",16]]}', 'Ler a história de Salomé (Mc 16:1)', 272);

-- concede na hora a quem já cumpriu as regras
do $$
declare r record;
begin
  for r in select distinct d.user_id from private.domain_events d where d.event_type in ('CHAPTER_COMPLETED', 'MILESTONE_REACHED') loop
    perform private.grant_reading_skins(r.user_id);
  end loop;
end $$;
