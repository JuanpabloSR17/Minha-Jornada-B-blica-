-- Lote S12 (Personagens · Profetas): skins principais conquistadas lendo. Aditiva, só dados.
-- Gerada por scripts/skins-add-lot.mjs a partir de docs/skins/plano-lotes.json.
insert into public.skins (id, name, rarity, origin, scripture_ref, season, in_shop, sort_order, variants, character_sex) values
  ('epico_joel', 'Traje de Joel', 'epic', 'leitura', 'Jl 2:28', 'enciclopedia', false, 225, '{padrao}', 'masculino'),
  ('epico_amos', 'Traje de Amós', 'epic', 'leitura', 'Am 7:14-15', 'enciclopedia', false, 226, '{padrao}', 'masculino'),
  ('epico_miqueias', 'Traje de Miqueias', 'epic', 'leitura', 'Mq 6:8', 'enciclopedia', false, 227, '{padrao}', 'masculino'),
  ('epico_habacuque', 'Traje de Habacuque', 'epic', 'leitura', 'Hc 2:1-2', 'enciclopedia', false, 228, '{padrao}', 'masculino'),
  ('epico_ageu', 'Traje de Ageu', 'epic', 'leitura', 'Ag 1:8', 'enciclopedia', false, 229, '{padrao}', 'masculino'),
  ('epico_zacarias', 'Traje de Zacarias', 'epic', 'leitura', 'Zc 4:2-3', 'enciclopedia', false, 230, '{padrao}', 'masculino');

insert into public.skin_unlock_rules (skin_id, rule, label, sort_order) values
  ('epico_joel', '{"chapters":[["JOL",2]]}', 'Ler a história de Joel (Jl 2:28)', 225),
  ('epico_amos', '{"chapters":[["AMO",7]]}', 'Ler a história de Amós (Am 7:14-15)', 226),
  ('epico_miqueias', '{"chapters":[["MIC",6]]}', 'Ler a história de Miqueias (Mq 6:8)', 227),
  ('epico_habacuque', '{"chapters":[["HAB",2]]}', 'Ler a história de Habacuque (Hc 2:1-2)', 228),
  ('epico_ageu', '{"chapters":[["HAG",1]]}', 'Ler a história de Ageu (Ag 1:8)', 229),
  ('epico_zacarias', '{"chapters":[["ZEC",4]]}', 'Ler a história de Zacarias (Zc 4:2-3)', 230);

-- concede na hora a quem já cumpriu as regras
do $$
declare r record;
begin
  for r in select distinct d.user_id from private.domain_events d where d.event_type in ('CHAPTER_COMPLETED', 'MILESTONE_REACHED') loop
    perform private.grant_reading_skins(r.user_id);
  end loop;
end $$;
