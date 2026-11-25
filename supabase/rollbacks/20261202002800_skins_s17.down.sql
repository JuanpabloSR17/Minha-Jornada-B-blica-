-- Reversão manual do lote S17: tira as regras e desativa as skins (as já conquistadas ficam registradas).
delete from public.skin_unlock_rules where skin_id in ('epico_ana_a_profetisa', 'epico_bartimeu', 'raro_filipe', 'raro_natanael', 'raro_tome', 'raro_tiago_filho_de_alfeu');
update public.skins set is_active = false where id in ('epico_ana_a_profetisa', 'epico_bartimeu', 'raro_filipe', 'raro_natanael', 'raro_tome', 'raro_tiago_filho_de_alfeu');
