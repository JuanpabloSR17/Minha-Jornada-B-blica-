-- Reversão manual do lote S08: tira as regras e desativa as skins (as já conquistadas ficam registradas).
delete from public.skin_unlock_rules where skin_id in ('raro_jeosafa', 'raro_joas_menino_rei', 'raro_hulda_profetisa', 'raro_zadoque', 'raro_benaia', 'raro_os_valentes_de_davi');
update public.skins set is_active = false where id in ('raro_jeosafa', 'raro_joas_menino_rei', 'raro_hulda_profetisa', 'raro_zadoque', 'raro_benaia', 'raro_os_valentes_de_davi');
