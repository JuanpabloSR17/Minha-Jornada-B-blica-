-- Lote S04 (Personagens · Origens e Terra e Reinos): skins principais conquistadas lendo. Aditiva, só dados.
-- Gerada por scripts/skins-add-lot.mjs a partir de docs/skins/plano-lotes.json.
insert into public.skins (id, name, rarity, origin, scripture_ref, season, in_shop, sort_order, variants, character_sex) values
  ('raro_matusalem', 'Traje de Matusalém', 'rare', 'leitura', 'Gn 5:27', 'enciclopedia', false, 177, '{padrao}', 'masculino'),
  ('epico_noemi', 'Traje de Noemi', 'epic', 'leitura', 'Rt 1:20-22', 'enciclopedia', false, 178, '{padrao}', 'feminino'),
  ('epico_boaz', 'Traje de Boaz', 'epic', 'leitura', 'Rt 2:4; 3:15', 'enciclopedia', false, 179, '{padrao}', 'masculino'),
  ('epico_raabe', 'Traje de Raabe', 'epic', 'leitura', 'Js 2:18', 'enciclopedia', false, 180, '{padrao}', 'feminino'),
  ('epico_ana', 'Traje de Ana', 'epic', 'leitura', '1 Sm 1:10-11; 2:19', 'enciclopedia', false, 181, '{padrao}', 'feminino'),
  ('epico_jonatas', 'Traje de Jônatas', 'epic', 'leitura', '1 Sm 18:4', 'enciclopedia', false, 182, '{padrao}', 'masculino');

insert into public.skin_unlock_rules (skin_id, rule, label, sort_order) values
  ('raro_matusalem', '{"chapters":[["GEN",5]]}', 'Ler a história de Matusalém (Gn 5:27)', 177),
  ('epico_noemi', '{"chapters":[["RUT",1]]}', 'Ler a história de Noemi (Rt 1:20-22)', 178),
  ('epico_boaz', '{"chapters":[["RUT",2],["RUT",3]]}', 'Ler a história de Boaz (Rt 2:4; 3:15)', 179),
  ('epico_raabe', '{"chapters":[["JOS",2]]}', 'Ler a história de Raabe (Js 2:18)', 180),
  ('epico_ana', '{"chapters":[["1SA",1],["1SA",2]]}', 'Ler a história de Ana (1 Sm 1:10-11; 2:19)', 181),
  ('epico_jonatas', '{"chapters":[["1SA",18]]}', 'Ler a história de Jônatas (1 Sm 18:4)', 182);

-- concede na hora a quem já cumpriu as regras
do $$
declare r record;
begin
  for r in select distinct d.user_id from private.domain_events d where d.event_type in ('CHAPTER_COMPLETED', 'MILESTONE_REACHED') loop
    perform private.grant_reading_skins(r.user_id);
  end loop;
end $$;
