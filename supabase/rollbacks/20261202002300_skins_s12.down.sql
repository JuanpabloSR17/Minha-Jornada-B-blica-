-- Reversão manual do lote S12: tira as regras e desativa as skins (as já conquistadas ficam registradas).
delete from public.skin_unlock_rules where skin_id in ('epico_joel', 'epico_amos', 'epico_miqueias', 'epico_habacuque', 'epico_ageu', 'epico_zacarias');
update public.skins set is_active = false where id in ('epico_joel', 'epico_amos', 'epico_miqueias', 'epico_habacuque', 'epico_ageu', 'epico_zacarias');
