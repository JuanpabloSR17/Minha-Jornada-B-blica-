-- Reversão manual do lote S05: tira as regras e desativa as skins (as já conquistadas ficam registradas).
delete from public.skin_unlock_rules where skin_id in ('epico_abigail', 'epico_nata', 'epico_rainha_de_saba', 'epico_naama', 'epico_ezequias', 'epico_josias');
update public.skins set is_active = false where id in ('epico_abigail', 'epico_nata', 'epico_rainha_de_saba', 'epico_naama', 'epico_ezequias', 'epico_josias');
