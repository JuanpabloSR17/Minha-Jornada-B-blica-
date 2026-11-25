-- Lote S15 (Personagens · Evangelhos): skins principais conquistadas lendo. Aditiva, só dados.
-- Gerada por scripts/skins-add-lot.mjs a partir de docs/skins/plano-lotes.json.
insert into public.skins (id, name, rarity, origin, scripture_ref, season, in_shop, sort_order, variants, character_sex) values
  ('epico_maria_de_betania', 'Traje de Maria de Betânia', 'epic', 'leitura', 'Jo 12:3', 'enciclopedia', false, 243, '{padrao}', 'feminino'),
  ('epico_lazaro', 'Traje de Lázaro', 'epic', 'leitura', 'Jo 11:44', 'enciclopedia', false, 244, '{padrao}', 'masculino'),
  ('epico_nicodemos', 'Traje de Nicodemos', 'epic', 'leitura', 'Jo 3:1-2; 19:39', 'enciclopedia', false, 245, '{padrao}', 'masculino'),
  ('epico_jose_de_arimateia', 'Traje de José de Arimateia', 'epic', 'leitura', 'Mt 27:57-60', 'enciclopedia', false, 246, '{padrao}', 'masculino'),
  ('epico_zaqueu', 'Traje de Zaqueu', 'epic', 'leitura', 'Lc 19:4-8', 'enciclopedia', false, 247, '{padrao}', 'masculino'),
  ('epico_a_samaritana', 'A samaritana', 'epic', 'leitura', 'Jo 4:28-29', 'enciclopedia', false, 248, '{padrao}', 'feminino');

insert into public.skin_unlock_rules (skin_id, rule, label, sort_order) values
  ('epico_maria_de_betania', '{"chapters":[["JHN",12]]}', 'Ler a história de Maria de Betânia (Jo 12:3)', 243),
  ('epico_lazaro', '{"chapters":[["JHN",11]]}', 'Ler a história de Lázaro (Jo 11:44)', 244),
  ('epico_nicodemos', '{"chapters":[["JHN",3],["JHN",19]]}', 'Ler a história de Nicodemos (Jo 3:1-2; 19:39)', 245),
  ('epico_jose_de_arimateia', '{"chapters":[["MAT",27]]}', 'Ler a história de José de Arimateia (Mt 27:57-60)', 246),
  ('epico_zaqueu', '{"chapters":[["LUK",19]]}', 'Ler a história de Zaqueu (Lc 19:4-8)', 247),
  ('epico_a_samaritana', '{"chapters":[["JHN",4]]}', 'Ler a história da samaritana (Jo 4:28-29)', 248);

-- concede na hora a quem já cumpriu as regras
do $$
declare r record;
begin
  for r in select distinct d.user_id from private.domain_events d where d.event_type in ('CHAPTER_COMPLETED', 'MILESTONE_REACHED') loop
    perform private.grant_reading_skins(r.user_id);
  end loop;
end $$;
