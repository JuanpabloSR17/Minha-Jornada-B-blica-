-- Lote S16 (Personagens · Evangelhos): skins principais conquistadas lendo. Aditiva, só dados.
-- Gerada por scripts/skins-add-lot.mjs a partir de docs/skins/plano-lotes.json.
insert into public.skins (id, name, rarity, origin, scripture_ref, season, in_shop, sort_order, variants, character_sex) values
  ('epico_a_mulher_do_perfume', 'A mulher do perfume', 'epic', 'leitura', 'Mc 14:3', 'enciclopedia', false, 249, '{padrao}', 'feminino'),
  ('epico_o_bom_samaritano', 'O bom samaritano (parábola)', 'epic', 'leitura', 'Lc 10:33-35', 'enciclopedia', false, 250, '{padrao}', 'masculino'),
  ('epico_o_filho_prodigo', 'O filho pródigo (parábola)', 'epic', 'leitura', 'Lc 15:22', 'enciclopedia', false, 251, '{padrao}', 'masculino'),
  ('epico_zacarias_o_sacerdote', 'Traje de Zacarias, o sacerdote', 'epic', 'leitura', 'Lc 1:8-9', 'enciclopedia', false, 252, '{padrao}', 'masculino'),
  ('epico_isabel', 'Traje de Isabel', 'epic', 'leitura', 'Lc 1:41-42', 'enciclopedia', false, 253, '{padrao}', 'feminino'),
  ('epico_simeao', 'Traje de Simeão', 'epic', 'leitura', 'Lc 2:28', 'enciclopedia', false, 254, '{padrao}', 'masculino');

insert into public.skin_unlock_rules (skin_id, rule, label, sort_order) values
  ('epico_a_mulher_do_perfume', '{"chapters":[["MRK",14]]}', 'Ler a história da mulher do perfume (Mc 14:3)', 249),
  ('epico_o_bom_samaritano', '{"chapters":[["LUK",10]]}', 'Ler a história do bom samaritano (Lc 10:33-35)', 250),
  ('epico_o_filho_prodigo', '{"chapters":[["LUK",15]]}', 'Ler a história do filho pródigo (Lc 15:22)', 251),
  ('epico_zacarias_o_sacerdote', '{"chapters":[["LUK",1]]}', 'Ler a história de Zacarias, o sacerdote (Lc 1:8-9)', 252),
  ('epico_isabel', '{"chapters":[["LUK",1]]}', 'Ler a história de Isabel (Lc 1:41-42)', 253),
  ('epico_simeao', '{"chapters":[["LUK",2]]}', 'Ler a história de Simeão (Lc 2:28)', 254);

-- concede na hora a quem já cumpriu as regras
do $$
declare r record;
begin
  for r in select distinct d.user_id from private.domain_events d where d.event_type in ('CHAPTER_COMPLETED', 'MILESTONE_REACHED') loop
    perform private.grant_reading_skins(r.user_id);
  end loop;
end $$;
