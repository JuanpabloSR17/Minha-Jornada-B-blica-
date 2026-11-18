-- Lotes T1-C e T1-D: apresentação feminina pintada para Pastor (Pastora de ovelhas), Moisés com o
-- rosto resplandecente, Bezalel, Aoliabe e Tocador de shofar (Tocadora). Só dados.
update public.skins set variants = '{padrao,feminino}'
 where id in ('comum_pastor', 'glorioso_moises_rosto_resplandecente', 'epico_bezalel', 'raro_aoliabe', 'raro_shofar');
