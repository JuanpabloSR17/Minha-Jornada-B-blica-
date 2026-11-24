-- Reversão manual do lote S09: tira as regras e desativa as skins (as já conquistadas ficam registradas).
delete from public.skin_unlock_rules where skin_id in ('raro_asafe', 'raro_hema_e_jedutum', 'raro_obede_edom', 'raro_ciro', 'raro_josue_o_sumo_sacerdote', 'raro_elcana');
update public.skins set is_active = false where id in ('raro_asafe', 'raro_hema_e_jedutum', 'raro_obede_edom', 'raro_ciro', 'raro_josue_o_sumo_sacerdote', 'raro_elcana');
