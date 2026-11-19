-- Reversão manual do lote P04: tira as regras e desativa as skins (as já conquistadas ficam registradas).
delete from public.skin_unlock_rules where skin_id in ('lendario_davi', 'lendario_salomao', 'lendario_elias', 'lendario_eliseu', 'lendario_esdras', 'lendario_neemias');
update public.skins set is_active = false where id in ('lendario_davi', 'lendario_salomao', 'lendario_elias', 'lendario_eliseu', 'lendario_esdras', 'lendario_neemias');
