-- Mercado dos Viajantes: compra com Siclos (débito + posse na mesma transação).

create function tests.mk_m(p_user uuid, p_name text, p_siclos int) returns void language plpgsql as $$
begin
  insert into auth.users (id, email) values (p_user, p_name || '@teste.local');
  insert into public.profiles (id, username, display_name) values (p_user, p_name, initcap(replace(p_name, '_', ' ')));
  if p_siclos > 0 then
    -- crédito de teste (no app os Siclos vêm só da meta diária)
    insert into public.siclos_ledger (user_id, event_type, source_event_id, amount) values (p_user, 'TEST_GRANT', 'fixture', p_siclos);
  end if;
end $$;
create function tests.buy(p_user uuid, p_label text, p_item text) returns jsonb language plpgsql as $$
begin
  perform set_config('request.jwt.claim.sub', p_user::text, true);
  return public.purchase_market_item(md5('buy' || p_user::text || p_label)::uuid, p_item);
end $$;
create function tests.bal(p_user uuid) returns int language sql as $$ select private.siclos_balance(p_user) $$;
create function tests.has(p_user uuid, p_item text) returns int language sql as $$
  select count(*)::int from public.user_items where user_id = p_user and item_id = p_item
$$;
create function tests.market(p_user uuid) returns jsonb language plpgsql as $$
begin
  perform set_config('request.jwt.claim.sub', p_user::text, true);
  return public.get_market();
end $$;

-- ---------------------------------------------------------------- vitrine
select tests.mk_m('a1000000-0000-0000-0000-0000000000a1', 'compra_um', 100);
select tests.assert(
  (select jsonb_array_length(m -> 'items') = 25 and (m ->> 'siclosBalance')::int = 100 from tests.market('a1000000-0000-0000-0000-0000000000a1') m),
  'vitrine: 25 itens da loja do catálogo vigente e o saldo');
select tests.assert(
  not exists (select 1 from jsonb_array_elements(tests.market('a1000000-0000-0000-0000-0000000000a1') -> 'items') x
    join public.cosmetic_items i on i.id = x ->> 'itemId'
    where not i.shop_eligible or i.rarity in ('holy', 'legendary', 'epic') or i.is_starter or (x ->> 'price')::int <> i.shop_price_suggested),
  'vitrine só tem itens marcados para a loja, com o preço do catálogo (sem Santos, Lendários, Épicos ou peças iniciais)');
select tests.assert(
  (select bool_and(x ->> 'status' = 'available') from jsonb_array_elements(tests.market('a1000000-0000-0000-0000-0000000000a1') -> 'items') x),
  'todos os itens da loja têm preço definido');

-- ---------------------------------------------------------------- compra bem-sucedida e reenvio
create table tests.p1 as select tests.buy('a1000000-0000-0000-0000-0000000000a1', 'linho', 'common_tunica_de_linho_cru') r;
select tests.assert(
  (select not (r ->> 'duplicate')::boolean and r ->> 'itemId' = 'common_tunica_de_linho_cru' and (r ->> 'price')::int = 80 and (r ->> 'siclosBalance')::int = 20 from tests.p1),
  'compra concede o item e debita 80 Siclos');
select tests.assert(tests.has('a1000000-0000-0000-0000-0000000000a1', 'common_tunica_de_linho_cru') = 1 and tests.bal('a1000000-0000-0000-0000-0000000000a1') = 20, 'posse e saldo conferem');
select tests.assert(
  (select (r ->> 'duplicate')::boolean and (r ->> 'siclosBalance')::int = 20 and r ->> 'purchaseId' = (select r ->> 'purchaseId' from tests.p1)
   from tests.buy('a1000000-0000-0000-0000-0000000000a1', 'linho', 'common_tunica_de_linho_cru') r),
  'reenvio após perder a resposta devolve o resultado registrado, sem novo débito');
select tests.assert((select count(*) from public.siclos_ledger where user_id = 'a1000000-0000-0000-0000-0000000000a1' and event_type = 'MARKET_PURCHASE') = 1, 'um único débito');
select tests.assert_raises($$select tests.buy('a1000000-0000-0000-0000-0000000000a1', 'linho', 'common_vara_de_pastor')$$, 'invalid_purchase', 'mesmo ID de compra com outro item é recusado');
select tests.assert_raises($$select tests.buy('a1000000-0000-0000-0000-0000000000a1', 'linho-de-novo', 'common_tunica_de_linho_cru')$$, 'item_already_owned', 'nova compra de item já possuído é recusada');
select tests.assert(
  (select (x ->> 'owned')::boolean from jsonb_array_elements(tests.market('a1000000-0000-0000-0000-0000000000a1') -> 'items') x where x ->> 'itemId' = 'common_tunica_de_linho_cru'),
  'vitrine mostra o item como obtido');

