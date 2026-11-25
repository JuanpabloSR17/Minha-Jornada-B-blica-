-- Lote S18 (Personagens · Evangelhos): skins principais conquistadas lendo. Aditiva, só dados.
-- Gerada por scripts/skins-add-lot.mjs a partir de docs/skins/plano-lotes.json.
insert into public.skins (id, name, rarity, origin, scripture_ref, season, in_shop, sort_order, variants, character_sex) values
  ('raro_tadeu', 'Traje de Tadeu', 'rare', 'leitura', 'Lc 6:16; Jo 14:22', 'enciclopedia', false, 261, '{padrao}', 'masculino'),
  ('raro_simao_o_zelote', 'Traje de Simão, o zelote', 'rare', 'leitura', 'Lc 6:15', 'enciclopedia', false, 262, '{padrao}', 'masculino'),
  ('raro_os_pastores_de_belem', 'Os pastores de Belém', 'rare', 'leitura', 'Lc 2:8-16', 'enciclopedia', false, 263, '{padrao}', 'masculino'),
  ('raro_o_menino_dos_paes_e_peixes', 'O menino dos pães e peixes', 'rare', 'leitura', 'Jo 6:9', 'enciclopedia', false, 264, '{padrao}', 'masculino'),
  ('raro_a_viuva_pobre', 'A viúva pobre', 'rare', 'leitura', 'Mc 12:42-44', 'enciclopedia', false, 265, '{padrao}', 'feminino'),
  ('raro_o_centuriao_de_cafarnaum', 'O centurião de Cafarnaum', 'rare', 'leitura', 'Mt 8:5-10', 'enciclopedia', false, 266, '{padrao}', 'masculino');

insert into public.skin_unlock_rules (skin_id, rule, label, sort_order) values
  ('raro_tadeu', '{"chapters":[["LUK",6],["JHN",14]]}', 'Ler a história de Tadeu (Lc 6:16; Jo 14:22)', 261),
  ('raro_simao_o_zelote', '{"chapters":[["LUK",6]]}', 'Ler a história de Simão, o zelote (Lc 6:15)', 262),
  ('raro_os_pastores_de_belem', '{"chapters":[["LUK",2]]}', 'Ler a história dos pastores de Belém (Lc 2:8-16)', 263),
  ('raro_o_menino_dos_paes_e_peixes', '{"chapters":[["JHN",6]]}', 'Ler a história do menino dos pães e peixes (Jo 6:9)', 264),
  ('raro_a_viuva_pobre', '{"chapters":[["MRK",12]]}', 'Ler a história da viúva pobre (Mc 12:42-44)', 265),
  ('raro_o_centuriao_de_cafarnaum', '{"chapters":[["MAT",8]]}', 'Ler a história do centurião de Cafarnaum (Mt 8:5-10)', 266);

-- concede na hora a quem já cumpriu as regras
do $$
declare r record;
begin
  for r in select distinct d.user_id from private.domain_events d where d.event_type in ('CHAPTER_COMPLETED', 'MILESTONE_REACHED') loop
    perform private.grant_reading_skins(r.user_id);
  end loop;
end $$;
