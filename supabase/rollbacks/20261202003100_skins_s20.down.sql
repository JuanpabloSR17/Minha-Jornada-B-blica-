-- Reversão manual do lote S20: tira as regras e desativa as skins (as já conquistadas ficam registradas).
delete from public.skin_unlock_rules where skin_id in ('raro_cleopas', 'raro_a_crianca_no_colo_de_jesus', 'epico_barnabe', 'epico_estevao', 'epico_tiago_irmao_do_senhor', 'epico_lucas');
update public.skins set is_active = false where id in ('raro_cleopas', 'raro_a_crianca_no_colo_de_jesus', 'epico_barnabe', 'epico_estevao', 'epico_tiago_irmao_do_senhor', 'epico_lucas');
