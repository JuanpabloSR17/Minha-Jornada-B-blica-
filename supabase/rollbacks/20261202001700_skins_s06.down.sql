-- Reversão manual do lote S06: tira as regras e desativa as skins (as já conquistadas ficam registradas).
delete from public.skin_unlock_rules where skin_id in ('epico_mardoqueu', 'epico_zorobabel', 'raro_baraque', 'raro_eli', 'raro_mical', 'raro_joabe');
update public.skins set is_active = false where id in ('epico_mardoqueu', 'epico_zorobabel', 'raro_baraque', 'raro_eli', 'raro_mical', 'raro_joabe');
