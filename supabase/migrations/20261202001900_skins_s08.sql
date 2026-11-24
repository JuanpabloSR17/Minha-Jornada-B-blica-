-- Lote S08 (Personagens · Terra e Reinos): skins principais conquistadas lendo. Aditiva, só dados.
-- Gerada por scripts/skins-add-lot.mjs a partir de docs/skins/plano-lotes.json.
insert into public.skins (id, name, rarity, origin, scripture_ref, season, in_shop, sort_order, variants, character_sex) values
  ('raro_jeosafa', 'Traje de Jeosafá', 'rare', 'leitura', '2 Cr 20:21', 'enciclopedia', false, 201, '{padrao}', 'masculino'),
  ('raro_joas_menino_rei', 'Traje de Joás, menino rei', 'rare', 'leitura', '2 Rs 11:12', 'enciclopedia', false, 202, '{padrao}', 'masculino'),
  ('raro_hulda_profetisa', 'Traje de Hulda, profetisa', 'rare', 'leitura', '2 Rs 22:14', 'enciclopedia', false, 203, '{padrao}', 'feminino'),
  ('raro_zadoque', 'Traje de Zadoque', 'rare', 'leitura', '1 Rs 1:39', 'enciclopedia', false, 204, '{padrao}', 'masculino'),
  ('raro_benaia', 'Traje de Benaia', 'rare', 'leitura', '2 Sm 23:20', 'enciclopedia', false, 205, '{padrao}', 'masculino'),
  ('raro_os_valentes_de_davi', 'Os valentes de Davi', 'rare', 'leitura', '2 Sm 23:8-39', 'enciclopedia', false, 206, '{padrao}', 'masculino');

insert into public.skin_unlock_rules (skin_id, rule, label, sort_order) values
  ('raro_jeosafa', '{"chapters":[["2CH",20]]}', 'Ler a história de Jeosafá (2 Cr 20:21)', 201),
  ('raro_joas_menino_rei', '{"chapters":[["2KI",11]]}', 'Ler a história de Joás, menino rei (2 Rs 11:12)', 202),
  ('raro_hulda_profetisa', '{"chapters":[["2KI",22]]}', 'Ler a história de Hulda, profetisa (2 Rs 22:14)', 203),
  ('raro_zadoque', '{"chapters":[["1KI",1]]}', 'Ler a história de Zadoque (1 Rs 1:39)', 204),
  ('raro_benaia', '{"chapters":[["2SA",23]]}', 'Ler a história de Benaia (2 Sm 23:20)', 205),
  ('raro_os_valentes_de_davi', '{"chapters":[["2SA",23]]}', 'Ler a história dos valentes de Davi (2 Sm 23:8-39)', 206);

-- concede na hora a quem já cumpriu as regras
do $$
declare r record;
begin
  for r in select distinct d.user_id from private.domain_events d where d.event_type in ('CHAPTER_COMPLETED', 'MILESTONE_REACHED') loop
    perform private.grant_reading_skins(r.user_id);
  end loop;
end $$;
