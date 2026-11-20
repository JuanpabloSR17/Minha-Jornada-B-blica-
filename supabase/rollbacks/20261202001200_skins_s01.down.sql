-- Reversão manual do lote S01: tira as regras e desativa as skins (as já conquistadas ficam registradas).
delete from public.skin_unlock_rules where skin_id in ('epico_raquel', 'epico_lia', 'epico_abel', 'epico_enoque', 'epico_melquisedeque', 'epico_agar');
update public.skins set is_active = false where id in ('epico_raquel', 'epico_lia', 'epico_abel', 'epico_enoque', 'epico_melquisedeque', 'epico_agar');
