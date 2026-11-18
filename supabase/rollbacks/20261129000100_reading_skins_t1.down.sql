-- Reversão manual: tira as regras de leitura das Raras de missão e das Épicas e Raras da temporada.
-- As skins já concedidas continuam na conta.
delete from public.skin_unlock_rules where skin_id in ('raro_parteiras', 'raro_joquebede', 'raro_filha_de_farao', 'raro_hur', 'raro_shofar',
  'raro_aoliabe', 'epico_zipora', 'epico_jetro', 'epico_miria', 'epico_bezalel');
