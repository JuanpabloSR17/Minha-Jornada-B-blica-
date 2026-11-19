-- Lote P10 (Principais · Caminhos da Igreja e Visão da Nova Criação): skins principais conquistadas lendo. Aditiva, só dados.
-- Gerada por scripts/skins-add-lot.mjs a partir de docs/skins/plano-lotes.json.
insert into public.skins (id, name, rarity, origin, scripture_ref, season, in_shop, sort_order, variants, character_sex) values
  ('lendario_paulo', 'Vestes de Paulo', 'legendary', 'leitura', 'At 9:15; 2 Tm 4:13', 'enciclopedia', false, 154, '{padrao}', 'masculino'),
  ('glorioso_paulo_no_caminho_de_damasco', 'Paulo no caminho de Damasco', 'glorious', 'leitura', 'At 9:3-4', 'enciclopedia', false, 155, '{padrao}', 'masculino'),
  ('glorioso_pedro_no_pentecostes', 'Pedro no Pentecostes', 'glorious', 'leitura', 'At 2:3, 14', 'enciclopedia', false, 156, '{padrao}', 'masculino'),
  ('glorioso_estevao_com_rosto_de_anjo', 'Estêvão com rosto de anjo', 'glorious', 'leitura', 'At 6:15; 7:56', 'enciclopedia', false, 157, '{padrao}', 'masculino'),
  ('glorioso_joao_em_patmos', 'João em Patmos', 'glorious', 'leitura', 'Ap 1:9-11', 'enciclopedia', false, 158, '{padrao}', 'masculino');

insert into public.skin_unlock_rules (skin_id, rule, label, sort_order) values
  ('lendario_paulo', '{"chapters":[["ACT",9],["ACT",10],["ACT",11],["ACT",12],["ACT",13],["ACT",14],["ACT",15],["ACT",16],["ACT",17],["ACT",18],["ACT",19],["ACT",20],["ACT",21],["ACT",22],["ACT",23],["ACT",24],["ACT",25],["ACT",26],["ACT",27],["ACT",28]]}', 'Ler a história de Paulo (Atos 9–28)', 154),
  ('glorioso_paulo_no_caminho_de_damasco', '{"books":["ACT","ROM","1CO","2CO","GAL","EPH","PHP","COL","1TH","2TH","1TI","2TI","TIT","PHM","HEB","JAS","1PE","2PE","1JN","2JN","3JN","JUD"]}', 'Concluir o mundo Caminhos da Igreja (22 livros)', 155),
  ('glorioso_pedro_no_pentecostes', '{"books":["ACT","ROM","1CO","2CO","GAL","EPH","PHP","COL","1TH","2TH","1TI","2TI","TIT","PHM","HEB","JAS","1PE","2PE","1JN","2JN","3JN","JUD"]}', 'Concluir o mundo Caminhos da Igreja (22 livros)', 156),
  ('glorioso_estevao_com_rosto_de_anjo', '{"books":["ACT","ROM","1CO","2CO","GAL","EPH","PHP","COL","1TH","2TH","1TI","2TI","TIT","PHM","HEB","JAS","1PE","2PE","1JN","2JN","3JN","JUD"]}', 'Concluir o mundo Caminhos da Igreja (22 livros)', 157),
  ('glorioso_joao_em_patmos', '{"books":["REV"]}', 'Concluir o mundo Visão da Nova Criação (1 livro)', 158);

-- concede na hora a quem já cumpriu as regras
do $$
declare r record;
begin
  for r in select distinct d.user_id from private.domain_events d where d.event_type in ('CHAPTER_COMPLETED', 'MILESTONE_REACHED') loop
    perform private.grant_reading_skins(r.user_id);
  end loop;
end $$;
