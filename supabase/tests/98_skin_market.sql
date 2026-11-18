-- Loja de skins: preço justo pela meta diária, vitrine do dia, Épica da semana grátis no dia de
-- presente, compra idempotente e sem cobrança de skin já possuída.
create function tests.skin_day(p_skin text) returns date language sql as $$
  select min(d)::date from generate_series(date '2026-11-02', date '2027-01-31', interval '1 day') d
  where exists (select 1 from private.skin_offers(d::date) o where o.skin_id = p_skin)
$$;
create function tests.gift_day() returns date language sql as $$
  select min(d)::date from generate_series(date '2026-11-02', date '2026-11-15', interval '1 day') d
  where extract(dow from d)::int = private.economy('skin_gift_weekday')
$$;
-- instante em que a vitrine do dia está valendo (ela vai das 21h desse dia às 21h do seguinte, em Brasília)
create function tests.at(p_day date) returns timestamptz language sql as $$ select (p_day + time '22:00') at time zone 'America/Sao_Paulo' $$;

begin;
select tests.mk_m('b8000000-0000-0000-0000-0000000000b8', 'loja_skins', 2000);
select set_config('request.jwt.claim.sub', 'b8000000-0000-0000-0000-0000000000b8', true);

select tests.assert(
  private.skin_price('common') = 160 and private.skin_price('rare') = 400 and private.skin_price('epic') = 1000,
  'preço justo: Comum 4, Rara 10 e Épica 25 dias de meta (40 Siclos por dia)');
update public.economy_rules set value = 50 where key = 'siclos_daily_goal';
select tests.assert(private.skin_price('rare') = 500, 'se a recompensa da meta muda, o preço acompanha');
update public.economy_rules set value = 40 where key = 'siclos_daily_goal';
select tests.assert(private.skin_price('legendary') is null and private.skin_price('glorious') is null,
  'Lendárias e Gloriosas não têm preço');

select tests.assert(
  not exists (
    select 1 from generate_series(date '2026-11-02', date '2026-11-30', interval '1 day') d
    where (select count(*) filter (where section = 'common') <> 3 or count(*) filter (where section = 'rare') <> 3
             or count(*) filter (where section = 'epic') <> 1 from private.skin_offers(d::date))
  ),
  'toda vitrine tem 3 Comuns, 3 Raras e 1 Épica');
select tests.assert(
  not exists (
    select 1 from generate_series(date '2026-11-02', date '2027-01-31', interval '1 day') d
    cross join lateral private.skin_offers(d::date) o join public.skins s on s.id = o.skin_id
    where not s.in_shop or s.rarity in ('legendary', 'glorious')
  ),
  'só skins da loja aparecem; nunca Lendárias, Gloriosas, de leitura, missão ou temporada');
select tests.assert(
  (select count(distinct o.skin_id) = 9 from generate_series(date '2026-11-02', date '2026-12-31', interval '1 day') d
   cross join lateral private.skin_offers(d::date) o where o.section <> 'epic'),
  'as 9 Comuns e Raras da loja passam pela vitrine ao longo de dois meses');
select tests.assert(
  (select bool_and(o.gift = (extract(dow from d)::int = private.economy('skin_gift_weekday')))
     and bool_and(o.price = case when o.gift then 0 else 1000 end)
   from generate_series(date '2026-11-02', date '2026-11-29', interval '1 day') d
   cross join lateral private.skin_offers(d::date) o where o.section = 'epic'),
  'a Épica da semana sai de graça só no dia de presente; nos outros dias custa 1.000');

-- compra normal, reenvio e skin já possuída
select private.purchase_skin_at('b8000000-0000-4000-8000-000000000001', 'raro_levita', 400,
  tests.skin_day('raro_levita'), tests.at(tests.skin_day('raro_levita')));
select tests.assert(private.siclos_balance(auth.uid()) = 1600 and private.owns_skin(auth.uid(), 'raro_levita'),
  'compra de Rara debita 400 e entrega a skin (com os 3 estilos)');
select tests.assert(
  (private.purchase_skin_at('b8000000-0000-4000-8000-000000000001', 'raro_levita', 400,
     tests.skin_day('raro_levita'), tests.at(tests.skin_day('raro_levita') + 3)) ->> 'duplicate')::boolean
  and private.siclos_balance(auth.uid()) = 1600,
  'reenvio da mesma compra devolve o resultado sem segundo débito, mesmo depois da virada');
