-- Reversão manual do lote S19: tira as regras e desativa as skins (as já conquistadas ficam registradas).
delete from public.skin_unlock_rules where skin_id in ('raro_jairo', 'raro_a_mulher_que_tocou_o_manto', 'raro_o_semeador', 'raro_simao_de_cirene', 'raro_joana_e_susana', 'raro_salome');
update public.skins set is_active = false where id in ('raro_jairo', 'raro_a_mulher_que_tocou_o_manto', 'raro_o_semeador', 'raro_simao_de_cirene', 'raro_joana_e_susana', 'raro_salome');
