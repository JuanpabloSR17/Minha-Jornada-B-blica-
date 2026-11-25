-- Reversão manual do lote S15: tira as regras e desativa as skins (as já conquistadas ficam registradas).
delete from public.skin_unlock_rules where skin_id in ('epico_maria_de_betania', 'epico_lazaro', 'epico_nicodemos', 'epico_jose_de_arimateia', 'epico_zaqueu', 'epico_a_samaritana');
update public.skins set is_active = false where id in ('epico_maria_de_betania', 'epico_lazaro', 'epico_nicodemos', 'epico_jose_de_arimateia', 'epico_zaqueu', 'epico_a_samaritana');
