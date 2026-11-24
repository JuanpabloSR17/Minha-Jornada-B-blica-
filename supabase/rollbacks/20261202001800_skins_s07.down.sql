-- Reversão manual do lote S07: tira as regras e desativa as skins (as já conquistadas ficam registradas).
delete from public.skin_unlock_rules where skin_id in ('raro_mefibosete', 'raro_urias', 'raro_isai', 'raro_viuva_de_sarepta', 'raro_menina_serva_de_naama', 'raro_sunamita');
update public.skins set is_active = false where id in ('raro_mefibosete', 'raro_urias', 'raro_isai', 'raro_viuva_de_sarepta', 'raro_menina_serva_de_naama', 'raro_sunamita');
