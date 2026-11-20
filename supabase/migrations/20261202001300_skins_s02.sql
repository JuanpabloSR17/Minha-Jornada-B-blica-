-- Lote S02 (Personagens · Origens): skins principais conquistadas lendo. Aditiva, só dados.
-- Gerada por scripts/skins-add-lot.mjs a partir de docs/skins/plano-lotes.json.
insert into public.skins (id, name, rarity, origin, scripture_ref, season, in_shop, sort_order, variants, character_sex) values
  ('epico_ismael', 'Traje de Ismael', 'epic', 'leitura', 'Gn 21:20', 'enciclopedia', false, 165, '{padrao}', 'masculino'),
  ('epico_esau', 'Traje de Esaú', 'epic', 'leitura', 'Gn 25:25-27', 'enciclopedia', false, 166, '{padrao}', 'masculino'),
  ('epico_juda', 'Traje de Judá', 'epic', 'leitura', 'Gn 38:18; 49:9', 'enciclopedia', false, 167, '{padrao}', 'masculino'),
  ('epico_benjamim', 'Traje de Benjamim', 'epic', 'leitura', 'Gn 44:12', 'enciclopedia', false, 168, '{padrao}', 'masculino'),
  ('epico_calebe', 'Traje de Calebe', 'epic', 'leitura', 'Nm 13:30; Js 14:11', 'enciclopedia', false, 169, '{padrao}', 'masculino'),
  ('epico_eleazar', 'Traje de Eleazar', 'epic', 'leitura', 'Nm 20:28', 'enciclopedia', false, 170, '{padrao}', 'masculino');

insert into public.skin_unlock_rules (skin_id, rule, label, sort_order) values
  ('epico_ismael', '{"chapters":[["GEN",21]]}', 'Ler a história de Ismael (Gn 21:20)', 165),
  ('epico_esau', '{"chapters":[["GEN",25]]}', 'Ler a história de Esaú (Gn 25:25-27)', 166),
  ('epico_juda', '{"chapters":[["GEN",38],["GEN",49]]}', 'Ler a história de Judá (Gn 38:18; 49:9)', 167),
  ('epico_benjamim', '{"chapters":[["GEN",44]]}', 'Ler a história de Benjamim (Gn 44:12)', 168),
  ('epico_calebe', '{"chapters":[["NUM",13],["JOS",14]]}', 'Ler a história de Calebe (Nm 13:30; Js 14:11)', 169),
  ('epico_eleazar', '{"chapters":[["NUM",20]]}', 'Ler a história de Eleazar (Nm 20:28)', 170);

-- concede na hora a quem já cumpriu as regras
do $$
declare r record;
begin
  for r in select distinct d.user_id from private.domain_events d where d.event_type in ('CHAPTER_COMPLETED', 'MILESTONE_REACHED') loop
    perform private.grant_reading_skins(r.user_id);
  end loop;
end $$;
