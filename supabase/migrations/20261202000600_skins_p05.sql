-- Lote P05 (Principais · Terra e Reinos): skins principais conquistadas lendo. Aditiva, só dados.
-- Gerada por scripts/skins-add-lot.mjs a partir de docs/skins/plano-lotes.json.
insert into public.skins (id, name, rarity, origin, scripture_ref, season, in_shop, sort_order, variants, character_sex) values
  ('lendario_ester', 'Vestes de Ester', 'legendary', 'leitura', 'Et 2:17', 'enciclopedia', false, 124, '{padrao}', 'feminino'),
  ('glorioso_davi_diante_de_golias', 'Davi diante de Golias', 'glorious', 'leitura', '1 Sm 17:40', 'enciclopedia', false, 125, '{padrao}', 'masculino'),
  ('glorioso_elias_no_carro_de_fogo', 'Elias no carro de fogo', 'glorious', 'leitura', '2 Rs 2:11', 'enciclopedia', false, 126, '{padrao}', 'masculino'),
  ('glorioso_ester_diante_do_rei', 'Ester diante do rei', 'glorious', 'leitura', 'Et 5:1-2', 'enciclopedia', false, 127, '{padrao}', 'feminino'),
  ('glorioso_josue_diante_das_muralhas', 'Josué diante das muralhas', 'glorious', 'leitura', 'Js 6:20', 'enciclopedia', false, 128, '{padrao}', 'masculino'),
  ('glorioso_salomao_no_trono_de_marfim', 'Salomão no trono de marfim', 'glorious', 'leitura', '1 Rs 10:18-20', 'enciclopedia', false, 129, '{padrao}', 'masculino');

insert into public.skin_unlock_rules (skin_id, rule, label, sort_order) values
  ('lendario_ester', '{"books":["EST"]}', 'Concluir o livro de Ester', 124),
  ('glorioso_davi_diante_de_golias', '{"books":["JOS","JDG","RUT","1SA","2SA","1KI","2KI","1CH","2CH","EZR","NEH","EST"]}', 'Concluir o mundo Terra e Reinos (12 livros)', 125),
  ('glorioso_elias_no_carro_de_fogo', '{"books":["JOS","JDG","RUT","1SA","2SA","1KI","2KI","1CH","2CH","EZR","NEH","EST"]}', 'Concluir o mundo Terra e Reinos (12 livros)', 126),
  ('glorioso_ester_diante_do_rei', '{"books":["JOS","JDG","RUT","1SA","2SA","1KI","2KI","1CH","2CH","EZR","NEH","EST"]}', 'Concluir o mundo Terra e Reinos (12 livros)', 127),
  ('glorioso_josue_diante_das_muralhas', '{"books":["JOS","JDG","RUT","1SA","2SA","1KI","2KI","1CH","2CH","EZR","NEH","EST"]}', 'Concluir o mundo Terra e Reinos (12 livros)', 128),
  ('glorioso_salomao_no_trono_de_marfim', '{"books":["JOS","JDG","RUT","1SA","2SA","1KI","2KI","1CH","2CH","EZR","NEH","EST"]}', 'Concluir o mundo Terra e Reinos (12 livros)', 129);

-- concede na hora a quem já cumpriu as regras
do $$
declare r record;
begin
  for r in select distinct d.user_id from private.domain_events d where d.event_type in ('CHAPTER_COMPLETED', 'MILESTONE_REACHED') loop
    perform private.grant_reading_skins(r.user_id);
  end loop;
end $$;
