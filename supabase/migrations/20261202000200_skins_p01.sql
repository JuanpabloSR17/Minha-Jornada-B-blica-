-- Lote P01 (Principais · Origens e Aliança): skins principais conquistadas lendo. Aditiva, só dados.
-- Gerada por scripts/skins-add-lot.mjs a partir de docs/skins/plano-lotes.json.
insert into public.skins (id, name, rarity, origin, scripture_ref, season, in_shop, sort_order, variants, character_sex) values
  ('lendario_adao', 'Vestes de Adão', 'legendary', 'leitura', 'Gn 2:15; 3:21', 'enciclopedia', false, 100, '{padrao}', 'masculino'),
  ('lendario_eva', 'Vestes de Eva', 'legendary', 'leitura', 'Gn 3:20-21', 'enciclopedia', false, 101, '{padrao}', 'feminino'),
  ('lendario_noe', 'Vestes de Noé', 'legendary', 'leitura', 'Gn 6:14', 'enciclopedia', false, 102, '{padrao}', 'masculino'),
  ('lendario_abraao', 'Vestes de Abraão', 'legendary', 'leitura', 'Gn 12:1', 'enciclopedia', false, 103, '{padrao}', 'masculino'),
  ('lendario_sara', 'Vestes de Sara', 'legendary', 'leitura', 'Gn 18:6', 'enciclopedia', false, 104, '{padrao}', 'feminino'),
  ('lendario_isaque', 'Vestes de Isaque', 'legendary', 'leitura', 'Gn 26:18', 'enciclopedia', false, 105, '{padrao}', 'masculino');

insert into public.skin_unlock_rules (skin_id, rule, label, sort_order) values
  ('lendario_adao', '{"chapters":[["GEN",1],["GEN",2],["GEN",3],["GEN",4],["GEN",5]]}', 'Ler a história de Adão (Gênesis 1–5)', 100),
  ('lendario_eva', '{"chapters":[["GEN",1],["GEN",2],["GEN",3],["GEN",4]]}', 'Ler a história de Eva (Gênesis 1–4)', 101),
  ('lendario_noe', '{"chapters":[["GEN",6],["GEN",7],["GEN",8],["GEN",9]]}', 'Ler a história de Noé (Gênesis 6–9)', 102),
  ('lendario_abraao', '{"chapters":[["GEN",12],["GEN",13],["GEN",14],["GEN",15],["GEN",16],["GEN",17],["GEN",18],["GEN",19],["GEN",20],["GEN",21],["GEN",22],["GEN",23],["GEN",24],["GEN",25]]}', 'Ler a história de Abraão (Gênesis 12–25)', 103),
  ('lendario_sara', '{"chapters":[["GEN",12],["GEN",13],["GEN",14],["GEN",15],["GEN",16],["GEN",17],["GEN",18],["GEN",19],["GEN",20],["GEN",21],["GEN",22],["GEN",23]]}', 'Ler a história de Sara (Gênesis 12–23)', 104),
  ('lendario_isaque', '{"chapters":[["GEN",21],["GEN",22],["GEN",23],["GEN",24],["GEN",25],["GEN",26],["GEN",27],["GEN",28]]}', 'Ler a história de Isaque (Gênesis 21–28)', 105);

-- concede na hora a quem já cumpriu as regras
do $$
declare r record;
begin
  for r in select distinct d.user_id from private.domain_events d where d.event_type in ('CHAPTER_COMPLETED', 'MILESTONE_REACHED') loop
    perform private.grant_reading_skins(r.user_id);
  end loop;
end $$;
