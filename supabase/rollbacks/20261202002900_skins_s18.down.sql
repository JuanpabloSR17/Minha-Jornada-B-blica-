-- Reversão manual do lote S18: tira as regras e desativa as skins (as já conquistadas ficam registradas).
delete from public.skin_unlock_rules where skin_id in ('raro_tadeu', 'raro_simao_o_zelote', 'raro_os_pastores_de_belem', 'raro_o_menino_dos_paes_e_peixes', 'raro_a_viuva_pobre', 'raro_o_centuriao_de_cafarnaum');
update public.skins set is_active = false where id in ('raro_tadeu', 'raro_simao_o_zelote', 'raro_os_pastores_de_belem', 'raro_o_menino_dos_paes_e_peixes', 'raro_a_viuva_pobre', 'raro_o_centuriao_de_cafarnaum');
