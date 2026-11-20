-- Reversão manual do lote S03: tira as regras e desativa as skins (as já conquistadas ficam registradas).
delete from public.skin_unlock_rules where skin_id in ('epico_fineias', 'raro_labao', 'raro_ruben', 'raro_eliezer_servo_de_abraao', 'raro_filhas_de_zelofeade', 'raro_debora_ama_de_rebeca');
update public.skins set is_active = false where id in ('epico_fineias', 'raro_labao', 'raro_ruben', 'raro_eliezer_servo_de_abraao', 'raro_filhas_de_zelofeade', 'raro_debora_ama_de_rebeca');
