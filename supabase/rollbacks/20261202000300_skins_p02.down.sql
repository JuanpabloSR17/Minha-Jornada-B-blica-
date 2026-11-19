-- Reversão manual do lote P02: tira as regras e desativa as skins (as já conquistadas ficam registradas).
delete from public.skin_unlock_rules where skin_id in ('lendario_rebeca', 'lendario_jaco', 'lendario_jose', 'glorioso_jose_governador_do_egito', 'glorioso_abraao_sob_as_estrelas', 'glorioso_noe_e_o_arco_iris');
update public.skins set is_active = false where id in ('lendario_rebeca', 'lendario_jaco', 'lendario_jose', 'glorioso_jose_governador_do_egito', 'glorioso_abraao_sob_as_estrelas', 'glorioso_noe_e_o_arco_iris');
