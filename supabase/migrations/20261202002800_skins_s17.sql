-- Lote S17 (Personagens · Evangelhos): skins principais conquistadas lendo. Aditiva, só dados.
-- Gerada por scripts/skins-add-lot.mjs a partir de docs/skins/plano-lotes.json.
insert into public.skins (id, name, rarity, origin, scripture_ref, season, in_shop, sort_order, variants, character_sex) values
  ('epico_ana_a_profetisa', 'Traje de Ana, a profetisa', 'epic', 'leitura', 'Lc 2:36-38', 'enciclopedia', false, 255, '{padrao}', 'feminino'),
  ('epico_bartimeu', 'Traje de Bartimeu', 'epic', 'leitura', 'Mc 10:46-50', 'enciclopedia', false, 256, '{padrao}', 'masculino'),
  ('raro_filipe', 'Traje de Filipe', 'rare', 'leitura', 'Jo 1:43-46', 'enciclopedia', false, 257, '{padrao}', 'masculino'),
  ('raro_natanael', 'Traje de Natanael', 'rare', 'leitura', 'Jo 1:48', 'enciclopedia', false, 258, '{padrao}', 'masculino'),
  ('raro_tome', 'Traje de Tomé', 'rare', 'leitura', 'Jo 20:27-28', 'enciclopedia', false, 259, '{padrao}', 'masculino'),
  ('raro_tiago_filho_de_alfeu', 'Traje de Tiago, filho de Alfeu', 'rare', 'leitura', 'Mc 3:18', 'enciclopedia', false, 260, '{padrao}', 'masculino');

insert into public.skin_unlock_rules (skin_id, rule, label, sort_order) values
  ('epico_ana_a_profetisa', '{"chapters":[["LUK",2]]}', 'Ler a história de Ana, a profetisa (Lc 2:36-38)', 255),
  ('epico_bartimeu', '{"chapters":[["MRK",10]]}', 'Ler a história de Bartimeu (Mc 10:46-50)', 256),
  ('raro_filipe', '{"chapters":[["JHN",1]]}', 'Ler a história de Filipe (Jo 1:43-46)', 257),
  ('raro_natanael', '{"chapters":[["JHN",1]]}', 'Ler a história de Natanael (Jo 1:48)', 258),
  ('raro_tome', '{"chapters":[["JHN",20]]}', 'Ler a história de Tomé (Jo 20:27-28)', 259),
  ('raro_tiago_filho_de_alfeu', '{"chapters":[["MRK",3]]}', 'Ler a história de Tiago, filho de Alfeu (Mc 3:18)', 260);

-- concede na hora a quem já cumpriu as regras
do $$
declare r record;
begin
  for r in select distinct d.user_id from private.domain_events d where d.event_type in ('CHAPTER_COMPLETED', 'MILESTONE_REACHED') loop
    perform private.grant_reading_skins(r.user_id);
  end loop;
end $$;
