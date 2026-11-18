-- Lote B da loja: apresentação feminina pintada para Carpinteiro, Bordador, Ourives, Gravador e
-- Perfumista (o Sacerdote segue só com a padrão, nas vestes de Êxodo 28:40-42). Só dados.
update public.skins set variants = '{padrao,feminino}'
 where id in ('comum_carpinteiro', 'raro_bordador', 'raro_ourives', 'raro_gravador', 'raro_perfumista');
