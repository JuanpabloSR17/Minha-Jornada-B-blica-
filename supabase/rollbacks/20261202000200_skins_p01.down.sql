-- Reversão manual do lote P01: tira as regras e desativa as skins (as já conquistadas ficam registradas).
delete from public.skin_unlock_rules where skin_id in ('lendario_adao', 'lendario_eva', 'lendario_noe', 'lendario_abraao', 'lendario_sara', 'lendario_isaque');
update public.skins set is_active = false where id in ('lendario_adao', 'lendario_eva', 'lendario_noe', 'lendario_abraao', 'lendario_sara', 'lendario_isaque');
