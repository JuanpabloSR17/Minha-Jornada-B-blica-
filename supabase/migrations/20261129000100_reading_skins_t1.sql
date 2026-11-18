-- Temporada 1: as Raras de missão e as Épicas e Raras da temporada também se conquistam lendo,
-- pelos capítulos da história de cada personagem (mesma mecânica de 20261126000100). Só dados.
-- Concede na hora a quem já leu esses capítulos.
insert into public.skin_unlock_rules (skin_id, rule, label, sort_order) values
  ('raro_parteiras', '{"chapters": [["EXO", 1]]}', 'Ler a história de Sifrá e Puá (Êxodo 1)', 10),
  ('raro_joquebede', '{"chapters": [["EXO", 2]]}', 'Ler a história de Joquebede (Êxodo 2)', 11),
  ('raro_filha_de_farao', '{"chapters": [["EXO", 2]]}', 'Ler a história da filha de Faraó (Êxodo 2)', 12),
  ('raro_hur', '{"chapters": [["EXO", 17], ["EXO", 24]]}', 'Ler a história de Hur (Êxodo 17 e 24)', 13),
  ('raro_shofar', '{"chapters": [["EXO", 19], ["EXO", 20]]}', 'Ler o Sinai ao som do shofar (Êxodo 19–20)', 14),
  ('raro_aoliabe', '{"chapters": [["EXO", 31], ["EXO", 35], ["EXO", 36]]}', 'Ler a história de Aoliabe (Êxodo 31, 35 e 36)', 15),
  ('epico_zipora', '{"chapters": [["EXO", 2], ["EXO", 4], ["EXO", 18]]}', 'Ler a história de Zípora (Êxodo 2, 4 e 18)', 16),
  ('epico_jetro', '{"chapters": [["EXO", 2], ["EXO", 3], ["EXO", 18]]}', 'Ler a história de Jetro (Êxodo 2, 3 e 18)', 17),
  ('epico_miria', '{"chapters": [["EXO", 2], ["EXO", 15], ["NUM", 12]]}', 'Ler a história de Miriã (Êxodo 2 e 15, Números 12)', 18),
  ('epico_bezalel', '{"chapters": [["EXO", 31], ["EXO", 35], ["EXO", 36], ["EXO", 37], ["EXO", 38]]}', 'Ler a história de Bezalel (Êxodo 31 e 35–38)', 19);

do $$
declare r record;
begin
  for r in select distinct d.user_id from private.domain_events d where d.event_type = 'CHAPTER_COMPLETED' loop
    perform private.grant_reading_skins(r.user_id);
  end loop;
end $$;
