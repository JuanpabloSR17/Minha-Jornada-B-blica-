-- Reversão manual do lote S16: tira as regras e desativa as skins (as já conquistadas ficam registradas).
delete from public.skin_unlock_rules where skin_id in ('epico_a_mulher_do_perfume', 'epico_o_bom_samaritano', 'epico_o_filho_prodigo', 'epico_zacarias_o_sacerdote', 'epico_isabel', 'epico_simeao');
update public.skins set is_active = false where id in ('epico_a_mulher_do_perfume', 'epico_o_bom_samaritano', 'epico_o_filho_prodigo', 'epico_zacarias_o_sacerdote', 'epico_isabel', 'epico_simeao');
