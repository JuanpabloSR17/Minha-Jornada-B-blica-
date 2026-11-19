-- Lote P08 (Principais · Vida e Ensino de Jesus): skins principais conquistadas lendo. Aditiva, só dados.
-- Gerada por scripts/skins-add-lot.mjs a partir de docs/skins/plano-lotes.json.
insert into public.skins (id, name, rarity, origin, scripture_ref, season, in_shop, sort_order, variants, character_sex) values
  ('lendario_pedro', 'Vestes de Pedro', 'legendary', 'leitura', 'Mt 4:18; 16:18', 'enciclopedia', false, 142, '{padrao}', 'masculino'),
  ('lendario_joao_o_apostolo', 'Vestes de João, o apóstolo', 'legendary', 'leitura', 'Jo 13:23; 19:27', 'enciclopedia', false, 143, '{padrao}', 'masculino'),
  ('lendario_tiago_filho_de_zebedeu', 'Vestes de Tiago, filho de Zebedeu', 'legendary', 'leitura', 'Mc 1:19; 3:17', 'enciclopedia', false, 144, '{padrao}', 'masculino'),
  ('lendario_andre', 'Vestes de André', 'legendary', 'leitura', 'Jo 1:40-42', 'enciclopedia', false, 145, '{padrao}', 'masculino'),
  ('lendario_mateus', 'Vestes de Mateus', 'legendary', 'leitura', 'Mt 9:9', 'enciclopedia', false, 146, '{padrao}', 'masculino'),
  ('lendario_maria_mae_de_jesus', 'Manto de Maria, mãe de Jesus', 'legendary', 'leitura', 'Lc 1:38; 2:19', 'enciclopedia', false, 147, '{padrao}', 'feminino');

insert into public.skin_unlock_rules (skin_id, rule, label, sort_order) values
  ('lendario_pedro', '{"books":["MAT"]}', 'Concluir o livro de Mateus', 142),
  ('lendario_joao_o_apostolo', '{"books":["JHN"]}', 'Concluir o livro de João', 143),
  ('lendario_tiago_filho_de_zebedeu', '{"books":["MRK"]}', 'Concluir o livro de Marcos', 144),
  ('lendario_andre', '{"chapters":[["JHN",1],["JHN",6],["JHN",12],["MRK",1],["MRK",13]]}', 'Ler a história de André (Jo 1, 6 e 12, Mc 1 e 13)', 145),
  ('lendario_mateus', '{"books":["MAT"]}', 'Concluir o livro de Mateus', 146),
  ('lendario_maria_mae_de_jesus', '{"chapters":[["LUK",1],["LUK",2],["JHN",2],["JHN",19],["ACT",1]]}', 'Ler a história de Maria (Lc 1–2, Jo 2 e 19, At 1)', 147);

-- concede na hora a quem já cumpriu as regras
do $$
declare r record;
begin
  for r in select distinct d.user_id from private.domain_events d where d.event_type in ('CHAPTER_COMPLETED', 'MILESTONE_REACHED') loop
    perform private.grant_reading_skins(r.user_id);
  end loop;
end $$;
