-- Lote P07 (Principais · Voz dos Profetas e Vida e Ensino de Jesus): skins principais conquistadas lendo. Aditiva, só dados.
-- Gerada por scripts/skins-add-lot.mjs a partir de docs/skins/plano-lotes.json.
insert into public.skins (id, name, rarity, origin, scripture_ref, season, in_shop, sort_order, variants, character_sex) values
  ('lendario_jonas', 'Vestes de Jonas', 'legendary', 'leitura', 'Jn 1:3', 'enciclopedia', false, 136, '{padrao}', 'masculino'),
  ('glorioso_daniel_na_cova_dos_leoes', 'Daniel na cova dos leões', 'glorious', 'leitura', 'Dn 6:22', 'enciclopedia', false, 137, '{padrao}', 'masculino'),
  ('glorioso_isaias_e_a_brasa_do_altar', 'Isaías e a brasa do altar', 'glorious', 'leitura', 'Is 6:6-8', 'enciclopedia', false, 138, '{padrao}', 'masculino'),
  ('glorioso_jonas_e_o_grande_peixe', 'Jonas e o grande peixe', 'glorious', 'leitura', 'Jn 2:10', 'enciclopedia', false, 139, '{padrao}', 'masculino'),
  ('glorioso_ezequiel_no_vale_de_ossos', 'Ezequiel no vale de ossos', 'glorious', 'leitura', 'Ez 37:1-10', 'enciclopedia', false, 140, '{padrao}', 'masculino'),
  ('lendario_joao_batista', 'Vestes de João Batista', 'legendary', 'leitura', 'Mt 3:4', 'enciclopedia', false, 141, '{padrao}', 'masculino');

insert into public.skin_unlock_rules (skin_id, rule, label, sort_order) values
  ('lendario_jonas', '{"books":["JON"]}', 'Concluir o livro de Jonas', 136),
  ('glorioso_daniel_na_cova_dos_leoes', '{"books":["ISA","JER","LAM","EZK","DAN","HOS","JOL","AMO","OBA","JON","MIC","NAM","HAB","ZEP","HAG","ZEC","MAL"]}', 'Concluir o mundo Voz dos Profetas (17 livros)', 137),
  ('glorioso_isaias_e_a_brasa_do_altar', '{"books":["ISA","JER","LAM","EZK","DAN","HOS","JOL","AMO","OBA","JON","MIC","NAM","HAB","ZEP","HAG","ZEC","MAL"]}', 'Concluir o mundo Voz dos Profetas (17 livros)', 138),
  ('glorioso_jonas_e_o_grande_peixe', '{"books":["ISA","JER","LAM","EZK","DAN","HOS","JOL","AMO","OBA","JON","MIC","NAM","HAB","ZEP","HAG","ZEC","MAL"]}', 'Concluir o mundo Voz dos Profetas (17 livros)', 139),
  ('glorioso_ezequiel_no_vale_de_ossos', '{"books":["ISA","JER","LAM","EZK","DAN","HOS","JOL","AMO","OBA","JON","MIC","NAM","HAB","ZEP","HAG","ZEC","MAL"]}', 'Concluir o mundo Voz dos Profetas (17 livros)', 140),
  ('lendario_joao_batista', '{"chapters":[["LUK",1],["LUK",3],["MAT",3],["MAT",11],["MAT",14],["JHN",1]]}', 'Ler a história de João Batista (Lc 1 e 3, Mt 3, 11 e 14, Jo 1)', 141);

-- concede na hora a quem já cumpriu as regras
do $$
declare r record;
begin
  for r in select distinct d.user_id from private.domain_events d where d.event_type in ('CHAPTER_COMPLETED', 'MILESTONE_REACHED') loop
    perform private.grant_reading_skins(r.user_id);
  end loop;
end $$;
