-- Reversão manual do lote S14: tira as regras e desativa as skins (as já conquistadas ficam registradas).
delete from public.skin_unlock_rules where skin_id in ('raro_os_recabitas', 'raro_dario_o_medo', 'raro_hananias_misael_e_azarias', 'raro_aspenaz', 'raro_gemarias', 'epico_marta');
update public.skins set is_active = false where id in ('raro_os_recabitas', 'raro_dario_o_medo', 'raro_hananias_misael_e_azarias', 'raro_aspenaz', 'raro_gemarias', 'epico_marta');
