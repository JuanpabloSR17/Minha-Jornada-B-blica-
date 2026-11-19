-- Reversão manual do lote P08: tira as regras e desativa as skins (as já conquistadas ficam registradas).
delete from public.skin_unlock_rules where skin_id in ('lendario_pedro', 'lendario_joao_o_apostolo', 'lendario_tiago_filho_de_zebedeu', 'lendario_andre', 'lendario_mateus', 'lendario_maria_mae_de_jesus');
update public.skins set is_active = false where id in ('lendario_pedro', 'lendario_joao_o_apostolo', 'lendario_tiago_filho_de_zebedeu', 'lendario_andre', 'lendario_mateus', 'lendario_maria_mae_de_jesus');
