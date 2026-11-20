-- Lote S03 (Personagens · Origens): skins principais conquistadas lendo. Aditiva, só dados.
-- Gerada por scripts/skins-add-lot.mjs a partir de docs/skins/plano-lotes.json.
insert into public.skins (id, name, rarity, origin, scripture_ref, season, in_shop, sort_order, variants, character_sex) values
  ('epico_fineias', 'Traje de Finéias', 'epic', 'leitura', 'Nm 25:11', 'enciclopedia', false, 171, '{padrao}', 'masculino'),
  ('raro_labao', 'Traje de Labão', 'rare', 'leitura', 'Gn 29:13', 'enciclopedia', false, 172, '{padrao}', 'masculino'),
  ('raro_ruben', 'Traje de Rúben', 'rare', 'leitura', 'Gn 37:22', 'enciclopedia', false, 173, '{padrao}', 'masculino'),
  ('raro_eliezer_servo_de_abraao', 'Traje de Eliézer, servo de Abraão', 'rare', 'leitura', 'Gn 24:2-10', 'enciclopedia', false, 174, '{padrao}', 'masculino'),
  ('raro_filhas_de_zelofeade', 'Traje das filhas de Zelofeade', 'rare', 'leitura', 'Nm 27:1-7', 'enciclopedia', false, 175, '{padrao}', 'feminino'),
  ('raro_debora_ama_de_rebeca', 'Traje de Débora, ama de Rebeca', 'rare', 'leitura', 'Gn 35:8', 'enciclopedia', false, 176, '{padrao}', 'feminino');

insert into public.skin_unlock_rules (skin_id, rule, label, sort_order) values
  ('epico_fineias', '{"chapters":[["NUM",25]]}', 'Ler a história de Finéias (Nm 25:11)', 171),
  ('raro_labao', '{"chapters":[["GEN",29]]}', 'Ler a história de Labão (Gn 29:13)', 172),
  ('raro_ruben', '{"chapters":[["GEN",37]]}', 'Ler a história de Rúben (Gn 37:22)', 173),
  ('raro_eliezer_servo_de_abraao', '{"chapters":[["GEN",24]]}', 'Ler a história de Eliézer, servo de Abraão (Gn 24:2-10)', 174),
  ('raro_filhas_de_zelofeade', '{"chapters":[["NUM",27]]}', 'Ler a história das filhas de Zelofeade (Nm 27:1-7)', 175),
  ('raro_debora_ama_de_rebeca', '{"chapters":[["GEN",35]]}', 'Ler a história de Débora, ama de Rebeca (Gn 35:8)', 176);

-- concede na hora a quem já cumpriu as regras
do $$
declare r record;
begin
  for r in select distinct d.user_id from private.domain_events d where d.event_type in ('CHAPTER_COMPLETED', 'MILESTONE_REACHED') loop
    perform private.grant_reading_skins(r.user_id);
  end loop;
end $$;
