-- Reversão manual: as 5 skins voltam a ter só a apresentação padrão.
update public.skins set variants = '{padrao}'
 where id in ('comum_pastor', 'glorioso_moises_rosto_resplandecente', 'epico_bezalel', 'raro_aoliabe', 'raro_shofar');
