-- Lote S01 (Personagens · Origens): skins principais conquistadas lendo. Aditiva, só dados.
-- Gerada por scripts/skins-add-lot.mjs a partir de docs/skins/plano-lotes.json.
insert into public.skins (id, name, rarity, origin, scripture_ref, season, in_shop, sort_order, variants, character_sex) values
  ('epico_raquel', 'Traje de Raquel', 'epic', 'leitura', 'Gn 29:9', 'enciclopedia', false, 159, '{padrao}', 'feminino'),
  ('epico_lia', 'Traje de Lia', 'epic', 'leitura', 'Gn 29:16-17', 'enciclopedia', false, 160, '{padrao}', 'feminino'),
  ('epico_abel', 'Traje de Abel', 'epic', 'leitura', 'Gn 4:2-4', 'enciclopedia', false, 161, '{padrao}', 'masculino'),
  ('epico_enoque', 'Traje de Enoque', 'epic', 'leitura', 'Gn 5:24', 'enciclopedia', false, 162, '{padrao}', 'masculino'),
  ('epico_melquisedeque', 'Traje de Melquisedeque', 'epic', 'leitura', 'Gn 14:18', 'enciclopedia', false, 163, '{padrao}', 'masculino'),
  ('epico_agar', 'Traje de Agar', 'epic', 'leitura', 'Gn 21:19', 'enciclopedia', false, 164, '{padrao}', 'feminino');

insert into public.skin_unlock_rules (skin_id, rule, label, sort_order) values
  ('epico_raquel', '{"chapters":[["GEN",29]]}', 'Ler a história de Raquel (Gn 29:9)', 159),
  ('epico_lia', '{"chapters":[["GEN",29]]}', 'Ler a história de Lia (Gn 29:16-17)', 160),
  ('epico_abel', '{"chapters":[["GEN",4]]}', 'Ler a história de Abel (Gn 4:2-4)', 161),
  ('epico_enoque', '{"chapters":[["GEN",5]]}', 'Ler a história de Enoque (Gn 5:24)', 162),
  ('epico_melquisedeque', '{"chapters":[["GEN",14]]}', 'Ler a história de Melquisedeque (Gn 14:18)', 163),
  ('epico_agar', '{"chapters":[["GEN",21]]}', 'Ler a história de Agar (Gn 21:19)', 164);

-- concede na hora a quem já cumpriu as regras
do $$
declare r record;
begin
  for r in select distinct d.user_id from private.domain_events d where d.event_type in ('CHAPTER_COMPLETED', 'MILESTONE_REACHED') loop
    perform private.grant_reading_skins(r.user_id);
  end loop;
end $$;
