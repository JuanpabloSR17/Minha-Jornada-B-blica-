-- Reversão manual do lote S11: tira as regras e desativa as skins (as já conquistadas ficam registradas).
delete from public.skin_unlock_rules where skin_id in ('raro_lemuel', 'raro_filhos_de_cora', 'raro_eta_o_ezraita', 'raro_eliu', 'epico_sadraque_mesaque_e_abede_nego', 'epico_oseias');
update public.skins set is_active = false where id in ('raro_lemuel', 'raro_filhos_de_cora', 'raro_eta_o_ezraita', 'raro_eliu', 'epico_sadraque_mesaque_e_abede_nego', 'epico_oseias');
