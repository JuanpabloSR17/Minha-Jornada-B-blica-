-- Reversão manual do lote P06: tira as regras e desativa as skins (as já conquistadas ficam registradas).
delete from public.skin_unlock_rules where skin_id in ('lendario_jo', 'glorioso_jo_restaurado', 'lendario_isaias', 'lendario_jeremias', 'lendario_ezequiel', 'lendario_daniel');
update public.skins set is_active = false where id in ('lendario_jo', 'glorioso_jo_restaurado', 'lendario_isaias', 'lendario_jeremias', 'lendario_ezequiel', 'lendario_daniel');
