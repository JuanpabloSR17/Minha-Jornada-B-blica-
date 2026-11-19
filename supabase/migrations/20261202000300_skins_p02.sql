-- Lote P02 (Principais · Origens e Aliança): skins principais conquistadas lendo. Aditiva, só dados.
-- Gerada por scripts/skins-add-lot.mjs a partir de docs/skins/plano-lotes.json.
insert into public.skins (id, name, rarity, origin, scripture_ref, season, in_shop, sort_order, variants, character_sex) values
  ('lendario_rebeca', 'Vestes de Rebeca', 'legendary', 'leitura', 'Gn 24:15-16', 'enciclopedia', false, 106, '{padrao}', 'feminino'),
  ('lendario_jaco', 'Vestes de Jacó', 'legendary', 'leitura', 'Gn 32:28', 'enciclopedia', false, 107, '{padrao}', 'masculino'),
  ('lendario_jose', 'Vestes de José', 'legendary', 'leitura', 'Gn 37:3', 'enciclopedia', false, 108, '{padrao}', 'masculino'),
  ('glorioso_jose_governador_do_egito', 'José, governador do Egito', 'glorious', 'leitura', 'Gn 41:42', 'enciclopedia', false, 109, '{padrao}', 'masculino'),
  ('glorioso_abraao_sob_as_estrelas', 'Abraão sob as estrelas', 'glorious', 'leitura', 'Gn 15:5', 'enciclopedia', false, 110, '{padrao}', 'masculino'),
  ('glorioso_noe_e_o_arco_iris', 'Noé e o arco-íris', 'glorious', 'leitura', 'Gn 9:13', 'enciclopedia', false, 111, '{padrao}', 'masculino');

insert into public.skin_unlock_rules (skin_id, rule, label, sort_order) values
  ('lendario_rebeca', '{"chapters":[["GEN",24],["GEN",25],["GEN",26],["GEN",27]]}', 'Ler a história de Rebeca (Gênesis 24–27)', 106),
  ('lendario_jaco', '{"chapters":[["GEN",25],["GEN",26],["GEN",27],["GEN",28],["GEN",29],["GEN",30],["GEN",31],["GEN",32],["GEN",33],["GEN",34],["GEN",35]]}', 'Ler a história de Jacó (Gênesis 25–35)', 107),
  ('lendario_jose', '{"chapters":[["GEN",37],["GEN",38],["GEN",39],["GEN",40],["GEN",41],["GEN",42],["GEN",43],["GEN",44],["GEN",45],["GEN",46],["GEN",47],["GEN",48],["GEN",49],["GEN",50]]}', 'Ler a história de José (Gênesis 37–50)', 108),
  ('glorioso_jose_governador_do_egito', '{"books":["GEN","EXO","LEV","NUM","DEU"]}', 'Concluir o mundo Origens e Aliança (5 livros)', 109),
  ('glorioso_abraao_sob_as_estrelas', '{"books":["GEN","EXO","LEV","NUM","DEU"]}', 'Concluir o mundo Origens e Aliança (5 livros)', 110),
  ('glorioso_noe_e_o_arco_iris', '{"books":["GEN","EXO","LEV","NUM","DEU"]}', 'Concluir o mundo Origens e Aliança (5 livros)', 111);

-- concede na hora a quem já cumpriu as regras
do $$
declare r record;
begin
  for r in select distinct d.user_id from private.domain_events d where d.event_type in ('CHAPTER_COMPLETED', 'MILESTONE_REACHED') loop
    perform private.grant_reading_skins(r.user_id);
  end loop;
end $$;