-- ---------------------------------------------------------------- saldo insuficiente
select tests.assert_raises($$select tests.buy('a1000000-0000-0000-0000-0000000000a1', 'vara', 'common_vara_de_pastor')$$, 'insufficient_siclos', 'saldo insuficiente (20 < 120) é recusado');
select tests.assert(tests.bal('a1000000-0000-0000-0000-0000000000a1') = 20 and tests.has('a1000000-0000-0000-0000-0000000000a1', 'common_vara_de_pastor') = 0, 'falha preserva saldo e posse');

-- ---------------------------------------------------------------- fora da loja
select tests.mk_m('a2000000-0000-0000-0000-0000000000a2', 'compra_dois', 5000);
select tests.assert_raises($$select tests.buy('a2000000-0000-0000-0000-0000000000a2', 'x1', 'book_gen')$$, 'item_not_for_sale', 'Lendário não está à venda');
select tests.assert_raises($$select tests.buy('a2000000-0000-0000-0000-0000000000a2', 'x2', 'holy_mana_do_deserto')$$, 'item_not_for_sale', 'item Santo não está à venda');
select tests.assert_raises($$select tests.buy('a2000000-0000-0000-0000-0000000000a2', 'x3', 'sandals-leather')$$, 'item_not_for_sale', 'peça inicial gratuita não está à venda');
select tests.assert_raises($$select tests.buy('a2000000-0000-0000-0000-0000000000a2', 'x4', 'tunic-joseph')$$, 'item_not_for_sale', 'épico de leitura não está à venda');
select tests.assert_raises($$select tests.buy('a2000000-0000-0000-0000-0000000000a2', 'x5', 'nao-existe')$$, 'item_not_for_sale', 'item inexistente não está à venda');
select tests.assert_raises($$select tests.buy('a2000000-0000-0000-0000-0000000000a2', 'x6', 'purse-coins')$$, 'item_not_for_sale', 'item desativado não está à venda');
select tests.assert(tests.bal('a2000000-0000-0000-0000-0000000000a2') = 5000, 'tentativas recusadas não debitam');
-- item elegível sem preço: listado, compra indisponível
update public.cosmetic_items set shop_price_suggested = null where id = 'common_pote_de_barro';
select tests.assert(
  (select x ->> 'status' = 'price_pending' from jsonb_array_elements(tests.market('a2000000-0000-0000-0000-0000000000a2') -> 'items') x where x ->> 'itemId' = 'common_pote_de_barro'),
  'item elegível sem preço aparece como preço pendente');
select tests.assert_raises($$select tests.buy('a2000000-0000-0000-0000-0000000000a2', 'x7', 'common_pote_de_barro')$$, 'price_not_defined', 'compra indisponível até o preço ser definido');
update public.cosmetic_items set shop_price_suggested = 120 where id = 'common_pote_de_barro';
select tests.assert_raises($$update public.cosmetic_items set shop_eligible = true where id = 'holy_mana_do_deserto'$$, '%cosmetic_items_holy_not_for_sale%', 'banco impede colocar Santo à venda');

-- ---------------------------------------------------------------- identidade canônica e posse por ID legado
insert into public.user_items (user_id, item_id, source_event_id) values ('a2000000-0000-0000-0000-0000000000a2', 'net-fishing', 'legacy:test');
select tests.assert(
  (select (x ->> 'owned')::boolean from jsonb_array_elements(tests.market('a2000000-0000-0000-0000-0000000000a2') -> 'items') x where x ->> 'itemId' = 'common_rede_de_pesca'),
  'posse pelo ID legado (net-fishing) aparece como posse da Rede de Pesca');
select tests.assert_raises($$select tests.buy('a2000000-0000-0000-0000-0000000000a2', 'rede', 'common_rede_de_pesca')$$, 'item_already_owned', 'não compra de novo item possuído por ID legado');
select tests.assert_raises($$select tests.buy('a2000000-0000-0000-0000-0000000000a2', 'rede-alias', 'net-fishing')$$, 'item_already_owned', 'comprar pelo ID legado resolve para o item canônico');
select tests.assert(not ('common_rede_de_pesca' in (select private.eligible_commons('a2000000-0000-0000-0000-0000000000a2'))), 'escolha gratuita também reconhece a posse por ID legado');
select tests.mk_m('a3000000-0000-0000-0000-0000000000a3', 'compra_alias', 200);
select tests.assert(
  (select r ->> 'itemId' = 'common_rede_de_pesca' and r ->> 'requestedItemId' = 'net-fishing' from tests.buy('a3000000-0000-0000-0000-0000000000a3', 'rede', 'net-fishing') r),
  'compra pelo ID antigo concede o item canônico');
