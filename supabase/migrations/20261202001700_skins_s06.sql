-- Lote S06 (Personagens · Terra e Reinos): skins principais conquistadas lendo. Aditiva, só dados.
-- Gerada por scripts/skins-add-lot.mjs a partir de docs/skins/plano-lotes.json.
insert into public.skins (id, name, rarity, origin, scripture_ref, season, in_shop, sort_order, variants, character_sex) values
  ('epico_mardoqueu', 'Traje de Mardoqueu', 'epic', 'leitura', 'Et 8:15', 'enciclopedia', false, 189, '{padrao}', 'masculino'),
  ('epico_zorobabel', 'Traje de Zorobabel', 'epic', 'leitura', 'Ed 3:8; Ag 2:23', 'enciclopedia', false, 190, '{padrao}', 'masculino'),
  ('raro_baraque', 'Traje de Baraque', 'rare', 'leitura', 'Jz 4:14', 'enciclopedia', false, 191, '{padrao}', 'masculino'),
  ('raro_eli', 'Traje de Eli', 'rare', 'leitura', '1 Sm 1:9', 'enciclopedia', false, 192, '{padrao}', 'masculino'),
  ('raro_mical', 'Traje de Mical', 'rare', 'leitura', '1 Sm 19:12', 'enciclopedia', false, 193, '{padrao}', 'feminino'),
  ('raro_joabe', 'Traje de Joabe', 'rare', 'leitura', '2 Sm 2:13', 'enciclopedia', false, 194, '{padrao}', 'masculino');

insert into public.skin_unlock_rules (skin_id, rule, label, sort_order) values
  ('epico_mardoqueu', '{"chapters":[["EST",8]]}', 'Ler a história de Mardoqueu (Et 8:15)', 189),
  ('epico_zorobabel', '{"chapters":[["EZR",3],["HAG",2]]}', 'Ler a história de Zorobabel (Ed 3:8; Ag 2:23)', 190),
  ('raro_baraque', '{"chapters":[["JDG",4]]}', 'Ler a história de Baraque (Jz 4:14)', 191),
  ('raro_eli', '{"chapters":[["1SA",1]]}', 'Ler a história de Eli (1 Sm 1:9)', 192),
  ('raro_mical', '{"chapters":[["1SA",19]]}', 'Ler a história de Mical (1 Sm 19:12)', 193),
  ('raro_joabe', '{"chapters":[["2SA",2]]}', 'Ler a história de Joabe (2 Sm 2:13)', 194);

-- concede na hora a quem já cumpriu as regras
do $$
declare r record;
begin
  for r in select distinct d.user_id from private.domain_events d where d.event_type in ('CHAPTER_COMPLETED', 'MILESTONE_REACHED') loop
    perform private.grant_reading_skins(r.user_id);
  end loop;
end $$;
