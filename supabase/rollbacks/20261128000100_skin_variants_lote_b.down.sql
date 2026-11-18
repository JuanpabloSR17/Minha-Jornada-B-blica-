-- Reversão manual: as 5 skins voltam a ter só a apresentação padrão; quem vestia a feminina
-- passa a ver a padrão (skin_selection já cai na padrão quando a apresentação não existe).
update public.skins set variants = '{padrao}'
 where id in ('comum_carpinteiro', 'raro_bordador', 'raro_ourives', 'raro_gravador', 'raro_perfumista');
