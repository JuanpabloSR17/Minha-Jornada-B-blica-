-- Lote P03 (Principais · Terra e Reinos): skins principais conquistadas lendo. Aditiva, só dados.
-- Gerada por scripts/skins-add-lot.mjs a partir de docs/skins/plano-lotes.json.
insert into public.skins (id, name, rarity, origin, scripture_ref, season, in_shop, sort_order, variants, character_sex) values
  ('lendario_josue', 'Vestes de Josué', 'legendary', 'leitura', 'Js 1:1-9', 'enciclopedia', false, 112, '{padrao}', 'masculino'),
  ('lendario_debora', 'Vestes de Débora', 'legendary', 'leitura', 'Jz 4:4-5', 'enciclopedia', false, 113, '{padrao}', 'feminino'),
  ('lendario_gideao', 'Vestes de Gideão', 'legendary', 'leitura', 'Jz 7:20', 'enciclopedia', false, 114, '{padrao}', 'masculino'),
  ('lendario_sansao', 'Vestes de Sansão', 'legendary', 'leitura', 'Jz 16:13, 17', 'enciclopedia', false, 115, '{padrao}', 'masculino'),
  ('lendario_rute', 'Vestes de Rute', 'legendary', 'leitura', 'Rt 2:2-3', 'enciclopedia', false, 116, '{padrao}', 'feminino'),
  ('lendario_samuel', 'Vestes de Samuel', 'legendary', 'leitura', '1 Sm 2:18-19', 'enciclopedia', false, 117, '{padrao}', 'masculino');

insert into public.skin_unlock_rules (skin_id, rule, label, sort_order) values
  ('lendario_josue', '{"books":["JOS"]}', 'Concluir o livro de Josué', 112),
  ('lendario_debora', '{"chapters":[["JDG",4],["JDG",5]]}', 'Ler a história de Débora (Juízes 4–5)', 113),
  ('lendario_gideao', '{"chapters":[["JDG",6],["JDG",7],["JDG",8]]}', 'Ler a história de Gideão (Juízes 6–8)', 114),
  ('lendario_sansao', '{"chapters":[["JDG",13],["JDG",14],["JDG",15],["JDG",16]]}', 'Ler a história de Sansão (Juízes 13–16)', 115),
  ('lendario_rute', '{"books":["RUT"]}', 'Concluir o livro de Rute', 116),
  ('lendario_samuel', '{"chapters":[["1SA",1],["1SA",2],["1SA",3],["1SA",4],["1SA",5],["1SA",6],["1SA",7],["1SA",8],["1SA",9],["1SA",10],["1SA",11],["1SA",12],["1SA",13],["1SA",14],["1SA",15],["1SA",16]]}', 'Ler a história de Samuel (1 Samuel 1–16)', 117);

-- concede na hora a quem já cumpriu as regras
do $$
declare r record;
begin
  for r in select distinct d.user_id from private.domain_events d where d.event_type in ('CHAPTER_COMPLETED', 'MILESTONE_REACHED') loop
    perform private.grant_reading_skins(r.user_id);
  end loop;
end $$;
