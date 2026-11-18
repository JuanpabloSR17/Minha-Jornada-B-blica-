-- Reversão manual da loja de skins. Apaga as skins compradas e as compras de skins (os Siclos
-- debitados ficam no extrato como estavam); o Mercado de peças não é tocado.
drop function if exists public.purchase_skin(uuid, text, int, date);
drop function if exists private.purchase_skin_at(uuid, text, int, date, timestamptz);
drop function if exists public.get_skin_market();
drop function if exists private.skin_market_state(uuid, timestamptz);
drop function if exists private.skin_offers(date);
drop function if exists private.owns_skin(uuid, text);
drop function if exists private.skin_price(text);
drop table if exists public.skin_purchases;
drop table if exists public.user_skins;
drop table if exists public.skins;
delete from public.economy_rules where key in ('skin_days_common', 'skin_days_rare', 'skin_days_epic', 'skin_gift_weekday', 'skin_shop_commons', 'skin_shop_rares');
delete from public.rarities where id = 'glorious';
