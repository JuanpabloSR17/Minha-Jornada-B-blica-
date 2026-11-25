-- Lote S14 (Personagens · Profetas e Evangelhos): skins principais conquistadas lendo. Aditiva, só dados.
-- Gerada por scripts/skins-add-lot.mjs a partir de docs/skins/plano-lotes.json.
insert into public.skins (id, name, rarity, origin, scripture_ref, season, in_shop, sort_order, variants, character_sex) values
  ('raro_os_recabitas', 'Os recabitas', 'rare', 'leitura', 'Jr 35:6-7', 'enciclopedia', false, 237, '{padrao}', 'masculino'),
  ('raro_dario_o_medo', 'Traje de Dario, o medo', 'rare', 'leitura', 'Dn 6:25-26', 'enciclopedia', false, 238, '{padrao}', 'masculino'),
  ('raro_hananias_misael_e_azarias', 'Traje de Hananias, Misael e Azarias', 'rare', 'leitura', 'Dn 1:6-7', 'enciclopedia', false, 239, '{padrao}', 'masculino'),
  ('raro_aspenaz', 'Traje de Aspenaz', 'rare', 'leitura', 'Dn 1:9', 'enciclopedia', false, 240, '{padrao}', 'masculino'),
  ('raro_gemarias', 'Traje de Gemarias', 'rare', 'leitura', 'Jr 36:10-12', 'enciclopedia', false, 241, '{padrao}', 'masculino'),
  ('epico_marta', 'Traje de Marta', 'epic', 'leitura', 'Lc 10:40; Jo 11:20-27', 'enciclopedia', false, 242, '{padrao}', 'feminino');

insert into public.skin_unlock_rules (skin_id, rule, label, sort_order) values
  ('raro_os_recabitas', '{"chapters":[["JER",35]]}', 'Ler a história dos recabitas (Jr 35:6-7)', 237),
  ('raro_dario_o_medo', '{"chapters":[["DAN",6]]}', 'Ler a história de Dario, o medo (Dn 6:25-26)', 238),
  ('raro_hananias_misael_e_azarias', '{"chapters":[["DAN",1]]}', 'Ler a história de Hananias, Misael e Azarias (Dn 1:6-7)', 239),
  ('raro_aspenaz', '{"chapters":[["DAN",1]]}', 'Ler a história de Aspenaz (Dn 1:9)', 240),
  ('raro_gemarias', '{"chapters":[["JER",36]]}', 'Ler a história de Gemarias (Jr 36:10-12)', 241),
  ('epico_marta', '{"chapters":[["LUK",10],["JHN",11]]}', 'Ler a história de Marta (Lc 10:40; Jo 11:20-27)', 242);

-- concede na hora a quem já cumpriu as regras
do $$
declare r record;
begin
  for r in select distinct d.user_id from private.domain_events d where d.event_type in ('CHAPTER_COMPLETED', 'MILESTONE_REACHED') loop
    perform private.grant_reading_skins(r.user_id);
  end loop;
end $$;
