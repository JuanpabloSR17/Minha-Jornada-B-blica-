-- Reversão manual do lote S13: tira as regras e desativa as skins (as já conquistadas ficam registradas).
delete from public.skin_unlock_rules where skin_id in ('epico_baruque', 'raro_obadias', 'raro_naum', 'raro_sofonias', 'raro_malaquias', 'raro_ebede_meleque');
update public.skins set is_active = false where id in ('epico_baruque', 'raro_obadias', 'raro_naum', 'raro_sofonias', 'raro_malaquias', 'raro_ebede_meleque');
