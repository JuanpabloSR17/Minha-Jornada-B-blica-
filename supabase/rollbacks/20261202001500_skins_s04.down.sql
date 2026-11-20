-- Reversão manual do lote S04: tira as regras e desativa as skins (as já conquistadas ficam registradas).
delete from public.skin_unlock_rules where skin_id in ('raro_matusalem', 'epico_noemi', 'epico_boaz', 'epico_raabe', 'epico_ana', 'epico_jonatas');
update public.skins set is_active = false where id in ('raro_matusalem', 'epico_noemi', 'epico_boaz', 'epico_raabe', 'epico_ana', 'epico_jonatas');
