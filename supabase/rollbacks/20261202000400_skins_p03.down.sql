-- Reversão manual do lote P03: tira as regras e desativa as skins (as já conquistadas ficam registradas).
delete from public.skin_unlock_rules where skin_id in ('lendario_josue', 'lendario_debora', 'lendario_gideao', 'lendario_sansao', 'lendario_rute', 'lendario_samuel');
update public.skins set is_active = false where id in ('lendario_josue', 'lendario_debora', 'lendario_gideao', 'lendario_sansao', 'lendario_rute', 'lendario_samuel');
