-- Reversão manual do lote S10: tira as regras e desativa as skins (as já conquistadas ficam registradas).
delete from public.skin_unlock_rules where skin_id in ('raro_ido_o_vidente', 'raro_profeta_gade', 'epico_mulher_virtuosa', 'epico_o_pregador', 'epico_a_amada_de_canticos', 'raro_agur');
update public.skins set is_active = false where id in ('raro_ido_o_vidente', 'raro_profeta_gade', 'epico_mulher_virtuosa', 'epico_o_pregador', 'epico_a_amada_de_canticos', 'raro_agur');
