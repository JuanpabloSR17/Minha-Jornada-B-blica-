-- Reversão manual do lote P10: tira as regras e desativa as skins (as já conquistadas ficam registradas).
delete from public.skin_unlock_rules where skin_id in ('lendario_paulo', 'glorioso_paulo_no_caminho_de_damasco', 'glorioso_pedro_no_pentecostes', 'glorioso_estevao_com_rosto_de_anjo', 'glorioso_joao_em_patmos');
update public.skins set is_active = false where id in ('lendario_paulo', 'glorioso_paulo_no_caminho_de_damasco', 'glorioso_pedro_no_pentecostes', 'glorioso_estevao_com_rosto_de_anjo', 'glorioso_joao_em_patmos');