select tests.assert(tests.has('a3000000-0000-0000-0000-0000000000a3', 'common_rede_de_pesca') = 1 and tests.has('a3000000-0000-0000-0000-0000000000a3', 'net-fishing') = 0, 'posse gravada no ID canônico');

-- ---------------------------------------------------------------- compra × escolha gratuita
select tests.mk_m('a4000000-0000-0000-0000-0000000000a4', 'compra_meta', 1000);
select tests.pref('a4000000-0000-0000-0000-0000000000a4', 'daily_goal', 1, '2026-11-19 12:00-03');
select tests.gfin('a4000000-0000-0000-0000-0000000000a4', 'm1', 'MAT', 1, '2026-11-20 09:00-03');
create table tests.mopt as select options o from public.daily_goals where user_id = 'a4000000-0000-0000-0000-0000000000a4';
-- compra primeiro → a escolha gratuita do mesmo item é recusada
select tests.buy('a4000000-0000-0000-0000-0000000000a4', 'opt1', (select o[1] from tests.mopt));
select tests.assert_raises($$select tests.claim('a4000000-0000-0000-0000-0000000000a4', '2026-11-20', (select o[1] from tests.mopt))$$, 'item_already_owned', 'item comprado não pode ser resgatado de graça');
select tests.assert(
  (select not (s -> 'available' ? (select o[1] from tests.mopt)) and (s ->> 'choicePending')::boolean
   from private.daily_goal_state('a4000000-0000-0000-0000-0000000000a4', '2026-11-20') s),
  'a escolha pendente deixa de oferecer o item comprado e continua com as outras opções');
-- escolha gratuita primeiro → a compra do mesmo item é recusada, sem débito
select tests.claim('a4000000-0000-0000-0000-0000000000a4', '2026-11-20', (select o[2] from tests.mopt));
select tests.assert(
  (select (x ->> 'owned')::boolean from jsonb_array_elements(tests.market('a4000000-0000-0000-0000-0000000000a4') -> 'items') x where x ->> 'itemId' = (select o[2] from tests.mopt)),
  'item resgatado de graça aparece como obtido na vitrine');
create table tests.bal4 as select tests.bal('a4000000-0000-0000-0000-0000000000a4') b;
select tests.assert_raises($$select tests.buy('a4000000-0000-0000-0000-0000000000a4', 'opt2', (select o[2] from tests.mopt))$$, 'item_already_owned', 'compra de item já resgatado é recusada');
select tests.assert(tests.bal('a4000000-0000-0000-0000-0000000000a4') = (select b from tests.bal4) and tests.has('a4000000-0000-0000-0000-0000000000a4', (select o[2] from tests.mopt)) = 1,
  'sem débito e sem posse duplicada');

-- ---------------------------------------------------------------- acesso
begin;
select set_config('request.jwt.claim.sub', 'a2000000-0000-0000-0000-0000000000a2', true);
set local role authenticated;
select tests.assert((select count(*) from public.market_purchases) = 0, 'jogador não vê compras de outra conta');
select tests.assert_raises($$insert into public.market_purchases (id, user_id, item_id, requested_item_id, price, result) values (gen_random_uuid(), auth.uid(), 'common_vara_de_pastor', 'x', 1, '{}')$$, 'permission denied%', 'cliente não registra compra direto');
select tests.assert_raises($$update public.cosmetic_items set shop_price_suggested = 1 where id = 'common_vara_de_pastor'$$, 'permission denied%', 'cliente não altera preços');
select tests.assert_raises($$insert into public.siclos_ledger (user_id, event_type, source_event_id, amount) values (auth.uid(), 'HACK', 'x', 9999)$$, 'permission denied%', 'cliente não credita Siclos');
commit;
begin;
set local role anon;
select tests.assert_raises($$select public.purchase_market_item(gen_random_uuid(), 'common_vara_de_pastor')$$, 'permission denied%', 'visitante não compra');
commit;
select tests.assert(not exists (select 1 from public.siclos_ledger group by user_id having sum(amount) < 0), 'nenhum saldo negativo');