select tests.assert_raises($$select private.purchase_skin_at(gen_random_uuid(), 'raro_levita', 400,
  tests.skin_day('raro_levita'), tests.at(tests.skin_day('raro_levita')))$$, 'skin_already_owned', 'skin já possuída não é cobrada de novo');

-- recusas sem débito
select tests.assert_raises($$select private.purchase_skin_at(gen_random_uuid(), 'lendario_moises', null, null, now())$$,
  'skin_not_for_sale', 'Lendária não se compra');
select tests.assert_raises($$select private.purchase_skin_at(gen_random_uuid(), 'comum_pastor', null, null, now())$$,
  'skin_not_for_sale', 'skin inicial não se compra (todos já têm)');
select tests.assert(private.owns_skin(auth.uid(), 'comum_pastor'), 'skin inicial já é de todos');
select tests.assert_raises($$select private.purchase_skin_at(gen_random_uuid(), 'raro_sacerdote', 401,
  tests.skin_day('raro_sacerdote'), tests.at(tests.skin_day('raro_sacerdote')))$$, 'market_price_changed', 'preço diferente do confirmado é recusado');
select tests.assert_raises($$select private.purchase_skin_at(gen_random_uuid(), 'raro_sacerdote', 400,
  tests.skin_day('raro_sacerdote') - 1, tests.at(tests.skin_day('raro_sacerdote')))$$, 'market_offer_expired', 'confirmação de outro dia expira');
select tests.assert(private.siclos_balance(auth.uid()) = 1600, 'recusas não debitam nada');

-- Épica: grátis no dia de presente, sem lançamento no extrato
select private.purchase_skin_at('b8000000-0000-4000-8000-000000000002', 'epico_sumo_sacerdote', 0,
  tests.gift_day(), tests.at(tests.gift_day()));
select tests.assert(
  private.siclos_balance(auth.uid()) = 1600 and private.owns_skin(auth.uid(), 'epico_sumo_sacerdote')
  and (select gift from public.skin_purchases where id = 'b8000000-0000-4000-8000-000000000002')
  and not exists (select 1 from public.siclos_ledger where source_event_id = 'skin:b8000000-0000-4000-8000-000000000002'),
  'Épica resgatada de graça no dia de presente, sem débito');
rollback;

begin;
select tests.mk_m('b8100000-0000-0000-0000-0000000000b8', 'loja_pouco_saldo', 150);
select set_config('request.jwt.claim.sub', 'b8100000-0000-0000-0000-0000000000b8', true);
select tests.assert_raises($$select private.purchase_skin_at(gen_random_uuid(), 'comum_tecela', 160,
  tests.skin_day('comum_tecela'), tests.at(tests.skin_day('comum_tecela')))$$, 'insufficient_siclos', 'saldo insuficiente recusa sem debitar');
select tests.assert(private.siclos_balance(auth.uid()) = 150, 'saldo continua 150');
set local role authenticated;
select tests.assert(jsonb_array_length(public.get_skin_market() -> 'offers') = 7, 'cliente vê a vitrine de hoje (7 skins)');
select tests.assert((public.get_skin_market() #>> '{prices,rare}')::int = 400, 'cliente vê a tabela de preços');
select tests.assert_raises($$select private.skin_offers(current_date)$$, 'permission denied%', 'cliente não escolhe o dia da vitrine');
select tests.assert_raises($$insert into public.user_skins (user_id, skin_id, source_event_id) values (auth.uid(), 'lendario_moises', 'x')$$,
  'permission denied%', 'cliente não se dá skins direto na tabela');
select tests.assert_raises($$update public.skins set in_shop = true where id = 'lendario_moises'$$, 'permission denied%', 'cliente não mexe no catálogo');
select tests.assert_raises($$select public.purchase_skin(gen_random_uuid(), 'raro_sacerdote', 400, current_date - 9)$$,
  'market_offer_expired', 'RPC público confere o dia com o relógio do servidor');
reset role;
select tests.assert_raises($$update public.skins set in_shop = true where id = 'lendario_moises'$$, '%check%', 'nem o banco aceita Lendária na loja');
set local role anon;
select tests.assert_raises($$select public.get_skin_market()$$, 'permission denied%', 'visitante sem login não vê a loja');
rollback;
