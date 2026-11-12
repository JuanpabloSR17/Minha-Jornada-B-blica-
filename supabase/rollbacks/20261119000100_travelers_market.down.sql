-- Reversão MANUAL do Mercado dos Viajantes (não é aplicada automaticamente).
-- Não desfaz compras: itens comprados continuam com o jogador e os débitos continuam no
-- siclos_ledger (o saldo não muda). Remove a vitrine, a função de compra e o histórico de compras.
drop function if exists public.get_market();
drop function if exists public.purchase_market_item(uuid, text);
drop function if exists private.market_status(public.cosmetic_items);
drop table if exists public.market_purchases;
-- private.owns_canonical continua (usada pela escolha gratuita e pela elegibilidade dos Comuns).
