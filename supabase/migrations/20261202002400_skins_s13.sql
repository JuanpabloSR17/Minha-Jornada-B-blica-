-- Lote S13 (Personagens · Profetas): skins principais conquistadas lendo. Aditiva, só dados.
-- Gerada por scripts/skins-add-lot.mjs a partir de docs/skins/plano-lotes.json.
insert into public.skins (id, name, rarity, origin, scripture_ref, season, in_shop, sort_order, variants, character_sex) values
  ('epico_baruque', 'Traje de Baruque', 'epic', 'leitura', 'Jr 36:4', 'enciclopedia', false, 231, '{padrao}', 'masculino'),
  ('raro_obadias', 'Traje de Obadias', 'rare', 'leitura', 'Ob 1:1', 'enciclopedia', false, 232, '{padrao}', 'masculino'),
  ('raro_naum', 'Traje de Naum', 'rare', 'leitura', 'Na 1:15', 'enciclopedia', false, 233, '{padrao}', 'masculino'),
  ('raro_sofonias', 'Traje de Sofonias', 'rare', 'leitura', 'Sf 3:17', 'enciclopedia', false, 234, '{padrao}', 'masculino'),
  ('raro_malaquias', 'Traje de Malaquias', 'rare', 'leitura', 'Ml 3:16', 'enciclopedia', false, 235, '{padrao}', 'masculino'),
  ('raro_ebede_meleque', 'Traje de Ebede-Meleque', 'rare', 'leitura', 'Jr 38:7-13', 'enciclopedia', false, 236, '{padrao}', 'masculino');

insert into public.skin_unlock_rules (skin_id, rule, label, sort_order) values
  ('epico_baruque', '{"chapters":[["JER",36]]}', 'Ler a história de Baruque (Jr 36:4)', 231),
  ('raro_obadias', '{"chapters":[["OBA",1]]}', 'Ler a história de Obadias (Ob 1:1)', 232),
  ('raro_naum', '{"chapters":[["NAM",1]]}', 'Ler a história de Naum (Na 1:15)', 233),
  ('raro_sofonias', '{"chapters":[["ZEP",3]]}', 'Ler a história de Sofonias (Sf 3:17)', 234),
  ('raro_malaquias', '{"chapters":[["MAL",3]]}', 'Ler a história de Malaquias (Ml 3:16)', 235),
  ('raro_ebede_meleque', '{"chapters":[["JER",38]]}', 'Ler a história de Ebede-Meleque (Jr 38:7-13)', 236);

-- concede na hora a quem já cumpriu as regras
do $$
declare r record;
begin
  for r in select distinct d.user_id from private.domain_events d where d.event_type in ('CHAPTER_COMPLETED', 'MILESTONE_REACHED') loop
    perform private.grant_reading_skins(r.user_id);
  end loop;
end $$;
