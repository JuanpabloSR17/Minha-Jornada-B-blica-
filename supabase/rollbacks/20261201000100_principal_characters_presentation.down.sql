-- Reversão manual: tira a restrição e devolve a apresentação feminina às duas skins de Moisés
-- (as seleções que foram normalizadas para a padrão continuam na padrão).
alter table public.skins drop constraint if exists skins_principal_single_presentation;
update public.skins set variants = '{padrao,feminino}' where id in ('lendario_moises', 'glorioso_moises_rosto_resplandecente');
