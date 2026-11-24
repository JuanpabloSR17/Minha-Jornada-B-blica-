-- Lote S07 (Personagens · Terra e Reinos): skins principais conquistadas lendo. Aditiva, só dados.
-- Gerada por scripts/skins-add-lot.mjs a partir de docs/skins/plano-lotes.json.
insert into public.skins (id, name, rarity, origin, scripture_ref, season, in_shop, sort_order, variants, character_sex) values
  ('raro_mefibosete', 'Traje de Mefibosete', 'rare', 'leitura', '2 Sm 9:7', 'enciclopedia', false, 195, '{padrao}', 'masculino'),
  ('raro_urias', 'Traje de Urias', 'rare', 'leitura', '2 Sm 11:11', 'enciclopedia', false, 196, '{padrao}', 'masculino'),
  ('raro_isai', 'Traje de Isaí', 'rare', 'leitura', '1 Sm 16:10-11', 'enciclopedia', false, 197, '{padrao}', 'masculino'),
  ('raro_viuva_de_sarepta', 'Traje de Viúva de Sarepta', 'rare', 'leitura', '1 Rs 17:12-16', 'enciclopedia', false, 198, '{padrao}', 'feminino'),
  ('raro_menina_serva_de_naama', 'Traje de Menina serva de Naamã', 'rare', 'leitura', '2 Rs 5:2-3', 'enciclopedia', false, 199, '{padrao}', 'feminino'),
  ('raro_sunamita', 'Traje de Sunamita', 'rare', 'leitura', '2 Rs 4:8-10', 'enciclopedia', false, 200, '{padrao}', 'feminino');

insert into public.skin_unlock_rules (skin_id, rule, label, sort_order) values
  ('raro_mefibosete', '{"chapters":[["2SA",9]]}', 'Ler a história de Mefibosete (2 Sm 9:7)', 195),
  ('raro_urias', '{"chapters":[["2SA",11]]}', 'Ler a história de Urias (2 Sm 11:11)', 196),
  ('raro_isai', '{"chapters":[["1SA",16]]}', 'Ler a história de Isaí (1 Sm 16:10-11)', 197),
  ('raro_viuva_de_sarepta', '{"chapters":[["1KI",17]]}', 'Ler a história de Viúva de Sarepta (1 Rs 17:12-16)', 198),
  ('raro_menina_serva_de_naama', '{"chapters":[["2KI",5]]}', 'Ler a história de Menina serva de Naamã (2 Rs 5:2-3)', 199),
  ('raro_sunamita', '{"chapters":[["2KI",4]]}', 'Ler a história de Sunamita (2 Rs 4:8-10)', 200);

-- concede na hora a quem já cumpriu as regras
do $$
declare r record;
begin
  for r in select distinct d.user_id from private.domain_events d where d.event_type in ('CHAPTER_COMPLETED', 'MILESTONE_REACHED') loop
    perform private.grant_reading_skins(r.user_id);
  end loop;
end $$;
