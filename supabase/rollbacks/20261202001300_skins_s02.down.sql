-- Reversão manual do lote S02: tira as regras e desativa as skins (as já conquistadas ficam registradas).
delete from public.skin_unlock_rules where skin_id in ('epico_ismael', 'epico_esau', 'epico_juda', 'epico_benjamim', 'epico_calebe', 'epico_eleazar');
update public.skins set is_active = false where id in ('epico_ismael', 'epico_esau', 'epico_juda', 'epico_benjamim', 'epico_calebe', 'epico_eleazar');
