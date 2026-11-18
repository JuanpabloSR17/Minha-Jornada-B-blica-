-- Reversão manual: volta à restrição só dos principais e devolve a apresentação feminina a Bezalel
-- e Aoliabe (seleções normalizadas continuam na padrão).
alter table public.skins drop constraint if exists skins_character_single_presentation;
alter table public.skins drop column if exists character_sex;
update public.skins set variants = '{padrao,feminino}' where id in ('epico_bezalel', 'raro_aoliabe');
alter table public.skins add constraint skins_principal_single_presentation
  check (rarity not in ('legendary', 'glorious') or variants = '{padrao}');
