-- A virada usa o relógio do servidor, independente do fuso da conta ou do aparelho.
begin;
select tests.mk_m('a5000000-0000-0000-0000-0000000000a5', 'vitrine_teste', 600);
select set_config('request.jwt.claim.sub', 'a5000000-0000-0000-0000-0000000000a5', true);
select tests.assert(
  private.market_rotation_day('2026-11-13 23:59:59+00') = date '2026-11-12'
  and private.market_rotation_day('2026-11-14 00:00:00+00') = date '2026-11-13',
  'vitrine troca às 21h em São Paulo, incluindo a virada UTC');
select tests.assert(
  (private.market_state(auth.uid(), '2026-11-13 23:59:59+00') #>> '{rotation,nextAt}')::timestamptz = timestamptz '2026-11-14 00:00:00+00',
  'vitrine informa o instante da próxima virada');
select tests.assert(
  (select count(*) = 11 and count(*) filter (where section = 'daily') = 7
   from private.market_offers(date '2026-11-13')),
  'vitrine tem sete ofertas rotativas e quatro permanentes');
select tests.assert(
  (select count(*) = 2 from private.market_offers(date '2026-11-13') o join public.cosmetic_items i on i.id = o.item_id
    where o.section = 'daily' and i.rarity = 'rare'),
  'vitrine tem dois Raros por dia');
select tests.assert(
  not exists (
    select 1 from generate_series(0, 30) d
    where not exists (
      select item_id from private.market_offers(date '2026-11-13' + d)
      except
      select item_id from private.market_offers(date '2026-11-13' + d + 1)
    )
  ),
  'sempre há renovação entre dias consecutivos');
select tests.assert(
  (select count(distinct o.item_id) = 25
   from generate_series(0, 30) d
   cross join lateral private.market_offers(date '2026-11-13' + d) o),
  'as 25 peças elegíveis aparecem ao longo da amostra de 31 dias');

select tests.assert_raises($$select private.purchase_market_item_at(
  gen_random_uuid(), 'common_tunica_de_linho_cru', 80, '2026-11-12', '2026-11-14 00:00:00+00')$$,
  'market_offer_expired', 'confirmação aberta antes da virada expira mesmo se o item continuar');
select tests.assert_raises($$select private.purchase_market_item_at(
  gen_random_uuid(), 'common_tunica_de_linho_cru', 81, '2026-11-13', '2026-11-14 00:00:00+00')$$,
  'market_price_changed', 'preço diferente do confirmado é recusado');
select tests.assert_raises($$select private.purchase_market_item_at(gen_random_uuid(), (
    select id from public.cosmetic_items i where i.shop_eligible and not i.is_starter
      and not exists (select 1 from private.market_offers('2026-11-13') o where o.item_id = i.id) limit 1
  ), null, '2026-11-13', '2026-11-14 00:00:00+00')$$,
  'market_offer_expired', 'RPC recusa peça elegível fora da vitrine atual');
select tests.assert(private.siclos_balance(auth.uid()) = 600, 'oferta expirada e preço diferente não geram débito');

set local role authenticated;
select tests.assert_raises($$select private.market_offers(current_date)$$, 'permission denied%', 'cliente não pode escolher outro dia de compra');
select tests.assert_raises($$select public.purchase_market_item(gen_random_uuid(), 'common_tunica_de_linho_cru', 80, current_date - 4)$$,
  'market_offer_expired', 'RPC público compara o dia enviado com o relógio do servidor');
select public.purchase_market_item(
  'a5000000-0000-4000-8000-0000000000a5', 'common_tunica_de_linho_cru', 80, (public.get_market() #>> '{rotation,day}')::date
);
reset role;
select tests.assert(
  (private.purchase_market_item_at('a5000000-0000-4000-8000-0000000000a5', 'common_tunica_de_linho_cru',
    80, '2026-11-13', '2026-11-15 00:00:00+00') ->> 'duplicate')::boolean
  and private.siclos_balance(auth.uid()) = 520,
  'reenvio já registrado volta mesmo depois da virada, sem um segundo débito');
rollback;
