-- Lote S11 (Personagens · Sabedoria e Profetas): skins principais conquistadas lendo. Aditiva, só dados.
-- Gerada por scripts/skins-add-lot.mjs a partir de docs/skins/plano-lotes.json.
insert into public.skins (id, name, rarity, origin, scripture_ref, season, in_shop, sort_order, variants, character_sex) values
  ('raro_lemuel', 'Traje de Lemuel', 'rare', 'leitura', 'Pv 31:1', 'enciclopedia', false, 219, '{padrao}', 'masculino'),
  ('raro_filhos_de_cora', 'Traje dos filhos de Corá', 'rare', 'leitura', 'Sl 42 (título)', 'enciclopedia', false, 220, '{padrao}', 'masculino'),
  ('raro_eta_o_ezraita', 'Traje de Etã, o ezraíta', 'rare', 'leitura', 'Sl 89 (título)', 'enciclopedia', false, 221, '{padrao}', 'masculino'),
  ('raro_eliu', 'Traje de Eliú', 'rare', 'leitura', 'Jó 32:2-6', 'enciclopedia', false, 222, '{padrao}', 'masculino'),
  ('epico_sadraque_mesaque_e_abede_nego', 'Traje de Sadraque, Mesaque e Abede-Nego', 'epic', 'leitura', 'Dn 3:21-27', 'enciclopedia', false, 223, '{padrao}', 'masculino'),
  ('epico_oseias', 'Traje de Oseias', 'epic', 'leitura', 'Os 1:1; 14:5', 'enciclopedia', false, 224, '{padrao}', 'masculino');

insert into public.skin_unlock_rules (skin_id, rule, label, sort_order) values
  ('raro_lemuel', '{"chapters":[["PRO",31]]}', 'Ler a história de Lemuel (Pv 31:1)', 219),
  ('raro_filhos_de_cora', '{"chapters":[["PSA",42]]}', 'Ler a história dos filhos de Corá (Sl 42, título)', 220),
  ('raro_eta_o_ezraita', '{"chapters":[["PSA",89]]}', 'Ler a história de Etã, o ezraíta (Sl 89, título)', 221),
  ('raro_eliu', '{"chapters":[["JOB",32]]}', 'Ler a história de Eliú (Jó 32:2-6)', 222),
  ('epico_sadraque_mesaque_e_abede_nego', '{"chapters":[["DAN",3]]}', 'Ler a história de Sadraque, Mesaque e Abede-Nego (Dn 3:21-27)', 223),
  ('epico_oseias', '{"chapters":[["HOS",1],["HOS",14]]}', 'Ler a história de Oseias (Os 1:1; 14:5)', 224);

-- concede na hora a quem já cumpriu as regras
do $$
declare r record;
begin
  for r in select distinct d.user_id from private.domain_events d where d.event_type in ('CHAPTER_COMPLETED', 'MILESTONE_REACHED') loop
    perform private.grant_reading_skins(r.user_id);
  end loop;
end $$;
