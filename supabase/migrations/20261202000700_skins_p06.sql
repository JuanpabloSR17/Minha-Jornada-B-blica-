-- Lote P06 (Principais · Poesia e Sabedoria e Voz dos Profetas): skins principais conquistadas lendo. Aditiva, só dados.
-- Gerada por scripts/skins-add-lot.mjs a partir de docs/skins/plano-lotes.json.
insert into public.skins (id, name, rarity, origin, scripture_ref, season, in_shop, sort_order, variants, character_sex) values
  ('lendario_jo', 'Vestes de Jó', 'legendary', 'leitura', 'Jó 1:1; 2:8', 'enciclopedia', false, 130, '{padrao}', 'masculino'),
  ('glorioso_jo_restaurado', 'Jó restaurado', 'glorious', 'leitura', 'Jó 42:10-12', 'enciclopedia', false, 131, '{padrao}', 'masculino'),
  ('lendario_isaias', 'Vestes de Isaías', 'legendary', 'leitura', 'Is 6:1', 'enciclopedia', false, 132, '{padrao}', 'masculino'),
  ('lendario_jeremias', 'Vestes de Jeremias', 'legendary', 'leitura', 'Jr 13:1; 27:2', 'enciclopedia', false, 133, '{padrao}', 'masculino'),
  ('lendario_ezequiel', 'Vestes de Ezequiel', 'legendary', 'leitura', 'Ez 2:9-3:3', 'enciclopedia', false, 134, '{padrao}', 'masculino'),
  ('lendario_daniel', 'Vestes de Daniel', 'legendary', 'leitura', 'Dn 1:8-17', 'enciclopedia', false, 135, '{padrao}', 'masculino');

insert into public.skin_unlock_rules (skin_id, rule, label, sort_order) values
  ('lendario_jo', '{"books":["JOB"]}', 'Concluir o livro de Jó', 130),
  ('glorioso_jo_restaurado', '{"books":["JOB","PSA","PRO","ECC","SNG"]}', 'Concluir o mundo Poesia e Sabedoria (5 livros)', 131),
  ('lendario_isaias', '{"books":["ISA"]}', 'Concluir o livro de Isaías', 132),
  ('lendario_jeremias', '{"books":["JER"]}', 'Concluir o livro de Jeremias', 133),
  ('lendario_ezequiel', '{"books":["EZK"]}', 'Concluir o livro de Ezequiel', 134),
  ('lendario_daniel', '{"books":["DAN"]}', 'Concluir o livro de Daniel', 135);

-- concede na hora a quem já cumpriu as regras
do $$
declare r record;
begin
  for r in select distinct d.user_id from private.domain_events d where d.event_type in ('CHAPTER_COMPLETED', 'MILESTONE_REACHED') loop
    perform private.grant_reading_skins(r.user_id);
  end loop;
end $$;
