-- Lote P04 (Principais · Terra e Reinos): skins principais conquistadas lendo. Aditiva, só dados.
-- Gerada por scripts/skins-add-lot.mjs a partir de docs/skins/plano-lotes.json.
insert into public.skins (id, name, rarity, origin, scripture_ref, season, in_shop, sort_order, variants, character_sex) values
  ('lendario_davi', 'Vestes de Davi', 'legendary', 'leitura', '1 Sm 16:11-13', 'enciclopedia', false, 118, '{padrao}', 'masculino'),
  ('lendario_salomao', 'Vestes de Salomão', 'legendary', 'leitura', '1 Rs 3:9-12', 'enciclopedia', false, 119, '{padrao}', 'masculino'),
  ('lendario_elias', 'Vestes de Elias', 'legendary', 'leitura', '1 Rs 19:13; 2 Rs 1:8', 'enciclopedia', false, 120, '{padrao}', 'masculino'),
  ('lendario_eliseu', 'Vestes de Eliseu', 'legendary', 'leitura', '2 Rs 2:13-14', 'enciclopedia', false, 121, '{padrao}', 'masculino'),
  ('lendario_esdras', 'Vestes de Esdras', 'legendary', 'leitura', 'Ne 8:4-5', 'enciclopedia', false, 122, '{padrao}', 'masculino'),
  ('lendario_neemias', 'Vestes de Neemias', 'legendary', 'leitura', 'Ne 1:11; 4:17', 'enciclopedia', false, 123, '{padrao}', 'masculino');

insert into public.skin_unlock_rules (skin_id, rule, label, sort_order) values
  ('lendario_davi', '{"chapters":[["1SA",16],["1SA",17],["1SA",18],["1SA",19],["1SA",20],["1SA",21],["1SA",22],["1SA",23],["1SA",24],["1SA",25],["1SA",26],["1SA",27],["1SA",28],["1SA",29],["1SA",30],["1SA",31]]}', 'Ler a história de Davi (1 Samuel 16–31)', 118),
  ('lendario_salomao', '{"chapters":[["1KI",1],["1KI",2],["1KI",3],["1KI",4],["1KI",5],["1KI",6],["1KI",7],["1KI",8],["1KI",9],["1KI",10],["1KI",11]]}', 'Ler a história de Salomão (1 Reis 1–11)', 119),
  ('lendario_elias', '{"chapters":[["1KI",17],["1KI",18],["1KI",19],["1KI",20],["1KI",21],["1KI",22],["2KI",1],["2KI",2]]}', 'Ler a história de Elias (1 Reis 17 a 2 Reis 2)', 120),
  ('lendario_eliseu', '{"chapters":[["2KI",2],["2KI",3],["2KI",4],["2KI",5],["2KI",6],["2KI",7],["2KI",8],["2KI",9],["2KI",10],["2KI",11],["2KI",12],["2KI",13]]}', 'Ler a história de Eliseu (2 Reis 2–13)', 121),
  ('lendario_esdras', '{"books":["EZR"]}', 'Concluir o livro de Esdras', 122),
  ('lendario_neemias', '{"books":["NEH"]}', 'Concluir o livro de Neemias', 123);

-- concede na hora a quem já cumpriu as regras
do $$
declare r record;
begin
  for r in select distinct d.user_id from private.domain_events d where d.event_type in ('CHAPTER_COMPLETED', 'MILESTONE_REACHED') loop
    perform private.grant_reading_skins(r.user_id);
  end loop;
end $$;
