-- Lote S10 (Personagens · Terra e Reinos e Sabedoria): skins principais conquistadas lendo. Aditiva, só dados.
-- Gerada por scripts/skins-add-lot.mjs a partir de docs/skins/plano-lotes.json.
insert into public.skins (id, name, rarity, origin, scripture_ref, season, in_shop, sort_order, variants, character_sex) values
  ('raro_ido_o_vidente', 'Traje de Ido, o vidente', 'rare', 'leitura', '2 Cr 9:29; Zc 1:1', 'enciclopedia', false, 213, '{padrao}', 'masculino'),
  ('raro_profeta_gade', 'Traje de Profeta Gade', 'rare', 'leitura', '1 Sm 22:5', 'enciclopedia', false, 214, '{padrao}', 'masculino'),
  ('epico_mulher_virtuosa', 'Traje de Mulher virtuosa', 'epic', 'leitura', 'Pv 31:10-31', 'enciclopedia', false, 215, '{padrao}', 'feminino'),
  ('epico_o_pregador', 'O Pregador', 'epic', 'leitura', 'Ec 1:1; 12:9', 'enciclopedia', false, 216, '{padrao}', 'masculino'),
  ('epico_a_amada_de_canticos', 'A amada de Cânticos', 'epic', 'leitura', 'Ct 1:5-6', 'enciclopedia', false, 217, '{padrao}', 'feminino'),
  ('raro_agur', 'Traje de Agur', 'rare', 'leitura', 'Pv 30:1', 'enciclopedia', false, 218, '{padrao}', 'masculino');

insert into public.skin_unlock_rules (skin_id, rule, label, sort_order) values
  ('raro_ido_o_vidente', '{"chapters":[["2CH",9],["ZEC",1]]}', 'Ler a história de Ido, o vidente (2 Cr 9:29; Zc 1:1)', 213),
  ('raro_profeta_gade', '{"chapters":[["1SA",22]]}', 'Ler a história de Profeta Gade (1 Sm 22:5)', 214),
  ('epico_mulher_virtuosa', '{"chapters":[["PRO",31]]}', 'Ler a história de Mulher virtuosa (Pv 31:10-31)', 215),
  ('epico_o_pregador', '{"chapters":[["ECC",1],["ECC",12]]}', 'Ler a história do Pregador (Ec 1:1; 12:9)', 216),
  ('epico_a_amada_de_canticos', '{"chapters":[["SNG",1]]}', 'Ler a história da amada de Cânticos (Ct 1:5-6)', 217),
  ('raro_agur', '{"chapters":[["PRO",30]]}', 'Ler a história de Agur (Pv 30:1)', 218);

-- concede na hora a quem já cumpriu as regras
do $$
declare r record;
begin
  for r in select distinct d.user_id from private.domain_events d where d.event_type in ('CHAPTER_COMPLETED', 'MILESTONE_REACHED') loop
    perform private.grant_reading_skins(r.user_id);
  end loop;
end $$;
