-- Lote P09 (Principais · Vida e Ensino de Jesus): skins principais conquistadas lendo. Aditiva, só dados.
-- Gerada por scripts/skins-add-lot.mjs a partir de docs/skins/plano-lotes.json.
insert into public.skins (id, name, rarity, origin, scripture_ref, season, in_shop, sort_order, variants, character_sex) values
  ('lendario_maria_madalena', 'Manto de Maria Madalena', 'legendary', 'leitura', 'Lc 8:2; Mc 16:1', 'enciclopedia', false, 148, '{padrao}', 'feminino'),
  ('lendario_jose_de_nazare', 'Vestes de José de Nazaré', 'legendary', 'leitura', 'Mt 1:24; 13:55', 'enciclopedia', false, 149, '{padrao}', 'masculino'),
  ('glorioso_pedro_sobre_as_aguas', 'Pedro sobre as águas', 'glorious', 'leitura', 'Mt 14:29', 'enciclopedia', false, 150, '{padrao}', 'masculino'),
  ('glorioso_joao_batista_no_jordao', 'João Batista no Jordão', 'glorious', 'leitura', 'Mt 3:13-16', 'enciclopedia', false, 151, '{padrao}', 'masculino'),
  ('glorioso_maria_madalena_na_manha_da_ressurreicao', 'Maria Madalena na manhã da ressurreição', 'glorious', 'leitura', 'Jo 20:16', 'enciclopedia', false, 152, '{padrao}', 'feminino'),
  ('glorioso_os_magos_e_a_estrela', 'Os magos e a estrela', 'glorious', 'leitura', 'Mt 2:9-11', 'enciclopedia', false, 153, '{padrao}', 'masculino');

insert into public.skin_unlock_rules (skin_id, rule, label, sort_order) values
  ('lendario_maria_madalena', '{"chapters":[["LUK",8],["MRK",15],["MRK",16],["JHN",19],["JHN",20]]}', 'Ler a história de Maria Madalena (Lc 8, Mc 15–16, Jo 19–20)', 148),
  ('lendario_jose_de_nazare', '{"chapters":[["MAT",1],["MAT",2],["LUK",2]]}', 'Ler a história de José de Nazaré (Mt 1–2, Lc 2)', 149),
  ('glorioso_pedro_sobre_as_aguas', '{"books":["MAT","MRK","LUK","JHN"]}', 'Concluir o mundo Vida e Ensino de Jesus (4 livros)', 150),
  ('glorioso_joao_batista_no_jordao', '{"books":["MAT","MRK","LUK","JHN"]}', 'Concluir o mundo Vida e Ensino de Jesus (4 livros)', 151),
  ('glorioso_maria_madalena_na_manha_da_ressurreicao', '{"books":["MAT","MRK","LUK","JHN"]}', 'Concluir o mundo Vida e Ensino de Jesus (4 livros)', 152),
  ('glorioso_os_magos_e_a_estrela', '{"books":["MAT","MRK","LUK","JHN"]}', 'Concluir o mundo Vida e Ensino de Jesus (4 livros)', 153);

-- concede na hora a quem já cumpriu as regras
do $$
declare r record;
begin
  for r in select distinct d.user_id from private.domain_events d where d.event_type in ('CHAPTER_COMPLETED', 'MILESTONE_REACHED') loop
    perform private.grant_reading_skins(r.user_id);
  end loop;
end $$;
