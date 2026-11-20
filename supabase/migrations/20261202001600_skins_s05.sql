-- Lote S05 (Personagens · Terra e Reinos): skins principais conquistadas lendo. Aditiva, só dados.
-- Gerada por scripts/skins-add-lot.mjs a partir de docs/skins/plano-lotes.json.
insert into public.skins (id, name, rarity, origin, scripture_ref, season, in_shop, sort_order, variants, character_sex) values
  ('epico_abigail', 'Traje de Abigail', 'epic', 'leitura', '1 Sm 25:18', 'enciclopedia', false, 183, '{padrao}', 'feminino'),
  ('epico_nata', 'Traje de Natã', 'epic', 'leitura', '2 Sm 12:1', 'enciclopedia', false, 184, '{padrao}', 'masculino'),
  ('epico_rainha_de_saba', 'Traje de Rainha de Sabá', 'epic', 'leitura', '1 Rs 10:1-2', 'enciclopedia', false, 185, '{padrao}', 'feminino'),
  ('epico_naama', 'Traje de Naamã', 'epic', 'leitura', '2 Rs 5:14', 'enciclopedia', false, 186, '{padrao}', 'masculino'),
  ('epico_ezequias', 'Traje de Ezequias', 'epic', 'leitura', '2 Rs 18:5; 20:5', 'enciclopedia', false, 187, '{padrao}', 'masculino'),
  ('epico_josias', 'Traje de Josias', 'epic', 'leitura', '2 Rs 22:11; 23:2', 'enciclopedia', false, 188, '{padrao}', 'masculino');

insert into public.skin_unlock_rules (skin_id, rule, label, sort_order) values
  ('epico_abigail', '{"chapters":[["1SA",25]]}', 'Ler a história de Abigail (1 Sm 25:18)', 183),
  ('epico_nata', '{"chapters":[["2SA",12]]}', 'Ler a história de Natã (2 Sm 12:1)', 184),
  ('epico_rainha_de_saba', '{"chapters":[["1KI",10]]}', 'Ler a história de Rainha de Sabá (1 Rs 10:1-2)', 185),
  ('epico_naama', '{"chapters":[["2KI",5]]}', 'Ler a história de Naamã (2 Rs 5:14)', 186),
  ('epico_ezequias', '{"chapters":[["2KI",18],["2KI",20]]}', 'Ler a história de Ezequias (2 Rs 18:5; 20:5)', 187),
  ('epico_josias', '{"chapters":[["2KI",22],["2KI",23]]}', 'Ler a história de Josias (2 Rs 22:11; 23:2)', 188);

-- concede na hora a quem já cumpriu as regras
do $$
declare r record;
begin
  for r in select distinct d.user_id from private.domain_events d where d.event_type in ('CHAPTER_COMPLETED', 'MILESTONE_REACHED') loop
    perform private.grant_reading_skins(r.user_id);
  end loop;
end $$;
